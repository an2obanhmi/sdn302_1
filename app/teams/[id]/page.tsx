"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Plus,
  Settings,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  UserPlus,
  Shield,
  LayoutGrid,
  List,
  Edit,
  ArrowLeft,
  Loader2,
  User,
} from "lucide-react";

import TaskModal, { TaskData } from "@/components/TaskModal";
import AddMemberModal from "@/components/AddMemberModal";
import EditTeamModal from "@/components/EditTeamModal";
import KanbanBoard, { TaskItem } from "@/components/KanbanBoard";

interface TeamDetail {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  currentUserRole: "OWNER" | "MEMBER";
  owner: {
    id: string;
    name: string;
    email: string;
  };
  members: {
    id: string;
    teamId: string;
    userId: string;
    role: "OWNER" | "MEMBER";
    joinedAt: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }[];
  tasks: TaskItem[];
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params?.id as string;

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI state
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [activeTab, setActiveTab] = useState<"tasks" | "members">("tasks");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskData | null>(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);

  const fetchTeamDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const [teamRes, meRes] = await Promise.all([
        fetch(`/api/teams/${teamId}`),
        fetch("/api/auth/me"),
      ]);

      if (!teamRes.ok) {
        const data = await teamRes.json();
        setError(data.error || "Failed to load team details");
        return;
      }

