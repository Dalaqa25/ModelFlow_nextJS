import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;

  // API routes authenticate inside their own handlers. Running the Supabase
  // browser-session refresh middleware for API requests can rewrite cookies
  // and repeatedly re-dispatch the same request in development.
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

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

  // Refresh session on every non-API request so cookies stay fresh
  await supabase.auth.getUser();

  // Get the current pathname
  const url = request.nextUrl.clone();

  // Get user session for route protection checks
  let user = null;
  
  if (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/profile') || 
      pathname.startsWith('/messages') ||
      pathname.startsWith('/auth/') || 
      pathname.startsWith('/main')) {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    user = authUser;
  }

  // If user is authenticated and trying to access auth routes, redirect to main
  if (user && pathname.startsWith('/auth/')) {
    url.pathname = '/main';
    return NextResponse.redirect(url);
  }

  // If user is not authenticated and trying to access dashboard or other protected routes
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/profile') || pathname.startsWith('/messages'))) {
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
     * - sitemap.xml (SEO sitemap)
     * - robots.txt (SEO robots)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!api(?:/|$)|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
