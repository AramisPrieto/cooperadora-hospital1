import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '/Users/aramisprieto/Documents/cooperadora-hospital1/backend/.env' });

async function check() {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    console.error('No MP_ACCESS_TOKEN found');
    return;
  }
  
  try {
    const res = await fetch('https://api.mercadopago.com/users/test_user', {
      headers: {
        'Authorization': `Bearer ${token.trim()}`
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('Test Users:', JSON.stringify(data, null, 2));
    } else {
      console.error('Error fetching test users:', res.status, await res.text());
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

check();
