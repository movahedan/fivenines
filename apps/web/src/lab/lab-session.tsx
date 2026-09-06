import { useState } from "react";

import type { EngineCommand, RegionId, ServerCatalogId } from "@packages/fivenines-engine";
import { regions, SERVER_CATALOG_IDS, SERVER_TIER_LABEL } from "@packages/fivenines-engine";
import { Button } from "@packages/ui/molecules/button";

import { useLabGame } from "./use-lab-game";

const REGION_IDS = Object.keys(regions.byId).filter(regions.isRegionId);
const DEFAULT_REGION: RegionId = "utc+0";

const METRIC_KEYS = [
	"handledRequests",
	"droppedRequests",
	"p95LatencyMs",
	"utilization",
	"errorPpm",
] as const;

export function LabSession() {
	const { game, lastError, tick, dispatch, reset } = useLabGame();
	const [region, setRegion] = useState<RegionId>(DEFAULT_REGION);

	return (
		<main className="flex flex-col gap-6">
			<h1>Lab</h1>
			{lastError !== null ? <p role="alert">{lastError}</p> : null}
			<section>
				<h2>Commands</h2>
				<div className="flex flex-row flex-wrap gap-2">
					<label htmlFor="lab-region">Region</label>
					<select
						id="lab-region"
						name="region"
						value={region}
						onChange={(event) => setRegion(regions.parseRegionId(event.target.value))}
					>
						{REGION_IDS.map((id) => (
							<option key={id} value={id}>
								{id}
							</option>
						))}
					</select>
					<Button onClick={tick}>Tick</Button>
					<Button variant="outline" onClick={reset}>
						Reset
					</Button>
					{SERVER_CATALOG_IDS.map((serverType) => (
						<BuyServerButton
							key={serverType}
							serverType={serverType}
							region={region}
							onDispatch={dispatch}
						/>
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
								{asset.id} {SERVER_TIER_LABEL[asset.catalogId]} {asset.region}
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
	readonly region: RegionId;
	readonly onDispatch: (command: EngineCommand) => void;
}

function BuyServerButton({ serverType, region, onDispatch }: BuyServerButtonProps) {
	return (
		<Button
			variant="secondary"
			onClick={() => onDispatch({ type: "buyServer", payload: { serverType, region } })}
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
