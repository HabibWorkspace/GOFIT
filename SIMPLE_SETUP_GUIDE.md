# 🚀 Simple Setup Guide - Local Gym App Migration

**Follow these steps exactly. Don't skip any step.**

---

## ⏱️ Time Required: 2-3 hours

---

## 📋 STEP 1: Install Python (10 minutes)

1. Go to: https://www.python.org/downloads/
2. Download **Python 3.11** (latest 3.11.x version)
3. Run the installer
4. ✅ **IMPORTANT:** Check the box "Add Python to PATH"
5. Click "Install Now"
6. Wait for installation
7. Open Command Prompt and test:
   ```cmd
   python --version
   ```
   Should show: `Python 3.11.x`

✅ **Done? Check this box:** [ ]

---

## 📋 STEP 2: Download Required Tools (10 minutes)

### A. Download NSSM (Service Manager)

1. Go to: https://nssm.cc/download
2. Download the ZIP file (nssm-2.24.zip or latest)
3. Extract it to your Downloads folder
4. Open Command Prompt and run:
   ```cmd
   mkdir C:\nssm
   copy "%USERPROFILE%\Downloads\nssm-2.24\win64\nssm.exe" C:\nssm\
   ```
5. Verify: `C:\nssm\nssm.exe` should exist

### B. Download Cloudflared (Tunnel) - IMPORTANT!

**The cloudflared command won't work until you do this:**

1. Go to: https://github.com/cloudflare/cloudflared/releases/latest
2. Scroll down to **Assets** section
3. Find and click: `cloudflared-windows-amd64.exe` (about 50MB)
4. Save to your Downloads folder
5. Open Command Prompt and run:
   ```cmd
   mkdir C:\cloudflared
   copy "%USERPROFILE%\Downloads\cloudflared-windows-amd64.exe" C:\cloudflared\cloudflared.exe
   ```
6. **Test it works:**
   ```cmd
   C:\cloudflared\cloudflared.exe version
   ```
   Should show version number like: `cloudflared version 2024.x.x`

**If you see "not recognized" error, the file is not in the right place!**

### C. Download AnyDesk (Remote Access)

