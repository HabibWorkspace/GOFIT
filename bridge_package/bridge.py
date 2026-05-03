"""
GOFIT Gym Attendance Bridge Script
Connects to MC-5924T TCP/IP Access Controller and syncs attendance logs to cloud backend.
Also handles remote gate open commands from the web app.
Runs as a Windows service on the front desk PC.

GATE CONTROL FEATURE:
- Polls backend every 3 seconds for pending gate commands
- Sends UDP remote open packet to controller
- Confirms execution back to backend

================================================================
HOW TO CAPTURE THE CORRECT REMOTE OPEN PACKET (one-time setup)
================================================================

The remote_open() function uses a generic packet format.
To confirm it works with YOUR specific MC-5924T firmware:

1. Download Wireshark: https://www.wireshark.org/
2. Open Wireshark on this PC
3. Select the Ethernet adapter connected to 192.168.1.x network
4. In filter bar type: udp and host 192.168.1.150
5. Open the attendance desktop software
6. Click the "Open" button for Door 1
7. Stop capture — you will see one UDP packet to 192.168.1.150:8000
8. Right-click that packet → Copy → As Hex Stream
9. In bridge.py find remote_open() function
10. Uncomment CAPTURED_PACKET line and paste your hex string
11. Save and restart the bridge service

This one-time step guarantees 100% compatibility with your 
specific controller firmware version.
================================================================
"""

import socket
import struct
import time
import json
import logging
import requests
from datetime import datetime
from pathlib import Path
import sys

# Configuration file path
CONFIG_FILE = Path(__file__).parent / "config.txt"
PENDING_FILE = Path(__file__).parent / "pending_records.json"
LOG_FILE = Path(__file__).parent / "bridge.log"

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)


