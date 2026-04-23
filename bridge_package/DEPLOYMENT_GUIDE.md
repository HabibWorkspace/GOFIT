# GOFIT Attendance Bridge - Deployment Guide

## Overview

The GOFIT Attendance Bridge is a Windows service that connects your gym's MC-5924T TCP/IP Access Controller to your cloud-based management system. It automatically syncs attendance data from the physical turnstile to your PythonAnywhere backend.

## System Architecture

```
┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
│  Turnstile Gate     │  UDP    │   Front Desk PC     │  HTTPS  │   PythonAnywhere    │
│  MC-5924T           │◄───────►│   Bridge Service    │◄───────►│   Backend API       │
│  192.168.1.150:8000 │         │   192.168.1.20      │         │   Cloud Database    │
└─────────────────────┘         └─────────────────────┘         └─────────────────────┘
```

## Prerequisites

### Hardware Requirements
- Windows PC (Windows 7 or higher)
- Minimum 2GB RAM
- 100MB free disk space
- Network connection to controller
- Internet connection

### Software Requirements
- Python 3.7 or higher
- NSSM (Non-Sucking Service Manager)
- Administrator access

### Network Requirements
- PC can reach controller at 192.168.1.150:8000
- PC has internet access
- Firewall allows outbound HTTPS (port 443)

## Installation Steps

### Step 1: Prepare the PC

1. **Set Static IP (Recommended)**
   ```
   IP Address: 192.168.1.20
   Subnet Mask: 255.255.255.0
   Gateway: 192.168.1.1
   DNS: 8.8.8.8
   ```

2. **Install Python**
   - Download from: https://www.python.org/downloads/
   - During installation, check "Add Python to PATH"
   - Verify: Open Command Prompt and run `python --version`

3. **Download NSSM**
   - Visit: https://nssm.cc/download
   - Download latest version (e.g., nssm-2.24.zip)
   - Extract `nssm.exe` from win64 folder
   - Copy to bridge_package folder

### Step 2: Configure the Bridge

1. **Edit config.txt**
   ```ini
   CONTROLLER_IP=192.168.1.150
   CONTROLLER_PORT=8000
   APP_URL=https://yourusername.pythonanywhere.com
   SECRET_KEY=your-actual-secret-key-here
   POLL_INTERVAL=30
   HEARTBEAT_INTERVAL=300
   ```

2. **Important Notes**
   - `APP_URL`: Must match your PythonAnywhere URL (no trailing slash)
   - `SECRET_KEY`: Must match `BRIDGE_SECRET_KEY` in backend `.env` file
   - `POLL_INTERVAL`: How often to check for new records (seconds)
   - `HEARTBEAT_INTERVAL`: How often to ping backend (seconds)

### Step 3: Test Configuration

1. **Run Connection Test**
   ```bash
   python test_connection.py
   ```

2. **Verify All Tests Pass**
   - Python version check
   - Required packages installed
   - Controller reachable
   - Backend authentication successful

3. **Manual Test (Optional)**
   ```bash
   python bridge.py
   ```
   - Watch console output
   - Press Ctrl+C to stop
   - Check bridge.log for errors

### Step 4: Install as Windows Service

1. **Run Installer**
   - Right-click `install.bat`
   - Select "Run as administrator"
   - Wait for "Installation Complete!" message

2. **Verify Service**
   - Run `check_status.bat`
   - Service should show "Running"
   - Check bridge.log for activity

## Configuration Reference

### config.txt Parameters

| Parameter | Description | Default | Notes |
|-----------|-------------|---------|-------|
| CONTROLLER_IP | Controller IP address | 192.168.1.150 | Must be reachable from PC |
| CONTROLLER_PORT | Controller UDP port | 8000 | Usually 8000 for MC-5924T |
| APP_URL | Backend URL | - | No trailing slash |
| SECRET_KEY | Authentication key | - | Must match backend |
| POLL_INTERVAL | Polling frequency (sec) | 30 | Recommended: 30-60 |
| HEARTBEAT_INTERVAL | Heartbeat frequency (sec) | 300 | Recommended: 300 |

### Backend Configuration

Ensure your backend `.env` file contains:
```env
BRIDGE_SECRET_KEY=your-actual-secret-key-here
```

This must match the `SECRET_KEY` in bridge config.txt.

## Operation

### Normal Operation

The bridge runs automatically in the background:

1. **Every 30 seconds** (POLL_INTERVAL):
   - Polls controller for new attendance records
   - Uploads records to backend
   - If internet down, queues records locally

2. **Every 5 minutes** (HEARTBEAT_INTERVAL):
   - Sends heartbeat to backend
   - Backend shows "Online" status

3. **On startup**:
   - Loads configuration
   - Attempts to sync any queued records
   - Begins normal polling cycle

### Offline Mode

If internet connection is lost:
- Records are saved to `pending_records.json`
- Bridge continues polling controller
- When connection restored, queued records are synced
- No data loss occurs

### Log Files

**bridge.log** contains:
- Startup messages
- Records synced count
- Errors and warnings
- Heartbeat confirmations

Log file is automatically rotated at 10MB.

## Monitoring

### Check Service Status

Run `check_status.bat` to see:
- Service running/stopped
- Last 20 log entries
- Quick commands

### View Full Logs

Open `bridge.log` in Notepad to see:
- Complete activity history
- Error details
- Sync statistics

### Backend Dashboard