      const teamData = await teamRes.json();
      setTeam(teamData.team);

      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUserId(meData.user.id);
      }
    } catch {
      setError("An unexpected network error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId) {
      fetchTeamDetails();
    }
  }, [teamId]);

  const isOwner = team?.currentUserRole === "OWNER";

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    if (!team) return [];
    return team.tasks.filter((task) => {
      const matchesSearch =
        !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "ALL" || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [team, searchQuery, statusFilter, priorityFilter]);

  // Actions
  const handleOpenCreateTask = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: TaskItem) => {
    setTaskToEdit({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      assigneeId: task.assigneeId,
    });
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) {
        fetchTeamDetails();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete task");
      }
    } catch {
      alert("Error deleting task");
    }
  };

  const handleQuickUpdateStatus = async (
    taskId: string,
    newStatus: "TODO" | "IN_PROGRESS" | "DONE"
  ) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchTeamDetails();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this team?`)) return;

    try {
      const res = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchTeamDetails();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to remove member");
      }
    } catch {
      alert("Error removing member");
    }
  };

  const handleDeleteTeam = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${team?.name}"? All associated tasks will also be deleted.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete team");
      }
    } catch {
      alert("Error deleting team");
    }
  };

  const getStatusBadge = (status: "TODO" | "IN_PROGRESS" | "DONE") => {
    switch (status) {
      case "TODO":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">To Do</span>;
      case "IN_PROGRESS":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/25">In Progress</span>;
      case "DONE":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">Done</span>;
    }
  };

  const getPriorityBadge = (priority: "LOW" | "MEDIUM" | "HIGH") => {
    switch (priority) {
      case "HIGH":
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/25">High</span>;
      case "MEDIUM":
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/25">Medium</span>;
      case "LOW":
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">Low</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
        <p className="text-xs text-slate-400">Loading team details...</p>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="p-4 bg-rose-500/10 text-rose-300 rounded-2xl border border-rose-500/20 inline-block mb-4">
          <AlertCircle className="w-8 h-8 mx-auto" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Team Not Accessible</h2>
        <p className="text-xs text-slate-400 mb-6">{error || "You do not have permission to view this team."}</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      {/* Breadcrumb & Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Teams</span>
        </Link>

        {isOwner && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditTeamModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-[#111827] text-xs font-medium text-slate-200 hover:bg-slate-800 transition"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Edit Team</span>
            </button>
            <button
              onClick={handleDeleteTeam}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Team</span>
            </button>
          </div>
        )}
      </div>

      {/* Team Header Info Card */}
      <div className="bg-[#111827]/90 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {team.name}
              </h1>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                  isOwner
                    ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                    : "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                }`}
              >
                {team.currentUserRole === "OWNER" ? "Owner" : "Member"}
              </span>
            </div>
            {team.description && (
              <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
                {team.description}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-slate-500" />
                <span>Owner: <strong className="text-slate-200">{team.owner.name}</strong> ({team.owner.email})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" />
                <span>{team.members.length} members</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-slate-500" />
                <span>{team.tasks.length} total tasks</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:self-start">
            <button
              onClick={handleOpenCreateTask}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
            {isOwner && (
              <button
                onClick={() => setIsMemberModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold text-xs sm:text-sm transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 border-t border-slate-800/80 pt-4 flex gap-4">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`pb-2 px-1 text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === "tasks"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Tasks ({team.tasks.length})
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`pb-2 px-1 text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === "members"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Members ({team.members.length})
          </button>
        </div>
      </div>

      {/* TAB 1: TASKS */}
      {activeTab === "tasks" && (
        <div className="space-y-6">
          {/* Controls: Search, Filters, View Switcher */}
          <div className="bg-[#111827]/90 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search tasks by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#0B0F19]/90 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-400">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs border border-slate-800 rounded-lg px-2.5 py-1.5 bg-[#0B0F19] text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-400">Priority:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="text-xs border border-slate-800 rounded-lg px-2.5 py-1.5 bg-[#0B0F19] text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              {/* View Toggle (Table vs Kanban) */}
              <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-md text-xs font-medium transition ${
                    viewMode === "table"
                      ? "bg-slate-800 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`p-1.5 rounded-md text-xs font-medium transition ${
                    viewMode === "kanban"
                      ? "bg-slate-800 text-indigo-400 shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Kanban Board View (Bonus)"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* View rendering */}
          {filteredTasks.length === 0 ? (
            <div className="bg-[#111827]/60 rounded-xl border border-dashed border-slate-800 p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-200">No tasks found</h4>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery || statusFilter !== "ALL" || priorityFilter !== "ALL"
                  ? "Try clearing your filters or search terms."
                  : "Get started by creating your first task for this team."}
              </p>
              <button
                onClick={handleOpenCreateTask}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Task</span>
              </button>
            </div>
          ) : viewMode === "kanban" ? (
            <KanbanBoard
              tasks={filteredTasks}
              currentUserId={currentUserId}
              teamOwnerId={team.ownerId}
              onEditTask={handleOpenEditTask}
              onDeleteTask={handleDeleteTask}
              onUpdateStatus={handleQuickUpdateStatus}
            />
          ) : (
            <div className="bg-[#111827]/90 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-4 sm:px-6">Task</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Priority</th>
                      <th className="py-3.5 px-4">Assignee</th>
                      <th className="py-3.5 px-4">Due Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredTasks.map((task) => {
                      const canDelete =
                        task.creatorId === currentUserId ||
                        task.assigneeId === currentUserId ||
                        team.ownerId === currentUserId;

                      return (
                        <tr key={task.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-4 px-4 sm:px-6">
                            <div className="font-semibold text-slate-100 text-sm">{task.title}</div>
                            {task.description && (
                              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5 max-w-md">
                                {task.description}
                              </p>
                            )}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <select
                              value={task.status}
                              onChange={(e) =>
                                handleQuickUpdateStatus(
                                  task.id,
                                  e.target.value as "TODO" | "IN_PROGRESS" | "DONE"
                                )
                              }
                              className="text-xs font-medium rounded-full px-2.5 py-1 border border-slate-800 bg-[#0B0F19] text-slate-200 cursor-pointer hover:border-slate-700"
                            >
                              <option value="TODO">To Do</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="DONE">Done</option>
                            </select>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            {getPriorityBadge(task.priority)}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-xs text-slate-300">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                              <span>{task.assignee ? task.assignee.name : "Unassigned"}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-400">
                            {task.dueDate ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditTask(task)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
                                title="Edit Task"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                                  title="Delete Task"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MEMBERS */}
      {activeTab === "members" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Team Members</h3>
            {isOwner && (
              <button
                onClick={() => setIsMemberModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>
            )}
          </div>

          <div className="bg-[#111827]/90 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
            <ul className="divide-y divide-slate-800/60">
              {team.members.map((member) => {
                const isMemberOwner = member.role === "OWNER";
                const canRemove = isOwner && !isMemberOwner;

                return (
                  <li
                    key={member.id}
                    className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-800/40 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                        {member.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-100 text-sm">{member.user.name}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                              isMemberOwner
                                ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                                : "bg-slate-800 text-slate-300 border border-slate-700/60"
                            }`}
                          >
                            {member.role === "OWNER" ? "Owner" : "Member"}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">{member.user.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-500 hidden sm:inline">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </span>
                      {canRemove && (
                        <button
                          onClick={() => handleRemoveMember(member.userId, member.user.name)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        teamId={teamId}
        members={team.members}
        taskToEdit={taskToEdit}
        onTaskSaved={fetchTeamDetails}
      />

      <AddMemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        teamId={teamId}
        onMemberAdded={fetchTeamDetails}
      />

      <EditTeamModal
        isOpen={isEditTeamModalOpen}
        onClose={() => setIsEditTeamModalOpen(false)}
        teamId={teamId}
        initialName={team.name}
        initialDescription={team.description}
        onTeamUpdated={fetchTeamDetails}
      />
    </div>
  );
}
