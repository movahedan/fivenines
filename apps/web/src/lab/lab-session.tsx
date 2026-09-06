import type { EngineCommand, ServerCatalogId } from "@packages/fivenines-engine";
import { SERVER_CATALOG_IDS, SERVER_TIER_LABEL } from "@packages/fivenines-engine";
import { Button } from "@packages/ui/molecules/button";

import { useLabGame } from "./use-lab-game";

const METRIC_KEYS = [
	"handledRequests",
	"droppedRequests",
	"p95LatencyMs",
	"utilization",
	"errorPpm",
] as const;

export function LabSession() {
	const { game, lastError, tick, dispatch, reset } = useLabGame();

	return (
		<main className="flex flex-col gap-6">
			<h1>Lab</h1>
			{lastError !== null ? <p role="alert">{lastError}</p> : null}
			<section>
				<h2>Commands</h2>
				<div className="flex flex-row flex-wrap gap-2">
					<Button onClick={tick}>Tick</Button>
					<Button variant="outline" onClick={reset}>
						Reset
					</Button>
					{SERVER_CATALOG_IDS.map((serverType) => (
						<BuyServerButton key={serverType} serverType={serverType} onDispatch={dispatch} />
					))}
				</div>
			</section>
			<section>
				<h2>Metrics</h2>
				<table>
					<thead>
						<tr>
							<th scope="col">Metric</th>
							<th scope="col">Value</th>
						</tr>
					</thead>
					<tbody>
						{METRIC_KEYS.map((key) => (
							<tr key={key}>
								<th scope="row">{key}</th>
								<td>{game.metrics[key]}</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>
			<section>
				<h2>Customers</h2>
				<ul>
					{game.customers.map((customer) => (
						<li key={customer.id}>
							{customer.id}
							<ul>
								{customer.projects.map((project) => (
									<li key={project.id}>
										{project.id} {project.status}
										{project.status === "offered" ? (
											<AcceptButton projectId={project.id} onDispatch={dispatch} />
										) : null}
									</li>
								))}
							</ul>
						</li>
					))}
				</ul>
			</section>
			<section>
				<h2>Assets</h2>
				{game.assets.length === 0 ? (
					<p>No servers</p>
				) : (
					<ul>
						{game.assets.map((asset) => (
							<li key={asset.id}>
								{asset.id} {SERVER_TIER_LABEL[asset.catalogId]}
								<Button
									variant="outline"
									onClick={() => dispatch({ type: "sellServer", payload: { serverId: asset.id } })}
								>
									{`Delete ${asset.id}`}
								</Button>
							</li>
						))}
					</ul>
				)}
			</section>
		</main>
	);
}

interface BuyServerButtonProps {
	readonly serverType: ServerCatalogId;
	readonly onDispatch: (command: EngineCommand) => void;
}

function BuyServerButton({ serverType, onDispatch }: BuyServerButtonProps) {
	return (
		<Button
			variant="secondary"
			onClick={() => onDispatch({ type: "buyServer", payload: { serverType } })}
		>
			{`Buy ${SERVER_TIER_LABEL[serverType]}`}
		</Button>
	);
}

interface AcceptButtonProps {
	readonly projectId: string;
	readonly onDispatch: (command: EngineCommand) => void;
}

function AcceptButton({ projectId, onDispatch }: AcceptButtonProps) {
	return (
		<Button onClick={() => onDispatch({ type: "acceptProject", payload: { projectId } })}>
			{`Accept ${projectId}`}
		</Button>
	);
}
