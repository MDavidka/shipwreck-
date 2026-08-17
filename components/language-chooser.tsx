"use client";

import { useEffect, useState } from "react";
import { languages, type Language } from "@/lib/i18n";

export function LanguageChooser({ value, onChange, label }: { value?: Language; onChange?: (language: Language) => void; label: string }) {
  const [language, setLanguage] = useState<Language>(value ?? "ro");
  useEffect(() => { if (!value) { const stored = window.localStorage.getItem("order-tracker-language") as Language | null; if (stored && languages.some((item) => item.code === stored)) setLanguage(stored); } }, [value]);
  function change(next: Language) { setLanguage(next); window.localStorage.setItem("order-tracker-language", next); onChange?.(next); }
  return <label className="flex items-center gap-2 text-xs text-muted-foreground"><span>{label}</span><select aria-label={label} value={value ?? language} onChange={(event) => change(event.target.value as Language)} className="rounded border border-border bg-transparent px-2 py-1 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">{languages.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label>;
}
