/**
 * Bootstraps a staff account from the command line, e.g. the first admin:
 *   pnpm --filter @fm/api staff:add +971501234567 "Sreenath" ADMIN
 * Everyone after that can be added from the admin portal.
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { addStaffSchema } from '@fm/shared';
import { auditLog, users } from '../db/schema';

async function main() {
  const [phone, name, role = 'ADMIN'] = process.argv.slice(2);
  const input = addStaffSchema.parse({ phone, name, role });
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  const [user] = await db
    .insert(users)
    .values({ phone: input.phone, name: input.name, staffRole: input.role })
    .onConflictDoUpdate({ target: users.phone, set: { staffRole: input.role } })
    .returning();
  await db.insert(auditLog).values({ action: 'staff.role_granted', metadata: { userId: user.id, role: input.role, via: 'cli' } });
  console.log(`${input.name} (${input.phone}) is now ${input.role}`);
  await pool.end();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
