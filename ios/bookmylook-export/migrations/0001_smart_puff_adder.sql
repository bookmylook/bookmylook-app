CREATE TABLE "refunds" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" varchar NOT NULL,
	"payment_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"razorpay_refund_id" text,
	"razorpay_response" jsonb,
	"cancelled_at" timestamp NOT NULL,
	"appointment_time" timestamp NOT NULL,
	"hours_notice" numeric(10, 2),
	"requested_by" varchar NOT NULL,
	"processed_at" timestamp,
	"completed_at" timestamp,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "service_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "platform_fee" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "razorpay_order_id" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "razorpay_payment_id" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "razorpay_signature" text;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "district" text;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "is_featured" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "featured_order" integer DEFAULT 999;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "bank_name" text;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;