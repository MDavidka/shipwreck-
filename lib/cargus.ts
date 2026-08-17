import { type OrderRecord } from "@/lib/orders";

export type CargusStatus = "not_sent" | "preparing" | "sent" | "delivered";
export type CargusTracking = { status: CargusStatus; description: string; rawStatus: string | null; checkedAt: Date };

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeStatus(text: string): CargusStatus {
  const value = text.toLocaleLowerCase("ro");
  if (/(livrat|predat destinatar|delivered)/i.test(value)) return "delivered";
  if (/(în livrare|in livrare|livrare|expediat|preluat|tranzit|transit|plecat|sortare)/i.test(value)) return "sent";
  if (/(înregistrat|inregistrat|pregătit|pregatit|generat|procesat|preluare)/i.test(value)) return "preparing";
  return "preparing";
}

export async function fetchCargusTracking(awb: string): Promise<CargusTracking> {
  const checkedAt = new Date();
  const response = await fetch(`https://xawb.ro/cargus?q=${encodeURIComponent(awb)}`, { cache: "no-store", headers: { Accept: "text/html", "User-Agent": "shipwreck-order-tracker/1.0" }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Cargus tracking returned ${response.status}`);
  const text = htmlToText(await response.text());
  const noMatch = /(nu am găsit|nu am gasit|nu există|nu exista|not found|nu a fost găsit)/i.test(text);
  if (noMatch) return { status: "preparing", description: "The AWB has not appeared in the courier tracking system yet.", rawStatus: null, checkedAt };
  const marker = text.match(/(?:Numar AWB|Număr AWB|AWB)[^.!?]{0,140}/i)?.[0] ?? text;
  return { status: normalizeStatus(text), description: marker.slice(0, 240), rawStatus: marker.slice(0, 120), checkedAt };
}

export async function getLiveCargusTracking(order: OrderRecord) {
  if (!order.awb.trim()) return { ...order, status: "not_sent" as const, awbStatus: null, awbStatusDescription: null, awbLastCheckedAt: null };
  const tracking = await fetchCargusTracking(order.awb.trim());
  return { ...order, status: tracking.status, awbStatus: tracking.rawStatus, awbStatusDescription: tracking.description, awbLastCheckedAt: tracking.checkedAt };
}
