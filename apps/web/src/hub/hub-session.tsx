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
	FIRST_PROJECT_SETUP_TASKS,
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
import { ServerSelect } from "@/molecules/server-select/server-select";
import {
	addedAssetId,
	assetTenureKind,
	commandLogTone,
	demandBaselineLabel,
	engineEventMessage,
	engineEventTone,
	evaluateOpeningShift,
	fleetHostProjection,
	hourWorkLabel,
	lastCreditLabel,
	openingShiftResultCopy,
	pathHourLabel,
	REGION_CLASS,
	recoveryEtaLabel,
	SKU_DOT_CLASS,
	serviceStateLabel,
	skuCostLabel,
	skuCpuLabel,
	skuDiskLabel,
	skuFleetOpexLabel,
	skuGpuLabel,
	skuLeaseLabel,
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

function collectAccepted(customers: Game["customers"]): readonly ProjectRow[] {
	return collectByStatus(customers, "accepted");
}

function collectParked(customers: Game["customers"]): readonly ProjectRow[] {
	return collectByStatus(customers, "offline");
}

function setupAction(projectId: string, taskId: string): EngineCommand {
	if (taskId === "configure-shared-connection") {
		return { type: "configureConnection", payload: { projectId } };
	}

	if (taskId === "install-application-runtime") {
		return {
			type: "installService",
			payload: { projectId, serviceId: "application-runtime" },
		};
	}

	if (taskId === "install-relational-database") {
		return {
			type: "installService",
			payload: { projectId, serviceId: "relational-database" },
		};
	}

	throw new Error(`unknown setup task: ${taskId}`);
}

function setupActionLabel(taskId: string): string {
	if (taskId === "configure-shared-connection") {
		return "Configure connection";
	}

	if (taskId === "install-application-runtime") {
		return "Install Application Runtime";
	}

	if (taskId === "install-relational-database") {
		return "Install Relational Database";
	}

	return taskId;
}

export function HubSession() {
	const { user, logoutHref } = useAuth();
	const { game, lastError, running, speed, toggleRunning, setSpeed, dispatch, reset } =
		useHubGame();
	const [buyRegion, setBuyRegion] = useState<RegionId>(DEFAULT_REGION);
	const [reviewProjectId, setReviewProjectId] = useState<string | null>(null);
	const [routePicks, setRoutePicks] = useState<ReadonlyMap<string, string>>(new Map());
	const [entries, setEntries] = useState<readonly EventLogEntry[]>([]);
	const [inspectedAssetId, setInspectedAssetId] = useState<string | null>(null);
	const [workspacePane, setWorkspacePane] = useState<"projects" | "floor" | "business">("floor");
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

	const leaseCatalog = (catalogId: ServerCatalogId): void => {
		const previousIds = new Set(game.assets.map((asset) => asset.id));

		dispatch({
			type: "leaseServer",
			payload: { serverType: catalogId, region: buyRegion },
		});

		const leasedId = addedAssetId(previousIds, game.assets);

		pushEntry(
			commandLogTone("leaseServer"),
			`Leased ${leasedId ?? SERVER_TIER_LABEL[catalogId]}`,
			game.hourIndex,
		);
	};

	const offers = collectOffers(game.customers);
	const accepted = collectAccepted(game.customers);
	const served = collectServed(game.customers);
	const parked = collectParked(game.customers);
	const inspectedAsset = game.assets.find((asset) => asset.id === inspectedAssetId);
	const shiftOutcome = evaluateOpeningShift(game);
	const shiftCopy = openingShiftResultCopy(shiftOutcome);

	const serverOptions: readonly ServerOption[] = game.assets.map((asset) => ({
		id: asset.id,
		label: `${asset.id} · ${SERVER_TIER_LABEL[asset.catalogId]} · ${asset.region}`,
	}));

	/**
	 * Defaults to the box the project already runs on, so MOVE without touching
	 * the picker targets the current server rather than silently relocating to
	 * the first one. Offered and parked projects fall back to the first box,
	 * which the picker shows selected before the player commits.
	 */
	const pickedServerId = (project: Project): string | undefined => {
		const picked = routePicks.get(project.id);

		if (picked !== undefined && game.assets.some((asset) => asset.id === picked)) {
			return picked;
		}

		return project.route?.serverId ?? project.setupServerId ?? game.assets.at(0)?.id;
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

	const reviewOffer = offers.find((row) => row.project.id === reviewProjectId);

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
					{
						label: "LEARN",
						value: `${String(game.learning.slotsUsed)}/2`,
						tone: "info",
					},
					{
						label: "OPS",
						value: `${String(game.operations.slotsUsed)}/1`,
						tone: "warning",
					},
				]}
				onSpeedChange={setSpeed}
				onToggleRunning={toggleRunning}
				running={running}
				speed={speed}
				subtitle="Opening Shift"
				tickLabel={formatters.hourTick(game.hourIndex)}
				title="Five Nines"
			/>
			{lastError !== null ? (
				<p className="bg-destructive/10 px-4 py-2 font-mono text-sm text-destructive" role="alert">
					{lastError}
				</p>
			) : null}
			<nav
				aria-label="Workspace"
				className="flex shrink-0 gap-1 border-b border-border bg-hud px-2 py-1"
			>
				{(
					[
						["projects", "Projects"],
						["floor", "Floor"],
						["business", "Business"],
					] as const
				).map(([id, label]) => (
					<Button
						key={id}
						aria-current={workspacePane === id ? "page" : undefined}
						size="sm"
						variant={workspacePane === id ? "secondary" : "ghost"}
						onClick={() => {
							setWorkspacePane(id);
						}}
					>
						{label}
					</Button>
				))}
			</nav>
			<main className="flex min-h-0 flex-1">
				<section
					aria-label="Projects"
					className="flex min-h-0 w-[320px] shrink-0 flex-col border-r border-border bg-panel"
				>
					<section aria-label="Incoming queue" className="flex min-h-0 min-w-0 flex-1 flex-col">
						<PanelHeader count={offers.length} label="Incoming" tone="warning" />
						<div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
							{offers.map(({ customerId, project }) => (
								<ProjectOfferCard
									cpuLabel={demandBaselineLabel(project.estimatedRequestsPerHour)}
									customerName={customerId}
									disabled={jailed}
									key={project.id}
									name={project.id}
									onAccept={() => {
										setReviewProjectId(project.id);
									}}
									onDecline={() => {
										runCommand(
											{ type: "declineProject", payload: { projectId: project.id } },
											`Declined ${project.id}`,
										);
										if (reviewProjectId === project.id) {
											setReviewProjectId(null);
										}
									}}
									paygLabel={`${String(project.commercial.paygCentsPerThousandHandled)}¢/k`}
									regionClassName={REGION_CLASS[project.region]}
									regionLabel={project.region}
									slaLabel={formatters.ppm(project.commercial.targetPpm)}
								/>
							))}
						</div>
					</section>
				</section>
				<section
					aria-label="Active floor"
					className="flex min-h-0 min-w-0 flex-1 flex-col bg-background"
				>
					<PanelHeader
						count={served.length + accepted.length}
						label="Active"
						tone="primary"
						trailing={
							<span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
								{`Parked (${String(parked.length)}) · Paths ${pathHourLabel(game.pathHour)}`}
							</span>
						}
					/>
					{reviewOffer !== undefined ? (
						<section
							aria-label="Contract Review"
							className="m-2 flex flex-col gap-3 border border-border bg-panel p-4"
						>
							<div className="flex items-start justify-between gap-2">
								<div>
									<p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
										Contract Review
									</p>
									<h2 className="font-mono text-lg font-semibold text-foreground">
										{reviewOffer.project.id}
									</h2>
									<p className="font-mono text-sm text-muted-foreground">
										{reviewOffer.customerId}
									</p>
								</div>
								<div className="flex gap-2">
									<Button
										size="sm"
										variant="ghost"
										onClick={() => {
											setReviewProjectId(reviewOffer.project.id);
										}}
									>
										Back
									</Button>
									<Button
										size="sm"
										variant="ghost"
										onClick={() => {
											setReviewProjectId(null);
										}}
									>
										Close
									</Button>
								</div>
							</div>
							<p className="font-mono text-sm">
								<strong>Advance due at acceptance:</strong>{" "}
								{formatters.cents(reviewOffer.project.commercial.recurringCentsPerPeriod)}
							</p>
							<p className="font-mono text-sm">
								<strong>SLA:</strong> {formatters.ppm(reviewOffer.project.commercial.targetPpm)} ·
								setup allowance {String(reviewOffer.project.setupAllowanceHours)}h then customer
								patience, full refund if withdrawn
							</p>
							<p className="font-mono text-xs text-muted-foreground">
								Close never charges. Back keeps this offer selected.
							</p>
							<Button
								disabled={jailed}
								onClick={() => {
									runCommand(
										{ type: "acceptProject", payload: { projectId: reviewOffer.project.id } },
										`Accepted ${reviewOffer.project.id}`,
									);
									setReviewProjectId(null);
								}}
							>
								Accept contract
							</Button>
						</section>
					) : null}
					{/* auto-rows-min is load-bearing: with default auto rows the tracks divide
					    the panel height instead of fitting the cards, and RN-web Views do not
					    clip, so taller cards paint straight over the row below. */}
					<div className="grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto p-2">
						{served.length === 0 && parked.length === 0 && accepted.length === 0 ? (
							<p className="col-span-2 font-mono text-sm text-muted-foreground">
								No served projects
							</p>
						) : null}
						{accepted.map(({ customerId, project }) => (
							<div
								className="flex flex-col gap-2 border border-border bg-panel p-3"
								key={project.id}
							>
								<p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
									{customerId} · setup
								</p>
								<p className="font-mono text-sm font-semibold">{project.id}</p>
								<p className="font-mono text-xs text-muted-foreground">
									Advance {formatters.cents(project.advancePostedCents)} received. Ready:{" "}
									{project.ready ? "yes" : "no"}. Assign a box, then install and configure. Start
									stays explicit. Park stays blocked until activated.
								</p>
								<ServerSelect
									emptyLabel="Buy a server to assign during setup"
									label="Setup server"
									onSelect={(serverId) => {
										selectServer(project.id, serverId);
									}}
									options={serverOptions}
									selectedId={pickedServerId(project)}
								/>
								<div className="flex flex-wrap gap-2">
									<Button
										disabled={jailed || game.assets.length === 0}
										size="sm"
										variant="secondary"
										onClick={() => {
											withPickedServer(project, (serverId) => {
												runCommand(
													{
														type: "placeSetup",
														payload: { projectId: project.id, serverId },
													},
													`Assigned ${serverId} to ${project.id}`,
												);
											});
										}}
									>
										Assign box
									</Button>
									{project.setupServerId !== undefined ? (
										<>
											<Button
												disabled={jailed}
												size="sm"
												variant="outline"
												onClick={() => {
													runCommand(
														{ type: "powerOn", payload: { serverId: project.setupServerId ?? "" } },
														`Powered on ${project.setupServerId}`,
													);
												}}
											>
												Power on
											</Button>
											<Button
												disabled={jailed}
												size="sm"
												variant="outline"
												onClick={() => {
													runCommand(
														{
															type: "powerOff",
															payload: { serverId: project.setupServerId ?? "" },
														},
														`Powered off ${project.setupServerId}`,
													);
												}}
											>
												Power off
											</Button>
										</>
									) : null}
									{FIRST_PROJECT_SETUP_TASKS.map((task) => {
										const done = game.operations.tasks.some(
											(entry) =>
												entry.projectId === project.id &&
												entry.taskId === task.id &&
												entry.status === "completed",
										);
										const active = game.operations.tasks.find(
											(entry) =>
												entry.projectId === project.id &&
												entry.taskId === task.id &&
												entry.status === "active",
										);

										if (done) {
											return (
												<p className="font-mono text-xs text-muted-foreground" key={task.id}>
													{setupActionLabel(task.id)} done
												</p>
											);
										}

										if (active !== undefined) {
											return (
												<Button
													key={task.id}
													size="sm"
													variant="outline"
													onClick={() => {
														runCommand(
															{ type: "cancelOperationalTask", payload: { taskId: active.id } },
															`Cancelled ${setupActionLabel(task.id)}`,
														);
													}}
												>
													Cancel {setupActionLabel(task.id)}
												</Button>
											);
										}

										return (
											<Button
												key={task.id}
												disabled={
													jailed ||
													game.operations.slotsUsed >= 1 ||
													project.setupServerId === undefined
												}
												size="sm"
												variant="secondary"
												onClick={() => {
													runCommand(setupAction(project.id, task.id), setupActionLabel(task.id));
												}}
											>
												{setupActionLabel(task.id)}
											</Button>
										);
									})}
								</div>
								<div className="flex gap-2">
									<Button
										disabled={!project.ready || game.assets.length === 0 || jailed}
										size="sm"
										onClick={() => {
											withPickedServer(project, (serverId) => {
												runCommand(
													{ type: "startProject", payload: { projectId: project.id, serverId } },
													`Started ${project.id} on ${serverId}`,
												);
											});
										}}
									>
										Start
									</Button>
									<Button
										size="sm"
										variant="destructive"
										onClick={() => {
											runCommand(
												{ type: "cancelSetup", payload: { projectId: project.id } },
												`Cancelled setup ${project.id}`,
											);
										}}
									>
										Cancel setup
									</Button>
								</div>
							</div>
						))}
						{served.map(({ customerId, project }) => (
							<div className="flex flex-col gap-2" key={project.id}>
								<ActiveRowCard
									customerId={customerId}
									onRoute={() => {
										withPickedServer(project, (serverId) => {
											if (serverId === project.route?.serverId) {
												return;
											}

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
								<Button
									disabled={jailed || game.assets.length < 2}
									size="sm"
									variant="secondary"
									onClick={() => {
										withPickedServer(project, (serverId) => {
											runCommand(
												{
													type: "duplicateProject",
													payload: { projectId: project.id, destinationServerId: serverId },
												},
												`Duplicating ${project.id} to ${serverId}`,
											);
										});
									}}
								>
									Duplicate this project
								</Button>
							</div>
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
								routeLabel="Resume"
								selectedServerId={pickedServerId(project)}
								serverLabel={routedServerLabel(project)}
								serverOptions={serverOptions}
							/>
						))}
					</div>
					<PanelHeader count={game.assets.length} label="Fleet" tone="info" />
					<div className="grid max-h-[40%] min-h-0 auto-rows-min grid-cols-2 gap-2 overflow-y-auto p-2">
						{game.assets.length === 0 ? (
							<p className="col-span-2 font-mono text-sm text-muted-foreground">No servers</p>
						) : (
							game.assets.map((asset) => {
								const leased = assetTenureKind(asset) === "leased";

								return (
									<div className="flex flex-col gap-1" key={asset.id}>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => {
												setInspectedAssetId(asset.id);
											}}
										>
											Inspect {asset.id}
										</Button>
										<ServerCard
											{...fleetHostProjection(asset)}
											dotClassName={SKU_DOT_CLASS[asset.catalogId]}
											idLabel={`${asset.id} · ${assetTenureKind(asset)}`}
											label={`${SERVER_TIER_LABEL[asset.catalogId]} · ${asset.region}`}
											onRelease={
												leased
													? () => {
															runCommand(
																{ type: "releaseServer", payload: { serverId: asset.id } },
																`Released ${asset.id}`,
															);
														}
													: undefined
											}
											onSell={
												leased
													? undefined
													: () => {
															runCommand(
																{ type: "sellServer", payload: { serverId: asset.id } },
																`Sold ${asset.id}`,
															);
														}
											}
											opexLabel={skuFleetOpexLabel(asset.catalogId, asset.tenure)}
											variant="fleet"
										/>
									</div>
								);
							})
						)}
					</div>
				</section>
				<section
					aria-label="Business"
					className="flex min-h-0 w-[300px] shrink-0 flex-col border-l border-border bg-panel"
				>
					<section aria-label="Server market" className="flex min-h-0 min-w-0 flex-1 flex-col">
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
								const canAffordLease = !jailed;

								return (
									<ServerCard
										canAfford={canAfford}
										canAffordLease={canAffordLease}
										costLabel={skuCostLabel(catalogId)}
										cpuLabel={skuCpuLabel(catalogId)}
										diskLabel={skuDiskLabel(catalogId)}
										dotClassName={SKU_DOT_CLASS[catalogId]}
										gpuLabel={skuGpuLabel(catalogId)}
										key={catalogId}
										label={SERVER_TIER_LABEL[catalogId]}
										leaseLabel={skuLeaseLabel(catalogId)}
										onBuy={() => {
											runCommand(
												{
													type: "buyServer",
													payload: { serverType: catalogId, region: buyRegion },
												},
												`Bought ${SERVER_TIER_LABEL[catalogId]} in ${buyRegion}`,
											);
										}}
										onLease={() => {
											leaseCatalog(catalogId);
										}}
										opexLabel={skuOpexLabel(catalogId)}
										ramLabel={skuRamLabel(catalogId)}
										variant="market"
									/>
								);
							})}
						</div>
					</section>
				</section>
			</main>
			{inspectedAsset !== undefined ? (
				<section
					aria-label="Object inspector"
					className="flex shrink-0 flex-col gap-2 border-t border-border bg-panel p-2"
				>
					<PanelHeader count={1} label="Inventory" tone="info" />
					<p className="font-mono text-xs text-muted-foreground">
						Issue #66 shared-asset identity is incomplete. This drawer reuses the rack card; it is
						not a topology id.
					</p>
					<ServerCard
						{...fleetHostProjection(inspectedAsset)}
						dotClassName={SKU_DOT_CLASS[inspectedAsset.catalogId]}
						idLabel={`${inspectedAsset.id} · ${assetTenureKind(inspectedAsset)}`}
						label={`${SERVER_TIER_LABEL[inspectedAsset.catalogId]} · ${inspectedAsset.region}`}
						opexLabel={skuFleetOpexLabel(inspectedAsset.catalogId, inspectedAsset.tenure)}
						variant="fleet"
					/>
				</section>
			) : null}
			<section
				aria-label="Learning"
				className="flex h-48 min-h-0 shrink-0 flex-col overflow-hidden border-t border-border bg-panel"
			>
				<PanelHeader
					count={game.learning.slotsUsed}
					label="Learning"
					tone="info"
					trailing={
						<span className="font-mono text-xs text-muted-foreground">
							Completed courses vs active enrollments are separate. Issue #66 shared-asset identity
							is incomplete; do not treat Projects and Inventory as the same graph.
						</span>
					}
				/>
				<div className="flex min-h-0 flex-1 gap-2 overflow-x-auto p-2">
					{game.learningCatalog.map((row) => (
						<div
							className="flex w-56 shrink-0 flex-col gap-1 border border-border bg-card p-2 font-mono text-xs"
							key={row.id}
						>
							<p className="font-semibold text-foreground">{row.name}</p>
							<p className="text-muted-foreground">{row.status}</p>
							<p className="text-muted-foreground">
								{String(row.durationHours)}h · {formatters.cents(row.monthlyTuitionCents)}
							</p>
							{row.status === "available" ? (
								<Button
									disabled={jailed}
									onClick={() => {
										runCommand(
											{ type: "enrollLearning", payload: { subject: row.subject } },
											`Enrolled ${row.name}`,
										);
									}}
									size="sm"
								>
									Enroll {row.name}
								</Button>
							) : null}
							{row.status === "active" && row.enrollmentId !== undefined ? (
								<Button
									onClick={() => {
										const enrollmentId = row.enrollmentId;

										if (enrollmentId === undefined) {
											return;
										}

										runCommand(
											{ type: "pauseLearning", payload: { enrollmentId } },
											`Paused ${row.name}`,
										);
									}}
									size="sm"
									variant="outline"
								>
									Pause {row.name}
								</Button>
							) : null}
							{(row.status === "paused" || row.status === "insufficient-funds") &&
							row.enrollmentId !== undefined ? (
								<Button
									disabled={jailed && row.status === "insufficient-funds"}
									onClick={() => {
										const enrollmentId = row.enrollmentId;

										if (enrollmentId === undefined) {
											return;
										}

										runCommand(
											{ type: "resumeLearning", payload: { enrollmentId } },
											`Resumed ${row.name}`,
										);
									}}
									size="sm"
								>
									Resume {row.name}
								</Button>
							) : null}
						</div>
					))}
				</div>
			</section>
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
			hourWorkLabel={hourWorkLabel(project)}
			lastCreditLabel={lastCreditLabel(project)}
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
			serviceStateLabel={serviceStateLabel(project.status)}
			slaLabel={slaShareLabel(windowPpm)}
			slaPercent={slaPercent(windowPpm)}
			slaStatusLabel={slaStatusLabel(windowPpm, targetPpm)}
			slaTone={slaTone(windowPpm, targetPpm)}
			sparkline={sparkline}
			sparklineTarget={sparklineTargetFromPpm(targetPpm)}
			sparklineWarmingLabel={sparkline.length === 0 ? "warming" : undefined}
			targetLabel={slaShareLabel(targetPpm)}
			telemetryLabel="unavailable"
			unassignLabel="PARK"
		/>
	);
}
