"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, Users, Home, LogIn, LayoutDashboard } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        setUser(null);
      }
    }
    checkAuth();
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0B0F19]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link
              href="/"
              className="flex items-center space-x-2.5 font-bold transition group"
            >
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl group-hover:border-indigo-500/40 transition">
                <CheckSquare className="h-5 w-5 text-indigo-400" />
              </div>
              <span className="text-lg tracking-tight text-white font-semibold">
                Task<span className="text-indigo-400">Flow</span>
              </span>
            </Link>

            {/* Navigation links (Home, Teams) */}
            <nav className="flex items-center space-x-1 sm:space-x-2">
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 ${
                  pathname === "/"
                    ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-xs"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Home</span>
              </Link>

              <Link
                href="/teams"
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 ${
                  pathname === "/teams"
                    ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-xs"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Teams</span>
              </Link>

              {user && (
                <Link
                  href="/dashboard"
                  className={`hidden sm:flex px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition items-center gap-1.5 ${
                    pathname === "/dashboard"
                      ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-xs"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
              )}
            </nav>
          </div>

          {/* Right Action: Login / Profile */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-2.5">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-xs ring-1 ring-slate-700">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-slate-300 hidden sm:inline">{user.name}</span>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-xs font-medium text-slate-200 hover:text-white transition shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-400" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
