const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Try to create a user first
  const email = 'test' + Date.now() + '@example.com';
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password: 'password123'
  });
  
  if (signUpError) {
    console.log('SignUp Error:', signUpError);
    return;
  }
  
  const userId = signUpData.user.id;
  console.log('User ID:', userId);

  // Insert feeding
  const now = new Date().toISOString();
  const { data: feeding, error: feedingError } = await supabase
      .from('feedings')
      .insert({ user_id: userId, started_at: now })
      .select()
      .single();

  console.log('Feeding Error:', feedingError);
  console.log('Feeding Data:', feeding);

  if (feeding) {
    // Insert segment
    const { data: segment, error: segmentError } = await supabase
      .from('feeding_segments')
      .insert({ feeding_id: feeding.id, breast: 'left', started_at: now })
      .select()
      .single();
    
    console.log('Segment Error:', segmentError);
    console.log('Segment Data:', segment);
  }
}
run();
