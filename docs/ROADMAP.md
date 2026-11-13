# Development roadmap

The build plan, milestone by milestone. Each milestone ships as one or more pull requests and is done when every
box is ticked and its tests pass in CI. The product plan (positioning, pricing, launch strategy) lives in the
project's plan doc; this file is the engineering view of it.

The target is a public MVP launch at the end of **M8**, with every surface live: member app (iOS, Android, web),
admin, customer service and verification portals. Estimates assume a small team plus Claude; they are rough.

| # | Milestone | Outcome | Estimate | Status |
| --- | --- | --- | --- | --- |
| M1 | Foundation | Monorepo, API core, family accounts and access, app shells | 1 week | Done (PR #1) |
| M2 | Profiles | Families can create a full profile with photos and preferences | 2 weeks | Done (PR #2) |
| M3 | Verification | Every profile is ID- and liveness-checked before going live | 3 weeks | In review (PR #4) |
| M4 | Discovery | Search, daily AI picks, shortlist, privacy rules | 3 weeks | Not started |
| M5 | Connections | Interests with family approvals, chat, safety, notifications | 3 weeks | Not started |
| M6 | Payments | Plans, Razorpay, Stripe, store billing, per-country pricing | 2 weeks | Not started |
| M7 | Support and admin | Tickets, reports, moderation, dashboards, staff management | 3 weeks | Not started |
| M8 | Launch readiness | Security, compliance, performance, store release, closed beta | 3 weeks | Not started |
| M9 | Phase 2 | Calls, porutham, video intros, campaigns, live support chat | 6 to 8 weeks | Later |
| M10 | Phase 3 | Relationship managers, video dates, expansion to the West | Ongoing | Later |

---

## M1 Foundation (done)

- [x] pnpm + Turborepo monorepo, shared packages, Docker Compose, CI for Node and Flutter
- [x] Phone OTP login with JWT, rate and attempt limits
- [x] Families, candidate profiles with Kerala fields, 18+ check
- [x] Family roles and permissions; candidate overrides; consent before verification; audit log
- [x] Member website, admin/support/verification portal shells, Flutter app shell

## M2 Profiles

- [x] Partner preferences: age, height, religion, community, star, marital status, countries, education
- [x] Edit suggestions: relatives with *suggest* access propose changes; candidate or parent approves
- [x] Photo upload to object storage with presigned URLs; up to 8 photos, one primary
- [x] Blurred copy of every photo, shown until an interest is accepted
- [x] Profile completeness score with next-step hints
- [x] Religion, caste or denomination, and sub-caste picked from a shared list (about 140 communities, Kerala first), with "Other" and caste no bar
- [x] Web: profile creation wizard, profile editor, family members and access screen
- [x] Mobile: profile creation wizard and profile view with photo upload
- [x] OpenAPI docs at `/docs` for every endpoint, so every app builds against the same API

## M3 Verification

- [x] Staff accounts with roles (admin, support agent, verifier) and portal login; admins manage staff
- [x] KYC provider adapter with a development mock (`KYC_PROVIDER=mock`)
- [ ] Real vendors: HyperVerge or IDfy for India, Onfido or Veriff abroad
- [x] Selfie and ID capture on web and mobile (Aadhaar, passport, Emirates ID, driving licence, national ID); EXIF stripped, files private
- [ ] Selfie liveness and face match by a real vendor (mock returns placeholder results)
- [x] Duplicate account check: same files or same name, birth date and gender
- [ ] AI pre-screen for AI-generated and stock photos (needs a vendor)
- [x] Verification portal: queue, flagged, completed, review screen, approve or reject with reasons, audit trail
- [x] Verified badge; profile goes LIVE on approval; rejection reason shown to the family
- [ ] Member notified by push, email or WhatsApp (moved to M5 notifications)

## M4 Discovery

- [ ] Search with saved filters (community, star, native district, current country, age, height, education)
- [ ] Match scoring with embeddings (pgvector) and a "why you match" explanation
- [ ] Daily picks, refreshed every 24 hours
- [ ] Shortlist (shared with the family, with notes and votes) and "who viewed me"
- [ ] Privacy: photo blur until accepted, hide from relatives, incognito, hide inactive (60 days)

## M5 Connections

- [ ] Interests: send, accept, decline, with family approval flows from the permission rules
- [ ] Chat over WebSockets once both accept; photos and voice notes; "sent by Mother" labels
- [ ] Masked contact details revealed only to accepted matches with the right plan
- [ ] Scam-pattern nudges in chat; block and report
- [ ] Notifications: push (FCM), email, WhatsApp Business

## M6 Payments

- [ ] Plans and entitlements (Free, Gold, Platinum), boosts
- [ ] Razorpay (India, UPI), Stripe (international), App Store and Play billing
- [ ] Prices in local currency per country; coupons
- [ ] Admin: plan and pricing management, refunds

## M7 Support and admin

- [ ] Support portal: tickets, member 360 view, report and dispute handling, saved replies
- [ ] Admin portal: dashboards (sign-ups, verification, conversion, revenue), moderation, staff and roles
- [ ] Campaigns: push, email, WhatsApp

## M8 Launch readiness

- [ ] Security review, rate limits everywhere, secrets management, pen test
- [ ] DPDP and GDPR: consent records, data export, account deletion, grievance officer flow
- [ ] Observability: Sentry, PostHog, uptime checks; load test
- [ ] AWS infrastructure in Terraform (Mumbai primary), staging and production
- [ ] App Store and Play Store submissions
- [ ] Closed beta with 500 verified members in Kerala and the UAE; launch gate: no critical bugs

## M9 Phase 2 (after launch)

In-app voice and video calls (LiveKit or Agora), porutham matching, video and voice intros, education and job
verification, campaigns and coupons, live support chat.

## M10 Phase 3

Relationship manager service, video dates across time zones, family group chat, success stories, A/B testing,
expansion to the wider Gulf, UK, US and Canada.
