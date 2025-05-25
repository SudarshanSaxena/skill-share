# Skill Share Marketplace

A full-stack skill-sharing platform built with **Next.js App Router**, **PostgreSQL**, **Prisma**, and RESTful APIs. Users can post tasks, and providers can make offers to complete them. Includes authentication, role-based logic, and offer management.

---

## ✨ Features

### 🔐 Authentication

* JWT-based login system
* User roles: `user` and `provider`
* Signup and login endpoints with secure password hashing

### 👥 User Roles

* **User**: Create tasks, view/accept/reject offers
* **Provider**: Browse tasks, make offers

### 📄 Tasks

* Create and manage tasks
* Fields: name, category, description, start date, hours, rate, currency
* Status flow: `open` → `offered` → `in_progress`

### 💼 Offers

* Providers can offer on tasks with price and message
* Only one offer per task per provider
* Users can accept or reject offers
* Accepting one offer auto-rejects others

---

## 📂 Project Structure

```
app/
├── api/
│   ├── login/
│   ├── signup/
│   ├── tasks/
│   │   ├── [id]/         # Update/edit tasks
│   │   └── offers/       # View offers for a task
│   └── offers/
│       └── [offerId]/
│           ├── accept/   # Accept offer
│           └── reject/   # Reject offer
components/
├── AuthForm.tsx
├── TaskList.tsx
├── TaskForm.tsx
lib/
└── auth.ts              # JWT handling
prisma/
└── schema.prisma
.env
next.config.js
```

---

## 📃 Technologies Used

* **Next.js 14 App Router**
* **React**
* **PostgreSQL**
* **Prisma ORM**
* **Tailwind CSS**
* **JWT Authentication**

---

## 🔧 Setup & Configuration

### 1. Clone and install

```bash
git clone https://github.com/your-username/skill-share-marketplace.git
cd skill-share-marketplace
npm install
```

### 2. Configure Environment

Create `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/your_db
JWT_SECRET=your_jwt_secret_key
```

### 3. Setup Database

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Run App

```bash
npm run dev
```

Access at `http://localhost:3000`

---

## 🔐 API Endpoints

### Auth

```http
POST /api/signup
POST /api/login
```

### Tasks

```http
GET  /api/tasks            # List user tasks
POST /api/tasks            # Create task
PUT  /api/tasks/[id]       # Edit task
```

### Offers

```http
POST /api/offers           # Make offer
GET  /api/tasks/offers/[taskId]       # View offers
PUT  /api/offers/[offerId]/accept     # Accept offer
PUT  /api/offers/[offerId]/reject     # Reject offer
```

All secured endpoints require:

```http
Authorization: Bearer <JWT>
```

---

## 📊 Prisma Schema

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  userType  String   // "user" | "provider"
  tasks     Task[]
  offers    Offer[]
}

model Task {
  id                    String    @id @default(uuid())
  user                  User      @relation(fields: [userId], references: [id])
  userId                String
  name                  String
  description           String
  expectedStartDate     DateTime?
  expectedWorkingHours  Int?
  hourlyRate            Float
  currency              String
  status                String    // open, offered, in_progress
  createdAt             DateTime  @default(now())
  offers                Offer[]
}

model Offer {
  id         String      @id @default(uuid())
  task       Task        @relation(fields: [taskId], references: [id])
  taskId     String
  provider   User        @relation(fields: [providerId], references: [id])
  providerId String
  price      Float
  message    String
  status     OfferStatus @default(pending)
  createdAt  DateTime    @default(now())
}

enum OfferStatus {
  pending
  accepted
  rejected
}
```

---

## 📈 Task & Offer Flow

1. User creates task → status `open`
2. Provider offers → task status `offered`
3. User accepts one → offer `accepted`, others `rejected`, task `in_progress`
4. User rejects all → task returns to `open`

---

## 🚀 Dev Notes

* ESLint disabled during build via `next.config.js`:

```js
eslint: {
  ignoreDuringBuilds: true
}
```

* Uses Next.js App Router API routes under `app/api`
* Prisma client imported from `@/app/generated/prisma`
* JWT tokens are extracted from headers for authentication

---

## 🎓 Future Improvements

* Messaging between users and providers
* Mark task as completed
* Add provider reviews
* Pagination and sorting for tasks

---

## 📄 License

MIT License. Feel free to modify and use.


Secure Storage on frontend
Connection Pooling Implementation And Understanding
Req Validation - done
Error Handling - done
Proper Logging of Messages - done