import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Teach - Show Codex how",
  description: "Record a desktop workflow and publish it as a reviewable Codex skill.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
