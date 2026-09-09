# Course and incident balance

Design-0.2 supplies delegated numeric defaults, not final playtest outcomes. All values live in baseline.json; behavior algorithms consume them. Technology research and courses have two shared slots, monthly advance tuition, retained progress on pause/cancellation, and completion-only benefits. Course levels are sequential with a cap of five; technology unlocks once.

## Course catalog

All five courses take 1/2/3/4/5 financial cycles for levels 1/2/3/4/5. A cycle is 168 game hours. Each level is a new enrollment with its own four-week paid month. Completing exactly at the paid-month boundary is processed before renewal, so a four-week level costs one payment, not two. A five-week level costs two full payments. Active course effects are multiplicative, not additive percentage-point subtraction.

| Course | L1 monthly | L2 monthly | L3 monthly | L4 monthly | L5 monthly | Factor per level | Effect after L5 |
|---|---|---|---|---|---|---|---|
| System Administration | 20 | 25 | 30 | 35 | 40 | 0.9 | 40.95% reduction |
| Deployment Automation | 20 | 25 | 30 | 35 | 40 | 0.92 | 34.09% reduction |
| Incident Response | 25 | 32 | 38 | 44 | 50 | 0.9 | 40.95% reduction |
| Performance Tuning | 35 | 44 | 53 | 62 | 70 | 0.95 | 22.62% reduction |
| Data Recovery | 25 | 32 | 38 | 44 | 50 | 0.9 | 40.95% reduction |

System Administration uses the current configuring person's completed level, including on existing configurations. Combine its 0.90^level risk factor with Quality Checks ×0.50, so maximum training plus checks yields 0.295245 of base configuration risk; never zero. Software risk has Quality Checks ×0.70 but not a System Administration reduction.

Deployment Automation reduces installation/configuration work, not hardware power-on (already immediate), research durations, or data-transfer bytes. Incident Response reduces diagnosis and repair work, but never bypasses monitoring evidence. Performance Tuning reduces application CPU and GPU work only, not network payload, persistent data, installed RAM, or server capacity. Data Recovery reduces restore preparation and processing work, not bytes to read or transmit. Course effects apply to work performed by that person; never multiply all employees' skills on the same task. Existing player-configured software uses the player's current Performance Tuning level. Full employee assignment remains deferred.

Represent fractional operational work in hours; spend whole-tick capacity and retain fractions until completion, without subticks. Minimum visible completion is the next applicable outer boundary. Changing a skill changes remaining work rate, not completed work or historical outcomes. The two learning slots do not consume the player's operational work slot.

## Random incidents

| Family | Eligible entity | Base probability/hour | Chance of at least one / 168 eligible hours | Response |
|---|---|---|---|---|
| Hardware | Healthy powered-on server | 0.00015 | 2.49% | 3h repair + parts at 2% purchase price |
| Software | Healthy running instance | 0.0003 | 4.92% | 1h restart or prepared replacement |
| Configuration | Active healthy configuration | 0.00025 | 4.11% | 2h corrective configuration |
| Data corruption | Healthy active data-bearing instance | 2e-05 | 0.34% | Restore intact backup or eligible independent copy |

Do not roll a new incident of the same family while it is unresolved on that entity; other-family overlaps follow the agreed attribution rule. Powered-off assets do not roll operational incidents. Hardware events are per physical asset, not per project view. Software/configuration rolls are per actual instance/configuration, not per incoming request. Data corruption is a data-bearing-instance event, not an event on every stateless process. Overload is computed, never randomly rolled. Existing region latency is unchanged; no region-wide disasters or attack events are added by these rates.

Monitoring diagnosis requires two units of hourly work, reduced by Incident Response. Health Checks only establish service readiness, not fault responsibility. Exact allocation of automated diagnosis work remains execution design; the numeric work budget does not require a new user action. Responsibility changes only at diagnosis completion; before that, failures remain player-attributed. No retroactive corrections.

For hatred, a confirmed player hardware incident adds 1 point once per affected customer; a configuration incident adds 0.5. Generic downtime mood cost still applies to player-attributed/unknown downtime, but not solely customer-proven failures. Do not repeatedly award occurrence penalties each tick or per internal failed request. Successful recovery of an established customer-owned incident subtracts 2 hatred once, clamped at zero. Merely installing protection earns nothing. Apply customer stress only to player-attributed failures, excluding known solely customer-owned failures from both the player SLA numerator and denominator. Keep physical failed counts and excluded counts separate. If every failure is exempt and no eligible demand remains, player SLA is N/A, not a fabricated success; player compensation is zero. Mixed player-sufficient causes remain attributable. These qualifications supersede the earlier generic all-downtime stress wording.

## Checkpoints

After each six hours of active job execution, attempt one checkpoint. Size is max(16 MiB, 10% of the job's working-memory requirement). Two completed copies are retained; allow space for a third in-progress write before replacing the oldest. A write consumes its bytes in disk throughput, one storage operation and 0.10 CPU work per MiB. Write at most one checkpoint per job concurrently; no per-request objects, no substeps. When no space is available, skip the attempt and alert; it is not a demand retry. A later scheduled checkpoint is a fresh periodic save. Only a fully written intact copy is usable.

Restoration requires explicit Resume, one hour of setup work reduced by Data Recovery, plus reading/transferring the checkpoint through actual available resource budgets. Keep the contract deadline and discard progress after the restored checkpoint. No checkpoint means lost running work fails permanently. Checkpoint interval counts active execution hours, not hours waiting for resources. Timing is implemented on outer ticks.

An 8,192 MiB working set produces an 819.2 MiB checkpoint: 81.92 CPU work and 819.2 MiB disk writes per save, plus operation count. At 16,000 CPU work over 13.33h of a sample distributed job, checkpoint CPU overhead is around 1–2%, depending on completed save count; bytes and storage limits remain real constraints. This is an aggregate model, not filesystem persistence implementation.
