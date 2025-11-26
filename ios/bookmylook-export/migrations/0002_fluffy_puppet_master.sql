ALTER TABLE "bookings" ADD COLUMN "actual_start_time" timestamp;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "actual_end_time" timestamp;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "was_rescheduled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "original_appointment_date" timestamp;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "rescheduled_reason" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "rescheduled_from" varchar;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_rescheduled_from_bookings_id_fk" FOREIGN KEY ("rescheduled_from") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;