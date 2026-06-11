# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains the frontend React application for a Spring Boot 4 RBAC (Role-Based Access Control) system. The backend Spring Boot 4.1.0-M3 application is documented but not included in this repository.

- **Frontend**: React application created with Create React App (`my-app/`)
- **Backend**: Spring Boot 4.1.0-M3 with Java 21 virtual threads, PostgreSQL, Redis, MyBatis Plus, and Spring Security (separate project)
- **Documentation**: Backend API documentation at `/Users/xz/develop_code/java_code/springboot4Demo/docs/api.md`

## Common Development Tasks

### Frontend (React)
```bash
cd my-app
npm start          # Start development server (localhost:3000)
npm test           # Run tests in interactive watch mode
npm run build      # Build for production
npm run eject      # Eject from Create React App (one-way)
```

### Backend (Spring Boot)
The backend is a separate project; refer to the API documentation for its commands:
```bash
mvn clean compile  # Compile the backend
mvn spring-boot:run # Run the application
mvn test           # Run backend tests
mvn clean package  # Package as JAR
```

## Architecture

### Frontend Structure
- `my-app/` – Standard Create React App structure
  - `src/` – React components, styles, tests
  - `public/` – Static assets
  - `package.json` – Dependencies and scripts

### Backend Architecture (as documented)
- **Framework**: Spring Boot 4.1.0-M3 with Java 21 virtual threads
- **Database**: PostgreSQL with MyBatis Plus
- **Caching**: Redis for OAuth2 token storage
- **Security**: Spring Security with HTTP Basic and OAuth2/JWT support
- **API**: RESTful endpoints for authentication, user/role/permission management
- **Virtual Threads**: Fully configured for database connections and HTTP handling

### Key API Modules
- `/api/auth` – User registration, authentication, health checks
- `/api/users` – User management (CRUD, batch operations, statistics)
- `/api/roles` – Role management and assignment
- `/api/permissions` – Permission management and checking
- `/api/redis` – Redis operations and health checks
- `/db` – Database connection tests
- Public endpoints: `/hello`, `/demo/hello`

All endpoints follow a uniform JSON response format (`success`, `message`, `data`, `timestamp`).

## Development Notes

### Backend Integration
- The frontend is expected to communicate with the backend at `http://localhost:8080`
- Default users: `admin`/`password` (ROLE_ADMIN), `user`/`password` (ROLE_USER)
- Authentication: HTTP Basic for testing, OAuth2/JWT for production

### Virtual Threads
The backend leverages Java 21 virtual threads for improved concurrency. Configuration includes:
- `spring.threads.virtual.enabled: true`
- Tomcat and HikariCP optimized for virtual threads
- All Redis and database operations log thread type

### Database & Redis
- PostgreSQL connection: `jdbc:postgresql://127.0.0.1:5432/postgres`
- Redis connection: `127.0.0.1:6379`
- Both services must be running locally for full backend functionality

## Testing
- **Frontend**: Use `npm test` with Jest and React Testing Library
- **Backend**: Use `mvn test` (in the separate backend project)
- **API Testing**: Use tools like `curl` or Postman with the documented endpoints

## Important Files
- `/Users/xz/develop_code/java_code/springboot4Demo/CLAUDE.md` – Backend API reference, setup, and troubleshooting
- `my-app/package.json` – Frontend dependencies and scripts
- `my-app/README.md` – Create React App instructions

## Next Steps
1. Develop React components to consume the backend APIs.
2. Configure proxy in `my-app/package.json` to avoid CORS issues during development.
3. Implement authentication flows (login, token management).
4. Extend the frontend to manage users, roles, and permissions.

---

*Note: The backend Spring Boot code is at `/Users/xz/develop_code/java_code/springboot4Demo/`. Refer to its CLAUDE.md for API documentation.*