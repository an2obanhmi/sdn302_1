import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { isOwnerOrAdmin, canDeleteTeam } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/teams/:id - Get team details, including members, tasks, and role
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify current user is a member of this team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: id,
          userId: auth.userId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Access denied. You are not a member of this team." },
        { status: 403 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { joinedAt: "asc" },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        team: {
          ...team,
          currentUserRole: membership.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/teams/:id error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/teams/:id - Update team info (Owner or Admin)
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: id,
          userId: auth.userId,
        },
      },
    });

    if (!membership || !isOwnerOrAdmin(membership.role)) {
      return NextResponse.json(
        { error: "Forbidden. Only Team Owners and Admins can update team details." },
        { status: 403 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 });
    }

    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description !== undefined ? (description ? description.trim() : null) : team.description,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    await logActivity({
      teamId: id,
      userId: auth.userId,
      action: "UPDATED_TEAM",
      details: `${auth.name} updated team details`,
    });

    return NextResponse.json({ team: updatedTeam }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/teams/:id error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/teams/:id - Delete a team (Owner ONLY)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: id,
          userId: auth.userId,
        },
      },
    });

    if (!membership || !canDeleteTeam(membership.role)) {
      return NextResponse.json(
        { error: "Forbidden. Admins and Members cannot delete the team. Only the Team Owner can delete this team." },
        { status: 403 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    await prisma.team.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Team deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/teams/:id error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
