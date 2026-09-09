# Gameplay

## The intended loop

The player receives an opportunity, understands the customer's requirements, accepts work they can deliver, prepares the required system, and operates it under the agreed commitment. Revenue supports operating costs and investment. A track record opens further opportunities.

Within that loop, provisioning and configuration take work. Later, operations staff should be able to perform that work for the player. The player handles one attention-requiring operational task at a time; additional tasks wait in a work queue. Operational durations have delegated defaults in [Contracts and time](balance/contracts-and-time.md); employee hiring remains deferred.

## Starting small

The opening experience should contain a small number of simple projects from relatives or acquaintances. An unknown provider should not start with a large board of professional contracts. Early customers tolerate mistakes and give the player room to learn how infrastructure, money, and service quality relate.

Reputation should gradually influence the arrival rate and kinds of projects offered. The discussed service-level progression was approximately 80%, 90%, 95%, 98%, 99%, and 99.9%. The delegated offer tiers and measurement baseline are recorded in [Customers and offers](balance/customers-and-offers.md) and [Contracts and time](balance/contracts-and-time.md).

Reputation is public business standing. Trust and hatred are separate per-customer relationship measures, retained as inputs to the customer's willingness to wait during setup. Successful delivery gradually raises reputation; customer departure caused by poor service lowers it. Accepting a contract alone grants no reputation. Reputation affects offer volume and level. Trust grows slowly with good service and falls with broken commitments or unannounced outages. Hatred rises with inconvenience and declines during calm periods. Numerical changes use the delegated customer policy. No prestige reset mechanic is approved.

## From acceptance to operation

Acceptance and service activation must become distinct. A project may require an application, a database, and the configuration that allows them to work together. They may share a server or run on separate servers. Not every workload necessarily needs the same components. The first project is a simple appointment-booking site for an acquaintance: one application and one database on one server, low demand, and an 80% SLA target. It requires no email, payments, or new research.

The preparation flow is to select a server, install the application and database, and configure their connection. Installation and configuration consume simulation time; selections and visual canvas layout are immediate. Enable Start service once the required components are ready. Task duration depends on the task and technology, with exact values balanced against simulation speed.

The player performs one operational task requiring attention at a time, with subsequent tasks queued. Running services continue to process demand independently. Cancelling an operational task preserves completed preparation so it can later resume rather than restart from zero. This work queue is distinct from simulated request and job queues.

The contract must explain when obligations and revenue begin. Payment at acceptance and the right to withdraw after excessive setup delay are agreed below. Activation is an explicit player action: Start service begins live demand, SLA obligations, and the first weekly billing period. Before activation, the setup commitment and customer withdrawal rules apply. Preparing a new project must not be confused with taking an existing service offline.

## Account access and game state

Playing requires login from the start, including project preparation. Guest play and migration of guest progress into an account are excluded. This replaces the earlier proposal to require authentication only at activation.

The target architecture keeps authoritative game state on the server and delivers game values and state updates to the client through SSE. Device-side game storage is limited to a snapshot and player commands not yet sent. The snapshot is a local copy, not a separate authoritative saved game. Player commands are distinct from simulated customer demand and its queues.

The engine currently runs in the frontend to support engine development. Keep that development arrangement for now; the server/SSE direction does not request an immediate migration. Snapshot format and synchronization, command submission, and reconnect handling belong in technical plans. This decision does not introduce continuous simulation during absence; away-time progression remains deferred.

## Reviewing a contract

The New project action opens available offers in a bottom drawer on both mobile and desktop. Selecting an offer reveals its complete details and contract in that drawer, where the player explicitly accepts it. The first interaction must make it clear that the player is entering an agreement, not merely adding a project to a list.

Emphasize the important terms in bold: **payment due at acceptance**, **recurring and usage charges**, **required service level or delivery commitment**, **setup cancellation and refund conditions**, and **the compensation schedule**. Display the relevant measurement period and resource/capability requirements in understandable language. Distinguish delayed setup from failing an obligation after service starts.

The modal must remain readable and scrollable on mobile, with clear accept and dismiss actions. Dismissing it must not accept the project or collect payment. Do not expose internal policy class names or raw engine encodings as contract copy.

## Demand patterns and advance notice

Demand variation is part of the operational challenge. Early projects should have low, relatively predictable demand and mild surprises. As the business progresses, projects can introduce busier periods and more pronounced unexpected increases, with patterns appropriate to their workload rather than treating every project as web traffic.

Project characteristics should explain these patterns. Each project has its own region and local time, which determine its daily demand rhythm together with its workload characteristics. The player's projects can be in different regions and have different busy hours. The prototype already models category-specific rhythms, regional time offsets, scheduled campaigns, susceptibility to larger spikes, and random variation. Retain this foundation while extending it to the broader workload catalog; existing categories and multipliers are not final balance commitments.

Customers should announce planned demand increases, such as campaigns, in advance so the player can prepare. Forecasts are approximate, and unplanned variation remains possible. Use a shared Activity Feed with distinct event types for campaign news and operational alerts. Planned campaign notices include their time window and approximate demand increase, with advance notice; lead times use the observation baseline. This is an intended player communication feature, not a claim that the existing demand simulation already delivers those notices.

### Demand and processing boundaries

Each project has its own demand generator, referred to as DemandEngine in the design discussion. It generates demand from project characteristics, local time, and demand events. It does not manage the project's infrastructure graph, execute work, or decide how much demand the infrastructure successfully serves.

