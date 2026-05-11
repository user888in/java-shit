'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle } from 'lucide-react'

const PROPERTY_TYPES = ['Apartment', 'Villa', 'House', 'Plot']
const LOCATIONS = ['Delhi', 'Mumbai', 'Bangalore', 'Lucknow', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata']
const AMENITIES_LIST = ['gym', 'pool', 'parking', 'security', 'lift', 'garden', 'clubhouse', 'wifi', 'furnished', 'terrace', 'water', 'park']

export default function EditListingForm({ listing }: { listing: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(listing.amenities ?? [])

  const [form, setForm] = useState({
    title: listing.title,
    description: listing.description,
    price: String(listing.price),
    location: listing.location,
    property_type: listing.property_type,
    bedrooms: String(listing.bedrooms),
    bathrooms: String(listing.bathrooms),
    area_sqft: String(listing.area_sqft),
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleAmenity(amenity: string) {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch(`/api/listings/${listing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amenities: selectedAmenities }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-100 transition-all"
  const labelClass = "text-sm font-medium text-gray-700 block mb-1.5"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className={labelClass}>Title</label>
          <input type="text" value={form.title} onChange={e => update('title', e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea value={form.description} onChange={e => update('description', e.target.value)} required rows={4} className={`${inputClass} resize-none`} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Property Type</label>
            <select value={form.property_type} onChange={e => update('property_type', e.target.value)} className={inputClass}>
              {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>City</label>
            <select value={form.location} onChange={e => update('location', e.target.value)} className={inputClass}>
              {LOCATIONS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Price (₹)</label>
            <input type="number" value={form.price} onChange={e => update('price', e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Bedrooms</label>
            <input type="number" value={form.bedrooms} onChange={e => update('bedrooms', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Bathrooms</label>
            <input type="number" value={form.bathrooms} onChange={e => update('bathrooms', e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Area (sqft)</label>
          <input type="number" value={form.area_sqft} onChange={e => update('area_sqft', e.target.value)} className={inputClass} />
        </div>
      </div>

      {/* Amenities */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 text-sm mb-4">Amenities</h2>
        <div className="flex flex-wrap gap-2">
          {AMENITIES_LIST.map(amenity => {
            const active = selectedAmenities.includes(amenity)
            return (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                  active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {active && <CheckCircle className="w-3 h-3" />}
                {amenity}
              </button>
            )
          })}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
