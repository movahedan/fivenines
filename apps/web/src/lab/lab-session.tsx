import { Fragment, useState } from "react";

import type {
	BillingSettlement,
	EngineCommand,
	Project,
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

import { Button } from "@/atoms/button";
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

function assetTenureKind(asset: {
	readonly tenure?: { readonly kind: string };
}): "owned" | "leased" {
	return asset.tenure?.kind === "leased" ? "leased" : "owned";
}

export function LabSession() {
	const { game, lastError, tick, dispatch, reset } = useLabGame();
	const [region, setRegion] = useState<RegionId>(DEFAULT_REGION);
	const [pickedServerId, setPickedServerId] = useState<string | undefined>(undefined);
	const {
		cashCents,
		accountsReceivableCents,
		jailed,
		maintenanceCents,
		powerCents,
		leaseCents,
		opexCents,
	} = game.finance;
	const serverId = game.assets.some((asset) => asset.id === pickedServerId)
		? pickedServerId
		: game.assets.at(0)?.id;

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
							<th scope="row">Accounts receivable</th>
							<td>{accountsReceivableCents}</td>
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
						<tr>
							<th scope="row">Last opex lease</th>
							<td>{leaseCents}</td>
						</tr>
						<tr>
							<th scope="row">Last opex total</th>
							<td>{opexCents}</td>
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
					<label htmlFor="lab-server">Server</label>
					<select
						id="lab-server"
						name="server"
						value={serverId ?? ""}
						onChange={(event) => setPickedServerId(event.target.value)}
					>
						{game.assets.length === 0 ? <option value="">none</option> : null}
						{game.assets.map((asset) => (
							<option key={asset.id} value={asset.id}>
								{asset.id}
							</option>
						))}
					</select>
					<Button onClick={tick}>Tick</Button>
					<Button variant="outline" onClick={reset}>
						Reset
					</Button>
					{SERVER_CATALOG_IDS.map((serverType) => (
						<Fragment key={serverType}>
							<BuyServerButton
								serverType={serverType}
								region={region}
								cashCents={cashCents}
								jailed={jailed}
								onDispatch={dispatch}
							/>
							<LeaseServerButton
								serverType={serverType}
								region={region}
								jailed={jailed}
								onDispatch={dispatch}
							/>
						</Fragment>
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
										{project.status === "offered" ? <OfferCard project={project} /> : null}
										{project.status === "served" || project.status === "offline" ? (
											<>
												<p>routed {project.route?.serverId ?? "parked"}</p>
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
											<AcceptButton
												projectId={project.id}
												jailed={jailed}
												serverId={serverId}
												onDispatch={dispatch}
											/>
										) : null}
										{project.status === "served" || project.status === "offline" ? (
											<RouteButtons
												projectId={project.id}
												parked={project.status === "offline"}
												serverId={serverId}
												onDispatch={dispatch}
											/>
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
						{game.assets.map((asset) => {
							const leased = assetTenureKind(asset) === "leased";

							return (
								<li key={asset.id}>
									{asset.id} {SERVER_TIER_LABEL[asset.catalogId]} {asset.region}{" "}
									{assetTenureKind(asset)}
									<Button
										variant="outline"
										onClick={() =>
											dispatch(
												leased
													? { type: "releaseServer", payload: { serverId: asset.id } }
													: { type: "sellServer", payload: { serverId: asset.id } },
											)
										}
									>
										{leased ? `Release ${asset.id}` : `Delete ${asset.id}`}
									</Button>
								</li>
							);
						})}
					</ul>
				)}
			</section>
		</main>
	);
}

function OfferCard({ project }: { readonly project: Project }) {
	const campaign = project.campaign;

	return (
		<>
			<p>region {project.region}</p>
			<p>baseline {project.estimatedRequestsPerHour}</p>
			<p>traffic {project.category}</p>
			<p>spikes {project.campaignProne ? "campaign-prone" : "none"}</p>
			{campaign !== undefined ? (
				<p>
					campaign hour {campaign.startHour} for {campaign.durationHours}h
				</p>
			) : null}
			<p>PAYG {project.commercial.paygCentsPerThousandHandled}/1000</p>
			<p>recurring {project.commercial.recurringCentsPerPeriod}</p>
			<p>SLA target {project.commercial.targetPpm}</p>
			<p>penalty mild 25% / severe 50% / catastrophe 100%</p>
		</>
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

interface LeaseServerButtonProps {
	readonly serverType: ServerCatalogId;
	readonly region: RegionId;
	readonly jailed: boolean;
	readonly onDispatch: (command: EngineCommand) => void;
}

function LeaseServerButton({ serverType, region, jailed, onDispatch }: LeaseServerButtonProps) {
	return (
		<Button
			variant="outline"
			disabled={jailed}
			onClick={() => onDispatch({ type: "leaseServer", payload: { serverType, region } })}
		>
			{`Lease ${SERVER_TIER_LABEL[serverType]}`}
		</Button>
	);
}

interface AcceptButtonProps {
	readonly projectId: string;
	readonly jailed: boolean;
	readonly serverId: string | undefined;
	readonly onDispatch: (command: EngineCommand) => void;
}

function AcceptButton({ projectId, jailed, serverId, onDispatch }: AcceptButtonProps) {
	return (
		<Button
			disabled={jailed || serverId === undefined}
			onClick={() => {
				if (serverId !== undefined) {
					onDispatch({ type: "acceptProject", payload: { projectId, serverId } });
				}
			}}
		>
			{`Accept ${projectId}`}
		</Button>
	);
}

interface RouteButtonsProps {
	readonly projectId: string;
	readonly parked: boolean;
	readonly serverId: string | undefined;
	readonly onDispatch: (command: EngineCommand) => void;
}

function RouteButtons({ projectId, parked, serverId, onDispatch }: RouteButtonsProps) {
	return (
		<>
			<Button
				variant="outline"
				disabled={serverId === undefined}
				onClick={() => {
					if (serverId !== undefined) {
						onDispatch({
							type: parked ? "assignProject" : "moveProject",
							payload: { projectId, serverId },
						});
					}
				}}
			>
				{`${parked ? "Assign" : "Move"} ${projectId}`}
			</Button>
			{parked ? null : (
				<Button
					variant="secondary"
					onClick={() => onDispatch({ type: "unassignProject", payload: { projectId } })}
				>
					{`Park ${projectId}`}
				</Button>
			)}
		</>
	);
}
