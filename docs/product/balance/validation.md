# Baseline validation

Current design-0.3 technology count: **31 version-one entries plus 12 disabled expansion candidates, 43 total**. The obsolete historical counts have been removed to avoid presenting them as the current catalog.

The numerical experiments below are historical design-0.2 evidence, not new results for the reduced release catalog. See Current catalog consistency check for current counts. These checks validate authored data and simplified analytic scenarios. They do not execute the redesigned Game, allocator, or UI, and are not a full gameplay balance certification. No existing engine tests were altered to fit the new numbers.

- Technology IDs and prerequisite references passed uniqueness and acyclic-graph checks for the historical baseline. Current counts are reported below.
- All 12 continuous project mixtures sum to one and reference existing demand/technology entries.
- All nine hardware rows have valid basic capacities and power bounds.
- All daily rhythms normalize to mean one.
- Zero subticks and zero automatic retries are explicit.
- Starter projects fit CPU and resident-memory limits and have positive steady-state operating margins.
- Five finite-job templates have compatible example hosts and CPU/GPU lower-bound execution times within their deadlines.
- Refund boundary and prorated termination arithmetic examples pass.

| Scenario | CPU | Weekly operating cost | Weekly income | Operating margin |
|---|---|---|---|---|
| 1 starter project(s) | 144.00 / 2000 CPU work/h | 17.77 | 80.00 | 62.23 |
| 2 starter project(s) | 408.00 / 2000 CPU work/h | 19.54 | 190.00 | 170.46 |

Seed 74219, 20,000 Gamma–Poisson samples at mean 120 and shape 100: empirical mean **120.183** (expected 120), variance **267.049** (expected 264). A simple offline sampler is used only for this statistical check; it is not the proposed production implementation.

| Job | Example host | CPU/GPU lower bound h | Deadline h |
|---|---|---|---|
| analytics-job | compute-large | 2.67 | 12 |
| transcode-job | compute-large | 2.67 | 16 |
| batch-job | compute-large | 4.00 | 24 |
| training-job | gpu-small | 8.00 | 24 |
| distributed-training-job | gpu-large | 13.33 | 48 |

The job checks omit data movement, graph dependencies, contention, setup, and failure. They are feasibility checks, not promised completion times. Deployment memory, queue occupancy, storage/network saturation, percentile latency accuracy, and financial results under faults must be validated by the future simulation harness. Large catalog economics have not been playtested.

Verification was performed with a temporary standalone Python script using only the standard library. Runtime implementation remains unchanged. The final repository-wide gate status is reported separately; these checks do not substitute for that gate before commit.

Customer/offer follow-up checks: setup influence coefficients preserve trust > reputation > hatred; minimum patience is positive; reputation tiers increase strictly and all SLA targets remain below 100%. These are static policy checks, not relationship-economy playtests.

Historical Checkpointing follow-up (before Quality Checks and release scoping): Unique names and prerequisite references/DAG were rechecked after adding Checkpointing; its numeric tier follows the existing research policy. Checkpoint timing and runtime overhead are not yet modeled in the earlier scenario checks.

## Historical design-0.2 follow-up validation

The historical design-0.2 technology references passed the acyclic-graph check. Five courses have exactly five ordered levels with monotonically increasing improvements, bounded away from zero resource cost/risk. Duplicate course enrollment remains disabled and there are no subticks.

Monthly billing arithmetic: a one-week level at 20 costs 20; exactly four weeks at 35 costs 35; five weeks at 40 costs 80. Tier-four technology takes five weeks and costs two 320 payments (640 total). Paused enrollment state-machine execution is still future engine work, not covered by these arithmetic assertions.

A six-week deterministic cash-flow check (three weeks first project, three with both) buys a 240 server and pays for simultaneous 40 technology + 20 course tuition at the start. Minimum cash is **262.40**, and end cash is **898.46**, excluding future renewal advances at the final boundary. No incidents, usage fees, monitoring overhead, or additional investments were simulated in that calculation. It verifies initial tuition affordability, not profitability under every strategy.

Configuration incidence: untrained eligible weekly probability is **4.1135%**; five System Administration levels plus Quality Checks reduce it to **1.2324%**. Seed 2209, 100,000 independent eligible-week trials each gave **4.1090%** and **1.2500%**. This checks the probability factors, not a full campaign or the redesigned engine.

Checkpoint sizes for finite templates range **102.4–819.2 MiB**. Space for two completed copies and an in-progress copy fits the catalog's smallest disk before unrelated datasets. I/O contention and storage competition still require engine integration tests.

These are independent data/arithmetic checks; runtime code was not changed. See the current catalog consistency check below for repository-wide verification.

## Current catalog consistency check

The design-0.3 scope pass checks 43 unique technologies (31 version-one and 12 expansion), nine hardware entries, 20 demand types (13 version-one and seven expansion), 12 continuous templates (nine version-one) and five finite-job references (two version-one). Version-one prerequisite and workload references must not depend on expansion entries. Course levels and cumulative factors were checked for all five course families. Technology numeric table columns match baseline.json; project mixtures sum to one and their references resolve. Guard checks cover zero subticks/retries, immediate power-on, two learning slots, 80%/60% salvage and no monitoring-outage alert/backfill. These are static checks, not runtime or playtest evidence.

For PR preparation, the branch was synchronized with main at `2d2c512`, locked dependencies were installed, and `bun run overall` passed lint, typecheck, tests and affected builds. Integration tests required permission to bind local test-server ports outside the sandbox. This verifies the repository change, not implementation of the future product model. Earlier numerical experiments above retain their original scope and dates; no new stochastic balance results are claimed by this consistency pass.
