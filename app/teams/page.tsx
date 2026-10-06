import Link from "next/link";
import { Users, Sparkles, ArrowLeft } from "lucide-react";

export default function TeamsPlaceholderPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-gray-100">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-6">
          <Users className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Coming Soon in Assignment 2</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Teams & Team Management
        </h1>

        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          The collaborative team features, member invitations, and role-based permissions are currently under development and will be activated in <strong>Assignment 2</strong>.
        </p>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-xs hover:bg-indigo-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Public Tasks</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
