"use client";

import { useEffect, useState } from "react";
import { MapPin, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Location = { id: string; name: string; address: string; lat: number; lng: number; type: string };
type Props = { label: string; placeholder: string; name: string; address: string; lat: number | null; lng: number | null; onChange: (value: { name: string; address: string; lat: number; lng: number }) => void };

export function ShippingLocationMap({ label, placeholder, name, address, lat, lng, onChange }: Props) {
  const [query, setQuery] = useState(name || address || ""); const [locations, setLocations] = useState<Location[]>([]); const [loading, setLoading] = useState(false); const [searched, setSearched] = useState(false);
  useEffect(() => { setQuery(name || address || ""); }, [name, address]);
  async function search() { if (query.trim().length < 3) return; setLoading(true); setSearched(true); try { const response = await fetch(`/api/locations?q=${encodeURIComponent(query.trim())}`); const data = await response.json(); setLocations(data.locations || []); } finally { setLoading(false); } }
  const mapQuery = lat !== null && lng !== null ? `${lat},${lng}` : address || name || "Romania";
  return <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><div><Label>{label}</Label><p className="mt-1 text-xs text-muted-foreground">Search a Romanian Ship & Go point, then select the exact result.</p></div><Sparkles className="h-4 w-4 text-accent" /></div><div className="flex gap-2"><Input value={query} placeholder={placeholder} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); search(); } }} /><Button type="button" variant="outline" onClick={search} disabled={loading}><Search className="mr-2 h-4 w-4" />{loading ? "…" : "Search"}</Button></div>{searched && locations.length > 0 && <div className="space-y-2">{locations.map((location) => <button type="button" key={location.id} onClick={() => { onChange(location); setQuery(location.name); setLocations([]); }} className="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:border-accent hover:bg-accent/5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><span><span className="block text-sm font-medium">{location.name}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{location.address}</span></span></button>)}</div>}{searched && !loading && locations.length === 0 && <p className="text-xs text-muted-foreground">No Romanian location found. Try a city, street, or landmark.</p>}<div className="overflow-hidden rounded-lg border bg-muted/30"><iframe title="Google Maps location preview" src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`} className="h-56 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>{(name || address) && <div className="flex items-start gap-3 rounded-lg bg-muted/40 p-3 text-sm"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><div><p className="font-medium">{name || "Selected Ship & Go location"}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{address}</p></div></div>}</div>;
}
