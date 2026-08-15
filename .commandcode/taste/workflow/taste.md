# workflow
- Run typecheck, lint, and build locally and verify they all pass before pushing commits. Confidence: 0.70
- Reports frontend bugs by pasting the full structured error report (Error Type, Error Message with stack trace, Code Frame, Next.js version) and expects a direct root-cause diagnosis and fix without further clarification — seen again with a runtime TypeError paste. Confidence: 0.75
- Communicates tersely (e.g., "cont", "before that we should update the organizer form", "go" approving a staged plan, "go back to the backend and what else can we integrate") to proceed and delegates detailed decisions to the assistant's recommended defaults rather than answering multi-part questions. Confidence: 0.85
- When offered a prioritized list of integration options, approves exactly one item and expects delivery scoped strictly to it (e.g., "go for 1 only" after a ranked proposal) rather than bundling several at once. Confidence: 0.7
- Impatient with long-running background agents; when work drags on (e.g., "this is taking too long please check"), expects the assistant to immediately check status, verify actual progress on disk (git status/grep) rather than trusting agent reports, and kill agents whose work is confirmed done instead of waiting for them to report. Confidence: 0.7
- Treat the Postman API collection file as the canonical API contract for syncing store endpoints and payloads; user explicitly asks for decisions to be grounded in "the docs" before acting. Confidence: 0.8
- Wants analysis/verification against the docs before any implementation — e.g., "don't implement but based on the docs..." requests research-first answers, gating code changes until the plan is confirmed. Confidence: 0.8
- When planning what else to integrate, prefers surveying the sibling backend repo (e.g., ../digis_backend) directly — routes, controllers, models, serializers, and its Postman collection — to discover available API surface and confirm exact request/response contracts before building, rather than deciding from the frontend side. Confidence: 0.75
- Scope integration/API updates to what already exists — no new pages, no new integrations, just sync existing code to the new contract. Confidence: 0.8
- Scopes work to the admin app only; the organizer app is not to be touched — reiterated when approving implementation ("okay now implement but only for the admin app"). Confidence: 0.95
- Prefers updating/repairing existing incomplete UI before moving on to new features. Confidence: 0.6
- Rejects adding UI scope beyond what was explicitly asked — e.g., an owner picker added to the org create form was reverted ("no revert it"), keeping the form minimal (name + description with the existing `owner_id: ""` placeholder). Confidence: 0.8
- Prefers minimal frontend-only changes: when the backend API doesn't expose the data needed for a requested UI behavior, declines expanding the backend/API contract and prefers leaving the behavior as-is rather than adding scope. Confidence: 0.6
- When asked to commit, wants the entire working tree committed (`git add -A`), including unrelated pre-existing modified files — no selective staging or asking about out-of-scope changes ("okay commit everything that is on the working tree"; a bare "commit" means stage all and commit without further questions). Confidence: 0.8
r). Confidence: 0.8
he form minimal (name + description with the existing `owner_id: ""` placeholder). Confidence: 0.8
.7
r). Confidence: 0.8
he form minimal (name + description with the existing `owner_id: ""` placeholder). Confidence: 0.8
