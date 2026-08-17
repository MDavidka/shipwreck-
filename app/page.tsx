"use client";

import { FormEvent, useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@/components/ui/primitives";
import { formatMoney } from "@/lib/utils";

type Order = { code: string; status: "code" | "address" | "shipping"; address: string; awb: string; orderPrice: number; shippingPrice: number; shippingPaid: boolean };
const steps = ["Code", "Address", "Shipping"];

function Stepper({ active }: { active: number }) { return <div className="mb-14 flex items-center gap-3" aria-label={`Step ${active + 1} of 3`}><div className="flex items-center gap-2">{steps.map((step, index) => <div key={step} className="flex items-center gap-2"><span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${index <= active ? "border-accent bg-accent text-accent-foreground" : "border-border text-muted-foreground"}`}>{index + 1}</span><span className={`hidden text-xs sm:inline ${index === active ? "font-medium text-foreground" : "text-muted-foreground"}`}>{step}</span>{index < 2 && <span className="step-line mx-1 w-8 sm:w-12" />}</div>)}</div></div>; }

export default function Home() {
  const [code, setCode] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [address, setAddress] = useState("");
  const [state, setState] = useState<"code" | "address" | "shipping">("code");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function lookup(event: FormEvent) { event.preventDefault(); setMessage(""); if (!/^\d{5}$/.test(code)) return setMessage("Enter the 5-digit code from your order."); setBusy(true); try { const response = await fetch(`/api/orders?code=${code}`); const data = await response.json(); if (!response.ok) throw new Error(data.error); setOrder(data.order); setAddress(data.order.address); setState(data.order.address ? "shipping" : "address"); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not find that order."); } finally { setBusy(false); } }

  async function saveAddress(event: FormEvent) { event.preventDefault(); if (!address.trim() || !order) return; setBusy(true); setMessage(""); try { const response = await fetch("/api/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: order.code, address: address.trim() }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setOrder(data.order); setState("shipping"); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save your address."); } finally { setBusy(false); } }

  const active = state === "code" ? 0 : state === "address" ? 1 : 2;
  return <main className="content-width py-8 sm:py-12"><header className="mb-16 flex items-center justify-between"><span className="text-sm font-medium tracking-tight">Order tracker</span><span className="text-xs text-muted-foreground">/</span></header><Stepper active={active} />
    <section className="max-w-xl"><p className="mb-3 text-sm text-muted-foreground">{state === "code" ? "Enter your order code to continue." : state === "address" ? "Add the delivery address for this order." : "Your order details are below."}</p><h1 className="mb-8 text-3xl font-medium tracking-tight sm:text-4xl">{state === "code" ? "Find your order" : state === "address" ? "Delivery address" : "Shipping status"}</h1>
      {state === "code" && <form onSubmit={lookup} className="max-w-sm space-y-3"><Label htmlFor="code">Order code</Label><div className="flex gap-2"><Input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={5} placeholder="00000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 5))} autoFocus /><Button type="submit" disabled={busy || code.length !== 5}>{busy ? "Checking" : "Continue"}</Button></div></form>}
      {state === "address" && <form onSubmit={saveAddress} className="max-w-md space-y-3"><Label htmlFor="address">Full delivery address</Label><textarea id="address" rows={4} value={address} onChange={(e) => setAddress(e.target.value)} className="flex w-full resize-none rounded-md border bg-card px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Street, city, postal code" autoFocus /><Button type="submit" disabled={busy || !address.trim()}>{busy ? "Saving" : "Save address"}</Button></form>}
      {state === "shipping" && order && <Card className="max-w-xl"><CardHeader><CardTitle>Order {order.code}</CardTitle><p className="text-sm text-muted-foreground">Ready for shipping</p></CardHeader><CardContent className="space-y-6"><div className="grid gap-5 border-y py-5 sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">Cargus AWB</p><p className="mt-1 text-sm">{order.awb || "Not assigned yet"}</p></div><div><p className="text-xs text-muted-foreground">Payment</p><p className="mt-1 text-sm">{order.shippingPaid ? "Shipping paid" : "Shipping unpaid"}</p></div><div><p className="text-xs text-muted-foreground">Order price</p><p className="mt-1 text-sm">{formatMoney(order.orderPrice)}</p></div><div><p className="text-xs text-muted-foreground">Shipping price</p><p className="mt-1 text-sm">{formatMoney(order.shippingPrice)}</p></div></div><div><p className="text-xs text-muted-foreground">Delivery address</p><p className="mt-1 whitespace-pre-line text-sm">{order.address}</p></div></CardContent></Card>}
      {message && <p role="alert" className="mt-5 text-sm text-destructive">{message}</p>}<button className="mt-16 text-xs text-muted-foreground underline decoration-border underline-offset-4" onClick={() => { setState("code"); setOrder(null); setCode(""); setMessage(""); }}>Start over</button>
    </section><footer className="mt-24 border-t pt-5 text-xs text-muted-foreground">Need help? Keep your order code handy.</footer></main>;
}
