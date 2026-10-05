import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET /api/teams - List teams the current user belongs to
export async function GET(request: Request) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await prisma.teamMember.findMany({
      where: { userId: auth.userId },
      include: {
        team: {
          include: {
            owner: {
              select: { id: true, name: true, email: true },
            },
            _count: {
              select: { members: true, tasks: true },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const teams = memberships.map((m) => ({
      ...m.team,
      userRole: m.role,
      joinedAt: m.joinedAt,
    }));

    return NextResponse.json({ teams }, { status: 200 });
  } catch (error) {
    console.error("GET /api/teams error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/teams - Create a new team
export async function POST(request: Request) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 });
    }

    // Create team and assign user as OWNER in a transaction
    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: {
          name: name.trim(),
          description: description ? description.trim() : null,
          ownerId: auth.userId,
        },
      });

      await tx.teamMember.create({
        data: {
          teamId: newTeam.id,
          userId: auth.userId,
          role: "OWNER",
        },
      });

      return newTeam;
    });

    const createdTeam = await prisma.team.findUnique({
      where: { id: team.id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json({ team: createdTeam }, { status: 201 });
  } catch (error) {
    console.error("POST /api/teams error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
