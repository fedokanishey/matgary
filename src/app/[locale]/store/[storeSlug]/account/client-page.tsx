"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useClerk } from "@clerk/nextjs";

// Map needs to be imported dynamically because Leaflet requires window
const MapAddressPicker = dynamic(
  () =>
    import("@/components/storefront/map-address-picker").then(
      (mod) => mod.MapAddressPicker,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        Loading map...
      </div>
    ),
  },
);

interface AccountClientPageProps {
  locale: string;
  storeSlug: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  };
}

export function AccountClientPage({
  locale,
  storeSlug,
  user,
}: AccountClientPageProps) {
  const isAr = locale === "ar";
  const { signOut } = useClerk();
  const basePath = `/${locale}/store/${storeSlug}`;
  const [addressSaved, setAddressSaved] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [address, setAddress] = useState<string | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  const getAddress = async (lat: number, lng: number) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await res.json();
    return data.display_name;
  };

  const handleLocationSelect = async (lat: number, lng: number) => {
    setLocation({ lat, lng });
    setAddressSaved(false);
    setIsLoadingAddress(true);
    try {
      const addressName = await getAddress(lat, lng);
      setAddress(addressName);
    } catch (error) {
      console.error("Failed to fetch address", error);
      setAddress(null);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleSaveAddress = () => {
    if (location) {
      // Here you would save the location to the user's profile in the database
      setAddressSaved(true);
      setTimeout(() => setAddressSaved(false), 3000);
    }
  };

  return (
    <div className="container text-left mx-auto px-4 py-8 max-w-4xl min-h-[60vh]">
      <h1 className="text-3xl font-bold mb-8 text-[var(--foreground)]">
        {isAr ? "حسابي" : "My Account"}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
            <div className="w-20 h-20 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="size-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            </div>
            <h2 className="font-semibold text-lg">
              {user.firstName || user.lastName
                ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                : isAr
                  ? "العميل"
                  : "Customer"}
            </h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2">
            <button className="w-full text-start px-4 py-2 font-medium text-[var(--primary)] bg-[var(--primary)]/10 rounded-lg">
              {isAr ? "العناوين و الموقع" : "Addresses & Location"}
            </button>
            <button className="w-full text-start px-4 py-2 font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
              {isAr ? "الطلبات السابقة" : "Order History"}
            </button>
            <button className="w-full text-start px-4 py-2 font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
              {isAr ? "إعدادات الحساب" : "Account Settings"}
            </button>
            <hr className="my-2 border-gray-100" />
            <button
              onClick={() => signOut({ redirectUrl: basePath + "/auth/login" })}
              className="w-full text-start px-4 py-2 font-medium text-red-600 hover:bg-red-50 rounded-lg"
            >
              {isAr ? "تسجيل الخروج" : "Sign Out"}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <svg
                className="size-6 text-[var(--primary)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
              {isAr ? "عنوان التوصيل (الخريطة)" : "Delivery Address (Map)"}
            </h2>

            <p className="text-gray-600 mb-4 text-sm">
              {isAr
                ? "قم بتحديد موقعك بدقة على الخريطة لتسهيل عملية التوصيل."
                : "Pinpoint your exact location on the map for easier delivery."}
            </p>

            {/* Render the Leaflet map */}
            <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm mb-6 max-h-[300px] sm:max-h-[500px]">
              <MapAddressPicker onLocationSelect={handleLocationSelect} />
            </div>

            {location && (
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6 flex flex-col gap-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-full shrink-0">
                    <svg
                      className="size-5 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <circle
                        cx="15"
                        cy="10.5"
                        r="1.5"
                        className="text-blue-600"
                        fill="currentColor"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex flex-col text-left">
                    <h3 className="font-semibold text-blue-900">
                      {isAr ? "العنوان المحدد" : "Selected Address"}
                    </h3>
                    <p
                      className="text-sm text-blue-700 mt-1"
                      style={{ direction: isAr ? "rtl" : "ltr" }}
                    >
                      {isLoadingAddress 
                        ? (isAr ? "جاري جلب العنوان..." : "Fetching address...") 
                        : address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div
              className={`flex ${isAr ? "justify-start" : "justify-end"} mt-4`}
            >
              <button
                onClick={handleSaveAddress}
                disabled={!location}
                className="bg-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--primary)]/90 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-sm"
              >
                {addressSaved
                  ? isAr
                    ? "تم الحفظ بنجاح ✓"
                    : "Saved Successfully ✓"
                  : isAr
                    ? "حفظ العنوان"
                    : "Save Address"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
