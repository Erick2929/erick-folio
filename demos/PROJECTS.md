# Erick Project Demos · inventory

Every project under `~/Documents/Proyectos` classified by how demoable it is for a
central "Erick Project Demos" hub. Sizes and stacks come from each repo's README,
package manifest and git remote on 2026-09-10.

Legend for **Hosting**: `static` = builds to plain files, runs with no backend ·
`backend` = needs its own API and database online · `desktop` = native app, demo
by video and download · `link` = already live somewhere, embed or link it.

## Tier 1 · headline demos (own work, complete, interactive)

| # | Project | What it is | Stack | Hosting | Folder / repo | Notes for the hub |
|---|---------|------------|-------|---------|---------------|-------------------|
| 1 | **TRO Supplier Portal** | Supplier and client compliance-file ("expediente") + invoice portal. Uploads, staff review, invoicing blocked until every document is approved. Three roles. | pnpm monorepo · React + TS web · Node API · Supabase (Postgres, Auth, Storage) · Mailpit locally | backend | `tro-supplier-portal` · Erick2929/tro-supplier-portal | Needs one hosted Supabase project seeded with demo companies and three demo logins (supplier, client, staff). Strongest B2B piece. |
| 2 | **MyTimeSplit** | A wallet for your time: log hours per category, daily and weekly goals, offline PWA. | React 19 · Vite · TanStack Router + Query · Tailwind v4 · vite-plugin-pwa · FastAPI backend (foundation only) | static | `my-time-split` · Erick2929/my-time-split | Runs 100% on-device without `VITE_API_URL`. Cheapest demo to host, installable on a phone. |
| 3 | **Chronos** | Routine runner PWA: define routines with timed steps, execute them with a guided countdown, record actual vs estimated. | FastAPI · SQLAlchemy async · Alembic · Postgres · Vite + React · Docker Compose | backend | `chronos` · Erick2929/chronos | Needs API + DB online (Railway or the homelab). Check which roadmap phase is actually done before promising features. |
| 4 | **TRO Workforce Manager** | Biometric attendance control for TRO. | FastAPI · SQLAlchemy async · Postgres · Vite + React + TS · Clerk auth · Supabase Storage · Railway + Vercel | backend | `tro-workforce-manager` (`tro-1` is an older copy) · Erick2929/tro-workforce-manager | Needs Clerk demo tenant + seeded employees. Biometric capture may need a mock for a browser demo. |
| 5 | **DevBoard** | Kanban board with drag and drop, boards, columns, cards; Playwright e2e suite. Also the testbed for Claude Code hooks and skills. | React + TS · Vite · dnd-kit · shadcn + Tailwind · Supabase · Playwright | backend (Supabase only) | `devboard` (`-figma`, `-hook-demo`, `-skill-demo` are variants) · Erick2929/devboard-kanban | Needs a hosted Supabase with a public demo board, or swap the data hook for localStorage to make it static. |
| 6 | **Focus Timer** | Minimal focus timer: one main goal, sub-goals, circular countdown, sound alerts, localStorage. | React 18 · TS · Vite · Tailwind · Web Audio | static | `focus-mode-target` · Erick2929/focus-mode-target | Zero backend. Good small filler demo. |
| 7 | **Event Horizon** | This playable three.js portfolio. | Vite · three.js · custom shaders | static | `erick-folio` · Erick2929/erick-folio | Already the portfolio; the hub links back to it rather than embedding it. |

## Tier 2 · desktop and native (demo with video, GIF and a download)

| # | Project | What it is | Stack | Folder / repo | Notes |
|---|---------|------------|-------|---------------|-------|
| 8 | **Ton618** | Pixel-art astronaut with a black-hole head that floats over the desktop and tracks Claude desktop-app conversations (macOS 26 glass pills, notifications, deep links). | Tauri · TS · Swift/AppKit glass views | `ton618` · Erick2929/ton618 | Not web-runnable. Record a 20 s screen capture and link the release `.dmg`. |
| 9 | **Kurama** | Nine-tailed fox desktop companion mirroring every Claude Code session state; sibling of Ton618. | Tauri · TS · Swift/AppKit | `kurama-pet` (no remote yet) | Same treatment as Ton618. Push it to GitHub first. |

## Tier 3 · shipped client and product work (link to live site or show with screenshots)

