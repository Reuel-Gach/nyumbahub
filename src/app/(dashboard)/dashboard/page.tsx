import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function DashboardRouter() {
  const clerkUser = await currentUser();
  
  // If they aren't logged in, send them to Clerk
  if (!clerkUser) {
    redirect("/sign-in");
  }

  // Fetch their profile from your database
  const [dbUser] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id));

  // If they don't exist yet, or they are a tenant, send them to the tenant view
  if (!dbUser || dbUser.role === "tenant") {
    redirect("/tenant/dashboard");
  } 
  
  // If they are a landlord, send them to the management view
  if (dbUser.role === "landlord") {
    redirect("/mgmt/dashboard");
  }

  // Fallback just in case
  redirect("/");
}