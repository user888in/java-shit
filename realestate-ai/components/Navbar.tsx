import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import NavbarClient from './NavbarClient'

export default async function Navbar() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black/80 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">RE</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">
            RealEstate<span className="text-black/80">AI</span>
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Browse
          </Link>
          {user && (
            <>
              <Link href="/saved" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Saved
              </Link>
              <Link href="/listings/new" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                List Property
              </Link>
            </>
          )}
        </div>

        {/* Auth — client component handles signout */}
        <NavbarClient user={user} />
      </div>
    </nav>
  )
}
