import type { Metadata, Viewport } from "next"; // 🔥 Added Viewport
import { Inter } from "next/font/google";
import "@uploadthing/react/styles.css";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "../components/Navbar"; 

const inter = Inter({ subsets: ["latin"] });

// 🔥 Added for PWA Top-bar styling on mobile devices
export const viewport: Viewport = {
  themeColor: "#2563eb", 
};

export const metadata: Metadata = {
  title: "NyumbaHub | Find Your Next Home",
  description: "The trusted marketplace for verified rental properties.",
  manifest: "/manifest.json", // 🔥 Links the PWA to the browser
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} bg-slate-50 min-h-screen flex flex-col`}>
          {/* Global Navigation Bar */}
          <Navbar />
          
          {/* Page Content */}
          <main className="flex-grow">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}