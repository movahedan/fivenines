import { authNavHref } from "../utils/auth-nav-href";
import { AuthDocument } from "./auth-document";
import { AuthReturnFields } from "./auth-return-fields";

type LoginPageProps = Readonly<{
	csrfToken: string;
	error?: string;
	email?: string;
	redirectUri?: string;
	state?: string;
	next?: string;
}>;

export function LoginPage(props: LoginPageProps) {
	const ret = { redirectUri: props.redirectUri, state: props.state, next: props.next };

	return (
		<AuthDocument brandHref={authNavHref("/login", ret)} title="Sign in — Five Nines">
			<h1>Sign in</h1>
			{props.error ? <p className="error">{props.error}</p> : null}
			<form method="post" action="">
				<input type="hidden" name="csrf" value={props.csrfToken} />
				<AuthReturnFields redirectUri={props.redirectUri} state={props.state} next={props.next} />
				<label>
					Email
					<input name="email" type="email" required defaultValue={props.email ?? ""} />
				</label>
				<label>
					Password
					<input name="password" type="password" required minLength={8} />
				</label>
				<button type="submit">Sign in</button>
			</form>
			<p className="links">
				<a href={authNavHref("/register", ret)}>Create account</a>
				<a href={authNavHref("/otp", ret)}>Sign in with code</a>
			</p>
		</AuthDocument>
	);
}
