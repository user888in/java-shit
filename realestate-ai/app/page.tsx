import { supabase } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import ListingCard from '@/components/ListingCard'
import Hero from '@/components/Hero'
import HomeClient from '@/components/HomeClient'
import { Suspense } from 'react'
import SearchFilters from '@/components/SearchFilter'

type SearchParams = Promise<{
  search?: string
  type?: string
  location?: string
  min?: string
  max?: string
}>

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const { search, type, location, min, max } = await searchParams

  let query = supabase.from('listings').select('*')

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`
    )
  }
  if (type) query = query.eq('property_type', type)
  if (location) query = query.ilike('location', `%${location}%`)
  if (min) query = query.gte('price', Number(min))
  if (max) query = query.lte('price', Number(max))

  const { data: listings, error } = await query.order('created_at', { ascending: false })
  if (error) return <p className="p-8 text-red-500">Failed to load listings.</p>

  const serverSupabase = await createServerSupabaseClient()
  const { data: { user } } = await serverSupabase.auth.getUser()

  let savedIds: string[] = []
  if (user) {
    const { data: favs } = await serverSupabase
      .from('favourites')
      .select('listing_id')
      .eq('user_id', user.id)
    savedIds = favs?.map(f => f.listing_id) ?? []
  }

  const hasFilters = search || type || location || min || max

  return (
    <main>
      {!hasFilters && <Hero count={listings.length} />}

      <Suspense>
        <SearchFilters total={listings.length} />
      </Suspense>

      <HomeClient listings={listings} savedIds={savedIds} hasFilters={!!hasFilters} />
    </main>
  )
}
