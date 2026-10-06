import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TaskStatus, Priority } from "@prisma/client";

// GET /api/tasks - List all tasks (public, with optional status filter)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");

    const where: { status?: TaskStatus } = {};
    if (statusParam && Object.values(TaskStatus).includes(statusParam as TaskStatus)) {
      where.status = statusParam as TaskStatus;
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        team: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// POST /api/tasks - Create a new task (public, no authentication required)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, status, priority, dueDate } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description && typeof description === "string" ? description.trim() : null,
        status: status && Object.values(TaskStatus).includes(status) ? status : "TODO",
        priority: priority && Object.values(Priority).includes(priority) ? priority : "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        team: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