Generated demand is governed by rules specific to its request or job type. Each type defines its waiting policy and deadline or timeout semantics; successful completion must be evaluated according to that type's work. A payment request and a long-running computational job must not inherit one universal waiting rule. Demand generation remains independent of whether the system can process the resulting work.

The discussion's “demand packet” means a unit or group of simulated work, not a network packet. Use request, job, or demand batch as appropriate. A deadline or timeout on demand is distinct from the contract's rules for aggregating outcomes and calculating compensation.

Process demand in batches grouped by demand type, arrival tick, and compatible processing characteristics. Preserve distinct arrival groups when work waits across ticks, so aggregate processing does not erase waiting age. For example, 30 requests remaining from the previous tick and 80 new requests form a queue of 110 requests but remain two arrival groups. Work with different rules or processing characteristics must not be merged solely because it arrived in the same tick. Individual request objects are not required by this model.

Compare queued and newly arrived work against available processing capacity in compatible work units to determine how much can advance and how much remains. Apply this reasoning at the relevant processing stage and resource constraint; spare CPU cannot substitute for missing GPU or database capacity. Remaining work waits or fails according to its demand type. Aggregate queue volume alone does not establish timely completion: retain group age and any progress needed to evaluate waiting and deadlines.

Within each project's allocated share, process older ready demand batches before newer ones competing for the same resource. This automatic FIFO policy uses arrival age; it does not let work waiting on a dependency block otherwise ready work. Batches whose waiting allowance has expired leave the queue according to their demand-type rules. Expiration of a waiting allowance is distinct from a delivery deadline that permits continued execution with late-delivery compensation. Exact within-tick expiration boundaries and tie-breaking between equally old batches remain technical design details.

Queues have finite capacity. Retaining waiting demand consumes memory or storage according to the technology used. When a queue is full, reject incoming demand according to its demand-type rules rather than evicting previously accepted work to make room. Existing work remains subject to its normal waiting and expiration rules. Message Queue technology can improve burst tolerance by buffering work, but does not create processing capacity. Exact per-unit queue resource consumption remains technical design and balance work; partial admission is specified below.

In-memory queues lose their waiting work when the hosting process fully stops or its server powers off. Durable queues retain work recorded on disk and can resume after restart, provided the stored data remains intact. Restarting does not reset arrival age or extend waiting allowances; restored work is still subject to its original demand-type rules. Durability does not guarantee survival of storage loss or corruption, and it does not by itself preserve partially executed work. Recovery of in-progress operations remains a separate design decision.

Retries are excluded from the demand-processing model. Failed, rejected, or expired work is not automatically resubmitted; do not introduce retry counts, backoff schedules, or retry-generated load. Continuing queued work, including restoring unexpired durable waiting work after restart, is continuation of accepted work rather than a retry.

Each server applies automatic proportional allocation to its shared resource budgets. Competing demand includes both earlier queued work that is ready and newly arrived ready work, expressed in the relevant resource's work units. Players cannot set resource shares or priorities. If a bottleneck can supply half the competing resource demand, each project's corresponding share is half its demand. Capacity shortfall is distributed proportionally rather than assigned by project iteration order; financial consequences still follow each contract. Application, database, and other stages on the same server consume the same budget, not separate copies of its capacity. The project graph describes required work; allocation belongs to the server's resource policy.

Each operation has a resource-requirement vector covering CPU work, GPU work, memory, network transfer, and storage operations as applicable. Resources are not interchangeable. CPU throughput reflects core count and per-core capability, constrained by workload parallelism. GPU throughput depends on workload compatibility and available GPU memory. RAM is occupied capacity; running work retains its allocation until completion or stop. Network has a transfer rate; storage has capacity, transfer rate, and operation-rate limits. Exact coefficients remain balance and technical design work, without claiming real-world benchmark accuracy.

Queue limits come from actually available memory or storage, and retained batches consume those shared resources. Admit the portion of a batch that fits and reject the remainder under its demand-type rules. Split batches by whole requests or jobs, not fractions of an individual request or job.

Customer-visible success requires completion of all essential operations for that demand type. Optional follow-up work can fail without reversing an already completed primary outcome. Internal operations do not multiply the number of customer requests. Response-time estimates include waiting and required processing; parallel essential branches join on completion rather than having their elapsed times added together.

Dependent processing stages may advance within the same simulation tick when their dependencies and available resources permit. Traversing an application, database, or other component must not automatically add a whole tick of latency per node. This does not imply instantaneous completion or unlimited work within a tick: processing time, waiting, and shared capacity still constrain progress. Use aggregate work and resource budgets within the game tick; do not introduce a millisecond event timeline. There are no internal subticks. Exact aggregate solving and latency estimation remain technical design work.

## Economic difficulty

Early projects should give the player room to learn and recover from mistakes. Sound management should produce understandable profit, with server investments paying back gradually through operation.

Buying more capacity than needed reduces margins through equipment and operating costs. Accepting more work than the available infrastructure and preparation capacity can support should put service quality and profit under pressure. These consequences should follow the player's commitments and resource use.

Hardware specifications should help the player understand which workloads a server suits. The catalog must not contain deliberately misleading trap options. Starting funds, prices, and analytic profitability examples use the delegated [Hardware and economy](balance/hardware-and-economy.md) baseline; they still require runtime playtesting.

## Financial distress

Negative cash creates debt, not an automatic game over. Subsequent income reduces that debt. The player can recover by selling owned equipment, releasing leased servers, and reducing operating costs. Permanent `jailed` behavior is excluded from the target model.

