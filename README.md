# HCM Lite - Backend

HCM Lite (Human Capital Management Lite) is a lightweight REST API for everyday HR work: authentication, employee records, attendance, leave and payroll.

## Live Demo

| | Link |
|---|---|
| Frontend (Vercel) | https://hackathon-frontend-mocha-six.vercel.app |
| Backend API (Render) | https://hackathon-backend-lj1q.onrender.com |
| API base URL | `https://hackathon-backend-lj1q.onrender.com/api` |

> The backend runs on Render's free tier. After a period of inactivity the first request can take up to 30 seconds while the server wakes up.

Health check: `GET /` returns `{ "success": true, "message": "HCM Lite API is running..." }`.

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JSON Web Tokens (JWT)
- **Utilities:** bcryptjs, cors, dotenv, morgan

---

## Project Structure

```text
hcm-lite-backend/
├── src/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/               # Request handling and business logic
│   │   ├── authController.js
│   │   ├── employeeController.js
│   │   ├── attendanceController.js
│   │   ├── leaveController.js
│   │   ├── payrollController.js
│   │   └── reportController.js
│   ├── middleware/
│   │   └── auth.js                # protect (JWT) and authorize (roles)
│   ├── models/                    # User, Employee, Attendance, Leave, Payroll, CompanySettings
│   ├── routes/                    # One router per module
│   └── server.js                  # Entry point
├── .env                           # Not tracked in git
└── package.json
```

---

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=a_long_random_secret
   JWT_EXPIRES_IN=7d
   NODE_ENV=development

   # Optional: first admin account, created only when the database has no users
   ADMIN_NAME=Super Admin
   ADMIN_EMAIL=admin@hcm.com
   ADMIN_PASSWORD=choose_a_strong_password
   ```

3. Start the server:
   ```bash
   npm run dev     # development (nodemon)
   npm start       # production
   ```
   The API runs on `http://localhost:5000`.

On first start, if the `users` collection is empty, an admin account is created from the `ADMIN_*` variables. Change that password after your first login.

---

## Roles and Access

| Role | Can do |
|---|---|
| `admin` | Everything, including adding employees, approving leave, generating payroll and viewing reports |
| `hr` | Same as admin |
| `employee` | View own profile, clock in and out, apply for leave, view own leave, attendance and payslips |

Protected routes need this header (the token comes from the login response):

```
Authorization: Bearer <token>
```

All responses use this shape. Errors return `success: false` with a `message`.

```json
{ "success": true, "data": {} }
```

List endpoints accept `page` (default 1) and `limit` (default 10) and return `count`, `totalPages` and `currentPage`.

---

## API Reference

Base path: `/api`

### Authentication `/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Sign in and receive a token |
| GET | `/auth/me` | Any user | Current user profile |

Login body:
```json
{ "email": "admin@hcm.com", "password": "your_password" }
```
Login response:
```json
{
  "success": true,
  "token": "<jwt>",
  "user": { "id": "...", "name": "...", "email": "...", "role": "admin", "department": "...", "designation": "...", "isFirstLogin": false }
}
```

### Employees `/employees`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/employees` | Any user | Admin/HR get all employees. An employee gets only their own record. Query: `department`, `search` (employee code), `page`, `limit` |
| GET | `/employees/:id` | Any user | One employee. Employees can only open their own |
| POST | `/employees` | Admin, HR | Create a user and employee profile |

Create body:
```json
{
  "name": "Nadir Ali",
  "email": "nadir@hcm.com",
  "employeeCode": "EMP001",
  "role": "employee",
  "department": "Engineering",
  "designation": "Software Developer",
  "phone": "03001234567",
  "address": "Karachi",
  "salary": { "basic": 50000, "allowances": 5000 }
}
```
A temporary password is generated and returned once as `data.temporaryPassword`. Share it with the employee securely.

### Attendance `/attendance`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/attendance/check-in` | Employee profile | Clock in for today |
| POST | `/attendance/check-out` | Employee profile | Clock out and calculate hours |
| GET | `/attendance` | Any user | Admin/HR see everyone, employees see their own. Query: `date` (YYYY-MM-DD), `department`, `page`, `limit` |

Rules:
- One check-in per day. A second attempt returns `409`.
- Check-in after office start plus grace time (default 09:00 + 15 minutes, configurable in company settings) is marked `Late`.
- Fewer than 5 worked hours at check-out is marked `Half-Day`.
- Dates use the server's UTC day.

### Leaves `/leaves`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/leaves` | Employee profile | Apply for leave |
| GET | `/leaves` | Any user | Admin/HR see all, employees see their own. Query: `status`, `leaveType`, `page`, `limit` |
| PATCH | `/leaves/:id/status` | Admin, HR | Approve or reject a pending request |

Apply body (`leaveType`: `annual`, `sick`, `casual` or `unpaid`):
```json
{ "leaveType": "casual", "startDate": "2026-11-01", "endDate": "2026-11-03", "reason": "Family event" }
```
Status body (note the capital first letter):
```json
{ "status": "Approved", "comment": "Enjoy your time off" }
```

Rules:
- Weekends are not counted. `totalDays` is the number of working days.
- Overlapping pending or approved requests are rejected.
- Yearly quotas: annual 14, sick 8, casual 10 days. Unpaid leave has no limit.
- Statuses: `Pending`, `Approved`, `Rejected`, `Cancelled`.

### Payroll `/payroll`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/payroll/generate` | Admin, HR | Generate one employee's payslip for a month |
| GET | `/payroll` | Any user | Admin/HR see all, employees see their own. Query: `month`, `year`, `page`, `limit` |
| PATCH | `/payroll/:id/pay` | Admin, HR | Mark a payslip as paid |

Generate body (`employeeId` is the employee's database `_id`, `month` is 1 to 12):
```json
{ "employeeId": "<employee _id>", "month": 10, "year": 2026, "otherDeductions": 0 }
```

How the net salary is calculated:
- Gross = basic + allowances.
- Unpaid leave deduction = unpaid approved days × (basic ÷ 30).
- Late deduction = half a day's pay for every 3 late check-ins in the month.
- Monthly tax is based on annual gross: 0% up to 600,000, 5% from 600,000 to 1,200,000, and 30,000 plus 15% above 1,200,000.
- Net = gross − deductions − tax.

A payslip is unique per employee, month and year (a repeat request returns `409`). Statuses: `Generated`, `Paid`.

### Reports `/reports` (Admin, HR)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/reports/dashboard` | Total employees, present today, pending leaves, this month's payroll total |
| GET | `/reports/monthly?month=10&year=2026` | Payslips and approved leave count for a month |

---

## Quick Test with cURL

```bash
# Sign in
curl -X POST https://hackathon-backend-lj1q.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hcm.com","password":"your_password"}'

# Use the token
curl https://hackathon-backend-lj1q.onrender.com/api/employees \
  -H "Authorization: Bearer <token>"
```

---

## Frontend

The web app lives in a separate repository and talks to this API.

- Live: https://hackathon-frontend-mocha-six.vercel.app
- Repository: https://github.com/ShahzaibKhan326/Hackathon_Frontend
