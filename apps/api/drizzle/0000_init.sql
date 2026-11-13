CREATE TYPE "public"."access_level" AS ENUM('DENY', 'SUGGEST', 'APPROVAL', 'ALLOW');--> statement-breakpoint
CREATE TYPE "public"."family_role" AS ENUM('CANDIDATE', 'PARENT', 'SIBLING', 'RELATIVE');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE');--> statement-breakpoint
CREATE TYPE "public"."kerala_district" AS ENUM('THIRUVANANTHAPURAM', 'KOLLAM', 'PATHANAMTHITTA', 'ALAPPUZHA', 'KOTTAYAM', 'IDUKKI', 'ERNAKULAM', 'THRISSUR', 'PALAKKAD', 'MALAPPURAM', 'KOZHIKODE', 'WAYANAD', 'KANNUR', 'KASARAGOD');--> statement-breakpoint
CREATE TYPE "public"."marital_status" AS ENUM('NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'AWAITING_DIVORCE');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('INVITED', 'ACTIVE', 'REMOVED');--> statement-breakpoint
CREATE TYPE "public"."profile_status" AS ENUM('DRAFT', 'PENDING_VERIFICATION', 'LIVE', 'HIDDEN', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."relation" AS ENUM('SELF', 'MOTHER', 'FATHER', 'BROTHER', 'SISTER', 'GUARDIAN', 'UNCLE', 'AUNT', 'COUSIN', 'GRANDPARENT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."religion" AS ENUM('HINDU', 'CHRISTIAN', 'MUSLIM', 'JAIN', 'SIKH', 'BUDDHIST', 'OTHER', 'NONE');--> statement-breakpoint
CREATE TYPE "public"."staff_role" AS ENUM('ADMIN', 'SUPPORT_AGENT', 'VERIFIER');--> statement-breakpoint
CREATE TYPE "public"."star" AS ENUM('ASWATHY', 'BHARANI', 'KARTHIKA', 'ROHINI', 'MAKAYIRAM', 'THIRUVATHIRA', 'PUNARTHAM', 'POOYAM', 'AYILYAM', 'MAKAM', 'POORAM', 'UTHRAM', 'ATHAM', 'CHITHIRA', 'CHOTHI', 'VISAKHAM', 'ANIZHAM', 'THRIKKETTA', 'MOOLAM', 'POORADAM', 'UTHRADAM', 'THIRUVONAM', 'AVITTAM', 'CHATHAYAM', 'POORURUTTATHI', 'UTHRATTATHI', 'REVATHI');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"profile_id" uuid,
	"action" varchar(64) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "families" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" varchar(16) NOT NULL,
	"code_hash" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"user_id" uuid,
	"invited_phone" varchar(16),
	"relation" "relation" NOT NULL,
	"role" "family_role" NOT NULL,
	"is_family_admin" boolean DEFAULT false NOT NULL,
	"overrides" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "member_status" DEFAULT 'INVITED' NOT NULL,
	"invited_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"candidate_user_id" uuid,
	"status" "profile_status" DEFAULT 'DRAFT' NOT NULL,
	"candidate_consent_at" timestamp with time zone,
	"full_name" varchar(100) NOT NULL,
	"gender" "gender" NOT NULL,
	"date_of_birth" date NOT NULL,
	"marital_status" "marital_status" DEFAULT 'NEVER_MARRIED' NOT NULL,
	"religion" "religion" NOT NULL,
	"community" varchar(80),
	"star" "star",
	"native_district" "kerala_district",
	"current_country" varchar(2) NOT NULL,
	"current_city" varchar(80),
	"height_cm" integer,
	"education" varchar(120),
	"occupation" varchar(120),
	"about" text,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" varchar(16) NOT NULL,
	"name" varchar(100),
	"email" varchar(255),
	"staff_role" "staff_role",
	"is_blocked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "families" ADD CONSTRAINT "families_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_members" ADD CONSTRAINT "profile_members_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_members" ADD CONSTRAINT "profile_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_members" ADD CONSTRAINT "profile_members_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_candidate_user_id_users_id_fk" FOREIGN KEY ("candidate_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_profile_idx" ON "audit_log" USING btree ("profile_id","created_at");--> statement-breakpoint
CREATE INDEX "otp_phone_idx" ON "otp_codes" USING btree ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_members_profile_user_idx" ON "profile_members" USING btree ("profile_id","user_id");--> statement-breakpoint
CREATE INDEX "profile_members_phone_idx" ON "profile_members" USING btree ("invited_phone");--> statement-breakpoint
CREATE INDEX "profiles_family_idx" ON "profiles" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "profiles_search_idx" ON "profiles" USING btree ("status","gender","religion","current_country");