# Technology catalog and dependencies

The [design-0.3 balance baseline](balance/index.md) now selects this library and supplies explicit research times, fees, resource baselines, workloads, and policy numbers. The conceptual descriptions below remain useful context; the baseline is the current authored numeric specification. It is not live engine configuration or a playtested final balance. Live Game SKUs stay in engine `src/catalog/` TypeScript until a cutover replaces those modules; do not compile this catalog into a parallel runtime.

## Requirement card semantics

The [editor](infrastructure-editor.md) uses a common Requirements strip without treating every entry as the same entity. Applications/databases/workers require software placement; Payment Gateway Integration attaches to a compatible application; Monitoring combines installation with selected project coverage; replication requires source/standby roles and data readiness; research unlocks use but never installs a capability. Eligibility and preparation are domain-owned, including proposed additions. Extend these semantics with each capability's owning milestone, rather than inventing generic install behavior for unsupported entries.

## Status and reading conventions

This is the authored design catalog, not a claim about existing engine features or a requirement to implement all capabilities in one change. Basic application and database tools being initially available, research unlocking additional capabilities, and email/chat/video/payments as project traits are agreed. The authored catalog and dependencies are the working baseline; implementation and playtesting remain necessary.

Research is business-wide knowledge; installation, configuration, capacity, and coverage remain specific to deployments and projects. A researched technology does not become active everywhere. Project features describe customer requirements; technologies describe how the player can support them.

The research column proposes learning progression for this game, not universal technical prerequisites. Multiple entries mean all are required; “or” means a choice. Every prerequisite names a technology in this catalog. Runtime requirements are separate: researching load balancing does not buy two servers. All deployed software consumes resources; the resource column identifies the main pressure, not the only consumption. Basic connectivity, local storage, and operating-system setup are abstracted into server provisioning.

“Base” means initially available. Nodes should unlock new workloads, a recovery action, an observable diagnostic capability, or a useful capacity trade-off. Entries that fail that test should be merged rather than padded with levels.

## Application and data foundations

| Technology | Research prerequisite | Runtime requirement | Player benefit and main resource pressure |
|---|---|---|---|
| Application Runtime | Base | Server capacity | Runs customer applications and APIs; CPU and memory |
| Relational Database | Base | Server and persistent storage | Structured application data; memory and storage I/O |
| Background Workers | Application Runtime | Worker deployment and customer jobs | Asynchronous processing; CPU |
| Job Scheduler | Background Workers | Defined tasks and worker capacity | Scheduled reports and batch runs; execution windows |
| Message Queue | Background Workers | Broker deployment and storage | Buffers bursts and tracks backlog; memory and storage |
| In-memory Cache | Application Runtime | Cache deployment | Relieves repeated application/database reads; memory |
| Object Storage | Application Runtime | Storage capacity | Uploads, media, datasets, and backup destinations; storage and network |
| Search Engine | Relational Database | Search deployment and indexed source data | Full-text search; memory, CPU, and indexing work |
| Event Streaming | Message Queue | Broker storage and consumers | Sustained event ingestion and replay; network and storage |
| Analytics Database | Relational Database | Dataset and analytical database deployment | Reporting workloads; storage I/O and memory |

## Customer-facing project features

