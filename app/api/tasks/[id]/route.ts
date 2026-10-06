import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { TaskStatus, Priority } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/tasks/:id - Get a task by ID
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthUser(request);

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        team: {
          select: { id: true, name: true, ownerId: true },
        },
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // If task belongs to a team, verify user is an authenticated member
    if (task.teamId) {
      if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const isMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: task.teamId,
            userId: auth.userId,
          },
        },
      });

      if (!isMember) {
        return NextResponse.json(
          { error: "Forbidden. You are not a member of this task's team." },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ task }, { status: 200 });
  } catch (error) {
    console.error("GET /api/tasks/:id error:", error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

// PUT /api/tasks/:id - Update a task
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthUser(request);

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        team: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Role check: If task belongs to a team, user must be authenticated & member of that team
    if (task.teamId) {
      if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const membership = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: task.teamId,
            userId: auth.userId,
          },
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: "Forbidden. Only members of this team can update tasks." },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { title, description, status, priority, dueDate, assigneeId } = body;

    // Validate assignee if provided and belongs to a team
    if (assigneeId !== undefined && assigneeId !== null && assigneeId !== "" && task.teamId) {
      const isAssigneeMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: task.teamId,
            userId: assigneeId,
          },
        },
      });

      if (!isAssigneeMember) {
        return NextResponse.json(
          { error: "Assignee must be a member of this team" },
          { status: 400 }
        );
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : task.title,
        description:
          description !== undefined
            ? description
              ? description.trim()
              : null
            : task.description,
        status: status && Object.values(TaskStatus).includes(status) ? status : task.status,
        priority: priority && Object.values(Priority).includes(priority) ? priority : task.priority,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : task.dueDate,
        assigneeId: assigneeId !== undefined ? (assigneeId ? assigneeId : null) : task.assigneeId,
      },
      include: {
        team: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ task: updatedTask }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/tasks/:id error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE /api/tasks/:id - Delete a task (Creator, Assignee, or Team Owner only for team tasks)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthUser(request);

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        team: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // If task belongs to a team, enforce strict Assignment 2 RBAC:
    // "Only the task creator, the assignee, or the team Owner can delete a task."
    if (task.teamId) {
      if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const isCreator = task.creatorId === auth.userId;
      const isAssignee = task.assigneeId === auth.userId;
      const isTeamOwner = task.team?.ownerId === auth.userId;

      if (!isCreator && !isAssignee && !isTeamOwner) {
        return NextResponse.json(
          {
            error:
              "Forbidden. Only the task creator, the assignee, or the team Owner can delete a task.",
          },
          { status: 403 }
        );
      }
    }

    // Delete task from database
    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Task deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/tasks/:id error:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
