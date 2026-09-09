# Technology and research baseline

Retain all catalog technologies as the initial design library: they cover distinct project capabilities, observation, recovery, or operational actions. Advanced attack/credential incident behavior is still a separate design question; listing its technology does not implement its incident family. Research dependencies are the game learning graph; runtime requirements remain those in the [technology catalog](../technology-catalog.md). No requirement is added for a separate physical server per technology.

Application Runtime and Relational Database begin researched. All others unlock after their listed prerequisites; there is no additional reputation gate on knowledge. Technology learning now shares two concurrent slots with personal courses, separate from the operational work queue. Technology requires tuition and time, unlocks only on completion, and cannot stack. The prior single-slot/upfront-only learning policy is superseded. Both technology and course tuition are monthly and stop at completion. Each enrollment has its own four-game-week (672-hour) billing month beginning at enrollment. Collect the full monthly tuition upfront at enrollment and at each subsequent month start while learning continues; no time-based proration, including for a course shorter than a month. Completion stops future charges. Insufficient renewal funds pause learning without losing progress or automatically creating tuition debt. Resume progress after payment. Paused learning frees its slot; resuming requires valid paid coverage and one of the two shared slots to be available; nonpayment pauses require payment. Resumption payment after nonpayment starts a fresh four-week month at resumption, without arrears or a shortened paid period. Voluntary cancellation retains progress, frees the slot, and stops future charges without refunding paid tuition. Original paid coverage expires on its original date. Resume within it without another fee; after expiration pay full tuition for a fresh four-week month. Amounts are selected in the versioned table below. Learned technology carries no ongoing educational fee. No passive profit bonus results from research.

Tier is dependency depth capped at four. The selected design-0.2 research durations are 1/2/3/5 game weeks and monthly tuition is 40/80/160/320 at tiers 1/2/3/4. Tier four therefore costs two full monthly payments (640) if completed continuously. Base tools are free and already learned. These values replace the earlier hour-scale research and one-time fees; installation/configuration durations are unchanged. At the default five real seconds per game hour, a study week is 14 real minutes; five weeks is 70 minutes of advancing game time. No away-time progress is implied.

