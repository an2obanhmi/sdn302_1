# TaskFlow - Task & Team Management Web Application

> **Assignment 2: Task & Team Management App: CRUD API with Authentication**  
> Built with Next.js (App Router, Route Handlers), Prisma ORM, PostgreSQL (Supabase), and Tailwind CSS.

---

## 🚀 Live Demo & Repository
- **GitHub Repository**: [https://github.com/an2obanhmi/SDN302_1](https://github.com/an2obanhmi/SDN302_1)
- **Deployed URL**: *(Configured on Vercel)*

---

## 🔑 Demo & Test Account (For Grading)
The system supports self-registration with immediate login (no confirmation link required), or you can use the pre-seeded grading account:

- **Email**: `grader@test.com`
- **Password**: `Grader123@`
- **Status**: Email-verified / ready to log in immediately

---

## 🛠️ Tech Stack & Architecture
- **Framework**: [Next.js](https://nextjs.org/) (App Router, Route Handlers, TypeScript)
- **Database**: [PostgreSQL (Supabase)](https://supabase.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: JWT (JSON Web Tokens) with secure HTTP-only Cookies & `bcryptjs` password hashing
- **Styling**: Tailwind CSS & [Lucide Icons](https://lucide.dev/)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🗄️ Relational Data Model (Prisma)
- **User**: Represents registered accounts (`id`, `name`, `email`, `password`, `createdAt`, `updatedAt`).
- **Team**: Represents collaborative groups (`id`, `name`, `description`, `ownerId`, `createdAt`).
- **TeamMember**: Join table connecting users to teams with role-based access (`id`, `teamId`, `userId`, `role`: `OWNER` | `MEMBER`, `joinedAt`).
- **Task**: Represents individual team tasks (`id`, `title`, `description`, `status`: `TODO` | `IN_PROGRESS` | `DONE`, `priority`: `LOW` | `MEDIUM` | `HIGH`, `dueDate`, `teamId`, `assigneeId`, `creatorId`, `createdAt`).

---

## 📡 RESTful CRUD API Endpoints

### 1. Authentication
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | Public |
| `POST` | `/api/auth/login` | Login and receive JWT HTTP-only cookie | Public |
| `POST` | `/api/auth/logout` | Logout and clear session cookie | Authenticated |
| `GET` | `/api/auth/me` | Get current authenticated user profile | Authenticated |

### 2. Teams Management
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/teams` | List all teams current user belongs to | Authenticated |
| `POST` | `/api/teams` | Create a new team (creator becomes `OWNER`) | Authenticated |
| `GET` | `/api/teams/:id` | Get team details, members, and tasks | Team Members |
| `PUT` | `/api/teams/:id` | Update team details (name, description) | **Owner Only** |
| `DELETE` | `/api/teams/:id` | Delete team and cascade all tasks | **Owner Only** |

### 3. Team Members
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/teams/:id/members` | Add a member by email | **Owner Only** |
| `DELETE` | `/api/teams/:id/members/:userId` | Remove a member from the team | **Owner Only** |

### 4. Tasks Management
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/teams/:id/tasks` | List team tasks (supports status & priority filters) | Team Members |
| `POST` | `/api/teams/:id/tasks` | Create a task within the team | Team Members |
| `PUT` | `/api/tasks/:id` | Update task details, status, priority, or assignee | Team Members |
| `DELETE` | `/api/tasks/:id` | Delete a task | **Creator, Assignee, or Owner** |

---

## 🔒 Role-Based Authorization Matrix (RBAC)

| Action | Unauthenticated | Team Member | Team Owner |
|---|:---:|:---:|:---:|
| View Landing Page, Login, Register | ✅ | ✅ | ✅ |
| Create Team | ❌ | ✅ *(Becomes Owner)* | ✅ *(Becomes Owner)* |
| View Team Tasks & Members | ❌ | ✅ *(If in team)* | ✅ |
| Update Team Info | ❌ | ❌ | ✅ |
| Delete Team | ❌ | ❌ | ✅ |
| Invite / Remove Members | ❌ | ❌ | ✅ |
| Create Task | ❌ | ✅ | ✅ |
| Update Task Status / Details | ❌ | ✅ | ✅ |
| Delete Task | ❌ | ✅ *(If Creator or Assignee)* | ✅ |

---

## 🌟 Bonus Features Implemented
- **Interactive Kanban Board**: Switch between list/table view and 3-column Kanban board (*To Do*, *In Progress*, *Done*).
- **Task Search & Multi-Filter**: Real-time searching and filtering by Status and Priority.
- **Grader Quick-Fill Button**: 1-click credential auto-fill on login page for effortless grading.
- **Visual Status & Priority Badges**: Color-coded badges for clarity across all views.

---

## 💻 Getting Started Locally

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/an2obanhmi/SDN302_1.git
cd SDN302_1
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase connection strings:
```bash
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
JWT_SECRET="your-secure-jwt-secret"
```

### 3. Push Database Schema & Seed Data
```bash
npm run db:push
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
