CREATE TYPE "public"."id_document_type" AS ENUM('AADHAAR', 'PASSPORT', 'EMIRATES_ID', 'DRIVING_LICENCE', 'NATIONAL_ID');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('COLLECTING', 'IN_REVIEW', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"status" "verification_status" DEFAULT 'COLLECTING' NOT NULL,
	"id_document_type" "id_document_type",
	"selfie_key" text,
	"id_front_key" text,
	"id_back_key" text,
	"file_hashes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"provider" varchar(32),
	"provider_ref" varchar(128),
	"checks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"flagged" boolean DEFAULT false NOT NULL,
	"submitted_by_id" uuid,
	"submitted_at" timestamp with time zone,
	"reviewer_id" uuid,
	"decided_at" timestamp with time zone,
	"rejection_reason" varchar(32),
	"reviewer_note" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "verifications_profile_idx" ON "verifications" USING btree ("profile_id","created_at");--> statement-breakpoint
CREATE INDEX "verifications_queue_idx" ON "verifications" USING btree ("status","submitted_at");