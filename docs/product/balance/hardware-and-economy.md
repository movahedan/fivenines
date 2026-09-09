# Hardware and economy baseline

All prices are fictional currency units. Money is recorded in integer minor units; tables use whole currency for readability. CPU capacity/hour is cores × coreFactor × 1000. GPU rate is per compatible device, and GPU memory is per device, not an automatically pooled memory space. Each server reserves 256 MiB for its system before installation memory and active work.

| Server | Cores | Core factor | RAM MiB | Disk GiB | Network Mbps | Disk MiB/s | IOPS | GPU count | GPU work/device/h | GPU MiB/device | Buy | Rent/day | Maintenance/h | Idle power/h | Max power/h |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| general-small | 2 | 1 | 2048 | 64 | 100 | 50 | 2000 | 0 | 0 | 0 | 240 | 2.5 | 0.04 | 0.06 | 0.14 |
| general-medium | 4 | 1.1 | 8192 | 256 | 500 | 150 | 8000 | 0 | 0 | 0 | 650 | 6 | 0.08 | 0.1 | 0.26 |
| general-large | 8 | 1.2 | 16384 | 512 | 1000 | 300 | 16000 | 0 | 0 | 0 | 1400 | 13 | 0.16 | 0.18 | 0.5 |
| compute-large | 16 | 1.5 | 16384 | 256 | 1000 | 300 | 16000 | 0 | 0 | 0 | 2400 | 22 | 0.22 | 0.25 | 0.9 |
| memory-large | 8 | 1.1 | 65536 | 512 | 1000 | 400 | 20000 | 0 | 0 | 0 | 2600 | 24 | 0.24 | 0.22 | 0.6 |
| storage-large | 4 | 1 | 16384 | 4096 | 2000 | 800 | 40000 | 0 | 0 | 0 | 3000 | 28 | 0.3 | 0.28 | 0.7 |
| network-large | 8 | 1.2 | 16384 | 512 | 10000 | 400 | 20000 | 0 | 0 | 0 | 2800 | 26 | 0.26 | 0.25 | 0.65 |
| gpu-small | 8 | 1.2 | 32768 | 512 | 1000 | 400 | 20000 | 1 | 10000 | 8192 | 4000 | 38 | 0.4 | 0.4 | 1.6 |
| gpu-large | 16 | 1.3 | 65536 | 1024 | 10000 | 800 | 40000 | 2 | 12000 | 16384 | 9000 | 85 | 0.8 | 0.7 | 3.2 |

Network capacity is Mbps × 1,000,000 × 3600 / 8 bytes per tick. Disk throughput is MiB/s × 3600 MiB per tick, and operation capacity is IOPS × 3600. Disk occupancy remains persistent capacity. These rates do not add seconds-based simulation loops.

Powered-on owned cost/hour = maintenance + idlePower + (maxPower − idlePower) × u, where u is the achieved bottleneck utilization clamped to [0,1]. A leased server pays the same operating costs plus dailyRent/24 each hour. Rent continues while powered off; owned off-state operating cost is zero. Power-on is immediate and free. Fractional money carries forward rather than rounding every tiny tick charge to zero. Healthy-hardware resale is 80% of recorded purchase price. For a hardware-faulty server, subtract 20% of recorded purchase price from that normal resale amount (60% net). Round the final amount down to cents. Software, configuration, and data incidents cause no discount. Prior repair is not required; no bonus from subsequent catalog price changes.

Starting cash: 500. Credit limit: 200. Debt strictly greater than 200 blocks new contracts and acquisitions, with automatic release when back within the limit. Purchase requires enough cash to cover its price; leasing has no deposit and accrues hourly. Costs and refunds can create debt. Owned/server operating actions remain available as agreed. Software has no recurring license charge in this baseline; external gateway/CDN fees are abstracted into the contract price until an explicit provider-cost model is approved.

Queue reserve limits: up to 10% of installed RAM for volatile queues and 5% of disk for durable queues, further constrained by actual free capacity. These limits are automatic, not player-configurable shares. Storage-resident payloads consume disk independently of metadata. A demand batch adds 256 bytes of bookkeeping plus its per-item queue cost. Resource allocation must not spend queue-reserved bytes twice.

## Intended trade-offs

Compute hardware buys CPU throughput; memory hardware buys resident dataset/model capacity; network hardware supports media concurrency; storage hardware carries larger datasets; GPU hardware requires compatible jobs. No trap SKU is included. Choosing any server without a suitable workload remains costly. All server families can be researched/used as capabilities allow; no extra invented hardware level gate is applied.

For the following CPU-only arithmetic examples, assume power utilization u equals mean CPU demand divided by CPU capacity. They exclude other resource bottlenecks and are not full operating-cost predictions.

At 120 root requests/hour, the first project's mean CPU requirement is 144 work/hour: 80% × 1 + 20% × 2 per root. This is 7.2% of general-small's 2000 work/hour. Its fixed income is 80/week, mean operating expense approximately 17.77/week, leaving approximately 62.23/week before incidents, research, and purchases. The 240 purchase pays back in about 3.86 operating weeks. This is intentionally forgiving rather than a 72-hour payback target.

A second community project at 240/hour adds 264 CPU work/hour. Combined CPU is 408/hour (20.4%); weekly fixed income is 190 and mean operating cost approximately 19.54, leaving approximately 170.46 before incidents and investment. This rewards shared infrastructure but also concentrates hardware-failure risk. Four resident app/database installations plus system reserve use 1024 MiB before active work and queues, leaving meaningful room on the 2048 MiB starter server.

These are analytic steady-state checks, not a proof of full gameplay balance. Fault rates, routing, correlated bursts, component overhead, and player actions require the future engine harness. Do not call these figures measured playtest outcomes.

The resale baseline is 80% of purchase price for healthy hardware and 60% for faulty hardware. A 240 server therefore sells for 192 or 144. Software, configuration, and data faults do not affect resale.
