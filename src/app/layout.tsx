import type { Metadata } from "next";
import { Archivo, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", weight: ["500", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

const SITE_URL = "https://crewcanvas.site";
const DESCRIPTION =
  "CrewCanvas helps general contractors coordinate subcontractors, dependencies, crew availability and site readiness — with AI that explains risk, grounded in verified checklists and human approval.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "CrewCanvas — Crew coordination & site readiness", template: "%s · CrewCanvas" },
  description: DESCRIPTION,
  applicationName: "CrewCanvas",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "CrewCanvas",
    title: "CrewCanvas — Know what's ready before the crew shows up",
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${archivo.variable} ${mono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
