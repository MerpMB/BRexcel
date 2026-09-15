import type { Metadata } from "next";
import "@/app/globals.css";

// This root layout is intentionally locale-independent: checkout and the
// dev-only showcase fixture are not translated (see I18N-01 scope), so they
// must not inherit the storefront's cookie-resolved <html lang>.
export const metadata: Metadata = {
  title: "BRexcel — Spreadsheet-native tools",
  description: "Focused Excel tools, built one module at a time — with public browser demos that use synthetic data.",
};

export default function UnlocalizedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
