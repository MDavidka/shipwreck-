"use client";

import { Check, CircleDot, Package, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Copy } from "@/lib/i18n";

type ShipmentStatus = "code" | "address" | "not_sent" | "preparing" | "sent" | "delivered" | "shipping";
type Event = { date: string | null; title: string; description: string; location: string | null };

function headline(status: ShipmentStatus, copy: Copy) { if (status === "not_sent") return copy.deliveryHeadlineNotSent; if (status === "delivered") return copy.deliveryHeadlineDelivered; if (status === "preparing") return copy.deliveryHeadlinePreparing; return copy.deliveryHeadline; }

export function ShipmentStatus({ status, events, rawStatus, copy }: { status: ShipmentStatus; events: Event[]; rawStatus?: string | null; copy: Copy }) {
  const normalized = status === "shipping" ? "sent" : status; const recent = events.slice(-4).reverse();
  return <Card className="border-border/80"><CardHeader className="space-y-3 border-b"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent"><Truck className="h-5 w-5" /></span><CardTitle className="text-xl leading-tight sm:text-2xl">{headline(normalized, copy)}</CardTitle></div><p className="text-sm text-muted-foreground">{rawStatus || (normalized === "delivered" ? copy.statusDelivered : normalized === "sent" ? copy.statusSent : normalized === "not_sent" ? copy.statusNotSent : copy.statusPreparing)}</p></CardHeader><CardContent className="p-0">{recent.length ? <div className="divide-y">{recent.map((event, index) => <div key={`${event.date}-${event.title}-${index}`} className="grid gap-3 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:gap-5 sm:px-6"><div className="flex items-start gap-2 text-xs text-muted-foreground"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${index === 0 ? "border-accent bg-accent/10 text-accent" : "border-border"}`}>{index === 0 ? <CircleDot className="h-3 w-3" /> : <Check className="h-3 w-3" />}</span><span>{event.date || copy.dateUnavailable}{event.location ? <span className="mt-1 block font-medium text-foreground">{event.location}</span> : null}</span></div><div><p className="text-sm font-medium">{event.title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{event.description}</p></div></div>)}</div> : <div className="flex gap-3 px-5 py-6 text-sm text-muted-foreground sm:px-6"><Package className="mt-0.5 h-4 w-4 shrink-0" /><p>{normalized === "not_sent" ? copy.statusNotSentDescription : copy.timelineUnavailable}</p></div>}</CardContent></Card>;
}
