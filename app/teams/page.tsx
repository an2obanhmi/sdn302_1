import Link from "next/link";
import { Users, Sparkles, ArrowLeft } from "lucide-react";

export default function TeamsPlaceholderPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center bg-[#111827]/90 p-8 sm:p-10 rounded-2xl shadow-2xl border border-slate-800">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-6">
          <Users className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Coming Soon in Assignment 2</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white">
          Teams & Team Management
        </h1>

        <p className="mt-3 text-sm text-slate-400 leading-relaxed">
          The collaborative team features, member invitations, and role-based permissions are currently under development and will be activated in <strong>Assignment 2</strong>.
        </p>

        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 transition active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Public Tasks</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
