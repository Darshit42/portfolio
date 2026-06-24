# Requirements Document

## Introduction

Agent Town adds autonomous, Smallville-style generative agents to Devhalla. The seven existing NPCs are given cognitive loops — memory streams, reflection passes, and daily planning — so they wander the 3D town, choose activities at buildings, and converse with each other. The frontend drives the existing CharacterRig and Npcs system from a stream of world events, adding speech bubbles and an Agent Inspector panel. A two-mode architecture keeps the portfolio fully functional without a live backend: a baked replay log ships with the site and plays deterministically at zero cost; a gated Live Mode optionally streams real LLM-generated events from a FastAPI server when the visitor explicitly activates it.

---

## Glossary

- **Agent**: An autonomous entity that corresponds to an existing NPC (barkeep, guildmaster, oracle, automaton, merchant, blacksmith, guard). Each agent has identity, memory, relationships, a current plan, position, and activity.
- **Memory_Stream**: An append-only, time-stamped list of observations, actions, and reflections stored per agent.
- **Reflection**: A higher-level summary insight derived from a cluster of Memory_Stream entries during the Reflection pass.
- **Daily_Plan**: A time-ordered schedule of activities generated once per simulated day by the Planning pass.
- **Simulation_Engine**: The FastAPI Python server (`apps/server`) that runs the agent cognitive loop.
- **Tick**: One iteration of the Simulation_Engine loop; produces zero or more world events.
- **World_Event**: A typed JSON object emitted by the Simulation_Engine describing one agent action: `move`, `speak`, `arrive`, `reflect`, or `activity`.
- **Event_Log**: An append-only sequence of World_Events written to a single JSON file by the Simulation_Engine.
- **Baked_Log**: A pre-generated Event_Log shipped in `public/sim-logs/` and bundled with the frontend. Powers Replay Mode.
- **Replay_Mode**: The default frontend mode. THE Event_Player reads from the Baked_Log and drives NPC rigs at playback speed.
- **Live_Mode**: An optional frontend mode, activated by an explicit user control, that streams World_Events from the Simulation_Engine over SSE.
- **Event_Player**: The frontend subsystem that consumes an Event_Log or SSE stream and translates World_Events into RigCtrl mutations, speech bubble state, and Agent Inspector state.
- **RigCtrl**: The existing animation control interface `{ move, heading, speed, oneShot, oneShotSeq }` consumed by CharacterRig.tsx.
- **Speech_Bubble**: A DOM or R3F overlay that displays a spoken line above an NPC for a fixed display duration.
- **Agent_Inspector**: A UI panel that shows an agent's Memory_Stream, current Daily_Plan, and relationship map when the player clicks the agent.
- **Rumor_Seed**: An injected observation written directly into one agent's Memory_Stream via the Simulation_Engine API.
- **Token_Budget**: The maximum number of LLM tokens the Simulation_Engine is allowed to spend per Live_Mode session.
- **Kill_Switch**: A server-side mechanism that terminates Live_Mode and closes the SSE connection when the Token_Budget is exhausted or a timeout elapses.
- **Fallback**: The automatic transition from Live_Mode to Replay_Mode when the SSE connection cannot be established or is lost.
- **Pathfinder**: The frontend subsystem that computes a straight-line or waypoint path for an NPC from its current position to a target building approach point, respecting world bounds.
- **WORLD_RADIUS**: The existing constant (48) bounding the playable disc.
- **WORLD_CENTER**: The existing constant `[0, 1]` representing the disc center.
- **Building_Approach**: The `approach: [x, z]` field on each Building that designates the NPC standing point for that building.
- **Cosine_Memory_Index**: An in-memory (or SQLite-backed) vector index used to retrieve the top-k most relevant Memory_Stream entries for a given context query.

---

## Requirements

---

### Requirement 1: Agent Data Model

**User Story:** As the Simulation_Engine, I want each agent to carry a structured cognitive state, so that memory, planning, and relationships are all queryable during each tick.

#### Acceptance Criteria

