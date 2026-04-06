import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/reverse";
const PHOTON_REVERSE_BASE_URL = "https://photon.komoot.io/reverse";
const BIGDATA_REVERSE_BASE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";
const REQUEST_TIMEOUT_MS = 8000;

function parseCoordinate(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function hasArabicText(value: string) {
  return /[\u0600-\u06FF]/.test(value);
}

function withTimeoutSignal() {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);
  return {
    signal: abortController.signal,
    cleanup: () => clearTimeout(timeoutId),
  };
}

async function getAddressFromNominatim(lat: number, lng: number, locale: string) {
  const params = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    lat: String(lat),
    lon: String(lng),
    "accept-language": locale === "ar" ? "ar,en" : "en,ar",
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://matgary.app";
  const email = process.env.NOMINATIM_CONTACT_EMAIL;
  const userAgent = email
    ? `Matgary/1.0 (${appUrl}; mailto:${email})`
    : `Matgary/1.0 (${appUrl})`;

  const { signal, cleanup } = withTimeoutSignal();

  try {
    const response = await fetch(`${NOMINATIM_BASE_URL}?${params.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": userAgent,
      },
      signal,
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { display_name?: string };
    return data.display_name || null;
  } catch {
    return null;
  } finally {
    cleanup();
  }
}

async function getAddressFromBigDataCloud(lat: number, lng: number, locale: string) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    localityLanguage: locale === "ar" ? "ar" : "en",
  });

  const { signal, cleanup } = withTimeoutSignal();

  try {
    const response = await fetch(`${BIGDATA_REVERSE_BASE_URL}?${params.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal,
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      locality?: string;
      city?: string;
      principalSubdivision?: string;
      countryName?: string;
    };

    const parts = [
      data.locality || data.city,
      data.principalSubdivision,
      data.countryName,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : null;
  } catch {
    return null;
  } finally {
    cleanup();
  }
}

async function getAddressFromPhoton(lat: number, lng: number, locale: string) {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
  });

  const { signal, cleanup } = withTimeoutSignal();

  try {
    const response = await fetch(`${PHOTON_REVERSE_BASE_URL}?${params.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Accept-Language": locale === "ar" ? "ar,en;q=0.8" : "en,ar;q=0.6",
      },
      signal,
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      features?: Array<{
        properties?: {
          name?: string;
          street?: string;
          house_number?: string;
          locality?: string;
          city?: string;
          state?: string;
          country?: string;
        };
      }>;
    };

    const props = data.features?.[0]?.properties;
    if (!props) return null;

    const streetPart =
      [props.house_number, props.street || props.name].filter(Boolean).join(" ") ||
      props.street ||
      props.name ||
      null;

    const parts = [streetPart, props.locality || props.city, props.state, props.country].filter(
      Boolean
    );

    return parts.length > 0 ? parts.join(", ") : null;
  } catch {
    return null;
  } finally {
    cleanup();
  }
}

export async function GET(req: NextRequest) {
  const lat = parseCoordinate(req.nextUrl.searchParams.get("lat"));
  const lng = parseCoordinate(req.nextUrl.searchParams.get("lng"));
  const locale = req.nextUrl.searchParams.get("locale") || "en";
  const prefersArabic = locale.toLowerCase().startsWith("ar");

  if (lat === null || lng === null || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json(
      { success: false, error: "Invalid latitude or longitude." },
      { status: 400 }
    );
  }

  if (prefersArabic) {
    const fallbacks: Array<{ address: string; provider: "nominatim" | "bigdatacloud" | "photon" }> = [];

    const addressFromNominatim = await getAddressFromNominatim(lat, lng, locale);
    if (addressFromNominatim) {
      if (hasArabicText(addressFromNominatim)) {
        return NextResponse.json({
          success: true,
          address: addressFromNominatim,
          provider: "nominatim",
        });
      }
      fallbacks.push({ address: addressFromNominatim, provider: "nominatim" });
    }

    const addressFromBigData = await getAddressFromBigDataCloud(lat, lng, locale);
    if (addressFromBigData) {
      if (hasArabicText(addressFromBigData)) {
        return NextResponse.json({
          success: true,
          address: addressFromBigData,
          provider: "bigdatacloud",
        });
      }
      fallbacks.push({ address: addressFromBigData, provider: "bigdatacloud" });
    }

    const addressFromPhoton = await getAddressFromPhoton(lat, lng, locale);
    if (addressFromPhoton) {
      if (hasArabicText(addressFromPhoton)) {
        return NextResponse.json({
          success: true,
          address: addressFromPhoton,
          provider: "photon",
        });
      }
      fallbacks.push({ address: addressFromPhoton, provider: "photon" });
    }

    if (fallbacks.length > 0) {
      return NextResponse.json({
        success: true,
        address: fallbacks[0].address,
        provider: fallbacks[0].provider,
      });
    }
  } else {
    const addressFromNominatim = await getAddressFromNominatim(lat, lng, locale);
    if (addressFromNominatim) {
      return NextResponse.json({
        success: true,
        address: addressFromNominatim,
        provider: "nominatim",
      });
    }

    const addressFromPhoton = await getAddressFromPhoton(lat, lng, locale);
    if (addressFromPhoton) {
      return NextResponse.json({
        success: true,
        address: addressFromPhoton,
        provider: "photon",
      });
    }

    const addressFromBigData = await getAddressFromBigDataCloud(lat, lng, locale);
    if (addressFromBigData) {
      return NextResponse.json({
        success: true,
        address: addressFromBigData,
        provider: "bigdatacloud",
      });
    }
  }

  return NextResponse.json(
    { success: false, error: "Geocoding service unavailable." },
    { status: 502 }
  );
}
