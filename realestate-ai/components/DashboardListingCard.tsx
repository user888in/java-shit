"use client";

import {
  Building2,
  Loader2,
  LucideHome,
  MapPin,
  Pencil,
  Trash2,
  TreePine,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Listing = {
  id: string;
  title: string;
  price: number;
  location: string;
  property_type: string;
  bedrooms: number;
  area_sqft: number;
  views: number;
  image_url: string | null;
  created_at: string;
};
const TYPE_ICON: Record<string, React.ElementType> = {
  Apartment: Building2,
  Villa: LucideHome,
  House: LucideHome,
  Plot: TreePine,
};

const DashboardListingCard = ({ listing }: { listing: Listing }) => {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/listings/${listing.id}`, { method: "DELETE" });
    router.refresh();
  }
  const icon = TYPE_ICON[listing.property_type] ?? "🏠";
  const date = new Date(listing.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col sm:flex-row">
      <div className="bg-gray-100 sm:w-44 h-36 sm:h-auto flex items-center justify-center shrink-0">
        {listing.image_url ? (
          <img
            src={listing.image_url}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl">
            <LucideHome />
          </span>
        )}
      </div>
      {/* content  */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {listing.property_type}
              </span>
              <h3 className="font-semibold text-gray-900 mt-1.5 text-sm leading-snug">
                {listing.title}
              </h3>
              <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                <MapPin className="w-3 h-3" /> {listing.location}
              </div>
            </div>
            <p className="text-lg font-bold text-gray-900 shrink-0">
              ₹{(listing.price / 100000).toFixed(1)}L
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              {listing.views ?? 0} views
            </span>
            <span className="text-gray-300">·</span>
            <span>{date}</span>
          </div>
          {/* actions  */}
          <div className="flex items-center gap-2">
            <Link href={`/listings/${listing.id}/edit`} className="flex items-center gap-1">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Link>
            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-red-500 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Sure?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1 text-xs font-medium bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60"
                >
                  {deleting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    "Yes, delete"
                  )}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardListingCard;
