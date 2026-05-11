import DashboardListingCard from "@/components/DashboardListingCard";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Eye, Heart, Home, Mail, MessageSquare, Phone, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: listings } = await supabase
    .from("listings")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { count: savedCount } = await supabase
    .from("favourites")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const totalViews = listings?.reduce((sum, l) => sum + (l.views ?? 0), 0) ?? 0;
  const totalListings = listings?.length ?? 0;

  const { data: enquiries } = await supabase
    .from("enquiries")
    .select("*, listings(title)")
    .eq("listing_owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {user.user_metadata?.full_name || user.email}
            </p>
          </div>
          <Link
            href="/listings/new"
            className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Listing
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Your Listings", value: totalListings, icon: Home },
            { label: "Total Views", value: totalViews, icon: Eye },
            { label: "Saved by Others", value: savedCount ?? 0, icon: Heart },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-gray-200 p-5"
            >
              <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                <Icon className="w-4 h-4 text-gray-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* listings  */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Your Properties
          </h2>
          {totalListings === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <Home className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">
                No listings yet
              </h3>
              <p className="text-sm text-gray-400 mb-5">
                List your first property and reach thousands of buyers
              </p>
              <Link
                href="/listings/new"
                className="bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors"
              >
                List a property
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {listings!.map((listing) => (
                <DashboardListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-10">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Recent Enquiries
            {enquiries && enquiries.length > 0 && (
              <span className="ml-2 bg-gray-900 text-white text-xs px-2 py-0.5 rounded-full">
                {enquiries.length}
              </span>
            )}
          </h2>

          {!enquiries || enquiries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
              <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No enquiries yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {enquiries.map((enquiry: any) => (
                <div key={enquiry.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{enquiry.sender_name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <a
                          href={`mailto:${enquiry.sender_email}`}
                          className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
                        >
                          <Mail className="w-3 h-3" /> {enquiry.sender_email}
                        </a>
                        {enquiry.sender_phone && (
                          <a
                            href={`tel:${enquiry.sender_phone}`}
                            className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
                          >
                            <Phone className="w-3 h-3" /> {enquiry.sender_phone}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">
                        {new Date(enquiry.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 max-w-[160px] truncate">
                        re: {enquiry.listings?.title}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed">
                    {enquiry.message}
                  </p>

                  <div className="flex gap-2 mt-3">
                    <a
                      href={`mailto:${enquiry.sender_email}?subject=Re: ${enquiry.listings?.title}`}
                      className="flex items-center gap-1.5 text-xs font-medium bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" /> Reply via Email
                    </a>
                    {enquiry.sender_phone && (
                      <a
                        href={`tel:${enquiry.sender_phone}`}
                        className="flex items-center gap-1.5 text-xs font-medium border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
