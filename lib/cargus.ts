import * as cheerio from "cheerio";
import { type OrderRecord } from "@/lib/orders";

export type CargusStatus = "not_sent" | "preparing" | "sent" | "delivered";
export type CargusEvent = { date: string | null; title: string; description: string; location: string | null };
export type CargusTracking = { status: CargusStatus; description: string; rawStatus: string | null; checkedAt: Date; events: CargusEvent[]; route: string[] };

function clean(value: string) { return value.replace(/\s+/g, " ").trim(); }
function normalizeStatus(text: string): CargusStatus { const value = text.toLocaleLowerCase("ro"); if (/(livrat|predat destinatar|delivered)/i.test(value)) return "delivered"; if (/(în livrare|in livrare|livrare|expediat|preluat|tranzit|transit|plecat|sortare|spre destinatar)/i.test(value)) return "sent"; return "preparing"; }

function extractEvents(html: string): CargusEvent[] {
  const $ = cheerio.load(html); const events: CargusEvent[] = [];
  $(".trace-row").each((_, node) => { const title = clean($(node).find(".trace-status").first().text()); const description = clean($(node).find(".trace-description").first().text()); const date = clean($(node).find(".trace-date-time").first().text()) || null; const location = clean($(node).find(".trace-locality").first().text()) || null; if (title || description) events.push({ title, description: description || title, date, location }); });
  return events.slice(0, 60);
}

export async function fetchCargusTracking(awb: string): Promise<CargusTracking> {
  const checkedAt = new Date();
  const response = await fetch(`https://xawb.ro/cargus/rezultat?q=${encodeURIComponent(awb)}`, { cache: "no-store", headers: { Accept: "text/html", "User-Agent": "shipwreck-order-tracker/1.0" }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Cargus tracking returned ${response.status}`);
  const html = await response.text(); const $ = cheerio.load(html); const pageText = clean($("body").text());
  if (/(nu am găsit|nu am gasit|nu există|nu exista|not found|nu a fost găsit)/i.test(pageText)) return { status: "preparing", description: "The AWB has not appeared in the courier tracking system yet.", rawStatus: null, checkedAt, events: [], route: [] };
  const events = extractEvents(html); const route = Array.from(new Set(events.map((event) => event.location).filter((location): location is string => Boolean(location)))); const headline = clean($(".status-pill").first().text()) || events.at(-1)?.title || ""; const latest = events.at(-1); return { status: normalizeStatus(`${headline} ${latest?.title ?? ""} ${latest?.description ?? ""}`), description: latest?.description || headline || "Cargus tracking details available.", rawStatus: headline || latest?.title || null, checkedAt, events, route };
}

export async function getLiveCargusTracking(order: OrderRecord) { if (!order.awb.trim()) return { ...order, status: "not_sent" as const, awbStatus: null, awbStatusDescription: null, awbLastCheckedAt: null, awbEvents: [], awbRoute: [] }; const tracking = await fetchCargusTracking(order.awb.trim()); return { ...order, status: tracking.status, awbStatus: tracking.rawStatus, awbStatusDescription: tracking.description, awbLastCheckedAt: tracking.checkedAt, awbEvents: tracking.events, awbRoute: tracking.route }; }