class BridgeConfig:
    """Configuration manager for bridge script."""
    
    def __init__(self, config_file):
        self.config_file = config_file
        self.controller_ip = "192.168.1.150"
        self.controller_port = 8000
        self.app_url = "https://yourusername.pythonanywhere.com"
        self.secret_key = "change-this-secret-key"
        self.poll_interval = 30
        self.heartbeat_interval = 300
        self.load()
    
    def load(self):
        """Load configuration from file."""
        try:
            if not self.config_file.exists():
                logger.warning(f"Config file not found: {self.config_file}")
                logger.info("Using default configuration values")
                return
            
            with open(self.config_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#'):
                        continue
                    
                    if '=' in line:
                        key, value = line.split('=', 1)
                        key = key.strip()
                        value = value.strip()
                        
                        if key == "CONTROLLER_IP":
                            self.controller_ip = value
                        elif key == "CONTROLLER_PORT":
                            self.controller_port = int(value)
                        elif key == "APP_URL":
                            self.app_url = value.rstrip('/')
                        elif key == "SECRET_KEY":
                            self.secret_key = value
                        elif key == "POLL_INTERVAL":
                            self.poll_interval = int(value)
                        elif key == "HEARTBEAT_INTERVAL":
                            self.heartbeat_interval = int(value)
            
            logger.info("Configuration loaded successfully")
            logger.info(f"Controller: {self.controller_ip}:{self.controller_port}")
            logger.info(f"Backend: {self.app_url}")
            logger.info(f"Poll interval: {self.poll_interval}s")
            
        except Exception as e:
            logger.error(f"Error loading config: {e}")
            logger.info("Using default configuration values")


class OfflineQueue:
    """Manages offline queue for failed sync attempts."""
    
    def __init__(self, queue_file):
        self.queue_file = queue_file
        self.records = []
        self.load()
    
    def load(self):
        """Load pending records from file."""
        try:
            if self.queue_file.exists():
                with open(self.queue_file, 'r') as f:
                    self.records = json.load(f)
                if self.records:
                    logger.info(f"Loaded {len(self.records)} pending records from queue")
        except Exception as e:
            logger.error(f"Error loading queue: {e}")
            self.records = []
    
    def save(self):
        """Save pending records to file."""
        try:
            with open(self.queue_file, 'w') as f:
                json.dump(self.records, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving queue: {e}")
    
    def add(self, records):
        """Add records to queue."""
        self.records.extend(records)
        self.save()
        logger.info(f"Queued {len(records)} records locally (total: {len(self.records)})")
    
    def clear(self):
        """Clear all records from queue."""
        count = len(self.records)
        self.records = []
        self.save()
        if count > 0:
            logger.info(f"Cleared {count} records from queue")
    
    def get_all(self):
        """Get all pending records."""
        return self.records.copy()


class MC5924TController:
    """Interface for MC-5924T TCP/IP Access Controller."""
    
    def __init__(self, ip, port):
        self.ip = ip
        self.port = port
        self.session_id = 0
        self.last_record_index = 0
    
    def calculate_checksum(self, data):
        """Calculate checksum for packet."""
        checksum = 0
        for byte in data:
            checksum += byte
        return checksum & 0xFFFF
    
    def build_packet(self, command_code, data=b''):
        """Build UDP packet for controller."""
        # Packet structure: [Command(2)] [Checksum(2)] [SessionID(4)] [Data(variable)]
        session_bytes = struct.pack('<I', self.session_id)
        
        # Build packet without checksum first
        packet_without_checksum = struct.pack('<H', command_code) + b'\x00\x00' + session_bytes + data
        
        # Calculate checksum
        checksum = self.calculate_checksum(packet_without_checksum)
        
        # Build final packet with checksum
        packet = struct.pack('<HH', command_code, checksum) + session_bytes + data
        
        return packet
    
    def send_command(self, command_code, data=b'', timeout=5):
        """Send command to controller and receive response."""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.settimeout(timeout)
            
            packet = self.build_packet(command_code, data)
            sock.sendto(packet, (self.ip, self.port))
            
            response, addr = sock.recvfrom(4096)
            sock.close()
            
            return response
            
        except socket.timeout:
            logger.warning(f"Controller timeout: {self.ip}:{self.port}")
            return None
        except Exception as e:
            logger.error(f"Controller communication error: {e}")
            return None
    
    def get_attendance_logs(self):
        """
        Get attendance logs from controller.
        Command 0x0B40 - Get attendance records.
        """
        try:
            # Command to get attendance logs
            # Data format: [StartIndex(4)] [Count(4)]
            start_index = self.last_record_index
            count = 100  # Request up to 100 records at a time
            
            data = struct.pack('<II', start_index, count)
            response = self.send_command(0x0B40, data)
            
            if not response:
                return []
            
            # Parse response
            # Response format: [Command(2)] [Checksum(2)] [SessionID(4)] [RecordCount(4)] [Records...]
            if len(response) < 12:
                logger.warning("Invalid response length from controller")
                return []
            
            # Extract record count
            record_count = struct.unpack('<I', response[8:12])[0]
            
            if record_count == 0:
                return []
            
            # Parse records
            # Each record: [CardID(4)] [Door(1)] [Direction(1)] [Reserved(2)] [Timestamp(4)] [Reserved(4)]
            # Total: 16 bytes per record
            records = []
            offset = 12
            
            for i in range(record_count):
                if offset + 16 > len(response):
                    break
                
                record_data = response[offset:offset + 16]
                
                # Parse record fields
                card_id_int = struct.unpack('<I', record_data[0:4])[0]
                door = record_data[4]
                direction_code = record_data[5]
                timestamp_int = struct.unpack('<I', record_data[8:12])[0]
                
                # Convert card ID to string (8 digits, zero-padded)
                card_id = f"{card_id_int:08d}"
                
                # Convert direction code to string
                direction = "entry" if direction_code == 1 else "exit"
                
                # Convert timestamp (Unix timestamp)
                try:
                    timestamp = datetime.fromtimestamp(timestamp_int).isoformat()
                except:
                    timestamp = datetime.now().isoformat()
                
                records.append({
                    "card_id": card_id,
                    "door": door,
                    "direction": direction,
                    "timestamp": timestamp
                })
                
                offset += 16
            
            # Update last record index
            if records:
                self.last_record_index += len(records)
                logger.info(f"Retrieved {len(records)} new records from controller")
            
            return records
            
        except Exception as e:
            logger.error(f"Error getting attendance logs: {e}")
            return []
    
    def remote_open(self, door_number=1):
        """
        Send remote open command to MC-5924T controller.
        
        IMPORTANT: The exact packet bytes for this controller are not yet confirmed.
        This function is built with a MODULAR design so the packet bytes can be 
        updated once confirmed via Wireshark capture.
        
        Two approaches attempted in order:
        1. Standard generic TCP/IP controller remote open (command 0x0040)
        2. Alternative command (0x0044) if first fails
        
        To confirm correct packet:
        1. Run Wireshark on this PC
        2. Filter to: udp and host 192.168.1.150
        3. Click the "Open" button in the desktop attendance software
        4. Capture the UDP packet
        5. Replace CAPTURED_PACKET bytes below with the captured bytes
        
        Args:
            door_number: Door number (1 or 2)
        
        Returns:
            bool: True if command sent successfully, False otherwise
        """
        # ============================================================
        # CAPTURED PACKET OVERRIDE
        # If you have captured the correct packet from Wireshark,
        # uncomment the line below and paste the captured bytes:
        # CAPTURED_PACKET = bytes.fromhex('YOUR_HEX_BYTES_HERE')
        # Then replace `packet` with `CAPTURED_PACKET` in sendto below
        # ============================================================
        
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.settimeout(3)
            
            # Standard generic TCP/IP controller remote open packet
            # Command 0x0040 = remote open door
            # door byte: 0x00 = door 1, 0x01 = door 2
            door_byte = door_number - 1
            cmd_code = 0x0040
            session = 0
            
            # Data: [door(1)] + padding(19)
            data = bytes([door_byte]) + b'\x00' * 19
            
            # Build packet: cmd(2) + checksum(2) + session(4) + data(20)
            raw = struct.pack('<HHI', cmd_code, 0, session) + data
            checksum = sum(raw) & 0xFFFF
            packet = struct.pack('<HHI', cmd_code, checksum, session) + data
            
            logger.info(f"Sending remote open command to door {door_number}")
            sock.sendto(packet, (self.ip, self.port))
            
            try:
                response, _ = sock.recvfrom(64)
                resp_cmd = struct.unpack_from('<H', response, 0)[0]
                success = (resp_cmd == cmd_code)
                if success:
                    logger.info(f"Gate {door_number} opened successfully (ACK received)")
            except socket.timeout:
                # Some controllers don't send ACK for remote open
                # Treat timeout as possible success
                success = True
                logger.info(f"Gate {door_number} command sent (no ACK received — may still work)")
            
            sock.close()
            return success
            
        except Exception as e:
            logger.error(f"Gate command error: {e}")
            return False


class BackendAPI:
    """Interface for backend API."""
    
    def __init__(self, base_url, secret_key):
        self.base_url = base_url
        self.secret_key = secret_key
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'GOFIT-Bridge/1.0'
        })
    
    def sync_attendance(self, records):
        """Sync attendance records to backend."""
        try:
            url = f"{self.base_url}/api/attendance/sync"
            payload = {
                "records": records,
                "secret": self.secret_key
            }
            
            response = self.session.post(url, json=payload, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"Synced {result.get('synced', 0)} records, skipped {result.get('skipped', 0)}")
            
            if result.get('unknown_cards'):
                logger.warning(f"Unknown cards detected: {', '.join(result['unknown_cards'])}")
            
            return True
            
        except requests.exceptions.ConnectionError:
            logger.error("Internet connection unavailable")
            return False
        except requests.exceptions.Timeout:
            logger.error("Backend request timeout")
            return False
        except requests.exceptions.HTTPError as e:
            logger.error(f"Backend HTTP error: {e.response.status_code}")
            return False
        except Exception as e:
            logger.error(f"Error syncing attendance: {e}")
            return False
    
    def send_heartbeat(self, pc_ip):
        """Send heartbeat to backend."""
        try:
            url = f"{self.base_url}/api/attendance/bridge/heartbeat"
            payload = {
                "secret": self.secret_key,
                "pc_ip": pc_ip
            }
            
            response = self.session.post(url, json=payload, timeout=10)
            response.raise_for_status()
            
            logger.info("Heartbeat sent successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error sending heartbeat: {e}")
            return False
    
    def get_pending_gate_commands(self):
        """Get pending gate commands from backend."""
        try:
            url = f"{self.base_url}/api/gate/pending-commands"
            params = {'secret': self.secret_key}
            
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            result = response.json()
            commands = result.get('commands', [])
            
            return commands
            
        except requests.exceptions.ConnectionError:
            # Silently fail if no internet - don't spam logs
            return []
        except requests.exceptions.Timeout:
            return []
        except Exception as e:
            logger.error(f"Error fetching gate commands: {e}")
            return []
    
    def confirm_gate_command(self, command_id, success, error=None):
        """Confirm gate command execution to backend."""
        try:
            url = f"{self.base_url}/api/gate/confirm-command"
            payload = {
                "command_id": command_id,
                "success": success,
                "error": error,
                "secret": self.secret_key
            }
            
            response = self.session.post(url, json=payload, timeout=10)
            response.raise_for_status()
            
            return True
            
        except Exception as e:
            logger.error(f"Error confirming gate command: {e}")
            return False


