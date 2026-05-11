"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Home,
  DollarSign,
  Bed,
  Bath,
  Maximize2,
  Tag,
  Loader2,
  CheckCircle,
  Upload,
} from "lucide-react";

const PROPERTY_TYPES = ["Apartment", "Villa", "House", "Plot"];
const LOCATIONS = [
  "Delhi",
  "Mumbai",
  "Bangalore",
  "Lucknow",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Kolkata",
];
const AMENITIES_LIST = [
  "gym",
  "pool",
  "parking",
  "security",
  "lift",
  "garden",
  "clubhouse",
  "wifi",
  "furnished",
  "terrace",
  "water",
  "park",
];

export default function NewListingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null)


  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    property_type: "",
    bedrooms: "",
    bathrooms: "",
    area_sqft: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleAmenity(amenity: string) {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    Object.entries(form).forEach(([k,v])=> formData.append(k,v))
    formData.append('amenities',JSON.stringify(selectedAmenities));
    if(imageFile) formData.append('image',imageFile);

    const res = await fetch("/api/listings", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    router.push(`/listings/${data.id}`);
  }

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-100 transition-all";
  const labelClass = "text-sm font-medium text-gray-700 block mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Home className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900 text-sm">Basic Info</h2>
        </div>

        <div>
          <label className={labelClass}>Listing Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Spacious 3BHK near Metro Station"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Describe the property — location benefits, nearby facilities, condition, highlights..."
            required
            rows={4}
            className={`${inputClass} resize-none`}
          />
          <p className="text-xs text-gray-400 mt-1">
            The more detail you add, the better the AI recommendations work
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Property Type</label>
            <select
              value={form.property_type}
              onChange={(e) => update("property_type", e.target.value)}
              required
              className={inputClass}
            >
              <option value="">Select type</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>City</label>
            <select
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              required
              className={inputClass}
            >
              <option value="">Select city</option>
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Image Upload */}
        <div>
          <label className={labelClass}>Property Photo</label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-gray-400 transition-colors cursor-pointer relative">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            {imageFile ? (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {imageFile.name}
              </div>
            ) : (
              <div>
                <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Click to upload a photo</p>
                <p className="text-xs text-gray-300 mt-1">PNG, JPG up to 5MB</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pricing & Size */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900 text-sm">
            Pricing & Size
          </h2>
        </div>

        <div>
          <label className={labelClass}>Price (₹)</label>
          <input
            type="number"
            value={form.price}
            onChange={(e) => update("price", e.target.value)}
            placeholder="e.g. 4500000"
            required
            min={0}
            className={inputClass}
          />
          {form.price && (
            <p className="text-xs text-gray-400 mt-1">
              = ₹{(Number(form.price) / 100000).toFixed(1)} Lakhs
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-1">
                <Bed className="w-3.5 h-3.5" /> Bedrooms
              </span>
            </label>
            <input
              type="number"
              value={form.bedrooms}
              onChange={(e) => update("bedrooms", e.target.value)}
              placeholder="2"
              min={0}
              max={20}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-1">
                <Bath className="w-3.5 h-3.5" /> Bathrooms
              </span>
            </label>
            <input
              type="number"
              value={form.bathrooms}
              onChange={(e) => update("bathrooms", e.target.value)}
              placeholder="2"
              min={0}
              max={20}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5" /> Area (sqft)
              </span>
            </label>
            <input
              type="number"
              value={form.area_sqft}
              onChange={(e) => update("area_sqft", e.target.value)}
              placeholder="1200"
              min={0}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900 text-sm">Amenities</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {AMENITIES_LIST.map((amenity) => {
            const active = selectedAmenities.includes(amenity);
            return (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                  active
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {active && <CheckCircle className="w-3 h-3" />}
                {amenity}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-medium py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving & generating AI embedding...
          </>
        ) : (
          "Publish Listing"
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        AI will automatically generate a semantic embedding so your listing
        appears in relevant recommendations
      </p>
    </form>
  );
}
