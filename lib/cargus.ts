import * as cheerio from "cheerio";
import { type OrderRecord } from "@/lib/orders";

export type CargusStatus = "not_sent" | "preparing" | "sent" | "delivered";
export type CargusEvent = { date: string | null; title: string; description: string; location: string | null };
export type CargusTracking = { status: CargusStatus; description: string; rawStatus: string | null; checkedAt: Date; events: CargusEvent[]; route: string[] };

function htmlToText(html: string) { return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&#39;/gi, "'").replace(/&quot;/gi, '"').replace(/\s+/g, " ").trim(); }
function normalizeStatus(text: string): CargusStatus { const value = text.toLocaleLowerCase("ro"); if (/(livrat|predat destinatar|delivered)/i.test(value)) return "delivered"; if (/(în livrare|in livrare|livrare|expediat|preluat|tranzit|transit|plecat|sortare)/i.test(value)) return "sent"; if (/(înregistrat|inregistrat|pregătit|pregatit|generat|procesat|preluare)/i.test(value)) return "preparing"; return "preparing"; }
function clean(value: string) { return value.replace(/\s+/g, " ").replace(/\s*([|•·])\s*/g, " $1 ").trim(); }
function extractDate(value: string) { return value.match(/\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}(?:\s+\d{1,2}:\d{2})?\b/)?.[0] ?? null; }
function extractLocation(value: string) { return value.match(/(?:loca(?:ție|tie)|location|localitate|oraș|oras|depozit|hub|agenția|agentia)\s*[:\-]?\s*([^|•·,;]{2,80})/i)?.[1]?.trim() ?? null; }
function extractEvents(html: string): CargusEvent[] { const $ = cheerio.load(html); const selectors = [".tracking-event", ".timeline-item", ".event-item", ".shipment-event", "[class*='timeline'] li", "[class*='event']"]; const nodes = $(selectors.join(",")).toArray(); const unique = new Set<string>(); const events: CargusEvent[] = []; for (const node of nodes) { const text = clean($(node).text()); if (text.length < 12 || unique.has(text)) continue; unique.add(text); const date = extractDate(text); const location = extractLocation(text); const withoutDate = clean(text.replace(date ?? "", "")); const parts = withoutDate.split(/\s+[|•·]\s+|\s+-\s+/).map((part) => part.trim()).filter(Boolean); const title = parts[0]?.slice(0, 160) || withoutDate.slice(0, 160); const description = parts.slice(1).join(" — ") || withoutDate.slice(title.length).trim() || title; events.push({ date, title, description: description.slice(0, 500), location }); } return events.slice(0, 40); }

export async function fetchCargusTracking(awb: string): Promise<CargusTracking> {
  const checkedAt = new Date();
  const response = await fetch(`https://xawb.ro/cargus?q=${encodeURIComponent(awb)}`, { cache: "no-store", headers: { Accept: "text/html", "User-Agent": "shipwreck-order-tracker/1.0" }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Cargus tracking returned ${response.status}`);
  const html = await response.text(); const text = htmlToText(html);
  if (/(nu am găsit|nu am gasit|nu există|nu exista|not found|nu a fost găsit)/i.test(text)) return { status: "preparing", description: "The AWB has not appeared in the courier tracking system yet.", rawStatus: null, checkedAt, events: [], route: [] };
  const events = extractEvents(html); const route = Array.from(new Set(events.map((event) => event.location).filter((location): location is string => Boolean(location)))); const marker = text.match(/(?:Numar AWB|Număr AWB|AWB)[^.!?]{0,180}/i)?.[0] ?? text; const latest = events[0];
  return { status: normalizeStatus(`${latest?.title ?? ""} ${latest?.description ?? ""} ${text}`), description: latest?.description || marker.slice(0, 240), rawStatus: latest?.title || marker.slice(0, 120), checkedAt, events, route };
}

export async function getLiveCargusTracking(order: OrderRecord) { if (!order.awb.trim()) return { ...order, status: "not_sent" as const, awbStatus: null, awbStatusDescription: null, awbLastCheckedAt: null, awbEvents: [], awbRoute: [] }; const tracking = await fetchCargusTracking(order.awb.trim()); return { ...order, status: tracking.status, awbStatus: tracking.rawStatus, awbStatusDescription: tracking.description, awbLastCheckedAt: tracking.checkedAt, awbEvents: tracking.events, awbRoute: tracking.route }; }
