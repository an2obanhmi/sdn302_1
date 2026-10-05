import Link from "next/link";
import { CheckSquare, Users, ShieldCheck, Kanban, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6">
            <span>Assignment 2</span>
            <span>•</span>
            <span>Task & Team Management App</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 max-w-4xl mx-auto leading-tight">
            Streamline your team projects with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              TaskFlow
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Create teams, assign tasks, prioritize work, and collaborate seamlessly with full role-based access control.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 hover:shadow-lg transition transform active:scale-95"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white border border-gray-300 text-gray-700 font-semibold shadow-sm hover:bg-gray-50 transition"
            >
              Sign In to Account
            </Link>
          </div>

          {/* Grader Helper Box */}
          <div className="mt-12 max-w-xl mx-auto bg-amber-50 border border-amber-200 rounded-xl p-4 text-left shadow-sm">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-amber-900">Grading / Demo Test Account</h4>
                <p className="text-xs text-amber-700 mt-1">
                  You can register a new account anytime (instant login, no email confirmation required), or test with pre-seeded account:
                </p>
                <div className="mt-2 text-xs font-mono bg-white/80 p-2 rounded border border-amber-200 text-gray-800 flex flex-col sm:flex-row gap-2 sm:gap-6">
                  <span><strong>Email:</strong> grader@test.com</span>
                  <span><strong>Password:</strong> Grader123@</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Team Collaboration</h3>
              <p className="mt-2 text-sm text-gray-600">
                Create multiple teams, invite colleagues by email, manage team members, and delegate tasks effortlessly.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition">
              <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4">
                <Kanban className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Task & Board Views</h3>
              <p className="mt-2 text-sm text-gray-600">
                Organize work with custom statuses (To Do, In Progress, Done) and visual priorities (Low, Medium, High).
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Role-Based Access</h3>
              <p className="mt-2 text-sm text-gray-600">
                Fine-grained permissions: Only Owners can modify teams or manage membership, while members create and update tasks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500">
        <p>Assignment 2 - Task & Team Management Application • Built with Next.js, Prisma & PostgreSQL</p>
      </footer>
    </div>
  );
}
