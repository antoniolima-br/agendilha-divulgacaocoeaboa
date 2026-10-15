
- Authority comes only from protected user_roles; SQL/client checks match to prevent escalation.
- Effective workspaces follow master/senior/financeiro/admin order; shared gates prevent mixed-role leaks. Account mutations require server-verified Master.
- promotion_choice separates free/highlight intent; courtesy is immediate, paid requires payment_records, and free submissions get no automatic flyer.
- Schedules validate client/database; gaps <2h block, missing ends warn.
- WhatsApp uses prepared links; automation needs an authenticated provider.
- opening_hours is free text; validate performances separately.
- One venue category; editable CEP.
- Estabelecimentos use `listing_kind`: existing rows and event selectors are `event_venue`; `general_business` stays isolated in panel-only lists.
- Centralize routes, permissions, formatting and data; shared UI owns sizing, collision-aware menus and touch scrolling.
- Meus eventos centralizes creation/sharing; owner-only public events use a shared message builder.
- Multi-event submissions use one atomic insert with guarded duplicates, daily quotas and distinct start times; public endpoints also use server-side quotas with hashed request fingerprints.
- Guia refreshes approved public events/venues per message; chat links only to event details, where ride actions stay.
- Public lists use São Paulo days: today stays all day; past events leave next day. Home uses splitHomeEventPresentation for daily text and flyer selection.
- `highlight_payment_status` labels workflow; only `payment_records` proves settlement, keeping payment evidence separate.
- Home flyers follow São Paulo date/time; focus syncs dates. Embla rotates in 5s, pauses on interaction, and handles gestures/keys/details.
- Details share natively with WhatsApp/copy fallback; Agenda close clears selection and replaces the event query, preserving filters to prevent reopen loops.
- Lazy Guide/routes; intent prefetch is public-only. Shared realtime batches have a maximum wait to prevent starvation. Read coezinho AGENTS.md for FAB/facts.
- Flyer OCR: lazy browser Tesseract, safe parsing, abort cleanup; preserve edits, no draft gate. Preserve art; generate missing sponsored art first.
- Database guards protect moderation; personal edits use a shared status allowlist and permanent approval timestamps, preventing post-approval/suspension edits.
- Password recovery issues temporary credentials only after identity verification; anonymous requests never receive credentials.
- Server-verify password changes; auth hydration discards stale sessions, clears prior account state, and awaits the password gate.
- Public event reads use the date-filtered public view; personal organizer queries derive ownership from the active session and stay owner-scoped even for administrators, while separate curation queries retain authorized oversight.
- Repeating an event creates a fresh form from an allowlisted content snapshot, clearing schedule, media, approval, payment and consent so the historical record remains unchanged.
- Radar stays public and owner-scoped; regions.ts derives and normalizes geography for all filters and CEP suggestions. Event CEP cancels superseded lookups to avoid stale addresses.
- Curatorial editing uses protected RPCs, private artistic history, soft deletion and broad cache invalidation.
- Central finance settles and publishes atomically through authenticated RPCs; payment_records are cash revenue, immutable finance_expenses are paid outflows, and finance_contracts track noncash classifications separately so courtesy/barter never inflate the balance.
- ad_products separates sale inventory from finance contracts; guarded campaign fields and shared advertising helpers enforce safe destinations and regional placements to prevent audience leakage.

- Pitches are public and split by audience; disclosures stay concise. Read src/pages/admin-pitch/AGENTS.md.
- Notification forms share compact multi-selects and normalization; save explicit audience arrays apart from address/consent to avoid targeting drift.
- Home/Agenda calendar and weekly strip share eventCalendar availability, ignoring selected dates; strip navigation skips empty weeks.

- Favorite writes serialize per owner/QueryClient with explicit intent and owner identity, preventing rapid-click races and wrong-account rollback.
- Attraction/venue RPCs enforce approved/owner/editor visibility; autocomplete cancels obsolete requests and exposes failures. Data-layer rules live in src/data/AGENTS.md.
- Sidebar links close menus; offsets prevent overlaps; toggles reference submenu containers for accessibility.

- Intranet is Master-only client/server; read src/pages/intranet/AGENTS.md before edits.
- Read nested AGENTS.md.
- Role menus isolate staff; bottom Menu opens the sidebar. Public discovery stays open; personal data is session-scoped. Auth normalizes phones; promoter approval requires protected WhatsApp confirmation.
- Profile addresses stay isolated from public/promoter/artist flows.

- PWA guards registration and awaits control before reload; user confirms updates.
