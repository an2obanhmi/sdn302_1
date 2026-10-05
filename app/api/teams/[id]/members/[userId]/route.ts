import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string; userId: string }>;
}

// DELETE /api/teams/:id/members/:userId - Remove a member from a team (Owner only)
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

    // Owner check: Owner can remove any member, or a user can leave the team themselves
    const isOwner = team.ownerId === auth.userId;
    const isSelfLeaving = auth.userId === targetUserId;

    if (!isOwner && !isSelfLeaving) {
      return NextResponse.json(
        { error: "Forbidden. Only the team owner can remove other members." },
        { status: 403 }
      );
    }

    // Team owner cannot remove themselves (must delete team or transfer ownership)
    if (targetUserId === team.ownerId) {
      return NextResponse.json(
        { error: "The team owner cannot be removed from the team." },
        { status: 400 }
      );
    }

    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Member not found in this team." }, { status: 404 });
    }

    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
    });

    return NextResponse.json({ message: "Member removed successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/teams/:id/members/:userId error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
