"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { LogOut } from "lucide-react";

export default function NavbarClient({ user }: { user: User | null }) {
  const router = useRouter();
  async function handleSignout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }
  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Link
        href="/dashboard"
        className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors hidden md:block"
      >
        Dashboard
      </Link>
        <button
          onClick={handleSignout}
          className="text-white bg-black/80 hover:text-black border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        className="text-sm font-medium bg-black/80 text-white px-4 py-2 rounded-lg hover:bg-black/80 transition-colors"
      >
        Sign up
      </Link>
    </div>
  );
}
