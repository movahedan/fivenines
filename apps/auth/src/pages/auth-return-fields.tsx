type AuthReturnFieldsProps = Readonly<{
	redirectUri?: string;
	state?: string;
	next?: string;
}>;

export function AuthReturnFields(props: AuthReturnFieldsProps) {
	return (
		<>
			{props.redirectUri ? (
				<input type="hidden" name="redirect_uri" value={props.redirectUri} />
			) : null}
			{props.state ? <input type="hidden" name="state" value={props.state} /> : null}
			{props.next ? <input type="hidden" name="next" value={props.next} /> : null}
		</>
	);
}
