'use client'
import { useEffect } from "react";

export default function ViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    const key = `viewed_${listingId}`;
    if (localStorage.getItem(key)) return;
    fetch(`/api/listings/${listingId}/view`, { method: "POST" }).then(() =>
      localStorage.setItem(key, "1"),
    );
  }, [listingId]);
  return null;
}
