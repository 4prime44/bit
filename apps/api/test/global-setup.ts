import {execSync} from 'node:child_process';
import {rmSync} from 'node:fs';

//tworzenie bazy
export default function setup(){
    rmSync('prisma/test.db',{force:true}); //usuwam jakas stara baze jakbybyla
    execSync('npx prisma db push --skip-generate',{
        env:{...process.env,DATABASE_URL:'file:./test.db'},
        stdio:'inherit',
    });
}
