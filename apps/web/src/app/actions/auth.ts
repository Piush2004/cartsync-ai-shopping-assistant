'use server';

import { cookies } from 'next/headers';
import { authApi } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) return { error: 'Email and password required' };

  try {
    const params = new URLSearchParams();
    params.append('username', email); // OAuth2 expects 'username'
    params.append('password', password);

    const tokenResponse = await authApi.login(params);
    
    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('access_token', tokenResponse.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

  } catch (error: any) {
    return { error: error.message };
  }

  redirect('/dashboard');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('access_token');
  redirect('/login');
}

export async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get('access_token')?.value || null;
}
