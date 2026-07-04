import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthAdmin() {
  const email = `test_founder_admin_${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  
  console.log(`Attempting to create and confirm user ${email}...`);
  
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username: 'testadminuser',
      full_name: 'Test Admin User'
    }
  });

  if (error) {
    console.error('Admin user creation failed:', error.message);
  } else {
    console.log('Admin user creation successful:', data.user?.id);
    
    console.log('Testing regular login with created credentials...');
    const anonSupabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    const loginResult = await anonSupabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (loginResult.error) {
        console.error('Login failed:', loginResult.error.message);
    } else {
        console.log('Login successful! Session:', loginResult.data.session?.access_token ? 'Present' : 'Missing');
    }
  }
}

testAuthAdmin();
