import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const tl = (n: number) =>
  n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const d = (date: Date) => format(date, "dd.MM.yyyy");

export const years = (days: number) =>
  (days / 365.25).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
