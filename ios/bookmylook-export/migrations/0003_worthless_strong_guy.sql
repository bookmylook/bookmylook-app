CREATE TABLE "carousel_images" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_url" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true,
	"state_id" varchar,
	"district_id" varchar,
	"town_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "indian_districts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"state_id" varchar NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 999,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "indian_states" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 999,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "indian_states_name_unique" UNIQUE("name"),
	CONSTRAINT "indian_states_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "indian_towns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"district_id" varchar NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'town' NOT NULL,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 999,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photographers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text NOT NULL,
	"business_name" text,
	"description" text,
	"state_id" varchar,
	"district_id" varchar,
	"town_id" varchar,
	"address" text,
	"specialties" jsonb DEFAULT '[]'::jsonb,
	"portfolio" jsonb DEFAULT '[]'::jsonb,
	"profile_image" text,
	"years_experience" integer,
	"starting_price" numeric(10, 2),
	"hourly_rate" numeric(10, 2),
	"package_details" jsonb DEFAULT '[]'::jsonb,
	"website" text,
	"social_media" jsonb,
	"available_days" jsonb DEFAULT '[]'::jsonb,
	"equipment_list" jsonb DEFAULT '[]'::jsonb,
	"is_verified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"rating" numeric(3, 2) DEFAULT '0',
	"review_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "upi_payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" varchar,
	"amount" numeric(10, 2) NOT NULL,
	"upi_id" text NOT NULL,
	"transaction_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_app" text,
	"client_name" text,
	"client_phone" text,
	"provider_name" text,
	"provider_id" varchar,
	"payment_timestamp" timestamp,
	"verified_at" timestamp,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "account_holder_name" text;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "account_number" text;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "ifsc_code" text;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "pan_number" text;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "upi_id" text;--> statement-breakpoint
ALTER TABLE "carousel_images" ADD CONSTRAINT "carousel_images_state_id_indian_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."indian_states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carousel_images" ADD CONSTRAINT "carousel_images_district_id_indian_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."indian_districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carousel_images" ADD CONSTRAINT "carousel_images_town_id_indian_towns_id_fk" FOREIGN KEY ("town_id") REFERENCES "public"."indian_towns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "indian_districts" ADD CONSTRAINT "indian_districts_state_id_indian_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."indian_states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "indian_towns" ADD CONSTRAINT "indian_towns_district_id_indian_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."indian_districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photographers" ADD CONSTRAINT "photographers_state_id_indian_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."indian_states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photographers" ADD CONSTRAINT "photographers_district_id_indian_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."indian_districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photographers" ADD CONSTRAINT "photographers_town_id_indian_towns_id_fk" FOREIGN KEY ("town_id") REFERENCES "public"."indian_towns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upi_payments" ADD CONSTRAINT "upi_payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upi_payments" ADD CONSTRAINT "upi_payments_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;