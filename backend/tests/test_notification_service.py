"""Unit tests for NotificationService."""
import pytest
from datetime import datetime, timezone
from unittest.mock import Mock, MagicMock
from services.notification_service import NotificationService


class TestNotificationService:
    """Test suite for NotificationService class."""
    
    @pytest.fixture
    def mock_socketio(self):
        """Create a mock Flask-SocketIO instance."""
        return Mock()
    
    @pytest.fixture
    def notification_service(self, mock_socketio):
        """Create a NotificationService instance with mock socketio."""
        return NotificationService(socketio=mock_socketio)
    
    def test_initialization(self, mock_socketio):
        """Test NotificationService initialization."""
        service = NotificationService(socketio=mock_socketio)
        
        assert service.socketio == mock_socketio
    
    def test_emit_check_in_success(self, notification_service, mock_socketio):
        """Test successful check-in notification emission."""
        # Arrange
        person_name = "John Doe"
        person_type = "member"
        check_in_time = datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
        
        # Act
        notification_service.emit_check_in(person_name, person_type, check_in_time)
        
        # Assert
        mock_socketio.emit.assert_called_once()
        call_args = mock_socketio.emit.call_args
        
        assert call_args[0][0] == 'attendance:checkin'
        payload = call_args[0][1]
        
        assert payload['event_type'] == 'checkin'
        assert payload['person_name'] == person_name
        assert payload['person_type'] == person_type
        assert payload['timestamp'] == '2024-01-15T10:30:00+00:00Z'
        assert payload['stay_duration'] is None
    
    def test_emit_check_in_with_naive_datetime(self, notification_service, mock_socketio):
        """Test check-in notification with naive datetime (no timezone)."""
        # Arrange
        person_name = "Jane Smith"
        person_type = "trainer"
        check_in_time = datetime(2024, 1, 15, 14, 45, 0)  # Naive datetime
        
        # Act
        notification_service.emit_check_in(person_name, person_type, check_in_time)
        
        # Assert
        mock_socketio.emit.assert_called_once()
        call_args = mock_socketio.emit.call_args
        payload = call_args[0][1]
        
        # Should still emit successfully and add 'Z' suffix
        assert payload['timestamp'].endswith('Z')
        assert payload['person_name'] == person_name
    
    def test_emit_check_out_success(self, notification_service, mock_socketio):
        """Test successful check-out notification emission."""
        # Arrange
        person_name = "Alice Johnson"
        person_type = "member"
        check_in_time = datetime(2024, 1, 15, 9, 0, 0, tzinfo=timezone.utc)
        stay_duration = 120  # 2 hours in minutes
        
        # Act
        notification_service.emit_check_out(person_name, person_type, 
                                           check_in_time, stay_duration)
        
        # Assert
        mock_socketio.emit.assert_called_once()
        call_args = mock_socketio.emit.call_args
        
        assert call_args[0][0] == 'attendance:checkout'
        payload = call_args[0][1]
        
        assert payload['event_type'] == 'checkout'
        assert payload['person_name'] == person_name
        assert payload['person_type'] == person_type
        assert payload['timestamp'] == '2024-01-15T09:00:00+00:00Z'
        assert payload['stay_duration'] == 120
    
    def test_emit_check_out_with_zero_duration(self, notification_service, mock_socketio):
        """Test check-out notification with zero stay duration."""
        # Arrange
        person_name = "Bob Wilson"
        person_type = "trainer"
        check_in_time = datetime(2024, 1, 15, 11, 0, 0, tzinfo=timezone.utc)
        stay_duration = 0  # Immediate check-out
        
        # Act
        notification_service.emit_check_out(person_name, person_type, 
                                           check_in_time, stay_duration)
        
        # Assert
        mock_socketio.emit.assert_called_once()
        call_args = mock_socketio.emit.call_args
        payload = call_args[0][1]
        
        assert payload['stay_duration'] == 0
    
    def test_emit_check_in_handles_socketio_error(self, notification_service, mock_socketio):
        """Test that emit_check_in handles SocketIO errors gracefully."""
        # Arrange
        mock_socketio.emit.side_effect = Exception("SocketIO connection error")
        person_name = "Error Test"
        person_type = "member"
        check_in_time = datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        
        # Act - should not raise exception
        notification_service.emit_check_in(person_name, person_type, check_in_time)
        
        # Assert - emit was attempted
        mock_socketio.emit.assert_called_once()
    
    def test_emit_check_out_handles_socketio_error(self, notification_service, mock_socketio):
        """Test that emit_check_out handles SocketIO errors gracefully."""
        # Arrange
        mock_socketio.emit.side_effect = Exception("SocketIO connection error")
        person_name = "Error Test"
        person_type = "trainer"
        check_in_time = datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        stay_duration = 60
        
        # Act - should not raise exception
        notification_service.emit_check_out(person_name, person_type, 
                                           check_in_time, stay_duration)
        
        # Assert - emit was attempted
        mock_socketio.emit.assert_called_once()
    
    def test_emit_check_in_with_member_type(self, notification_service, mock_socketio):
        """Test check-in notification for member person type."""
        # Arrange
        person_name = "Member Test"
        person_type = "member"
        check_in_time = datetime(2024, 1, 15, 8, 0, 0, tzinfo=timezone.utc)
        
        # Act
        notification_service.emit_check_in(person_name, person_type, check_in_time)
        
        # Assert
        call_args = mock_socketio.emit.call_args
        payload = call_args[0][1]
        assert payload['person_type'] == 'member'
    
    def test_emit_check_in_with_trainer_type(self, notification_service, mock_socketio):
        """Test check-in notification for trainer person type."""
        # Arrange
        person_name = "Trainer Test"
        person_type = "trainer"
        check_in_time = datetime(2024, 1, 15, 7, 30, 0, tzinfo=timezone.utc)
        
        # Act
        notification_service.emit_check_in(person_name, person_type, check_in_time)
        
        # Assert
        call_args = mock_socketio.emit.call_args
        payload = call_args[0][1]
        assert payload['person_type'] == 'trainer'
    
    def test_emit_check_out_with_long_stay_duration(self, notification_service, mock_socketio):
        """Test check-out notification with long stay duration (8 hours)."""
        # Arrange
        person_name = "Long Stay Test"
        person_type = "member"
        check_in_time = datetime(2024, 1, 15, 6, 0, 0, tzinfo=timezone.utc)
        stay_duration = 480  # 8 hours in minutes
        
        # Act
        notification_service.emit_check_out(person_name, person_type, 
                                           check_in_time, stay_duration)
        
        # Assert
        call_args = mock_socketio.emit.call_args
        payload = call_args[0][1]
        assert payload['stay_duration'] == 480
    
    def test_emit_check_in_event_name(self, notification_service, mock_socketio):
        """Test that check-in uses correct event name 'attendance:checkin'."""
        # Arrange
        person_name = "Event Name Test"
        person_type = "member"
        check_in_time = datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        
        # Act
        notification_service.emit_check_in(person_name, person_type, check_in_time)
        
        # Assert
        call_args = mock_socketio.emit.call_args
        assert call_args[0][0] == 'attendance:checkin'
    
    def test_emit_check_out_event_name(self, notification_service, mock_socketio):
        """Test that check-out uses correct event name 'attendance:checkout'."""
        # Arrange
        person_name = "Event Name Test"
        person_type = "trainer"
        check_in_time = datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        stay_duration = 90
        
        # Act
        notification_service.emit_check_out(person_name, person_type, 
                                           check_in_time, stay_duration)
        
        # Assert
        call_args = mock_socketio.emit.call_args
        assert call_args[0][0] == 'attendance:checkout'
