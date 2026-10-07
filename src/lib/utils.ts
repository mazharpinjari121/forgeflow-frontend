import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "";
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

export function numberToWordsINR(num: number): string {
  if (num === 0) return "Zero Rupees Only";
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const formatBelowThousand = (n: number) => {
    let s = "";
    const h = Math.floor(n / 100);
    const t = n % 100;
    if (h) s += a[h] + " Hundred ";
    if (t > 0) {
      if (s !== "") s += "and ";
      if (t < 20) s += a[t];
      else s += b[Math.floor(t / 10)] + (t % 10 ? " " + a[t % 10] : "");
    }
    return s.trim();
  };

  const amount = Math.round(num);
  let words = "";

  const crore = Math.floor(amount / 10000000);
  const lakh = Math.floor((amount % 10000000) / 100000);
  const thousand = Math.floor((amount % 100000) / 1000);
  const remaining = amount % 1000;

  if (crore > 0) {
    words += formatBelowThousand(crore) + " Crore ";
  }
  if (lakh > 0) {
    words += formatBelowThousand(lakh) + " Lakh ";
  }
  if (thousand > 0) {
    words += formatBelowThousand(thousand) + " Thousand ";
  }
  if (remaining > 0) {
    words += formatBelowThousand(remaining);
  }

  return "Rs. " + words.trim() + " Only";
}

