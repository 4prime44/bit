import { Link, Route, Routes } from 'react-router';
import { CreateEventPage } from './pages/CreateEventPage';
import { EventPage } from './pages/EventPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App(){
  return (
    <>
      <header className='topbar'>
        <Link to="/" className="brand">TerminBit</Link>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<CreateEventPage/>} />
          <Route path="/e/:eventId" element={<EventPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  )
}