import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  const email = `test_founder_${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  
  console.log(`Attempting to sign up with ${email}...`);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: 'testuser',
        full_name: 'Test User'
      }
    }
  });

  if (error) {
    console.error('Signup failed:', error.message);
  } else {
    console.log('Signup successful:', data.user?.id);
    if (data.session) {
      console.log('User is logged in (session exists)');
    } else {
      console.log('No session returned. Email verification might be required.');
    }
  }
}

testAuth();
