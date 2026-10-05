"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Plus, Shield, CheckCircle2, ArrowRight, FolderKanban, Loader2 } from "lucide-react";
import CreateTeamModal from "@/components/CreateTeamModal";

interface TeamItem {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  userRole: "OWNER" | "MEMBER";
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    members: number;
    tasks: number;
  };
}

export default function DashboardPage() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/teams");
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams || []);
      }
    } catch (err) {
      console.error("Failed to fetch teams:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-8 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Teams Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            View, manage, and collaborate across all teams you belong to.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-sm hover:bg-indigo-700 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Team</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Your Teams</p>
            <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-violet-50 text-violet-600 rounded-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Owned Teams</p>
            <p className="text-2xl font-bold text-gray-900">
              {teams.filter((t) => t.userRole === "OWNER").length}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tasks</p>
            <p className="text-2xl font-bold text-gray-900">
              {teams.reduce((acc, t) => acc + (t._count?.tasks || 0), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-sm">Loading your teams...</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No teams found</h3>
          <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
            You are not part of any team yet. Create your first team to get started!
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Team</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-white rounded-2xl border border-gray-200 hover:border-indigo-200 hover:shadow-md transition flex flex-col justify-between p-6"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-lg font-bold text-gray-900 tracking-tight line-clamp-1">
                    {team.name}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
                      team.userRole === "OWNER"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-blue-100 text-blue-800 border border-blue-200"
                    }`}
                  >
                    {team.userRole === "OWNER" ? "Owner" : "Member"}
                  </span>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
                  {team.description || "No description provided."}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 font-medium text-gray-700">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    {team._count?.members || 1} members
                  </span>
                  <span className="flex items-center gap-1 font-medium text-gray-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
                    {team._count?.tasks || 0} tasks
                  </span>
                </div>

                <Link
                  href={`/teams/${team.id}`}
                  className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 transition"
                >
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <CreateTeamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTeamCreated={fetchTeams}
      />
    </div>
  );
}
