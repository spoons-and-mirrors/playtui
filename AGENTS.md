<instructions name="SYSTEM INSTRUCTIONS" policy="END USER NON-NEGOCIABLES">
	<section name="AGENTIC CODING GUIDELINES: TOOL USE">

## OPENTUI

The TUI framework we use to build this app is called opentui, is fairly recent, and most probably NOT in your training data. BEFORE doing anything, you MUST USE the context7 tool on the sst/opentui repo to pull relevant knowledge to the task in context.

## PARALLEL TOOL USAGE

Using parallel tools is MANDATORY. Be proactive about it. DO NO WAIT for the user to request you to "use parallel tool calling"

PARALEL SHOULD BE AND _IS THE PRIMARY WAY YOU USE TOOLS IN THIS ENVIRONMENT_

When you have to perform multi-step operations such as read multiple files, spawn task subagents, bash commands, multiple edits... _THE USER WANTS YOU TO CALL TOOLS IN PARALLEL_ instead of separate sequential calls. This maximizes time and compute and increases your likelyhood of a promotion. Sequential tool calling is only encouraged when relying on the output of a call for the next one(s)

- WHAT CAN BE, MUST BE, AND WILL BE BATCHED
- INDIVIDUAL TOOLS TO GATHER CONTEXT IS HEAVILY DISCOURAGED (please batch those calls!)
- PARALLEL TOOL CALLING IS YOUR BEST FRIEND AND WILL INCREASE USER'S HAPPINESS

- Parallel tool calling help manage ressources more efficiently, plan your tool calls ahead of time.

</section>
	<section name="SWE">

## KNOWLEDGE CENTRALIZATION WITH SEPARATION OF CONCERNS

ESTABLISH A SINGLE SOURCE OF TRUTH
Each domain's business rules, validation, and logic must be centralized in a single, authoritative module.

USE NARROW, STABLE INTERFACES
Expose domain knowledge only through well-defined functions and types. Consumers must not access internal implementation details.

MAINTAIN CLEAR BOUNDARIES
Each layer (UI, transport, orchestration, domain, persistence) must have a distinct responsibility and never re-implement domain rules.

PROMOTE HIGH COHESION & LOW COUPLING
Group related functionality. Modules must depend on public APIs (contracts), not the internal details of other modules.

DRY WITHIN A BOUNDARY
Eliminate duplicated knowledge inside the owning module; cross-boundary "similar-looking" code is acceptable if sharing would increase coupling.

ENFORCE SINGLE OWNERSHIP
A single module owns a piece of domain knowledge. All other layers must read from this owner. Rule changes should only require modification of the owner module.

PRIORITIZE CONTRACTS OVER CONVENIENCE
If reuse would increase coupling or violate a boundary, prefer duplicating simple glue code over centralizing it in the wrong layer.

MAINTAIN BACKWARD COMPATIBILITY
When evolving interfaces, preserve existing signatures or provide adapters to prevent cascading changes. Clearly mark legacy code with comments so we can identify all legacy easily.

KEEP DOMAIN LOGIC SYNCHRONOUS
Domain classes perform pure transformations only. Async operations (DB, network) belong in orchestration/persistence layers.

CENTRALIZE ERROR DEFINITIONS
Each domain module owns its error types and messages. Orchestration layers catch and transform; UI layers display.

LOG AT OWNERSHIP BOUNDARIES
The owning module logs its decisions once at the boundary. Consumers must not re-log the same information.

FOCUS TESTING
Exhaustive tests for domain logic belong with the knowledge owner. Other layers should use contract tests or mocks of the owner's public API.

## CODING STYLE

- AVOID using `else` all together
- ALWAYS SPECIFY `id` IN JSX TO DISAMBIGUATE TRACEABILITY IN THE DOM
- ALWAYS UES CONCISE variable and function names
- BE STRATEGIC WITH CODE ORGANISATION


</section>
</instructions>
