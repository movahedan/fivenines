export interface HomeStatusProps {
	readonly ok: boolean | null;
	readonly service?: string;
}

export function HomeStatus({ ok, service = "api" }: HomeStatusProps) {
	if (ok === null) {
		return <p>Control plane unreachable</p>;
	}

	return (
		<p>
			{service} <span data-status={ok ? "ok" : "down"}>{ok ? "ok" : "down"}</span>
		</p>
	);
}
