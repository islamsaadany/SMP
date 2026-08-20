import type { Metadata } from "next";
import "./platform.css";

export const metadata: Metadata = {
  /* The organisation's name is data, not a literal — the title is set per page
     from what the database holds. */
  title: "Strategy Management Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
