import { Link } from 'react-router';
export function NotFoundPage({ message = 'Nie ma takiej strony.' }: { message?: string }) {
return (
<div className="card stack">
<h1>Upsssssssssss</h1>
<p>{message}</p>
<Link className="btn btn-primary" to="/">Utwórz nowe spotkanie</Link>
</div>
);
}