# 🚀 COMPLETE TURNSTILE DEPLOYMENT GUIDE
## GOFIT Gym Attendance System - Owner's Manual

---

## 📋 TABLE OF CONTENTS
1. [System Overview](#system-overview)
2. [What You Need](#what-you-need)
3. [Network Setup](#network-setup)
4. [PythonAnywhere Backend Setup](#pythonanywhere-backend-setup)
5. [Front Desk PC Setup](#front-desk-pc-setup)
6. [Testing & Verification](#testing--verification)
7. [Troubleshooting](#troubleshooting)
8. [Daily Operations](#daily-operations)

---

## 🎯 SYSTEM OVERVIEW

### How It Works

```
┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
│  Turnstile Gate     │  Local  │   Front Desk PC     │ Internet│   PythonAnywhere    │
│  MC-5924T           │  LAN    │   Bridge Service    │  HTTPS  │   Your Website      │
│  192.168.1.150      │◄───────►│   192.168.1.20      │◄───────►│   Cloud Database    │
└─────────────────────┘         └─────────────────────┘         └─────────────────────┘
        ↑                                ↑                                ↑
    Member scans                  Reads & uploads                  Shows in
    RFID card                     attendance data                  dashboard
```

### What Happens When a Member Scans:
1. Member scans RFID card at turnstile
2. Turnstile controller logs the scan
3. Bridge software (on front desk PC) reads the log every 30 seconds
4. Bridge uploads attendance to your PythonAnywhere website
5. Attendance appears in your admin dashboard instantly

---

## 📦 WHAT YOU NEED

### Hardware
- ✅ MC-5924T TCP/IP Access Controller (your turnstile)
- ✅ Windows PC at front desk (Windows 7 or higher)
- ✅ Network cable connecting PC to controller
- ✅ Internet connection for PC

### Software (Free Downloads)
- ✅ Python 3.7+ (https://www.python.org/downloads/)
- ✅ NSSM Service Manager (https://nssm.cc/download)
- ✅ Bridge Package (already in your `bridge_package` folder)

### Information You'll Need
- ✅ Your PythonAnywhere username
- ✅ Your backend secret key (from `.env` file)
- ✅ Controller IP address (default: 192.168.1.150)

---

## 🌐 NETWORK SETUP

### Step 1: Configure Controller IP

Your MC-5924T controller should be set to:
- **IP Address**: `192.168.1.150`
- **Port**: `8000`
- **Subnet Mask**: `255.255.255.0`

> **Note**: This is usually pre-configured. Check controller manual if needed.

### Step 2: Configure Front Desk PC Network

#### Option A: Automatic (DHCP) - Easier
1. Connect PC to same network as controller
2. PC will get IP automatically (e.g., 192.168.1.20)
3. Test: Open Command Prompt and type: `ping 192.168.1.150`
4. You should see replies - this means PC can reach controller ✅

#### Option B: Static IP - More Reliable (Recommended)
1. Open **Control Panel** → **Network and Sharing Center**
2. Click **Change adapter settings**
3. Right-click your network adapter → **Properties**
4. Select **Internet Protocol Version 4 (TCP/IPv4)** → **Properties**
5. Select **Use the following IP address**:
   ```
   IP Address: 192.168.1.20
   Subnet Mask: 255.255.255.0
   Default Gateway: 192.168.1.1
   Preferred DNS: 8.8.8.8
   ```
6. Click **OK** → **OK**
7. Test: `ping 192.168.1.150` (should get replies)

### Step 3: Test Internet Connection
```cmd
ping google.com
```
You should see replies - this means PC has internet ✅

---

## ☁️ PYTHONANYWHERE BACKEND SETUP

### Step 1: Verify Backend is Running

1. Go to: `https://yourusername.pythonanywhere.com`
2. You should see your gym website
3. Login to admin panel
4. If you see the dashboard, backend is working ✅

### Step 2: Get Your Secret Key

**Method 1: From PythonAnywhere Dashboard**
1. Login to PythonAnywhere.com
2. Go to **Web** tab
3. Scroll to **Code** section
4. Click **Go to directory** next to "Source code"
5. Click on `backend` folder
6. Click on `.env` file
7. Find line: `BRIDGE_SECRET_KEY=xxxxx`
8. **Copy this key** - you'll need it soon!

**Method 2: From Your Local Files**
1. Open your project folder
2. Navigate to `backend/.env`
3. Find: `BRIDGE_SECRET_KEY=xxxxx`
4. **Copy this key**

> **⚠️ IMPORTANT**: If `BRIDGE_SECRET_KEY` doesn't exist in `.env`, add it:
> ```
> BRIDGE_SECRET_KEY=your-super-secret-key-here-change-this
> ```
> Then upload the updated `.env` to PythonAnywhere and reload your web app.

### Step 3: Verify Attendance Endpoints

Your backend should have these endpoints (already built):
- ✅ `POST /api/attendance/sync` - Receives attendance data
- ✅ `POST /api/attendance/bridge/heartbeat` - Receives bridge status

These are already in your `backend/routes/attendance.py` file.

---

## 💻 FRONT DESK PC SETUP

### Step 1: Install Python

1. **Download Python**
   - Go to: https://www.python.org/downloads/
   - Click **Download Python 3.x.x** (latest version)

2. **Install Python**
   - Run the installer
   - ⚠️ **CRITICAL**: Check ☑️ **"Add Python to PATH"** at bottom
   - Click **Install Now**
   - Wait for installation to complete
   - Click **Close**

3. **Verify Installation**
   - Open **Command Prompt** (search "cmd" in Start menu)
   - Type: `python --version`
   - Should show: `Python 3.x.x` ✅

### Step 2: Download NSSM

1. **Download**
   - Go to: https://nssm.cc/download
   - Click **Download nssm 2.24** (or latest version)
   - Save the ZIP file

2. **Extract**
   - Right-click the ZIP file → **Extract All**
   - Open the extracted folder
   - Go to `win64` folder
   - Find `nssm.exe`

3. **Copy to Bridge Package**
   - Copy `nssm.exe`
   - Paste it into your `bridge_package` folder
   - Should be next to `bridge.py`

### Step 3: Configure Bridge

1. **Open Configuration File**
   - Navigate to `bridge_package` folder
   - Right-click `config.txt` → **Open with Notepad**

2. **Edit Configuration**
   ```ini
   # Controller Settings (usually don't need to change)
   CONTROLLER_IP=192.168.1.150
   CONTROLLER_PORT=8000

   # Backend Settings (CHANGE THESE!)
   APP_URL=https://yourusername.pythonanywhere.com
   SECRET_KEY=paste-your-secret-key-here

   # Timing Settings (can leave as default)
   POLL_INTERVAL=30
   HEARTBEAT_INTERVAL=300
   ```

3. **Replace Values**
   - `APP_URL`: Replace `yourusername` with your actual PythonAnywhere username
   - `SECRET_KEY`: Paste the secret key you copied earlier
   - **Remove any trailing slashes** from APP_URL
   - **No quotes** around values

4. **Save and Close**
   - File → Save
   - Close Notepad

### Step 4: Install Python Dependencies

1. **Open Command Prompt as Administrator**
   - Search "cmd" in Start menu
   - Right-click **Command Prompt**
   - Select **Run as administrator**

2. **Navigate to Bridge Package**
   ```cmd
   cd C:\path\to\your\bridge_package
   ```
   (Replace with actual path to your bridge_package folder)

3. **Install Dependencies**
   ```cmd
   pip install requests
   ```
   Wait for installation to complete ✅

### Step 5: Test Connection (IMPORTANT!)

1. **Run Test Script**
   ```cmd
   python test_connection.py
   ```

2. **Check Results**
   You should see:
   ```
   ✓ Python version OK
   ✓ Required packages installed
   ✓ Controller reachable
   ✓ Backend authentication successful
   
   All tests passed! Ready to install service.
   ```

3. **If Any Test Fails**
   - See [Troubleshooting](#troubleshooting) section below
   - Fix the issue before continuing

### Step 6: Install as Windows Service

1. **Run Installer**
   - Navigate to `bridge_package` folder
   - Right-click `install.bat`
   - Select **Run as administrator**

2. **Wait for Completion**
   - You'll see installation progress
   - Should end with: **"Installation Complete!"**
   - Service is now running ✅

3. **Verify Service**
   - Double-click `check_status.bat`
   - Should show: **"Service Status: Running"**
   - Check recent log entries for activity

---

## ✅ TESTING & VERIFICATION

### Test 1: Check Service Status

```cmd
check_status.bat
```

**Expected Output:**
```
Service Status: Running
Last 20 log entries:
[2026-04-22 10:30:00] INFO: Bridge service started
[2026-04-22 10:30:01] INFO: Heartbeat sent successfully
[2026-04-22 10:30:30] INFO: Retrieved 0 new records from controller
```

### Test 2: Scan a Test Card

1. **Assign Card to Member**
   - Login to admin dashboard
   - Go to **Members**
   - Edit a member
   - Add their **Card ID** (8-digit number from RFID card)
   - Save

2. **Scan Card at Turnstile**
   - Have member scan their card
   - Turnstile should beep/open

3. **Check Dashboard (within 30 seconds)**
   - Go to **Attendance** page
   - Should see new attendance record ✅
   - Shows: Member name, time, date

### Test 3: Check Bridge Status

1. **Go to Attendance Dashboard**
2. **Look for Bridge Status Indicator**
   - Should show: **🟢 Online**
   - Shows: Last seen time (should be recent)
   - Shows: Records synced today

### Test 4: Check Logs

1. **Open Log File**
   - Navigate to `bridge_package` folder
   - Open `bridge.log` with Notepad

2. **Look For**
   - ✅ "Bridge service started"
   - ✅ "Heartbeat sent successfully"
   - ✅ "Retrieved X new records"
   - ✅ "Synced X records"
   - ❌ No error messages

---

## 🔧 TROUBLESHOOTING

### Problem: "Python is not installed or not in PATH"

**Solution:**
1. Uninstall Python
2. Reinstall Python
3. ⚠️ **CHECK** "Add Python to PATH" during installation
4. Restart computer
5. Test: `python --version`

### Problem: "NSSM not found"

**Solution:**
1. Download NSSM from https://nssm.cc/download
2. Extract ZIP file
3. Copy `nssm.exe` from `win64` folder
4. Paste into `bridge_package` folder
5. Run `install.bat` again

### Problem: "Controller timeout"

**Symptoms:**
- Log shows: "Controller timeout: 192.168.1.150:8000"
- No attendance records syncing

**Solutions:**
1. **Check Physical Connection**
   - Verify network cable is plugged in
   - Check cable is not damaged
   - Try different cable

2. **Check Controller Power**
   - Verify controller is powered on
   - Check power LED is lit

3. **Test Network Connection**
   ```cmd
   ping 192.168.1.150
   ```
   - Should get replies
   - If "Request timed out", check network settings

4. **Verify Controller IP**
   - Check controller display/manual for actual IP
   - Update `CONTROLLER_IP` in `config.txt` if different
   - Restart service: `nssm restart GymBridge`

### Problem: "Backend HTTP error 401" or "Invalid secret key"

**Symptoms:**
- Log shows: "Backend HTTP error: 401"
- Or: "Invalid secret key"

**Solutions:**
1. **Verify Secret Key**
   - Open `backend/.env` on PythonAnywhere
   - Copy `BRIDGE_SECRET_KEY` value
   - Open `bridge_package/config.txt`
   - Paste into `SECRET_KEY=` line
   - **No quotes, no spaces**

2. **Restart Service**
   ```cmd
   nssm restart GymBridge
   ```

3. **Check Backend .env**
   - Make sure `BRIDGE_SECRET_KEY` exists in backend `.env`
   - If missing, add it and reload web app on PythonAnywhere

### Problem: "Internet connection unavailable"

**Symptoms:**
- Log shows: "Internet connection unavailable"
- Records queued locally

**Solutions:**
1. **Test Internet**
   ```cmd
   ping google.com
   ```
   - Should get replies

2. **Check Firewall**
   - Windows Firewall might be blocking Python
   - Add exception for Python.exe

3. **Verify APP_URL**
   - Open `config.txt`
   - Check `APP_URL` is correct
   - No trailing slash
   - Should be: `https://yourusername.pythonanywhere.com`

4. **Wait for Connection**
   - Records are saved locally
   - Will auto-sync when internet returns ✅

### Problem: "Unknown cards" in dashboard

**Symptoms:**
- Attendance page shows "Unknown Cards" section
- Card IDs listed but no member names

**Solutions:**
1. **Assign Card IDs to Members**
   - Go to **Members** page
   - Edit each member
   - Add their **Card ID** (8-digit number)
   - Save

2. **Verify Card ID Format**
   - Should be 8 digits
   - Example: `00123456`
   - Leading zeros are important

3. **Re-scan Card**
   - Have member scan again
   - Should now show member name ✅

### Problem: Service won't start

**Symptoms:**
- `check_status.bat` shows "Stopped"
- Service keeps stopping

**Solutions:**
1. **Check Log File**
   - Open `bridge.log`
   - Look for error messages at the end
   - Fix the specific error

2. **Run Manually to See Errors**
   ```cmd
   cd bridge_package
   python bridge.py
   ```
   - Watch console output
   - Press Ctrl+C to stop
   - Fix any errors shown

3. **Reinstall Service**
   ```cmd
   uninstall.bat
   install.bat
   ```

4. **Check Python Installation**
   ```cmd
   python --version
   pip list
   ```
   - Should show Python 3.x
   - Should show `requests` package

---

## 📅 DAILY OPERATIONS

### What Runs Automatically

✅ **Bridge service runs 24/7**
- Starts automatically when Windows boots
- Polls controller every 30 seconds
- Uploads attendance to cloud
- Sends heartbeat every 5 minutes
- Queues records if internet is down

✅ **No daily action needed!**

### Weekly Checks (Recommended)

**Monday Morning Routine:**

1. **Check Service Status**
   ```cmd
   check_status.bat
   ```
   - Should show "Running"

2. **Check Dashboard**
   - Login to admin panel
   - Go to Attendance page
   - Bridge status should be 🟢 Online

3. **Review Logs (Optional)**
   - Open `bridge.log`
   - Scroll to bottom
   - Look for any errors
   - Should see regular "Retrieved X records" messages

### Monthly Maintenance

1. **Check Log File Size**
   - If `bridge.log` is over 50MB, it will auto-rotate
   - Old logs saved as `bridge.log.1`, `bridge.log.2`, etc.
   - Can delete old logs to save space

2. **Verify Pending Queue is Empty**
   - Open `pending_records.json`
   - Should be empty: `[]`
   - If not empty, check internet connection

3. **Test a Card Scan**
   - Scan a test card
   - Verify appears in dashboard within 30 seconds

---

## 🔄 UPDATING CONFIGURATION

### To Change Controller IP

1. Stop service:
   ```cmd
   nssm stop GymBridge
   ```

2. Edit `config.txt`:
   ```ini
   CONTROLLER_IP=192.168.1.XXX
   ```

3. Start service:
   ```cmd
   nssm start GymBridge
   ```

### To Change Backend URL

1. Stop service
2. Edit `config.txt`:
   ```ini
   APP_URL=https://newusername.pythonanywhere.com
   ```
3. Start service

### To Change Poll Interval

1. Edit `config.txt`:
   ```ini
   POLL_INTERVAL=15  # Check every 15 seconds instead of 30
   ```
2. Restart service:
   ```cmd
   nssm restart GymBridge
   ```

---

## 🗑️ UNINSTALLING

If you need to remove the bridge service:

1. **Run Uninstaller**
   - Right-click `uninstall.bat`
   - Select "Run as administrator"
   - Wait for "Uninstallation Complete!"

2. **Service is Removed**
   - No longer runs automatically
   - Config files and logs remain

3. **Delete Files (Optional)**
   - Can safely delete entire `bridge_package` folder
   - Backup `config.txt` and `bridge.log` first if needed

---

## 📞 SUPPORT CHECKLIST

If you need help, gather this information:

1. **Service Status**
   ```cmd
   check_status.bat
   ```
   Copy the output

2. **Last 50 Lines of Log**
   - Open `bridge.log`
   - Copy last 50 lines

3. **Configuration** (redact secret key)
   - Copy `config.txt` content
   - Replace SECRET_KEY with "REDACTED"

4. **Network Test**
   ```cmd
   ping 192.168.1.150
   ping google.com
   ipconfig
   ```
   Copy the output

5. **Python Version**
   ```cmd
   python --version
   pip list
   ```
   Copy the output

---

## ✨ SUCCESS INDICATORS

You'll know everything is working when:

✅ `check_status.bat` shows "Running"
✅ Dashboard shows bridge status 🟢 Online
✅ Card scans appear in attendance within 30 seconds
✅ `bridge.log` shows regular "Retrieved X records" messages
✅ No error messages in logs
✅ Members can enter gym with their cards

---

## 🎉 CONGRATULATIONS!

Your turnstile attendance system is now fully deployed and operational!

**What happens now:**
- Members scan cards → Attendance logged automatically
- You see real-time attendance in dashboard
- No manual entry needed
- System runs 24/7 automatically

**Questions?**
- Check `bridge.log` for detailed activity
- Run `check_status.bat` to verify service
- Review troubleshooting section above

---

**Version**: 1.0  
**Last Updated**: April 2026  
**System**: GOFIT Gym Management Platform
