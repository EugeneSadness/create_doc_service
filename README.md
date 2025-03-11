# DocGen - Automatic Documentation Generator

DocGen is a web application that automatically generates documentation for your projects by analyzing the codebase. It supports JavaScript and Python projects.

## Features

- Automatic analysis of repository structure
- Extraction of JSDoc/docstrings comments
- Generation of API documentation
- Component documentation for React projects
- Dependencies overview
- User-friendly documentation viewer

## Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Code Analysis**: Simple-git, JSDoc Parser

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/docgen.git
   cd docgen
   ```

2. Start the application using Docker Compose:
   ```
   docker-compose up
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Usage

1. Register a new account
2. Add a project by providing a Git repository URL
3. Generate documentation for your project
4. View and navigate through the generated documentation

## Development

### Project Structure

```
/project-root
├── /frontend          # React application
├── /backend           # Node.js server
├── /database          # SQL scripts and migrations
└── docker-compose.yml # For local development
```

### Running in Development Mode

1. Start the database:
   ```
   docker-compose up postgres
   ```

2. Start the backend:
   ```
   cd backend
   npm install
   npm run dev
   ```

3. Start the frontend:
   ```
   cd frontend
   npm install
   npm start
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details. 