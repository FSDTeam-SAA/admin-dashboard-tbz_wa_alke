import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function unwrap<T>(payload: unknown, fallback: T): T {
  if (!payload || typeof payload !== "object") return fallback;
  const value = payload as { data?: unknown; success?: boolean };
  if (value.data !== undefined) return value.data as T;
  return payload as T;
}

export function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 ? 2 : 0,
  }).format(value);
}
