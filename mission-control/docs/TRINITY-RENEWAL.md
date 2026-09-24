# Trinity workspace renewal · 24 September 2026

This branch rebuilds the everyday workspace on top of the existing Next.js app. It is a tested UI and workflow release, not a completed multi-tenant SaaS rollout.

## Working changes

- Responsive sidebar, day cockpit, searchable navigation, and a directory retaining access to the existing modules.
- Dark, light, and system appearance modes. A separate 45–100% brightness slider dims the entire UI, including modal dialogs. Preferences are applied before page paint and persist locally. Core Tailwind colors now use theme tokens, including existing board/notebook screens; the Eden surfaces and floating AI widget also follow the theme.
- The cockpit and Kanban use the same `trinity-kanban-v2` document. Adding/completing/reopening tasks preserves project columns, attachments, connections and groups. Malformed documents and quota failures are surfaced instead of silently overwritten. Same-origin tabs refresh board changes.
- Daily/weekly calendar with create/edit/delete, date and time validation, overlapping-event indicators, calendar visibility controls, and a live view of current/next events. Focus blocks can be scheduled. New installs do not receive invented calendar events or sample goals.
- App links can be added, edited, searched, removed and opened. Only HTTP(S) URLs without embedded credentials are accepted. Links are explicitly distinguished from data integrations.
- One focus timer across routes and the sanctuary dialog. It uses an absolute deadline, catches up after background throttling, pauses/resumes, and cycles focus → short break → focus → deep recovery. Reload preserves the remaining time but intentionally pauses. Uploaded work/break music and configured audio URLs use a persistent player. Visual Room can be toggled as an iframe without changing the Trinity timer; external apps' independent timers are not controlled.
- AI SSE decoding retains partial frames and multi-byte characters, propagates provider errors, and detects interrupted streams.
- Docker builds now use the lockfile and exclude local credentials, MCP configuration, runtime data and unrelated app archives from the image context.
- Native dialogs provide keyboard focus containment, Escape dismissal and focus restoration. Reduced-motion preferences are respected.

## Boundaries with Grok

Read-only observation of the running Grok Bot "Coding Desk" showed Supabase removal, FuseBase account work and DNS/certificate work. Main at start and latest check: `4aa7104` (merged removal branch). No Grok chat messages were sent, and no existing checkout, FuseBase organization, DNS record or live server was modified.

The later observation showed Railway redeployed at `4aa7104`, waiting for a Railway login to obtain the domain ownership TXT record. The user's requested final host is Hostinger VPS. These are different deployment targets; this branch does not silently redirect or replace either.

## Storage and release limits found in the existing app

- `lib/storage.ts` still returns `null` for uploads. Existing upload views fall back to local data URLs/IndexedDB. No verified FuseBase object storage contract was available in this repository.
- Calendar, apps, team profiles, notes and much of the workspace still persist in browser storage. Browser-local visibility rules are not server-side tenant authorization. The same browser profile is not a secure multi-account boundary.
- Server data in `lib/db.ts` uses a shared JSON directory. Several data, proxy, settings and agent endpoints lack per-user authorization; the dashboard's client-side session redirect does not secure these APIs. Existing arbitrary-URL proxy/ical and local launch endpoints require a separate server security pass before any public commercial deployment.
- `public/sw.js` currently caches proxy GET responses without account scoping. Do not treat it as safe private-data offline synchronization; remove authenticated-response caching or implement per-account cache lifecycle before release.
- No native authenticated team-chat backend, invitations/roles policy, conflict resolution, database backup/restore or tenant-isolation tests have been completed here. The team communication link retains the existing KChat integration screen.
- Real AI responses require configured agents/providers; local preview uses no live service credentials.
- Visual Room answered HTTPS 200. Iframe presence and timer retention were tested. This does not verify cross-app SSO, storage synchronization, autoplay on every browser, or an external player-control protocol.

## Hostinger / FuseBase responsibilities

Recommended boundary for the next integration pass:

| Component | Location and requirement |
| --- | --- |
| Next.js UI and server-side API adapters | Hostinger VPS, Node 22+, reverse proxy with TLS; never expose arbitrary unauthenticated administrative endpoints |
| Identity | Existing FuseBase Gate flow; verify app/portal membership server-side, not only a valid email |
| Workspace/profile data | FuseBase if its authenticated, tenant-scoped read/write API supports the needed operations; confirm the actual SDK contract before implementing |
| Uploaded music/files | FuseBase object storage with owner/team authorization and bounded uploads; use scoped access URLs, not browser-local data URLs for team assets |
| Team collaboration | Server-authorized memberships, scoped writes, message pagination, revision checks and an explicit real-time/polling mechanism |
| Provider credentials | Server-side only; never client bundles, browser stores or public API responses |
| VPS disks | Runtime cache and explicitly scoped data volumes; backups and restore verification for anything authoritative |

`deploy/compose.hostinger.preview.yml` is a loopback-only deployment preparation. It does not configure DNS, TLS or public exposure. Production rollout remains gated on the actual storage/authorization implementation and the hosting handover.

## Validation

