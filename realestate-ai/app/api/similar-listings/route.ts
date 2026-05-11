import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // 1. Fetch stored embedding directly — no OpenAI call needed
  const { data: listing, error } = await supabase
    .from('listings')
    .select('embedding')
    .eq('id', id)
    .single()

  if (error || !listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!listing.embedding) {
    return NextResponse.json({ listings: [] })
  }

  // 2. Use stored embedding to find similar listings
  const { data: similarListings, error: matchError } = await supabase.rpc('match_listings', {
    query_embedding: listing.embedding,
    match_count: 4,
    exclude_id: id,
  })

  if (matchError) return NextResponse.json({ error: matchError.message }, { status: 500 })

  return NextResponse.json({ listings: similarListings })
}
