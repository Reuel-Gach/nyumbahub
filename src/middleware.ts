import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define the webhook route so Clerk ignores it entirely
const isUploadThingRoute = createRouteMatcher(["/api/uploadthing"]);

export default clerkMiddleware((auth, req) => {
  // If it is the UploadThing webhook, do absolutely nothing (bypass Clerk)
  if (isUploadThingRoute(req)) {
    return;
  }
  
  // Otherwise, protect your app normally
  // (Add your other protection logic here if you had any)
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};