import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'https://lphgxslwytubrtjdtahz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwaGd4c2x3eXR1YnJ0amR0YWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNzk4MzMsImV4cCI6MjA3MzY1NTgzM30.AsLETVUSzbeTM4uKnI-w44d5-1eCU7OatifBx7vMoAo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
    console.log('🔄 Running database migration: fix_aadhaar_type.sql');

    try {
        // Read the SQL file
        const sqlPath = path.join(process.cwd(), 'fix_aadhaar_type.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        console.log('📄 SQL to execute:');
        console.log(sql);
        console.log('');

        // Execute the ALTER TABLE command
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('❌ Migration failed:', error);
            console.error('Error details:', error.message);
            console.log('');
            console.log('⚠️  Note: You may need to run this migration manually in the Supabase SQL Editor.');
            console.log('   1. Go to https://lphgxslwytubrtjdtahz.supabase.co');
            console.log('   2. Navigate to SQL Editor');
            console.log('   3. Paste and run the contents of fix_aadhaar_type.sql');
            process.exit(1);
        }

        console.log('✅ Migration completed successfully!');
        console.log('Data:', data);

    } catch (err: any) {
        console.error('❌ Unexpected error:', err.message);
        console.log('');
        console.log('⚠️  Please run the migration manually in the Supabase SQL Editor:');
        console.log('   1. Go to https://lphgxslwytubrtjdtahz.supabase.co');
        console.log('   2. Navigate to SQL Editor');
        console.log('   3. Paste and run the contents of fix_aadhaar_type.sql');
        process.exit(1);
    }
}

runMigration();
