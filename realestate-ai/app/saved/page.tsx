import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import ListingCard from "@/components/ListingCard";
import { Heart } from "lucide-react";
import Link from "next/link";

export default async function SavedPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: favourites } = await supabase
    .from("favourites")
    .select("listing_id, listings(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const listings = favourites?.map((f) => f.listings).filter(Boolean) ?? []
  const savedIds = listings.map((l: any) => l.id)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Saved Properties</h1>
            <p className="text-sm text-gray-500">{listings.length} saved</p>
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-10 h-10 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No saved properties yet
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Hit the heart on any listing to save it here
            </p>
            <Link
              href="/"
              className="bg-gray-900 text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Browse properties
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {listings.map((listing: any) => (
              <ListingCard key={listing.id} listing={listing} savedIds={savedIds} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
