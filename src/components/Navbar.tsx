"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo / Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-extrabold text-blue-600 tracking-tight">
              Nyumba<span className="text-slate-800">Hub</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link href="/" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
              Find a House
            </Link>
            
            <SignedIn>
              {/* Only landlords/signed-in users see this */}
              <Link href="/mgmt/properties/new" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
                Post Property
              </Link>
              <Link href="/mgmt/dashboard" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
                My Dashboard
              </Link>
            </SignedIn>
          </div>

          {/* Auth & Profile (Desktop & Mobile) */}
          <div className="flex items-center gap-4">
            <SignedOut>
              <div className="hidden md:block">
                <SignInButton mode="modal">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold transition-colors text-sm shadow-sm">
                    Sign In / Register
                  </button>
                </SignInButton>
              </div>
            </SignedOut>

            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            {/* Mobile Menu Hamburger Icon */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-slate-600 hover:text-slate-900 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 pt-2 pb-4 space-y-1 shadow-lg">
          <Link 
            href="/" 
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Find a House
          </Link>
          
          <SignedIn>
            <Link 
              href="/mgmt/properties/new" 
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Post Property
            </Link>
            <Link 
              href="/mgmt/dashboard" 
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              My Dashboard
            </Link>
          </SignedIn>

          <SignedOut>
            <div className="pt-2">
              <SignInButton mode="modal">
                <button className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold transition-colors text-base shadow-sm">
                  Sign In / Register
                </button>
              </SignInButton>
            </div>
          </SignedOut>
        </div>
      )}
    </nav>
  );
}