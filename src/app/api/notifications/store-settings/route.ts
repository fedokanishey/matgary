import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    console.log("[store-settings GET] userId:", userId);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { stores: { take: 1 } },
    });

    console.log("[store-settings GET] user:", user?.id, "stores:", user?.stores?.length);

    // If user doesn't exist, return empty store data (user should be created via Clerk webhook)
    if (!user) {
      console.log("[store-settings GET] User not found in database");
      return NextResponse.json({ 
        success: true, 
        store: {
          name: "",
          slug: "",
          description: "",
          currency: "USD",
          logoUrl: null,
          faviconUrl: null,
          configuration: null,
          themeSettings: null,
        }
      });
    }

    // If user doesn't have a store, create one
    if (!user.stores[0]) {
      console.log("[store-settings GET] Creating default store for user");
      
      // Generate a unique slug
      const slug = `store-${Date.now()}`;
      
      const newStore = await prisma.store.create({
        data: {
          name: "My Store",
          slug,
          description: "",
          currency: "USD",
          userId: user.id,
          configuration: {
            create: {
              whatsAppChat: false,
              reviews: false,
              darkMode: false,
              pushNotifications: true,
              soundAlerts: true,
              emailAlerts: true,
            }
          },
          themeSettings: {
            create: {
              primaryColor: "#3b82f6",
              secondaryColor: "#64748b",
              accentColor: "#f59e0b",
              backgroundColor: "#ffffff",
              foregroundColor: "#0f172a",
              fontFamily: "Inter",
              borderRadius: "0.5rem",
            }
          }
        },
        include: { themeSettings: true, configuration: true },
      });
      
      console.log("[store-settings GET] Created new store:", newStore.id);
      return NextResponse.json({ success: true, store: newStore });
    }

    const store = await prisma.store.findUnique({
      where: { id: user.stores[0].id },
      include: { themeSettings: true, configuration: true },
    });

    console.log("[store-settings GET] store found:", store?.id, "name:", store?.name);
    console.log("[store-settings GET] configuration:", store?.configuration);

    return NextResponse.json({ success: true, store });
  } catch (error) {
    console.error("[store-settings GET] Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    console.log("[store-settings PUT] userId:", userId);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { section, data } = await req.json();
    console.log("[store-settings PUT] section:", section, "data:", JSON.stringify(data));

    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { stores: { take: 1 } },
    });

    // If user doesn't exist in database, we can't save settings
    if (!user) {
      console.log("[store-settings PUT] User not found, cannot save");
      return NextResponse.json({ error: "User not found in database. Please sign out and sign in again." }, { status: 404 });
    }

    // If user doesn't have a store, create one first
    if (!user.stores[0]) {
      console.log("[store-settings PUT] Creating default store for user");
      const slug = `store-${Date.now()}`;
      
      await prisma.store.create({
        data: {
          name: "My Store",
          slug,
          description: "",
          currency: "USD",
          userId: user.id,
          configuration: {
            create: {
              whatsAppChat: false,
              reviews: false,
              darkMode: false,
              pushNotifications: true,
              soundAlerts: true,
              emailAlerts: true,
            }
          },
          themeSettings: {
            create: {
              primaryColor: "#3b82f6",
              secondaryColor: "#64748b",
              accentColor: "#f59e0b",
              backgroundColor: "#ffffff",
              foregroundColor: "#0f172a",
              fontFamily: "Inter",
              borderRadius: "0.5rem",
            }
          }
        },
      });
      
      // Re-fetch user with store
      user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: { stores: { take: 1 } },
      });
    }

    const storeId = user!.stores[0].id;
    console.log("[store-settings PUT] storeId:", storeId);

    if (section === "general") {
      const updated = await prisma.store.update({
        where: { id: storeId },
        data: {
          name: data.storeName,
          slug: data.storeSlug,
          description: data.description,
          currency: data.currency,
          logoUrl: data.logoUrl,
          faviconUrl: data.faviconUrl,
        },
      });
      console.log("[store-settings PUT] general updated:", updated.id);
      return NextResponse.json({ success: true, data: updated });
    }

    if (section === "theme") {
      const updated = await prisma.themeSettings.upsert({
        where: { storeId },
        update: {
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          accentColor: data.accentColor,
          backgroundColor: data.backgroundColor,
          foregroundColor: data.foregroundColor,
          fontFamily: data.fontFamily,
          borderRadius: data.borderRadius,
        },
        create: {
          storeId,
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          accentColor: data.accentColor,
          backgroundColor: data.backgroundColor,
          foregroundColor: data.foregroundColor,
          fontFamily: data.fontFamily,
          borderRadius: data.borderRadius,
        },
      });
      console.log("[store-settings PUT] theme updated:", updated.id);
      return NextResponse.json({ success: true, data: updated });
    }

    if (section === "features") {
      const updated = await prisma.storeConfiguration.upsert({
        where: { storeId },
        update: {
          whatsAppChat: data.enableWhatsApp,
          whatsAppNumber: data.whatsAppNumber,
          reviews: data.enableReviews,
          darkMode: data.enableDarkMode,
          pushNotifications: data.enablePush,
          soundAlerts: data.enableSound,
          emailAlerts: data.enableEmail,
        },
        create: {
          storeId,
          whatsAppChat: data.enableWhatsApp,
          whatsAppNumber: data.whatsAppNumber,
          reviews: data.enableReviews,
          darkMode: data.enableDarkMode,
          pushNotifications: data.enablePush,
          soundAlerts: data.enableSound,
          emailAlerts: data.enableEmail,
        },
      });
      console.log("[store-settings PUT] features updated:", updated.id);
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  } catch (error) {
    console.error("[store-settings PUT] Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
