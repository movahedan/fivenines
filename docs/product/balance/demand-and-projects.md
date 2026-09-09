# Demand types, project catalog, and arrival policy

## Release scope

The design-0.3 library has 20 demand types: 13 version-one and seven expansion candidates. Nine of the 12 continuous templates are version-one; conferencing, multiplayer-hosting and event-platform are expansion-only. Of five finite-job templates, transcode-job and batch-job are version-one; analytics-job, training-job and distributed-training-job are expansion-only. Tables include both groups for design reference. Use `release` on demand, projects and finite-job terms in baseline.json to filter generation, offers and release acceptance tests. Version-one references must resolve entirely within version one.

## Units and execution boundary

One outer tick is one simulated hour, with no subticks or per-request event timeline. Baselines are root work units per simulated hour, never RPS. Resource costs below are per root item. CPU work is a game unit (1,000 per reference core-hour); GPU work uses its own incompatible unit. MiB is binary. Network costs include the root item's total transfer budget; path placement determines which interfaces incur it. Do not charge the same interface twice for one transfer. Storage-operation costs apply to the relevant storage host. Read/write payload bytes must also consume disk throughput; use networkMiB as the default payload size for disk-backed operations and zero for pure relay operations. These costs model game load, not real hardware benchmarks.

Application CPU and database CPU are distinct stages sharing the same server budget when colocated. Other work uses its named service/worker for the applicationCpuWork column. Working memory is per active item, resident memory is per installation, queue memory is per waiting item. None is a substitute for the others. Job data are stored separately from queue metadata. A batch may split into whole items. Parallelism is a per-item ceiling; independent items may run concurrently. GPU memory is a per-active-item requirement, so compatibility and memory must be checked before accepting execution capacity.

| Demand type | CPU app | CPU DB | GPU work | Network MiB | Disk ops | Working MiB | CPU parallelism | GPU MiB | Wait policy | Queue KiB |
|---|---|---|---|---|---|---|---|---|---|---|
| page-read | 0.6 | 0.4 | 0 | 0.05 | 2 | 1 | 1 | 0 | interactive | 4 |
| record-write | 0.8 | 1.2 | 0 | 0.02 | 4 | 2 | 1 | 0 | interactive | 4 |
| payment | 1.2 | 1.8 | 0 | 0.02 | 6 | 2 | 1 | 0 | interactive | 8 |
| chat-message | 0.8 | 0.2 | 0 | 0.004 | 1 | 1 | 1 | 0 | interactive | 2 |
| email-message | 2 | 0 | 0 | 0.1 | 3 | 1 | 2 | 0 | queued | 64 |
| mailbox-read | 1 | 0.5 | 0 | 0.1 | 2 | 2 | 1 | 0 | interactive | 8 |
| search-query | 2 | 0 | 0 | 0.04 | 3 | 8 | 1 | 0 | interactive | 8 |
| dns-query | 0.05 | 0 | 0 | 0.0005 | 0 | 0.125 | 1 | 0 | interactive | 1 |
| video-minute | 0.5 | 0 | 0 | 30 | 4 | 1 | 1 | 0 | continuous | 2 |
| live-minute | 1 | 0 | 0 | 30 | 0 | 2 | 1 | 0 | continuous | 2 |
| call-minute | 2 | 0 | 0 | 12 | 0 | 4 | 1 | 0 | continuous | 2 |
| game-session-minute | 6 | 0 | 0 | 0.5 | 0 | 4 | 1 | 0 | continuous | 2 |
| inference-cpu | 20 | 0 | 0 | 0.02 | 1 | 32 | 4 | 0 | interactive | 8 |
| inference-gpu | 1 | 0 | 25 | 0.02 | 1 | 8 | 1 | 4096 | interactive | 8 |
| event-ingest | 0.3 | 0 | 0 | 0.005 | 1 | 0.5 | 1 | 0 | queued | 8 |
| analytics-job | 16000 | 0 | 0 | 128 | 20000 | 2048 | 4 | 0 | job | 16 |
| transcode-job | 32000 | 0 | 0 | 1024 | 10000 | 1024 | 8 | 0 | job | 16 |
| batch-job | 48000 | 0 | 0 | 128 | 10000 | 2048 | 8 | 0 | job | 16 |
| training-job | 4000 | 0 | 80000 | 1024 | 20000 | 4096 | 8 | 8192 | job | 16 |
| distributed-training-job | 16000 | 0 | 320000 | 8192 | 40000 | 8192 | 16 | 16384 | job | 16 |

Interactive and continuous work must complete within its arrival tick and does not carry over; this is a deliberate aggregate approximation, not a millisecond timeout guarantee. Queued work may use its arrival tick and the next two ticks, expiring before the third subsequent tick. Jobs retain progress to delivery or the contractual 100% lateness cutoff. Waiting age survives durable restart. No retries occur. Lost running computation uses the agreed manual checkpoint recovery rule; without a usable checkpoint it fails permanently. See Gameplay for volatile and durable work semantics.

A stream-minute is one minute of requested viewer service, not a simulator substep. 600 stream-minutes/hour describes ten average viewers. Demand batches aggregate those units once per outer tick. Exact session continuity and routing behavior remain execution-design work. An AI training job is one finite contract unit; its resource work is not resampled hourly.

## Root paths and feature dependencies

Page reads: application then database, unless the configured cache satisfies the read. Writes: application then durable database write. Payments: application, gateway integration, and essential transaction record; receipt email is optional child work. Each successful shop payment creates one email item, tracked under the email feature and not another paid root request. Chat: message service then stored message where the feature requires history. DNS and media relays use their service directly. Finite jobs execute on workers with customer input/output storage. Email and expansion event-ingest tasks may queue. The execution layer creates dependent work; DemandEngine only emits external roots. Feature presence alone never adds its cost to unrelated requests.

