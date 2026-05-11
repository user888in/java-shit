'use client'

import { useState } from 'react'
import { LayoutGrid, Map } from 'lucide-react'
import ListingCard from './ListingCard'
import dynamic from 'next/dynamic'

const MapView = dynamic(() => import('./MapView'), { ssr: false })

type Listing = {
  id: string
  title: string
  description: string
  price: number
  location: string
  property_type: string
  bedrooms: number
  bathrooms: number
  area_sqft: number
  amenities: string[]
  lat: number
  lng: number
}

export default function HomeClient({
  listings,
  savedIds,
  hasFilters,
}: {
  listings: Listing[]
  savedIds: string[]
  hasFilters: boolean
}) {
  const [view, setView] = useState<'grid' | 'map'>('grid')

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {listings.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🔍</p>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties found</h3>
          <p className="text-gray-500 text-sm">Try adjusting your filters or search term</p>
        </div>
      ) : (
        <>
          {/* Header + Toggle */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {hasFilters ? 'Search Results' : 'All Properties'}
            </h2>

            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setView('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  view === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Grid
              </button>
              <button
                onClick={() => setView('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  view === 'map'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Map className="w-4 h-4" />
                Map
              </button>
            </div>
          </div>

          {/* Grid View */}
          {view === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} savedIds={savedIds} />
              ))}
            </div>
          )}

          {/* Map View */}
          {view === 'map' && <MapView listings={listings} />}
        </>
      )}
    </div>
  )
}
