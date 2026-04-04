import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { stores: { take: 1 } },
    });

    if (!user?.stores[0]) return NextResponse.json({ error: "No store" }, { status: 404 });

    const store = await prisma.store.findUnique({
      where: { id: user.stores[0].id },
      include: { themeSettings: true, configuration: true },
    });

    return NextResponse.json({ success: true, store });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { section, data } = await req.json();

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { stores: { take: 1 } },
    });

    if (!user?.stores[0]) return NextResponse.json({ error: "No store" }, { status: 404 });

    const storeId = user.stores[0].id;

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
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