A defined credit limit governs restrictions. Debt above that limit blocks accepting new contracts and buying or leasing additional infrastructure. Operations on existing infrastructure and cost-reduction actions remain available. Restrictions lift automatically when debt returns within the limit. There is no automatic terminal bankruptcy state; starting over is the player's choice. The numeric credit limit is specified in the balance baseline. Current engine behavior is not changed by this document.

## Cash flow and payment timing

Revenue earned and cash available to spend are distinct. Usage-based revenue accrues as a receivable and is collected daily, while server operating costs are paid hourly. This timing creates a cash-flow constraint even when a contract is profitable overall.

The first fixed recurring project fee is collected when the project is accepted, before provisioning and service activation. Subsequent fixed fees are collected in advance for their billing periods, rather than in arrears at period close. Each project has its own weekly billing schedule beginning at activation. The payment collected at acceptance covers that first full service period; it is not charged again at activation. Subsequent fixed fees are collected at the start of each following period.

If setup takes too long, the customer must be able to promptly withdraw from the contract and recover the advance payment. Acceptance therefore creates a delivery obligation as well as bringing in cash. This pre-launch cancellation is distinct from service credits for poor performance after launch.

The customer decides when to withdraw based on their trust in the provider, the player's public business reputation, and their hatred toward the provider. Their influence on this decision must be ordered: trust first, reputation second, hatred third. The delegated patience policy implements this importance ranking; do not add three raw scores together as a substitute. It does not establish the priority of these measures in unrelated mechanics.

Each contract specifies a base preparation allowance. After that allowance, customer patience decreases until withdrawal, influenced by trust, reputation, and hatred in the agreed order. Do not make a new random cancellation draw every tick. Withdrawal refunds the entire advance; insufficient cash creates debt. Preparation tasks for that project stop, while acquired equipment remains. Allowance values, scales, and coefficients use the delegated customer policy. Post-launch termination follows the separate settlement rules below. These are target rules, not descriptions of the current prototype.

## Contract compensation

### Online service commitments

The following starting balance is approved for online service contracts. Each contract specifies its availability target and measurement period. Compensation is calculated at period close against the total service charges for that period: fixed fee plus usage charges. Equipment purchases and unrelated contracts are excluded.

Severity is the actual failure fraction divided by the failure fraction allowed by the contract. For a 99% target, the allowed failure fraction is 1%; an actual 3% failure fraction is three times the allowance.

| Actual failure relative to allowance | Refund of period service charges |
|---|---:|
| Within allowance, including its boundary | 0% |
| Above allowance, up to and including 2 times | 10% |
| Above 2 times, up to and including 5 times | 25% |
| Above 5 times, up to and including 10 times | 50% |
| Above 10 times | 100% |

A complete service outage for the entire measured period receives a full refund, including on forgiving contracts where the ratio alone would produce a smaller refund. For the request-based model, all demanded requests failing for the period constitutes complete failure; no-demand hours are neither successful nor failed requests. No demand alone is not proof of a complete outage.

Refunds are capped at that contract's service charges for the period. The amount is debited immediately at settlement; insufficient cash creates debt rather than eliminating the customer's entitlement. Trust, reputation, and hatred do not change the compensation amount. They affect relationship behavior, including patience, separately.

Show the compensation schedule before acceptance and an estimate during service: what would be refunded if the period closed now. The estimate is informational, not another settlement. Exact integer arithmetic belongs in the implementation plan. Do not offer 100% SLA targets; demanding targets such as 99.999% retain a nonzero error allowance. Actual measured performance may still reach 100%.

### Other workload commitments

Computational jobs and other contract types should follow the same general compensation structure where practical. The preferred direction is a shared severity-to-refund schedule and settlement rules, with an overridable evaluation of the relevant obligation. A deadline-based job must not be forced into request-availability arithmetic.

For a computational job, the approved starting model specifies a delivery deadline and a reference lateness interval in the contract. Severity is elapsed time past the deadline divided by that interval. Delivery on time receives no refund; any positive delay receives at least a 10% refund. Positive delay up to and including 2 reference intervals receives 10%, above 2 through 5 receives 25%, above 5 through 10 receives 50%, and above 10 receives 100%. The interval measures severity; it is not a penalty-free grace period.

For example, with a one-hour reference interval, delivery three hours late results in a 25% refund. The contract UI should present the resulting delay ranges and refunds directly, keeping ratios and policy internals out of the player's main workflow. Clear presentation must make the applicable delay range and refund understandable without requiring the player to calculate severity ratios.

Finite jobs charge a fixed fee in advance at acceptance and have no weekly billing cycle. Their contract states the delivery deadline and reference lateness interval, with that interval scaled to the agreed job duration; the reference interval uses the delegated contract baseline. Settle lateness compensation at delivery using the agreed bands and the fixed job fee. Abandonment or customer termination refunds the full fee. Reaching the 100% lateness-refund band automatically ends the contract with a full refund, preventing indefinite unfinished work. Refund the fee only once. Initial setup withdrawal remains a separate cause of cancellation.

### Contract families and post-launch departure

Continuous services, including web, chat, email, DNS, streaming, and AI inference, commit to the share of demand completed successfully and on time under each demand type's rules. Finite jobs, including training, rendering, and batch computation, commit to completing specified work by a deadline. Both use the shared compensation structure with their own obligation evaluation. Customer business outcomes and scientific or model quality remain the customer's responsibility.