1. Go to: https://anydesk.com/en/downloads/windows
2. Download and install
3. After installation, note your AnyDesk ID (you'll need this for remote access)

✅ **Done? Check this box:** [ ]

---

## 📋 STEP 3: Copy Your Backend Folder (5 minutes)

**IMPORTANT:** You already have a backend folder somewhere on this PC. Find it and copy it to C:\gymapp.

**Option 1: Using Command Prompt (Recommended)**

First, find where your backend folder is. Common locations:
- Desktop: `%USERPROFILE%\Desktop\backend`
- Documents: `%USERPROFILE%\Documents\backend`
- Downloads: `%USERPROFILE%\Downloads\backend`
- Or wherever you have your project

Once you know the location, open Command Prompt and run:

```cmd
REM Replace "PATH_TO_YOUR_BACKEND" with actual path
xcopy /E /I /H "PATH_TO_YOUR_BACKEND" "C:\gymapp"

REM Example if backend is on Desktop:
xcopy /E /I /H "%USERPROFILE%\Desktop\backend" "C:\gymapp"
```

**Option 2: Using File Explorer (Easier)**

1. Open File Explorer
2. Find your backend folder (wherever it is now)
3. Copy the entire folder (Ctrl+C)
4. Go to `C:\` drive
5. Paste it (Ctrl+V)
6. Rename the pasted folder to `gymapp`

**Verify it worked:**
- `C:\gymapp\app.py` should exist
- `C:\gymapp\models\` folder should exist
- `C:\gymapp\routes\` folder should exist

✅ **Done? Check this box:** [ ]

---

## 📋 STEP 4: Add Migration Files (5 minutes)

Copy these NEW files from the migration package to `C:\gymapp\`:

**Main files:**
- `run.py` → `C:\gymapp\run.py`
- `config_local.py` → `C:\gymapp\config_local.py`
- `requirements_local.txt` → `C:\gymapp\requirements.txt` (rename it!)
- `.env.local` → `C:\gymapp\.env` (rename it!)
- `config_bridge_local.txt` → `C:\gymapp\config.txt` (rename it!)
- `start_app.bat` → `C:\gymapp\start_app.bat`

**Data migration files:**
- `export_data.py` → `C:\gymapp\export_data.py`
- `import_data.py` → `C:\gymapp\import_data.py`
- `verify_data.py` → `C:\gymapp\verify_data.py`
- `update_app_for_local.py` → `C:\gymapp\update_app_for_local.py`

**Scripts folder:**
- Create folder: `C:\gymapp\scripts`
- Copy all `.bat` files from `scripts\` to `C:\gymapp\scripts\`

✅ **Done? Check this box:** [ ]

---

## 📋 STEP 5: Create Missing Folders (2 minutes)

Open Command Prompt and run:

```cmd
cd C:\gymapp
mkdir data
mkdir logs
mkdir backups
```

✅ **Done? Check this box:** [ ]

---

## 📋 STEP 6: Install Python Packages (10 minutes)

Open Command Prompt and run:

```cmd
cd C:\gymapp
python -m venv venv
call venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

**Wait for all packages to install (this takes 5-10 minutes).**

You'll see lots of text scrolling. That's normal.

✅ **Done? Check this box:** [ ]

---

## 📋 STEP 7: Configure Secrets (5 minutes)

### A. Generate Secret Keys

Run this command **3 times** to get 3 different keys:

```cmd
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Copy each key somewhere safe!**

### B. Edit .env File

Open `C:\gymapp\.env` in Notepad and update:

```ini
SECRET_KEY=paste-first-key-here
JWT_SECRET_KEY=paste-second-key-here
BRIDGE_SECRET_KEY=paste-third-key-here

# If using Gmail for emails:
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
```

**Save the file.**

### C. Edit config.txt File

Open `C:\gymapp\config.txt` in Notepad and update:

```ini
SECRET_KEY=paste-third-key-here-same-as-BRIDGE_SECRET_KEY
APP_URL=http://localhost:5000
```

**Save the file.**

### D. Update app.py

Run this to update imports:

```cmd
cd C:\gymapp
call venv\Scripts\activate
python update_app_for_local.py
```

✅ **Done? Check this box:** [ ]

---

## 📋 STEP 8: Export Data from PythonAnywhere (15 minutes)

### On PythonAnywhere:

1. Login to PythonAnywhere
2. Open a **Bash console**
3. Run these commands:

```bash
cd ~/yourusername.pythonanywhere.com/backend
python export_data.py
```

4. Wait for export to complete
5. Go to **Files** tab
6. Navigate to your backend folder
7. Find `gym_data_export.json`
8. Click to download it
9. Save to `C:\gymapp\gym_data_export.json`

✅ **Done? Check this box:** [ ]

---

## 📋 STEP 9: Import Data Locally (10 minutes)

Open Command Prompt and run:

```cmd
cd C:\gymapp
call venv\Scripts\activate
python import_data.py
```

**Wait for import to complete.**

Then verify:

```cmd
python verify_data.py
```

Should show all your records imported.

✅ **Done? Check this box:** [ ]

---

## 📋 STEP 10: Test Flask App (5 minutes)

Start the app manually to test:

```cmd
cd C:\gymapp
start_app.bat
```

**Wait for message:** "Server running at http://0.0.0.0:5000"

**Open browser and visit:**
```
http://localhost:5000/api/health
```

Should show:
```json
{"status": "healthy", "message": "FitCore backend is running"}
```

**Press Ctrl+C in Command Prompt to stop the app.**

✅ **Done? Check this box:** [ ]

---

## 📋 STEP 11: Set Up Cloudflare Tunnel (20 minutes)

### A. Create Cloudflare Account

1. Go to: https://cloudflare.com
2. Sign up (free account)
3. Verify your email

### B. Login to Cloudflare via Command Line

Open Command Prompt and run:

```cmd
cd C:\cloudflared
cloudflared.exe tunnel login
```

**If you get "not recognized" error:**
- Go back to Step 2B and make sure you downloaded and renamed the file correctly
- The file MUST be at: `C:\cloudflared\cloudflared.exe`
- Test with: `C:\cloudflared\cloudflared.exe version`

**Browser will open - login and authorize.**

A file will be created at: `C:\Users\YourUsername\.cloudflared\cert.pem`

### C. Create Tunnel

```cmd
cd C:\cloudflared
cloudflared.exe tunnel create gym-tunnel
```

**IMPORTANT:** You'll see output like this:

```
Created tunnel gym-tunnel with id abc123-def456-ghi789
Tunnel credentials written to C:\Users\YourUsername\.cloudflared\abc123-def456-ghi789.json
```

**Copy the tunnel ID!** (the abc123-def456-ghi789 part)

Write it here: _______________

### D. Create Config File

Create file: `C:\cloudflared\config.yml` (note: .yml not .yaml)

Open Notepad and paste this:

```yaml
tunnel: YOUR_TUNNEL_ID_HERE
credentials-file: C:\Users\YOUR_USERNAME\.cloudflared\YOUR_TUNNEL_ID_HERE.json

ingress:
  - service: http://localhost:5000
```

**Replace these 3 things:**
1. `YOUR_TUNNEL_ID_HERE` (first line) - paste your tunnel ID
2. `YOUR_USERNAME` - your Windows username (check with `echo %USERNAME%`)
3. `YOUR_TUNNEL_ID_HERE` (second line) - paste your tunnel ID again

**Save the file as:** `C:\cloudflared\config.yml`

**Example of what it should look like:**
```yaml
tunnel: abc123-def456-ghi789
credentials-file: C:\Users\John\.cloudflared\abc123-def456-ghi789.json

ingress:
  - service: http://localhost:5000
```

### E. Route DNS

```cmd
cd C:\cloudflared
cloudflared.exe tunnel route dns gym-tunnel gym-tunnel
```

This creates a free subdomain for you.

### F. Test Tunnel

First, make sure Flask is running:
```cmd
cd C:\gymapp
start_app.bat
```

In a NEW Command Prompt window:
```cmd
cd C:\cloudflared
cloudflared.exe tunnel run gym-tunnel
```

**You'll see output like:**
```
Your quick tunnel is available at: https://gym-tunnel-abc123.trycloudflare.com
```

**Copy this URL!** This is your public URL.

Write it here: _______________

**Open browser and visit that URL** - you should see your gym app!

**Press Ctrl+C in both windows to stop.**

### G. Update .env with Public URL

Open `C:\gymapp\.env` in Notepad and update:

```ini
PUBLIC_URL=https://gym-tunnel-abc123.trycloudflare.com
```

Replace with YOUR actual tunnel URL.

**Save the file.**

✅ **Done? Check this box:** [ ]

---

## 📋 STEP 12: Configure Power Settings (2 minutes)

**Right-click** `C:\gymapp\scripts\power_settings.bat`

Select **"Run as administrator"**

Wait for completion.

This ensures your PC never sleeps.

✅ **Done? Check this box:** [ ]

---

## 📋 STEP 13: Install Services (5 minutes)

**Right-click** `C:\gymapp\scripts\install_services.bat`

Select **"Run as administrator"**

Wait for installation to complete.

This installs:
- GymApp (Flask)
- GymBridge (Controller bridge)
- Cloudflared (Tunnel)

All services will start automatically.

✅ **Done? Check this box:** [ ]

---

## 📋 STEP 14: Verify Everything Works (10 minutes)

### A. Check Services

Run:
```cmd
C:\gymapp\scripts\check_all.bat
```

All services should show **"RUNNING"**

### B. Test Local Access

Open browser:
```
http://localhost:5000/api/health
```

Should return: `{"status": "healthy"}`

### C. Test Public Access

Open browser (on your phone or different device):
```
https://gym-tunnel-abc123.trycloudflare.com/api/health
```

Should return: `{"status": "healthy"}`

### D. Test Login

1. Go to your public URL
2. Login as super admin
3. Verify dashboard loads

### E. Test Gate Control

1. Login as member
2. Go to profile page
3. Scan QR code
4. **Gate should open INSTANTLY** (not 3 seconds!)

✅ **Done? Check this box:** [ ]

---

## 📋 STEP 15: Update QR Codes (5 minutes)

Old QR codes have PythonAnywhere URL. Update them:

```cmd
cd C:\gymapp
call venv\Scripts\activate
python regenerate_qr_codes.py
```

Type `yes` when asked.

**OR** have each member refresh their profile page.

✅ **Done? Check this box:** [ ]

---

## 🎉 SETUP COMPLETE!

### ✅ Final Checklist:

- [ ] All services running
- [ ] Local health check works
- [ ] Public URL works
- [ ] Login works
- [ ] QR scan → gate opens instantly
- [ ] Attendance logs syncing
- [ ] No errors in logs

### 📊 Check Status Anytime:

```cmd
C:\gymapp\scripts\check_all.bat
```

### 🔄 Restart Services:

```cmd
C:\gymapp\scripts\restart_all.bat
```

### 📝 View Logs:

```cmd
type C:\gymapp\logs\app.log
type C:\gymapp\logs\bridge.log
```

---

## 🆘 Troubleshooting

### "cloudflared is not recognized" Error

**This means cloudflared.exe is not in the right place or not named correctly.**

**Fix it:**

1. Check if file exists:
   ```cmd
   dir C:\cloudflared\cloudflared.exe
   ```
   
2. If it says "File Not Found":
   - Go to your Downloads folder
   - Find `cloudflared-windows-amd64.exe`
   - Copy it to `C:\cloudflared\`
   - Rename it to just `cloudflared.exe`

3. Test again:
   ```cmd
   C:\cloudflared\cloudflared.exe version
   ```

4. If it still doesn't work, download again from:
   https://github.com/cloudflare/cloudflared/releases/latest
   Look for: `cloudflared-windows-amd64.exe` in Assets section

### Service won't start?

```cmd
REM Check logs
type C:\gymapp\logs\error.log

REM Try manual start
cd C:\gymapp
start_app.bat
```

### Gate not opening?

```cmd
REM Check bridge logs
type C:\gymapp\logs\bridge.log

REM Ping controller
ping 192.168.1.150
```

### Can't access public URL?

```cmd
REM Check tunnel
cd C:\cloudflared
cloudflared.exe tunnel info gym-tunnel

REM Restart tunnel service
net stop Cloudflared
net start Cloudflared
```

### Python not found?

Make sure you checked "Add Python to PATH" during installation.

**Fix it:**
1. Uninstall Python
2. Download again from python.org
3. Run installer
4. **CHECK the box:** "Add Python to PATH"
5. Install

### Virtual environment issues?

```cmd
cd C:\gymapp
rmdir /s /q venv
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
```

---

## 📞 Important Info to Save

**Write these down:**

- AnyDesk ID: _______________
- Cloudflare Tunnel URL: _______________
- SECRET_KEY: _______________ (keep secure!)
- BRIDGE_SECRET_KEY: _______________ (keep secure!)

---

## 🎯 Next Steps

1. **Monitor for 48 hours** - Check logs daily
2. **Test all features** - Members, trainers, finance, etc.
3. **Train staff** - Show them how to check status
4. **Set up daily backups** - Copy `C:\gymapp\data\gym.db` daily
5. **Deactivate PythonAnywhere** - Once everything works perfectly

---

## 💾 Daily Backup (Set This Up)

Create a scheduled task in Windows to run daily at 2 AM:

```cmd
copy C:\gymapp\data\gym.db C:\gymapp\backups\gym_%date:~-4,4%%date:~-10,2%%date:~-7,2%.db
```

---

## ✨ What You've Achieved

✅ **Instant gate control** - No more 3-second delay
✅ **Full control** - Your hardware, your rules
✅ **No hosting costs** - Cloudflare is free
✅ **Better performance** - Dedicated resources
✅ **Offline capability** - Gate works without internet
✅ **Professional setup** - Auto-start, auto-restart

---

**Congratulations! Your gym app is now running locally!** 🎉

**Questions? Check the logs first, then review the troubleshooting section.**
