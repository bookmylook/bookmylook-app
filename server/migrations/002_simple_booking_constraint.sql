-- Simplified database migration for booking constraint
-- This migration takes a different approach to handle PostgreSQL immutability requirements

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add appointment_end_time column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='appointment_end_time') THEN
        ALTER TABLE bookings ADD COLUMN appointment_end_time TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Update existing bookings to calculate appointment_end_time
UPDATE bookings 
SET appointment_end_time = appointment_date + INTERVAL '30 minutes'
WHERE appointment_end_time IS NULL;

-- Create a function to help with booking overlap detection
-- This function will be marked as IMMUTABLE to satisfy PostgreSQL requirements
CREATE OR REPLACE FUNCTION booking_time_range(start_time TIMESTAMPTZ, end_time TIMESTAMPTZ) 
RETURNS tstzrange 
LANGUAGE sql IMMUTABLE
AS $$
  SELECT tstzrange(start_time, COALESCE(end_time, start_time + INTERVAL '30 minutes'));
$$;

-- Create simplified exclusion constraint using the immutable function
DO $$
BEGIN
    -- Drop any existing constraints
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_staff_bookings') THEN
        ALTER TABLE bookings DROP CONSTRAINT no_overlapping_staff_bookings;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_provider_bookings') THEN
        ALTER TABLE bookings DROP CONSTRAINT no_overlapping_provider_bookings;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'simple_booking_overlap_constraint') THEN
        ALTER TABLE bookings DROP CONSTRAINT simple_booking_overlap_constraint;
    END IF;
    
    -- Create a simplified constraint for staff-based bookings
    ALTER TABLE bookings ADD CONSTRAINT no_overlapping_staff_bookings
    EXCLUDE USING gist (
        provider_id WITH =,
        staff_member_id WITH =,
        booking_time_range(appointment_date, appointment_end_time) WITH &&
    ) WHERE (status != 'cancelled' AND staff_member_id IS NOT NULL);
    
    -- Create a simplified constraint for provider-based bookings  
    ALTER TABLE bookings ADD CONSTRAINT no_overlapping_provider_bookings
    EXCLUDE USING gist (
        provider_id WITH =,
        booking_time_range(appointment_date, appointment_end_time) WITH &&
    ) WHERE (status != 'cancelled' AND staff_member_id IS NULL);
    
    RAISE NOTICE 'Simple booking exclusion constraints created successfully';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating simplified constraints: %', SQLERRM;
    RAISE NOTICE 'Proceeding without database-level constraint protection';
END $$;

-- Create supporting indexes
CREATE INDEX IF NOT EXISTS idx_bookings_provider_staff_overlap
ON bookings USING gist (
    provider_id, 
    staff_member_id,
    booking_time_range(appointment_date, appointment_end_time)
) WHERE status != 'cancelled';

-- Validate the constraints were created
DO $$
DECLARE
    staff_constraint_exists BOOLEAN;
    provider_constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_staff_bookings') INTO staff_constraint_exists;
    SELECT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_provider_bookings') INTO provider_constraint_exists;
    
    IF staff_constraint_exists AND provider_constraint_exists THEN
        RAISE NOTICE '✅ Simple booking exclusion constraints validated successfully!';
    ELSE
        RAISE NOTICE '⚠️ Some constraints may not have been created. Staff: %, Provider: %', 
                     staff_constraint_exists, provider_constraint_exists;
    END IF;
END $$;