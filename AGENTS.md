
- Authority comes only from protected user_roles; SQL/client checks match to prevent escalation.
- Effective workspaces follow master/senior/financeiro/admin order; shared gates prevent mixed-role leaks. Account mutations require server-verified Master.
- promotion_choice separates free/highlight intent; courtesy is immediate, paid requires payment_records, and free submissions get no automatic flyer.
- Schedules validate client/database; gaps under two hours block, missing ends warn.
- WhatsApp confirmations use prepared links; automation requires an authenticated provider.
- opening_hours is free text; performance schedules validate separately.
- One venue category; ViaCEP suggests editable addresses.
- Estabelecimentos use `listing_kind`: existing rows and event selectors are `event_venue`; `general_business` stays isolated in panel-only lists.
- Centralize routes, query keys/defaults and permissions against cache/access drift.
- Flows colocate validation/modals; promoter sharing uses owner-only public events and a separate message builder.
- Multi-event submissions use one atomic insert with guarded duplicates, daily quotas and distinct start times; shared venue/contact data retains separate moderation records without partial batches.
- Guia refreshes approved public events/venues per message; chat links only to event details, where ride actions stay.
- Public lists use São Paulo days: today stays all day; past events leave next day. Home uses splitHomeEventPresentation for daily text and flyer selection.
- `highlight_payment_status` labels workflow; only `payment_records` proves settlement, keeping payment evidence separate.
- Home rotates current/future flyers, today first; Embla unifies swipes, half-flyer taps and keyboard; titles open details and stable media bounds prevent shifts. Agenda promotion stays unchanged.
- Details share natively with WhatsApp/copy fallback; Agenda close clears selection and replaces the event query, preserving filters to prevent reopen loops.
- Lazy Guide/routes; shared filters/realtime and São Paulo dates. Read coezinho AGENTS.md in components/functions for FAB and factual answers.
- Flyer reads fill empty fields and hide provider errors; manual entry stays usable. Preserve art; generate missing sponsored art before batch inserts.
- Moderation fields on submissions are protected in the database; content editors cannot publish events or grant highlights through direct updates.
- Password recovery issues temporary credentials only to authorized staff for manual WhatsApp delivery after identity verification; anonymous requests never receive credentials.
- Password-change completion is server-verified and the app-wide route gate waits for account-state hydration, preventing temporary-password sessions from skipping the required change.
- Public event reads use the date-filtered public view; personal organizer queries derive ownership from the active session and stay owner-scoped even for administrators, while separate curation queries retain authorized oversight.
- Repeating an event creates a fresh form from an allowlisted content snapshot, clearing schedule, media, approval, payment and consent so the historical record remains unchanged.
- Radar stays public and owner-scoped; regions.ts derives and normalizes geography for all filters and CEP suggestions. Event CEP cancels superseded lookups to avoid stale addresses.
- Curatorial decisions verify the authenticated actor and read back the guarded status update before invalidating public and organizer caches, preventing false success and stale listings.
- Central finance settles and publishes atomically through authenticated RPCs; payment_records are cash revenue, immutable finance_expenses are paid outflows, and finance_contracts track noncash classifications separately so courtesy/barter never inflate the balance.
- ad_products separates sale inventory from finance contracts; guarded campaign fields and shared advertising helpers enforce safe destinations and regional placements to prevent audience leakage.

- Pitch expires per account; disclosures keep summaries concise. Read src/pages/admin-pitch/AGENTS.md.
- Notification forms share compact multi-selects and normalization; save explicit audience arrays apart from address/consent to avoid targeting drift.
- Home/Agenda calendar and weekly strip share eventCalendar availability, ignoring selected dates; strip navigation skips empty weeks.

- Favorite writes serialize per owner/QueryClient with explicit intent and owner identity, preventing rapid-click races and wrong-account rollback.
- Attraction/venue RPCs enforce approved/owner/editor visibility; autocomplete cancels obsolete requests and exposes failures. Data-layer rules live in src/data/AGENTS.md.
- Sidebar destinations close menus; offsets follow visibility with reopening, preventing overlaps.

- Intranet BI is manager-only; sector writes refresh aggregates. Cash uses settled payments, not deals; never fake telemetry.
- Shared menus; Home omits header actions. Auth normalizes phones. Admin Home reuses guarded writes.