1. THE Simulation_Engine SHALL represent each agent as an object containing: `id` (string matching the existing NPC id), `bio` (natural-language persona description), `memoryStream` (array of timestamped entries), `relationships` (map from agent id to relationship description), `currentPlan` (array of scheduled activity slots), `position` ([x, z] float pair), and `activity` (string describing the agent's current action).
2. THE Simulation_Engine SHALL initialize agents from a static seed file that maps to the seven existing NPC ids: barkeep, guildmaster, oracle, automaton, merchant, blacksmith, guard.
3. WHEN an agent transitions state (position, activity, memory, plan), THE Simulation_Engine SHALL update the in-memory agent object atomically before emitting the corresponding World_Event; THE Simulation_Engine MAY also emit World_Events when no state transition occurs.
4. THE Simulation_Engine SHALL persist the agent state snapshot to disk at the end of each simulated day so that a subsequent bake run can resume from the last known state.

---

### Requirement 2: Memory Stream

**User Story:** As an agent, I want to record observations and actions as they happen, so that I can reason from recent experience when deciding what to do next.

#### Acceptance Criteria

1. WHEN an agent observes another agent, a building, or a conversation, THE Simulation_Engine SHALL append a timestamped observation entry to that agent's Memory_Stream.
2. WHEN an agent completes an action (move, speak, activity), THE Simulation_Engine SHALL append a timestamped action entry to that agent's Memory_Stream.
3. THE Memory_Stream SHALL be append-only; THE Simulation_Engine SHALL never delete or modify existing entries.
4. THE Cosine_Memory_Index SHALL store an embedding vector alongside each Memory_Stream entry so that relevance retrieval is possible without scanning every entry.
5. WHEN the Simulation_Engine requires context for a decision, THE Cosine_Memory_Index SHALL return exactly the top-5 most relevant Memory_Stream entries for the decision query regardless of the decision type.
6. THE Simulation_Engine SHALL use only in-process (in-memory or SQLite) storage for the Cosine_Memory_Index; no external vector database SHALL be required.

---

### Requirement 3: Reflection Pass

**User Story:** As an agent, I want to periodically distill my raw observations into higher-level insights, so that long-running simulations do not degrade into incoherent behavior as the memory grows.

#### Acceptance Criteria

1. WHEN an agent's Memory_Stream grows by 20 or more entries since the last Reflection, THE Simulation_Engine SHALL trigger a Reflection pass for that agent.
2. WHEN the Reflection pass executes, THE Simulation_Engine SHALL query the LLM with the 20 most recent Memory_Stream entries and produce 3–5 Reflection entries summarising the agent's key experiences and emotional state.
3. THE Simulation_Engine SHALL append each produced Reflection entry to the agent's Memory_Stream with a `type: "reflection"` tag and the current simulation timestamp.
4. WHEN the LLM call for a Reflection pass exceeds 10 seconds, THE Simulation_Engine SHALL abort the call, log a warning, and skip the Reflection for that cycle without halting the simulation.

---

### Requirement 4: Daily Planning Pass

**User Story:** As an agent, I want a schedule generated each simulated morning, so that my wandering feels intentional and varied across the day.

#### Acceptance Criteria

1. WHEN a new simulated day begins, THE Simulation_Engine SHALL run a Planning pass for every agent.
2. THE Planning pass SHALL produce a Daily_Plan containing 4–8 time-ordered activity slots, each specifying: `time` (simulated hour 0–23), `building` (a valid building id from BUILDINGS), and `description` (natural-language summary of the intended activity).
3. THE Simulation_Engine SHALL use the agent's bio, top-5 relevant memories, and relationships as context when generating the Daily_Plan via the LLM.
4. WHEN the LLM call for a Planning pass exceeds 15 seconds, THE Simulation_Engine SHALL abort the call and assign the agent a default Daily_Plan consisting of 4 evenly-spaced visits to buildings associated with the agent's home building; WHEN the call fails for reasons other than timeout (e.g., network error, API limit), THE Simulation_Engine SHALL propagate or retry the failure according to the retry policy in Requirement 14.
5. THE Simulation_Engine SHALL clamp all building targets in a Daily_Plan to valid building ids present in the BUILDINGS list; invalid targets SHALL be replaced with the agent's home building.

---

### Requirement 5: Tick Loop and Action Decision

**User Story:** As the Simulation_Engine, I want a repeating tick loop that queries each agent's memory, decides the next action, executes it, and writes the result back, so that the simulation progresses autonomously.

#### Acceptance Criteria

1. THE Simulation_Engine SHALL run a tick loop at a configurable interval (default: 5 seconds of wall-clock time per tick, representing one simulated time unit).
2. WHEN a tick executes for an agent, THE Simulation_Engine SHALL retrieve the top-5 relevant memories, evaluate the current Daily_Plan slot, and select one of the following actions: `move` (walk to a building), `speak` (initiate or respond to a conversation), or `activity` (perform an in-place action at the current building).
3. THE Simulation_Engine SHALL select `move` when the agent is not at the building scheduled in the current Daily_Plan slot; the `move` action SHALL take priority over `speak` and `activity` when multiple conditions are met simultaneously.
4. WHEN two agents are within a 5-unit radius of each other and neither is already in a conversation, THE Simulation_Engine SHALL select `speak`; WHEN an agent selects `speak` but no other agent is within the 5-unit radius, THE Simulation_Engine SHALL still execute the `speak` action and the agent may speak without a target agent present.
5. WHEN an agent is at the scheduled building and not speaking, THE Simulation_Engine SHALL select `activity` and generate a one-sentence activity description using the LLM.
6. WHEN the LLM call for action decision exceeds 8 seconds, THE Simulation_Engine SHALL assign the default action `activity` with the description "resting quietly" and continue the tick.

---

### Requirement 6: Conversation Generation

**User Story:** As two agents meeting in the town, I want to exchange short, personality-consistent utterances, so that the world feels alive and observant players are rewarded with narrative.

#### Acceptance Criteria

1. WHEN a `speak` action is selected, THE Simulation_Engine SHALL generate a short conversation exchange of 2–4 utterance turns (alternating between the two participating agents).
2. THE Simulation_Engine SHALL supply each participating agent's bio, top-5 relevant memories, and the relationship entry linking them as context to the LLM when generating conversation.
3. WHEN the Simulation_Engine generates a conversation, THE Simulation_Engine SHALL emit one `speak` World_Event per utterance turn, in order, with fields: `agentId`, `text` (≤ 120 characters), `targetAgentId`, and `timestamp`.
4. THE Simulation_Engine SHALL append each spoken utterance as a Memory_Stream observation entry for both participating agents immediately after the conversation is generated.
5. WHEN a Rumor_Seed has been injected into an agent's Memory_Stream, THE Simulation_Engine SHALL include the seed entry in the context for that agent's next conversation generation.

---

### Requirement 7: World Event Log

**User Story:** As the frontend Event_Player, I want a well-typed, append-only event log, so that I can deterministically replay or stream agent actions without coupling to the simulation internals.

#### Acceptance Criteria

1. THE Simulation_Engine SHALL represent each World_Event as a JSON object with the mandatory fields: `type` (one of `"move"`, `"speak"`, `"arrive"`, `"reflect"`, `"activity"`), `agentId` (string), and `ts` (simulated millisecond timestamp, integer).
2. WHEN type is `"move"`, THE World_Event SHALL include `targetBuilding` (building id string) and `targetPos` ([x, z] number pair matching the building's approach point).
3. WHEN type is `"speak"`, THE World_Event SHALL include `text` (string, ≤ 120 characters) and `targetAgentId` (string).
4. WHEN type is `"arrive"`, THE World_Event SHALL include `building` (building id string) and `pos` ([x, z] number pair).
5. WHEN type is `"activity"`, THE World_Event SHALL include `building` (building id string) and `description` (string).
6. WHEN type is `"reflect"`, THE World_Event SHALL include `summary` (string summarising the reflection insight).
7. THE Simulation_Engine SHALL write each World_Event as a newline-delimited JSON entry to the Event_Log file in the order the event was produced.
8. THE Simulation_Engine SHALL provide a CLI command `bake` that runs the simulation for one full simulated day and writes the complete Event_Log to `public/sim-logs/default.json`.

---

### Requirement 8: Baked Replay Mode (Default)

**User Story:** As a portfolio visitor, I want the NPCs to be animated and alive the moment the page loads, so that the town feels inhabited even without a live backend connection.

#### Acceptance Criteria

1. THE Event_Player SHALL load `public/sim-logs/default.json` on startup and begin playback automatically when the world is mounted.
2. THE Event_Player SHALL replay events in timestamp order, interpolating real wall-clock time to simulated time at a configurable playback rate (default: 60× speed, i.e., one simulated minute plays in one real second).
3. WHEN a `"move"` event is replayed, THE Event_Player SHALL update the corresponding NPC's RigCtrl to `move: "walk"` and continuously update `heading` to face the target position until the NPC's rendered position reaches within 0.5 world units of `targetPos`.
4. WHEN a `"arrive"` event is replayed, THE Event_Player SHALL set the corresponding NPC's RigCtrl to `move: "idle"` and snap the NPC's position to the event's `pos` value regardless of whether the NPC has physically reached the target position.
5. WHEN a `"speak"` event is replayed, THE Event_Player SHALL display a Speech_Bubble above the corresponding NPC showing the event's `text` for 4 seconds, then dismiss it.
6. WHEN the Event_Player reaches the final event in the Baked_Log, THE Event_Player SHALL loop playback from the beginning without resetting NPC positions mid-stride.
7. THE Event_Player SHALL operate entirely in the browser without any network request to the Simulation_Engine; no live backend SHALL be required for Replay_Mode.
8. IF `public/sim-logs/default.json` is absent or fails to parse, THE Event_Player SHALL log a warning and leave NPCs at their static positions defined in `src/data/npcs.ts`.

---

### Requirement 9: Live Mode (Gated, Optional)

**User Story:** As a technically curious visitor who explicitly requests it, I want to trigger a live LLM-powered simulation session, so that I can observe the agents behaving differently on each run.

#### Acceptance Criteria

1. THE Event_Player SHALL not initiate any connection to the Simulation_Engine on page load; Live_Mode SHALL activate only when the visitor explicitly interacts with the "Run live tick" control.
2. WHEN Live_Mode is activated, THE Event_Player SHALL establish an SSE connection to the Simulation_Engine's `/events` endpoint and consume World_Events as they are emitted.
3. THE Simulation_Engine SHALL enforce a maximum of 6 concurrent active agents per Live_Mode session.
4. THE Simulation_Engine SHALL enforce a Token_Budget of 50,000 tokens per Live_Mode session; WHEN the Token_Budget is exhausted, THE Kill_Switch SHALL close the SSE connection and emit a terminal `"session_end"` event.
5. THE Simulation_Engine SHALL enforce a maximum session duration of 10 minutes; WHEN the timeout elapses, THE Kill_Switch SHALL close the SSE connection and emit a terminal `"session_end"` event.
6. THE Simulation_Engine SHALL cache LLM responses keyed on (agent id, memory hash, action type) and return cached results for identical inputs without issuing a new LLM call.
7. IF the SSE connection fails to establish or is lost at any point, THE Event_Player SHALL silently fall back to Replay_Mode without displaying an error message to the visitor.
8. WHEN Live_Mode is active, THE Event_Player SHALL display a visible indicator showing that the live simulation is running and the approximate remaining token budget; WHEN Live_Mode falls back to Replay_Mode, THE Event_Player SHALL keep the token budget indicator visible showing the last known budget value.

---

### Requirement 10: NPC Position Interpolation

**User Story:** As a player watching NPCs move, I want their movement to appear smooth and collision-aware, so that the town looks like a coherent world rather than agents teleporting.

#### Acceptance Criteria

1. WHEN a `"move"` World_Event is dispatched, THE Event_Player SHALL move the NPC from its current position toward `targetPos` at a constant speed of 3 world units per second.
2. THE Pathfinder SHALL compute a straight-line path from the NPC's current position to `targetPos`; WHEN the straight-line path intersects a building collider, THE Pathfinder SHALL insert one intermediate waypoint at the nearest clear point beside the collider; IF waypoint insertion fails, THE Pathfinder SHALL allow the NPC to attempt the original straight-line path.
3. THE Event_Player SHALL clamp all NPC positions to the WORLD_RADIUS disc centered on WORLD_CENTER at every frame.
4. WHEN an NPC is moving, THE Event_Player SHALL set the NPC's RigCtrl `heading` to the angle pointing from the NPC's current position toward the next waypoint; WHEN the NPC stops moving, THE Event_Player SHALL leave the heading at the last value set while moving.
5. THE Event_Player SHALL update NPC positions in the R3F frame loop (useFrame) rather than in discrete event steps, so motion is frame-rate-independent.

---

### Requirement 11: Speech Bubbles

**User Story:** As a player walking through the town, I want to see speech bubbles above NPCs when they talk, so that I can follow conversations without needing to open any panel.

#### Acceptance Criteria

1. THE Event_Player SHALL render Speech_Bubbles as DOM overlays projected from world space to screen space (using Three.js `Vector3.project`) so that they remain legible regardless of camera angle.
2. THE Speech_Bubble SHALL display the agent's name and spoken text, styled to be readable against both light and dark backgrounds.
3. WHEN two agents are simultaneously speaking, THE Event_Player SHALL render both Speech_Bubbles concurrently without overlap; Speech_Bubbles SHALL be offset vertically or horizontally as needed.
4. WHEN a Speech_Bubble's 4-second display timer expires, THE Event_Player SHALL remove it from the DOM with a 300 ms fade-out transition regardless of the `reducedMotion` setting.
5. THE Speech_Bubble component SHALL honor the existing `prefers-reduced-motion` setting stored in `useGameStore`; WHEN `reducedMotion` is true, THE Speech_Bubble SHALL appear instantly without an in animation.

---

### Requirement 12: Agent Inspector Panel

**User Story:** As a player curious about what an NPC is thinking, I want to click the NPC to open a panel showing their internal state, so that the cognitive architecture is visible and demonstrates the technical depth of the feature.

#### Acceptance Criteria

1. WHEN the player clicks an NPC in the 3D scene, THE Agent_Inspector SHALL open and display: the agent's name and bio, the 10 most recent Memory_Stream entries (most recent first), the current Daily_Plan activity slots, and the relationship map.
2. THE Agent_Inspector SHALL render as a DOM overlay panel (not inside the Canvas) with a close button and keyboard-accessible dismiss (Escape key).
3. THE Agent_Inspector panel SHALL not affect the existing `dialog` UiMode or NPC dialog system; it SHALL use a new `"agentInspector"` UI state added to the Zustand store.
4. WHEN Live_Mode is active, THE Agent_Inspector SHALL update in real time as new Memory_Stream entries arrive from the SSE stream.
5. WHEN the Agent_Inspector is open, the player's movement input SHALL be suspended using the existing FROZEN_MODES mechanism by adding `"agentInspector"` to FROZEN_MODES.
6. THE Agent_Inspector SHALL be fully keyboard navigable and meet WCAG 2.1 AA contrast requirements.

---

### Requirement 13: Rumor Seed Control

**User Story:** As a demo visitor watching a live session, I want to inject a rumor into one agent's memory, so that I can observe emergent behavior ripple through the agent network as the rumor spreads.

#### Acceptance Criteria

1. WHERE Live_Mode is active, THE Agent_Inspector SHALL display a "Seed a rumor" input field that accepts up to 140 characters of free text.
2. WHEN the visitor submits a Rumor_Seed, THE Event_Player SHALL send a POST request to the Simulation_Engine's `/rumor` endpoint with the target agent id and rumor text.
3. THE Simulation_Engine SHALL append the Rumor_Seed as a Memory_Stream observation entry of `type: "injected"` with the current simulation timestamp for the target agent.
4. THE Simulation_Engine SHALL include the injected entry in the context for the target agent's next LLM call, ensuring the rumor influences subsequent behavior.
5. WHERE Live_Mode is inactive, THE "Seed a rumor" control SHALL not be rendered.

---

### Requirement 14: LLM Integration (Gemini)

**User Story:** As the Simulation_Engine, I want all LLM calls to go through the Gemini API using the project's existing API key, so that the feature uses a single, cost-predictable provider.

#### Acceptance Criteria

1. THE Simulation_Engine SHALL read the Gemini API key exclusively from the `GEMINI_API_KEY` environment variable loaded from the root `.env` file.
2. THE Simulation_Engine SHALL use the Gemini API for all LLM calls: Daily_Plan generation, action decision, conversation generation, and Reflection passes.
3. THE Simulation_Engine SHALL use a cost-efficient Gemini model (e.g., `gemini-2.0-flash`) for all simulation calls by default; WHERE a larger model is configured via an environment variable, THE Simulation_Engine SHALL use that model without enforcing additional cost limits beyond the Token_Budget defined in Requirement 9.
4. WHEN a Gemini API call returns any error status (including authentication failures), THE Simulation_Engine SHALL retry the call once after a 2-second delay; IF the retry also fails, THE Simulation_Engine SHALL use the defined fallback behavior for that call type (see Requirements 3–6) and log the failure.
5. THE Simulation_Engine SHALL never expose the GEMINI_API_KEY to the frontend; all Gemini calls SHALL originate server-side.

---

### Requirement 15: Graceful Degradation and Portfolio Preservation

**User Story:** As a portfolio visitor, I want the site to work perfectly whether the backend is offline, the API key is missing, or Live_Mode fails, so that the portfolio never presents a broken experience.

#### Acceptance Criteria

1. WHEN the Simulation_Engine is offline or unreachable, THE Event_Player SHALL automatically operate in Replay_Mode using the Baked_Log with no error visible to the visitor.
2. THE six existing portfolio relics, the Recruiter Mode, all existing NPC dialog, and all existing game systems SHALL remain fully functional regardless of whether the agent simulation is running.
3. THE Recruiter Mode SHALL not load or reference the Simulation_Engine or any agent-simulation assets; it SHALL remain a no-WebGL, no-backend instant-load experience.
4. WHEN Live_Mode transitions to Fallback, THE Event_Player SHALL resume Replay_Mode from the last replayed timestamp without a visible interruption.
5. THE Simulation_Engine code SHALL reside entirely in `apps/server/` and SHALL NOT be imported by or bundled into the frontend Vite build.
6. THE frontend SHALL add no new mandatory runtime dependencies on any backend service; all new npm packages introduced for the agent feature SHALL be optional and tree-shaken from the Recruiter Mode bundle.

---

### Requirement 16: Bake CLI

**User Story:** As the developer deploying the portfolio, I want a single CLI command that runs the simulation and writes the Baked_Log, so that updating the shipped log is a one-step process before each deploy.

#### Acceptance Criteria

1. THE Simulation_Engine SHALL expose a `bake` CLI command (e.g., `python -m server bake`) that requires `GEMINI_API_KEY` to be set in the environment as a precondition; WHEN `GEMINI_API_KEY` is absent, THE Simulation_Engine SHALL exit with a non-zero status and print a descriptive error before running any simulation. THE command SHALL run the full simulation for one simulated day (24 simulated hours) and write the resulting Event_Log to `public/sim-logs/default.json`.
2. WHEN the `bake` command completes successfully, THE Simulation_Engine SHALL print a summary to stdout including: total events written, total LLM tokens consumed, and wall-clock duration.
3. THE `bake` command SHALL be runnable with only `GEMINI_API_KEY` set in the environment; no other service or database SHALL be required.
4. THE `bake` command SHALL write a temporary `.lock` file during execution to prevent concurrent bake runs from producing a corrupt log.
5. IF the `bake` command is interrupted, THE Simulation_Engine SHALL write whatever events were produced up to the point of interruption to a `.partial` file rather than overwriting `default.json`.

---

### Requirement 17: Event Log Format — Round-Trip Integrity

**User Story:** As the Event_Player, I want the event log format to parse losslessly and serialize back to an equivalent form, so that log inspection, editing, and re-baking do not introduce silent data corruption.

#### Acceptance Criteria

1. THE Simulation_Engine SHALL write each World_Event line as valid JSON parseable by `JSON.parse` without loss of numeric precision for position coordinates.
2. THE Event_Player SHALL parse the Baked_Log using `JSON.parse` and expose the events as a typed array; no custom parser is required.
3. FOR ALL valid Event_Log files, serialising the parsed event array back to newline-delimited JSON and re-parsing the result SHALL produce an event array identical to the original (round-trip property).
4. THE Simulation_Engine SHALL validate each World_Event against its type-specific required fields before writing it; WHEN validation fails, THE Simulation_Engine SHALL log the malformed event and skip it rather than writing a corrupt entry.

---

### Requirement 18: Feature Flag Integration

**User Story:** As the developer, I want the agent simulation to be controllable via the existing FEATURES flag system, so that it can be disabled without touching any game engine code.

#### Acceptance Criteria

1. THE frontend SHALL gate all agent-simulation rendering (Speech_Bubbles, Agent_Inspector, "Run live tick" control) behind a new `agentTown: boolean` flag in `src/data/config.ts` FEATURES.
2. WHEN `FEATURES.agentTown` is `false`, THE Event_Player SHALL not initialise, no Baked_Log fetch SHALL be issued, and THE Npcs component SHALL render NPCs in their static positions defined in `src/data/npcs.ts` using the existing Npcs.tsx behavior unchanged.
3. WHEN `FEATURES.liveAgentWs` is `false`, THE "Run live tick" control SHALL not be rendered even if `FEATURES.agentTown` is `true`.
4. THE existing `FEATURES.npcs` flag SHALL continue to gate the rendering of NPC meshes; IF `FEATURES.npcs` is `false`, the agent simulation SHALL not attempt to drive any NPC rig.
