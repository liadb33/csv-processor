# 🚀 Real-Time CSV Processing System

full-stack web application for asynchronous CSV file processing with **live progress updates**. Upload CSV files containing customer data and watch as they're processed in real-time.

![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)

---

## ✨ Key Features

- ✅ **Asynchronous Processing** — Upload returns immediately; processing happens in the background
- ✅ **Real-Time Progress Updates** — Live progress bar via WebSocket (Socket.IO)
- ✅ **Batch Optimization** — Processes 25 rows per transaction for optimal performance
- ✅ **MongoDB Transactions** — ACID-compliant batch inserts with replica set support
- ✅ **Data Validation** — Email format validation, required field checks, global email uniqueness
- ✅ **Redis Job Queue** — Persistent job queue with Bull for reliability
- ✅ **Error Reporting** — Downloadable CSV report for failed rows
- ✅ **Modern UI** — Material-UI based responsive interface

---

## 🎯 Bonus Features Implemented

- ✅ **Automatic Progress Updates** — Real-time progress broadcast via WebSocket every 100 processed rows, keeping clients synchronized without polling
- ✅ **Dedicated Job Queue System (In-Memory)** — Custom queue implementation with worker pool architecture, built but replaced with Redis/Bull for production reliability
- ✅ **Downloadable Error Report** — Export failed rows as CSV with detailed error descriptions for easy debugging
- ✅ **Redis-Based Job Queue** — Persistent queue with Bull for production reliability and job recovery


