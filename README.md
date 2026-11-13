# Free Matrimony

A modern, verified matrimony platform for Malayalis in Kerala and around the world, built for the
candidate *and* their family.

## What's in this repo

| Path | What it is | Stack |
| --- | --- | --- |
| `apps/api` | Backend API used by every app and portal | NestJS, PostgreSQL, Drizzle ORM |
| `apps/web` | Member website | Next.js, Tailwind CSS |
| `apps/mobile` | Member app for iOS and Android | Flutter |
| `apps/admin` | Admin portal | Next.js |
| `apps/support` | Customer service portal | Next.js |
| `apps/verification` | Verification team portal | Next.js |
| `packages/shared` | Shared types, validation and the family permission rules | TypeScript, Zod |
| `packages/ui` | Shared design tokens and components for the web apps | React, Tailwind CSS |

## Getting started

Requirements: Node 22, pnpm 10, Docker (for Postgres and Redis), and Flutter 3.x for the mobile app.

```bash
pnpm install
pnpm db:up                        # Postgres + Redis in Docker
cp apps/api/.env.example apps/api/.env
pnpm db:migrate
pnpm dev                          # API on :4000, web on :3000, admin :3001, support :3002, verification :3003
```

Mobile:

```bash
cd apps/mobile
flutter pub get
flutter run --dart-define=API_URL=http://localhost:4000/v1
```

In development, OTP codes are logged by the API and shown on the login screen, so no SMS provider is needed.

## Tests

```bash
pnpm test        # shared permission rules (Vitest) + API end-to-end tests against Postgres (Jest)
cd apps/mobile && flutter test
```

The API tests need a Postgres database; set `TEST_DATABASE_URL` or use the default
`postgres://fm:fm@localhost:5432/free_matrimony_test`. The tests reset that database.

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for the milestones from foundation to launch.

## Family accounts

Every candidate profile belongs to a family. The candidate, parents, siblings and other relatives each have
their own login and a role on the profile. Roles have default permissions, and the candidate can adjust any
relative's access. Some rules are fixed:

- A profile can't be submitted for verification until the candidate personally consents.
- Only the candidate controls privacy (hiding the profile) and other people's access.
- The candidate can't be removed from their own profile.
- Every sensitive action is written to an audit log.

The rules live in [`packages/shared/src/family.ts`](packages/shared/src/family.ts) and are enforced by the API in
[`apps/api/src/profiles/access.service.ts`](apps/api/src/profiles/access.service.ts).

## API (v1)

| Method | Path | Who |
| --- | --- | --- |
| POST | `/v1/auth/otp/request` | Anyone |
| POST | `/v1/auth/otp/verify` | Anyone; returns a JWT |
| POST | `/v1/profiles` | Logged in; creates a family and profile |
| GET | `/v1/profiles/mine` | Profiles you manage or are invited to, with your access |
| GET / PATCH | `/v1/profiles/:id` | Family members; editing needs `EDIT_PROFILE` |
| POST | `/v1/profiles/:id/consent` | Candidate only |
| POST | `/v1/profiles/:id/submit` | Needs `EDIT_PROFILE` and the candidate's consent |
| POST | `/v1/profiles/:id/visibility` | Candidate only |
| GET / POST | `/v1/profiles/:id/members` | List; invite (needs `MANAGE_FAMILY`) |
| POST | `/v1/profiles/:id/members/accept` | The invited person |
| PATCH | `/v1/profiles/:id/members/:memberId/permissions` | Candidate only |
| DELETE | `/v1/profiles/:id/members/:memberId` | Candidate or family admin |