For an active continuous-service contract, dissatisfaction accumulates under poor service and gradually decreases during healthy operation. Minor isolated incidents do not automatically trigger departure. Trust, reputation, and hatred affect customer tolerance; coefficients and thresholds use the delegated customer baseline and require playtesting. This does not extend the setup-specific influence ranking to all other mechanics.

When the customer leaves, close the current billing period immediately. Refund the unused time-proportional portion of its prepaid fixed fee, then apply service-quality compensation to the elapsed portion of the fixed fee plus actual usage charges. Do not refund the same amount twice. The contract generates no further revenue, and infrastructure is not automatically sold or released. Insufficient cash for refunds creates debt under the financial rules.

## Shared infrastructure and capabilities

### Server operating costs and power

A powered-on server incurs maintenance and electricity costs even when idle. Owned servers can be sold for a portion of their purchase price, including while faulty and without repairing them first. Only hardware faults discount resale value. Software, configuration, and data faults do not reduce the server's resale price; these do not affect its hardware value to the next owner. Leased servers are released to end their rental charges. Resale is 80% of recorded purchase price for healthy hardware and 60% for hardware-faulty servers.

The player can fully power off owned servers. This is distinct from leaving a running server idle, removing a deployment, or selling the hardware. Powered-off servers cannot serve their workloads, so affected projects follow the downtime and communication rules. Powering off does not erase ownership or installed software/data, and a power cycle must not automatically count as repairing a fault.

Fully powered-off owned servers incur no hourly operating costs: both electricity and maintenance charges stop. Power-on is immediate and has no separate fixed startup fee; normal operating charges resume at power-on. A leased server continues to incur rent while powered off. Software service readiness may follow hardware power-on and is distinct from it.

### Shared resources

Servers belong to the player's business and may host components from multiple projects. Each project screen shows the relevant use of that infrastructure; showing the same server in two screens does not duplicate its capacity or cost.

Installed software consumes resources, and projects sharing a server compete for its finite capacity. CPU, memory, network, and GPU must be represented as meaningful resources. GPU support is an agreed addition to the product direction, not an existing engine capability. Units and resource costs have a delegated hardware/demand baseline; contention and compatibility must be implemented and verified by the aggregate solver.

Resource shortages should have workload-appropriate consequences, such as slower computational jobs or degraded online service. Server options should offer useful specializations in compute, memory, or GPU capacity; the most expensive option is not necessarily the best fit. Before installation, show approximate resource requirements and available capacity so the player can make an informed choice. The hardware and demand catalogs supply the authored resource model; the solver still requires implementation evidence.

Capabilities such as monitoring have project-specific coverage even when their software runs on shared servers. Two projects can have separate installations on the same server. Their resource consumption and operational effects must be attributable to the appropriate installation.

Basic resource consumption is always available as a brief textual summary beneath the server's software. Installed monitoring provides much more detailed resource measurements, retains project errors for the customer, and raises alerts. These are functional capabilities, not merely a more detailed visual theme. Configure monitoring coverage for specific components of the project. One monitoring installation can cover multiple selected components of that same project across different servers; a separate installation per instance is not required. Resource consumption grows with the collected data, while the installation retains its own hosting and readiness state. Failure of monitoring alone does not stop the monitored application. Existing records remain subject to their normal storage/retention rules, but the unavailable collector produces no new detailed history, diagnoses, or alerts for its coverage. Basic server status remains visible, including a red indicator for a down server. Do not emit a dedicated alert, notification, or Activity Feed warning that monitoring itself is down; the player must notice through status views. Missing monitoring intervals remain missing and are not automatically backfilled. Cross-server coverage does not grant coverage of other projects. Show resource usage, queue state, successes and errors, and latency. Provide default alert thresholds and group repeated alerts for the same problem. Retain error records for the same window as metric history. Thresholds and Activity delivery use [Observation](balance/observation.md). Monitoring for one project does not automatically cover other projects sharing its server.

Research is intended to unlock the ability to use technology, rather than apply an unexplained revenue multiplier. Installation, project policies, and standalone infrastructure assets are distinct ways a capability can be delivered. Their progression and costs use the delegated technology baseline.

## Research and project features

See the [technology catalog](technology-catalog.md) for the delegated design library, separate research/runtime dependencies, and example compositions. Catalog inclusion does not imply a completed runtime implementation or approve new incident families.

The basic application and database tools needed to launch the first project are available from the start. Research subsequently unlocks technologies needed for additional project features and operational capabilities. Unlocking technology does not install or configure it for a project; that preparation remains separate work.

Project features are explicit requirement traits. Email, chat, video streaming, and payments each require research into the relevant supporting technology before the player can provide that capability. A project may combine several such features. The player provides and operates their supporting infrastructure; the customer still owns the application and its business outcome.

| Project feature or operational capability | Example supporting technology and purpose |
|---|---|
| Email | Email server technology for sending or receiving messages |
| Chat | Real-time messaging technology for persistent client communication |
| Video streaming | Media streaming technology for delivering video |
| Payments | Payment gateway integration technology for supporting transaction flows |
| Monitoring | Detailed resource visibility, retained project errors, and alerts |
| Backup | Backup and restore technology for recovering retained data |
| Load balancing | Traffic distribution across serving infrastructure |

These examples establish recognizable feature-to-technology relationships, not a requirement that every feature be a separate physical server. The technology and balance catalogs specify the authored prerequisites, research effort, costs, and resource profiles. Email as a feature within a larger application can coexist with a dedicated email-service project.

## Workloads and commitments

