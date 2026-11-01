const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://lbldljgyusyqqcbyvmem.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxibGRsamd5dXN5cXFjYnl2bWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5Mzg2NDcsImV4cCI6MjEwODUxNDY0N30.WsFo9NV3CI_fw5jOe3d-XNuGZ-HElpogkyq0UAINN8U'
);

async function testAuth() {
  console.log('Testing Supabase Auth with mohitsharma99229@gmail.com / Maxline@2026 ...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'mohitsharma99229@gmail.com',
    password: 'Maxline@2026'
  });

  if (error) {
    console.error('FAILED TO SIGN IN:', error);
  } else {
    console.log('SUCCESSFULLY SIGNED IN!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Access token acquired:', !!data.session?.access_token);
  }
}

testAuth();
