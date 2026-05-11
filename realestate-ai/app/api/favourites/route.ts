import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// GET — fetch all saved listing IDs for current user
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ids: [] });
  const { data } = await supabase
    .from("favourites")
    .select("listing_id")
    .eq("user_id", user.id);
  return NextResponse.json({ ids: data?.map((f) => f.listing_id ?? []) });
}

// POST — toggle favourite (add if not saved, remove if saved)
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { listing_id } = await req.json();
  const { data: existting } = await supabase
    .from("favourites")
    .select("id")
    .eq("user_id", user.id)
    .eq("listing_id", listing_id)
    .single();
  if (existting) {
    await supabase
      .from("favourites")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listing_id);
    return NextResponse.json({ saved: false });
  } else {
    await supabase.from("favourites").insert({ user_id: user.id, listing_id });
    return NextResponse.json({ saved: true });
  }
}