The following are proposed examples for designing contracts, not an implemented service catalog.

| Workload | Possible operational commitment | Customer-owned outcome |
|---|---|---|
| Online application | Availability and response time | Sales or adoption |
| Model inference | Serving capacity and latency | Correctness of model output |
| Model training | Resources and completion of an agreed run | Model quality |
| Batch computation | Completing a defined amount of work by a deadline | Value of the result |
| DNS service | Reliable, timely responses | Success of the customer's product |
| Email service | Operation of receiving, queueing, and sending infrastructure | Engagement; delivery beyond the provider's control |

The current engine measures request-based availability. Time-based uptime and completion deadlines would require explicit new semantics. Internal database operations must not be counted as extra customer requests or extra billable revenue simply because several components participate in one request.

## Incidents and recovery

### Planned downtime and communication

Operations such as migration may require stopping a service. The player can notify the customer before a planned interruption. Keep this action simple: no estimated restoration time, promised deadline, or missed-estimate penalty is required.

Downtime increases customer hatred even when announced. Keep that effect modest, primarily expressing the customer's worsened mood rather than creating a major additional punishment. An uncommunicated interruption also damages trust. Advance notice avoids that additional communication-related trust penalty; it does not remove the inconvenience of downtime.

The agreed influence order for setup cancellation remains trust, public reputation, then hatred. A small mood consequence must not silently become a large financial multiplier or an automatic cancellation rule.

Stopping service does not itself cancel the contract, erase the advance payment, delete software/data, or release infrastructure. Missed service continues to be evaluated under the contract's compensation rules; notice alone does not establish an SLA exemption. No separate flat financial fine is added for the same interruption. Different treatment of approved maintenance would require a separate explicit contract rule.

Notification after an unexpected failure stops continued lack of communication; it does not erase relationship damage already incurred. Relationship deltas use the delegated customer policy. Do not carry forward the earlier proposal for restoration estimates or promise tracking.

### Failure and recovery

Hardware repair starts only on an explicit player command, consumes operational work time, and charges the configured repair cost. Replacing service elsewhere or detecting failure does not automatically start repair of the original server. Repair uses the existing player operational work queue, separately from the two learning slots.

After the original server is repaired, keep replaced services running on their replacement hosts. Do not automatically migrate them back or release a replacement lease. Rent continues under the normal lease rules; migration and release remain player actions.

After hardware repair, automatically start installed services that were active before the failure. Do not start services that were already intentionally stopped. If a service instance was replaced elsewhere during the outage, keep the old instance inactive to avoid unintended duplicates or a second primary. Automatic start still follows software readiness and health checks; it does not recover lost request or job progress or introduce retries. Hardware power-on remains immediate, while software startup follows its existing work policy.

Incident responsibility is a game rule: hardware and configuration failures are the player's responsibility and increase customer hatred. Software failures and data corruption belong to the customer. Successfully recovering a customer-owned incident using a suitable installed capability reduces hatred once per incident; merely researching or installing the capability earns no recovery reward.

Responsibility depends on evidence from monitoring covering the affected project/component. An unexplained failure is attributed to the player for customer reactions and SLA compensation, even when the simulation's hidden cause is customer-owned. A failed health check alone is not proof of cause. When monitoring establishes customer responsibility, attributable failures are excluded from player SLA compensation but remain visible in operational charts. Never label those failures successful. Monitoring evidence changes responsibility prospectively from detection onward. Earlier losses, compensation attribution, and relationship effects are not reclassified, even within an open billing period. Installing monitoring later does not recover previous penalties. Record the detection boundary without introducing subticks. For overlapping causes, retain player responsibility if a player-owned fault is independently sufficient to fail that demand. Exempt only failures attributable solely to a monitoring-established customer cause. An unresolved cause cannot establish that exemption. Apply attribution per affected demand group rather than to the entire project indiscriminately, and count each failed external demand unit only once.

These rules qualify the general downtime relationship and compensation rules. Planned player downtime remains the player's responsibility. Capacity overload remains a consequence of demand and resources, not a random incident family.

Quality Checks is a researchable, project-installed preventive capability. When active, it reduces software and configuration incident probabilities for that project. It does not eliminate them, prevent hardware failure or data corruption, diagnose responsibility, or replace monitoring. Research alone grants no protection. Its probability factors and resource costs belong in catalog/policy data. Multiple installations do not stack project-level protection. Missing mandatory components and incompatible connections still fail readiness validation; probabilistic protection does not make invalid configuration valid.

Configuration incidents may occur randomly during operation; they are not restricted to the completion of installation or configuration tasks. Their probability depends on the configuration skill of the person responsible for that configuration. Both the player and employees can improve their skills through training courses. Quality Checks provides a separate preventive effect in addition to skill. Record who performed the configuration rather than substituting the player's skill for every installation. Use the configuring person's current skill: later training also improves the risk of their existing configurations without a review or reconfiguration task. This changes future incident probabilities, not past failures or settled penalties. Course details and employee systems are not implemented by this rule.

Checkpointing is an agreed researchable capability for computational workloads: periodically save execution progress to disk, consuming storage and processing/I/O resources. A checkpoint represents saved job progress, not a queued request, database replica, or automatic retry. Only a completed, intact checkpoint can support recovery. After a failure that loses running computational work, the player selects compatible execution capacity and explicitly resumes from the latest usable checkpoint. The contract's original deadline remains unchanged, and progress after that checkpoint is lost. Without a usable checkpoint, including when the technology was never researched or configured, the interrupted job fails permanently; do not restart it from zero or generate a retry. Researching the technology after the failure cannot recover progress that was never saved. This rule concerns lost running work, not ordinary waiting in a queue.

