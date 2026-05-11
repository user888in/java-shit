import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    listing_id,
    listing_owner_id,
    sender_name,
    sender_email,
    sender_phone,
    message,
  } = body;

  if (!listing_id || !sender_name || !sender_email || !message) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }
  const { error } = await supabase.from("enquiries").insert({
    listing_id,
    listing_owner_id,
    sender_name,
    sender_email,
    sender_phone,
    message,
  });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
