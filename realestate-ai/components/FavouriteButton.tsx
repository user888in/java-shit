"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FavouriteButton({
  listingId,
  initialSaved = false,
}: {
  listingId: string;
  initialSaved: boolean;
}) {
    const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  async function toggle(e: React.MouseEvent){
    e.preventDefault();
    e.stopPropagation()
    setLoading(true);
    const res = await fetch('/api/favourites',{
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({listing_id: listingId})
    })
    if(res.status == 400){
        router.push("/login")
        return;
    }
    const data = await res.json()
    setSaved(data.saved);
    setLoading(false);
  }
  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`p-2 rounded-full border transition-all ${
        saved
          ? 'bg-gray-900 border-gray-900 text-white'
          : 'bg-white border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-700'
      }`}
    >
      <Heart className={`w-3.5 h-3.5 ${saved ? 'fill-white' : ''}`} />
    </button>
  )
}
