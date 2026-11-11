import { PrismaClient, Role, TaskStatus, Priority, NotificationType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database for Assignment 3 & 4...");

  const salt = await bcrypt.genSalt(10);
  const graderPassword = await bcrypt.hash("Grader123@", salt);
  const alicePassword = await bcrypt.hash("Alice123@", salt);
  const bobPassword = await bcrypt.hash("Bob123@", salt);

  // 1. Create or upsert Grader user (Team Owner)
  const grader = await prisma.user.upsert({
    where: { email: "grader@test.com" },
    update: {},
    create: {
      name: "Dr. Grader",
      email: "grader@test.com",
      password: graderPassword,
    },
  });

  // 2. Create or upsert Alice user (Team Admin)
  const alice = await prisma.user.upsert({
    where: { email: "alice@test.com" },
    update: {},
    create: {
      name: "Alice Nguyen",
      email: "alice@test.com",
      password: alicePassword,
    },
  });

  // 3. Create or upsert Bob user (Team Member)
  const bob = await prisma.user.upsert({
    where: { email: "bob@test.com" },
    update: {},
    create: {
      name: "Bob Tran",
      email: "bob@test.com",
      password: bobPassword,
    },
  });

  // 4. Create or update Demo Team
  let team = await prisma.team.findFirst({
    where: { ownerId: grader.id, name: "Core Engineering Team" },
  });

  if (!team) {
    team = await prisma.team.create({
      data: {
        name: "Core Engineering Team",
        description: "Primary engineering squad for TaskFlow web development and real-time collaboration.",
        ownerId: grader.id,
      },
    });
  }

  // Ensure Memberships with 3 Distinct Roles: OWNER, ADMIN, MEMBER
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId: grader.id } },
    update: { role: Role.OWNER },
    create: { teamId: team.id, userId: grader.id, role: Role.OWNER },
  });

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId: alice.id } },
    update: { role: Role.ADMIN },
    create: { teamId: team.id, userId: alice.id, role: Role.ADMIN },
  });

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId: bob.id } },
    update: { role: Role.MEMBER },
    create: { teamId: team.id, userId: bob.id, role: Role.MEMBER },
  });

  // Ensure Tasks Exist
  const existingTasksCount = await prisma.task.count({ where: { teamId: team.id } });
  if (existingTasksCount === 0) {
    await prisma.task.createMany({
      data: [
        {
          title: "Setup Prisma ORM & Database Schemas",
          description: "Define User, Team, TeamMember and Task relational models.",
          status: TaskStatus.DONE,
          priority: Priority.HIGH,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
          teamId: team.id,
          assigneeId: grader.id,
          creatorId: grader.id,
        },
        {
          title: "Implement Real-time WebSockets & Live Kanban Updates",
          description: "Sync task creation, updates, and drag-and-drop live across all open sessions.",
          status: TaskStatus.IN_PROGRESS,
          priority: Priority.HIGH,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
          teamId: team.id,
          assigneeId: alice.id,
          creatorId: grader.id,
        },
        {
          title: "Build Team Chat Room with Persisted History",
          description: "Send and receive real-time messages instantly with unread counters.",
          status: TaskStatus.TODO,
          priority: Priority.MEDIUM,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 8),
          teamId: team.id,
          assigneeId: bob.id,
          creatorId: alice.id,
        },
      ],
    });
  }

  // Seed Initial Chat Messages if empty
  const messageCount = await prisma.chatMessage.count({ where: { teamId: team.id } });
  if (messageCount === 0) {
    await prisma.chatMessage.createMany({
      data: [
        {
          teamId: team.id,
          senderId: grader.id,
          content: "Welcome everyone to Core Engineering Team! Let's build real-time collaboration today 🚀",
          createdAt: new Date(Date.now() - 1000 * 60 * 30),
        },
        {
          teamId: team.id,
          senderId: alice.id,
          content: "Hi Dr. Grader! I'm reviewing the live task board and permissions now.",
          createdAt: new Date(Date.now() - 1000 * 60 * 20),
        },
        {
          teamId: team.id,
          senderId: bob.id,
          content: "Awesome, I'm ready to test real-time chat and notifications across multiple windows!",
          createdAt: new Date(Date.now() - 1000 * 60 * 10),
        },
      ],
    });
  }

  // Seed Initial Notifications
  const notifCount = await prisma.notification.count();
  if (notifCount === 0) {
    await prisma.notification.createMany({
      data: [
        {
          userId: alice.id,
          type: NotificationType.TASK_ASSIGNED,
          title: "New Task Assigned",
          message: 'You have been assigned to "Implement Real-time WebSockets & Live Kanban Updates"',
          link: `/teams/${team.id}`,
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60),
        },
        {
          userId: bob.id,
          type: NotificationType.TEAM_INVITED,
          title: "Added to Team",
          message: 'Dr. Grader added you to "Core Engineering Team" as Member.',
          link: `/teams/${team.id}`,
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 90),
        },
        {
          userId: grader.id,
          type: NotificationType.TASK_UPDATED,
          title: "Task Status Updated",
          message: 'Alice Nguyen moved "Implement Real-time WebSockets" to In Progress.',
          link: `/teams/${team.id}`,
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 15),
        },
      ],
    });
  }

  // Seed Initial Activity Logs
  const logCount = await prisma.activityLog.count({ where: { teamId: team.id } });
  if (logCount === 0) {
    await prisma.activityLog.createMany({
      data: [
        {
          teamId: team.id,
          userId: grader.id,
          action: "CREATED_TEAM",
          details: 'Dr. Grader created team "Core Engineering Team"',
          createdAt: new Date(Date.now() - 1000 * 60 * 120),
        },
        {
          teamId: team.id,
          userId: grader.id,
          action: "ADDED_MEMBER",
          details: 'Dr. Grader added Alice Nguyen as ADMIN',
          createdAt: new Date(Date.now() - 1000 * 60 * 100),
        },
        {
          teamId: team.id,
          userId: grader.id,
          action: "ADDED_MEMBER",
          details: 'Dr. Grader added Bob Tran as MEMBER',
          createdAt: new Date(Date.now() - 1000 * 60 * 80),
        },
        {
          teamId: team.id,
          userId: grader.id,
          action: "ASSIGNED_TASK",
          details: 'Dr. Grader assigned "Implement Real-time WebSockets" to Alice Nguyen',
          createdAt: new Date(Date.now() - 1000 * 60 * 60),
        },
      ],
    });
  }

  console.log("Seeding finished successfully!");
  console.log("3 Accounts ready:");
  console.log("  1. Owner:  grader@test.com | Grader123@");
  console.log("  2. Admin:  alice@test.com  | Alice123@");
  console.log("  3. Member: bob@test.com    | Bob123@");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
