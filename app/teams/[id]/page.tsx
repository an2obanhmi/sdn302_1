"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
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
  ShieldAlert,
  ShieldCheck,
  LayoutGrid,
  List,
  Edit,
  ArrowLeft,
  Loader2,
  User,
  MessageSquare,
  History,
  CheckSquare,
  Sparkles,
} from "lucide-react";

import TaskModal, { TaskData } from "@/components/TaskModal";
import AddMemberModal from "@/components/AddMemberModal";
import EditTeamModal from "@/components/EditTeamModal";
import KanbanBoard, { TaskItem } from "@/components/KanbanBoard";
import TeamChat from "@/components/TeamChat";
import ActivityLogView from "@/components/ActivityLogView";
import { useTeamRealtime } from "@/lib/realtime-client";

interface TeamDetail {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  currentUserRole: "OWNER" | "ADMIN" | "MEMBER";
  owner: {
    id: string;
    name: string;
    email: string;
  };
  members: {
    id: string;
    teamId: string;
    userId: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
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

  // Tab state: "tasks" | "chat" | "members" | "activity"
  const [activeTab, setActiveTab] = useState<"tasks" | "chat" | "members" | "activity">("tasks");
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  // Real-time state buffers
  const [realtimeMessages, setRealtimeMessages] = useState<any[]>([]);
  const [realtimeActivities, setRealtimeActivities] = useState<any[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [roleUpdatingId, setRoleUpdatingId] = useState<string | null>(null);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskData | null>(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);

  // Real-time live handlers
  const handleRealtimeTaskCreated = useCallback((newTask: TaskItem) => {
    setTeam((prev) => {
      if (!prev) return prev;
      if (prev.tasks.some((t) => t.id === newTask.id)) return prev;
      return { ...prev, tasks: [newTask, ...prev.tasks] };
    });
  }, []);

  const handleRealtimeTaskUpdated = useCallback((updatedTask: TaskItem) => {
    setTeam((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
      };
    });
  }, []);

  const handleRealtimeTaskDeleted = useCallback(({ id }: { id: string }) => {
    setTeam((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== id),
      };
    });
  }, []);

  const handleRealtimeChatMessage = useCallback((message: any) => {
    setRealtimeMessages((prev) => [...prev, message]);
  }, []);

  const handleRealtimeActivity = useCallback((activity: any) => {
    setRealtimeActivities((prev) => [activity, ...prev]);
  }, []);

  const handleRealtimeTyping = useCallback(
    ({ userName, isTyping, userId }: { userName: string; isTyping: boolean; userId: string }) => {
      if (userId === currentUserId) return;
      if (isTyping) {
        setTypingUser(userName);
      } else {
        setTypingUser(null);
      }
    },
    [currentUserId]
  );

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

  const handleRealtimeMemberUpdated = useCallback(() => {
    fetchTeamDetails();
  }, [teamId]);

  // Connect to Real-time subscription (SSE / WebSockets)
  const { isConnected, activeMechanism, notifyTyping } = useTeamRealtime(teamId, {
    onTaskCreated: handleRealtimeTaskCreated,
    onTaskUpdated: handleRealtimeTaskUpdated,
    onTaskDeleted: handleRealtimeTaskDeleted,
    onChatMessage: handleRealtimeChatMessage,
    onActivityNew: handleRealtimeActivity,
    onMemberUpdated: handleRealtimeMemberUpdated,
    onTyping: handleRealtimeTyping,
  });

  useEffect(() => {
    if (teamId) {
      fetchTeamDetails();
    }
  }, [teamId]);

  const currentUserRole = team?.currentUserRole || "MEMBER";
  const isOwner = currentUserRole === "OWNER";
  const isAdmin = currentUserRole === "ADMIN";
  const isOwnerOrAdmin = isOwner || isAdmin;

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
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      assigneeId: task.assigneeId || "",
    });
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) {
        setTeam((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            tasks: prev.tasks.filter((t) => t.id !== taskId),
          };
        });
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete task");
      }
    } catch {
      alert("Error deleting task");
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: "TODO" | "IN_PROGRESS" | "DONE") => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setTeam((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            tasks: prev.tasks.map((t) => (t.id === taskId ? data.task : t)),
          };
        });
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update task status");
      }
    } catch {
      alert("Error updating task status");
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

  const handleRoleChange = async (userId: string, newRole: "ADMIN" | "MEMBER") => {
    setRoleUpdatingId(userId);
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        fetchTeamDetails();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update member role");
      }
    } catch {
      alert("Error updating member role");
    } finally {
      setRoleUpdatingId(null);
    }
  };

  const handleDeleteTeam = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${team?.name}"? All associated tasks, chat messages, and records will also be permanently deleted.`
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

  const handleSendChatMessage = async (content: string) => {
    const res = await fetch(`/api/teams/${teamId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to send message");
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
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/25">High</span>;
      case "MEDIUM":
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25">Medium</span>;
      case "LOW":
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">Low</span>;
    }
  };

  const getRoleBadge = (role: "OWNER" | "ADMIN" | "MEMBER") => {
    switch (role) {
      case "OWNER":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Shield className="w-3 h-3 text-amber-400" />
            <span>Owner</span>
          </span>
        );
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            <ShieldCheck className="w-3 h-3 text-indigo-400" />
            <span>Admin</span>
          </span>
        );
      case "MEMBER":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
            <User className="w-3 h-3 text-slate-400" />
            <span>Member</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
        <p className="text-xs text-slate-400">Loading team details and live subscriptions...</p>
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
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Teams</span>
        </Link>

        {/* Real-time Indicator Pill */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111827] border border-slate-800 text-[11px]">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span className="text-slate-300 font-medium">Real-time:</span>
            <span className="text-emerald-400 font-semibold">{activeMechanism}</span>
          </div>

          {/* Owner & Admin Controls */}
          <div className="flex items-center gap-2">
            {isOwnerOrAdmin && (
              <button
                onClick={() => setIsEditTeamModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-[#111827] text-xs font-medium text-slate-200 hover:bg-slate-800 transition"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Edit Team</span>
              </button>
            )}
            {isOwner && (
              <button
                onClick={handleDeleteTeam}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition"
                title="Only Team Owner can delete team"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Team</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Team Header Info Card */}
      <div className="bg-[#111827]/90 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {team.name}
              </h1>
              {getRoleBadge(currentUserRole)}
            </div>

            {team.description && (
              <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
                {team.description}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-slate-500" />
                <span>
                  Owner: <strong className="text-slate-200">{team.owner.name}</strong> ({team.owner.email})
                </span>
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
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 transition active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Main Tabs Navigation */}
      <div className="border-b border-slate-800 mb-6">
        <nav className="flex space-x-6 sm:space-x-8 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`pb-3 border-b-2 flex items-center gap-2 transition ${
              activeTab === "tasks"
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Tasks</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 text-[10px]">
              {team.tasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            className={`pb-3 border-b-2 flex items-center gap-2 transition ${
              activeTab === "chat"
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Real-time Chat</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          <button
            onClick={() => setActiveTab("members")}
            className={`pb-3 border-b-2 flex items-center gap-2 transition ${
              activeTab === "members"
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Members & Roles</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 text-[10px]">
              {team.members.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("activity")}
            className={`pb-3 border-b-2 flex items-center gap-2 transition ${
              activeTab === "activity"
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Activity</span>
          </button>
        </nav>
      </div>

      {/* TAB 1: TASKS */}
      {activeTab === "tasks" && (
        <div className="space-y-6">
          {/* Controls bar: Search, filters, view toggle */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-[#111827]/60 p-4 rounded-xl border border-slate-800">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search tasks by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#0B0F19] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>

                {/* Priority filter */}
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-[#0B0F19] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-[#0B0F19] p-1 rounded-lg border border-slate-800 self-end lg:self-center">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded text-xs flex items-center gap-1.5 transition ${
                  viewMode === "table"
                    ? "bg-indigo-600 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>

              <button
                onClick={() => setViewMode("kanban")}
                className={`p-1.5 rounded text-xs flex items-center gap-1.5 transition ${
                  viewMode === "kanban"
                    ? "bg-indigo-600 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Kanban Board"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
            </div>
          </div>

          {/* Content: Kanban Board or Table */}
          {filteredTasks.length === 0 ? (
            <div className="bg-[#111827]/90 rounded-2xl border border-dashed border-slate-800 p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-200">No tasks found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No tasks match your current filters. Clear the search or create a new task.
              </p>
              <button
                onClick={handleOpenCreateTask}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Task</span>
              </button>
            </div>
          ) : viewMode === "kanban" ? (
            <KanbanBoard
              tasks={filteredTasks}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              teamOwnerId={team.ownerId}
              onEditTask={handleOpenEditTask}
              onDeleteTask={handleDeleteTask}
              onUpdateStatus={handleUpdateTaskStatus}
            />
          ) : (
            /* Table View */
            <div className="bg-[#111827]/90 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#0B0F19]/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Title</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Assignee</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {filteredTasks.map((task) => {
                      const canEdit =
                        isOwnerOrAdmin ||
                        task.creatorId === currentUserId ||
                        task.assigneeId === currentUserId;

                      const canDelete =
                        isOwnerOrAdmin ||
                        task.creatorId === currentUserId ||
                        task.assigneeId === currentUserId;

                      return (
                        <tr key={task.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-4 px-4 font-semibold text-white max-w-xs">
                            <div className="truncate">{task.title}</div>
                            {task.description && (
                              <div className="text-[11px] text-slate-400 truncate font-normal mt-0.5">
                                {task.description}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            {getStatusBadge(task.status)}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            {getPriorityBadge(task.priority)}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-300">
                            {task.assignee ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-[10px]">
                                  {task.assignee.name.charAt(0).toUpperCase()}
                                </div>
                                <span>{task.assignee.name}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">Unassigned</span>
                            )}
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
                              {canEdit && (
                                <button
                                  onClick={() => handleOpenEditTask(task)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
                                  title="Edit Task"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
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

      {/* TAB 2: REAL-TIME TEAM CHAT */}
      {activeTab === "chat" && (
        <TeamChat
          teamId={teamId}
          currentUserId={currentUserId}
          realtimeMessages={realtimeMessages}
          onSendMessage={handleSendChatMessage}
          typingUser={typingUser}
          onTyping={notifyTyping}
          isConnected={isConnected}
          connectionMechanism={activeMechanism}
        />
      )}

      {/* TAB 3: MEMBERS & ROLES */}
      {activeTab === "members" && (
        <div className="space-y-6">
          {/* Permission Matrix Banner */}
          <div className="bg-[#111827]/90 rounded-2xl border border-slate-800 p-5 shadow-sm">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Role & Permission Architecture (RBAC)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#0B0F19] border border-amber-500/20">
                <span className="font-bold text-amber-300">👑 Owner:</span> Full control (manage members, change roles, delete team, delete any task).
              </div>
              <div className="p-3 rounded-xl bg-[#0B0F19] border border-indigo-500/20">
                <span className="font-bold text-indigo-300">🛡️ Admin:</span> Can manage members and all tasks, but cannot delete the team.
              </div>
              <div className="p-3 rounded-xl bg-[#0B0F19] border border-slate-800">
                <span className="font-bold text-slate-300">👤 Member:</span> Can create tasks and manage their own tasks, view all team data & chat.
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Team Members ({team.members.length})</h3>
            {isOwnerOrAdmin && (
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
                const isTargetOwner = member.role === "OWNER";
                const isTargetAdmin = member.role === "ADMIN";
                const isSelf = member.userId === currentUserId;

                // Owner can remove anyone except self. Admin can remove Member only.
                const canRemove =
                  !isTargetOwner &&
                  (isOwner || (isAdmin && member.role === "MEMBER") || isSelf);

                // Owner can change any member's role. Admin can promote/demote Member to Admin/Member (cannot touch Owner).
                const canChangeRole =
                  !isTargetOwner &&
                  (isOwner || (isAdmin && member.role !== "OWNER"));

                return (
                  <li
                    key={member.id}
                    className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/40 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                        {member.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-100 text-sm">
                            {member.user.name}
                          </span>
                          {isSelf && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300">
                              You
                            </span>
                          )}
                          {getRoleBadge(member.role)}
                        </div>
                        <span className="text-xs text-slate-400">{member.user.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 hidden md:inline">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </span>

                      {/* Role selection dropdown (Owner/Admin only) */}
                      {canChangeRole && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-400">Role:</span>
                          <select
                            disabled={roleUpdatingId === member.userId}
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(member.userId, e.target.value as "ADMIN" | "MEMBER")
                            }
                            className="bg-[#0B0F19] border border-slate-800 text-slate-200 rounded-lg px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none cursor-pointer"
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="MEMBER">Member</option>
                          </select>
                        </div>
                      )}

                      {/* Remove button */}
                      {canRemove && (
                        <button
                          onClick={() => handleRemoveMember(member.userId, member.user.name)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition"
                        >
                          {isSelf ? "Leave Team" : "Remove"}
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

      {/* TAB 4: AUDIT ACTIVITY LOG */}
      {activeTab === "activity" && (
        <ActivityLogView teamId={teamId} realtimeActivities={realtimeActivities} />
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
