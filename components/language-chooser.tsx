"use client";

import { useEffect, useState } from "react";
import { languages, type Language } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function LanguageChooser({ value, onChange, label }: { value?: Language; onChange?: (language: Language) => void; label: string }) {
  const [language, setLanguage] = useState<Language>(value ?? "ro");
  useEffect(() => { if (!value) { const stored = window.localStorage.getItem("order-tracker-language") as Language | null; if (stored && languages.some((item) => item.code === stored)) setLanguage(stored); } }, [value]);
  function change(next: Language) { setLanguage(next); window.localStorage.setItem("order-tracker-language", next); onChange?.(next); }
  const selected = value ?? language;
  return <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{label}</span><Select value={selected} onValueChange={change}><SelectTrigger className="h-8 w-[112px] border-border bg-transparent text-xs"><SelectValue /></SelectTrigger><SelectContent>{languages.map((item) => <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>)}</SelectContent></Select></div>;
}
