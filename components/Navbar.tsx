"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { CheckSquare, Users, LogOut, LayoutDashboard, PlusCircle, UserCircle } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2.5 font-bold text-indigo-600 hover:text-indigo-700 transition">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <CheckSquare className="h-6 w-6 text-indigo-600" />
              </div>
              <span className="text-xl tracking-tight text-gray-900">Task<span className="text-indigo-600">Flow</span></span>
            </Link>

            {user && (
              <nav className="hidden md:flex space-x-2">
                <Link
                  href="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    pathname === "/dashboard"
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Teams Dashboard</span>
                  </span>
                </Link>
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="h-8 w-24 bg-gray-100 animate-pulse rounded-md" />
            ) : user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                  <span className="text-xs text-gray-500">{user.email}</span>
                </div>
                <div className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md transition"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg shadow-sm transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
