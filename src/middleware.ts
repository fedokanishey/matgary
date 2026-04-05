import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { NextResponse } from "next/server";

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

const isApiRoute = createRouteMatcher(["/api(.*)"]);

export default clerkMiddleware(async (auth, req) => {
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
