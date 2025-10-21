# Clinical Health Intake (CHI) Backend Service

A high-performance backend service built with Fastify, TypeScript, and MongoDB for managing clinical health intake forms and submissions.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control (Admin/Patient)
- **User Management**: User registration and login with bcrypt password hashing
- **API Documentation**: Interactive Swagger/OpenAPI documentation
- **TypeScript**: Full type safety with strict mode enabled
- **MongoDB**: NoSQL database with TypeORM
- **Docker Support**: Easy deployment with Docker Compose

## 📋 Prerequisites

- Node.js >= 20.0.0
- MongoDB 7
- Docker & Docker Compose (optional)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CHI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   Create a `.env` file in the root directory:
   ```env
   # Application
   NODE_ENV=development
   PORT=3000
   HOST=0.0.0.0

   # Database
   MONGO_URL=mongodb://localhost:27017/chi

   # JWT
   JWT_SECRET=your-secret-key-here
   JWT_EXPIRES_IN=7d
   ```

4. **Start MongoDB with Docker**
   ```bash
   docker-compose up -d
   ```

5. **Run the application**
   ```bash
   # Development mode (with hot reload)
   npm run dev

   # Build for production
   npm run build

   # Run production build
   npm start
   ```

## 📁 Project Structure

```
CHI/
├── src/
│   ├── app.ts                    # Fastify app configuration
│   ├── server.ts                 # Server entry point
│   ├── config/
│   │   ├── env.ts               # Environment configuration
│   │   └── data-source.ts       # TypeORM DataSource
│   ├── auth/
│   │   ├── types.ts             # Auth type definitions
│   │   ├── auth.plugin.ts       # Authentication plugin
│   │   └── rbac.ts              # Role-based access control
│   ├── modules/
│   │   └── users/
│   │       ├── user.entity.ts
│   │       ├── users.repository.ts
│   │       ├── users.service.ts
│   │       ├── users.controller.ts
│   │       └── users.routes.ts
│   ├── plugins/
│   │   ├── error.ts             # Global error handler
│   │   └── logger.ts            # Request/response logger
│   └── utils/
│       ├── ids.ts               # ID generation utilities
│       ├── result.ts            # Result type for error handling
│       └── pagination.ts        # Pagination utilities
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── README.md
```

## 📚 API Documentation

Once the server is running, you can access the interactive API documentation at:

**Swagger UI**: [http://localhost:3000/docs](c)

The Swagger UI provides:
- Interactive API testing
- Request/response schemas
- Authentication testing with JWT tokens
- All available endpoints with examples

## 🔌 API Endpoints

### Authentication

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "role": "patient",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "role": "patient",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔐 Authentication

Include the JWT token in the Authorization header:

```http
Authorization: Bearer <your-token>
```

## 👥 User Roles

- **Patient**: Default role for all registered users
- **Admin**: Must be manually updated in the database

To change a user's role to admin, update the MongoDB document directly:

```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

## 🧪 Development

```bash
# Run in development mode with hot reload
npm run dev

# Build TypeScript
npm run build

# Run built files
npm start
```

## 🐳 Docker

Start MongoDB:
```bash
docker-compose up -d
```

Stop MongoDB:
```bash
docker-compose down
```

View logs:
```bash
docker-compose logs -f
```

## 🛡️ Security

- Passwords are hashed using bcrypt (10 salt rounds)
- JWT tokens expire after 7 days (configurable)
- Role-based access control for protected routes
- Environment-based JWT secret validation

## 📝 License

ISC

## 👨‍💻 Author

Your Name

