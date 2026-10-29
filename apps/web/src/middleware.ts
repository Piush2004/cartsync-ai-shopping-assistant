import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register');
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                           request.nextUrl.pathname.startsWith('/measurements') ||
                           request.nextUrl.pathname.startsWith('/profile') ||
                           request.nextUrl.pathname.startsWith('/history') ||
                           request.nextUrl.pathname.startsWith('/products') ||
                           request.nextUrl.pathname.startsWith('/stylist') ||
                           request.nextUrl.pathname.startsWith('/testing') ||
                           request.nextUrl.pathname.startsWith('/try-on');

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/measurements/:path*',
    '/profile/:path*',
    '/history/:path*',
    '/products/:path*',
    '/stylist/:path*',
    '/testing/:path*',
    '/try-on/:path*',
    '/login',
    '/register',
  ],
};