| # | Project | What it is | Stack | Folder / repo | Notes |
|---|---------|------------|-------|---------------|-------|
| 10 | **MatchpointMX** (club + player apps) | Paddle tennis tournament platform, 200+ active users. Already a satellite in Event Horizon. | Next.js · Mantine · Firebase | `Matchpoint/*` · Erick2929/MatchpointMX-Club, MatchpointMX-Player | Production product with real users. Link the live site and screenshots; a sandbox tenant would need Firebase work. |
| 11 | **TRO landing page** | Marketing site for TRO Servicios. | Next.js · Mantine · Firebase | `tro-landing-page` · Erick2929/tro-landing-page | Link if still live; otherwise static build. |
| 12 | **TRO-Software** (2024) | Earlier TRO admin/operator app (Admin, Operator and Authentication views, scammers list). | React · MUI · DataGrid · Firebase · Vite | `TRO-Software` · Erick2929/TRO-Software | Superseded by the portal and workforce manager. Optional "v1" mention only. |
| 13 | **Kade** (landing, Next version, admin) | Home-services startup: landing page and admin panel. | React/Vite and Next.js · MUI · Firebase | `kade-landing`, `kade-next`, `kade-admin` (admin remote is KevinDuenas/kade-admin) | Landing is static and demoable. Admin is co-owned; ask before showing. |
| 14 | **Quetarojas** | Portfolio site (about, photo gallery, special projects, YouTube embeds). | React · Vite · react-router · react-youtube | `quetarojas` · Erick2929/quetarojas | Static. Client site, confirm it can be shown. |
| 15 | **Orc · Doctor Tooth** | Business operating system for dental clinics, functional demo with seeded roles (admin + three doctors). | Next.js · Neon Postgres · RLS · Anthropic API | `orc-doctor-tooth` · fernandojgarciagzz/orc-doctor-tooth | Co-owned with Fernando and needs Neon + Anthropic keys. Get his OK, then it is one of the best AI demos you have. |

## Tier 4 · needs permission or infrastructure you do not control

| # | Project | What it is | Why it is here |
|---|---------|------------|----------------|
| 16 | **VoiceDoc** (frontend + backend) | Recording and processing doctor-patient sessions. React front; Express + Prisma + Cognito + S3 + OpenAI + Stripe API. | Repos live under the VoiceDoc org and depend on AWS + Stripe. Show as a case study unless the org agrees to a demo tenant. |
| 17 | **Sanus AI / A.N.A.** (`docnotes/sanus-ai`) | Medical notes with live transcription (Deepgram) and SOAP notes. | Health data plus paid transcription. Case study or a scripted demo with fake audio. |
| 18 | **Softtek repos** (IFT chatbot, IMSS virtual assistant, KnowledgeBases / Frida GPTSite, CVM Web, LLMOps) | RAG chatbots and LLMOps work for Softtek clients. | Employer and client IP under the Fridaplatform org. Do not host; describe in the CV only. |
| 19 | **La historia de Karen y Erick** | Private couple site: travel map, timeline, photos. Vite + React, Hono on Vercel Functions, Vercel Blob. | Personal and passphrase-protected. Worth a technical write-up (single-JSON store with lock blob, scrypt session, strict CSP) but not a public demo. |

## Planned · not built yet

| Project | Status | Notes |
|---------|--------|-------|
| **Centavo** (the wallet app) | Design document v1.1 dated 2026-09-10 in `centavo/docs`. No code. | Personal ledger with Needs / Wants / Savings groups, bulk entry on desktop, migration of 2,374 Wallet records. Reserve a slot in the hub now; it will become a Tier 1 demo. |

## Excluded

- **erick-siller-website**, **erick-siller-landing-page**, **erick-blog**: earlier personal sites and the Astro blog. Meta content; link the blog from the hub if it is live.
- **erick-homelab**: Docker Compose stack for the AI server. Infrastructure, no UI. Write-up material only.
- **folio-2025**: Bruno Simon's repo, not yours.
- **ramp-fe-challenge**, **regrello/my-regrello-interview**: interview exercises.
- **ETC/** (datosdeviaje Admin, BackEnd, FrontEndWeb, SIN-TESIS), **empro**, **monro/Monro-MUI**: old school and side jobs with template READMEs and no clear product.
- **prueba-mapas**, **next-test**, **aws-test**, **api-rest-node**, **password-generator**, **charlie**, **Xcode/**, **tec/**: scratch and coursework.
- `chronos-checkout-*`, `tro-supplier-portal-worktrees/*`, `devboard-*`, `tro-1`, `docnotes/sanus-ai-hotfix-soap`: worktrees and copies of projects already listed.

## Suggested first cut for the hub

Ship these six first, in this order, because they are yours, finished and cheap to keep online:

1. MyTimeSplit (static)
2. Focus Timer (static)
3. TRO Supplier Portal (one Supabase project, seeded)
4. DevBoard (same Supabase project or localStorage fork)
5. Chronos (API on Railway or the homelab)
6. Ton618 + Kurama (video and download)

Then add TRO Workforce Manager and Orc once their auth and keys are sorted, and Centavo when it exists.
