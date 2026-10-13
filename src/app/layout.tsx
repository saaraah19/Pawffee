import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Pawffee | Recipes worth keeping",
    template: "%s | Pawffee",
  },
  description:
    "A warm, personal collection of cooking and baking recipes that worked, saved with love and shared with you.",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    siteName: "Pawffee",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-cream text-espresso antialiased">
        {children}
      </body>
    </html>
  );
}
