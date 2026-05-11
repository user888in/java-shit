import EditListingForm from "@/components/EditListingForm";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { notFound, redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> }

export default async function EditListingPage({ params }: Props) {
    const {id} = await params;
    const supabase = await createServerSupabaseClient();
    const {data: {user}} = await supabase.auth.getUser();
    if(!user) redirect('/login')

    const {data: listing} = await supabase.from('listings').select('*').eq('id',id).eq('user_id',user.id).single();
    if(!listing) return notFound();
     return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Edit Listing</h1>
          <p className="text-gray-500 text-sm mt-1">
            Changes will regenerate the AI embedding automatically
          </p>
        </div>
        <EditListingForm listing={listing} />
      </div>
    </main>
  )
}
