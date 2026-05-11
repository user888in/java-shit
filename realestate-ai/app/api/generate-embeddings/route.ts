import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  // 1. Fetch all listings without embeddings
  const { data: listings, error } = await supabase
    .from("listings")
    .select("*")
    .is("embedding", null);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  if (!listings?.length)
    return NextResponse.json({
      message: "All listings already have embeddings",
    });
  const results = [];

  for (const listing of listings) {
    // 2. Build a text description of the listing
    const text = `
    ${listing.title}.
    ${listing.description}.
    Property type : ${listing.property_type}.
    Location : ${listing.location}.
    Price : ${listing.price} rupees.
    Bedrooms : ${listing.bedrooms}.
    Bathrooms : ${listing.bathrooms}.
    Area : ${listing.area_sqft} sqft.
    Amenities : ${listing.amenities?.join(", ")}.
    `.trim();
    // 3. Generate embedding from OpenAI
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    const embedding = embeddingResponse.data[0].embedding;
    // 4. Store embedding back in Supabase
    const { error: updateError } = await supabase
      .from("listings")
      .update({ embedding: JSON.stringify(embedding) })
      .eq("id", listing.id);
    if (updateError) {
      results.push({
        id: listing.id,
        status: "error",
        error: updateError.message,
      });
    } else {
      results.push({ id: listing.id, status: "success", title: listing.title });
    }
  }
  return NextResponse.json({ processed: results.length, results });
}
