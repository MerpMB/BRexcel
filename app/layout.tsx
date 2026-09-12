import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BRexcel — Spreadsheet-native tools",
  description: "Focused Excel tools, built one module at a time — with public browser demos that use synthetic data.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
