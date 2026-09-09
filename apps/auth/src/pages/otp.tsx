import { authNavHref } from "../utils/auth-nav-href";
import { AuthDocument } from "./auth-document";
import { AuthReturnFields } from "./auth-return-fields";

type OtpPageProps = Readonly<{
	csrfToken: string;
	error?: string;
	info?: string;
	email?: string;
	step: "request" | "verify";
	redirectUri?: string;
	state?: string;
	next?: string;
}>;

export function OtpPage(props: OtpPageProps) {
	const action = props.step === "request" ? "/otp" : "/otp/verify";
	const title = props.step === "request" ? "Email code" : "Enter code";
	const ret = { redirectUri: props.redirectUri, state: props.state, next: props.next };

	return (
		<AuthDocument brandHref={authNavHref("/login", ret)} title={`${title} — Five Nines`}>
			<h1>{title}</h1>
			{props.error ? <p className="error">{props.error}</p> : null}
			{props.info ? <p className="info">{props.info}</p> : null}
			<form method="post" action={action}>
				<input type="hidden" name="csrf" value={props.csrfToken} />
				<AuthReturnFields redirectUri={props.redirectUri} state={props.state} next={props.next} />
				<label>
					Email
					<input
						name="email"
						type="email"
						required
						readOnly={props.step === "verify"}
						defaultValue={props.email ?? ""}
					/>
				</label>
				{props.step === "verify" ? (
					<label>
						6-digit code
						<input
							name="code"
							type="text"
							inputMode="numeric"
							pattern="[0-9]{6}"
							required
							maxLength={6}
						/>
					</label>
				) : null}
				<button type="submit">{props.step === "request" ? "Send code" : "Verify"}</button>
			</form>
			<p className="links">
				<a href={authNavHref("/login", ret)}>Password sign in</a>
				<a href={authNavHref("/register", ret)}>Register</a>
			</p>
		</AuthDocument>
	);
}