Check admin attendance page:
- Bridge status indicator (green = online)
- Records synced today count
- Last seen timestamp

## Troubleshooting

### Service Won't Start

**Symptom**: Service shows "Stopped" in check_status.bat

**Solutions**:
1. Check bridge.log for error messages
2. Verify Python is installed: `python --version`
3. Verify config.txt has no typos
4. Run `python bridge.py` manually to see errors
5. Reinstall: uninstall.bat → install.bat

### Controller Timeout

**Symptom**: Log shows "Controller timeout"

**Solutions**:
1. Verify controller is powered on
2. Check network cable connections
3. Ping controller: `ping 192.168.1.150`
4. Verify CONTROLLER_IP in config.txt
5. Check firewall isn't blocking UDP port 8000

### Backend Connection Failed

**Symptom**: Log shows "Internet connection unavailable" or "Backend HTTP error"

**Solutions**:
1. Check internet connection: `ping google.com`
2. Verify APP_URL in config.txt (no trailing slash)
3. Check SECRET_KEY matches backend .env
4. Verify backend is running on PythonAnywhere
5. Check firewall allows outbound HTTPS

### Authentication Failed

**Symptom**: Log shows "Invalid secret key" or HTTP 401

**Solutions**:
1. Compare SECRET_KEY in config.txt with backend .env
2. Ensure no extra spaces or quotes
3. Restart service after changing config
4. Check backend logs for authentication errors

### No Records Syncing

**Symptom**: Service running but no records appear in dashboard

**Solutions**:
1. Verify members have card_id assigned in admin panel
2. Check controller is logging scans
3. Verify bridge.log shows "Retrieved X new records"
4. Check for "Unknown cards" in attendance dashboard
5. Manually test card scan at turnstile

## Maintenance

### Regular Tasks

**Weekly**:
- Check bridge.log for errors
- Verify service is running
- Check backend dashboard shows "Online"

**Monthly**:
- Review log file size
- Check pending_records.json is empty
- Verify sync statistics are reasonable

### Updates

To update bridge configuration:
1. Edit config.txt
2. Restart service: `nssm restart GymBridge`
3. Verify changes in bridge.log

To update bridge.py:
1. Stop service: `nssm stop GymBridge`
2. Replace bridge.py
3. Start service: `nssm start GymBridge`

### Backup

Backup these files regularly:
- config.txt (configuration)
- bridge.log (activity history)
- pending_records.json (queued records)

## Uninstallation

1. Right-click `uninstall.bat`
2. Select "Run as administrator"
3. Wait for "Uninstallation Complete!"
4. Optionally delete bridge_package folder

**Note**: Uninstalling removes the service but keeps config and logs.

## Security Considerations

### Secret Key
- Use a strong, random secret key
- Never share or commit to version control
- Change if compromised

### Network Security
- Use firewall to restrict controller access
- Consider VPN for backend communication
- Monitor bridge.log for suspicious activity

### Physical Security
- Secure PC in locked room
- Restrict administrator access
- Monitor physical access to controller

## Performance

### Expected Metrics

- **Polling**: 30 seconds (configurable)
- **Sync time**: < 1 second per 100 records
- **Memory usage**: ~50MB
- **CPU usage**: < 1% average
- **Network**: ~1KB per sync

### Optimization

For high-traffic gyms:
- Reduce POLL_INTERVAL to 15-20 seconds
- Increase controller record buffer
- Monitor log file size

## Support

### Log Analysis

When reporting issues, include:
1. Last 50 lines of bridge.log
2. config.txt (redact SECRET_KEY)
3. Service status output
4. Network diagram

### Common Error Codes

| Error | Meaning | Solution |
|-------|---------|----------|
| HTTP 401 | Auth failed | Check SECRET_KEY |
| HTTP 404 | Endpoint not found | Check APP_URL |
| HTTP 500 | Backend error | Check backend logs |
| Timeout | Network issue | Check connectivity |

## Appendix

### File Structure

```
bridge_package/
├── bridge.py              # Main script
├── config.txt             # Configuration (EDIT THIS)
├── requirements.txt       # Python dependencies
├── install.bat            # Service installer
├── uninstall.bat          # Service uninstaller
├── check_status.bat       # Status checker
├── test_connection.py     # Connection tester
├── README.txt             # User documentation
├── QUICK_START.txt        # Quick reference
├── DEPLOYMENT_GUIDE.md    # This file
├── nssm.exe              # Service manager (download separately)
├── bridge.log            # Log file (auto-created)
└── pending_records.json  # Offline queue (auto-created)
```

### Service Details

- **Service Name**: GymBridge
- **Display Name**: GOFIT Attendance Bridge
- **Startup Type**: Automatic
- **Restart Policy**: Restart on failure (5 second delay)
- **Log Rotation**: 10MB

### API Endpoints Used

- `POST /api/attendance/sync` - Upload attendance records
- `POST /api/attendance/bridge/heartbeat` - Send heartbeat

### Protocol Details

**MC-5924T UDP Protocol**:
- Command: 0x0B40 (Get attendance logs)
- Packet format: [Command(2)] [Checksum(2)] [SessionID(4)] [Data]
- Record format: [CardID(4)] [Door(1)] [Direction(1)] [Reserved(2)] [Timestamp(4)] [Reserved(4)]

---

**Version**: 1.0  
**Last Updated**: April 2026  
**Author**: GOFIT Development Team
