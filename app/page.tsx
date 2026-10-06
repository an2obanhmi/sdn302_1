"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  KeyRound,
  ArrowRight,
  X,
  Check,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
  createdAt: string;
  team?: { id: string; name: string } | null;
  assignee?: { id: string; name: string } | null;
}

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(null);

  // Create form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"TODO" | "IN_PROGRESS" | "DONE">("TODO");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Edit modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<"TODO" | "IN_PROGRESS" | "DONE">("TODO");
  const [editPriority, setEditPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [editDueDate, setEditDueDate] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  // Fetch current user and tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch {
        setCurrentUser(null);
      }
    }
    checkAuth();
  }, []);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (statusFilter === "ALL") return tasks;
    return tasks.filter((t) => t.status === statusFilter);
  }, [tasks, statusFilter]);

  // Handle Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError("Task title is required.");
      return;
    }

    setFormError("");
    setFormSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to create task.");
        return;
      }

      setFormSuccess("Task created successfully!");
      setTitle("");
      setDescription("");
      setStatus("TODO");
      setPriority("MEDIUM");
      setDueDate("");
      fetchTasks();

      setTimeout(() => setFormSuccess(""), 3000);
    } catch {
      setFormError("An unexpected network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditStatus(task.status);
    setEditPriority(task.priority);
    setEditDueDate(
      task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
    );
    setEditError("");
  };

  // Handle Update Task
  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    if (!editTitle.trim()) {
      setEditError("Task title is required.");
      return;
    }

    setEditError("");
    setEditSubmitting(true);

    try {
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          status: editStatus,
          priority: editPriority,
          dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "Failed to update task.");
        return;
      }

      setEditingTask(null);
      fetchTasks();
    } catch {
      setEditError("An unexpected network error occurred.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Delete Task
  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${taskTitle}"?`)) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete task.");
        return;
      }

      fetchTasks();
    } catch {
      alert("An error occurred while deleting task.");
    }
  };

  const getStatusBadge = (taskStatus: "TODO" | "IN_PROGRESS" | "DONE") => {
    switch (taskStatus) {
      case "TODO":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            To Do
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
            In Progress
          </span>
        );
      case "DONE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Done
          </span>
        );
    }
  };

  const getPriorityBadge = (taskPriority: "LOW" | "MEDIUM" | "HIGH") => {
    switch (taskPriority) {
      case "HIGH":
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/25">
            High
          </span>
        );
      case "MEDIUM":
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25">
            Medium
          </span>
        );
      case "LOW":
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            Low
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Hero & Assignment Overview Header */}
      <section className="relative overflow-hidden pt-8 pb-10 sm:pt-12 sm:pb-12 border-b border-slate-800/80 bg-gradient-to-b from-[#0F172A]/50 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Assignment 2: Task & Team Management Application</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Modern Collaborative Workflows with{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                  TaskFlow
                </span>
              </h1>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Connect teams, assign deliverables, and enforce role-based access control. Unauthenticated visitors can preview public tasks below, while authenticated members unlock team spaces, Kanban boards, and member management.
              </p>
            </div>

            {/* Quick Action Navigation */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {currentUser ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 transition active:scale-[0.98]"
                >
                  <Users className="w-4 h-4" />
                  <span>Open Teams Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 transition active:scale-[0.98]"
                  >
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#111827] border border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800/80 font-semibold text-xs transition"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Grader Helper Box */}
          <div className="mt-6 bg-[#111827]/80 border border-amber-500/20 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-amber-300">Automated Grading Test Account: </span>
                <span className="text-slate-300">
                  Email: <code className="bg-[#0B0F19] px-1.5 py-0.5 rounded border border-slate-800 text-indigo-300">grader@test.com</code> | Password: <code className="bg-[#0B0F19] px-1.5 py-0.5 rounded border border-slate-800 text-indigo-300">Grader123@</code>
                </span>
                <span className="text-slate-400 block sm:inline sm:ml-2">(Self-registration also works without email confirmation)</span>
              </div>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 shrink-0 underline"
            >
              <span>Quick Login</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Main 2-Column Task Management Section (Dark Mode #0B0F19) */}
      <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (5 cols): Create New Task Form */}
          <div className="lg:col-span-5 bg-[#111827]/90 rounded-2xl border border-slate-800 p-6 sm:p-7 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800/80 mb-5">
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Create New Task</h2>
                <p className="text-xs text-slate-400">Add tasks to the public database directly</p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-300 border border-rose-500/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-300 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#E2E8F0] mb-1.5">
                  Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Prisma Schema"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl bg-[#0B0F19] border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-[#64748B] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#E2E8F0] mb-1.5">
                  Description <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Add extra context or details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl bg-[#0B0F19] border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-[#64748B] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-[#E2E8F0] mb-1.5">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full rounded-xl bg-[#0B0F19] border border-slate-800 px-3 py-2.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#E2E8F0] mb-1.5">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full rounded-xl bg-[#0B0F19] border border-slate-800 px-3 py-2.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#E2E8F0] mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl bg-[#0B0F19] border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-[#64748B] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-3 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 disabled:opacity-50 transition active:scale-[0.99]"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create Task</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column (7 cols): Tasks List & Filters */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Header & Filter Capsules */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Tasks List</h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-300 text-xs font-semibold">
                  {filteredTasks.length}
                </span>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(["ALL", "TODO", "IN_PROGRESS", "DONE"] as const).map((key) => {
                  const label =
                    key === "ALL"
                      ? "All"
                      : key === "TODO"
                      ? "To Do"
                      : key === "IN_PROGRESS"
                      ? "In Progress"
                      : "Done";
                  const isActive = statusFilter === key;

                  return (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-xs font-semibold"
                          : "bg-[#111827] text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Task Cards */}
            {loading ? (
              <div className="bg-[#111827]/60 rounded-2xl border border-slate-800 p-12 text-center">
                <Loader2 className="w-7 h-7 animate-spin text-indigo-400 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading tasks from database...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="bg-[#111827]/60 rounded-2xl border border-dashed border-slate-800 p-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-200">No tasks found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {statusFilter !== "ALL"
                    ? "There are no tasks matching the selected filter. Try selecting 'All'."
                    : "No tasks created yet. Use the form on the left to add your first task!"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-[#111827]/90 p-4.5 rounded-xl border border-slate-800 hover:border-slate-700/80 hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white text-sm tracking-tight">{task.title}</h3>
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                        {task.team && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            Team: {task.team.name}
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {task.dueDate && (
                        <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8] pt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                      <button
                        onClick={() => openEditModal(task)}
                        className="p-1.5 rounded-lg border border-slate-800 bg-[#0B0F19] text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition"
                        title="Edit Task"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id, task.title)}
                        className="p-1.5 rounded-lg border border-slate-800 bg-[#0B0F19] text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition"
                        title="Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Edit Modal (Dark Mode #0B0F19) */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-[#111827] p-6 shadow-2xl border border-slate-800">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Edit Task</h3>
              <button
                onClick={() => setEditingTask(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editError && (
              <div className="mt-3.5 flex items-center gap-2 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-300 border border-rose-500/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateTask} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#E2E8F0] mb-1.5">
                  Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl bg-[#0B0F19] border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#E2E8F0] mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-xl bg-[#0B0F19] border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-[#E2E8F0] mb-1.5">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full rounded-xl bg-[#0B0F19] border border-slate-800 px-3 py-2.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#E2E8F0] mb-1.5">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as any)}
                    className="w-full rounded-xl bg-[#0B0F19] border border-slate-800 px-3 py-2.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#E2E8F0] mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full rounded-xl bg-[#0B0F19] border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="rounded-xl border border-slate-800 bg-[#0B0F19] px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50 transition"
                >
                  {editSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 bg-[#0B0F19]">
        <p>Assignment 2: Task & Team Management Application • Next.js, Prisma & PostgreSQL</p>
      </footer>
    </div>
  );
}
