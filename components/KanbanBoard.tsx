"use client";

import { TaskData } from "./TaskModal";
import { Calendar, User, MoreHorizontal, Edit, Trash2, ArrowRight } from "lucide-react";

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
  { id: "TODO", title: "To Do", color: "border-slate-300 bg-slate-50 text-slate-700" },
  { id: "IN_PROGRESS", title: "In Progress", color: "border-blue-300 bg-blue-50 text-blue-700" },
  { id: "DONE", title: "Done", color: "border-emerald-300 bg-emerald-50 text-emerald-700" },
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
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-700">High</span>;
      case "MEDIUM":
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-700">Medium</span>;
      case "LOW":
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-green-100 text-green-700">Low</span>;
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
          <div key={col.id} className="flex flex-col bg-gray-50 rounded-2xl p-4 border border-gray-200">
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${col.color}`}>
                  {col.title}
                </span>
                <span className="text-xs font-semibold text-gray-500">
                  {colTasks.length}
                </span>
              </div>
            </div>

            {/* Task Cards */}
            <div className="flex flex-col gap-3 min-h-[200px]">
              {colTasks.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-6 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">
                  No tasks in this column
                </div>
              ) : (
                colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-xl p-4 shadow-xs border border-gray-200 hover:shadow-md transition flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h4 className="text-sm font-semibold text-gray-900 leading-snug">
                          {task.title}
                        </h4>
                        {getPriorityBadge(task.priority)}
                      </div>

                      {task.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        {task.dueDate ? (
                          <div className="flex items-center gap-1 text-[11px] text-gray-500">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span />
                        )}

                        <div className="flex items-center gap-1 text-[11px]">
                          <User className="w-3 h-3 text-gray-400" />
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
                            className="text-[11px] font-medium bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 text-gray-700 hover:bg-gray-100 transition"
                          >
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="DONE">Done</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEditTask(task)}
                            className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="Edit Task"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {canDelete(task) && (
                            <button
                              onClick={() => onDeleteTask(task.id)}
                              className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
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
