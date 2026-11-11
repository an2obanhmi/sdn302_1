import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { canChangeMemberRole, canRemoveMember } from "@/lib/permissions";
import { createNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";
import { broadcastTeamEvent } from "@/lib/realtime";
import { NotificationType, Role } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string; userId: string }>;
}

// DELETE /api/teams/:id/members/:userId - Remove a member from a team
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id: teamId, userId: targetUserId } = await params;
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const [actorMembership, targetMembership] = await Promise.all([
      prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: auth.userId } },
      }),
      prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: targetUserId } },
        include: { user: { select: { name: true } } },
      }),
    ]);

    if (!actorMembership) {
      return NextResponse.json({ error: "Forbidden. You are not in this team." }, { status: 403 });
    }

    if (!targetMembership) {
      return NextResponse.json({ error: "Member not found in this team." }, { status: 404 });
    }

    // Role check via permission system
    const isAllowed = canRemoveMember(
      actorMembership.role,
      auth.userId,
      targetMembership.role,
      targetUserId
    );

    if (!isAllowed) {
      return NextResponse.json(
        {
          error:
            "Forbidden. You do not have permission to remove this member. Admins can only remove Members, and Owners cannot be removed.",
        },
        { status: 403 }
      );
    }

    // Delete membership
    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
    });

    // Unassign tasks assigned to removed user in this team
    await prisma.task.updateMany({
      where: { teamId, assigneeId: targetUserId },
      data: { assigneeId: null },
    });

    // Log activity
    const isSelfLeaving = auth.userId === targetUserId;
    const actionDetails = isSelfLeaving
      ? `${auth.name} left the team`
      : `${auth.name} removed ${targetMembership.user.name} from the team`;

    await logActivity({
      teamId,
      userId: auth.userId,
      action: "REMOVED_MEMBER",
      details: actionDetails,
    });

    // Broadcast real-time update
    await broadcastTeamEvent(teamId, "member:updated", {
      action: "removed",
      userId: targetUserId,
    });

    return NextResponse.json({ message: "Member removed successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/teams/:id/members/:userId error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/teams/:id/members/:userId - Change a member's role (Owner or Admin)
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id: teamId, userId: targetUserId } = await params;
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const [actorMembership, targetMembership] = await Promise.all([
      prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: auth.userId } },
      }),
      prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: targetUserId } },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
    ]);

    if (!actorMembership) {
      return NextResponse.json({ error: "Forbidden. You are not in this team." }, { status: 403 });
    }

    if (!targetMembership) {
      return NextResponse.json({ error: "Target member not found in this team." }, { status: 404 });
    }

    const body = await request.json();
    const { role: newRole } = body;

    if (!newRole || (newRole !== Role.ADMIN && newRole !== Role.MEMBER)) {
      return NextResponse.json(
        { error: "Invalid role specified. Role can be ADMIN or MEMBER." },
        { status: 400 }
      );
    }

    // Role check via permission system
    const isAllowed = canChangeMemberRole(
      actorMembership.role,
      targetMembership.role,
      newRole
    );

    if (!isAllowed) {
      return NextResponse.json(
        {
          error:
            "Forbidden. Only Owners can change any member's role, and Admins cannot alter the Owner's role.",
        },
        { status: 403 }
      );
    }

    // Update role in database
    const updatedMember = await prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
      data: {
        role: newRole,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify the member
    await createNotification({
      userId: targetUserId,
      type: NotificationType.ROLE_UPDATED,
      title: "Role Updated",
      message: `Your role in "${team.name}" has been changed to ${newRole} by ${auth.name}.`,
      link: `/teams/${teamId}`,
    });

    // Log activity
    await logActivity({
      teamId,
      userId: auth.userId,
      action: "UPDATED_ROLE",
      details: `${auth.name} changed ${targetMembership.user.name}'s role from ${targetMembership.role} to ${newRole}`,
    });

    // Broadcast real-time update
    await broadcastTeamEvent(teamId, "member:updated", {
      action: "role_changed",
      member: updatedMember,
    });

    return NextResponse.json(
      { message: "Member role updated successfully", member: updatedMember },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/teams/:id/members/:userId error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
