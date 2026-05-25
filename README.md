# Modern Fitness — Gym Management System

A full-stack gym management platform with role-based access control, hardware attendance integration, real-time notifications, and financial reporting. Built with Python Flask, React.js, and SQLite.

---
<img width="1024" height="472" alt="image" src="https://github.com/user-attachments/assets/6b4e15ee-2ad5-41de-9c3f-7311da4c16f3" />



---

##  Features

###  Admin Portal
<img width="1306" height="603" alt="image" src="https://github.com/user-attachments/assets/6ca7fc06-1d70-4537-80a5-73e9a100957a" />


| Module | Description |
|--------|-------------|
| **Dashboard** | Real-time stats — total members, inactive members, overdue payments |
| **Member Management** | Full member profiles, admission dates, monthly attendance summaries, payment history |
| **Overdue Alerts** | Automatically prompt WhatsApp message to members with overdue payments |
| **Email Integration** | Password reset via email |
| **Trainer Management** | Trainer list with commission tracking and printable receipts |
| **Finance Module** | Search any member's financial history, generate monthly receipts |
| **Analytics** | Gym performance insights |
| **Settings** | Configure admission fees, reset passwords |
| **Attendance** | View and manage member attendance logs |

###  Super Admin Portal
<img width="1309" height="609" alt="image" src="https://github.com/user-attachments/assets/b8588288-0be7-40da-9176-db7c71dec0b4" />

| Module | Description |
|--------|-------------|
| **Audit Log** | Full log of receptionist/admin actions in real time |
| **Finance** | Monthly profit & loss statement |
| **Admin Management** | Create and manage admin (receptionist) accounts |
| **Attendance Summary** | Today's check-in overview across all members |

###  Member Portal
<img width="914" height="608" alt="image" src="https://github.com/user-attachments/assets/fa8debb5-b686-4514-a69f-49b3ca3e3d05" />

- Members mark and view their own attendance
- Personal attendance history

---

##  Bonus Features

- **Turnstile Machine Integration** — Physical turnstile linked to the system; members scan a QR code per session to auto-log attendance
- **Live Attendance Pop-ups** — Real-time notifications via Pusher WebSockets whenever a member checks in
- **Birthday Pop-ups** — System automatically shows a celebration alert on a member's birthday

---

## Tech Stack

- **Frontend:** React.js, JavaScript, HTML/CSS
- **Backend:** Python Flask, REST API
- **Database:** SQLite
- **Real-time:** Pusher (WebSockets)
- **Notifications:** WhatsApp API, SMTP Email
- **Attendance Hardware:** Turnstile machine + QR Code session scanning

---

##  Getting Started

### Prerequisites
- Python 3.x
- Node.js & npm
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/HabibWorkspace/MODERN-FITNESS-GYM.git
cd MODERN-FITNESS-GYM

# Backend setup
pip install -r requirements.txt
python app.py

# Frontend setup (in a new terminal)
cd frontend
npm install
npm start
```

### Environment Variables

Create a `.env` file in the root:

```env
SECRET_KEY=your_secret_key
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
MAIL_USERNAME=your_email
MAIL_PASSWORD=your_email_password
WHATSAPP_API_KEY=your_whatsapp_key
```

---

##  User Roles

| Role | Access Level |
|------|-------------|
| `super_admin` | Full system access, audit logs, P&L reports |
| `admin` | Member/trainer management, finance, attendance |
| `member` | Personal attendance and profile only |

---

##  License

MIT License — feel free to use this as a reference or learning resource.

---

##  Contact

Built by **Habib** — m.habib.workspace@gmail.com
