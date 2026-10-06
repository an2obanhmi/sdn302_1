"use client";

import { useEffect, useState, useMemo } from "react";
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
  Circle,
  X,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
  createdAt: string;
}

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Create form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"TODO" | "IN_PROGRESS" | "DONE">("TODO");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Edit modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<"TODO" | "IN_PROGRESS" | "DONE">("TODO");
  const [editPriority, setEditPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [editDueDate, setEditDueDate] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  // Fetch tasks
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

      if (res.ok) {
        setTitle("");
        setDescription("");
        setStatus("TODO");
        setPriority("MEDIUM");
        setDueDate("");
        await fetchTasks();
      } else {
        const data = await res.json();
        setFormError(data.error || "Failed to create task");
      }
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
    setEditDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
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

      if (res.ok) {
        setEditingTask(null);
        await fetchTasks();
      } else {
        const data = await res.json();
        setEditError(data.error || "Failed to update task");
      }
    } catch {
      setEditError("Failed to update task.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Delete Task
  const handleDeleteTask = async (id: string, taskTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${taskTitle}"?`)) return;

    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchTasks();
      } else {
        alert("Failed to delete task.");
      }
    } catch {
      alert("Error deleting task.");
    }
  };

  // Badge helpers - Pastel dark with high contrast text
  const getStatusBadge = (s: "TODO" | "IN_PROGRESS" | "DONE") => {
    switch (s) {
      case "TODO":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60 shadow-2xs">
            <Circle className="w-2.5 h-2.5 text-slate-400" />
            <span>To Do</span>
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/25 shadow-2xs">
            <Clock className="w-2.5 h-2.5 text-sky-400" />
            <span>In Progress</span>
          </span>
        );
      case "DONE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-2xs">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            <span>Done</span>
          </span>
        );
    }
  };

  const getPriorityBadge = (p: "LOW" | "MEDIUM" | "HIGH") => {
    switch (p) {
      case "HIGH":
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/25">
            High
          </span>
        );
      case "MEDIUM":
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/25">
            Medium
          </span>
        );
      case "LOW":
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            Low
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* Intro Hero Header */}
      <div className="text-center pb-10 border-b border-slate-800/80">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Assignment 1</span>
          <span>•</span>
          <span>Task & Team Management Foundation</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Welcome to <span className="text-indigo-400">TaskFlow</span>
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          A modern, minimalist task management application built with Next.js, Prisma, and PostgreSQL. Test the live CRUD operations below without requiring login.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Create Task Form */}
        <div className="lg:col-span-5 bg-[#111827]/90 p-6 rounded-xl border border-slate-800 shadow-xl shadow-black/20 backdrop-blur-xs">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-800/80">
            <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
              <Plus className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              Create New Task
            </h2>
          </div>

          {formError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-500/10 p-3 text-xs text-rose-300 border border-rose-500/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1.5 tracking-wide">
                Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Design Prisma Schema"
                className="w-full rounded-lg bg-[#0B0F19]/90 border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1.5 tracking-wide">
                Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add extra context or details..."
                className="w-full rounded-lg bg-[#0B0F19]/90 border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition resize-y"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1.5 tracking-wide">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-lg bg-[#0B0F19]/90 border border-slate-800 px-2.5 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition"
                >
                  <option value="TODO" className="bg-[#111827] text-slate-100">To Do</option>
                  <option value="IN_PROGRESS" className="bg-[#111827] text-slate-100">In Progress</option>
                  <option value="DONE" className="bg-[#111827] text-slate-100">Done</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1.5 tracking-wide">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full rounded-lg bg-[#0B0F19]/90 border border-slate-800 px-2.5 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition"
                >
                  <option value="LOW" className="bg-[#111827] text-slate-100">Low</option>
                  <option value="MEDIUM" className="bg-[#111827] text-slate-100">Medium</option>
                  <option value="HIGH" className="bg-[#111827] text-slate-100">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1.5 tracking-wide">
                Due Date <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg bg-[#0B0F19]/90 border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 active:scale-[0.98] disabled:opacity-50 transition"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Task</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Task List with Status Filter */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#111827]/90 p-4 rounded-xl border border-slate-800 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Tasks List ({filteredTasks.length})
              </h2>
            </div>

            {/* Filter buttons - Capsule design */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Filter:</span>
              </span>
              {(["ALL", "TODO", "IN_PROGRESS", "DONE"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    statusFilter === filter
                      ? "bg-indigo-600 text-white shadow-xs shadow-indigo-600/30"
                      : "bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50"
                  }`}
                >
                  {filter === "ALL" ? "All" : filter === "TODO" ? "To Do" : filter === "IN_PROGRESS" ? "In Progress" : "Done"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="bg-[#111827]/60 rounded-xl border border-slate-800/80 p-12 text-center text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-400 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Fetching tasks from Supabase...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="bg-[#111827]/60 rounded-xl border border-dashed border-slate-800 p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-200">No tasks found</h3>
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
                  className="bg-[#111827]/90 p-4 rounded-xl border border-slate-800 hover:border-slate-700/80 hover:shadow-lg hover:shadow-black/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-100 text-sm tracking-tight">{task.title}</h3>
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                    </div>
                    {task.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{task.description}</p>
                    )}
                    {task.dueDate && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                    <button
                      onClick={() => openEditModal(task)}
                      className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
                      title="Edit Task"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id, task.title)}
                      className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal in Dark Theme */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-[#111827] p-6 shadow-2xl border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h3 className="text-base font-semibold text-white">Edit Task</h3>
              <button
                onClick={() => setEditingTask(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {editError && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-500/10 p-3 text-xs text-rose-300 border border-rose-500/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateTask} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1.5 tracking-wide">
                  Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-lg bg-[#0B0F19]/90 border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1.5 tracking-wide">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-lg bg-[#0B0F19]/90 border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1.5 tracking-wide">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full rounded-lg bg-[#0B0F19]/90 border border-slate-800 px-2.5 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition"
                  >
                    <option value="TODO" className="bg-[#111827] text-slate-100">To Do</option>
                    <option value="IN_PROGRESS" className="bg-[#111827] text-slate-100">In Progress</option>
                    <option value="DONE" className="bg-[#111827] text-slate-100">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1.5 tracking-wide">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as any)}
                    className="w-full rounded-lg bg-[#0B0F19]/90 border border-slate-800 px-2.5 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition"
                  >
                    <option value="LOW" className="bg-[#111827] text-slate-100">Low</option>
                    <option value="MEDIUM" className="bg-[#111827] text-slate-100">Medium</option>
                    <option value="HIGH" className="bg-[#111827] text-slate-100">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1.5 tracking-wide">Due Date</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full rounded-lg bg-[#0B0F19]/90 border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 disabled:opacity-50 transition"
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
    </div>
  );
}