Cache baseline: 60% of eligible reads hit after configuration, with 0.15 CPU work and no database work for that read; cache requires its resident memory and does not accelerate writes. This is a tunable aggregate hit model. Details of replica consistency, joins, and invalidation remain execution design.

## Continuous project templates

Fees per success refer to the root unit, not every internal operation. Optional child email is included in the shop's price. These templates may be scaled through their numeric baseline, not by copying request costs. Prerequisites require their transitive technology closure. Additional supported features are explicit modifications, not hidden costs.

| Project | Units/hour | Rhythm | Variation | SLA % | Weekly fee | Fee/success | Setup h | Root mix |
|---|---|---|---|---|---|---|---|---|
| appointment-site | 120 | office | early | 80 | 80 | 0 | 24 | page-read: 80%, record-write: 20% |
| community-site | 240 | evening | early | 90 | 110 | 0 | 24 | page-read: 90%, record-write: 10% |
| online-shop | 1000 | evening | standard | 95 | 200 | 0.001 | 36 | page-read: 90%, record-write: 7%, payment: 3% |
| support-chat | 1800 | office | standard | 98 | 200 | 0.0005 | 36 | chat-message: 85%, page-read: 10%, record-write: 5% |
| mailbox-service | 1000 | office | standard | 99 | 160 | 0.001 | 36 | email-message: 30%, mailbox-read: 70% |
| dns-hosting | 10000 | flat | standard | 99.9 | 100 | 1e-05 | 24 | dns-query: 100% |
| video-library | 600 | evening | volatile | 99 | 180 | 0.002 | 48 | video-minute: 100% |
| live-events | 1200 | event | volatile | 99 | 180 | 0.003 | 48 | live-minute: 100% |
| conferencing | 600 | office | standard | 99 | 180 | 0.003 | 48 | call-minute: 100% |
| multiplayer-hosting | 600 | evening | volatile | 99 | 180 | 0.002 | 48 | game-session-minute: 100% |
| inference-api | 300 | flat | standard | 99 | 650 | 0.002 | 48 | inference-gpu: 100% |
| event-platform | 3000 | office | standard | 99 | 180 | 0.0003 | 48 | event-ingest: 100% |

The appointment site is the first project; community-site is the next comparison fixture, not a forced unlock gate. Later offers depend on the reputation model, which is outside this numeric assignment. SLA variants may use 80/90/95/98/99/99.9/99.99/99.999%; no 100% target. Research does not guarantee that a matching offer arrives immediately.

## Mathematical arrival model

For each active project and tick, compute m = baseline × normalized local-hour rhythm × campaign multiplier × spike multiplier. Clamp only the combined campaign/spike multiplier to 6; do not cap ordinary demand to server capacity. Inactive preparation produces no live demand; an activated but stopped service still receives demand and fails it.

Use a Gamma–Poisson mixture: draw Z ~ Gamma(k, scale=1/k), then N ~ Poisson(mZ). Its mean is m and variance is m + m²/k. This provides overdispersion with one understandable variability parameter; k=100/25/9 gives mild/standard/volatile relative variation. Then split N across demand types with a multinomial using the template's mix. Counts sum exactly to N. Do not independently sample every feature or every internal node. This preserves common load variation across a project's features. Project-specific seeded RNG streams avoid changing another project's demand when iteration order changes. Snapshots retain generator/event state.

A constant-demand fixture bypasses stochastic draws for deterministic capacity checks. For production sampling use a tested efficient count sampler, not a loop creating N request objects. No additional per-tick jitter is multiplied in: that would duplicate variability. Scheduled campaigns and persistent spikes supply temporal correlation; this baseline adds no AR process or global cross-project market shock.

| Profile | Gamma k | Spike chance per eligible hour | Spike multiplier | Duration h | Cooldown h | Campaign multiplier | Duration h | Notice h |
|---|---|---|---|---|---|---|---|---|
| early | 100 | 0.002 | 1.25 | 1 | 24 | 1.5 | 3 | 24 |
| standard | 25 | 0.008 | 2 | 2 | 12 | 2 | 6 | 24 |
| volatile | 9 | 0.015 | 3 | 3 | 8 | 3 | 8 | 48 |

Only an idle, non-cooldown spike state may draw a new spike. There are no overlapping spikes on one project. Campaign generation checks once per simulated day after at least 168 hours since the last campaign ended, with probability 0.15; a successful draw schedules the announced future window. There is no forced first-week immunity. Event templates use their specified window; no second random campaign is stacked onto the same event. These are defaults, not additional substeps.

Local-hour bands [00–06,06–12,12–18,18–24) have raw weights: flat [1,1,1,1], office [0.2,1.5,1.4,0.5], evening [0.25,0.65,1,2.1], event [1,1,1,1]. Divide by their duration-weighted daily mean, so baseline remains the daily-average rate without events. Region uses the project's existing UTC offset; no geography/latency redesign is introduced.

Finite jobs enter as one fixed workload when activated, not as hourly Poisson arrivals. Their quoted resource vector is frozen at acceptance. No generated retry demand is added after failure.

The count-distribution basis follows [NIST's Poisson reference](https://www.itl.nist.gov/div898/handbook/eda/section3/eda366j.htm) and the [Gamma–Poisson explanation](https://distribution-explorer.github.io/discrete/negative_binomial.html). All rates, mixtures, and event frequencies here are authored game balance, not observations of real customers.
