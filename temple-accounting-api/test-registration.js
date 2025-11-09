// Test user registration to identify the exact error
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function testRegistration() {
  console.log('=== Testing User Registration ===');

  const testUser = {
    username: `test_user_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'testpassword123',
    temple_name: 'Test Temple'
  };

  console.log('Test user data:', {
    ...testUser,
    password: '***'
  });

  try {
    // Step 1: Check if user already exists
    console.log('\n1. Checking if user already exists...');
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${testUser.username},email.eq.${testUser.email}`)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.log('❌ Check error:', checkError);
    } else if (existingUser) {
      console.log('❌ User already exists');
      return;
    }

    // Step 2: Hash password
    console.log('\n2. Hashing password...');
    const hashedPassword = await bcryptjs.hash(testUser.password, 10);
    console.log('✅ Password hashed');

    // Step 3: Insert user
    console.log('\n3. Inserting user...');
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([{
        username: testUser.username,
        email: testUser.email,
        password: hashedPassword,
        temple_name: testUser.temple_name
      }])
      .select()
      .single();

    if (userError) {
      console.log('❌ Insert error:', userError);
      console.log('Error code:', userError.code);
      console.log('Error details:', userError.details);
      return;
    }

    console.log('✅ User created successfully:', newUser.id);

    // Step 4: Verify user was created
    console.log('\n4. Verifying user creation...');
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .eq('id', newUser.id)
      .single();

    if (verifyError) {
      console.log('❌ Verification error:', verifyError);
    } else {
      console.log('✅ User verified:', verifyUser.username);
    }

  } catch (error) {
    console.log('❌ Test failed:', error);
  }
}

testRegistration().catch(console.error);