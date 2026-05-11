import { createServerSupabaseClient } from "@/lib/supabase-server";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const formData = await req.formData();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const price = formData.get("price") as string;
  const location = formData.get("location") as string;
  const property_type = formData.get("property_type") as string;
  const bedrooms = formData.get("bedrooms") as string;
  const bathrooms = formData.get("bathrooms") as string;
  const area_sqft = formData.get("area_sqft") as string;
  const amenities = JSON.parse(formData.get("amenities") as string);
  const imageFile = formData.get("image") as File | null;

  const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
    Delhi: { lat: 28.6139, lng: 77.209 },
    Mumbai: { lat: 19.076, lng: 72.8777 },
    Bangalore: { lat: 12.9716, lng: 77.5946 },
    Lucknow: { lat: 26.8467, lng: 80.9462 },
    Hyderabad: { lat: 17.385, lng: 78.4867 },
    Pune: { lat: 18.5204, lng: 73.8567 },
    Chennai: { lat: 13.0827, lng: 80.2707 },
    Kolkata: { lat: 22.5726, lng: 88.3639 },
  };
  let image_url = null;

  // Upload image if provided
  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${ext}`;
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("listing-images")
      .upload(fileName, buffer, { contentType: imageFile.type });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("listing-images")
        .getPublicUrl(fileName);
      image_url = urlData.publicUrl;
    }
  }

  // Insert listing
  const coords = CITY_COORDINATES[location] ?? { lat: null, lng: null };

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      title,
      description,
      price: Number(price),
      location,
      property_type,
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      area_sqft: Number(area_sqft),
      amenities,
      image_url,
      user_id: user.id,
      lat: coords.lat,
      lng: coords.lng,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Generate + store embedding
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
    .eq("id", listing.id);

  return NextResponse.json({ id: listing.id });
}
