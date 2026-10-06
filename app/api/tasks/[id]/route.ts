import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TaskStatus, Priority } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/tasks/:id - Get a task by ID
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        team: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task }, { status: 200 });
  } catch (error) {
    console.error("GET /api/tasks/:id error:", error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

// PUT /api/tasks/:id - Update a task (public, Assignment 1)
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, status, priority, dueDate } = body;

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : existingTask.title,
        description:
          description !== undefined
            ? description
              ? description.trim()
              : null
            : existingTask.description,
        status: status && Object.values(TaskStatus).includes(status) ? status : existingTask.status,
        priority: priority && Object.values(Priority).includes(priority) ? priority : existingTask.priority,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existingTask.dueDate,
      },
      include: {
        team: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ task: updatedTask }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/tasks/:id error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE /api/tasks/:id - Delete a task (public, Assignment 1)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Task deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/tasks/:id error:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
