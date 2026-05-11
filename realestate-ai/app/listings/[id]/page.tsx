import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { MapPin, Bed, Bath, Maximize2, Eye, Share2, Sparkles } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import ViewTracker from '@/components/ViewTracker'
import FavouriteButton from '@/components/FavouriteButton'
import EnquiryForm from '@/components/EnquiryForm'
import Link from 'next/link'
import SimilarListingsSidebar from '@/components/SimilarListingsSidebar'

type Props = { params: Promise<{ id: string }> }

export default async function ListingPage({ params }: Props) {
  const { id } = await params

  const { data: listing, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !listing) return notFound()

  const serverSupabase = await createServerSupabaseClient()
  const { data: { user } } = await serverSupabase.auth.getUser()

  let isSaved = false
  if (user) {
    const { data: fav } = await serverSupabase
      .from('favourites')
      .select('id')
      .eq('user_id', user.id)
      .eq('listing_id', id)
      .single()
    isSaved = !!fav
  }

  const isOwner = user?.id === listing.user_id

  return (
    <main className="min-h-screen bg-gray-50">
      <ViewTracker listingId={id} />

      {/* Full width image hero */}
      <div className="w-full bg-gray-100 h-[420px] relative overflow-hidden">
        {listing.image_url ? (
          <img
            src={listing.image_url}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <span className="text-9xl opacity-40">🏠</span>
          </div>
        )}

        {/* Overlay actions */}
        <div className="absolute top-4 left-4">
          <Link
            href="/"
            className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-medium px-4 py-2 rounded-full hover:bg-white transition-colors"
          >
            ← Back
          </Link>
        </div>
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <FavouriteButton listingId={id} initialSaved={isSaved} />
        </div>

        {/* Price pill on image */}
        <div className="absolute bottom-4 left-4">
          <div className="bg-black text-white px-5 py-2.5 rounded-2xl">
            <span className="text-xl font-bold">₹{(listing.price / 100000).toFixed(1)}L</span>
            <span className="text-gray-400 text-xs ml-1.5">onwards</span>
          </div>
        </div>
      </div>

      {/* Two column layout */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Title block */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold bg-gray-900 text-white px-3 py-1 rounded-full">
                  {listing.property_type}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Eye className="w-3.5 h-3.5" />
                  {listing.views ?? 0} views
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                {listing.title}
              </h1>
              <div className="flex items-center gap-1.5 text-gray-400 mt-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{listing.location}</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex gap-8 py-6 border-y border-gray-100">
              {listing.bedrooms && (
                <div>
                  <p className="text-2xl font-bold text-gray-900">{listing.bedrooms}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Bed className="w-3 h-3" /> Bedrooms
                  </p>
                </div>
              )}
              {listing.bathrooms && (
                <div>
                  <p className="text-2xl font-bold text-gray-900">{listing.bathrooms}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Bath className="w-3 h-3" /> Bathrooms
                  </p>
                </div>
              )}
              {listing.area_sqft && (
                <div>
                  <p className="text-2xl font-bold text-gray-900">{listing.area_sqft}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Maximize2 className="w-3 h-3" /> Sq. ft
                  </p>
                </div>
              )}
              {listing.price && listing.area_sqft && (
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{Math.round(listing.price / listing.area_sqft).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Per sq. ft</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h2 className="font-semibold text-gray-900 mb-3">About this property</h2>
              <p className="text-gray-500 text-sm leading-relaxed">{listing.description}</p>
            </div>

            {/* Amenities */}
            {listing.amenities?.length > 0 && (
              <div>
                <h2 className="font-semibold text-gray-900 mb-3">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.amenities.map((amenity: string) => (
                    <span
                      key={amenity}
                      className="text-xs bg-white shadow-sm text-gray-600 px-4 py-2 rounded-full capitalize font-medium"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Enquiry form — mobile only (shows below content on small screens) */}
            {!isOwner && (
              <div className="lg:hidden">
                <EnquiryForm
                  listingId={listing.id}
                  listingOwnerId={listing.user_id}
                  listingTitle={listing.title}
                  defaultEmail={user?.email ?? ''}
                  defaultName={user?.user_metadata?.full_name ?? ''}
                />
              </div>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ── sticky */}
          <div className="hidden lg:block w-[340px] shrink-0">
            <div className="sticky top-24 space-y-4">

              {/* Enquiry form */}
              {!isOwner && (
                <EnquiryForm
                  listingId={listing.id}
                  listingOwnerId={listing.user_id}
                  listingTitle={listing.title}
                  defaultEmail={user?.email ?? ''}
                  defaultName={user?.user_metadata?.full_name ?? ''}
                />
              )}

              {/* Similar listings */}
              <div>
                <h3 className="font-semibold text-gray-900 text-sm mb-3 px-1 flex gap-1">
                  <Sparkles size={18}/> Similar Properties
                </h3>
                <SimilarListingsSidebar listingId={id} />
              </div>
            </div>
          </div>

        </div>

        {/* Similar listings — mobile (below everything) */}
        <div className="lg:hidden mt-10 flex gap-1">
          <h3 className="font-semibold text-gray-900 text-sm mb-4"><Sparkles size={18}/> Similar Properties</h3>
          <SimilarListingsSidebar listingId={id} />
        </div>
      </div>
    </main>
  )
}
