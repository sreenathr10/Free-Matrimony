# Free Matrimony

pnpm + Turborepo monorepo. See README.md for the layout and commands.

- Product plan: positioning, features, roadmap live in the project's plan doc; the MVP scope there is the source of truth.
- Family permission rules are defined once in `packages/shared/src/family.ts`. Never duplicate them in an app; import from `@fm/shared`.
- Validation schemas live in `packages/shared` (Zod) and are used by both the API (`ZodPipe`) and the web apps.
- API: NestJS + Drizzle. After changing `apps/api/src/db/schema.ts`, run `pnpm --filter @fm/api db:generate --name <change>` and commit the migration.
- Every sensitive action in the API must call `AuditService.record`.
- Return 404 (not 403) when a user has no membership on a profile, so profile ids can't be probed.
- UI: use tokens from `packages/ui/src/theme.css` and components from `@fm/ui`; English only.
- Tests: `pnpm test` (needs Postgres). Add an e2e test in `apps/api/test` for every new endpoint.
