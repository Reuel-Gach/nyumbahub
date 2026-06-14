import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@uploadthing/react/styles.css";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "../components/Navbar"; // Ensure this import path is correct!

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NyumbaHub | Find Your Next Home",
  description: "The trusted marketplace for verified rental properties.",
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