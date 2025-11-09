// Test Supabase connection and check table structure
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('=== Testing Supabase Connection ===');
console.log('URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('Key:', supabaseKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Supabase credentials missing!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test connection
    console.log('\n=== Testing Database Connection ===');
    const { data, error, count } = await supabase.from('users').select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Connection failed:', error);
      return;
    }

    console.log('✅ Connection successful!');
    console.log('Users count:', count || 0);

    // Check tables
    console.log('\n=== Checking Tables Structure ===');

    const tables = ['users', 'categories', 'transactions'];

    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`❌ Table '${table}': ${error.message}`);
        } else {
          console.log(`✅ Table '${table}': ${count} records`);
        }
      } catch (e) {
        console.log(`❌ Table '${table}': ${e.message}`);
      }
    }

    // Test RLS policies
    console.log('\n=== Testing RLS Policies ===');
    const { data: rlsData, error: rlsError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (rlsError) {
      console.log('RLS Status:', rlsError.message.includes('row level security') ? '✅ Enabled' : '❌ Error');
    } else {
      console.log('RLS Status: ⚠️ May be disabled (can read data without auth)');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testConnection().catch(console.error);