---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime environment |
| TypeScript | 5.9 | Type-safe development |
| Express.js | 5.x | REST API framework |
| MongoDB | 7.0 | Primary database |
| Redis | 7.x | Job queue persistence |
| Bull | 4.x | Job queue management |
| Socket.IO | 4.8 | Real-time communication |
| csv-parse | 6.x | CSV parsing |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 5.9 | Type-safe development |
| Vite | 7.x | Build tool & dev server |
| Material-UI (MUI) | 7.x | Component library |
| Socket.IO Client | 4.8 | Real-time updates |
| Axios | 1.x | HTTP client |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker Compose | Container orchestration |
| MongoDB Replica Set | Transaction support |
| Redis | Job queue persistence |

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v18.0.0 or higher ([Download](https://nodejs.org/))
- **Docker Desktop** with Docker Compose ([Download](https://www.docker.com/products/docker-desktop/))
- **Git** for cloning the repository
- **MongoDB Compass** (optional, for database visualization) ([Download](https://www.mongodb.com/products/compass))

Verify your installations:
```bash
node --version    # Should be v18+
npm --version     # Should be v9+
docker --version  # Should be v20+
```

---

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/liadb33/csv-processing-system.git
cd csv-processing-system
```
---

### Step 2: Start Docker Services

Start MongoDB and Redis containers:

```bash
docker-compose up -d
```

This command will:
- Start MongoDB 7 with replica set configuration
- Initialize the replica set automatically (via `mongo-init` service)
- Start Redis 7 with data persistence

**Verify containers are running:**
```bash
docker ps
```

You should see:
| Container | Port | Status |
|-----------|------|--------|
| csv_mongodb | 27017 | Running |
| csv-processor-redis | 6379 | Running |

**Wait for replica set initialization** (about 10 seconds), then verify:
```bash
docker logs csv_mongo_init
```
You should see: `Replica set initialized`

---

### Step 3: Backend Setup

Navigate to the backend folder:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Create the environment file:
```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Or create manually with the following content:
```

**Create `backend/.env`** with the following content:
```env
# MongoDB Connection (local Docker instance)
MONGODB_URI=mongodb://localhost:27017/csv_processor?replicaSet=rs0&directConnection=true

# Server Configuration
PORT=3001

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
```

> **Important:** The `directConnection=true` parameter is required for connecting to a single-node replica set from outside Docker.

---

### Step 4: Frontend Setup

Open a new terminal and navigate to the frontend folder:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

**Create `frontend/.env`** with the following content:
```env
VITE_API_URL=http://localhost:3001
```

---

### Step 5: Run the Application

**Terminal 1 — Start Backend:**
```bash
cd backend
npm run dev
```
Expected output:
```
🚀 Server running on port 3001
📦 Connected to MongoDB
🔌 Socket.IO ready for connections
📋 Bull queue initialized
```

**Terminal 2 — Start Frontend:**
```bash
cd frontend
npm run dev
```
Expected output:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

**Access the application:** Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📁 Project Structure

```
csv-processing-system/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Express middleware (multer, error handling)
│   │   ├── queue/           # Bull queue & worker
│   │   ├── repositories/    # Data access layer
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic
│   │   ├── types/           # TypeScript type definitions
│   │   ├── websocket/       # Socket.IO configuration
│   │   └── index.ts         # Application entry point
│   ├── uploads/             # Uploaded CSV files
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API & Socket clients
│   │   ├── types/           # TypeScript types
│   │   └── App.tsx          # Root component
│   └── package.json
├── docker-compose.yml       # MongoDB & Redis containers
├── sample_customers.csv     # Test data file
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| `POST` | `/api/jobs/upload` | Upload CSV file | `multipart/form-data` with `file` field | `{ jobId: string }` |
| `GET` | `/api/jobs` | List all jobs | — | `Job[]` |
| `GET` | `/api/jobs/:id` | Get job details | — | `Job` |
| `GET` | `/api/jobs/:id/error-report` | Download error CSV | — | CSV file |

### WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `connection` | Client → Server | Establishes Socket.IO connection |
| `job-update` | Server → Client | Complete job object with current state |

---

## 🏗️ Architecture Overview

```
┌─────────────┐     HTTP POST      ┌─────────────┐
│   Browser   │ ─────────────────► │   Express   │
│   (React)   │                    │   Server    │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │ Socket.IO                        │ Enqueue Job
       │ (real-time)                      ▼
       │                           ┌─────────────┐
       │◄──────────────────────────│    Bull     │
       │     job-update events     │   Queue     │
       │                           └──────┬──────┘
       │                                  │
       │                                  ▼
       │                           ┌─────────────┐
       │                           │   Worker    │
       │                           │  (Process)  │
       │                           └──────┬──────┘
       │                                  │
       │                                  │ Batch Insert
       │                                  ▼
       │                           ┌─────────────┐
       └───────────────────────────│   MongoDB   │
                 Read State        │  (Replica)  │
                                   └─────────────┘
```

### Processing Flow

1. **Upload** — File received via multer, saved to disk
2. **Queue** — Job created in MongoDB, ID added to Redis queue
3. **Process** — Worker picks job, parses CSV row-by-row
4. **Validate** — Each row validated (email format, required fields, uniqueness)
5. **Batch Insert** — Valid rows collected in batches of 25, inserted via transaction
6. **Broadcast** — Progress updates emitted via Socket.IO every 100 rows
7. **Complete** — Final status update, error report available if failures exist

### Crash Recovery Flow

1. **Server Restart** — On startup, system scans for jobs with status "processing"
2. **Mark as Failed** — Interrupted jobs marked as "failed" with error message "Server crashed during processing"
3. **Socket Update** — Frontend immediately shows failed state with existing error data
4. **Bull Retry** — Bull queue detects stalled jobs and automatically retries them (~5 seconds)
5. **Cleanup** — Worker detects retry, deletes partial failed row data from previous attempt
6. **Reprocess** — Job processes from scratch with clean state
7. **Complete** — Job completes normally with accurate final counts

---

## ⚙️ Key Implementation Details

### MongoDB Replica Set Requirement

MongoDB transactions require a replica set. The `docker-compose.yml` configures a single-node replica set for local development.

**Why we use transactions:** When processing CSV files, we insert customers in batches of 25 rows. Transactions ensure that if any row in a batch fails (e.g., duplicate email violates unique constraint), the entire batch is rolled back—preventing partial data insertion and maintaining database consistency. Without transactions, we'd risk inserting some rows while others fail, leaving the database in an inconsistent state.

This enables:
- ACID-compliant batch inserts
- Atomic job counter updates
- Rollback capability on batch failures

### Batch Processing Optimization

- **Batch Size:** 25 rows per transaction
- **Progress Updates:** Emitted every 100 processed rows
- **Memory Efficient:** Process-as-you-parse streaming (no full file load)

### Email Uniqueness

Email uniqueness is enforced **globally** via a MongoDB unique index:
```javascript
db.customers.createIndex({ email: 1 }, { unique: true })
```
Duplicate emails—even from different uploads—will fail validation.

### Validation Rules

| Field | Rule | Required |
|-------|------|----------|
| `name` | Non-empty string | ✅ Yes |
| `email` | Valid format, globally unique | ✅ Yes |
| `company` | Non-empty string | ✅ Yes |
| `phone` | Any string | ❌ No |

---

## 🐛 Troubleshooting

### MongoDB Connection Issues

**Error:** `MongoServerSelectionError: getaddrinfo ENOTFOUND mongodb`

**Solution:** You're using the Docker network hostname. For local development, use:
```env
MONGODB_URI=mongodb://localhost:27017/csv_processor?replicaSet=rs0&directConnection=true
```

---

### Replica Set Not Initialized

**Error:** `MongoServerError: Transaction numbers are only allowed on a replica set member or mongos`

**Solution:** Initialize the replica set:
```bash
docker exec -it csv_mongodb mongosh --eval "rs.initiate()"
```

Or restart Docker services (auto-initializes):
```bash
docker-compose down
docker-compose up -d
```

---

### Port Conflicts

**Error:** `EADDRINUSE: address already in use :::3001`

**Solution:** Kill the process using the port:
```bash
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process -Force

# macOS/Linux
lsof -ti:3001 | xargs kill -9
```

---

### CORS Errors

**Error:** `Access-Control-Allow-Origin` errors in browser console

**Solution:** Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL:
```env
FRONTEND_URL=http://localhost:5173
```

---

### Redis Connection Failed

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solution:** Ensure Redis container is running:
```bash
docker ps | grep redis
docker-compose up -d redis
```

---

## 🧰 Development Commands

### Docker Services

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart
```


### Application

```bash
# Backend development (with hot reload)
cd backend && npm run dev

# Frontend development (with hot reload)
cd frontend && npm run dev

# Build backend for production
cd backend && npm run build

# Build frontend for production
cd frontend && npm run build
```

---

## 📝 Assumptions & Design Decisions

| Assumption | Rationale |
|------------|-----------|
| CSV files have a header row | First row (`name,email,phone,company`) is skipped during processing |
| Jobs process sequentially | Single worker processes one job at a time for simplicity |
| Email uniqueness is global | Enforced via database unique index, not per-upload |
| All clients receive all updates | No user-specific filtering; all connected clients see all job updates |
| Files persist during processing | Uploaded files remain on disk; cleanup is manual |

---

## 📄 Sample Test Data

A sample CSV file is included for testing:

**`sample_customers.csv`**
```csv
name,email,phone,company
John Doe,john.doe@example.com,555-0100,Acme Corp
Invalid User,not-an-email,555-0110,Bad Data Inc
,valid@example.com,555-0111,No Name Corp
Another User,another@example.com,555-0113,
Final User,final@example.com,,Good Company
```

**Expected Results:**
| Row | Result | Reason |
|-----|--------|--------|
| 2 | ✅ Pass | All fields valid |
| 3 | ❌ Fail | Invalid email format |
| 4 | ❌ Fail | Name is required |
| 5 | ❌ Fail | Company is required |
| 6 | ✅ Pass | Phone is optional |

**Final Counts:** 2 succeeded, 3 failed

---

<p align="center">
  <strong>Thank you ! </strong>
</p>
