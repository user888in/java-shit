'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MapPin, Bed, Maximize2 } from 'lucide-react'

type Listing = {
  id: string
  title: string
  price: number
  location: string
  property_type: string
  bedrooms: number
  area_sqft: number
  image_url: string | null
}

const TYPE_EMOJI: Record<string, string> = {
  Apartment: '🏢', Villa: '🏡', House: '🏠', Plot: '🌿',
}

export default function SimilarListingsSidebar({ listingId }: { listingId: string }) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/similar-listings?id=${listingId}`)
      .then(res => res.json())
      .then(data => {
        setListings(data.listings ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [listingId])

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (!listings.length) {
    return <p className="text-xs text-gray-400 text-center py-4">No similar properties found</p>
  }

  return (
    <div className="space-y-3">
      {listings.map(listing => (
        <Link
          key={listing.id}
          href={`/listings/${listing.id}`}
          className="flex gap-3 bg-white rounded-2xl p-3 hover:shadow-md transition-all duration-200 group"
        >
          {/* Thumbnail */}
          <div className="w-20 h-20 rounded-xl bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
            {listing.image_url ? (
              <img
                src={listing.image_url}
                alt={listing.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <span className="text-2xl">{TYPE_EMOJI[listing.property_type] ?? '🏠'}</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
              {listing.title}
            </p>
            <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
              <MapPin className="w-3 h-3 shrink-0" />
              {listing.location}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-bold text-gray-900">
                ₹{(listing.price / 100000).toFixed(1)}L
              </span>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                {listing.bedrooms && (
                  <span className="flex items-center gap-0.5">
                    <Bed className="w-3 h-3" /> {listing.bedrooms}
                  </span>
                )}
                {listing.area_sqft && (
                  <span className="flex items-center gap-0.5">
                    <Maximize2 className="w-3 h-3" /> {listing.area_sqft}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
