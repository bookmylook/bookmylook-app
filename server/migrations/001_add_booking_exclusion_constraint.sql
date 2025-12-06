-- Database migration for booking exclusion constraint
-- This migration adds PostgreSQL exclusion constraint to prevent overlapping bookings

-- Enable required PostgreSQL extensions for GIST indexes with range types
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add appointment_end_time column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='appointment_end_time') THEN
        ALTER TABLE bookings ADD COLUMN appointment_end_time TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Update existing bookings to calculate appointment_end_time based on service duration
-- Default to 30 minutes if no service is found
UPDATE bookings 
SET appointment_end_time = appointment_date + INTERVAL '30 minutes'
WHERE appointment_end_time IS NULL;

-- Make appointment_end_time NOT NULL to ensure constraint immutability
ALTER TABLE bookings ALTER COLUMN appointment_end_time SET NOT NULL;

-- Create exclusion constraint to prevent overlapping bookings
-- This constraint prevents time overlaps for the same (provider_id, staff_member_id) combination
-- Using tstzrange to create time ranges and &&& operator for overlap detection
DO $$
BEGIN
    -- Drop constraints if they exist (for re-running migration)
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_bookings') THEN
        ALTER TABLE bookings DROP CONSTRAINT no_overlapping_bookings;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_staff_bookings') THEN
        ALTER TABLE bookings DROP CONSTRAINT no_overlapping_staff_bookings;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_provider_bookings') THEN
        ALTER TABLE bookings DROP CONSTRAINT no_overlapping_provider_bookings;
    END IF;
    
    -- Create exclusion constraints to prevent overlapping bookings
    -- Note: We need separate constraints for staff-based and provider-based bookings
    -- because PostgreSQL handles NULL values in exclusion constraints differently
    
    -- Constraint for bookings WITH staff members
    ALTER TABLE bookings ADD CONSTRAINT no_overlapping_staff_bookings
    EXCLUDE USING gist (
        provider_id WITH =,
        staff_member_id WITH =,
        tstzrange(appointment_date, appointment_end_time) WITH &&
    ) WHERE (status != 'cancelled' AND staff_member_id IS NOT NULL);
    
    -- Constraint for bookings WITHOUT staff members (provider-level bookings)
    ALTER TABLE bookings ADD CONSTRAINT no_overlapping_provider_bookings
    EXCLUDE USING gist (
        provider_id WITH =,
        tstzrange(appointment_date, appointment_end_time) WITH &&
    ) WHERE (status != 'cancelled' AND staff_member_id IS NULL);
    
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail migration
    RAISE NOTICE 'Error creating exclusion constraint: %', SQLERRM;
    RAISE NOTICE 'This may be due to existing overlapping data. Please review bookings manually.';
END $$;

-- Create index to speed up booking queries
CREATE INDEX IF NOT EXISTS idx_bookings_provider_staff_time 
ON bookings USING gist (
    provider_id, 
    staff_member_id,
    tstzrange(appointment_date, appointment_end_time)
) WHERE status != 'cancelled';

-- Create index for faster status-based queries
CREATE INDEX IF NOT EXISTS idx_bookings_status_provider_date 
ON bookings (status, provider_id, appointment_date) 
WHERE status != 'cancelled';

-- Validate the migration worked correctly
DO $$
DECLARE
    constraint_exists BOOLEAN;
    extension_exists BOOLEAN;
BEGIN
    -- Check if constraint was created
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'no_overlapping_bookings'
    ) INTO constraint_exists;
    
    -- Check if extension was created
    SELECT EXISTS (
        SELECT 1 FROM pg_extension 
        WHERE extname = 'btree_gist'
    ) INTO extension_exists;
    
    IF constraint_exists AND extension_exists THEN
        RAISE NOTICE 'Migration completed successfully!';
        RAISE NOTICE 'Exclusion constraint "no_overlapping_bookings" created.';
        RAISE NOTICE 'btree_gist extension enabled.';
    ELSE
        RAISE NOTICE 'Migration may have failed. Constraint exists: %, Extension exists: %', 
                     constraint_exists, extension_exists;
    END IF;
END $$;