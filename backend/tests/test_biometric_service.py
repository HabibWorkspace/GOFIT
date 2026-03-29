"""Unit tests for BiometricDeviceClient."""
import pytest
from unittest.mock import Mock, MagicMock, patch
from datetime import datetime
from backend.services.biometric_service import BiometricDeviceClient, AttendanceLog


class TestAttendanceLog:
    """Test AttendanceLog data class."""
    
    def test_attendance_log_initialization(self):
        """Test AttendanceLog can be initialized with required fields."""
        timestamp = datetime(2024, 1, 15, 10, 30, 0)
        log = AttendanceLog(
            device_user_id="123",
            timestamp=timestamp,
            device_serial="ABC123"
        )
        
        assert log.device_user_id == "123"
        assert log.timestamp == timestamp
        assert log.device_serial == "ABC123"
    
    def test_attendance_log_repr(self):
        """Test AttendanceLog string representation."""
        timestamp = datetime(2024, 1, 15, 10, 30, 0)
        log = AttendanceLog(
            device_user_id="123",
            timestamp=timestamp,
            device_serial="ABC123"
        )
        
        repr_str = repr(log)
        assert "AttendanceLog" in repr_str
        assert "123" in repr_str
        assert "ABC123" in repr_str


class TestBiometricDeviceClient:
    """Test BiometricDeviceClient class."""
    
    @patch('backend.services.biometric_service.ZK')
    def test_initialization(self, mock_zk):
        """Test client initialization with connection parameters."""
        client = BiometricDeviceClient(ip="192.168.0.201", port=4370, timeout=10)
        
        assert client.ip == "192.168.0.201"
        assert client.port == 4370
        assert client.timeout == 10
        assert client.is_connected() is False
        mock_zk.assert_called_once_with("192.168.0.201", port=4370, timeout=10)
    
    @patch('backend.services.biometric_service.ZK')
    def test_connect_success(self, mock_zk):
        """Test successful connection to device."""
        mock_conn = Mock()
        mock_zk_instance = Mock()
        mock_zk_instance.connect.return_value = mock_conn
        mock_zk.return_value = mock_zk_instance
        
        client = BiometricDeviceClient(ip="192.168.0.201", port=4370)
        result = client.connect()
        
        assert result is True
        assert client.is_connected() is True
        assert client.current_retry_index == 0
        mock_zk_instance.connect.assert_called_once()
    
    @patch('backend.services.biometric_service.ZK')
    def test_connect_failure(self, mock_zk):
        """Test connection failure handling."""
        mock_zk_instance = Mock()
        mock_zk_instance.connect.side_effect = Exception("Connection failed")
        mock_zk.return_value = mock_zk_instance
        
        client = BiometricDeviceClient(ip="192.168.0.201", port=4370)
        result = client.connect()
        
        assert result is False
        assert client.is_connected() is False
        assert client.current_retry_index == 1
    
    @patch('backend.services.biometric_service.ZK')
    def test_exponential_backoff(self, mock_zk):
        """Test exponential backoff retry logic."""
        mock_zk_instance = Mock()
        mock_zk_instance.connect.side_effect = Exception("Connection failed")
        mock_zk.return_value = mock_zk_instance
        
        client = BiometricDeviceClient(ip="192.168.0.201", port=4370)
        
        # First failure: should use 60s interval
        client.connect()
        assert client.get_next_retry_interval() == 120
        
        # Second failure: should use 120s interval
        client.connect()
        assert client.get_next_retry_interval() == 240
        
        # Third failure: should use 240s interval
        client.connect()
        assert client.get_next_retry_interval() == 300
        
        # Fourth failure: should cap at 300s
        client.connect()
        assert client.get_next_retry_interval() == 300
    
    @patch('backend.services.biometric_service.ZK')
    def test_disconnect(self, mock_zk):
        """Test disconnect method with resource cleanup."""
        mock_conn = Mock()
        mock_zk_instance = Mock()
        mock_zk_instance.connect.return_value = mock_conn
        mock_zk.return_value = mock_zk_instance
        
        client = BiometricDeviceClient(ip="192.168.0.201", port=4370)
        client.connect()
        
        assert client.is_connected() is True
        
        client.disconnect()
        
        assert client.is_connected() is False
        assert client.conn is None
        mock_conn.disconnect.assert_called_once()
    
    @patch('backend.services.biometric_service.ZK')
    def test_disconnect_handles_errors(self, mock_zk):
        """Test disconnect handles errors gracefully."""
        mock_conn = Mock()
        mock_conn.disconnect.side_effect = Exception("Disconnect error")
        mock_zk_instance = Mock()
        mock_zk_instance.connect.return_value = mock_conn
        mock_zk.return_value = mock_zk_instance
        
        client = BiometricDeviceClient(ip="192.168.0.201", port=4370)
        client.connect()
        
        # Should not raise exception
        client.disconnect()
        
        assert client.is_connected() is False
        assert client.conn is None
    
    @patch('backend.services.biometric_service.ZK')
    def test_get_attendance_logs_when_not_connected(self, mock_zk):
        """Test get_attendance_logs raises error when not connected."""
        client = BiometricDeviceClient(ip="192.168.0.201", port=4370)
        
        with pytest.raises(ConnectionError, match="Device is not connected"):
            client.get_attendance_logs()
    
    @patch('backend.services.biometric_service.ZK')
    def test_get_attendance_logs_success(self, mock_zk):
        """Test successful fetching of attendance logs."""
        # Mock attendance record
        mock_attendance = Mock()
        mock_attendance.user_id = 123
        mock_attendance.timestamp = datetime(2024, 1, 15, 10, 30, 0)
        
        mock_conn = Mock()
        mock_conn.get_attendance.return_value = [mock_attendance]
        mock_conn.get_serialnumber.return_value = "DEVICE123"
        
        mock_zk_instance = Mock()
        mock_zk_instance.connect.return_value = mock_conn
        mock_zk.return_value = mock_zk_instance
        
        client = BiometricDeviceClient(ip="192.168.0.201", port=4370)
        client.connect()
        
        logs = client.get_attendance_logs()
        
        assert len(logs) == 1
        assert logs[0].device_user_id == "123"
        assert logs[0].timestamp == datetime(2024, 1, 15, 10, 30, 0)
        assert logs[0].device_serial == "DEVICE123"
        mock_conn.get_attendance.assert_called_once()
    
    @patch('backend.services.biometric_service.ZK')
    def test_get_attendance_logs_empty(self, mock_zk):
        """Test fetching attendance logs when device has no logs."""
        mock_conn = Mock()
        mock_conn.get_attendance.return_value = []
        mock_conn.get_serialnumber.return_value = "DEVICE123"
        
        mock_zk_instance = Mock()
        mock_zk_instance.connect.return_value = mock_conn
        mock_zk.return_value = mock_zk_instance
        
        client = BiometricDeviceClient(ip="192.168.0.201", port=4370)
        client.connect()
        
        logs = client.get_attendance_logs()
        
        assert len(logs) == 0
        assert isinstance(logs, list)
    
    @patch('backend.services.biometric_service.ZK')
    def test_get_attendance_logs_handles_errors(self, mock_zk):
        """Test get_attendance_logs handles device errors."""
        mock_conn = Mock()
        mock_conn.get_attendance.side_effect = Exception("Device error")
        
        mock_zk_instance = Mock()
        mock_zk_instance.connect.return_value = mock_conn
        mock_zk.return_value = mock_zk_instance
        
        client = BiometricDeviceClient(ip="192.168.0.201", port=4370)
        client.connect()
        
        with pytest.raises(Exception, match="Device error"):
            client.get_attendance_logs()
        
        # Connection should be marked as failed
        assert client.is_connected() is False
    
    @patch('backend.services.biometric_service.ZK')
    def test_get_device_serial_fallback(self, mock_zk):
        """Test device serial fallback to UNKNOWN on error."""
        mock_conn = Mock()
        mock_conn.get_serialnumber.side_effect = Exception("Serial error")
        mock_conn.get_attendance.return_value = []
        
        mock_zk_instance = Mock()
        mock_zk_instance.connect.return_value = mock_conn
        mock_zk.return_value = mock_zk_instance
        
        client = BiometricDeviceClient(ip="192.168.0.201", port=4370)
        client.connect()
        
        logs = client.get_attendance_logs()
        
        # Should not raise exception, should use "UNKNOWN"
        assert isinstance(logs, list)
    
    @patch('backend.services.biometric_service.ZK')
    def test_is_connected_returns_false_initially(self, mock_zk):
        """Test is_connected returns False before connection."""
        client = BiometricDeviceClient(ip="192.168.0.201", port=4370)
        
        assert client.is_connected() is False
    
    @patch('backend.services.biometric_service.ZK')
    def test_connection_timeout_configuration(self, mock_zk):
        """Test connection timeout is properly configured."""
        client = BiometricDeviceClient(ip="192.168.0.201", port=4370, timeout=10)
        
        assert client.timeout == 10
        mock_zk.assert_called_once_with("192.168.0.201", port=4370, timeout=10)
    
    @patch('backend.services.biometric_service.ZK')
    def test_retry_intervals_configuration(self, mock_zk):
        """Test retry intervals follow exponential backoff pattern."""
        client = BiometricDeviceClient(ip="192.168.0.201", port=4370)
        
        assert client.retry_intervals == [60, 120, 240, 300]
        assert client.current_retry_index == 0
    
    @patch('backend.services.biometric_service.ZK')
    def test_successful_reconnection_resets_retry_index(self, mock_zk):
        """Test successful connection resets retry index."""
        mock_zk_instance = Mock()
        mock_conn = Mock()
        
        # First call fails, second succeeds
        mock_zk_instance.connect.side_effect = [
            Exception("Connection failed"),
            mock_conn
        ]
        mock_zk.return_value = mock_zk_instance
        
        client = BiometricDeviceClient(ip="192.168.0.201", port=4370)
        
        # First attempt fails
        result1 = client.connect()
        assert result1 is False
        assert client.current_retry_index == 1
        
        # Second attempt succeeds
        result2 = client.connect()
        assert result2 is True
        assert client.current_retry_index == 0  # Reset on success
