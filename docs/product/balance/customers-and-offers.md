# Customer, offer, and commercial baseline

This is delegated design-0.1 policy work, not a claim of live behavior or playtested tuning. Numbers are centralized in baseline.json under customer and offers policies. Relationships are per customer, reputation is per business. All scores are clamped to 0–100. Monetary compensation is independent of relationship scores.

## Initial state and updates

Reputation starts at 0. The first acquaintance starts with trust 70 and hatred 0; later new customers start with trust 40 and hatred 0. Accepting or declining offers changes none of these scores.

Evaluate each customer's active service quality once per hour. Let f be failed required demand / resolved required demand, and a be the contracted allowed failure fraction. For each active contract set stress=min(3,max(0,f/a−1)); with no resolved demand, stress is zero but the hour earns no trust. Average stress across the customer's active contracts with equal contract weights, so merely splitting a contract cannot multiply relationship damage. This stress is a relationship signal, not a replacement SLA settlement formula.

A demanded hour meeting all the customer's active service targets increases trust by 0.02. An affected hour reduces trust by 0.10 × stress. Additional trust loss for unannounced downtime is 0.25 per affected customer-hour, regardless of number of shared failed components. Notifying after the incident stops future unannounced-hour penalties, not previous ones. Any downtime adds 0.20 hatred per customer-hour whether announced or not; other over-target degradation adds 0.05 × stress. Use the downtime increment instead of stacking both hatred increments for the same hour. A calm hour reduces hatred by 0.10, even when there is no demand; it does not automatically restore trust. Round scores for display only.

Reputation is updated at contract outcomes: +2 per healthy continuous billing period, +2 for an on-time finite job, −1 for a period with at least 25% compensation, −3 for setup withdrawal due to delay, and −5 for post-launch departure caused by poor service. Positive reputation gains are capped at +2 per customer per global 168-hour window to limit farming tiny jobs; negative departure penalties replace, rather than stack with, a period-quality penalty at that same close. Successfully served strict customers use the same starting reward; offer-tier thresholds, not arbitrary revenue multipliers, govern progression.

## Setup tolerance

After the contract's stated setup allowance, initialize a patience budget in hours:

B = 6 × (1 + 2 × trust/100 + reputation/100 − 0.25 × hatred/100).

Freeze that budget when the allowance expires; decrement it by one each simulated hour until zero, then withdraw and refund as agreed. This is deterministic, not another random roll. Across full score ranges trust changes B by 12h, reputation by 6h, and hatred by 1.5h: the agreed importance ordering is explicit. The minimum B is 4.5h; evaluate expiration on an outer-tick boundary. First acquaintance at trust 70, reputation 0, hatred 0 gets 14.4h after the 24h allowance, withdrawing at the first boundary reaching 38.4h if preparation never completes. No hidden resetting by toggling project state.

## Active-service tolerance

Maintain dissatisfaction per active contract, initially zero. Each hour add its stress above, or reduce dissatisfaction by 0.5 during an hour with zero stress. Clamp at zero. The departure threshold is 24 × (1 + trust/100 + 0.5 × reputation/100 − 0.10 × hatred/100), evaluated using current scores. At zero relationship scores a persistent maximum-stress outage reaches departure in roughly eight hours; good history provides more tolerance. Announced outages still create performance stress and inconvenience. Finite jobs use their delivery/refund cutoff rather than a second service-demand cancellation clock. Exact same-tick order: classify service, update relationships and dissatisfaction, evaluate departure, then settle; no double refund.

## Offer progression

The first appointment offer is available at the start. After accepting it, further offers are generated only at the next eligible opportunity, not as a prefilled professional board. At each interval, add at most one offer if the visible pending-offer cap allows it. These intervals are deterministic defaults; customer identity and template selection can use a seeded stream. Offers remain open for 48h, then expire without penalty. No paid refresh or reputation reward for acceptance.

| Minimum reputation | Offer interval h | Pending offer cap | Highest standard SLA tier |
|---|---|---|---|
| 0 | 24 | 1 | 80% |
| 2 | 24 | 2 | 90% |
| 6 | 18 | 2 | 95% |
| 12 | 12 | 3 | 98% |
| 20 | 12 | 3 | 99% |
| 35 | 8 | 4 | 99.9% |
| 55 | 6 | 4 | 99.99% |
| 80 | 4 | 5 | 99.999% |

At reputation zero, only acquaintance-style appointment variants appear. At reputation two, community variants join. At six and above, researched project families become eligible; keep the template's target no higher than the unlocked tier. Do not silently lower a professional template's target or change its signed price. Ineligible templates simply do not appear. Pending caps limit offers, not active projects. Research closure must be satisfied before offering a template. Releasing an offer slot does not immediately reroll it; the next scheduled opportunity applies. Contract terms freeze at acceptance.

## Commercial options

No negotiation system, counteroffers, customer-wide price multiplier, or multi-project master agreement in this baseline. Each project has its own explicit contract. Rejecting or allowing an offer to expire removes that offer only, has no relationship penalty, and does not blacklist the customer. A later independently generated offer from that customer is allowed; the rejected offer is not reinstated by refresh. There is no permanent customer rejection feature. These are selected defaults under the user's delegation, not another approval queue.

Later incident-attribution decision qualifies the baseline above: unexplained failures count against the player; monitoring-proven customer software/data incidents are exempt from player SLA compensation. Player hardware/configuration incidents increase hatred; successful recovery of customer incidents reduces it once. Operational charts retain actual failures. Attribution, overlapping-cause accounting, and the recovery reward coefficient must be integrated before these earlier generic stress/settlement formulas are used as runtime policy.

Responsibility changes only prospectively from monitoring detection. Earlier failures and relationship consequences retain their prior attribution, even in the current unclosed period; no retroactive credits or reputation restoration are generated by later diagnosis. Record detection at the agreed tick boundary, with no subticks.

Overlapping causes: a player-owned fault independently sufficient to fail the same demand retains player responsibility. Only failures caused solely by an established customer-owned cause are exempt. Attribute at affected-demand-group scope, count each external failure once, and do not treat an unrelated project incident as grounds for blame or exemption.

Configuration risk follows the configuring person's skill and can manifest randomly during operation, not only at task completion. Courses improve player or employee skill. Quality Checks reduces risk independently. This is distinct from customer relationship scores; no trust or reputation coefficient substitutes for technical skill.
