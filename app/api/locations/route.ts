import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query || query.length < 3) return NextResponse.json({ locations: [] });
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=ro&q=${encodeURIComponent(`${query}, Romania`)}`, { headers: { "User-Agent": "shipwreck-order-tracker/1.0 contact@shipwreck.local" }, next: { revalidate: 300 } });
    if (!response.ok) throw new Error(`Geocoder returned ${response.status}`);
    const results = (await response.json()) as Array<{ place_id: number; display_name: string; lat: string; lon: string; type?: string }>;
    return NextResponse.json({ locations: results.map((item) => ({ id: String(item.place_id), name: item.display_name.split(",")[0] || item.display_name, address: item.display_name, lat: Number(item.lat), lng: Number(item.lon), type: item.type || "location" })) });
  } catch (error) { console.error(error); return NextResponse.json({ error: "Location search is temporarily unavailable." }, { status: 503 }); }
}