The bounded-queue behavior is agreed in [Gameplay](gameplay.md#demand-and-processing-boundaries): buffers consume memory or storage, reject new work when full, and improve burst tolerance without increasing processing capacity. The Message Queue baseline is specified in the balance package; queue allocation still needs engine verification.

| Technology | Research prerequisite | Runtime requirement | Project feature and operational challenge |
|---|---|---|---|
| Email Delivery | Application Runtime | Delivery service deployment and domain configuration | Transactional email; queue delays and delivery failures |
| Mailbox Hosting | Email Delivery | Mail storage and mailbox service | Hosted inboxes; retention and storage growth |
| Real-time Messaging | Application Runtime | Persistent connection service | Chat and live updates; concurrent connections and memory |
| Payment Gateway Integration | Application Runtime | External provider configuration and application endpoint | Payments; transaction latency and failed callbacks |
| Media Transcoding | Background Workers, Object Storage | Media input, storage, CPU or compatible GPU | Video processing; finite jobs and output sizes |
| Video on Demand | Media Transcoding | Prepared media, storage, and delivery service | Recorded video; bandwidth and playback failures |
| Live Streaming | Application Runtime | Live input and streaming deployment | Live broadcasts; sustained bandwidth and latency |
| Real-time Audio and Video | Real-time Messaging | Signaling and connectivity services; media relay capacity as needed | Calls and conferencing; concurrency and latency |
| Multiplayer Game Server | Real-time Messaging | Customer server software and session capacity | Multiplayer hosting; tick workload and latency |

These technologies support customer-owned applications. Researching payment integration does not create a bank or payment processor. An email feature in a shop and a dedicated mailbox-hosting contract are different uses of related technology.

## Networking and traffic delivery

| Technology | Research prerequisite | Runtime requirement | Player benefit and trade-off |
|---|---|---|---|
| Authoritative DNS | Application Runtime | DNS deployment and zone configuration | Dedicated DNS contracts; query capacity and availability |
| Reverse Proxy | Application Runtime | Proxy deployment and backend | HTTP routing and centralized connection handling; another component to operate |
| Load Balancing | Reverse Proxy | Configured serving targets; multiple targets for distribution benefits | Distributes load; does not create backend capacity |
| Health Checks | Monitoring, Load Balancing | Configured checks and targets | Removes unhealthy targets from routing; detection delay |
| Content Delivery Network | Object Storage, Reverse Proxy | Delivery integration and cacheable content | Reduces origin demand; cache misses and transfer costs |
| Rate Limiting | Reverse Proxy | Limits configured on an endpoint | Protects backend capacity by rejecting excess work; rejected legitimate demand still matters |
| Private Networking | Application Runtime | Participating hosts and network configuration | Private component communication; connectivity failures |

Basic projects can use abstracted endpoint/domain defaults. Operating DNS as a researched capability does not retroactively require every first project to configure the internet. This catalog does not redesign the agreed project-local demand rhythm or approve a new geographic latency formula.

## Observation, recovery, and protection

| Technology | Research prerequisite | Runtime requirement | Player benefit and trade-off |
|---|---|---|---|
| Monitoring | Application Runtime | Installation configured for the project | Detailed metrics, retained project errors, and alerts; collection/storage overhead |
| Quality Checks | Application Runtime | Installed and configured project checks | Reduces software and configuration incident probabilities; does not replace monitoring or prevent hardware/data failures |
| Backup and Restore | Relational Database | Backup destination and restore capacity | Recovery from data loss; backup age and restore work |
| Database Replication | Relational Database | Standby on a different server and synchronization capacity | Ready standby for service continuity; synchronization interruption makes it ineligible for promotion, without transaction-level lag simulation |
| Automatic Failover | Database Replication, Monitoring | Ready standby and failure detection | Automatically promotes a ready standby after primary failure; manual promotion remains available without this technology |
| Automated Restart | Monitoring | Restart policy on a supported service | Recovers restartable failures; cannot fix broken hardware or lost data |

Monitoring includes project error retention and alerts without a second research charge. Replication is not a substitute for backups, and a backup is useful only if restoration can run. Security/credential incidents and release-management mechanics are outside the current catalog.

## Deployment and operational automation

| Technology | Research prerequisite | Runtime requirement | Player benefit and trade-off |
|---|---|---|---|
| Container Runtime | Application Runtime | Compatible host capacity and application image | Repeatable software placement; packaging/setup work |
| Container Orchestration | Container Runtime, Monitoring | Managed hosts and control service; configured Health Checks for automatic unhealthy-instance replacement | Places deployments and prepares replacement application/worker instances on spare compatible capacity; preparation time and control-plane overhead |
| Autoscaling | Container Orchestration, Load Balancing | Metrics, credit, and compatible capacity; Health Checks for replacement workflow | Adds/removes instances and automatically leases replacement capacity when existing hosts cannot fit it; readiness time and recurring cost |

Automation does not imply trained staff, and staff do not require the full automation tree. The later employee design determines who performs preparation, reviews alerts, and chooses or executes responses.

## AI and computational workloads

| Technology | Research prerequisite | Runtime requirement | Player benefit and trade-off |
|---|---|---|---|
| Batch Computing | Job Scheduler | Customer jobs and CPU worker capacity | Finite computations; deadlines and job queues |
| Checkpointing | Batch Computing | Supported computational workload and writable checkpoint storage | Periodically saves job progress; consumes storage and processing/I/O capacity |
| GPU Computing | Background Workers | Compatible GPU-equipped server and runtime | Accelerated customer workloads; GPU capacity and memory |
| Model Serving | Application Runtime | Customer model and compatible CPU or GPU runtime | AI inference; latency, throughput, and model memory |
| Model Training | Batch Computing | Customer training workload, dataset, and compatible compute | Training jobs; long runtimes and checkpoints |
| Vector Search | Search Engine | Customer vectors and index storage | Similarity search; memory and indexing load |
| Distributed Computing | Batch Computing, Private Networking | Multiple workers and partitionable customer workload | Larger compute jobs; coordination and network overhead |
| Distributed GPU Training | Model Training, GPU Computing, Distributed Computing | Multiple compatible GPU workers and dataset access | Larger training contracts; synchronization bottlenecks |

GPU hardware is distinct from researching its software support. CPU-compatible inference and training should not require GPU research solely to lengthen the tree; customer model requirements can make GPU support mandatory. The customer owns model quality and scientific/business results; the player is responsible for infrastructure delivery.

## Example project compositions

Dependencies below illustrate deployments, not additional research nodes. Suggested enhancements are optional until a contract requires them.

| Project | Required feature combination | Useful later enhancements |
|---|---|---|
| Relative's appointment site | Application Runtime + Relational Database | Backup and Restore; Email Delivery for reminders |
| Online shop | Application Runtime + Relational Database + Payment Gateway Integration + Email Delivery | Cache, Search Engine, Monitoring, Load Balancing |
| Customer support platform | Application Runtime + Relational Database + Real-time Messaging | Mailbox Hosting, Monitoring |
| Recorded course platform | Application Runtime + Relational Database + Video on Demand | CDN, payments, monitoring |
| Live event platform | Live Streaming + Application Runtime | Chat, CDN where compatible, load balancing |
| Business mailbox service | Mailbox Hosting | Monitoring, backups, protected access |
| DNS hosting | Authoritative DNS | Monitoring and redundant serving instances |
| AI inference API | Model Serving + Application Runtime | GPU Computing when required, rate limits, autoscaling |
| Training contract | Model Training + suitable dataset storage | GPU or distributed training as the workload requires |
| Scientific computation | Batch Computing | Distributed Computing and checkpoint recovery |

## Version-one scope

The current catalog has **43 entries: 31 for version one (two base tools and 29 research unlocks), and 12 expansion candidates**. The `release` field in [baseline.json](balance/baseline.json) is authoritative for membership. Expansion candidates are disabled by default and are not milestone 9 completion requirements. Tables above describe both groups; the following list identifies every expansion entry.

Expansion candidates: Search Engine, Event Streaming, Analytics Database, Real-time Audio and Video, Multiplayer Game Server, Content Delivery Network, Rate Limiting, Private Networking, Model Training, Vector Search, Distributed Computing, and Distributed GPU Training. Their existing estimates are retained for exploration, not a release promise. Expansion-only projects, demand and finite jobs carry the same release marker and cannot enter version-one offers or required verification coverage.

Version one keeps distinct decisions: cache versus memory cost; queue versus bounded waiting; email/chat/media/DNS/inference versus specialized capacity; backups/checkpoints versus lost progress; monitoring versus uncertainty; and replication/automation versus spare capacity and rent. Application Runtime and Relational Database start available. Research permits a capability; it does not install software or guarantee a matching contract.

Eighteen entries were removed from the numeric catalog rather than left as mandatory empty unlocks:

| Removed group | Reason and retained behavior |
|---|---|
| Document Database, Data Pipeline | No separate version-one contract or operational choice beyond the retained database/worker paths |
| Push Notification Delivery, Webhook Delivery, Identity Provider Integration | No distinct agreed delivery or authentication mechanics; ordinary application functionality remains abstracted |
| TLS Termination, API Gateway | Endpoint defaults and retained proxy/load-balancer behavior cover the agreed choices; no certificate administration or separate gateway policy loop |
| Centralized Logging, Distributed Tracing, Point-in-Time Recovery | No defined additional investigation or recovery granularity beyond Monitoring and Backup and Restore |
| Firewall, Web Application Firewall, DDoS Protection, Secrets Management | Attack and credential incident families are not part of the agreed game |
| Deployment Pipeline, Deployment Rollback, Rolling Deployment, Infrastructure as Code | No customer release lifecycle or artifact-history mechanic; ordinary setup, project duplication and orchestration remain available |

These removed entries have no research prices, dependencies or separate demand types. Reintroduction requires a concrete player decision and product design, not just a real-world technology name. Architecture still supports all resource dimensions and workload families; reducing release breadth does not require a temporary CPU-only engine.

## Technical grounding

The edges above are game-design proposals. Real systems inform their names and consequences: [PostgreSQL standby documentation](https://www.postgresql.org/docs/17/warm-standby.html) distinguishes replication and standby operation, while [point-in-time recovery documentation](https://www.postgresql.org/docs/17/continuous-archiving.html) explains recovery using base backups and archived changes. [Kubernetes networking documentation](https://kubernetes.io/docs/concepts/services-networking/) describes service and traffic-delivery concepts. [MDN's signaling guide](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling) explains signaling and connectivity services for real-time calls. These references do not prescribe the game's research order.
