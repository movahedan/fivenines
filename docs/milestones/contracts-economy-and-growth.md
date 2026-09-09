# Contracts, economy and business growth

Milestone 6 of 10. Status: planned; no implementation PR is claimed delivered. Follow the [standing delivery workflow](README.md).

## Outcome and boundaries

Generalize the first commercial loop delivered in milestones 4–5 to version-one contracts, relationships and business growth. Reuse its acceptance, activation, ledger, settlement and debt rules.

Use deterministic boundary tests and ledger reconciliation before stochastic balance runs. Incidents in milestone 7 will expand attribution evidence; do not invent cause visibility here.

## Prerequisites and sources

[Resource allocation and system execution](resource-allocation-and-execution.md), including the learning money-posting boundary from milestone 3.

Product sources: [gameplay](../product/gameplay.md), [product direction](../product/product-direction.md), [contracts and time](../product/balance/contracts-and-time.md), [customers and offers](../product/balance/customers-and-offers.md), [hardware and economy](../product/balance/hardware-and-economy.md).

## Proposed PR sequence

These are outcome-sized slices, not fixed file lists. Inspect current code and merged predecessors before planning each PR. Keep the app runnable, integrate the corresponding production UI, and split a slice when its actual review surface warrants it.

| Slice | Depends on | Deliverable |
|---|---|---|
| Acceptance and setup contracts | Milestone prerequisite | Extend the existing acquaintance acceptance/setup path to other version-one offers and terms; preserve advance, cancellation and activation billing origin. Do not implement a second contract lifecycle. |
| Obligations and settlement ledger | Acceptance and setup contracts | Evaluate workload-specific commitments and finite-job settlement from execution outcomes. Extend the existing ledger to usage receivables, finite-job terms and remaining settlement cases; preserve hourly costs, renewal, credits and learning postings. |
| Relationships and financial recovery | Obligations and settlement ledger | Implement departure and trust/reputation/hatred policies, notified interruptions and recoverable debt. Verify the earlier debt recovery and interruption accounting across all contracts; complete tenure and salvage cases. |
| Offers and business progression | Relationships and financial recovery | Implement low-reputation acquaintance offers, expanding project/SLA eligibility and the complete financial/project detail flows. Verify the first and second project validation sequence. |

## Acceptance and verification

- Acceptance collects the periodic advance immediately; setup duration does not consume the activated service billing period. Slow setup can cause departure and the specified refund.
- Trust, reputation and hatred preserve their agreed relative influence. Low reputation cannot access high-trust contracts, and offered SLA targets remain below 100%.
- Continuous services and finite jobs apply their own obligations to authoritative outcomes. Refunds, receivable netting and credits cannot charge or return the same amount twice.
- Departure/completion and renewal coincidences follow the transition model. Announced interruption still has its contractual and relationship effects; stopping is never a free escape from obligations.
- Owned power-off avoids the specified operating costs; lease rent continues. Healthy sale returns 80%, hardware-damaged sale 60%; unrelated software faults do not reduce salvage.
- Debt restriction can be recovered from. A player can sustain the first project for roughly three cycles and then both for three further cycles without a mandatory waiting gate or Opening Shift mode.

Apply the [shared verification gates](README.md#verification-gates) to each affected slice. Record exact commands and results in the PR; record integrated milestone evidence below after merge.

## Interface integration

Deliver offer list and full contract bottom drawer on both devices, bold key terms, explicit acceptance, top-bar financial status, Finances and project settlement details. Keep existing login requirement; do not add guest play.

## Delivery record

| Slice | Status | PR | Verification evidence |
|---|---|---|---|
| Acceptance and setup contracts | Planned | — | Not run |
| Obligations and settlement ledger | Planned | — | Not run |
| Relationships and financial recovery | Planned | — | Not run |
| Offers and business progression | Planned | — | Not run |

No new product decision is required to begin planning. Implementation trade-offs belong in the assigned PR plan; escalate only a concrete contradiction or material scope change.
