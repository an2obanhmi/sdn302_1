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
  Clock,
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
      // Search
      const matchesSearch =
        !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // Status
      const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;

      // Priority
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
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">To Do</span>;
      case "IN_PROGRESS":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">In Progress</span>;
      case "DONE":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Done</span>;
    }
  };

  const getPriorityBadge = (priority: "LOW" | "MEDIUM" | "HIGH") => {
    switch (priority) {
      case "HIGH":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">High</span>;
      case "MEDIUM":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Medium</span>;
      case "LOW":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Low</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-sm text-gray-500">Loading team details...</p>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200 inline-block mb-4">
          <AlertCircle className="w-8 h-8 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Team Not Accessible</h2>
        <p className="text-gray-600 mb-6">{error || "You do not have permission to view this team."}</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
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
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Teams</span>
        </Link>

        {isOwner && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditTeamModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Edit Team</span>
            </button>
            <button
              onClick={handleDeleteTeam}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Team</span>
            </button>
          </div>
        )}
      </div>

      {/* Team Header Info Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                {team.name}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isOwner
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-blue-100 text-blue-800 border border-blue-200"
                }`}
              >
                {team.currentUserRole === "OWNER" ? "Owner" : "Member"}
              </span>
            </div>
            {team.description && (
              <p className="mt-2 text-sm text-gray-600 max-w-3xl leading-relaxed">
                {team.description}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-6 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-gray-400" />
                <span>Owner: <strong>{team.owner.name}</strong> ({team.owner.email})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gray-400" />
                <span>{team.members.length} members</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-gray-400" />
                <span>{team.tasks.length} total tasks</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:self-start">
            <button
              onClick={handleOpenCreateTask}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-sm hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
            {isOwner && (
              <button
                onClick={() => setIsMemberModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold text-sm shadow-xs hover:bg-gray-50 transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 border-t border-gray-200 pt-4 flex gap-4">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`pb-2 px-1 text-sm font-semibold border-b-2 transition ${
              activeTab === "tasks"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Tasks ({team.tasks.length})
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`pb-2 px-1 text-sm font-semibold border-b-2 transition ${
              activeTab === "members"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
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
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-gray-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-gray-500">Priority:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              {/* View Toggle (Table vs Kanban) */}
              <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-md text-xs font-medium transition ${
                    viewMode === "table"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`p-1.5 rounded-md text-xs font-medium transition ${
                    viewMode === "kanban"
                      ? "bg-white text-indigo-600 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
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
            <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h4 className="text-base font-semibold text-gray-900">No tasks found</h4>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery || statusFilter !== "ALL" || priorityFilter !== "ALL"
                  ? "Try clearing your filters or search terms."
                  : "Get started by creating your first task for this team."}
              </p>
              <button
                onClick={handleOpenCreateTask}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Task</span>
              </button>
            </div>
          ) : viewMode === "kanban" ? (
            /* Kanban Board Component */
            <KanbanBoard
              tasks={filteredTasks}
              currentUserId={currentUserId}
              teamOwnerId={team.ownerId}
              onEditTask={handleOpenEditTask}
              onDeleteTask={handleDeleteTask}
              onUpdateStatus={handleQuickUpdateStatus}
            />
          ) : (
            /* Table View */
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/75 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4 sm:px-6">Task</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Priority</th>
                      <th className="py-3.5 px-4">Assignee</th>
                      <th className="py-3.5 px-4">Due Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTasks.map((task) => {
                      const canDelete =
                        task.creatorId === currentUserId ||
                        task.assigneeId === currentUserId ||
                        team.ownerId === currentUserId;

                      return (
                        <tr key={task.id} className="hover:bg-gray-50/80 transition">
                          <td className="py-4 px-4 sm:px-6">
                            <div className="font-semibold text-gray-900">{task.title}</div>
                            {task.description && (
                              <p className="text-xs text-gray-500 line-clamp-1 mt-0.5 max-w-md">
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
                              className="text-xs font-medium rounded-full px-2.5 py-1 border border-gray-200 bg-white text-gray-700 cursor-pointer hover:border-gray-300"
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
                            <div className="flex items-center gap-1.5 text-xs text-gray-700">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              <span>{task.assignee ? task.assignee.name : "Unassigned"}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap text-xs text-gray-500">
                            {task.dueDate ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
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
                                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                                title="Edit Task"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
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
            <h3 className="text-lg font-bold text-gray-900">Team Members</h3>
            {isOwner && (
              <button
                onClick={() => setIsMemberModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-xs hover:bg-indigo-700 transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <ul className="divide-y divide-gray-100">
              {team.members.map((member) => {
                const isMemberOwner = member.role === "OWNER";
                const canRemove = isOwner && !isMemberOwner;

                return (
                  <li
                    key={member.id}
                    className="p-4 sm:px-6 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                        {member.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{member.user.name}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              isMemberOwner
                                ? "bg-amber-100 text-amber-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {member.role === "OWNER" ? "Owner" : "Member"}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{member.user.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-400 hidden sm:inline">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </span>
                      {canRemove && (
                        <button
                          onClick={() => handleRemoveMember(member.userId, member.user.name)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition"
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
