# Contract accounting, operations, and time

## Clock

Retain one simulated hour per outer tick. Default wall cadence is one tick per five seconds; speed options are pause, 1×, 2×, and 4×. Speed changes only wall cadence, never work budgets or demand distribution per simulated hour. One week is 168 ticks. There are no subticks or millisecond event loops. Sub-hour latency values, if shown, are aggregate estimates, not event timestamps. No strict real-time deadline accuracy is promised by this model.

Demand types with no carry allowance are resolved within their arrival tick. Work completion can advance through multiple components using aggregate budgets; the unresolved solver must conserve every server resource and cannot use iteration order as priority. This document does not claim that solver is implemented.

## Operations

Install/configuration durations are listed per technology. Base application install 2h + database install 2h + connection 1h = first-project preparation 5h. Selecting hardware, editing layout, accepting a contract, and power-on are immediate. Initial completed installation is ready without an additional service-start task. Restarting stopped software costs 1h of operational work. Technology learning and courses use two shared learning slots, separate from the single operational work queue. Cancelling preserves completed task progress.

Repair baseline is 3h and replacement parts cost 2% of server purchase price, charged once on start; failure attribution and repair lifecycle follow Gameplay; engine integration remains required. Move/transfer: one hour of preparation plus ceil(dataMiB / (3600 × effectiveMiBps)) execution hours, at least one transfer hour for nonempty data. Effective rate is the minimum of configured 20 MiB/s, source/destination available disk rates, and available network rate. Contention can extend completion; shown duration is an estimate. Reserve work through the same resource allocator. Backup/restore has the same transfer model and a 1h setup. Default backup interval is 24h with three retained copies, constrained by available storage. No backup retry is added. Migration of software and transfer of data remain distinct operations.

## Service accounting

The first-project five-hour setup is a preset: two installs and one shared connection/configuration task. Do not add each technology's general configuration default again to that preset. Those defaults apply to separately required configuration work; they are not additional mandatory steps in the opening flow.

Each project's first 168-hour period starts on explicit activation. Fixed fee is already paid at acceptance, with no second charge at activation. Usage fees count only successful, on-time external root units. Internal operations and retries never generate billable units. Store integer counts and exact fractional currency accrual, settling to cents while retaining remainder; never round per request. Daily collection follows global multiples of 24 simulation hours, independently of project weekly boundaries.

Freeze root demand weights and terms at acceptance. Baseline SLA uses equal weight per external root unit within a project, including media service units; do not compare its absolute request count to another project's SLA. Optional child work is observable but not another root denominator. All required root features remain subject to the contract; additional per-feature contractual floors are not silently introduced. Track success/failure against the root's arrival period. Unresolved queued roots appear as pending, not successes. At weekly close, classify unresolved roots as missed for that period; they may continue if their demand rules permit, but cannot rewrite a closed SLA period. Later successful delivery may earn usage in its delivery period without erasing the earlier miss.

Use rational counters for eligibility and exact cross-multiplication for compensation thresholds, avoiding integer percent rounding before deciding a band. Display at most five decimal percentage places for high-tier SLA. No demanded roots means N/A, not 100%; no-demand alone earns no quality credit. All demanded roots failing is complete failure and receives the full service-charge refund. Normal ratio bands remain: within allowance 0%; >1–2× 10%; >2–5× 25%; >5–10× 50%; >10× 100%. No target of exactly 100% is offered.

At a normal period close, the refund base is fixed fee plus actual billable usage in that period. A termination closes the period first, returning unearned prepaid fixed time, then applies quality compensation to elapsed fixed time plus billable usage. All computations use unrounded amounts until the final cent amount. Cap the combined refund to the charged amount. Net uncollected receivables against credits before moving remaining cash or debt; issue no duplicate full cash refund against an already cancelled receivable. Keep gross charges, credits, receivable adjustment, and cash movement separately visible.

At a boundary shared by close and renewal: finish old-period processing and settlement, apply any departure, then renew only a still-active contract. This prevents charging a new advance to a customer who just left. Player commands accepted between ticks cannot rewrite earlier closed accounting.

## Finite jobs

| Job demand | Advance fee | Deadline after activation h | Reference lateness h |
|---|---|---|---|
| analytics-job | 100 | 12 | 3.0 |
| transcode-job | 180 | 16 | 4.0 |
| batch-job | 240 | 24 | 6.0 |
| training-job | 400 | 24 | 6.0 |
| distributed-training-job | 1600 | 48 | 12.0 |

Set reference lateness to 25% of quoted execution duration, minimum 1h. Terms are frozen at acceptance. No weekly fixed fee or usage fee applies to these finite templates. Existing delivery bands apply: on-time 0%, any positive delay through 2 intervals 10%, >2–5 intervals 25%, >5–10 intervals 50%, >10 intervals full refund and termination. At a boundary where completion and full-refund cutoff coincide, evaluate the exact lateness band first; beyond ten intervals the full-refund termination wins. At exactly ten intervals the 50% band still applies. Refund once for abandonment or customer cancellation. Lateness costs do not introduce retries.

## Setup and relationship scope

Setup allowances for continuous templates are in the project table; finite templates use 48h. They are distinct from job execution deadlines. Numeric trust/reputation/hatred coefficients, offer progression, and dissatisfaction thresholds are specified in [Customers and offers](customers-and-offers.md). No new random cancellation draw is introduced.

Later incident-attribution decision qualifies the baseline above: unexplained failures count against the player; monitoring-proven customer software/data incidents are exempt from player SLA compensation. Player hardware/configuration incidents increase hatred; successful recovery of customer incidents reduces it once. Operational charts retain actual failures. Attribution, overlapping-cause accounting, and the recovery reward coefficient must be integrated before these earlier generic stress/settlement formulas are used as runtime policy.

Responsibility changes only prospectively from monitoring detection. Earlier failures and relationship consequences retain their prior attribution, even in the current unclosed period; no retroactive credits or reputation restoration are generated by later diagnosis. Record detection at the agreed tick boundary, with no subticks.

Overlapping causes: a player-owned fault independently sufficient to fail the same demand retains player responsibility. Only failures caused solely by an established customer-owned cause are exempt. Attribute at affected-demand-group scope, count each external failure once, and do not treat an unrelated project incident as grounds for blame or exemption.

Prepared-server duplication uses 25% of the corresponding fresh installation/configuration work as its base, then applies the acting person's Deployment Automation factor (0.92 per completed level). Accumulate fractional work without subticks; apply readiness on an outer boundary. Hardware acquisition costs and actual data transfer are not discounted by this work factor. This makes project duplication faster than fresh preparation while retaining the skill effect.

Duplication scope is the current project only, even on shared hardware. No Inventory action duplicates all hosted projects together.

Migration keeps the source serving while the destination is prepared and data transferred. Transfer competes for actual resources. Perform handover at an outer-tick boundary only once the destination is ready; do not count destination preparation as extra serving capacity. Deactivate the source instance after handover without affecting unrelated services.
