"use client";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import Link from "next/link";

type Listing = {
  id: string;
  title: string;
  price: number;
  location: string;
  property_type: string;
  bedrooms: number;
  lat: number;
  lng: number;
};

function jitterCoords(listings: Listing[]) {
  const seen: Record<string, number> = {};

  return listings.map((listing) => {
    const key = `${listing.lat},${listing.lng}`;
    seen[key] = (seen[key] ?? 0) + 1;
    const count = seen[key];

    if (count === 1) return listing;

    // Spread duplicates in a small circle around the original point
    const angle = (count - 1) * 137.5 * (Math.PI / 180); // golden angle spread
    const radius = 0.008 * Math.ceil((count - 1) / 8);

    return {
      ...listing,
      lat: listing.lat + radius * Math.cos(angle),
      lng: listing.lng + radius * Math.sin(angle),
    };
  });
}

function formatPrice(price: number) {
  return `₹${(price / 100000).toFixed(1)}L`;
}

export default function MapView({ listings }: { listings: Listing[] }) {
  const [MapComponents, setMapComponents] = useState<any>(null);
  const [selected, setSelected] = useState<Listing | null>(null);
  useEffect(() => {
    // leaflet client dynamic import
    Promise.all([import("leaflet"), import("react-leaflet")]).then(
      ([L, RL]) => {
        // Fix default marker icons
        const icon = L.default.icon({
          iconUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        });
        setMapComponents({ ...RL, icon });
      },
    );
  }, []);
  if (!MapComponents) {
    return (
      <div className="w-full h-[600px] bg-gray-100 rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-gray-400">Loading map...</p>
        </div>
      </div>
    );
  }
  const { MapContainer, TileLayer, Marker, Popup, useMap } = MapComponents;
  const validListings = jitterCoords(listings.filter((l) => l.lat && l.lng));
  const center =
    validListings.length > 0
      ? [validListings[0].lat, validListings[0].lng]
      : [20.5937, 78.9629]; // India center
  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-gray-200">
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />

      <MapContainer
        center={center}
        zoom={5}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validListings.map((listing) => (
          <Marker
            key={listing.id}
            position={[listing.lat, listing.lng]}
            icon={MapComponents.icon}
            eventHandlers={{
              click: () => setSelected(listing),
            }}
          />
        ))}
      </MapContainer>

      {/* Selected listing popup */}
      {selected && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-80">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-4">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-lg leading-none"
            >
              ✕
            </button>
            <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
              {selected.property_type}
            </span>
            <h3 className="font-semibold text-gray-900 text-sm mt-2 pr-4 leading-snug">
              {selected.title}
            </h3>
            <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
              <MapPin className="w-3 h-3" />
              {selected.location}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(selected.price)}
              </span>
              <Link
                href={`/listings/${selected.id}`}
                className="bg-gray-900 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                View listing →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
