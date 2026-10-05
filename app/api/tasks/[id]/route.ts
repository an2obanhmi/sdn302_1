import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { TaskStatus, Priority } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/tasks/:id - Update a task
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        team: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if user is a member of the team
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
        { error: "Forbidden. You are not a member of this team." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, status, priority, dueDate, assigneeId } = body;

    // Validate assignee if provided
    if (assigneeId !== undefined && assigneeId !== null && assigneeId !== "") {
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
        description: description !== undefined ? (description ? description.trim() : null) : task.description,
        status: status && Object.values(TaskStatus).includes(status) ? status : task.status,
        priority: priority && Object.values(Priority).includes(priority) ? priority : task.priority,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : task.dueDate,
        assigneeId: assigneeId !== undefined ? (assigneeId ? assigneeId : null) : task.assigneeId,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ task: updatedTask }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/tasks/:id error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/tasks/:id - Delete a task (Creator, Assignee, or Team Owner only)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        team: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Role check: Only creator, assignee, or team owner can delete
    const isCreator = task.creatorId === auth.userId;
    const isAssignee = task.assigneeId === auth.userId;
    const isOwner = task.team.ownerId === auth.userId;

    if (!isCreator && !isAssignee && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden. Only the task creator, assignee, or team owner can delete this task." },
        { status: 403 }
      );
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Task deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/tasks/:id error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
