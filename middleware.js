
import { updateSession } from './utils/supabase/middleware'

export async function middleware(request) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Match all request paths except the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization)
    // - favicon.ico
    // - common image file types
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
