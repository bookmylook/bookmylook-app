-- Fixed database migration for booking exclusion constraint
-- This migration creates a proper IMMUTABLE function to handle PostgreSQL requirements

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add appointment_end_time column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='appointment_end_time') THEN
        ALTER TABLE bookings ADD COLUMN appointment_end_time TIMESTAMP;
    END IF;
END $$;

-- Update existing bookings to calculate appointment_end_time
UPDATE bookings 
SET appointment_end_time = appointment_date + INTERVAL '30 minutes'
WHERE appointment_end_time IS NULL;

-- Make appointment_end_time NOT NULL
ALTER TABLE bookings ALTER COLUMN appointment_end_time SET NOT NULL;

-- Drop any existing booking constraint functions and constraints
DROP FUNCTION IF EXISTS booking_time_range(TIMESTAMP, TIMESTAMP) CASCADE;
DROP FUNCTION IF EXISTS booking_time_range(TIMESTAMPTZ, TIMESTAMPTZ) CASCADE;

DO $$
BEGIN
    -- Drop any existing constraints
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_staff_bookings') THEN
        ALTER TABLE bookings DROP CONSTRAINT no_overlapping_staff_bookings;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_provider_bookings') THEN
        ALTER TABLE bookings DROP CONSTRAINT no_overlapping_provider_bookings;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_bookings') THEN
        ALTER TABLE bookings DROP CONSTRAINT no_overlapping_bookings;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'simple_booking_overlap_constraint') THEN
        ALTER TABLE bookings DROP CONSTRAINT simple_booking_overlap_constraint;
    END IF;
END $$;

-- Create a properly IMMUTABLE function for time range creation
-- This function uses tsrange (timestamp without timezone) to match our column types
CREATE OR REPLACE FUNCTION create_booking_time_range(start_time TIMESTAMP, end_time TIMESTAMP) 
RETURNS tsrange 
LANGUAGE sql 
IMMUTABLE
STRICT
AS $$
  SELECT tsrange(start_time, COALESCE(end_time, start_time + INTERVAL '30 minutes'), '[)');
$$;

-- Verify the function is properly marked as immutable
DO $$
DECLARE
    func_is_immutable BOOLEAN;
BEGIN
    SELECT p.provolatile = 'i' INTO func_is_immutable
    FROM pg_proc p
    WHERE p.proname = 'create_booking_time_range';
    
    IF func_is_immutable THEN
        RAISE NOTICE 'Function create_booking_time_range is properly marked as IMMUTABLE';
    ELSE
        RAISE EXCEPTION 'Function create_booking_time_range is not marked as IMMUTABLE';
    END IF;
END $$;

-- Create exclusion constraints using the IMMUTABLE function
DO $$
BEGIN
    -- Constraint for bookings WITH staff members
    -- This prevents overlapping appointments for the same provider and staff member
    ALTER TABLE bookings ADD CONSTRAINT no_overlapping_staff_bookings
    EXCLUDE USING gist (
        provider_id WITH =,
        staff_member_id WITH =,
        create_booking_time_range(appointment_date, appointment_end_time) WITH &&
    ) WHERE (status != 'cancelled' AND staff_member_id IS NOT NULL);
    
    -- Constraint for bookings WITHOUT staff members (provider-level bookings)
    -- This prevents overlapping appointments for the same provider when no specific staff is assigned
    ALTER TABLE bookings ADD CONSTRAINT no_overlapping_provider_bookings
    EXCLUDE USING gist (
        provider_id WITH =,
        create_booking_time_range(appointment_date, appointment_end_time) WITH &&
    ) WHERE (status != 'cancelled' AND staff_member_id IS NULL);
    
    RAISE NOTICE 'Exclusion constraints created successfully using IMMUTABLE function';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating exclusion constraints: %', SQLERRM;
    RAISE EXCEPTION 'Failed to create booking exclusion constraints: %', SQLERRM;
END $$;

-- Create supporting indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_provider_staff_time_range
ON bookings USING gist (
    provider_id, 
    staff_member_id,
    create_booking_time_range(appointment_date, appointment_end_time)
) WHERE status != 'cancelled';

CREATE INDEX IF NOT EXISTS idx_bookings_status_provider_date 
ON bookings (status, provider_id, appointment_date) 
WHERE status != 'cancelled';

-- Final validation
DO $$
DECLARE
    staff_constraint_exists BOOLEAN;
    provider_constraint_exists BOOLEAN;
    extension_exists BOOLEAN;
    function_exists BOOLEAN;
BEGIN
    -- Check all components
    SELECT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_staff_bookings') INTO staff_constraint_exists;
    SELECT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_provider_bookings') INTO provider_constraint_exists;
    SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'btree_gist') INTO extension_exists;
    SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_booking_time_range') INTO function_exists;
    
    IF staff_constraint_exists AND provider_constraint_exists AND extension_exists AND function_exists THEN
        RAISE NOTICE '✅ Migration completed successfully!';
        RAISE NOTICE '✅ Extension btree_gist: %', extension_exists;
        RAISE NOTICE '✅ Function create_booking_time_range: %', function_exists;
        RAISE NOTICE '✅ Staff constraint no_overlapping_staff_bookings: %', staff_constraint_exists;
        RAISE NOTICE '✅ Provider constraint no_overlapping_provider_bookings: %', provider_constraint_exists;
        RAISE NOTICE '✅ Database is now protected against overlapping bookings!';
    ELSE
        RAISE EXCEPTION 'Migration validation failed! Extension: %, Function: %, Staff Constraint: %, Provider Constraint: %', 
                       extension_exists, function_exists, staff_constraint_exists, provider_constraint_exists;
    END IF;
END $$;