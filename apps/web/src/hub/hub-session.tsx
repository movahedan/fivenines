import { useCallback, useEffect, useId, useRef, useState } from "react";

import { useAuth } from "@packages/auth/react";
import type {
	EngineCommand,
	Game,
	Project,
	ProjectStatus,
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
import { formatters } from "@packages/shared/formatters";

import { Button } from "@/atoms/button";
import {
	ActiveProjectCard,
	type ServerOption,
} from "@/molecules/active-project-card/active-project-card";
import { EventLog, type EventLogEntry } from "@/molecules/event-log/event-log";
import { Hud } from "@/molecules/hud/hud";
import { PanelHeader } from "@/molecules/panel-header/panel-header";
import { ProjectOfferCard } from "@/molecules/project-offer-card/project-offer-card";
import { ServerCard } from "@/molecules/server-card/server-card";
import {
	axisPercent,
	commandLogTone,
	engineEventMessage,
	engineEventTone,
	evaluateOpeningShift,
	openingShiftResultCopy,
	REGION_CLASS,
	recoveryEtaLabel,
	SKU_DOT_CLASS,
	skuCostLabel,
	skuCpuLabel,
	skuNetLabel,
	skuOpexLabel,
	skuRamLabel,
	slaPercent,
	slaShareLabel,
	slaStatusLabel,
	slaTone,
	sparklineFromSlaHours,
	sparklineTargetFromPpm,
} from "./hub-map";
import { useHubGame } from "./use-hub-game";

interface ProjectRow {
	readonly customerId: string;
	readonly project: Project;
}

function collectByStatus(
	customers: Game["customers"],
	status: ProjectStatus,
): readonly ProjectRow[] {
	return customers.flatMap((customer) =>
		customer.projects
			.filter((project) => project.status === status)
			.map((project) => ({ customerId: customer.id, project })),
	);
}

function collectOffers(customers: Game["customers"]): readonly ProjectRow[] {
	return collectByStatus(customers, "offered");
}

function collectServed(customers: Game["customers"]): readonly ProjectRow[] {
	return collectByStatus(customers, "served");
}

function collectParked(customers: Game["customers"]): readonly ProjectRow[] {
	return collectByStatus(customers, "offline");
}

export function HubSession() {
	const { user, logoutHref } = useAuth();
	const { game, lastError, running, toggleRunning, dispatch, reset } = useHubGame();
	const [buyRegion, setBuyRegion] = useState<RegionId>(DEFAULT_REGION);
	const [routePicks, setRoutePicks] = useState<ReadonlyMap<string, string>>(new Map());
	const [entries, setEntries] = useState<readonly EventLogEntry[]>([]);
	const regionSelectId = useId();
	const loggedHourRef = useRef<number | null>(null);
	const { cashCents, accountsReceivableCents, jailed, opexCents } = game.finance;

	const pushEntry = useCallback(
		(tone: EventLogEntry["tone"], message: string, hourIndex: number) => {
			setEntries((current) => {
				const next: EventLogEntry = {
					id: `${String(hourIndex)}-${String(current.length)}-${message}`,
					tickLabel: formatters.hourTick(hourIndex),
					message,
					tone,
				};

				return [...current, next].slice(-50);
			});
		},
		[],
	);

	useEffect(() => {
		if (loggedHourRef.current === game.hourIndex) {
			return;
		}

		loggedHourRef.current = game.hourIndex;

		for (const event of game.events) {
			pushEntry(engineEventTone(event), engineEventMessage(event), event.hourIndex);
		}
	}, [game.events, game.hourIndex, pushEntry]);

	const runCommand = (command: EngineCommand, message: string): void => {
		dispatch(command);
		pushEntry(commandLogTone(command.type), message, game.hourIndex);
	};

	const offers = collectOffers(game.customers);
	const served = collectServed(game.customers);
	const parked = collectParked(game.customers);
	const shiftOutcome = evaluateOpeningShift(game);
	const shiftCopy = openingShiftResultCopy(shiftOutcome);

	const serverOptions: readonly ServerOption[] = game.assets.map((asset) => ({
		id: asset.id,
		label: `${asset.id} · ${SERVER_TIER_LABEL[asset.catalogId]} · ${asset.region}`,
	}));

	/**
	 * Defaults to the box the project already runs on, so MOVE without touching
	 * the picker is a no-op rather than a silent relocation to the first server.
	 */
	const pickedServerId = (project: Project): string | undefined => {
		const picked = routePicks.get(project.id);

		if (picked !== undefined && game.assets.some((asset) => asset.id === picked)) {
			return picked;
		}

		return project.route?.serverId ?? game.assets.at(0)?.id;
	};

	const selectServer = (projectId: string, serverId: string): void => {
		setRoutePicks((current) => new Map(current).set(projectId, serverId));
	};

	const withPickedServer = (project: Project, run: (serverId: string) => void): void => {
		const serverId = pickedServerId(project);

		if (serverId !== undefined) {
			run(serverId);
		}
	};

	const routedServerLabel = (project: Project): string => {
		const serverId = project.route?.serverId;

		if (serverId === undefined) {
			return "PARKED";
		}

		const asset = game.assets.find((candidate) => candidate.id === serverId);

		return asset === undefined ? serverId : `${serverId} · ${SERVER_TIER_LABEL[asset.catalogId]}`;
	};

	return (
		<div className="relative flex h-screen min-w-[1280px] flex-col overflow-hidden bg-background text-foreground">
			<Hud
				account={
					<Button
						onClick={() => {
							window.location.assign(logoutHref({ redirectUri: "/" }));
						}}
						size="sm"
						variant="ghost"
					>
						{user?.email ?? "Sign out"}
					</Button>
				}
				clockLabel={formatters.clockLabel(game.hourIndex)}
				jailed={jailed}
				metrics={[
					{ label: "CASH", value: formatters.cents(cashCents), tone: "primary" },
					{
						label: "Receivable today",
						value: formatters.cents(accountsReceivableCents),
						tone: "info",
					},
					{ label: "OPEX / hour", value: formatters.cents(opexCents), tone: "warning" },
				]}
				onToggleRunning={toggleRunning}
				running={running}
				subtitle="Opening Shift"
				tickLabel={formatters.hourTick(game.hourIndex)}
				title="Five Nines"
			/>
			{lastError !== null ? (
				<p className="bg-destructive/10 px-4 py-2 font-mono text-sm text-destructive" role="alert">
					{lastError}
				</p>
			) : null}
			<main className="flex min-h-0 flex-1">
				<section
					aria-label="Incoming queue"
					className="flex min-h-0 w-[320px] shrink-0 flex-col border-r border-border bg-panel"
				>
					<PanelHeader count={offers.length} label="Incoming" tone="warning" />
					<div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
						{offers.map(({ customerId, project }) => (
							<ProjectOfferCard
								cpuLabel={formatters.coresCompact(project.estimatedRequestsPerHour)}
								customerName={customerId}
								disabled={jailed}
								key={project.id}
								name={project.id}
								onAccept={() => {
									withPickedServer(project, (serverId) => {
										runCommand(
											{ type: "acceptProject", payload: { projectId: project.id, serverId } },
											`Accepted ${project.id} on ${serverId}`,
										);
									});
								}}
								onDecline={() => {
									runCommand(
										{ type: "declineProject", payload: { projectId: project.id } },
										`Declined ${project.id}`,
									);
								}}
								onSelectServer={(serverId) => {
									selectServer(project.id, serverId);
								}}
								paygLabel={`${String(project.commercial.paygCentsPerThousandHandled)}¢/k`}
								regionClassName={REGION_CLASS[project.region]}
								regionLabel={project.region}
								selectedServerId={pickedServerId(project)}
								serverOptions={serverOptions}
								slaLabel={formatters.ppm(project.commercial.targetPpm)}
							/>
						))}
					</div>
				</section>
				<section
					aria-label="Active floor"
					className="flex min-h-0 min-w-0 flex-1 flex-col bg-background"
				>
					<PanelHeader
						count={served.length}
						label="Active"
						tone="primary"
						trailing={
							<span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
								{`Parked (${String(parked.length)})`}
							</span>
						}
					/>
					<div className="grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-y-auto p-2">
						{served.length === 0 && parked.length === 0 ? (
							<p className="col-span-2 font-mono text-sm text-muted-foreground">
								No served projects
							</p>
						) : null}
						{served.map(({ customerId, project }) => (
							<ActiveRowCard
								customerId={customerId}
								key={project.id}
								onRoute={() => {
									withPickedServer(project, (serverId) => {
										runCommand(
											{ type: "moveProject", payload: { projectId: project.id, serverId } },
											`Moved ${project.id} to ${serverId}`,
										);
									});
								}}
								onSelectServer={(serverId) => {
									selectServer(project.id, serverId);
								}}
								onUnassign={() => {
									runCommand(
										{ type: "unassignProject", payload: { projectId: project.id } },
										`Parked ${project.id}`,
									);
								}}
								project={project}
								routeLabel="MOVE"
								selectedServerId={pickedServerId(project)}
								serverLabel={routedServerLabel(project)}
								serverOptions={serverOptions}
							/>
						))}
						{parked.map(({ customerId, project }) => (
							<ActiveRowCard
								customerId={customerId}
								key={project.id}
								onRoute={() => {
									withPickedServer(project, (serverId) => {
										runCommand(
											{ type: "assignProject", payload: { projectId: project.id, serverId } },
											`Assigned ${project.id} to ${serverId}`,
										);
									});
								}}
								onSelectServer={(serverId) => {
									selectServer(project.id, serverId);
								}}
								project={project}
								routeLabel="ASSIGN"
								selectedServerId={pickedServerId(project)}
								serverLabel={routedServerLabel(project)}
								serverOptions={serverOptions}
							/>
						))}
					</div>
					<PanelHeader count={game.assets.length} label="Fleet" tone="info" />
					<div className="grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-y-auto p-2">
						{game.assets.length === 0 ? (
							<p className="col-span-2 font-mono text-sm text-muted-foreground">No servers</p>
						) : (
							game.assets.map((asset) => (
								<ServerCard
									cpuLabel={skuCpuLabel(asset.catalogId)}
									cpuPercent={axisPercent(asset.metrics.cpuLoad, asset.computeUnitsPerHour)}
									dotClassName={SKU_DOT_CLASS[asset.catalogId]}
									idLabel={asset.id}
									key={asset.id}
									label={`${SERVER_TIER_LABEL[asset.catalogId]} · ${asset.region}`}
									netLabel={skuNetLabel(asset.catalogId)}
									netPercent={axisPercent(asset.metrics.netLoad, asset.networkBytesPerHour)}
									onSell={() => {
										runCommand(
											{ type: "sellServer", payload: { serverId: asset.id } },
											`Sold ${asset.id}`,
										);
									}}
									opexLabel={skuOpexLabel(asset.catalogId)}
									ramLabel={skuRamLabel(asset.catalogId)}
									ramPercent={axisPercent(asset.metrics.memOcc, asset.memoryMiB)}
									variant="fleet"
								/>
							))
						)}
					</div>
				</section>
				<section
					aria-label="Server market"
					className="flex min-h-0 w-[300px] shrink-0 flex-col border-l border-border bg-panel"
				>
					<PanelHeader
						count={SERVER_CATALOG_IDS.length}
						label="Market"
						tone="destructive"
						trailing={
							<label className="font-mono text-xs text-muted-foreground" htmlFor={regionSelectId}>
								Region
								<select
									className="ml-1 bg-card text-foreground"
									id={regionSelectId}
									name="buy-region"
									onChange={(event) => setBuyRegion(regions.parseRegionId(event.target.value))}
									value={buyRegion}
								>
									{REGION_IDS.map((id) => (
										<option key={id} value={id}>
											{id}
										</option>
									))}
								</select>
							</label>
						}
					/>
					<div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
						{SERVER_CATALOG_IDS.map((catalogId: ServerCatalogId) => {
							const canAfford = !jailed && cashCents >= SKU_ECONOMY[catalogId].purchaseCents;

							return (
								<ServerCard
									canAfford={canAfford}
									costLabel={skuCostLabel(catalogId)}
									cpuLabel={skuCpuLabel(catalogId)}
									dotClassName={SKU_DOT_CLASS[catalogId]}
									key={catalogId}
									label={SERVER_TIER_LABEL[catalogId]}
									onBuy={() => {
										runCommand(
											{
												type: "buyServer",
												payload: { serverType: catalogId, region: buyRegion },
											},
											`Bought ${SERVER_TIER_LABEL[catalogId]} in ${buyRegion}`,
										);
									}}
									opexLabel={skuOpexLabel(catalogId)}
									ramLabel={skuRamLabel(catalogId)}
									variant="market"
								/>
							);
						})}
					</div>
				</section>
			</main>
			<section
				aria-label="Event log"
				className="flex h-40 min-h-0 shrink-0 flex-col overflow-hidden border-t border-border"
			>
				<EventLog className="min-h-0 flex-1" entries={entries} />
			</section>
			{shiftOutcome.status !== "in_progress" ? (
				<div
					aria-label="Opening Shift result"
					className="absolute inset-0 z-10 flex items-center justify-center bg-background/80"
					role="dialog"
				>
					<div className="flex max-w-lg flex-col gap-3 border border-border bg-card p-6">
						<p className="font-mono text-lg font-semibold text-foreground">{shiftCopy.title}</p>
						<p className="font-mono text-sm text-muted-foreground">{shiftCopy.body}</p>
						<Button
							onClick={() => {
								setEntries([]);
								reset();
							}}
						>
							Reset
						</Button>
					</div>
				</div>
			) : null}
		</div>
	);
}

interface ActiveRowCardProps {
	readonly customerId: string;
	readonly project: Project;
	readonly serverLabel: string;
	readonly serverOptions: readonly ServerOption[];
	readonly selectedServerId: string | undefined;
	readonly onSelectServer: (serverId: string) => void;
	readonly onRoute: () => void;
	readonly routeLabel: string;
	readonly onUnassign?: () => void;
}

function ActiveRowCard({
	customerId,
	project,
	serverLabel,
	serverOptions,
	selectedServerId,
	onSelectServer,
	onRoute,
	routeLabel,
	onUnassign,
}: ActiveRowCardProps) {
	const sparkline = sparklineFromSlaHours(project);
	const windowPpm = project.metrics.windowAvailabilityPpm;
	const targetPpm = project.commercial.targetPpm;

	return (
		<ActiveProjectCard
			currentHourLabel={slaShareLabel(project.metrics.availabilityPpm)}
			customerName={customerId}
			name={project.id}
			onRoute={onRoute}
			onSelectServer={onSelectServer}
			onUnassign={onUnassign}
			paygLabel={formatters.cents(project.periodPaygCents)}
			recoveryEtaLabel={recoveryEtaLabel(project)}
			regionClassName={REGION_CLASS[project.region]}
			regionLabel={project.region}
			rollingLabel={slaShareLabel(windowPpm)}
			routeLabel={routeLabel}
			selectedServerId={selectedServerId}
			serverLabel={serverLabel}
			serverOptions={serverOptions}
			slaLabel={slaShareLabel(windowPpm)}
			slaPercent={slaPercent(windowPpm)}
			slaStatusLabel={slaStatusLabel(windowPpm, targetPpm)}
			slaTone={slaTone(windowPpm, targetPpm)}
			sparkline={sparkline}
			sparklineTarget={sparklineTargetFromPpm(targetPpm)}
			sparklineWarmingLabel={sparkline.length === 0 ? "warming" : undefined}
			targetLabel={slaShareLabel(targetPpm)}
			unassignLabel="PARK"
		/>
	);
}