Hardware failure remains relevant across workload families. A failed shared server can affect several projects; software or configuration problems may affect only one component. Discovering a problem, diagnosing it, and recovering from it are separate operational concerns.

The existing outage work provides useful capacity effects and incident timing. Its server-wide monitoring switch and instantaneous repair do not express the new preparation-and-work model. Recovery actions integrate with operational work under the agreed lifecycle and balance baseline; engine integration remains unimplemented.

## Feedback and history

### Visual identity and resource units

Retain the existing dark operations-console visual direction and extend it to the rack-shaped server views. Communicate status through icons and text as well as color. Detailed styling remains a UI design task.

Use accurate resource names and units. CPU core counts, memory, network bandwidth, and GPU capacity describe hardware; workload-specific processing capacity is derived from those characteristics. Do not label request counts or abstract compute units as CPU cores. Exact hardware performance models and GPU capacity units remain to be designed.

### Project feedback

Each project needs an infrastructure view and understandable feedback about readiness, resource pressure, service quality, and work in progress. Provide small historical charts in summaries and detailed views for investigation.

Project feedback has three agreed sections:

- **Current status:** show whether the service is healthy, degraded, or unavailable, alongside line charts showing how its operational metrics have changed.
- **Contract performance:** show performance over the contract period using line charts and a bullet-point explanation of how the project is meeting or missing its commitments. For computational jobs, show progress and lateness relative to the deadline as appropriate.
- **Financial consequences:** include line charts and explain amounts owed by the customer and amounts owed to the customer, along with payments and refunds. Clearly distinguish accrued receivables, settled cash movements, and the estimated refund if the period ended now; a projected refund is not an already-settled debt.

Recovering from an incident can restore current service health while earlier failures still affect the contract period's performance and compensation. Keep these perspectives distinct. The measurement baseline is in [Contracts and time](balance/contracts-and-time.md); it supersedes the prototype's rolling emitting-hour window.

The project list opens a workspace for each customer's project, centered on its infrastructure topology. On desktop, current status, contract performance, and finances appear in a tabbed panel to the right of the topology, keeping the infrastructure visible while switching panels. On mobile, these sections use separate views or tabs suited to the available space. Labels and navigation follow the [Interface design brief](interface-design-brief.md) and [Interaction specification](interaction-specification.md). Charts complement textual explanations and should not require the player to infer contractual or financial meaning from a line alone.

Keep two completed billing periods plus the current period. For workloads without weekly billing, use an equivalent time-based retention window; exact alignment remains technical design work. History should distinguish zero demand, unavailable measurements, and failed service. A brief textual resource summary is available without monitoring; detailed resource measurements, retained project errors, and alerts require monitoring. Retained project errors use the same history window.

## Infrastructure canvas

The player can use Add instance on a project's software and select a destination server. Instances share the project's intended configuration but have independent installation/readiness state, runtime health, and resource consumption. Configuration belongs to the logical service within its project. One configuration task changes that service's shared configuration; on completion it applies to all its instances at the tick boundary. Do not provide per-instance configuration overrides. Runtime health and placement remain instance-specific, and unrelated services or projects are not changed. A load balancer distributes demand among eligible ready instances under the agreed capacity policy.

Duplicating a prepared server reuses its software setup and configuration rather than repeating first-time preparation. Preparation must be substantially faster and is improved by the acting person's Deployment Automation skill. The duplicate remains a distinct server asset with its own capacity and costs; duplication does not copy hardware ownership for free. Database data transfer, durable queues, and replication remain governed by their data lifecycle rules rather than becoming instantaneous copies. Duplication is always project-scoped: copy only that project's software, services, and intended configuration on the source server. Other projects sharing the hardware are not copied. Do not add a whole-server cross-project duplication action in Inventory.

Without Health Checks, load balancers recognize a fully powered-off server but may continue sending demand to failed software on a powered-on host. With Health Checks configured, inspect service health once per game tick and exclude detected unhealthy targets until they recover. Health Checks operates independently of the monitoring collector. If its own checks and the relevant automation services remain operational, unhealthy-target exclusion and automatic instance replacement continue during a monitoring outage. Health Checks supplies readiness/failure detection only; customer-fault diagnosis and responsibility evidence still require functioning Monitoring. A research prerequisite does not imply a runtime dependency on the monitoring collector. Routing uses detected health, not omniscient access to every software fault. Failed requests are not retried.

With Container Orchestration and Health Checks configured, the player can enable automatic replacement for a supported application or worker service. On detected failure, exclude the unhealthy instance from routing and prepare a replacement on available compatible capacity. Replacement consumes preparation time and resources; it joins routing only after readiness and a successful health check. If capacity is unavailable, use the automatic leasing policy below when Autoscaling is learned and configured; otherwise raise an alert. Retain a single pending replacement per failed instance so repeated checks do not create duplicate replacements. This is an automation action, not a retry of failed customer demand. If Orchestration itself is unavailable, existing instances continue operating independently. Its outage disables automatic replacement and new automatic leasing rather than shutting down running services. Existing leases and operating charges remain in effect. Health Checks and routing continue if their own runtimes are healthy.

