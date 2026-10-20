import {beforeEach,describe,expect,it} from 'vitest';
import request from 'supertest';
import {createApp} from '../src/app';
import {prisma} from '../src/db';

const app=createApp();
const validEvent={
	title:'Spotkanie BIT',
	dates:['2026-10-20','2026-10-21'],
	startMinute:540,
	endMinute:720,
	slotMinutes:30,
};

//krotkie pomocnicze funkcje
async function createEvent(){
	const res=await request(app).post('/api/events').send(validEvent);
	return res.body as {event:{id:string};adminToken:string};
}
async function join(eventId:string,body:object){
	return request(app).post(`/api/events/${eventId}/participants`).send(body);
}

beforeEach(async()=>{
	await prisma.event.deleteMany();
});

describe('POST /api/events',()=>{
	it('tworzy wydarzenie i zwraca token admina',async()=>{
		const res=await request(app).post('/api/events').send(validEvent);
		expect(res.status).toBe(201);
		expect(res.body.event.title).toBe('Spotkanie BIT');
		expect(res.body.adminToken).toEqual(expect.any(String));
		expect(res.body.event).not.toHaveProperty('adminTokenHash');
	});
	it('odrzuca koniec przed początkiem',async()=>{
		const res=await request(app).post('/api/events').send({...validEvent,endMinute:500});
		expect(res.status).toBe(400);
	});
});

describe('dostępność',()=>{
	it('uczestnik zapisuje i nadpisuje swoje sloty',async()=>{
		const {event}=await createEvent();
		const {body}=await join(event.id,{name:'Ola'});
		const auth={Authorization:`Bearer ${body.token}`};
		const url=`/api/events/${event.id}/participants/me/availability`;
		await request(app).put(url).set(auth).send({slots:['2026-10-20T09:00','2026-10-20T09:30']});
		const res=await request(app).put(url).set(auth).send({slots:['2026-10-21T11:30']});
		expect(res.status).toBe(200);
		expect(res.body.slots).toEqual(['2026-10-21T11:30']);
	});
	it('bez tokenu zwraca 401',async()=>{
		const {event}=await createEvent();
		const res=await request(app)
			.put(`/api/events/${event.id}/participants/me/availability`)
			.send({slots:[]});
		expect(res.status).toBe(401);
	});
	it('odrzuca slot spoza siatki',async()=>{
		const {event}=await createEvent();
		const {body}=await join(event.id,{name:'Ola'});
		const res=await request(app)
			.put(`/api/events/${event.id}/participants/me/availability`)
			.set({Authorization:`Bearer ${body.token}`})
			.send({slots:['2026-10-20T12:00']});
		expect(res.status).toBe(400);
	});
});

describe('logowanie imieniem i PIN-em',()=>{
	it('zajęte imię bez PIN-u → 409',async()=>{
		const {event}=await createEvent();
		await join(event.id,{name:'Kuba'});
		const res=await join(event.id,{name:'Kuba'});
		expect(res.status).toBe(409);
	});
	it('poprawny PIN pozwala wrócić, a zły nie',async()=>{
		const {event}=await createEvent();
		await join(event.id,{name:'Ania',pin:'1234'});
		expect((await join(event.id,{name:'Ania',pin:'0000'})).status).toBe(401);
		expect((await join(event.id,{name:'Ania',pin:'1234'})).status).toBe(200);
	});
});

describe('usuwanie uczestnika',()=>{
	it('usunięty uczestnik znika z wydarzenia',async()=>{
		const {event}=await createEvent();
		const {body}=await join(event.id,{name:'Ola'});
		await request(app)
			.delete(`/api/events/${event.id}/participants/me`)
			.set({Authorization:`Bearer ${body.token}`})
			.expect(204);
		const res=await request(app).get(`/api/events/${event.id}`);
		expect(res.body.participants).toHaveLength(0);
	});
});
