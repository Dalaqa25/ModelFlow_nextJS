import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get the current pathname
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  
  // Get user session - only check if needed for protected routes
  let user = null;
  
  // Only check auth for protected routes to avoid unnecessary session checks
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/profile') || pathname.startsWith('/admin') || pathname === '/') {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    user = authUser;
  }

  // If user is authenticated and trying to access root, redirect to dashboard
  if (user && pathname === '/') {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // If user is not authenticated and trying to access dashboard or other protected routes
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/profile') || pathname.startsWith('/admin'))) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};