| Technology | Prerequisites | Tier | Research h | Monthly tuition | Install h | Config h | Resident MiB |
|---|---|---|---|---|---|---|---|
| Application Runtime | Initially available | 0 | 0 | 0 | 2 | 1 | 128 |
| Relational Database | Initially available | 0 | 0 | 0 | 2 | 1 | 256 |
| Background Workers | Application Runtime | 1 | 168 | 40 | 1 | 1 | 64 |
| Job Scheduler | Background Workers | 2 | 336 | 80 | 2 | 1 | 128 |
| Message Queue | Background Workers | 2 | 336 | 80 | 2 | 1 | 128 |
| In-memory Cache | Application Runtime | 1 | 168 | 40 | 1 | 1 | 64 |
| Object Storage | Application Runtime | 1 | 168 | 40 | 1 | 1 | 64 |
| Document Database | Relational Database | 1 | 168 | 40 | 1 | 1 | 64 |
| Search Engine | Relational Database | 1 | 168 | 40 | 1 | 1 | 1024 |
| Event Streaming | Message Queue | 3 | 504 | 160 | 3 | 1 | 256 |
| Analytics Database | Relational Database | 1 | 168 | 40 | 1 | 1 | 1024 |
| Data Pipeline | Background Workers, Analytics Database | 2 | 336 | 80 | 2 | 1 | 128 |
| Email Delivery | Application Runtime | 1 | 168 | 40 | 1 | 1 | 64 |
| Mailbox Hosting | Email Delivery | 2 | 336 | 80 | 2 | 1 | 128 |
| Real-time Messaging | Application Runtime | 1 | 168 | 40 | 1 | 1 | 64 |
| Push Notification Delivery | Background Workers | 2 | 336 | 80 | 2 | 1 | 128 |
| Payment Gateway Integration | Application Runtime | 1 | 168 | 40 | 1 | 1 | 64 |
| Webhook Delivery | Background Workers | 2 | 336 | 80 | 2 | 1 | 128 |
| Identity Provider Integration | Application Runtime | 1 | 168 | 40 | 1 | 1 | 64 |
| Media Transcoding | Background Workers, Object Storage | 2 | 336 | 80 | 2 | 1 | 1024 |
| Video on Demand | Media Transcoding | 3 | 504 | 160 | 3 | 1 | 256 |
| Live Streaming | Application Runtime | 1 | 168 | 40 | 1 | 1 | 64 |
| Real-time Audio and Video | Real-time Messaging | 2 | 336 | 80 | 2 | 1 | 128 |
| Multiplayer Game Server | Real-time Messaging | 2 | 336 | 80 | 2 | 1 | 128 |
| Authoritative DNS | Application Runtime | 1 | 168 | 40 | 1 | 1 | 64 |
| Reverse Proxy | Application Runtime | 1 | 168 | 40 | 1 | 1 | 64 |
| TLS Termination | Reverse Proxy | 2 | 336 | 80 | 2 | 1 | 128 |
| Load Balancing | Reverse Proxy | 2 | 336 | 80 | 2 | 1 | 128 |
| Health Checks | Monitoring, Load Balancing | 3 | 504 | 160 | 3 | 1 | 256 |
| Content Delivery Network | Object Storage, Reverse Proxy | 2 | 336 | 80 | 2 | 1 | 128 |
| Rate Limiting | Reverse Proxy | 2 | 336 | 80 | 2 | 1 | 128 |
| API Gateway | Reverse Proxy, Rate Limiting | 3 | 504 | 160 | 3 | 1 | 256 |
| Private Networking | Application Runtime | 1 | 168 | 40 | 1 | 1 | 64 |
| Monitoring | Application Runtime | 1 | 168 | 40 | 1 | 1 | 64 |
| Centralized Logging | Monitoring | 2 | 336 | 80 | 2 | 1 | 128 |
| Distributed Tracing | Monitoring | 2 | 336 | 80 | 2 | 1 | 128 |
| Backup and Restore | Relational Database | 1 | 168 | 40 | 1 | 1 | 64 |
| Point-in-Time Recovery | Backup and Restore | 2 | 336 | 80 | 2 | 1 | 128 |
| Database Replication | Relational Database | 1 | 168 | 40 | 1 | 1 | 64 |
| Automatic Failover | Database Replication, Monitoring | 2 | 336 | 80 | 2 | 1 | 128 |
| Automated Restart | Monitoring | 2 | 336 | 80 | 2 | 1 | 128 |
| Firewall | Private Networking | 2 | 336 | 80 | 2 | 1 | 128 |
| Web Application Firewall | Reverse Proxy | 2 | 336 | 80 | 2 | 1 | 128 |
| DDoS Protection | Monitoring, Rate Limiting | 3 | 504 | 160 | 3 | 1 | 256 |
| Secrets Management | Application Runtime | 1 | 168 | 40 | 1 | 1 | 64 |
| Container Runtime | Application Runtime | 1 | 168 | 40 | 1 | 1 | 64 |
| Deployment Pipeline | Background Workers | 2 | 336 | 80 | 2 | 1 | 128 |
| Deployment Rollback | Deployment Pipeline | 3 | 504 | 160 | 3 | 1 | 256 |
| Rolling Deployment | Deployment Pipeline, Load Balancing | 3 | 504 | 160 | 3 | 1 | 256 |
| Container Orchestration | Container Runtime, Monitoring | 2 | 336 | 80 | 2 | 1 | 128 |
| Autoscaling | Container Orchestration, Load Balancing | 3 | 504 | 160 | 3 | 1 | 256 |
| Infrastructure as Code | Deployment Pipeline | 3 | 504 | 160 | 3 | 1 | 256 |
| Batch Computing | Job Scheduler | 3 | 504 | 160 | 3 | 1 | 256 |
| GPU Computing | Background Workers | 2 | 336 | 80 | 2 | 1 | 2048 |
| Model Serving | Application Runtime | 1 | 168 | 40 | 1 | 1 | 1024 |
| Model Training | Batch Computing | 4 | 840 | 320 | 4 | 1 | 2048 |
| Vector Search | Search Engine | 2 | 336 | 80 | 2 | 1 | 1024 |
| Distributed Computing | Batch Computing, Private Networking | 4 | 840 | 320 | 4 | 1 | 512 |
| Distributed GPU Training | Model Training, GPU Computing, Distributed Computing | 4 | 840 | 320 | 4 | 1 | 2048 |
| Checkpointing | Batch Computing | 4 | 840 | 320 | 4 | 1 | 512 |
| Quality Checks | Application Runtime | 1 | 168 | 40 | 1 | 1 | 64 |

Connection configuration between an application and database is one task, not an additional configuration fee for both endpoints. The first application and database install includes their default configuration; the one-hour connection task completes their five-hour setup. Supporting technologies use their separate configuration duration. CPU/network costs arise from the work they handle; observation overhead is specified separately.

No branded framework research, arbitrary tier repetitions, or prerequisite duplication is added. CPU model serving remains valid; GPU research is required only when the selected workload requires GPU execution. Merely buying a GPU server does not complete GPU research.

Automatic replacement is an agreed Container Orchestration capability when Health Checks is also researched and configured. This is a capability-specific prerequisite, not a change to the base research DAG. Replacement applications/workers require spare compatible capacity and preparation time, then a successful health check before routing. Autoscaling now adds automatic leasing when existing compatible capacity is insufficient, subject to credit and cost checks. Automatic purchase and invented database-data recovery remain excluded.

Checkpoint recovery requires explicit player Resume on compatible capacity and preserves the original job deadline. Lost running computational work without a usable saved checkpoint fails permanently; researching Checkpointing afterward does not recover it. No restart-from-zero or automatic retry is introduced.

Quality Checks baseline: software incident probability ×0.70, configuration incident probability ×0.50, with 64 MiB resident memory and 1% CPU overhead on the project's processing. These are delegated initial tuning values, not measured prevention rates. No stacking or retroactive incident repair. Hardware and data-corruption probabilities are unchanged.

A person cannot study two copies of the same course simultaneously. Complete one level before beginning the next, up to five completed levels; resume an unfinished enrollment rather than duplicating it. The two active slots hold different subjects.
