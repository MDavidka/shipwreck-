import { NextResponse } from "next/server";
import { getLiveCargusTracking } from "@/lib/cargus";
import { findOrder, orderCodeSchema, serializeOrder, updateOrder } from "@/lib/orders";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const codeResult = orderCodeSchema.safeParse(body.code);
    const address = typeof body.address === "string" ? body.address.trim() : "";
    if (!codeResult.success || !address || address.length > 500) return NextResponse.json({ error: "Enter a valid delivery address." }, { status: 400 });
    const order = await updateOrder(codeResult.data, { address, status: "preparing" });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json({ order: serializeOrder(order) });
  } catch (error) { console.error(error); return NextResponse.json({ error: "Could not save your address." }, { status: 503 }); }
}

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code") ?? "";
  const result = orderCodeSchema.safeParse(code);
  if (!result.success) return NextResponse.json({ error: "Enter a valid 5-digit order code." }, { status: 400 });
  try {
    const order = await findOrder(result.data);
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (!order.awb.trim()) return NextResponse.json({ order: serializeOrder({ ...order, status: "not_sent", awbStatus: null, awbStatusDescription: null, awbLastCheckedAt: null, awbEvents: [], awbRoute: [] }) }, { headers: { "Cache-Control": "no-store" } });
    try {
      const live = await getLiveCargusTracking(order);
      const refreshed = await updateOrder(order.code, { status: live.status, awbStatus: live.awbStatus, awbStatusDescription: live.awbStatusDescription, awbLastCheckedAt: live.awbLastCheckedAt, awbEvents: live.awbEvents, awbRoute: live.awbRoute });
      return NextResponse.json({ order: serializeOrder(refreshed ?? live) }, { headers: { "Cache-Control": "no-store" } });
    } catch (scrapeError) {
      console.error("Cargus refresh failed", scrapeError);
      return NextResponse.json({ order: serializeOrder(order), trackingUnavailable: true }, { headers: { "Cache-Control": "no-store" } });
    }
  } catch (error) { console.error(error); return NextResponse.json({ error: "Order service is not configured." }, { status: 503 }); }
}
