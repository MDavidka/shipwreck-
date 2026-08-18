import { NextResponse } from "next/server";
import { getLiveCargusTracking } from "@/lib/cargus";
import { findOrder, orderCodeSchema, serializeOrder, shippingMethodSchema, updateOrder } from "@/lib/orders";
import { z } from "zod";

const customerDetailsSchema = z.object({ code: orderCodeSchema, customerName: z.string().trim().min(2).max(120), customerPhone: z.string().trim().min(9).max(20), shippingMethod: shippingMethodSchema.exclude(["free_choice"]), address: z.string().trim().min(2).max(500), shipGoName: z.string().trim().max(160).nullable().optional(), shipGoAddress: z.string().trim().max(500).nullable().optional(), lockerName: z.string().trim().max(160).nullable().optional() });
function normalizePhone(input: string) { const digits = input.replace(/\D/g, ""); if (digits.startsWith("40") && digits.length === 11) return `+${digits}`; if (digits.startsWith("0") && digits.length === 10) return `+40${digits.slice(1)}`; if (digits.length === 9) return `+40${digits}`; return input.startsWith("+") ? input : `+40${digits}`; }

export async function PATCH(request: Request) {
  try {
    const body = await request.json(); const parsed = customerDetailsSchema.safeParse({ ...body, customerPhone: normalizePhone(String(body.customerPhone ?? "")), lockerName: body.lockerName || null });
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Enter valid delivery details." }, { status: 400 });
    const data = parsed.data; const existing = await findOrder(data.code); if (!existing) return NextResponse.json({ error: "Order not found." }, { status: 404 }); const selectedMethod = existing.shippingMethodLocked ? existing.shippingMethod : data.shippingMethod; const selectedLocker = selectedMethod === "locker" ? data.lockerName : null; const order = await updateOrder(data.code, { customerName: data.customerName, customerPhone: data.customerPhone, address: data.address, shippingMethod: selectedMethod, shipGoName: selectedMethod === "ship_go" ? data.shipGoName ?? null : null, shipGoAddress: selectedMethod === "ship_go" ? data.shipGoAddress ?? null : null, lockerName: selectedLocker, status: "preparing" });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 }); return NextResponse.json({ order: serializeOrder(order) });
  } catch (error) { console.error(error); return NextResponse.json({ error: "Could not save your delivery details." }, { status: 503 }); }
}

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code") ?? ""; const result = orderCodeSchema.safeParse(code);
  if (!result.success) return NextResponse.json({ error: "Enter a valid 5-digit order code." }, { status: 400 });
  try {
    const order = await findOrder(result.data); if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (!order.awb.trim()) return NextResponse.json({ order: serializeOrder({ ...order, status: "not_sent", awbStatus: null, awbStatusDescription: null, awbLastCheckedAt: null, awbEvents: [], awbRoute: [] }) }, { headers: { "Cache-Control": "no-store" } });
    try { const live = await getLiveCargusTracking(order); const refreshed = await updateOrder(order.code, { status: live.status, awbStatus: live.awbStatus, awbStatusDescription: live.awbStatusDescription, awbLastCheckedAt: live.awbLastCheckedAt, awbEvents: live.awbEvents, awbRoute: live.awbRoute }); return NextResponse.json({ order: serializeOrder(refreshed ?? live) }, { headers: { "Cache-Control": "no-store" } }); }
    catch (scrapeError) { console.error("Cargus refresh failed", scrapeError); return NextResponse.json({ order: serializeOrder({ ...order, awbStatus: null, awbStatusDescription: null, awbLastCheckedAt: null, awbEvents: [], awbRoute: [] }), trackingUnavailable: true }, { headers: { "Cache-Control": "no-store" } }); }
  } catch (error) { console.error(error); return NextResponse.json({ error: "Order service is not configured." }, { status: 503 }); }
}
