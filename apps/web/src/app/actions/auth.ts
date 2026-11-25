// Browser-side sign-in. The site is a static export (no Next.js server), so the
// login token lives in this browser's localStorage and is sent as a Bearer
// header to the API. These keep the names the pages already import.
import { authApi } from '@/lib/auth';

const TOKEN_KEY = 'cartsync_access_token';

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null; // private window or blocked site data
  }
}

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) return { error: 'Email and password required' };

  try {
    const params = new URLSearchParams();
    params.append('username', email); // OAuth2 expects 'username'
    params.append('password', password);

    const tokenResponse = await authApi.login(params);
    const store = storage();
    if (!store) return { error: 'Your browser blocks site data, so sign-in cannot be saved.' };
    store.setItem(TOKEN_KEY, tokenResponse.access_token);
  } catch (error: any) {
    return { error: error.message };
  }

  window.location.assign('/dashboard');
  return undefined;
}

export async function logoutAction() {
  storage()?.removeItem(TOKEN_KEY);
  window.location.assign('/login');
}

export async function getToken() {
  return storage()?.getItem(TOKEN_KEY) || null;
}
