"use client";

import { TaskData } from "./TaskModal";
import { Calendar, User, Edit, Trash2 } from "lucide-react";

export interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
  teamId: string;
  assigneeId: string | null;
  creatorId: string;
  createdAt: string;
  assignee: { id: string; name: string; email: string } | null;
  creator: { id: string; name: string; email: string };
}

interface KanbanBoardProps {
  tasks: TaskItem[];
  currentUserId: string;
  teamOwnerId: string;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateStatus: (taskId: string, newStatus: "TODO" | "IN_PROGRESS" | "DONE") => void;
}

const COLUMNS: { id: "TODO" | "IN_PROGRESS" | "DONE"; title: string; color: string }[] = [
  { id: "TODO", title: "To Do", color: "border-slate-700/60 bg-slate-800 text-slate-300" },
  { id: "IN_PROGRESS", title: "In Progress", color: "border-sky-500/25 bg-sky-500/10 text-sky-400" },
  { id: "DONE", title: "Done", color: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400" },
];

export default function KanbanBoard({
  tasks,
  currentUserId,
  teamOwnerId,
  onEditTask,
  onDeleteTask,
  onUpdateStatus,
}: KanbanBoardProps) {
  const getPriorityBadge = (priority: "LOW" | "MEDIUM" | "HIGH") => {
    switch (priority) {
      case "HIGH":
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/25">High</span>;
      case "MEDIUM":
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/25">Medium</span>;
      case "LOW":
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">Low</span>;
    }
  };

  const canDelete = (task: TaskItem) => {
    return (
      task.creatorId === currentUserId ||
      task.assigneeId === currentUserId ||
      teamOwnerId === currentUserId
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);

        return (
          <div key={col.id} className="flex flex-col bg-[#111827]/60 rounded-xl p-4 border border-slate-800">
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${col.color}`}>
                  {col.title}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {colTasks.length}
                </span>
              </div>
            </div>

            {/* Task Cards */}
            <div className="flex flex-col gap-3 min-h-[200px]">
              {colTasks.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  No tasks in this column
                </div>
              ) : (
                colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-[#111827] rounded-xl p-4 shadow-sm border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h4 className="text-sm font-semibold text-slate-100 leading-snug">
                          {task.title}
                        </h4>
                        {getPriorityBadge(task.priority)}
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        {task.dueDate ? (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span />
                        )}

                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>{task.assignee ? task.assignee.name : "Unassigned"}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1">
                          <select
                            value={task.status}
                            onChange={(e) =>
                              onUpdateStatus(task.id, e.target.value as "TODO" | "IN_PROGRESS" | "DONE")
                            }
                            className="text-[11px] font-medium bg-[#0B0F19] border border-slate-800 rounded px-1.5 py-0.5 text-slate-200 hover:border-slate-700 transition"
                          >
                            <option value="TODO" className="bg-[#111827]">To Do</option>
                            <option value="IN_PROGRESS" className="bg-[#111827]">In Progress</option>
                            <option value="DONE" className="bg-[#111827]">Done</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEditTask(task)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
                            title="Edit Task"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {canDelete(task) && (
                            <button
                              onClick={() => onDeleteTask(task.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
