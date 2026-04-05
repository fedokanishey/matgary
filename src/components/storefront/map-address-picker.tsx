"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from "lucide-react";

// Fix for default Leaflet marker icons in Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapAddressPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  defaultLocation?: { lat: number; lng: number };
}

interface LocationMarkerProps {
  position: L.LatLng | null;
  setPosition: (pos: L.LatLng) => void;
  onLocationSelect: (lat: number, lng: number) => void;
}

function LocationMarker({ position, setPosition, onLocationSelect }: LocationMarkerProps) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : <Marker position={position} icon={icon} />;
}

export function MapAddressPicker({ onLocationSelect, defaultLocation }: MapAddressPickerProps) {
  const defaultCenter = defaultLocation || { lat: 30.0444, lng: 31.2357 }; // Default: Cairo
  const [position, setPosition] = useState<L.LatLng | null>(
    defaultLocation ? L.latLng(defaultLocation.lat, defaultLocation.lng) : null
  );

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (loc) => {
          const latlng = L.latLng(loc.coords.latitude, loc.coords.longitude);
          setPosition(latlng);
          onLocationSelect(latlng.lat, latlng.lng);
        },
        (err) => {
          console.error("Error getting location: ", err);
          alert("تعذر الوصول إلى موقعك. يرجى تفعيل الموقع (GPS) والمحاولة مرة أخرى.");
        }
      );
    } else {
      alert("متصفحك لا يدعم تحديد الموقع الجغرافي.");
    }
  };

  // Prevent SSR issues with Leaflet
  if (!isClient) return <div className="h-[300px] w-full bg-slate-100 animate-pulse rounded-md" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">انقر على الخريطة لتحديد العنوان بدقة، أو استخدم موقعك الحالي.</p>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={handleCurrentLocation}
          className="gap-2"
        >
          <Navigation className="h-4 w-4" />
          موقعي الحالي
        </Button>
      </div>
      
      <div className="h-[300px] sm:h-[400px] w-full rounded-md overflow-hidden border border-gray-200">
        <MapContainer 
          center={position || defaultCenter} 
          zoom={13} 
          scrollWheelZoom={true} 
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} onLocationSelect={onLocationSelect} />
        </MapContainer>
      </div>
    </div>
  );
}
