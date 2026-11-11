import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";
import { broadcastTeamEvent } from "@/lib/realtime";
import { TaskStatus, Priority, Prisma, NotificationType } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/teams/:id/tasks - List tasks for a team
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: teamId } = await params;
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is member of this team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
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

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const priorityParam = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");
    const search = searchParams.get("search");

    const where: Prisma.TaskWhereInput = {
      teamId,
    };

    if (statusParam && Object.values(TaskStatus).includes(statusParam as TaskStatus)) {
      where.status = statusParam as TaskStatus;
    }

    if (priorityParam && Object.values(Priority).includes(priorityParam as Priority)) {
      where.priority = priorityParam as Priority;
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
        { description: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error) {
    console.error("GET /api/teams/:id/tasks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/teams/:id/tasks - Create a new task (any team member)
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: teamId } = await params;
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is member of this team
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: auth.userId,
        },
      },
      include: { team: { select: { name: true } } },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Access denied. Only team members can create tasks." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, status, priority, dueDate, assigneeId } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    // Validate assignee if provided
    let assigneeUser = null;
    if (assigneeId) {
      const isAssigneeMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId: assigneeId,
          },
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      if (!isAssigneeMember) {
        return NextResponse.json(
          { error: "Assignee must be a member of this team" },
          { status: 400 }
        );
      }
      assigneeUser = isAssigneeMember.user;
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        status: status && Object.values(TaskStatus).includes(status) ? status : "TODO",
        priority: priority && Object.values(Priority).includes(priority) ? priority : "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        teamId,
        assigneeId: assigneeId || null,
        creatorId: auth.userId,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    // 1. Notify Assignee if assigned to someone else
    if (assigneeId && assigneeId !== auth.userId) {
      await createNotification({
        userId: assigneeId,
        type: NotificationType.TASK_ASSIGNED,
        title: "New Task Assigned",
        message: `${auth.name} assigned you to "${task.title}" in team "${membership.team.name}".`,
        link: `/teams/${teamId}`,
      });
    }

    // 2. Log activity
    await logActivity({
      teamId,
      userId: auth.userId,
      action: "CREATED_TASK",
      details: `${auth.name} created task "${task.title}"${
        assigneeUser ? ` (assigned to ${assigneeUser.name})` : ""
      }`,
    });

    // 3. Broadcast real-time live update to all team members
    await broadcastTeamEvent(teamId, "task:created", task);

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("POST /api/teams/:id/tasks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
