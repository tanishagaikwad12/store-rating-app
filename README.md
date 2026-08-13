# RateNest – Store Rating Application

RateNest is a full-stack store rating and review application that allows users to discover stores, submit ratings, and view store information. The application also includes separate dashboards for administrators and store owners.

## Features

### 👤 User
- User registration and login
- JWT-based authentication
- Password hashing using bcrypt
- Store browsing
- View store ratings
- Submit ratings/reviews
- User-specific dashboard

### 🛡️ Admin
- Secure admin login
- Admin dashboard with platform overview
- View and manage users
- Create users with different roles
- Add and manage stores
- Assign stores to store owners
- View store information and ratings

### 🏪 Store Owner
- Dedicated owner login
- Owner dashboard
- View assigned stores
- View ratings associated with owned stores
- Owner-specific access using role-based authorization

## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- CSS

### Backend
- Node.js
- Express.js
- JWT
- bcrypt.js

### Database
- MySQL
- MySQL2

## Project Structure

```text
store-rating-app/
│
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── owner.js
│   │   ├── ratings.js
│   │   └── stores.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AuthPage.jsx
│   │   │   ├── DashboardShell.jsx
│   │   │   ├── OwnerDashboard.jsx
│   │   │   ├── UserDashboard.jsx
│   │   │   └── ui.jsx
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   └── package.json
│
└── README.md
