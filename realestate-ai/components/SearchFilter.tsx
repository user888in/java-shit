'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'

const LOCATIONS = ['Delhi', 'Mumbai', 'Bangalore', 'Lucknow', 'Hyderabad', 'Pune']
const TYPES = ['Apartment', 'Villa', 'House', 'Plot']
const PRICE_RANGES = [
  { label: 'Any Price', min: '', max: '' },
  { label: 'Under ₹30L', min: '', max: '3000000' },
  { label: '₹30L – ₹60L', min: '3000000', max: '6000000' },
  { label: '₹60L – ₹1Cr', min: '6000000', max: '10000000' },
  { label: 'Above ₹1Cr', min: '10000000', max: '' },
]

export default function SearchFilters({ total }: { total: number }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [showFilters, setShowFilters] = useState(false)

  const activeType = searchParams.get('type') ?? ''
  const activeLocation = searchParams.get('location') ?? ''
  const activeMin = searchParams.get('min') ?? ''
  const activeMax = searchParams.get('max') ?? ''

  const activePriceLabel = PRICE_RANGES.find(
    r => r.min === activeMin && r.max === activeMax
  )?.label ?? 'Any Price'

  const hasActiveFilters = activeType || activeLocation || activeMin || activeMax

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    router.push(`/?${params.toString()}`)
  }, [searchParams, router])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateParams({ search })
  }

  function clearAll() {
    setSearch('')
    router.push('/')
  }

  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-6 py-3">
        {/* Search Row */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by keyword, location, or type..."
              className="bg-transparent w-full text-sm text-gray-900 placeholder-gray-400 outline-none"
            />
            {search && (
              <button type="button" onClick={() => { setSearch(''); updateParams({ search: '' }) }}>
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-700" />
              </button>
            )}
          </form>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              hasActiveFilters
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-white text-gray-900 text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {[activeType, activeLocation, activeMin || activeMax].filter(Boolean).length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors whitespace-nowrap"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Filter Row */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-100">
            {/* Property Type */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">Type</span>
              <div className="flex gap-1.5">
                {TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => updateParams({ type: activeType === type ? '' : type })}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
                      activeType === type
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-px h-5 bg-gray-200" />

            {/* Location */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">City</span>
              <div className="flex gap-1.5 flex-wrap">
                {LOCATIONS.map(loc => (
                  <button
                    key={loc}
                    onClick={() => updateParams({ location: activeLocation === loc ? '' : loc })}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
                      activeLocation === loc
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-px h-5 bg-gray-200" />

            {/* Price Range */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">Price</span>
              <select
                value={activePriceLabel}
                onChange={e => {
                  const range = PRICE_RANGES.find(r => r.label === e.target.value)!
                  updateParams({ min: range.min, max: range.max })
                }}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 bg-white outline-none cursor-pointer hover:border-gray-400 transition-colors"
              >
                {PRICE_RANGES.map(r => (
                  <option key={r.label}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mt-2">
          <p className="text-xs text-gray-400">
            {total} {total === 1 ? 'property' : 'properties'} found
            {searchParams.get('search') && (
              <span> for <strong className="text-gray-700">"{searchParams.get('search')}"</strong></span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
