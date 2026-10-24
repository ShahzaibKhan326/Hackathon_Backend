# HCM Lite - Backend Documentation

HCM Lite (Human Capital Management Lite) is a lightweight, secure, and RESTful backend system built to manage HR operations efficiently. The system handles Authentication, Employee Management, Attendance Tracking, Leave Management, and Payroll calculations.

---

## 🚀 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB & Mongoose
- **Authentication:** JSON Web Tokens (JWT)
- **Validation:** Joi
- **Security & Utilities:** Bcryptjs, Cors, Dotenv

---

## 📁 Project Directory Structure

```text
backend/
├── config/           # Database & environment configurations
├── controllers/      # Business logic for requests
├── middleware/       # Authentication & role-based middleware
├── models/           # Mongoose schemas (User, Employee, Attendance, Leave, Payroll)
├── routes/           # API endpoints routing
├── services/         # Reusable core business logic
├── .env              # Environment variables (not tracked in git)
├── server.js         # Entry point of the application
└── package.json      # Dependencies and scripts
```

---

## ⚙️ Installation & Local Setup

1. **Navigate to Backend Directory:**
   ```bash
   cd backend
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root of the `backend` folder and add the following:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string_here
   JWT_SECRET=your_super_secret_jwt_key_here
   ```

4. **Run the Application:**
   * **Development Mode (Nodemon):**
     ```bash
     npm run dev
     ```
   * **Production Mode:**
     ```bash
     npm start
     ```
   Server will start running on `http://localhost:5000`.

---

## 🧪 API Testing Guide

You can test these endpoints using **Postman**, **Thunder Client**, or **cURL**.

> **Note:** For protected routes, include the JWT token returned upon login in the request headers:
> `Authorization: Bearer <your_jwt_token>`

---

### 1. Authentication Module (`/api/auth`)

* **Register User**
  * **Endpoint:** `POST /api/auth/register`
  * **Body (JSON):**
    ```json
    {
      "name": "Admin User",
      "email": "admin@hcm.com",
      "password": "password123",
      "role": "admin"
    }
    ```

* **Login User**
  * **Endpoint:** `POST /api/auth/login`
  * **Body (JSON):**
    ```json
    {
      "email": "admin@hcm.com",
      "password": "password123"
    }
    ```
  * **Response:** Returns a `token` and user object. Save this token for authenticating protected requests.

---

### 2. Employees Module (`/api/employees`) *(Protected)*

* **Get All Employees**
  * **Endpoint:** `GET /api/employees`
  * **Headers:** `Authorization: Bearer <token>`

* **Add New Employee**
  * **Endpoint:** `POST /api/employees`
  * **Headers:** `Authorization: Bearer <token>`
  * **Body (JSON):**
    ```json
    {
      "employeeId": "EMP001",
      "name": "Nadir Ali",
      "email": "nadir@hcm.com",
      "department": "Engineering",
      "designation": "Software Developer",
      "salary": 50000
    }
    ```

---

### 3. Attendance Module (`/api/attendance`) *(Protected)*

* **Mark Attendance (Check-In / Check-Out)**
  * **Endpoint:** `POST /api/attendance`
  * **Headers:** `Authorization: Bearer <token>`
  * **Body (JSON):**
    ```json
    {
      "employeeId": "employee_mongo_id_here",
      "status": "Present"
    }
    ```

* **Get Attendance Records**
  * **Endpoint:** `GET /api/attendance`
  * **Headers:** `Authorization: Bearer <token>`

---

### 4. Leave Management Module (`/api/leaves`) *(Protected)*

* **Apply for Leave**
  * **Endpoint:** `POST /api/leaves`
  * **Headers:** `Authorization: Bearer <token>`
  * **Body (JSON):**
    ```json
    {
      "employeeId": "employee_mongo_id_here",
      "leaveType": "Casual",
      "startDate": "2026-11-01",
      "endDate": "2026-11-03",
      "reason": "Family event"
    }
    ```

* **Update Leave Status (Approve/Reject - Admin/Manager)**
  * **Endpoint:** `PUT /api/leaves/:id`
  * **Headers:** `Authorization: Bearer <token>`
  * **Body (JSON):**
    ```json
    {
      "status": "Approved"
    }
    ```

---

### 5. Payroll Module (`/api/payroll`) *(Protected)*

* **Generate Payslip**
  * **Endpoint:** `POST /api/payroll`
  * **Headers:** `Authorization: Bearer <token>`
  * **Body (JSON):**
    ```json
    {
      "employeeId": "employee_mongo_id_here",
      "month": "October",
      "year": 2026,
      "allowances": 5000,
      "deductions": 2000
    }
    ```