# TaskFlow - Task & Team Management Application

> **Assignment 1: Task & Team Management App: Project Setup, Prisma & Deployment**  
> Built with Next.js (App Router, TypeScript), Prisma ORM, PostgreSQL (Supabase), and Tailwind CSS.

---

## 🚀 Live Demo & Links
- **GitHub Repository**: [https://github.com/an2obanhmi/SDN302_1](https://github.com/an2obanhmi/SDN302_1)
- **Deployed Website (Vercel)**: *(Deployed live on Vercel)*

---

## 📋 Features Overview

### Core Assignment 1 Features
- **Public Task CRUD (No Auth Required)**:
  - Create new tasks with title, description, status, priority, and due date.
  - List and view all tasks directly on the homepage with live data from Supabase PostgreSQL.
  - Update tasks in-place with an interactive modal.
  - Delete tasks with confirmation.
  - Auto-refreshing list without full page reload.
- **Responsive Layout & Navigation**: Clean header with navigation links (`Home`, `Teams`, `Login`) and placeholder page for Teams section.
- **Client-Side Validation**: Ensures task title is required before submission.
- **Status Filter (Bonus)**: Filter tasks by `All`, `To Do`, `In Progress`, or `Done`.
- **Automated CI Check (Bonus)**: GitHub Actions workflow (`.github/workflows/ci.yml`) running lint and build checks on push.

---

## 🗄️ Relational Database Schema & ERD

The application uses **Prisma ORM** connected to a cloud **PostgreSQL** database on Supabase.

### Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ Team : "owns"
    User ||--o{ TeamMember : "belongs to"
    User ||--o{ Task : "assigned"
    User ||--o{ Task : "created"
    Team ||--o{ TeamMember : "has"
    Team ||--o{ Task : "contains"

    User {
        String id PK
        String name
        String email UK
        String password
        DateTime createdAt
        DateTime updatedAt
    }

    Team {
        String id PK
        String name
        String description
        String ownerId FK
        DateTime createdAt
        DateTime updatedAt
    }

    TeamMember {
        String id PK
        String teamId FK
        String userId FK
        String role "OWNER | MEMBER"
        DateTime joinedAt
    }

    Task {
        String id PK
        String title
        String description
        String status "TODO | IN_PROGRESS | DONE"
        String priority "LOW | MEDIUM | HIGH"
        DateTime dueDate
        String teamId FK "Optional in Ass 1"
        String assigneeId FK "Optional in Ass 1"
        String creatorId FK "Optional in Ass 1"
        DateTime createdAt
        DateTime updatedAt
    }
```

---

## 📡 RESTful API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tasks` | Get all tasks (supports query `?status=TODO\|IN_PROGRESS\|DONE`) |
| `POST` | `/api/tasks` | Create a new task (body: `title`, `description`, `status`, `priority`, `dueDate`) |
| `GET` | `/api/tasks/:id` | Get details of a single task |
| `PUT` | `/api/tasks/:id` | Update task details or status |
| `DELETE` | `/api/tasks/:id` | Delete a task from the database |

---

## 🛠️ Tech Stack
- **Framework**: [Next.js](https://nextjs.org/) (App Router, Route Handlers, TypeScript)
- **Database**: [PostgreSQL (Supabase)](https://supabase.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/)
- **Deployment**: [Vercel](https://vercel.com/)
- **CI/CD**: GitHub Actions

---

## 💻 Local Setup Instructions

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/an2obanhmi/SDN302_1.git
cd SDN302_1
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase database credentials:
```bash
cp .env.example .env
```
In `.env`:
```env
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="your-jwt-secret-key"
```

### 3. Synchronize Database & Generate Prisma Client
```bash
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.
