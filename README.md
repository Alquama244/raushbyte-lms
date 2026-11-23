# RaushByte Learn – Learning Management System

RaushByte Learn is a web-based Learning Management System (LMS) designed to support students and mentors through a connected learning platform.

The application combines a React frontend, Node.js backend, MongoDB Atlas database, and a separate Python AI Code Review Microservice.

Its main purpose is to provide student authentication, protected application access, code submissions, AI-powered code reviews, and a foundation for mentor-assisted learning.

---

## 1. Project Overview

RaushByte Learn consists of three main application components:

1. **Frontend:** React and Vite application for the user interface.
2. **Main Backend:** Node.js REST API responsible for authentication, application routes, and database operations.
3. **AI Code Review Microservice:** A separate Python FastAPI service that analyzes submitted Python code and generates educational feedback.

MongoDB Atlas is used for persistent application data.

## 2. Technology Stack

### Frontend
- React
- Vite
- JavaScript
- CSS
- Fetch-based API communication

### Main Backend
- Node.js
- Express-based REST API
- JSON Web Token (JWT) authentication
- MongoDB integration
- Protected API routes
- Role-based access checks

### Database
- MongoDB Atlas
- Database: `raushbyte_learn`
- Mongoose models

### AI Code Review Microservice
- Python
- FastAPI
- Pydantic
- Python AST
- Ruff
- OpenAI-compatible SDK
- OpenRouter API

### Testing
- Pytest for the Python microservice
- API and authentication checks during development

## 3. Application Architecture

| Component | Technology | Development address |
|---|---|---|
| Frontend | React + Vite | `http://localhost:5173` |
| Node.js backend | Node.js | `http://localhost:5000` |
| Python AI service | FastAPI | `http://localhost:8000` |
| Database | MongoDB Atlas | Cloud-hosted |

The Vite development port may change if the default port is already occupied.

## 4. Main Features

### 4.1 Student Authentication

The application includes student registration and login.

Implemented authentication functionality includes:

- Student account registration.
- Student login.
- Authentication using JWT.
- Protected current-user endpoint.
- Student role identification.
- Authentication-required API access.

Authentication endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a student account |
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/auth/me` | Retrieve the authenticated user's information |

Protected endpoints require a valid authentication token.

### 4.2 Student Dashboard

The frontend includes a student dashboard built with React.

The dashboard work includes:

- Student-facing application interface.
- Sidebar navigation.
- Code submission area.
- Python code submission workflow.
- AI review integration.
- Display of code review results.
- Review information and feedback.

### 4.3 Mentor Authentication and Portal

The project also includes work on a separate mentor-facing interface and role-based access.

Mentor-related functionality includes:

- Separate mentor login interface work.
- Authentication through the application login flow.
- Mentor role verification.
- Restriction of mentor access based on user role.

The mentor submissions, reporting, and feedback management workflows should be considered under development until their corresponding API routes and end-to-end behavior have been verified.

### 4.4 Assignment API Protection

The Node.js backend includes an assignments API.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/assignments` | Access assignment information |

The assignments endpoint was tested without an authentication token and returned HTTP 401, confirming that authentication is required.

### 4.5 AI-Powered Code Review

RaushByte Learn integrates with a separate Python AI Code Review Microservice.

Students can submit Python code through the LMS interface.

The review service provides:

- Python syntax validation.
- Ruff-based static analysis.
- AI-generated code review.
- Code issue identification.
- Severity information.
- Beginner-friendly explanations.
- Suggested improvements.
- Code strengths.
- Overall feedback.
- Multiple-file review support.

The review system is designed to help students understand and improve their code rather than simply receive a score.

### 4.6 Review Storage and Retrieval

The Node.js backend integrates with MongoDB to persist AI review results.

The review integration includes:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/reviews` | Submit code for review and save the result |
| GET | `/api/reviews/:submissionId` | Retrieve a saved review |

The backend forwards review requests to the Python service:

`http://127.0.0.1:8000/api/v1/review`

Review records are associated with their submission identifiers.

The saved review contains information returned by the AI review service, such as issues, strengths, suggestions, and overall feedback.

## 5. AI Code Review Workflow

The code review process follows this sequence:

1. Student enters Python code in the frontend.
2. Frontend sends the submission to the Node.js backend.
3. Node.js backend forwards the review request to the Python FastAPI service.
4. Python service validates the request.
5. Static analysis checks the submitted files.
6. The AI service generates educational feedback through OpenRouter.
7. Static and AI findings are merged and validated.
8. Python service returns structured JSON.
9. Node.js backend saves the review in MongoDB.
10. Frontend displays the review results.

### Architecture Diagram

```text
                  STUDENT
                     |
                     v
             REACT + VITE
              FRONTEND
             Port 5173
                     |
                     v
              NODE.JS API
              Port 5000
               /       \
              /         \
             v           v
      AUTHENTICATION   MONGODB
      AND API ROUTES    ATLAS
             |
             v
       CODE REVIEW API
             |
             v
       PYTHON FASTAPI
         Port 8000
             |
             v
       PYTHON AST
             |
             v
           RUFF
             |
             v
       OPENROUTER AI
             |
             v
       REVIEW RESPONSE
             |
             v
       MONGODB STORAGE
             |
             v
       REACT DASHBOARD
```

