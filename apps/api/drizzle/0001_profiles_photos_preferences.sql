CREATE TYPE "public"."photo_status" AS ENUM('UPLOADING', 'READY', 'REJECTED', 'DELETED');--> statement-breakpoint
CREATE TYPE "public"."suggestion_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "edit_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"suggested_by_id" uuid NOT NULL,
	"changes" jsonb NOT NULL,
	"status" "suggestion_status" DEFAULT 'PENDING' NOT NULL,
	"reviewed_by_id" uuid,
	"reviewed_at" timestamp with time zone,
	"note" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_preferences" (
	"profile_id" uuid PRIMARY KEY NOT NULL,
	"age_min" integer NOT NULL,
	"age_max" integer NOT NULL,
	"height_min_cm" integer,
	"height_max_cm" integer,
	"religions" "religion"[] DEFAULT '{}' NOT NULL,
	"communities" text[] DEFAULT '{}' NOT NULL,
	"stars" "star"[] DEFAULT '{}' NOT NULL,
	"marital_statuses" "marital_status"[] DEFAULT '{}' NOT NULL,
	"native_districts" "kerala_district"[] DEFAULT '{}' NOT NULL,
	"countries" varchar(2)[] DEFAULT '{}' NOT NULL,
	"education_notes" varchar(300),
	"require_porutham" boolean DEFAULT false NOT NULL,
	"updated_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"uploaded_by_id" uuid NOT NULL,
	"status" "photo_status" DEFAULT 'UPLOADING' NOT NULL,
	"upload_key" text NOT NULL,
	"display_key" text,
	"blurred_key" text,
	"width" integer,
	"height" integer,
	"is_primary" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "edit_suggestions" ADD CONSTRAINT "edit_suggestions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edit_suggestions" ADD CONSTRAINT "edit_suggestions_suggested_by_id_users_id_fk" FOREIGN KEY ("suggested_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edit_suggestions" ADD CONSTRAINT "edit_suggestions_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_preferences" ADD CONSTRAINT "partner_preferences_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_preferences" ADD CONSTRAINT "partner_preferences_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_photos" ADD CONSTRAINT "profile_photos_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_photos" ADD CONSTRAINT "profile_photos_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "suggestions_profile_idx" ON "edit_suggestions" USING btree ("profile_id","status");--> statement-breakpoint
CREATE INDEX "photos_profile_idx" ON "profile_photos" USING btree ("profile_id","status");