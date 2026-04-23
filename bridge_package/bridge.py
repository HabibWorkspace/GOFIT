"""
GOFIT Gym Attendance Bridge Script
Connects to MC-5924T TCP/IP Access Controller and syncs attendance logs to cloud backend.
Runs as a Windows service on the front desk PC.
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
    
    def run(self):
        """Main service loop."""
        logger.info("=" * 60)
        logger.info("GOFIT Attendance Bridge Service Started")
        logger.info("=" * 60)
        logger.info(f"Local IP: {self.pc_ip}")
        logger.info(f"Controller: {self.config.controller_ip}:{self.config.controller_port}")
        logger.info(f"Backend: {self.config.app_url}")
        logger.info("=" * 60)
        
        # Send initial heartbeat
        self.send_heartbeat()
        
        # Try to sync any pending records from previous session
        self.process_pending_queue()
        
        # Main loop
        while self.running:
            try:
                # Poll controller for new records
                self.poll_controller()
                
                # Send heartbeat if needed
                self.send_heartbeat()
                
                # Sleep until next poll
                time.sleep(self.config.poll_interval)
                
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
