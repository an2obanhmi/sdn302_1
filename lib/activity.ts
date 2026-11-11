import prisma from "@/lib/prisma";
import { broadcastTeamEvent } from "@/lib/realtime";

export interface LogActivityParams {
  teamId: string;
  userId: string;
  action: string;
  details: string;
}

export async function logActivity(params: LogActivityParams) {
  try {
    const log = await prisma.activityLog.create({
      data: {
        teamId: params.teamId,
        userId: params.userId,
        action: params.action,
        details: params.details,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Broadcast new activity to team members
    await broadcastTeamEvent(params.teamId, "activity:new", log);

    return log;
  } catch (error) {
    console.error("Failed to log activity:", error);
    return null;
  }
}
