================================================================================
GOFIT GYM ATTENDANCE BRIDGE - INSTALLATION GUIDE
================================================================================

WHAT IS THIS?
-------------
This software connects your gym's turnstile controller to your online management
system. It reads attendance logs from the physical turnstile and uploads them to
your website automatically.

REQUIREMENTS
------------
1. Windows PC (Windows 7 or higher)
2. Python 3.7 or higher installed
3. Internet connection
4. Network connection to turnstile controller (MC-5924T)
5. Administrator access to install Windows service

BEFORE YOU START
----------------
1. Make sure your PC can reach the turnstile controller
   - Controller IP: 192.168.1.150
   - Controller Port: 8000
   - Test by pinging: ping 192.168.1.150

2. Get your backend URL and secret key from your web administrator

3. Download NSSM (service manager):
   - Visit: https://nssm.cc/download
   - Download the latest version
   - Extract nssm.exe to this folder

INSTALLATION STEPS
------------------

STEP 1: Edit Configuration
---------------------------
1. Open "config.txt" with Notepad
2. Update these values:
   
   APP_URL=https://yourusername.pythonanywhere.com
   (Replace with your actual PythonAnywhere URL)
   
   SECRET_KEY=your-secret-key-here
   (Replace with the secret key from your backend .env file)
   
3. Save and close the file

STEP 2: Install Python (if not already installed)
--------------------------------------------------
1. Download Python from: https://www.python.org/downloads/
2. Run the installer
3. IMPORTANT: Check "Add Python to PATH" during installation
4. Complete the installation
5. Restart your computer

STEP 3: Download NSSM
----------------------
1. Visit: https://nssm.cc/download
2. Download the latest version (nssm-2.24.zip or newer)
3. Extract the ZIP file
4. Copy nssm.exe from the win64 folder to this bridge_package folder

STEP 4: Install the Service
----------------------------
1. Right-click "install.bat"
2. Select "Run as administrator"
3. Follow the on-screen instructions
4. Wait for "Installation Complete!" message

The bridge is now running! It will automatically start when Windows boots.

CHECKING STATUS
---------------
Double-click "check_status.bat" to see:
- Service status (running/stopped)
- Recent log entries
- Any errors or warnings

VIEWING LOGS
------------
Open "bridge.log" with Notepad to see detailed activity:
- Connection status
- Records synced
- Errors and warnings

TROUBLESHOOTING
---------------

Problem: "Python is not installed or not in PATH"
Solution: Install Python and make sure "Add Python to PATH" is checked

Problem: "NSSM not found"
Solution: Download NSSM and copy nssm.exe to this folder

Problem: "Controller timeout"
Solution: 
- Check network cable connections
- Verify controller IP address (192.168.1.150)
- Ping the controller: ping 192.168.1.150

Problem: "Internet connection unavailable"
Solution:
- Check internet connection
- Verify APP_URL in config.txt is correct
- Records will be queued and synced when connection returns

Problem: "Invalid secret key"
Solution:
- Check SECRET_KEY in config.txt matches backend .env file
- No extra spaces or quotes

Problem: Service won't start
Solution:
1. Open bridge.log to see error details
2. Check config.txt for typos
3. Verify Python is installed correctly
4. Try uninstalling and reinstalling

UNINSTALLING
------------
1. Right-click "uninstall.bat"
2. Select "Run as administrator"
3. Wait for "Uninstallation Complete!" message

Note: This only removes the service. Your config files and logs remain.
You can safely delete this entire folder after uninstalling.

MAINTENANCE
-----------
- The service runs automatically - no daily action needed
- Check bridge.log weekly for any errors
- Log file is automatically rotated when it reaches 10MB

NETWORK SETTINGS
----------------
This PC should have:
- IP Address: 192.168.1.20 (or any IP in 192.168.1.x range)
- Subnet Mask: 255.255.255.0
- Gateway: 192.168.1.1

Controller should be at:
- IP Address: 192.168.1.150
- Port: 8000

HOW IT WORKS
------------
1. Every 30 seconds, the bridge polls the turnstile controller
2. New attendance records are retrieved
3. Records are uploaded to your website
4. If internet is down, records are saved locally and uploaded later
5. Every 5 minutes, a heartbeat is sent to show the bridge is online

SUPPORT
-------
If you encounter issues:
1. Check bridge.log for error messages
2. Run check_status.bat to see current status
3. Contact your system administrator with log file

================================================================================
VERSION: 1.0
LAST UPDATED: April 2026
================================================================================
