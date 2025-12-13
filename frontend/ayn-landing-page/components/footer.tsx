"use client"

import Link from "next/link"

export function Footer() {
  return (
    <footer className="relative py-16 px-6 border-t border-zinc-900">
      <div className="absolute inset-0 bg-gradient-to-b from-black to-zinc-950" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <span className="text-xl font-light tracking-wider text-zinc-300">Ayn</span>
            </Link>
            <p className="text-sm text-zinc-500">Education Quality & Accreditation Platform powered by Horus Engine.</p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-medium text-zinc-300 mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#horus" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                  Horus Engine
                </a>
              </li>
              <li>
                <a href="#demo" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                  Demo
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-medium text-zinc-300 mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@ayn.edu"
                  className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-medium text-zinc-300 mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                  Security
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-900/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} Ayn. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-zinc-600 hover:text-zinc-400 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
              </svg>
            </a>
            <a href="#" className="text-zinc-600 hover:text-zinc-400 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
