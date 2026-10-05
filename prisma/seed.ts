import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const salt = await bcrypt.genSalt(10);
  const graderPassword = await bcrypt.hash("Grader123@", salt);
  const alicePassword = await bcrypt.hash("Alice123@", salt);

  // 1. Create or upsert Grader user
  const grader = await prisma.user.upsert({
    where: { email: "grader@test.com" },
    update: {},
    create: {
      name: "Dr. Grader",
      email: "grader@test.com",
      password: graderPassword,
    },
  });

  // 2. Create or upsert Alice user
  const alice = await prisma.user.upsert({
    where: { email: "alice@test.com" },
    update: {},
    create: {
      name: "Alice Nguyen",
      email: "alice@test.com",
      password: alicePassword,
    },
  });

  // 3. Create Demo Team if not exists
  let team = await prisma.team.findFirst({
    where: { ownerId: grader.id, name: "Core Engineering Team" },
  });

  if (!team) {
    team = await prisma.team.create({
      data: {
        name: "Core Engineering Team",
        description: "Primary engineering squad for TaskFlow web development and cloud infrastructure.",
        ownerId: grader.id,
      },
    });

    // Add Grader as OWNER
    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: grader.id,
        role: "OWNER",
      },
    });

    // Add Alice as MEMBER
    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: alice.id,
        role: "MEMBER",
      },
    });

    // Create Sample Tasks
    await prisma.task.createMany({
      data: [
        {
          title: "Setup Prisma ORM & Database Schemas",
          description: "Define User, Team, TeamMember and Task relational models.",
          status: "DONE",
          priority: "HIGH",
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // +3 days
          teamId: team.id,
          assigneeId: grader.id,
          creatorId: grader.id,
        },
        {
          title: "Implement Role-Based Authorization & REST API",
          description: "Build endpoints with strict access controls for team owners and members.",
          status: "IN_PROGRESS",
          priority: "HIGH",
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // +7 days
          teamId: team.id,
          assigneeId: alice.id,
          creatorId: grader.id,
        },
        {
          title: "Design Interactive Kanban Board UI",
          description: "Add bonus Kanban column board with status badges and live filtering.",
          status: "TODO",
          priority: "MEDIUM",
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10), // +10 days
          teamId: team.id,
          assigneeId: null,
          creatorId: grader.id,
        },
      ],
    });
  }

  console.log("Seeding finished successfully!");
  console.log("Demo Accounts created:");
  console.log("  1. Email: grader@test.com | Password: Grader123@");
  console.log("  2. Email: alice@test.com  | Password: Alice123@");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
