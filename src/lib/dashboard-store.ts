import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getDashboardStore() {
  const { userId } = await auth();
  if (!userId) {
    return { userId: null, user: null, store: null };
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      stores: {
        take: 1,
        include: {
          configuration: true,
          themeSettings: true,
        },
      },
    },
  });

  return {
    userId,
    user,
    store: user?.stores[0] || null,
  };
}
