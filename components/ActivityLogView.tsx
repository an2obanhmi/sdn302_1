"use client";

import { useEffect, useState } from "react";
import {
  History,
  PlusCircle,
  Edit,
  Trash2,
  UserPlus,
  UserCheck,
  UserMinus,
  CheckCircle2,
  Loader2,
  Clock,
} from "lucide-react";

interface ActivityItem {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ActivityLogViewProps {
  teamId: string;
  realtimeActivities: ActivityItem[];
}

export default function ActivityLogView({ teamId, realtimeActivities }: ActivityLogViewProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/teams/${teamId}/activity`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [teamId]);

  useEffect(() => {
    if (realtimeActivities.length > 0) {
      const latest = realtimeActivities[realtimeActivities.length - 1];
      setActivities((prev) => {
        if (prev.some((a) => a.id === latest.id)) return prev;
        return [latest, ...prev];
      });
    }
  }, [realtimeActivities]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATED_TASK":
        return <PlusCircle className="w-4 h-4 text-emerald-400" />;
      case "UPDATED_TASK":
      case "UPDATED_TASK_STATUS":
        return <Edit className="w-4 h-4 text-sky-400" />;
      case "DELETED_TASK":
        return <Trash2 className="w-4 h-4 text-rose-400" />;
      case "ADDED_MEMBER":
        return <UserPlus className="w-4 h-4 text-indigo-400" />;
      case "UPDATED_ROLE":
        return <UserCheck className="w-4 h-4 text-amber-400" />;
      case "REMOVED_MEMBER":
        return <UserMinus className="w-4 h-4 text-rose-400" />;
      default:
        return <History className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="bg-[#111827]/90 rounded-2xl border border-slate-800 shadow-sm p-6 sm:p-7">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Team Audit Trail & Activity Log</h3>
            <p className="text-xs text-slate-400">Real-time chronicle of team changes, task assignments, and member roles</p>
          </div>
        </div>

        <span className="text-xs text-slate-400 font-mono bg-[#0B0F19] px-2.5 py-1 rounded-lg border border-slate-800">
          {activities.length} events logged
        </span>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-400 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading audit history...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="py-12 text-center">
          <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-300">No activity recorded yet</p>
          <p className="text-[11px] text-slate-500 mt-1">Actions taken by members will automatically appear here live.</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
          {activities.map((act) => (
            <div key={act.id} className="relative flex items-start gap-3 text-xs">
              {/* Timeline marker */}
              <div className="absolute -left-6 mt-0.5 p-1 rounded-full bg-[#111827] border border-slate-700 ring-2 ring-[#0B0F19]">
                {getActionIcon(act.action)}
              </div>

              <div className="flex-1 bg-[#0B0F19] p-3.5 rounded-xl border border-slate-800/80 hover:border-slate-700/60 transition">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-slate-200">{act.details}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(act.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span>Triggered by:</span>
                  <span className="font-medium text-indigo-300">{act.user.name}</span>
                  <span className="text-slate-600">({act.user.email})</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