Automatic leasing is a capability of Autoscaling, integrated with Orchestration replacement and Health Checks. Prefer compatible powered-on owned capacity, then compatible capacity on existing leased servers. If neither fits, automatically lease a compatible catalog server rather than buy one. Choose the lowest projected 24-hour rental-plus-operating cost among options that fit installation memory, workload resource requirements, and 20% processing headroom for the replacement's recent demand. Use catalog baseline demand if no observed history exists. Do not count the same available capacity toward multiple pending replacements.

Apply ordinary credit restrictions to automated acquisition. Also require projected cash after 24 hours of the new server's costs to remain within the credit limit, ignoring uncertain future revenue. Re-evaluate immediately before acquiring the lease. If blocked by credit, unavailable compatible hardware, or missing technology, keep one unresolved replacement and alert the player instead of repeatedly creating acquisitions. Lease only the capacity needed for that replacement; do not purchase hardware or automatically switch off/release unrelated assets.

Emit an Activity Feed warning when existing capacity is insufficient, a cost notice when the automatic lease succeeds, or a blocking alert if it cannot proceed. No confirmation is required for this enabled game automation. The new lease appears in Inventory and the project view, incurs normal rent and operating costs, and remains leased until released under the normal lifecycle. Provisioning does not bypass installation/readiness work or restore missing database data. This supersedes the earlier no-automatic-leasing restriction; automatic purchase remains excluded.

Do not treat an empty replacement database as recovery. Stateful databases use replication and failover: maintain a standby copy on a different server, consuming its own storage, memory, processing, and transfer capacity. While connectivity and capacity are sufficient for synchronization, treat the copy as current and ready. Interrupted synchronization marks it not ready for promotion. Do not simulate transaction-level consistency or fine-grained replication lag.

If the primary database fails, the player can manually promote a ready standby. With Automatic Failover configured, that promotion is automatic after failure detection. Promotion and routing changes apply at the normal tick boundary, with only one active primary; no subticks are introduced. An unready standby cannot be promoted as a successful recovery. If no ready standby is available, recovery requires a usable backup or repairing the existing database; do not present an empty database as recovered customer data. Backup remains the data-restoration mechanism, while a ready standby supports service continuity. Exact initial-copy and resynchronization work belongs to the aggregate resource model.

Automatic instance replacement does not preserve volatile queues or invent data recovery. The precise destination policy, handover cleanup, and treatment of interrupted running work remain technical or incident-design details.

Load balancers automatically distribute demand among healthy configured targets in proportion to their usable capacity for the relevant workload. Players choose targets, not scheduling algorithms or manual routing weights. Stronger targets receive a larger share when their compatible capacity is available. Total capacity shortages still follow demand-type queue and failure rules. Shared downstream hardware must not be counted as independent capacity through multiple routes. The allocation calculation must preserve per-server proportional sharing between projects rather than awarding capacity to the first balancer evaluated.

Prepare reusable processing structure for each demand type when the project is configured or its structure changes. Per-tick demand volume, utilization, and component health update execution state rather than requiring reconstruction of the whole graph.

Apply completed configuration changes at a tick boundary: finish the current tick with the existing structure, then activate the change before the next tick. Installation and migration still require their operational work. Keep only one active processing structure; do not retain old graph versions for earlier demand. Waiting work preserves its arrival age and remaining progress when continuing on the new structure, without repeating completed work. If continuation is no longer possible, apply the demand type's waiting or failure rules. Model operational costs, interruptions, and data loss, but not transaction-level database migration consistency. Explicit data-loss rules, including volatile queue loss on full stop, still apply; a configuration change does not grant durability.

Represent each server as a rack-shaped visual container, with the current project's installed software displayed inside it. Place a compact server activity monitor at the bottom of the container. The rack appearance represents a server; it does not introduce a separate physical rack asset or rack-slot capacity mechanic.

Keep the server's shared identity visible: software shown for the current project uses the same hardware as any other projects hosted there. The activity monitor represents server-level activity; distinguish total resource use from any project-specific breakdown. Its baseline presentation is a brief textual consumption summary, with richer detail supplied by installed monitoring. Metric selection and coverage follow the observation baseline.

Selecting a software component temporarily shows its details and actions in the desktop right-side panel. On mobile, open the same content in a bottom sheet. Selecting a server or software component exposes its relevant operational actions and preparation progress. Required missing components should be understandable from the project view. Use compact indicators for supporting capabilities, revealing details on selection, so multiple servers remain readable on mobile. Dependencies, placement, and traffic routing retain their distinct meanings even when shown together.

Canvas layout is freely editable and does not change processing behavior. Allow connections only between compatible components and suggest required project connections. Load balancers may connect to other load balancers, but reject routing loops. These routing rules do not imply that every kind of graph edge has identical semantics.

## Data movement and retention

Moving software and transferring its data are separate operational tasks. Migration does not require stopping the source instance: it can continue serving until the destination is prepared and required data transfer is complete. Transfer consumes shared resources and contention can extend its duration. At an outer-tick boundary, hand service over to the ready destination and deactivate the source instance. During migration only the source contributes serving capacity; destination preparation is not a second serving copy. This handover changes the migrated instance only, not other projects on either host. No transaction-level migration simulation is required. Power-off preserves disk data. Selling or releasing a server removes data left on that server; before the action, identify affected projects and data at risk. Backups provide a recovery path. Data already transferred to other storage is not removed by releasing the original server. Exact transfer and restore durations remain technical and balance work.

## Inventory and project operations

Inventory is the business-wide view of the player's infrastructure assets, including assets used by projects and assets currently unused. Project topology views reference these same assets. A shared server appearing in multiple projects remains one asset with one pool of capacity and one set of costs.

