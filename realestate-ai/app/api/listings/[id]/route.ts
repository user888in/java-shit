import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("listings")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data: listing, error } = await supabase
    .from("listings")
    .update({
      title: body.title,
      description: body.description,
      price: Number(body.price),
      location: body.location,
      property_type: body.property_type,
      bedrooms: Number(body.bedrooms),
      bathrooms: Number(body.bathrooms),
      area_sqft: Number(body.area_sqft),
      amenities: body.amenities,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  const text = `
    ${listing.title}. ${listing.description}.
    Property type: ${listing.property_type}.
    Location: ${listing.location}.
    Price: ${listing.price} rupees.
    Bedrooms: ${listing.bedrooms}. Bathrooms: ${listing.bathrooms}.
    Area: ${listing.area_sqft} sqft.
    Amenities: ${listing.amenities?.join(", ")}.
  `.trim();
  const embeddingRes = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  await supabase
    .from("listings")
    .update({ embedding: JSON.stringify(embeddingRes.data[0].embedding) })
    .eq("id", id);
  return NextResponse.json({ success: true });
}
