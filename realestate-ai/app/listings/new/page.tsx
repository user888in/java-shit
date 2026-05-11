import NewListingForm from '@/components/NewListingForm'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function NewListingPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">List a Property</h1>
          <p className="text-gray-500 text-sm mt-1">
            Fill in the details — AI will automatically make it searchable
          </p>
        </div>
        <NewListingForm />
      </div>
    </main>
  )
}
