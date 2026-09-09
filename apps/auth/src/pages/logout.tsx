import { AuthDocument } from "./auth-document";

export function LogoutPage() {
	return (
		<AuthDocument title="Signed out — Five Nines">
			<h1>Signed out</h1>
			<p className="links">
				<a href="/login">Sign in again</a>
			</p>
		</AuthDocument>
	);
}
