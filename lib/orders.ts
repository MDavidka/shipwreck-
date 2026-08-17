import { MongoClient, type Collection, type Db } from "mongodb";
import { z } from "zod";

const mongoUri = process.env.MONGO_API_KEY;
if (!mongoUri && process.env.NODE_ENV === "production") console.warn("MONGO_API_KEY is not configured; order routes will return a configuration error.");
let clientPromise: Promise<MongoClient> | null = null;
function getClient() { if (!mongoUri) throw new Error("MONGO_API_KEY is not configured"); if (!clientPromise) clientPromise = new MongoClient(mongoUri).connect(); return clientPromise; }
async function ordersCollection(): Promise<Collection<OrderRecord>> { const client = await getClient(); const db: Db = client.db(); const collection = db.collection<OrderRecord>("orders"); await collection.createIndex({ code: 1 }, { unique: true }); return collection; }

export const orderCodeSchema = z.string().regex(/^\d{5}$/, "Order code must be exactly 5 digits.");
export const adminCodeSchema = z.literal("admin3&");
const awbEventSchema = z.object({ date: z.string().nullable(), title: z.string(), description: z.string(), location: z.string().nullable() });
export const orderUpdateSchema = z.object({ code: orderCodeSchema, address: z.string().trim().max(500).optional(), awb: z.string().trim().max(80).optional(), orderPrice: z.number().min(0).max(1000000).optional(), shippingPrice: z.number().min(0).max(1000000).optional(), shippingPaid: z.boolean().optional(), status: z.enum(["code", "address", "not_sent", "preparing", "sent", "delivered", "shipping"]).optional(), awbStatus: z.string().max(240).nullable().optional(), awbStatusDescription: z.string().max(500).nullable().optional(), awbLastCheckedAt: z.coerce.date().nullable().optional(), awbEvents: z.array(awbEventSchema).max(40).optional(), awbRoute: z.array(z.string()).max(40).optional() });

export type OrderEvent = { date: string | null; title: string; description: string; location: string | null };
export type OrderRecord = { code: string; status: "code" | "address" | "not_sent" | "preparing" | "sent" | "delivered" | "shipping"; address: string; awb: string; awbStatus?: string | null; awbStatusDescription?: string | null; awbLastCheckedAt?: Date | null; awbEvents?: OrderEvent[]; awbRoute?: string[]; orderPrice: number; shippingPrice: number; shippingPaid: boolean; createdAt: Date; updatedAt: Date };

export function assertAdmin(request: Request) { if (request.headers.get("x-admin-code") !== "admin3&") throw new Error("Unauthorized"); }
export async function findOrder(code: string) { return (await ordersCollection()).findOne({ code }, { projection: { _id: 0 } }); }
export async function listOrders() { return (await ordersCollection()).find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray(); }
export async function createOrder(code: string) { const now = new Date(); const order: OrderRecord = { code, status: "code", address: "", awb: "", awbStatus: null, awbStatusDescription: null, awbLastCheckedAt: null, awbEvents: [], awbRoute: [], orderPrice: 0, shippingPrice: 0, shippingPaid: false, createdAt: now, updatedAt: now }; await (await ordersCollection()).insertOne(order); return order; }
export async function updateOrder(code: string, update: Partial<OrderRecord>) { await (await ordersCollection()).updateOne({ code }, { $set: { ...update, updatedAt: new Date() } }); return findOrder(code); }
export function serializeOrder(order: OrderRecord | null) { if (!order) return null; return { ...order, createdAt: order.createdAt.toISOString(), updatedAt: order.updatedAt.toISOString(), awbLastCheckedAt: order.awbLastCheckedAt?.toISOString() ?? null }; }
