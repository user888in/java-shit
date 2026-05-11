"use client";

import Link from "next/link";
import {
  MapPin,
  Bed,
  Bath,
  Maximize2,
  ArrowRight,
  Building2,
  Home,
  Trees,
  Warehouse,
} from "lucide-react";
import FavouriteButton from "./FavouriteButton";

type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  image_url: string;
  amenities: string[];
};

const TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
  Apartment: { icon: Building2, color: "text-blue-600 bg-blue-50" },
  Villa: { icon: Warehouse, color: "text-purple-600 bg-purple-50" },
  House: { icon: Home, color: "text-orange-600 bg-orange-50" },
  Plot: { icon: Trees, color: "text-green-600 bg-green-50" },
};

export default function ListingCard({
  listing,
  savedIds = [],
}: {
  listing: Listing;
  savedIds?: string[];
}) {
  const config = TYPE_CONFIG[listing.property_type] || {
    icon: Home,
    color: "text-gray-600 bg-gray-50",
  };
  const PropertyIcon = config.icon;
  const isSaved = savedIds.includes(listing.id);

  const formatPrice = (price: number) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    return `₹${(price / 100000).toFixed(1)} L`;
  };

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-black/10 hover:shadow-lg transition-all duration-300"
    >
      {/* Top Visual Section */}
      <div className="relative w-full bg-gray-100 h-44 flex items-center justify-center overflow-hidden">
        {listing.image_url ? (
          <img
            src={listing.image_url}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
            <PropertyIcon size={40} strokeWidth={1.5} />
          </span>
        )}

        <div className="absolute top-3 left-3 flex gap-2">
          <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-gray-800 border border-gray-100 shadow-sm">
            {listing.property_type}
          </span>
        </div>

        <div className="absolute top-3 right-3">
          <FavouriteButton listingId={listing.id} initialSaved={isSaved} />
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Location */}
        <div className="flex items-center gap-1.5 text-gray-400 mb-2">
          <MapPin size={14} strokeWidth={2} />
          <span className="text-xs font-medium truncate">
            {listing.location}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-4 group-hover:text-black transition-colors">
          {listing.title}
        </h3>

        {/* Property Stats */}
        <div className="flex items-center gap-4 text-gray-500 mb-5">
          {listing.bedrooms && (
            <div className="flex items-center gap-1.5">
              <Bed size={16} strokeWidth={1.5} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-600">
                {listing.bedrooms} BHK
              </span>
            </div>
          )}
          {listing.bathrooms && (
            <div className="flex items-center gap-1.5">
              <Bath size={16} strokeWidth={1.5} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-600">
                {listing.bathrooms}
              </span>
            </div>
          )}
          {listing.area_sqft && (
            <div className="flex items-center gap-1.5">
              <Maximize2
                size={16}
                strokeWidth={1.5}
                className="text-gray-400"
              />
              <span className="text-xs font-semibold text-gray-600">
                {listing.area_sqft} ft²
              </span>
            </div>
          )}
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <div>
            <p className="text-[10px] uppercase tracking-tight font-bold text-gray-400 mb-0.5">
              Starting Price
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-gray-900 tracking-tight">
                {formatPrice(listing.price)}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">
                onwards
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-gray-900 group-hover:bg-black group-hover:text-white transition-all duration-300">
            <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </Link>
  );
}
