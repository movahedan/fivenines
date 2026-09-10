export type GameView = "projects" | "workspace" | "inventory" | "learning" | "finances";
export type DrawerType = null | "offers" | "contract" | "acquisition" | "impact" | "inspector-mobile";
export type WorkspaceTab = "status" | "performance" | "finances";
export type ServiceState = "absent" | "queued" | "installing" | "stopped" | "running" | "failed" | "configured";
export type ServerState = "healthy" | "failed" | "powered-off" | "repairing";
export type ProjectState = "setup" | "live" | "degraded" | "failed" | "ended";
export type JourneyStep =
  | "empty"
  | "offer-list"
  | "contract-review"
  | "accepted-no-server"
  | "acquiring"
  | "server-acquired"
  | "app-installing"
  | "db-installing"
  | "configuring"
  | "ready-to-start"
  | "live"
  | "live-degraded"
  | "live-incident";

export interface ServiceInstance {
  id: string;
  name: string;
  shortName: string;
  type: "app-runtime" | "relational-db" | "monitoring" | "load-balancer" | "cache" | "worker";
  state: ServiceState;
  progress?: number;
  project: string;
  config?: Record<string, string>;
}

export interface ServerSpec {
  id: string;
  name: string;
  type: string;
  label: string;
  cores: number;
  ramMiB: number;
  diskGiB: number;
  networkMbps: number;
  buyPrice: number;
  rentPerDay: number;
  owned: boolean; // false = leased
  state: ServerState;
  services: ServiceInstance[];
  cpu: number;
  ram: number;
  disk: number;
  net: number;
  sharedProjects: string[];
}

export interface Project {
  id: string;
  customer: string;
  customerTrust: number;
  customerHatred: number;
  name: string;
  type: string;
  templateId: string;
  state: ProjectState;
  sla: number;
  weeklyFee: number;
  usageFee: number;
  advance: number;
  setupAllowanceHours: number;
  setupElapsedHours: number;
  servers: string[];
  demandPerHour: number;
  completedThisHour: number;
  failedThisHour: number;
  earned: number;
  costs: number;
  receivables: number;
}

export const SERVERS: Record<string, ServerSpec> = {
  "server-a": {
    id: "server-a",
    name: "Server A",
    type: "general-small",
    label: "general-small",
    cores: 2, ramMiB: 2048, diskGiB: 64, networkMbps: 100,
    buyPrice: 240, rentPerDay: 2.5,
    owned: true,
    state: "healthy",
    services: [],
    cpu: 7, ram: 41, disk: 18, net: 2,
    sharedProjects: [],
  },
  "server-b": {
    id: "server-b",
    name: "Server B",
    type: "general-medium",
    label: "general-medium",
    cores: 4, ramMiB: 8192, diskGiB: 256, networkMbps: 500,
    buyPrice: 650, rentPerDay: 6,
    owned: false,
    state: "healthy",
    services: [],
    cpu: 0, ram: 0, disk: 0, net: 0,
    sharedProjects: [],
  },
};

export const MAYA_PROJECT: Project = {
  id: "maya-appointments",
  customer: "Maya Chen",
  customerTrust: 70,
  customerHatred: 0,
  name: "Maya's Appointments",
  type: "Appointment Booking Site",
  templateId: "appointment-site",
  state: "setup",
  sla: 80,
  weeklyFee: 80,
  usageFee: 0,
  advance: 80,
  setupAllowanceHours: 24,
  setupElapsedHours: 0,
  servers: ["server-a"],
  demandPerHour: 120,
  completedThisHour: 114,
  failedThisHour: 6,
  earned: 80,
  costs: 17.77,
  receivables: 0,
};

export const OFFER = {
  id: "offer-maya-1",
  customer: "Maya Chen",
  customerInitials: "MC",
  customerRelation: "Acquaintance",
  customerTrust: 70,
  projectName: "Maya's Appointments",
  projectType: "Appointment Booking Site",
  description:
    "Maya runs a physiotherapy practice and needs a simple appointment booking system online. Low traffic, but she needs it reliable during office hours.",
  sla: 80,
  weeklyFee: 80,
  usageFee: 0,
  advance: 80,
  setupAllowanceHours: 24,
  cancellationTerms: "Full refund of advance if setup is not complete within the allowance period.",
  refundBands: [
    { label: "> 1–2× allowed failures", pct: 10 },
    { label: "> 2–5× allowed failures", pct: 25 },
    { label: "> 5–10× allowed failures", pct: 50 },
    { label: "> 10× allowed failures", pct: 100 },
  ],
  requiredTechnologies: ["Application Runtime", "Relational Database"],
  rootMix: "80% page reads · 20% record writes",
  demandPerHour: 120,
  rhythmProfile: "Office hours (weekdays)",
  expiresIn: "47h",
};

