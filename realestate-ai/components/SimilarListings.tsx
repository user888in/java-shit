"use client";
import React, { useEffect, useState } from "react";
import ListingCard from "./ListingCard";

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
  amenities: string[];
  similarity: number;
};

const SimilarListings = ({ listingId }: { listingId: string }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`api/similar-listings?id=${listingId}`)
      .then((res) => res.json())
      .then((data) => {
        setListings(data.listings || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [listingId]);
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 h-64 animate-pulse"
          />
        ))}
      </div>
    );
  }
  if (!listings.length) {
    return (
      <p className="text-gray-400 text-sm text-center py-8">
        No similar properties found.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
};

export default SimilarListings;
