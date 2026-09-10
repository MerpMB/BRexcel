import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BRexcel",
  description: "Open-source foundation for digital spreadsheet commerce.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
