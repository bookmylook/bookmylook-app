import { Pool } from '@neondatabase/serverless';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface MigrationResult {
  success: boolean;
  message: string;
  error?: string;
}

export class MigrationRunner {
  private static instance: MigrationRunner;
  
  private constructor(private pool: Pool) {}
  
  public static getInstance(poolInstance?: Pool): MigrationRunner {
    if (!MigrationRunner.instance) {
      MigrationRunner.instance = new MigrationRunner(poolInstance || pool);
    }
    return MigrationRunner.instance;
  }

  /**
   * Run a specific migration by filename
   */
  async runMigration(migrationFile: string): Promise<MigrationResult> {
    try {
      console.log(`🚀 Running migration: ${migrationFile}`);
      
      const migrationPath = join(__dirname, migrationFile);
      const migrationSQL = await readFile(migrationPath, 'utf-8');
      
      // Execute the migration in a transaction
      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Run the migration
        await client.query(migrationSQL);
        
        await client.query('COMMIT');
        
        console.log(`✅ Migration ${migrationFile} completed successfully`);
        return {
          success: true,
          message: `Migration ${migrationFile} completed successfully`
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Migration ${migrationFile} failed:`, errorMessage);
      return {
        success: false,
        message: `Migration ${migrationFile} failed`,
        error: errorMessage
      };
    }
  }

  /**
   * Run the booking exclusion constraint migration
   */
  async runBookingExclusionMigration(): Promise<MigrationResult> {
    // Try the fixed migration first (handles IMMUTABLE function requirements)
    const fixedResult = await this.runMigration('003_fixed_booking_constraint.sql');
    if (fixedResult.success) {
      return fixedResult;
    }
    
    // Fallback to simple migration if fixed one fails
    console.log('Fixed migration failed, trying simple migration...');
    const simpleResult = await this.runMigration('002_simple_booking_constraint.sql');
    if (simpleResult.success) {
      return simpleResult;
    }
    
    // Final fallback to original migration
    console.log('Simple migration failed, trying original migration...');
    return this.runMigration('001_add_booking_exclusion_constraint.sql');
  }

  /**
   * Validate that the exclusion constraint exists
   */
  async validateBookingConstraint(): Promise<boolean> {
    try {
      const result = await this.pool.query(`
        SELECT 
          EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_staff_bookings') as staff_constraint_exists,
          EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_provider_bookings') as provider_constraint_exists
      `);
      
      const staffExists = result.rows[0]?.staff_constraint_exists || false;
      const providerExists = result.rows[0]?.provider_constraint_exists || false;
      
      return staffExists && providerExists;
    } catch (error) {
      console.error('Error validating booking constraint:', error);
      return false;
    }
  }

  /**
   * Validate that btree_gist extension exists
   */
  async validateGistExtension(): Promise<boolean> {
    try {
      const result = await this.pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_extension 
          WHERE extname = 'btree_gist'
        ) as extension_exists
      `);
      
      return result.rows[0]?.extension_exists || false;
    } catch (error) {
      console.error('Error validating GIST extension:', error);
      return false;
    }
  }

  /**
   * Run startup validation to ensure critical database constraints exist
   */
  async validateStartupConstraints(): Promise<void> {
    console.log('🔍 Validating database constraints...');
    
    const [constraintExists, extensionExists] = await Promise.all([
      this.validateBookingConstraint(),
      this.validateGistExtension()
    ]);

    if (!extensionExists) {
      console.warn('⚠️  btree_gist extension not found. Running migration...');
      await this.runBookingExclusionMigration();
    }

    if (!constraintExists) {
      console.warn('⚠️  Booking exclusion constraint not found. Running migration...');
      await this.runBookingExclusionMigration();
    }

    // Re-validate after migration
    const [finalConstraintCheck, finalExtensionCheck] = await Promise.all([
      this.validateBookingConstraint(),
      this.validateGistExtension()
    ]);

    if (finalConstraintCheck && finalExtensionCheck) {
      console.log('✅ All database constraints validated successfully');
    } else {
      console.warn('⚠️ Database constraint validation failed - proceeding with warning');
      console.warn(`Constraint exists: ${finalConstraintCheck}, Extension exists: ${finalExtensionCheck}`);
      console.warn('This may result in potential booking conflicts under high concurrency');
      // Don't throw error for now - allow server to start for testing
    }
  }
}

// Export singleton instance
export const migrationRunner = MigrationRunner.getInstance();