- `npm test`: nine focused tests for board document preservation, visibility, malformed data, deadline behavior, focus state transitions, local calendar dates/conflicts, safe URLs, fragmented UTF-8/SSE and upstream errors.
- `npm run typecheck`.
- `npm run build`: production compilation and static route generation. Existing Turbopack warning about the broad file trace through `lib/db.ts` remains; build output must not include private files at deployment.
- Browser: cockpit task → same Kanban card → completed cockpit state; edited event and time persistence after reload; invalid end-time rejection; app creation and cockpit shortcut; focus survives navigation; Visual Room toggle leaves timer state intact; dark/light rendering in cockpit and existing Kanban; dark mode plus 46% brightness survive reload; 390px mobile layout, navigation and absence of horizontal page overflow.
- Original local `/api/auth/me` returns 401 without a session. The separate loopback preview proxy uses a synthetic identity and blocks service APIs; it is not committed and never changes production authentication.

## Run locally

From `mission-control`:

```sh
npm ci --ignore-scripts
npm test
npm run typecheck
npm run build
npm run dev -- --hostname 127.0.0.1 --port 4173
```

Use real FuseBase test credentials only in an explicitly configured test environment. `NEXT_PUBLIC_VISUAL_ROOM_URL` can override the iframe destination at build time; default is `https://visual-room.youareneo.com`.

## Second iteration: identity, knowledge and agent access

The branch now includes birth profiles, a blue moon and configurable sky panel, team flow, goals, a searchable linked Second Brain with Markdown/ZIP export, personal sidebar bookmarks, editable area links, animated meditation scenes and two original synthesized audio loops. Yin/yang drops separate, a shiny golden third drop appears, then they dissolve into violet light and reform. All sidebar groups collapse; identity and bookmarks start closed. Reduced motion also disables the new animation.

Birth calculation uses `astronomy-engine` and `free-human-design`. The latter is externalized on the server so its optional native Swiss Ephemeris import does not break Next's bundle. Birth requests time out and always clear the pending state. The local city directory fills coordinates and IANA timezone; visible result buttons and Enter search support changing cities. It is not a complete worldwide village database. German aliases and accents are normalized. Old searches are aborted on edits. No external geocoder receives birth data.

Dreamspell and traditional Tzolk'in are separate choices. Reference tests cover Dreamspell 2024-09-22 Kin 77 and traditional 2012-12-21 4 Ajaw, plus leap-day handling. Vedic results use an approximate Lahiri ayanamsa; Celtic trees use a contemporary 13-tree calendar. Symbolic interpretation is clearly labelled. Human Design boundary cases still require comparison with a trusted reference chart.

### OAuth MCP

- Streamable HTTP endpoint `/mcp`; OAuth discovery, dynamic public-client registration, explicit browser consent, S256 PKCE, exact redirects and resource audience checks.
- User-bound opaque access tokens (30 minutes), rotating refresh tokens (30 days), replay revocation, hashed token/code storage, and user-visible connection revocation.
- `list_workspace` and `read_document` only see an explicitly selected server snapshot from Second Brain. No implicit sharing of local data. Publishing an empty selection removes the snapshot.
- Optional `trinity:draft` enables `propose_note` and `propose_task`. These produce drafts in Settings; the user chooses whether to import them. Agents cannot administer FuseBase accounts or run arbitrary commands.
- Enable only after configuring `TRINITY_MCP_ENABLED=true`, an HTTPS `TRINITY_PUBLIC_URL`, the existing strong `APP_SECRET`, and a persistent private `TRINITY_MCP_DB` volume. Node >=22.13 is required for `node:sqlite`. Single process; do not deploy ephemeral SQLite across replicas.
- Codex, Claude Code or Hermes must use an HTTP MCP client supporting OAuth discovery/PKCE and resource indicators. Enter `https://trinity.youareneo.com/mcp` after deployment. No real client connection or public-server activation has been verified in this iteration.
- Normal FuseBase login must yield a stable numeric user ID. Missing-ID sessions cannot authorize MCP. MCP does not fix the older app's shared browser storage or unauthenticated legacy APIs.
- Before public rollout: edge request/rate limits, persistent backups, expired-record cleanup and a full login/consent test against the real FuseBase tenant. Registration is capped, but this is not a comprehensive rate-limiting system.

Grok's main changes through `b9c0cf5` were merged without conflicts, including password reset, the Fördermitglied link and the membership revoke webhook. No DNS or existing live application was modified. The separately authorized FuseBase client invitation was completed: cianta178@gmail.com is a customer, and info@youareneo.com remains the existing owner. No shared password was written or changed.

Memberspot automation should invoke the existing server-side provisioning/revoke endpoints with their server secret after a verified membership change. MCP availability alone does not establish an always-running webhook. The concrete Memberspot workflow and storage integration remain unconfigured.

Validation now includes 18 passing tests: prior workspace cases plus city changes, calendar reference dates, birth validation, Markdown graph/export, URL parsing, OAuth PKCE/code reuse/audience/refresh replay, per-user MCP reads, draft permissions and revocation. TypeScript and production build are checked after merging main. Local preview remains loopback-only and does not grant real account access.
