import { useState } from "react";

import type {
	BillingSettlement,
	EngineCommand,
	RegionId,
	ServerCatalogId,
} from "@packages/fivenines-engine";
import {
	DEFAULT_REGION,
	REGION_IDS,
	regions,
	SERVER_CATALOG_IDS,
	SERVER_TIER_LABEL,
	SKU_ECONOMY,
} from "@packages/fivenines-engine";
import { Button } from "@packages/ui/molecules/button";

import { useLabGame } from "./use-lab-game";

const METRIC_KEYS = [
	"handledRequests",
	"droppedRequests",
	"p95LatencyMs",
	"utilization",
	"errorPpm",
] as const;

function formatSlaPpm(value: number | null): string {
	return value === null ? "—" : String(value);
}

function lastSettlementLabel(settlements: readonly BillingSettlement[]): string {
	const last = settlements.at(-1);

	return last === undefined ? "—" : String(last.periodRevenueCents);
}

export function LabSession() {
	const { game, lastError, tick, dispatch, reset } = useLabGame();
	const [region, setRegion] = useState<RegionId>(DEFAULT_REGION);
	const { cashCents, jailed, maintenanceCents, powerCents } = game.finance;

	return (
		<main className="flex flex-col gap-6">
			<h1>Lab</h1>
			{lastError !== null ? <p role="alert">{lastError}</p> : null}
			<section>
				<h2>Finance</h2>
				<table>
					<thead>
						<tr>
							<th scope="col">Field</th>
							<th scope="col">Value</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<th scope="row">Cash</th>
							<td>{cashCents}</td>
						</tr>
						<tr>
							<th scope="row">Jailed</th>
							<td>{jailed ? "yes" : "no"}</td>
						</tr>
						<tr>
							<th scope="row">Last opex maintenance</th>
							<td>{maintenanceCents}</td>
						</tr>
						<tr>
							<th scope="row">Last opex power</th>
							<td>{powerCents}</td>
						</tr>
					</tbody>
				</table>
			</section>
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
							cashCents={cashCents}
							jailed={jailed}
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
										{project.status === "served" ? (
											<>
												<p>this-hour {formatSlaPpm(project.metrics.availabilityPpm)} ppm</p>
												<p>window {formatSlaPpm(project.metrics.windowAvailabilityPpm)} ppm</p>
												<p>this-period PAYG {project.periodPaygCents}</p>
												<p>hours served this week {project.hoursServedInPeriod}</p>
												<p>last settlement {lastSettlementLabel(project.settlements)}</p>
												{project.settlements.length > 0 ? (
													<ul aria-label="settlement history">
														{project.settlements.map((settlement) => (
															<li key={settlement.periodIndex}>
																period {settlement.periodIndex} PAYG {settlement.paygCents}{" "}
																recurring {settlement.recurringCents} credit{" "}
																{settlement.creditCents} revenue {settlement.periodRevenueCents}
															</li>
														))}
													</ul>
												) : null}
											</>
										) : null}
										{project.status === "offered" ? (
											<AcceptButton projectId={project.id} jailed={jailed} onDispatch={dispatch} />
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
	readonly cashCents: number;
	readonly jailed: boolean;
	readonly onDispatch: (command: EngineCommand) => void;
}

function BuyServerButton({
	serverType,
	region,
	cashCents,
	jailed,
	onDispatch,
}: BuyServerButtonProps) {
	const cannotBuy = jailed || cashCents < SKU_ECONOMY[serverType].purchaseCents;

	return (
		<Button
			variant="secondary"
			disabled={cannotBuy}
			onClick={() => onDispatch({ type: "buyServer", payload: { serverType, region } })}
		>
			{`Buy ${SERVER_TIER_LABEL[serverType]}`}
		</Button>
	);
}

interface AcceptButtonProps {
	readonly projectId: string;
	readonly jailed: boolean;
	readonly onDispatch: (command: EngineCommand) => void;
}

function AcceptButton({ projectId, jailed, onDispatch }: AcceptButtonProps) {
	return (
		<Button
			disabled={jailed}
			onClick={() => onDispatch({ type: "acceptProject", payload: { projectId } })}
		>
			{`Accept ${projectId}`}
		</Button>
	);
}
