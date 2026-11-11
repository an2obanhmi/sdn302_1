import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { isOwnerOrAdmin } from "@/lib/permissions";
import { createNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";
import { broadcastTeamEvent } from "@/lib/realtime";
import { NotificationType, Role } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/teams/:id/members - Add a member to a team by email (Owner or Admin)
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: teamId } = await params;
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

    // Check actor membership and role (Owner or Admin required)
    const actorMembership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: auth.userId,
        },
      },
    });

    if (!actorMembership || !isOwnerOrAdmin(actorMembership.role)) {
      return NextResponse.json(
        { error: "Forbidden. Only Team Owners and Admins can add members." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role = Role.MEMBER } = body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Valid user email is required" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: `User with email "${email}" not found. The user must register an account first.` },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "This user is already a member of the team." },
        { status: 409 }
      );
    }

    // Role assignment: Only Owner can assign ADMIN upon inviting; otherwise default to MEMBER
    const assignedRole =
      actorMembership.role === Role.OWNER && role === Role.ADMIN ? Role.ADMIN : Role.MEMBER;

    const newMember = await prisma.teamMember.create({
      data: {
        teamId,
        userId: targetUser.id,
        role: assignedRole,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // 1. Notify the invited user
    await createNotification({
      userId: targetUser.id,
      type: NotificationType.TEAM_INVITED,
      title: "Added to Team",
      message: `${auth.name} added you to team "${team.name}" as ${assignedRole}.`,
      link: `/teams/${teamId}`,
    });

    // 2. Log activity
    await logActivity({
      teamId,
      userId: auth.userId,
      action: "ADDED_MEMBER",
      details: `${auth.name} added ${targetUser.name} as ${assignedRole}`,
    });

    // 3. Broadcast real-time update
    await broadcastTeamEvent(teamId, "member:updated", {
      action: "added",
      member: newMember,
    });

    return NextResponse.json(
      { message: "Member added successfully", member: newMember },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/teams/:id/members error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
