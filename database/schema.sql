CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    repository_url TEXT NOT NULL,
    name VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_analyzed_at TIMESTAMP
);

CREATE TABLE documentation (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    content JSONB NOT NULL,
    version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 