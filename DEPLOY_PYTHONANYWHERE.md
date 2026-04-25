# GOFIT — PythonAnywhere Deployment Guide

## Overview
Both frontend (React) and backend (Flask) are served from PythonAnywhere.
Flask serves the React `dist/` folder as static files, so everything runs on one domain.

---

## Step 1 — Build the Frontend

On your local machine:

```bash
cd frontend
npm run build
```

This creates `frontend/dist/` — the compiled React app.

---

## Step 2 — Upload to PythonAnywhere

### Option A — Git (recommended)
In PythonAnywhere Bash console:
```bash
git clone https://github.com/HabibWorkspace/GOFIT ~/gofit
```

### Option B — Manual Upload
1. Go to PythonAnywhere → Files tab
2. Create folder: `/home/yourusername/gofit/`
3. Upload the entire project (backend/ and frontend/dist/)

---

## Step 3 — Install Python Dependencies

In PythonAnywhere Bash console:
```bash
cd ~/gofit/backend
pip3.10 install --user -r requirements_pythonanywhere.txt
```

---

## Step 4 — Set Up the .env File

```bash
cd ~/gofit/backend
cp .env.production .env
nano .env
```

Edit these values:
- `SECRET_KEY` — run `python3 -c "import secrets; print(secrets.token_hex(32))"`
- `JWT_SECRET_KEY` — same as above, different value
- `DATABASE_URL` — `sqlite:////home/yourusername/gofit/backend/instance/fitnix.db`
- `MAIL_USERNAME` — your Gmail address
- `MAIL_PASSWORD` — your Gmail App Password
- `MAIL_DEFAULT_SENDER` — same as MAIL_USERNAME
- `FRONTEND_URL` — `https://habib13564855.pythonanywhere.com`
- Replace `yourusername` with your actual PythonAnywhere username

---

## Step 5 — Upload the Database

Upload your `backend/instance/fitnix.db` to:
`/home/yourusername/gofit/backend/instance/fitnix.db`

---

## Step 6 — Configure the Web App

1. Go to PythonAnywhere → **Web** tab
2. Click **Add a new web app**
3. Choose **Manual configuration**
4. Choose **Python 3.10**
5. Set the following:

| Setting | Value |
|---------|-------|
| Source code | `/home/yourusername/gofit/backend` |
| Working directory | `/home/yourusername/gofit/backend` |
| WSGI configuration file | (edit the auto-generated file) |

6. Click the WSGI configuration file link and replace ALL content with:

```python
import sys
import os

path = '/home/yourusername/gofit/backend'
if path not in sys.path:
    sys.path.insert(0, path)

os.environ['FLASK_ENV'] = 'production'

from app_pythonanywhere import application
```

7. Click **Save**

---

## Step 7 — Reload the Web App

Click the green **Reload** button on the Web tab.

Visit `https://yourusername.pythonanywhere.com` — you should see the GOFIT login page.

---

## Troubleshooting

### Check error logs
Web tab → Log files → Error log

### Common issues

**ModuleNotFoundError** — package not installed
```bash
pip3.10 install --user <package-name>
```

**Database not found**
```bash
mkdir -p ~/gofit/backend/instance
# Then re-upload fitnix.db
```

**Static files not loading (404)**
Make sure `frontend/dist/` exists and was uploaded correctly.

**Email not sending**
- Verify Gmail App Password (not your regular password)
- Check error log for SMTP errors

---

## Updating the App

```bash
cd ~/gofit
git pull
# If frontend changed, rebuild locally and re-upload frontend/dist/
# Then reload the web app on PythonAnywhere
```
