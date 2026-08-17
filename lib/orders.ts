import { MongoClient, type Collection, type Db } from "mongodb";
import { z } from "zod";

const mongoUri = process.env.MONGO_API_KEY;

if (!mongoUri && process.env.NODE_ENV === "production") {
  console.warn("MONGO_API_KEY is not configured; order routes will return a configuration error.");
}

let clientPromise: Promise<MongoClient> | null = null;

function getClient() {
  if (!mongoUri) throw new Error("MONGO_API_KEY is not configured");
  if (!clientPromise) clientPromise = new MongoClient(mongoUri).connect();
  return clientPromise;
}

async function ordersCollection(): Promise<Collection<OrderRecord>> {
  const client = await getClient();
  const db: Db = client.db();
  const collection = db.collection<OrderRecord>("orders");
  await collection.createIndex({ code: 1 }, { unique: true });
  return collection;
}

export const orderCodeSchema = z.string().regex(/^\d{5}$/, "Order code must be exactly 5 digits.");
export const adminCodeSchema = z.literal("admin3&");

export const orderUpdateSchema = z.object({
  code: orderCodeSchema,
  address: z.string().trim().max(500).optional(),
  awb: z.string().trim().max(80).optional(),
  orderPrice: z.number().min(0).max(1000000).optional(),
  shippingPrice: z.number().min(0).max(1000000).optional(),
  shippingPaid: z.boolean().optional(),
  status: z.enum(["code", "address", "preparing", "sent", "delivered", "shipping"]).optional(),
});

export type OrderRecord = {
  code: string;
  status: "code" | "address" | "preparing" | "sent" | "delivered" | "shipping";
  address: string;
  awb: string;
  orderPrice: number;
  shippingPrice: number;
  shippingPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function assertAdmin(request: Request) {
  const header = request.headers.get("x-admin-code");
  if (header !== "admin3&") throw new Error("Unauthorized");
}

export async function findOrder(code: string) {
  return (await ordersCollection()).findOne({ code }, { projection: { _id: 0 } });
}

export async function listOrders() {
  return (await ordersCollection()).find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
}

export async function createOrder(code: string) {
  const now = new Date();
  const order: OrderRecord = { code, status: "code", address: "", awb: "", orderPrice: 0, shippingPrice: 0, shippingPaid: false, createdAt: now, updatedAt: now };
  await (await ordersCollection()).insertOne(order);
  return order;
}

export async function updateOrder(code: string, update: Partial<OrderRecord>) {
  const values = { ...update, updatedAt: new Date() };
  await (await ordersCollection()).updateOne({ code }, { $set: values });
  return findOrder(code);
}

export function serializeOrder(order: OrderRecord | null) {
  if (!order) return null;
  return { ...order, createdAt: order.createdAt.toISOString(), updatedAt: order.updatedAt.toISOString() };
}
