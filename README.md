# Rankly

A Next.js application for tracking player rankings and matches with authentication functionality.

## Features

- Player ranking system using ELO algorithm
- Match history tracking
- User authentication and authorization
- Player statistics and head-to-head records
- Admin dashboard for player management
- Responsive design for mobile and desktop

## Technologies Used

- **Frontend**:
  - Next.js 15
  - React 19
  - TypeScript
  - TailwindCSS
  - DaisyUI

- **Backend**:
  - Next.js API Routes
  - Prisma ORM
  - PostgreSQL
  - NextAuth.js

- **Authentication**:
  - NextAuth.js with Credentials Provider
  - bcrypt for password hashing

- **Development Tools**:
  - ESLint
  - Prisma CLI
  - TypeScript

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 16.x or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Git](https://git-scm.com/)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/fishram/Rankly.git
cd rankly
```

### 2. Install dependencies

```bash
npm install
```

### 3. Database Setup

You have several options for setting up the database:

1. **Supabase (Recommended)**:
   - Create a free account at [Supabase](https://supabase.com)
   - Create a new project
   - Go to Project Settings → Database
   - Find your connection string under "Connection string" → "URI"
   - Copy the connection string and replace `[YOUR-PASSWORD]` with your project password

2. **Local PostgreSQL**:
   - Install [PostgreSQL](https://www.postgresql.org/download/) locally: `brew install postgresql@14`
   - Start PostgreSQL Service: ```brew services start postgresql```
   - Then enter postgreSQL: `psql postgres`
   - Create the database: `CREATE DATABASE rankly;`
   - Exit psql: `\q`
   - Your connection string will follow this format:
     ```
     postgresql://admin:admin@localhost:5432/rankly
     ```

3. **Other Hosted Options**:
   - Any PostgreSQL-compatible database service

### 4. Environment Setup

Create a `.env.local` file in the root directory:


```env
# Database:

# Option 1 - Supabase
DATABASE_URL= "transaction-pooler url from supabase"
DIRECT_URL= "session-pooler url from supabase"

# Option 2 - Local PostgreSQL
DATABASE_URL="postgresql://admin:admin@localhost:5432/rankly"
DIRECT_URL="postgresql://admin:admin@localhost:5432/rankly"

# Authentication
NEXTAUTH_URL="http://localhost:3000"  # Local development URL
NEXTAUTH_SECRET=""  # Add your generated secret here
```

#### How to set up each variable:

1. **Database URLs** (choose one option):
   
   **Option 1 - Supabase:**
   - Create account at [Supabase](https://supabase.com)
   - Create new project
   - Go to Connect at the top of the page
   - Copy the connection strings
   - Replace `[YOUR-PASSWORD]` with your project password

   **Option 2 - Local PostgreSQL:**
   - Copy above urls
   - Default port is usually 5432

2. **NEXTAUTH_URL:**
   - For local development, use: `http://localhost:3000`
   - For production, use your deployed URL

3. **NEXTAUTH_SECRET:**
   - Generate a random string using one of these commands:
     ```bash
     # Option 1 - Using openssl (Mac/Linux)
     openssl rand -base64 32

     # Option 2 - Using Node.js
     node -e "console.log(crypto.randomBytes(32).toString('base64'))"
     ```
   - Copy the output and paste it as your NEXTAUTH_SECRET

### 5. Database Setup and Initialization

After setting up your environment variables, you need to initialize your database:

```bash
# Generate Prisma client (this is also run automatically after npm install)
npm run postinstall

# Push the database schema to your database
npx prisma db push
```

#### Verify Your Database:

You can use Prisma Studio to view and manage your database:
```bash
npx prisma studio
```
This will open a browser window at `http://localhost:5555` where you can inspect your database.

#### Troubleshooting:

If you encounter any issues:

1. **Database Connection Issues**:
   ```bash
   # Verify your database connection
   npx prisma db pull
   ```

2. **Schema Issues**:
   ```bash
   # Validate your schema
   npx prisma validate
   ```

### 6. Run the development server (with Prisma Studio)

```bash
npx prisma studio & npm run dev
```

This will start the development server at [http://localhost:3000](http://localhost:3000](http://localhost:3000)).

## Project Structure

- `/src` - Source code
  - `/app` - Next.js app router pages and components
  - `/middleware.ts` - Authentication middleware
  - `/lib` - Utility functions and shared code
- `/prisma` - Database schema and migrations
