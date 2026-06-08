import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CarbonPilot — Your AI Copilot for a Greener Lifestyle",
  description:
    "Track, understand, and reduce your carbon footprint with AI-powered insights. CarbonPilot is your personal sustainability coach.",
  keywords: ["carbon footprint", "sustainability", "AI", "climate", "green living", "CO2 tracker"],
  authors: [{ name: "CarbonPilot Team" }],
  openGraph: {
    title: "CarbonPilot — AI Carbon Footprint Assistant",
    description: "Your AI copilot for a greener lifestyle",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen bg-background`}>
        {children}
      </body>
    </html>
  );
}
