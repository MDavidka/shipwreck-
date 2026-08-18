import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin, createOrder, deleteOrder, listOrders, orderCodeSchema, orderUpdateSchema, serializeOrder, updateOrder } from "@/lib/orders";

const createSchema = z.object({ code: orderCodeSchema });
function unauthorized() { return NextResponse.json({ error: "Unauthorized." }, { status: 401 }); }

export async function GET(request: Request) {
  try { assertAdmin(request); const orders = await listOrders(); return NextResponse.json({ orders: orders.map(serializeOrder) }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { if (error instanceof Error && error.message === "Unauthorized") return unauthorized(); console.error(error); return NextResponse.json({ error: "Order service is not configured." }, { status: 503 }); }
}

export async function POST(request: Request) {
  try { assertAdmin(request); const body = createSchema.safeParse(await request.json()); if (!body.success) return NextResponse.json({ error: body.error.issues[0]?.message ?? "Invalid order code." }, { status: 400 }); const order = await createOrder(body.data.code); return NextResponse.json({ order: serializeOrder(order) }, { status: 201 }); }
  catch (error) { if (error instanceof Error && error.message === "Unauthorized") return unauthorized(); if (error instanceof Error && "code" in error && (error as { code?: string }).code === "11000") return NextResponse.json({ error: "That code already exists." }, { status: 409 }); console.error(error); return NextResponse.json({ error: "Could not create the order." }, { status: 503 }); }
}

export async function DELETE(request: Request) {
  try { assertAdmin(request); const code = new URL(request.url).searchParams.get("code") ?? ""; const parsed = orderCodeSchema.safeParse(code); if (!parsed.success) return NextResponse.json({ error: "Invalid order code." }, { status: 400 }); const result = await deleteOrder(parsed.data); if (!result.deletedCount) return NextResponse.json({ error: "Order not found." }, { status: 404 }); return NextResponse.json({ ok: true }); }
  catch (error) { if (error instanceof Error && error.message === "Unauthorized") return unauthorized(); console.error(error); return NextResponse.json({ error: "Could not delete the order." }, { status: 503 }); }
}

export async function PATCH(request: Request) {
  try { assertAdmin(request); const body = orderUpdateSchema.safeParse(await request.json()); if (!body.success) return NextResponse.json({ error: body.error.issues[0]?.message ?? "Invalid order update." }, { status: 400 }); const { code, ...update } = body.data; const order = await updateOrder(code, update); if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 }); return NextResponse.json({ order: serializeOrder(order) }); }
  catch (error) { if (error instanceof Error && error.message === "Unauthorized") return unauthorized(); console.error(error); return NextResponse.json({ error: "Could not update the order." }, { status: 503 }); }
}