Routine infrastructure acquisition, placement, and management must be accessible from the project's infrastructure view. Visiting Inventory must not be a prerequisite for those actions; a player may operate entirely through project workspaces. Inventory provides an alternative place to inspect and manage assets across projects. Both entry points operate on the same underlying state and expose which projects use an affected asset.

## Progress while away

Away-time progression is a deferred feature, not a requirement for the first playable implementation of the redesigned core loop. The following rules describe its intended future behavior.

The business remains exposed to operational consequences while the player is away. A campaign or demand spike can overwhelm inadequately prepared infrastructure, degrade service, and lead a customer to leave before the player returns. Absence does not protect projects from these consequences; customer departure is possible, not an automatic outcome of every spike.

The intended direction is to calculate away-time outcomes through a summarized simulation when the player returns, rather than require a continuously running simulation for each absent player. Outcomes should reflect the saved infrastructure and elapsed time. The approximation, event model, progression limits, and handling of repeated reconnects require technical design; this direction does not prescribe exact replay of every online tick.

Post-launch customer departure follows the agreed dissatisfaction and early-settlement rules above. Thresholds and relationship coefficients use the versioned customer balance policy. In-session pause/speed follow the time baseline. Maximum simulated absence remains deferred with away-time progression.

When away-time progression is implemented, provide a concise return report explaining significant events and their financial effects. Connect causes and consequences, for example: a customer campaign increased demand, capacity was exceeded, service degraded, and the customer withdrew. The report should help the player understand the outcome and prepare better for future absences. It accompanies the deferred feature rather than creating a separate immediate implementation requirement.

## First-project validation scenario

The agreed first project is an acquaintance's simple appointment-booking site with an application and database on one server, low demand, and an 80% SLA target. The player accepts the contract and receives its advance payment, prepares the system, then explicitly activates service and its first weekly billing period. No email, payment feature, or new research is required. A later incident and referral remain suggested ways to exercise recovery and growth.

The project requirements are agreed; exact customer identity, tutorial presentation, and incident sequence remain open. This scenario does not introduce a timed game mode or a new win condition.

## Customer and commercial tuning

See [Customers and offers](balance/customers-and-offers.md) for the delegated numeric baseline: relationship updates, setup patience, post-launch dissatisfaction, and offer progression. Contracts are project-specific, with no negotiation or customer-wide price agreement. Rejecting or expiring an offer carries no relationship penalty and does not permanently block that customer. These authored defaults remain separate from runtime implementation.

## Training and skills

Courses improve personal skills for the player and employees, distinct from business-wide technology research. The agreed course families are System Administration (lower configuration incident risk), Deployment Automation (shorter installation/configuration work), Incident Response (shorter diagnosis/repair), Performance Tuning (lower software resource consumption), and Data Recovery (shorter backup/checkpoint recovery). Performance Tuning improves software efficiency rather than increasing physical hardware capacity. Incident Response does not bypass the monitoring requirement for cause attribution.

Courses charge a small monthly tuition and take one to several financial cycles. Each completed course adds its benefit only at completion, up to five stacks per person. Technology learning also requires monthly tuition and elapsed study time, but unlocks once and does not stack. Tuition for both courses and technology learning ends when the enrollment is completed; a learned technology has no ongoing educational fee. The player has two shared concurrent learning slots: two technologies, two courses, or one of each. Learning uses this pool rather than the single operational-task queue. Installing and configuring learned technology remain separate operational work.

Keep tuition, durations, shared slot count, stack caps, and effect coefficients in separate catalog/policy configuration. An educational billing month is four game weeks (672 simulated hours), measured independently from each enrollment start. Collect the full monthly tuition upfront at enrollment and at the start of each subsequent educational month while learning continues. A shorter enrollment still pays the full first month; do not prorate tuition by time studied. Completion ends future charges. If funds are insufficient for the next monthly tuition, pause learning and retain its completed progress. Progress resumes only after payment; unpaid time contributes no learning progress and does not automatically create tuition debt. Paused learning frees its shared learning slot. Resuming requires an available slot and valid paid coverage, without displacing another active enrollment. After nonpayment, payment is required. After a payment-related pause, resumption payment begins a fresh four-week educational month at resumption. Charge nothing for the paused interval; earlier renewal dates neither create arrears nor shorten the new paid month. Voluntary cancellation retains progress, frees the slot, and stops future charges without refunding paid tuition. The original paid month continues to expire on its original date; cancellation does not freeze or extend it. Resume within that paid month without another fee if a slot is available. After it expires, resumption requires full tuition for a fresh four-week month. Tuition amounts, level durations, and course effects are selected in the [course and incident baseline](balance/courses-and-incidents.md). A person cannot enroll in two simultaneous copies of the same course. Course levels are sequential: complete the current level before beginning the next, up to five completed levels. Resume an existing unfinished enrollment rather than creating a duplicate. The two active learning slots therefore hold different learning subjects. Full employee enrollment management remains deferred.

Configuration-skill gains apply to existing configurations as well as future work, without reconfiguration. They change future risk, not past incidents or settlements. Other course effects follow their respective work/resource policies.

The [design-0.2 course and incident baseline](balance/courses-and-incidents.md) supplies delegated learning prices and durations, level effects, incident probabilities, diagnosis/repair work, and checkpoint intervals/costs. These numeric choices are selected defaults rather than unanswered product questions; future playtesting may tune them without changing the agreed rules.