## 6. Project Structure

The LMS and Python microservice are maintained as separate project directories.

### RaushByte Learn

```text
raushbyte-lms/
|
+-- frontend/
|   +-- src/
|   |   +-- App.jsx
|   |   +-- ...
|   +-- public/
|   +-- package.json
|
+-- models/
|   +-- User.js
|   +-- Review.js
|
+-- routes/
|   +-- auth.js
|   +-- ...
|
+-- middleware/
|   +-- auth.js
|
+-- server.js
+-- package.json
+-- README.md
```

### AI Code Review Microservice

```text
code_review_LMS/
|
+-- app/
|   +-- main.py
|   +-- config.py
|   |
|   +-- models/
|   |   +-- review.py
|   |
|   +-- services/
|       +-- static_analyzer.py
|       +-- llm_service.py
|       +-- openrouter_service.py
|       +-- prompt_builder.py
|       +-- issue_merger.py
|       +-- feedback_validator.py
|       +-- review_context_builder.py
|
+-- tests/
+-- requirements.txt
+-- README.md
```

The structure above highlights the main known project files. Additional files may exist in the working directories.

## 7. Installation and Setup

### Prerequisites

- Python 3.10 or later.
- Node.js and npm.
- MongoDB Atlas account or configured MongoDB connection.
- OpenRouter API key for AI code review.

### Step 1: Start the Python AI Service

Open a PowerShell terminal:

```powershell
cd C:\Users\User12\OneDrive\Desktop\code_review_LMS

.\.venv\Scripts\Activate.ps1

python -m uvicorn app.main:app --reload --port 8000
```

Python service:

`http://localhost:8000`

### Step 2: Start the Node.js Backend

Open another PowerShell terminal:

```powershell
cd C:\Users\User12\OneDrive\Desktop\raushbyte-lms

npm install

npm run dev
```

The backend development server runs on port 5000 in the current configuration.

### Step 3: Start the React Frontend

Open another PowerShell terminal:

```powershell
cd C:\Users\User12\OneDrive\Desktop\raushbyte-lms\frontend

npm install

npm run dev
```

Open the Vite URL printed in the terminal, normally:

`http://localhost:5173`

All three services must be running for the complete AI code review workflow.

## 8. Environment Configuration

The application uses environment-based configuration for sensitive settings.

Configure the environment variables required by the Node.js backend, including:

- MongoDB connection string.
- JWT authentication secret.
- Python AI service URL.
- Other application-specific settings used by the backend.

The Python microservice requires:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=nvidia/nemotron-3.5-super-vl:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

Do not publish real credentials, database connection strings, JWT secrets, or API keys.

Never commit `.env` files to a public repository.

## 9. API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Student registration |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Authenticated user details |

### Assignments

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/assignments` | Protected assignment access |

### AI Reviews

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/reviews` | Submit code and save review |
| GET | `/api/reviews/:submissionId` | Retrieve saved review |

### Python Microservice

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Service status |
| GET | `/health` | Health check |
| POST | `/api/v1/review` | Analyze submitted Python files |

## 10. Python Microservice Tests

The standalone AI Code Review Microservice has an automated pytest suite.

Run:

```powershell
cd C:\Users\User12\OneDrive\Desktop\code_review_LMS

.\.venv\Scripts\Activate.ps1

python -m pytest -v
```

Latest verified result during development:

```text
29 passed
```

The tests cover:

- API endpoints.
- Request validation.
- Static analysis.
- Multiple-file review.
- AI response validation.
- Invalid file and line references.
- Duplicate issue merging.
- Review model validation.

This result refers to the Python microservice test suite, not the entire LMS.

## 11. Current Development Status

### Implemented or previously verified

- React and Vite frontend.
- Node.js backend.
- MongoDB Atlas connection and database.
- Student registration and login.
- Protected current-user authentication endpoint.
- Student role identification.
- Student dashboard.
- Assignment API authentication protection.
- AI Code Review Microservice.
- Node.js to Python review integration.
- Review persistence and retrieval.
- Separate mentor-facing interface and role-check development.

### Further verification or development

- Complete mentor submission management.
- Mentor reporting workflows.
- Mentor feedback submission and student-side feedback lifecycle.
- Complete assignment management lifecycle.
- End-to-end verification of all student and mentor screens.
- Additional LMS history and reporting features.

The status of a feature should be updated after testing its complete frontend-to-backend workflow.

## 12. Security Considerations

- Use JWT authentication for protected application routes.
- Validate user roles before allowing role-specific access.
- Keep passwords and credentials protected.
- Store secrets in environment variables.
- Do not expose MongoDB credentials or API keys.
- Do not commit `.env` files.
- Submitted Python code is analyzed as input and is not executed by the review microservice.

## 13. Future Enhancements

Potential improvements include:

- Complete mentor assignment and submission management.
- Student review history and progress reports.
- Mentor feedback and reporting dashboards.
- Expanded assignment workflows.
- Improved analytics and learning progress tracking.
- Additional programming language support.
- More comprehensive end-to-end tests.

## 14. Related Documentation

For the standalone Python AI Code Review Microservice, see:

`code_review_LMS/README.md`

That README contains its detailed service architecture, installation, API examples, implementation details, and automated test information.

## 15. License

Add the appropriate license before public distribution.
