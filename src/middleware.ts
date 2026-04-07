import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const intlMiddleware = createMiddleware(routing);

const isPublicRoute = createRouteMatcher([
  "/",
  "/:locale",
  "/:locale/sign-in(.*)",
  "/:locale/sign-up(.*)",
  "/:locale/store(.*)",
  "/api(.*)",
  "/manifest.webmanifest",
  "/sw.js",
]);

const isCustomerProtectedRoute = createRouteMatcher([
  "/:locale/store/:storeSlug/account(.*)",
  "/:locale/store/:storeSlug/profile(.*)",
  "/:locale/store/:storeSlug/orders(.*)",
  "/:locale/store/:storeSlug/wishlist(.*)",
  "/:locale/store/:storeSlug/checkout(.*)",
  "/:locale/store/:storeSlug/order/success(.*)"
]);

const isCustomerAuthRoute = createRouteMatcher([
  "/:locale/store/:storeSlug/auth/login(.*)",
  "/:locale/store/:storeSlug/auth/signup(.*)",
  "/:locale/store/:storeSlug/login(.*)",
  "/:locale/store/:storeSlug/register(.*)"
]);

const isApiRoute = createRouteMatcher(["/api(.*)"]);

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_for_development_only";
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export default clerkMiddleware(async (auth, req) => {
  // 1. Check if the user is trying to access a customer-protected route
  if (isCustomerProtectedRoute(req) && !isCustomerAuthRoute(req)) {
    const pathnameInfo = req.nextUrl.pathname.split("/");
    const storefrontIndex = pathnameInfo.indexOf("store");
    const storeSlug = storefrontIndex !== -1 ? pathnameInfo[storefrontIndex + 1] : null;

    if (storeSlug) {
      const accessToken = req.cookies.get("customer_access_token")?.value;
      const refreshToken = req.cookies.get("customer_refresh_token")?.value;

      let isAuthenticated = false;

      // First check access token
      if (accessToken) {
        try {
          await jwtVerify(accessToken, encodedSecret);
          isAuthenticated = true; // Could optionally check if payload.storeId matches the storeSlug logic via DB, but that's expensive for generic middleware
        } catch {
          // Token invalid or expired
        }
      }

      // If access token invalid but we have refresh token, let SSR load the page but client handle the refresh
      // Alternatively, we could refresh it here inline, but `NextResponse.next()` can rewrite cookies
      // We will allow access if ANY valid-looking token is present, and depend on layout.tsx / APIs to reject
      if (!isAuthenticated && !refreshToken) {
        const loginUrl = new URL(`/${pathnameInfo[1] || "en"}/store/${storeSlug}/auth/login`, req.url);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  // 2. Platform Authentication (Clerk)
  // Skip intl middleware for API routes
  if (isApiRoute(req)) {
    if (!isPublicRoute(req)) {
      await auth.protect();
    }
    return NextResponse.next();
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: [
    // Skip internal Next.js routes and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
