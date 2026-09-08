import { useCallback, useEffect, useId, useRef, useState } from "react";

import { useAuth } from "@packages/auth/react";
import type {
	EngineCommand,
	Game,
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
import { formatters } from "@packages/shared/formatters";

import { Button } from "@/atoms/button";
import { ActiveProjectCard } from "@/molecules/active-project-card/active-project-card";
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

interface OfferRow {
	readonly customerId: string;
	readonly project: Project;
}

interface ServedRow {
	readonly customerId: string;
	readonly project: Project;
}

function collectOffers(customers: Game["customers"]): readonly OfferRow[] {
	return customers.flatMap((customer) =>
		customer.projects
			.filter((project) => project.status === "offered")
			.map((project) => ({ customerId: customer.id, project })),
	);
}

function collectServed(customers: Game["customers"]): readonly ServedRow[] {
	return customers.flatMap((customer) =>
		customer.projects
			.filter((project) => project.status === "served")
			.map((project) => ({ customerId: customer.id, project })),
	);
}

export function HubSession() {
	const { user, logoutHref } = useAuth();
	const { game, lastError, running, toggleRunning, dispatch, reset } = useHubGame();
	const [buyRegion, setBuyRegion] = useState<RegionId>(DEFAULT_REGION);
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
	const shiftOutcome = evaluateOpeningShift(game);
	const shiftCopy = openingShiftResultCopy(shiftOutcome);
	const localCount = (region: RegionId): number =>
		game.assets.filter((asset) => asset.region === region).length;

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
									runCommand(
										{ type: "acceptProject", payload: { projectId: project.id } },
										`Accepted ${project.id}`,
									);
								}}
								onDecline={() => {
									runCommand(
										{ type: "declineProject", payload: { projectId: project.id } },
										`Declined ${project.id}`,
									);
								}}
								paygLabel={`${String(project.commercial.paygCentsPerThousandHandled)}¢/k`}
								regionClassName={REGION_CLASS[project.region]}
								regionLabel={project.region}
								slaLabel={formatters.ppm(project.commercial.targetPpm)}
							/>
						))}
					</div>
				</section>
				<section
					aria-label="Active floor"
					className="flex min-h-0 min-w-0 flex-1 flex-col bg-background"
				>
					<PanelHeader count={served.length} label="Active" tone="primary" />
					<div className="grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-y-auto p-2">
						{served.length === 0 ? (
							<p className="col-span-2 font-mono text-sm text-muted-foreground">
								No served projects
							</p>
						) : (
							served.map(({ customerId, project }) => {
								const sparkline = sparklineFromSlaHours(project);
								const windowPpm = project.metrics.windowAvailabilityPpm;
								const targetPpm = project.commercial.targetPpm;

								return (
									<ActiveProjectCard
										currentHourLabel={slaShareLabel(project.metrics.availabilityPpm)}
										customerName={customerId}
										key={project.id}
										name={project.id}
										paygLabel={formatters.cents(project.periodPaygCents)}
										recoveryEtaLabel={recoveryEtaLabel(project)}
										regionClassName={REGION_CLASS[project.region]}
										regionLabel={project.region}
										rollingLabel={slaShareLabel(windowPpm)}
										serverLabel={`${String(localCount(project.region))} local`}
										slaLabel={slaShareLabel(windowPpm)}
										slaPercent={slaPercent(windowPpm)}
										slaStatusLabel={slaStatusLabel(windowPpm, targetPpm)}
										slaTone={slaTone(windowPpm, targetPpm)}
										sparkline={sparkline}
										sparklineTarget={sparklineTargetFromPpm(targetPpm)}
										sparklineWarmingLabel={sparkline.length === 0 ? "warming" : undefined}
										targetLabel={slaShareLabel(targetPpm)}
									/>
								);
							})
						)}
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