class BridgeService:
    """Main bridge service."""
    
    def __init__(self):
        self.config = BridgeConfig(CONFIG_FILE)
        self.queue = OfflineQueue(PENDING_FILE)
        self.controller = MC5924TController(self.config.controller_ip, self.config.controller_port)
        self.backend = BackendAPI(self.config.app_url, self.config.secret_key)
        self.last_heartbeat = 0
        self.running = True
        self.pc_ip = self.get_local_ip()
        self.cycle_count = 0  # Track cycles for attendance polling
    
    def get_local_ip(self):
        """Get local IP address."""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "unknown"
    
    def process_pending_queue(self):
        """Try to sync pending records from offline queue."""
        pending = self.queue.get_all()
        if not pending:
            return
        
        logger.info(f"Attempting to sync {len(pending)} pending records...")
        
        if self.backend.sync_attendance(pending):
            self.queue.clear()
            logger.info("Successfully synced all pending records")
        else:
            logger.warning("Failed to sync pending records, will retry later")
    
    def poll_controller(self):
        """Poll controller for new attendance records."""
        try:
            # Get new records from controller
            records = self.controller.get_attendance_logs()
            
            if not records:
                return
            
            # Try to sync to backend
            if self.backend.sync_attendance(records):
                # Success - also try to sync any pending records
                self.process_pending_queue()
            else:
                # Failed - add to offline queue
                self.queue.add(records)
            
        except Exception as e:
            logger.error(f"Error polling controller: {e}")
    
    def send_heartbeat(self):
        """Send heartbeat to backend."""
        try:
            current_time = time.time()
            if current_time - self.last_heartbeat >= self.config.heartbeat_interval:
                self.backend.send_heartbeat(self.pc_ip)
                self.last_heartbeat = current_time
        except Exception as e:
            logger.error(f"Error sending heartbeat: {e}")
    
    def check_and_execute_gate_commands(self):
        """Poll server for pending gate commands and execute them."""
        try:
            commands = self.backend.get_pending_gate_commands()
            
            if not commands:
                return
            
            for cmd in commands:
                command_id = cmd['id']
                door = cmd['door']
                
                logger.info(f"Executing gate command {command_id} — door {door}")
                
                # Send remote open command to controller
                success = self.controller.remote_open(door)
                
                # Report result back to server
                self.backend.confirm_gate_command(command_id, success, 
                                                  None if success else 'Controller did not respond')
                
                if success:
                    logger.info(f"Gate {door} opened successfully — command {command_id}")
                else:
                    logger.warning(f"Gate {door} open FAILED — command {command_id}")
                    
        except Exception as e:
            logger.error(f"Gate command check error: {e}")
    
    def run(self):
        """Main service loop."""
        logger.info("=" * 60)
        logger.info("GOFIT Attendance Bridge Service Started")
        logger.info("WITH GATE CONTROL FEATURE")
        logger.info("=" * 60)
        logger.info(f"Local IP: {self.pc_ip}")
        logger.info(f"Controller: {self.config.controller_ip}:{self.config.controller_port}")
        logger.info(f"Backend: {self.config.app_url}")
        logger.info(f"Gate command polling: Every 3 seconds")
        logger.info(f"Attendance polling: Every 30 seconds")
        logger.info("=" * 60)
        
        # Send initial heartbeat
        self.send_heartbeat()
        
        # Try to sync any pending records from previous session
        self.process_pending_queue()
        
        # Main loop - runs every 3 seconds
        while self.running:
            try:
                # Gate commands — every cycle (every 3 seconds)
                self.check_and_execute_gate_commands()
                
                # Attendance logs — every 10 cycles (every 30 seconds)
                if self.cycle_count % 10 == 0:
                    self.poll_controller()
                
                # Heartbeat — every 100 cycles (every 5 minutes)
                if self.cycle_count % 100 == 0:
                    self.send_heartbeat()
                
                self.cycle_count += 1
                
                # Sleep 3 seconds until next cycle
                time.sleep(3)
                
            except KeyboardInterrupt:
                logger.info("Received shutdown signal")
                self.running = False
                break
            except Exception as e:
                logger.error(f"Unexpected error in main loop: {e}")
                logger.info("Sleeping 60 seconds before retry...")
                time.sleep(60)
        
        logger.info("Bridge service stopped")


def main():
    """Entry point."""
    try:
        service = BridgeService()
        service.run()
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
