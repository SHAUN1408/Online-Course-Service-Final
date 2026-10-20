# Online Course Service

## Project Overview

Online Course Service is a web application that allows teachers to manage online courses and students to browse and enroll in available courses.

The project uses:
- **Backend:** Next.js
- **Frontend:** React with Vite
- **Database:** MongoDB

## Test Accounts

All test accounts use the password: `Test12345!`

| Role | Email |
|---|---|
| Teacher | teacher1@example.com |
| Teacher | teacher2@example.com |
| Teacher | teacher3@example.com |
| Student | student1@example.com |
| Student | student2@example.com |
| Student | student3@example.com |

## How to Run the Application

### 1. Start the Backend

Open a terminal and navigate to the backend folder:

```bash
cd next-backend
npm install
npm run dev
```

Ensure that `next-backend/.env.local` contains the required MongoDB connection string and JWT secret.

The backend runs at `http://localhost:3000`.

### 2. Start the Frontend

Open another terminal and navigate to the frontend folder:

```bash
cd react-frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## How to Test the Application

### Teacher Testing

1. Log in using `teacher1@example.com` and `Test12345!`.
2. Create a new course by entering the course name, duration, topics, price, maximum students, and status.
3. Confirm that the new course appears under **My Courses**.
4. Edit the course information.
5. Change the course status between Open, Close, and Cancel.
6. Click **View Students** to see students enrolled in the course.
7. Create another test course with no enrolled students and delete it.
8. Try deleting a course with enrolled students to verify that deletion is restricted.

### Student Testing

1. Log out from the teacher account.
2. Log in using `student3@example.com` and `Test12345!`.
3. View the available courses.
4. Click **Enroll** on an Open course.
5. Confirm that the course appears under **My Enrolled Courses**.
6. Verify that Closed courses cannot be enrolled in.
7. Verify that Cancelled courses are not available for new enrollment.
8. Log out.

## Access Control

- Teachers can manage their own courses.
- Students can enroll in available Open courses.
- Course enrollment is restricted by capacity.
- Courses with enrolled students cannot be deleted.
- Protected API endpoints require authentication.

## Project Structure

- `next-backend/` — Next.js backend API
- `react-frontend/` — React frontend application
- `README.md` — Project documentation and testing instructions
