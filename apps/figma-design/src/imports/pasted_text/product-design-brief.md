Design Five Nines, an infrastructure tycoon game, for mobile and desktop.

You are designing the player experience, not implementing the simulation engine. The player runs an infrastructure business: accepts customer contracts, prepares project systems, buys or leases servers, operates services, researches technologies, and handles failures under financial and time constraints. Customers own their applications and business outcomes.

Use the supplied documentation as the source of truth. Manage your context carefully: do not read every file upfront.

READ FIRST, IN THIS ORDER
1. docs/product/introduction.md
2. docs/product/interface-design-brief.md
3. docs/product/interaction-specification.md
4. docs/product/figma-make-handoff.md

READ SELECTIVELY WHEN NEEDED
- domain-model.md: entity ownership and relationships.
- gameplay.md: the specific behavior behind a flow you are designing.
- technology-catalog.md, especially “Version-one scope”: eligible capabilities.
- balance documents: only when a screen needs an exact value or contract term.

Do not load baseline.json in full. Do not read source code, Cursor plans, milestone documents, repository setup guides, or historical validation reports. They are not needed to design this experience.

SCOPE
Design the complete version-one experience, progressively, within one coherent design system. Version one includes 31 technologies: two initially available tools and 29 research unlocks. The 12 expansion candidates are outside this design scope. Do not create screens or controls for removed technologies, employees, offline progression, or other deferred features.

All interface text must be English. Use recognizable real-world terminology. Do not invent gameplay rules, currencies, rewards, technology requirements, or additional management systems to fill the interface.

CORE INTERFACE
- Mobile: four destinations—Projects, Inventory, Learning, Finances—with a prominent central “New project” action.
- “New project” opens available offers. It does not immediately accept a contract.
- Desktop: expandable/collapsible folder-like rail panels with vertical labels for the same four destinations.
- Both: a persistent top bar for important game status.
- Use bottom drawers on both mobile and desktop for offers, details, and contextual flows.
- Follow the documented placement of floating operational and learning progress indicators. Keep the active workspace usable.

PROJECT WORKSPACE
The main project view is its system diagram.
- Show servers as racks containing that project’s installed software.
- Show a compact basic activity/resource summary beneath each server.
- A physical server can be shared by multiple projects; installations belong to specific projects.
- Distinguish placement, service dependencies, and traffic-routing connections.
- Provide contextual actions for the selected server, software instance, or load balancer. Follow the documented action hierarchy instead of covering every object with buttons.
- Desktop keeps project Status, Performance, and Finances accessible beside the system diagram.
- Mobile adapts these details to the documented compact navigation and drawer patterns.

GAME FEEL
Make this feel like an approachable tycoon game with tangible infrastructure and meaningful consequences. Prioritize readable systems, customer relationships, money pressure, progress, and recovery decisions.

Monitoring adds detailed metrics, retained errors, and alerts. Basic server status remains visible without it. Missing monitoring data must appear as missing data, not zero or invented measurements. Do not add a special “Monitoring is down” alert.

Contracts must be understandable before acceptance: show full details and visually emphasize payment, setup allowance, service commitments, and cancellation/refund terms.

WORKING APPROACH
Start by creating the shared visual language and one connected, high-fidelity journey:
1. Review an acquaintance’s project offer and contract.
2. Accept it and see the advance payment.
3. Choose whether to buy or lease a server.
4. Install the application and database, configure them, and explicitly Start.
5. Inspect operation and the first billing-period outcome.
6. Research and install Monitoring.
7. Inspect a diagnosed incident and perform a repair.

Use this journey to establish the reusable navigation, rack/module components, inspectors, drawers, charts, status indicators, and action patterns. Then extend the same system across the remaining version-one flows. This first journey is a design sequence, not a new tutorial mode or scripted gameplay requirement.

Show representative empty, locked, selected, pending, blocked, failed, and recovered states. Include shared-server impact and insufficient-funds cases. Charts need both compact sparklines and detailed views, with clear labels and missing-data handling.

Make interactions work with touch and keyboard; never depend on hover alone. Use a design that can be implemented with shared React Native components on web and mobile. Prototype code and libraries are disposable references, not production architecture. Do not use Spline or require 3D rendering.

Use realistic, internally consistent sample data. Keep simulated prototype behavior clearly separate from actual engine implementation.

Before generating screens, briefly summarize the files you read, the version-one scope, and the first journey you will design. Ask only if the documents contain a material contradiction; otherwise proceed.