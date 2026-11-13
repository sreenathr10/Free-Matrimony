ALTER TABLE "profiles" ADD COLUMN "sub_caste" varchar(80);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "caste_no_bar" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "profiles_community_idx" ON "profiles" USING btree ("religion","community");