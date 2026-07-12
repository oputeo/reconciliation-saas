import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => 
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const pathname = req.nextUrl.pathname;

  // Protected routes
  const protectedRoutes = ['/executive', '/anomalies', '/uploads', '/reconciliation', '/reports', '/settings'];
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = pathname.startsWith('/admin');

  // Redirect to login if not authenticated
  if ((isProtected || isAdminRoute) && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Admin route protection
  if (isAdminRoute && session) {
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .limit(1);

    if (!adminRoles?.length) {
      return NextResponse.redirect(new URL('/executive', req.url));
    }
  }

  // Workspace membership required for tenant data routes
  if (isProtected && session) {
    const { data: membership } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .limit(1)
      .maybeSingle();

    if (!membership) {
      return NextResponse.redirect(new URL('/access-denied', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/executive/:path*',
    '/anomalies/:path*',
    '/uploads/:path*',
    '/reconciliation/:path*',
    '/reports/:path*',
    '/admin/:path*',
    '/settings/:path*',
    '/login',
    '/sign-in',
    '/accept-invite',
  ],
};

