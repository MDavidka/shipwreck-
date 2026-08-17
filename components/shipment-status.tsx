"use client";

import { Check, Package, Send, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { type Copy } from "@/lib/i18n";

type ShipmentStatus = "code" | "address" | "preparing" | "sent" | "delivered" | "shipping";

const rank: Record<ShipmentStatus, number> = { code: 0, address: 0, preparing: 1, shipping: 2, sent: 2, delivered: 3 };

export function ShipmentStatus({ status, copy }: { status: ShipmentStatus; copy: Copy }) {
  const normalized = status === "shipping" ? "sent" : status;
  const currentRank = rank[normalized];
  const items = [
    { key: "preparing", title: copy.statusPreparing, description: copy.statusPreparingDescription, Icon: Package },
    { key: "sent", title: copy.statusSent, description: copy.statusSentDescription, Icon: Send },
    { key: "delivered", title: copy.statusDelivered, description: copy.statusDeliveredDescription, Icon: Truck },
  ] as const;
  return <Card className="border-border/80"><CardContent className="space-y-0 p-0">{items.map((item, index) => { const itemRank = rank[item.key]; const isCurrent = currentRank === itemRank; const isComplete = currentRank > itemRank; return <div key={item.key} className="relative flex gap-4 px-5 py-5 sm:px-6">{index < items.length - 1 && <span className={`absolute left-[35px] top-[58px] h-[calc(100%-36px)] w-px ${isComplete ? "bg-accent" : "bg-border"}`} aria-hidden="true" />}<span className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${isCurrent ? "border-accent bg-accent text-accent-foreground" : isComplete ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-muted text-muted-foreground"}`}>{isComplete ? <Check className="h-4 w-4" /> : <item.Icon className="h-4 w-4" />}</span><div className="pt-0.5"><p className={`text-sm font-medium ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>{item.title}</p><p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{item.description}</p></div></div>; })}</CardContent></Card>;
}
