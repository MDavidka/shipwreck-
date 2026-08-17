import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatMoney(value: number) { return new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" }).format(value); }
