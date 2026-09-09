import { AuthDocument } from "./auth-document";
import { AuthReturnFields } from "./auth-return-fields";

type RegisterPageProps = Readonly<{
	csrfToken: string;
	error?: string;
	email?: string;
	tenantName?: string;
	redirectUri?: string;
	state?: string;
	next?: string;
}>;

export function RegisterPage(props: RegisterPageProps) {
	return (
		<AuthDocument title="Create account — Five Nines">
			<h1>Create account</h1>
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
				<label>
					Workspace name (optional)
					<input
						name="tenantName"
						type="text"
						maxLength={80}
						defaultValue={props.tenantName ?? ""}
					/>
				</label>
				<button type="submit">Register</button>
			</form>
			<p className="links">
				<a href="login">Sign in</a>
				<a href="otp">Sign in with code</a>
			</p>
		</AuthDocument>
	);
}
