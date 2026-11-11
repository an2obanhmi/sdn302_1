import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { canUpdateTask, canDeleteTask } from "@/lib/permissions";
import { createNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";
import { broadcastTeamEvent } from "@/lib/realtime";
import { TaskStatus, Priority, NotificationType } from "@prisma/client";

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

    // Role check for team tasks
    let actorRole = null;
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

      actorRole = membership.role;

      // Advanced RBAC: Owner & Admin can update any task; Member can update only their own tasks
      const isAllowed = canUpdateTask(actorRole, auth.userId, {
        creatorId: task.creatorId,
        assigneeId: task.assigneeId,
      });

      if (!isAllowed) {
        return NextResponse.json(
          {
            error:
              "Forbidden. Team Members can only manage tasks they created or are assigned to. Admins and Owners can manage all tasks.",
          },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { title, description, status, priority, dueDate, assigneeId } = body;

    // Validate assignee if provided and belongs to a team
    let newAssigneeUser = null;
    if (assigneeId !== undefined && assigneeId !== null && assigneeId !== "" && task.teamId) {
      const isAssigneeMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: task.teamId,
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
      newAssigneeUser = isAssigneeMember.user;
    }

    const previousAssigneeId = task.assigneeId;
    const previousStatus = task.status;

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

    if (task.teamId && auth) {
      // 1. Notify newly assigned user
      if (
        assigneeId &&
        assigneeId !== previousAssigneeId &&
        assigneeId !== auth.userId
      ) {
        await createNotification({
          userId: assigneeId,
          type: NotificationType.TASK_ASSIGNED,
          title: "New Task Assigned",
          message: `${auth.name} assigned you to "${updatedTask.title}".`,
          link: `/teams/${task.teamId}`,
        });
      }

      // 2. Notify assignee or creator if status changed
      if (status && status !== previousStatus) {
        const notifyTarget =
          updatedTask.assigneeId && updatedTask.assigneeId !== auth.userId
            ? updatedTask.assigneeId
            : updatedTask.creatorId !== auth.userId
            ? updatedTask.creatorId
            : null;

        if (notifyTarget) {
          await createNotification({
            userId: notifyTarget,
            type: NotificationType.TASK_UPDATED,
            title: "Task Status Updated",
            message: `${auth.name} moved "${updatedTask.title}" to ${status}.`,
            link: `/teams/${task.teamId}`,
          });
        }

        // Log status change activity
        await logActivity({
          teamId: task.teamId,
          userId: auth.userId,
          action: "UPDATED_TASK_STATUS",
          details: `${auth.name} moved "${updatedTask.title}" from ${previousStatus} to ${status}`,
        });
      } else {
        // Log general edit activity
        await logActivity({
          teamId: task.teamId,
          userId: auth.userId,
          action: "UPDATED_TASK",
          details: `${auth.name} updated task "${updatedTask.title}"`,
        });
      }

      // 3. Broadcast real-time live update to team
      await broadcastTeamEvent(task.teamId, "task:updated", updatedTask);
    }

    return NextResponse.json({ task: updatedTask }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/tasks/:id error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE /api/tasks/:id - Delete a task
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
          { error: "Forbidden. You are not a member of this team." },
          { status: 403 }
        );
      }

      // RBAC check: Owner and Admin can delete ANY task; Member can only delete their own task
      const isAllowed = canDeleteTask(membership.role, auth.userId, {
        creatorId: task.creatorId,
        assigneeId: task.assigneeId,
      });

      if (!isAllowed) {
        return NextResponse.json(
          {
            error:
              "Forbidden. Team Members can only delete tasks they created or are assigned to. Admins and Owners can delete any task.",
          },
          { status: 403 }
        );
      }

      // Log activity before delete
      await logActivity({
        teamId: task.teamId,
        userId: auth.userId,
        action: "DELETED_TASK",
        details: `${auth.name} deleted task "${task.title}"`,
      });

      // Broadcast real-time deletion
      await broadcastTeamEvent(task.teamId, "task:deleted", { id: task.id, title: task.title });
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
