# EduIntel Consultancy Platform — MVP v1

The uploaded spec is large (1755 lines, 13 Superadmin modules + 10 Counselor modules, with multi-step forms containing 40+ fields each). Building all of it in one pass would produce shallow, broken screens. I'll ship a **solid v1 foundation** and we'll iterate module-by-module.

## v1 Scope (this build)

**Foundation**
- Clean SaaS design system: light bg, teal/blue accents, rounded cards, shadcn components
- Mock auth via localStorage role selection (Superadmin / Counselor)
- Role-based sidebar layouts + protected routes
- Mock data store (localStorage-backed) for countries / universities / programs / students — structured so a real API/Cloud backend slots in later

**Screens shipped in v1**
1. Login / role selection
2. Superadmin dashboard (overview cards, quick actions, recently updated, data health)
3. Superadmin → Countries: list with filters + add/edit (6-step form, all fields from spec)
4. Superadmin → Universities: list with filters + add/edit (6-step form, all fields)
5. Superadmin → Programs: list with filters + add/edit (with auto-calc final fee)
6. Counselor dashboard
7. Counselor → Knowledge Base browse (countries / universities / programs, read-only)
8. Counselor → Student Matcher: optional-fields form + recommendation results
9. Counselor → Saved Students list
10. Sidebar stubs for remaining modules (Media Library, Excel Upload, Process Maps, Notes, Audit Log, Counselors, Settings) with friendly "coming next" empty states so navigation feels complete

**Seed data**: 4–5 countries (UK, Australia, Canada, USA, Germany), ~8 universities, ~15 programs — so the recommender produces meaningful results immediately.

## Deferred to later iterations (per spec — explicitly out of v1)

- Public student portal
- Real backend / auth (structure ready for Lovable Cloud)
- Excel/CSV bulk upload, AI OCR
- Media Library full UX (lightbox, PDF preview)
- Process Maps visual builder
- Audit Log, Knowledge Notes, Counselor management screens
- WhatsApp, payments, mobile app

These will appear as sidebar items with empty-state placeholders so the IA is complete.

## Technical notes

- TanStack Start file-based routing: `src/routes/login.tsx`, `src/routes/admin/*.tsx`, `src/routes/counselor/*.tsx`
- Layout routes for sidebars: `src/routes/admin.tsx` + `src/routes/counselor.tsx` with `<Outlet />`
- Data layer in `src/lib/store.ts` — typed entities, localStorage persistence, easy to swap to Cloud later
- Recommendation logic in `src/lib/recommender.ts` — scores programs against partial student profile (country pref, level, budget, IELTS/MOI, GPA, intake), tolerates missing fields
- Design tokens in `src/styles.css` only — teal/blue oklch palette, gradient + shadow tokens

## After v1

You'll have a working, navigable app. Then we iterate: pick a module (e.g. Media Library or Excel Upload) and build it deeply. This avoids shipping 23 half-broken screens.

Approve to start building, or tell me to drop/swap any module.