export const SERVER_OPTIONS = [
  {
    id: "general-small",
    name: "general-small",
    cores: 2, ram: "2 GiB", disk: "64 GiB", network: "100 Mbps",
    buyPrice: 240, rentPerDay: 2.5,
    recommended: true,
    note: "More than sufficient for this workload",
  },
  {
    id: "general-medium",
    name: "general-medium",
    cores: 4, ram: "8 GiB", disk: "256 GiB", network: "500 Mbps",
    buyPrice: 650, rentPerDay: 6,
    recommended: false,
    note: "Excess capacity for current demand",
  },
];

export const DEMAND_HISTORY = [18, 22, 19, 25, 30, 48, 75, 98, 112, 120, 118, 115, 108, 104, 102, 116, 120, 118, 92, 65, 38, 22, 18, 16];

export const BILLING_HISTORY = [
  { label: "Current period", earned: 40, costs: 8.9, balance: 31.1, slaActual: 95.2, slaTarget: 80 },
  { label: "Previous period", earned: 80, costs: 17.77, balance: 62.23, slaActual: 96.4, slaTarget: 80 },
];

export const ACTIVITY_EVENTS = [
  { id: "e1", time: "11:02", category: "financial", icon: "💰", text: "Advance payment of ♦80 received from Maya Chen", link: null },
  { id: "e2", time: "11:00", category: "operational", icon: "⚙️", text: "Application Runtime installation queued on Server A", link: "server-a" },
  { id: "e3", time: "10:55", category: "customer", icon: "🤝", text: "Contract accepted — Maya's Appointments", link: "maya-appointments" },
];

export const TECHNOLOGIES = [
  {
    id: "app-runtime",
    family: "Application",
    name: "Application Runtime",
    status: "unlocked",
    installHours: 2,
    prereqs: [],
    description: "Runs web application processes. Required for all web-serving projects.",
  },
  {
    id: "relational-db",
    family: "Database",
    name: "Relational Database",
    status: "unlocked",
    installHours: 2,
    prereqs: [],
    description: "Persistent structured data storage. Required for record writes and stateful applications.",
  },
  {
    id: "monitoring",
    family: "Observability",
    name: "Monitoring",
    status: "available",
    installHours: 1,
    prereqs: ["app-runtime"],
    researchHours: 4,
    monthlyCost: 8,
    description: "Collects per-component metrics, retains error history, and enables diagnosis. Coverage is project-scoped.",
  },
  {
    id: "load-balancer",
    family: "Routing",
    name: "Load Balancer",
    status: "available",
    installHours: 1,
    prereqs: ["app-runtime"],
    researchHours: 6,
    description: "Distributes incoming demand across multiple application instances.",
  },
  {
    id: "in-memory-cache",
    family: "Database",
    name: "In-memory Cache",
    status: "locked",
    prereqs: ["relational-db"],
    researchHours: 8,
    description: "Accelerates read-heavy workloads. Serves up to 60% of eligible reads without database work.",
  },
  {
    id: "db-replication",
    family: "Database",
    name: "Database Replication",
    status: "locked",
    prereqs: ["relational-db"],
    researchHours: 12,
    description: "Maintains a live standby copy for manual or automatic failover.",
  },
  {
    id: "automated-restart",
    family: "Reliability",
    name: "Automated Restart",
    status: "locked",
    prereqs: ["monitoring"],
    researchHours: 10,
    description: "Automatically restarts supported services after a software incident.",
  },
  {
    id: "backup-restore",
    family: "Data",
    name: "Backup and Restore",
    status: "locked",
    prereqs: ["relational-db"],
    researchHours: 8,
    description: "Scheduled backups with three retained copies. Enables data restore after corruption.",
  },
];

export const COURSES = [
  {
    id: "sys-admin",
    name: "System Administration",
    currentLevel: 0,
    maxLevel: 5,
    effect: "Reduces configuration risk (×0.9 per level)",
    nextTuition: 20,
    nextDurationWeeks: 1,
  },
  {
    id: "deployment",
    name: "Deployment Automation",
    currentLevel: 0,
    maxLevel: 5,
    effect: "Reduces installation/configuration work (×0.92 per level)",
    nextTuition: 20,
    nextDurationWeeks: 1,
  },
  {
    id: "incident",
    name: "Incident Response",
    currentLevel: 0,
    maxLevel: 5,
    effect: "Reduces diagnosis and repair work (×0.9 per level)",
    nextTuition: 25,
    nextDurationWeeks: 1,
  },
  {
    id: "performance",
    name: "Performance Tuning",
    currentLevel: 0,
    maxLevel: 5,
    effect: "Reduces application CPU and GPU work (×0.95 per level)",
    nextTuition: 35,
    nextDurationWeeks: 1,
  },
  {
    id: "data-recovery",
    name: "Data Recovery",
    currentLevel: 1,
    maxLevel: 5,
    effect: "Reduces restore preparation work (×0.9 per level)",
    nextTuition: 32,
    nextDurationWeeks: 2,
  },
];
