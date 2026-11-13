import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  ACCESS_LEVELS,
  FAMILY_ROLES,
  GENDERS,
  KERALA_DISTRICTS,
  MARITAL_STATUSES,
  PROFILE_STATUSES,
  RELATIONS,
  RELIGIONS,
  STAFF_ROLES,
  STARS,
  type PermissionOverrides,
} from '@fm/shared';

export const staffRole = pgEnum('staff_role', STAFF_ROLES);
export const familyRole = pgEnum('family_role', FAMILY_ROLES);
export const relation = pgEnum('relation', RELATIONS);
export const gender = pgEnum('gender', GENDERS);
export const religion = pgEnum('religion', RELIGIONS);
export const star = pgEnum('star', STARS);
export const keralaDistrict = pgEnum('kerala_district', KERALA_DISTRICTS);
export const maritalStatus = pgEnum('marital_status', MARITAL_STATUSES);
export const profileStatus = pgEnum('profile_status', PROFILE_STATUSES);
export const accessLevel = pgEnum('access_level', ACCESS_LEVELS);
export const memberStatus = pgEnum('member_status', ['INVITED', 'ACTIVE', 'REMOVED']);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** Anyone who logs in: candidates, relatives and staff. */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone: varchar('phone', { length: 16 }).notNull().unique(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }),
  staffRole: staffRole('staff_role'),
  isBlocked: boolean('is_blocked').notNull().default(false),
  ...timestamps,
});

export const otpCodes = pgTable(
  'otp_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    phone: varchar('phone', { length: 16 }).notNull(),
    codeHash: text('code_hash').notNull(),
    attempts: integer('attempts').notNull().default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('otp_phone_idx').on(t.phone)],
);

/** A family groups the people who manage one or more candidate profiles. */
export const families = pgTable('families', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  createdById: uuid('created_by_id')
    .notNull()
    .references(() => users.id),
  ...timestamps,
});

/** A candidate's matrimony profile. */
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyId: uuid('family_id')
      .notNull()
      .references(() => families.id),
    /** The candidate's own login, once they have joined. */
    candidateUserId: uuid('candidate_user_id').references(() => users.id),
    status: profileStatus('status').notNull().default('DRAFT'),
    /** Set when the candidate personally consents to the profile going live. */
    candidateConsentAt: timestamp('candidate_consent_at', { withTimezone: true }),
    fullName: varchar('full_name', { length: 100 }).notNull(),
    gender: gender('gender').notNull(),
    dateOfBirth: date('date_of_birth').notNull(),
    maritalStatus: maritalStatus('marital_status').notNull().default('NEVER_MARRIED'),
    religion: religion('religion').notNull(),
    community: varchar('community', { length: 80 }),
    star: star('star'),
    nativeDistrict: keralaDistrict('native_district'),
    currentCountry: varchar('current_country', { length: 2 }).notNull(),
    currentCity: varchar('current_city', { length: 80 }),
    heightCm: integer('height_cm'),
    education: varchar('education', { length: 120 }),
    occupation: varchar('occupation', { length: 120 }),
    about: text('about'),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id),
    ...timestamps,
  },
  (t) => [
    index('profiles_family_idx').on(t.familyId),
    index('profiles_search_idx').on(t.status, t.gender, t.religion, t.currentCountry),
  ],
);

/** One person's access to one candidate profile. */
export const profileMembers = pgTable(
  'profile_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id),
    /** Null until an invited person signs up and accepts. */
    userId: uuid('user_id').references(() => users.id),
    invitedPhone: varchar('invited_phone', { length: 16 }),
    relation: relation('relation').notNull(),
    role: familyRole('role').notNull(),
    isFamilyAdmin: boolean('is_family_admin').notNull().default(false),
    overrides: jsonb('overrides').$type<PermissionOverrides>().notNull().default({}),
    status: memberStatus('status').notNull().default('INVITED'),
    invitedById: uuid('invited_by_id').references(() => users.id),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('profile_members_profile_user_idx').on(t.profileId, t.userId),
    index('profile_members_phone_idx').on(t.invitedPhone),
  ],
);

/** Every sensitive action, with who did it. */
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorUserId: uuid('actor_user_id').references(() => users.id),
    profileId: uuid('profile_id').references(() => profiles.id),
    action: varchar('action', { length: 64 }).notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('audit_profile_idx').on(t.profileId, t.createdAt)],
);

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type ProfileMember = typeof profileMembers.$inferSelect;
