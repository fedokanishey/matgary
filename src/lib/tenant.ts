import { db } from "./db";

/**
 * Resolve a store (tenant) by its slug from the database.
 */
export async function getStoreBySlug(slug: string) {
  return db.store.findUnique({
    where: { slug },
    include: {
      themeSettings: true,
      configuration: true,
    },
  });
}

/**
 * Get the current user's store from their Clerk ID.
 */
export async function getStoreByClerkId(clerkId: string) {
  const user = await db.user.findUnique({
    where: { clerkId },
    include: {
      stores: {
        include: {
          themeSettings: true,
          configuration: true,
        },
      },
    },
  });

  // Return the first store (users can own multiple stores later)
  return user?.stores[0] ?? null;
}

/**
 * Ensure a user exists in the database, synced from Clerk.
 */
export async function ensureUser(clerkUser: {
  id: string;
  emailAddresses: { emailAddress: string }[];
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
}) {
  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error("User has no email address");

  return db.user.upsert({
    where: { clerkId: clerkUser.id },
    update: {
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
    },
    create: {
      clerkId: clerkUser.id,
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
    },
  });
}
