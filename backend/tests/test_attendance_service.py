"""Unit tests for AttendanceService."""
import pytest
from unittest.mock import Mock, MagicMock
import uuid
from datetime import datetime, timezone, timedelta

from services.attendance_service import AttendanceService, PersonMapping
from services.biometric_service import BiometricDeviceClient
from models.device_user_mapping import DeviceUserMapping
from models.attendance_record import AttendanceRecord


class TestPersonMapping:
    """Tests for map_device_user_to_person method."""
    
    def test_map_device_user_to_member(self, db_session):
        """Test mapping device user ID to a member."""
        # Create a device user mapping for a member
        member_id = str(uuid.uuid4())
        mapping = DeviceUserMapping(
            device_user_id='12345',
            person_type='member',
            person_id=member_id
        )
        db_session.add(mapping)
        db_session.commit()
        
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test mapping
        result = service.map_device_user_to_person('12345')
        
        assert result is not None
        assert isinstance(result, PersonMapping)
        assert result.person_type == 'member'
        assert result.person_id == member_id
    
    def test_map_device_user_to_trainer(self, db_session):
        """Test mapping device user ID to a trainer."""
        # Create a device user mapping for a trainer
        trainer_id = str(uuid.uuid4())
        mapping = DeviceUserMapping(
            device_user_id='67890',
            person_type='trainer',
            person_id=trainer_id
        )
        db_session.add(mapping)
        db_session.commit()
        
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test mapping
        result = service.map_device_user_to_person('67890')
        
        assert result is not None
        assert isinstance(result, PersonMapping)
        assert result.person_type == 'trainer'
        assert result.person_id == trainer_id
    
    def test_map_unmapped_device_user(self, db_session):
        """Test mapping returns None for unmapped device user ID."""
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test mapping with non-existent device user ID
        result = service.map_device_user_to_person('99999')
        
        assert result is None
    
    def test_map_device_user_handles_database_error(self, db_session):
        """Test mapping handles database errors gracefully."""
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        
        # Create a mock session that raises an exception
        mock_session = Mock()
        mock_session.query.side_effect = Exception("Database error")
        
        service = AttendanceService(device_client, mock_session)
        
        # Test mapping - should return None on error
        result = service.map_device_user_to_person('12345')
        
        assert result is None



class TestCheckInCheckOutDetermination:
    """Tests for determine_check_type method."""
    
    def test_first_scan_is_check_in(self, db_session):
        """Test that first scan of the day is determined as check-in."""
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test with no existing records
        person_id = str(uuid.uuid4())
        timestamp = datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
        
        result = service.determine_check_type(person_id, 'member', timestamp)
        
        assert result == 'check_in'
    
    def test_second_scan_is_check_out(self, db_session):
        """Test that second scan of the day (with open record) is determined as check-out."""
        # Create an open attendance record (check-in without check-out)
        person_id = str(uuid.uuid4())
        check_in_time = datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        
        record = AttendanceRecord(
            device_user_id='12345',
            person_type='member',
            person_id=person_id,
            check_in_time=check_in_time,
            check_out_time=None,  # Open record
            device_serial='DEVICE001'
        )
        db_session.add(record)
        db_session.commit()
        
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test with scan later in the same day
        timestamp = datetime(2024, 1, 15, 14, 30, 0, tzinfo=timezone.utc)
        
        result = service.determine_check_type(person_id, 'member', timestamp)
        
        assert result == 'check_out'
    
    def test_third_scan_is_new_check_in(self, db_session):
        """Test that third scan (after completed visit) is determined as new check-in."""
        # Create a completed attendance record (with check-out)
        person_id = str(uuid.uuid4())
        check_in_time = datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        check_out_time = datetime(2024, 1, 15, 12, 0, 0, tzinfo=timezone.utc)
        
        record = AttendanceRecord(
            device_user_id='12345',
            person_type='member',
            person_id=person_id,
            check_in_time=check_in_time,
            check_out_time=check_out_time,  # Completed visit
            stay_duration=120,
            device_serial='DEVICE001'
        )
        db_session.add(record)
        db_session.commit()
        
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test with third scan later in the same day
        timestamp = datetime(2024, 1, 15, 16, 30, 0, tzinfo=timezone.utc)
        
        result = service.determine_check_type(person_id, 'member', timestamp)
        
        assert result == 'check_in'
    
    def test_cross_day_visits_are_independent(self, db_session):
        """Test that visits on different days are treated independently."""
        # Create an open attendance record from yesterday
        person_id = str(uuid.uuid4())
        yesterday_check_in = datetime(2024, 1, 14, 10, 0, 0, tzinfo=timezone.utc)
        
        record = AttendanceRecord(
            device_user_id='12345',
            person_type='member',
            person_id=person_id,
            check_in_time=yesterday_check_in,
            check_out_time=None,  # Open record from yesterday
            device_serial='DEVICE001'
        )
        db_session.add(record)
        db_session.commit()
        
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test with scan today - should be check-in (different day)
        today_timestamp = datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
        
        result = service.determine_check_type(person_id, 'member', today_timestamp)
        
        assert result == 'check_in'
    
    def test_different_person_types_are_independent(self, db_session):
        """Test that member and trainer records are treated independently."""
        # Create an open attendance record for a member
        person_id = str(uuid.uuid4())
        check_in_time = datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        
        record = AttendanceRecord(
            device_user_id='12345',
            person_type='member',
            person_id=person_id,
            check_in_time=check_in_time,
            check_out_time=None,
            device_serial='DEVICE001'
        )
        db_session.add(record)
        db_session.commit()
        
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test with same person_id but different person_type - should be check-in
        timestamp = datetime(2024, 1, 15, 14, 30, 0, tzinfo=timezone.utc)
        
        result = service.determine_check_type(person_id, 'trainer', timestamp)
        
        assert result == 'check_in'
    
    def test_handles_naive_datetime(self, db_session):
        """Test that method handles naive datetime by converting to UTC."""
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test with naive datetime (no timezone)
        person_id = str(uuid.uuid4())
        naive_timestamp = datetime(2024, 1, 15, 10, 30, 0)  # No tzinfo
        
        result = service.determine_check_type(person_id, 'member', naive_timestamp)
        
        assert result == 'check_in'
    
    def test_handles_database_error_gracefully(self, db_session):
        """Test that method handles database errors and defaults to check-in."""
        # Create attendance service with mock session that raises error
        device_client = Mock(spec=BiometricDeviceClient)
        mock_session = Mock()
        mock_session.query.side_effect = Exception("Database error")
        
        service = AttendanceService(device_client, mock_session)
        
        # Test - should return check-in on error
        person_id = str(uuid.uuid4())
        timestamp = datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
        
        result = service.determine_check_type(person_id, 'member', timestamp)
        
        assert result == 'check_in'
    
    def test_same_day_boundary_at_midnight(self, db_session):
        """Test that same-day logic works correctly at day boundaries."""
        # Create an open record at 23:00
        person_id = str(uuid.uuid4())
        late_check_in = datetime(2024, 1, 15, 23, 0, 0, tzinfo=timezone.utc)
        
        record = AttendanceRecord(
            device_user_id='12345',
            person_type='member',
            person_id=person_id,
            check_in_time=late_check_in,
            check_out_time=None,
            device_serial='DEVICE001'
        )
        db_session.add(record)
        db_session.commit()
        
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test with scan at 23:59 same day - should be check-out
        late_timestamp = datetime(2024, 1, 15, 23, 59, 0, tzinfo=timezone.utc)
        result = service.determine_check_type(person_id, 'member', late_timestamp)
        assert result == 'check_out'
        
        # Test with scan at 00:01 next day - should be check-in
        next_day_timestamp = datetime(2024, 1, 16, 0, 1, 0, tzinfo=timezone.utc)
        result = service.determine_check_type(person_id, 'member', next_day_timestamp)
        assert result == 'check_in'



class TestDuplicateChecking:
    """Tests for is_duplicate_log method."""
    
    def test_duplicate_exact_match(self, db_session):
        """Test that exact duplicate is detected."""
        # Create an existing attendance record
        device_user_id = '12345'
        timestamp = datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
        device_serial = 'DEVICE001'
        
        record = AttendanceRecord(
            device_user_id=device_user_id,
            person_type='member',
            person_id=str(uuid.uuid4()),
            check_in_time=timestamp,
            device_serial=device_serial
        )
        db_session.add(record)
        db_session.commit()
        
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test with exact same parameters
        result = service.is_duplicate_log(device_user_id, timestamp, device_serial)
        
        assert result is True
    
    def test_duplicate_within_one_second_before(self, db_session):
        """Test that duplicate within 1 second before is detected."""
        # Create an existing attendance record
        device_user_id = '12345'
        original_timestamp = datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
        device_serial = 'DEVICE001'
        
        record = AttendanceRecord(
            device_user_id=device_user_id,
            person_type='member',
            person_id=str(uuid.uuid4()),
            check_in_time=original_timestamp,
            device_serial=device_serial
        )
        db_session.add(record)
        db_session.commit()
        
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test with timestamp 0.5 seconds after
        new_timestamp = original_timestamp + timedelta(seconds=0.5)
        result = service.is_duplicate_log(device_user_id, new_timestamp, device_serial)
        
        assert result is True
    
    def test_duplicate_within_one_second_after(self, db_session):
        """Test that duplicate within 1 second after is detected."""
        # Create an existing attendance record
        device_user_id = '12345'
        original_timestamp = datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
        device_serial = 'DEVICE001'
        
        record = AttendanceRecord(
            device_user_id=device_user_id,
            person_type='member',
            person_id=str(uuid.uuid4()),
            check_in_time=original_timestamp,
            device_serial=device_serial
        )
        db_session.add(record)
        db_session.commit()
        
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test with timestamp 0.8 seconds before
        new_timestamp = original_timestamp - timedelta(seconds=0.8)
        result = service.is_duplicate_log(device_user_id, new_timestamp, device_serial)
        
        assert result is True
    
    def test_not_duplicate_outside_time_window(self, db_session):
        """Test that record outside 1 second window is not considered duplicate."""
        # Create an existing attendance record
        device_user_id = '12345'
        original_timestamp = datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
        device_serial = 'DEVICE001'
        
        record = AttendanceRecord(
            device_user_id=device_user_id,
            person_type='member',
            person_id=str(uuid.uuid4()),
            check_in_time=original_timestamp,
            device_serial=device_serial
        )
        db_session.add(record)
        db_session.commit()
        
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test with timestamp 2 seconds after (outside window)
        new_timestamp = original_timestamp + timedelta(seconds=2)
        result = service.is_duplicate_log(device_user_id, new_timestamp, device_serial)
        
        assert result is False
    
    def test_not_duplicate_different_device_user_id(self, db_session):
        """Test that different device_user_id is not considered duplicate."""
        # Create an existing attendance record
        original_timestamp = datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
        device_serial = 'DEVICE001'
        
        record = AttendanceRecord(
            device_user_id='12345',
            person_type='member',
            person_id=str(uuid.uuid4()),
            check_in_time=original_timestamp,
            device_serial=device_serial
        )
        db_session.add(record)
        db_session.commit()
        
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test with different device_user_id
        result = service.is_duplicate_log('67890', original_timestamp, device_serial)
        
        assert result is False
    
    def test_not_duplicate_different_device_serial(self, db_session):
        """Test that different device_serial is not considered duplicate."""
        # Create an existing attendance record
        device_user_id = '12345'
        original_timestamp = datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
        
        record = AttendanceRecord(
            device_user_id=device_user_id,
            person_type='member',
            person_id=str(uuid.uuid4()),
            check_in_time=original_timestamp,
            device_serial='DEVICE001'
        )
        db_session.add(record)
        db_session.commit()
        
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test with different device_serial
        result = service.is_duplicate_log(device_user_id, original_timestamp, 'DEVICE002')
        
        assert result is False
    
    def test_not_duplicate_no_existing_records(self, db_session):
        """Test that no duplicate is found when no records exist."""
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test with no existing records
        timestamp = datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
        result = service.is_duplicate_log('12345', timestamp, 'DEVICE001')
        
        assert result is False
    
    def test_duplicate_with_naive_datetime(self, db_session):
        """Test that duplicate checking works with naive datetime."""
        # Create an existing attendance record with UTC timestamp
        device_user_id = '12345'
        timestamp = datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
        device_serial = 'DEVICE001'
        
        record = AttendanceRecord(
            device_user_id=device_user_id,
            person_type='member',
            person_id=str(uuid.uuid4()),
            check_in_time=timestamp,
            device_serial=device_serial
        )
        db_session.add(record)
        db_session.commit()
        
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test with naive datetime (should be converted to UTC)
        naive_timestamp = datetime(2024, 1, 15, 10, 30, 0)  # No tzinfo
        result = service.is_duplicate_log(device_user_id, naive_timestamp, device_serial)
        
        assert result is True
    
    def test_duplicate_at_exact_boundary(self, db_session):
        """Test duplicate detection at exact 1 second boundary."""
        # Create an existing attendance record
        device_user_id = '12345'
        original_timestamp = datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
        device_serial = 'DEVICE001'
        
        record = AttendanceRecord(
            device_user_id=device_user_id,
            person_type='member',
            person_id=str(uuid.uuid4()),
            check_in_time=original_timestamp,
            device_serial=device_serial
        )
        db_session.add(record)
        db_session.commit()
        
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test at exactly 1 second before (should be duplicate - inclusive boundary)
        timestamp_before = original_timestamp - timedelta(seconds=1)
        result = service.is_duplicate_log(device_user_id, timestamp_before, device_serial)
        assert result is True
        
        # Test at exactly 1 second after (should be duplicate - inclusive boundary)
        timestamp_after = original_timestamp + timedelta(seconds=1)
        result = service.is_duplicate_log(device_user_id, timestamp_after, device_serial)
        assert result is True
    
    def test_duplicate_handles_database_error(self, db_session):
        """Test that duplicate checking handles database errors gracefully."""
        # Create attendance service with mock session that raises error
        device_client = Mock(spec=BiometricDeviceClient)
        mock_session = Mock()
        mock_session.query.side_effect = Exception("Database error")
        
        service = AttendanceService(device_client, mock_session)
        
        # Test - should return False on error to avoid blocking
        timestamp = datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
        result = service.is_duplicate_log('12345', timestamp, 'DEVICE001')
        
        assert result is False
    
    def test_multiple_records_same_user_different_times(self, db_session):
        """Test that multiple records for same user at different times don't interfere."""
        # Create multiple attendance records for same user
        device_user_id = '12345'
        device_serial = 'DEVICE001'
        
        # Record at 10:00
        record1 = AttendanceRecord(
            device_user_id=device_user_id,
            person_type='member',
            person_id=str(uuid.uuid4()),
            check_in_time=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
            device_serial=device_serial
        )
        
        # Record at 14:00
        record2 = AttendanceRecord(
            device_user_id=device_user_id,
            person_type='member',
            person_id=str(uuid.uuid4()),
            check_in_time=datetime(2024, 1, 15, 14, 0, 0, tzinfo=timezone.utc),
            device_serial=device_serial
        )
        
        db_session.add_all([record1, record2])
        db_session.commit()
        
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test with timestamp at 12:00 (not duplicate of either)
        timestamp = datetime(2024, 1, 15, 12, 0, 0, tzinfo=timezone.utc)
        result = service.is_duplicate_log(device_user_id, timestamp, device_serial)
        
        assert result is False


class TestStayDurationCalculation:
    """Tests for calculate_stay_duration method."""
    
    def test_calculate_duration_basic(self, db_session):
        """Test basic stay duration calculation."""
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test with 2 hour difference
        check_in = datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        check_out = datetime(2024, 1, 15, 12, 0, 0, tzinfo=timezone.utc)
        
        result = service.calculate_stay_duration(check_in, check_out)
        
        assert result == 120  # 2 hours = 120 minutes
    
    def test_calculate_duration_with_partial_hour(self, db_session):
        """Test stay duration calculation with partial hours."""
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test with 1 hour 30 minutes
        check_in = datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        check_out = datetime(2024, 1, 15, 11, 30, 0, tzinfo=timezone.utc)
        
        result = service.calculate_stay_duration(check_in, check_out)
        
        assert result == 90  # 1.5 hours = 90 minutes
    
    def test_calculate_duration_with_seconds(self, db_session):
        """Test that seconds are included in calculation and rounded down."""
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test with 1 hour 30 minutes 45 seconds
        check_in = datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        check_out = datetime(2024, 1, 15, 11, 30, 45, tzinfo=timezone.utc)
        
        result = service.calculate_stay_duration(check_in, check_out)
        
        assert result == 90  # 90.75 minutes rounded down to 90
    
    def test_calculate_duration_short_visit(self, db_session):
        """Test stay duration for very short visits."""
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test with 5 minutes
        check_in = datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        check_out = datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc)
        
        result = service.calculate_stay_duration(check_in, check_out)
        
        assert result == 5
    
    def test_calculate_duration_long_visit(self, db_session):
        """Test stay duration for long visits (multiple hours)."""
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test with 8 hours 45 minutes
        check_in = datetime(2024, 1, 15, 9, 0, 0, tzinfo=timezone.utc)
        check_out = datetime(2024, 1, 15, 17, 45, 0, tzinfo=timezone.utc)
        
        result = service.calculate_stay_duration(check_in, check_out)
        
        assert result == 525  # 8 hours 45 minutes = 525 minutes
    
    def test_calculate_duration_with_naive_datetimes(self, db_session):
        """Test stay duration calculation with naive datetimes."""
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test with naive datetimes (no timezone)
        check_in = datetime(2024, 1, 15, 10, 0, 0)
        check_out = datetime(2024, 1, 15, 12, 30, 0)
        
        result = service.calculate_stay_duration(check_in, check_out)
        
        assert result == 150  # 2.5 hours = 150 minutes
    
    def test_calculate_duration_zero_minutes(self, db_session):
        """Test stay duration when check-in and check-out are same time."""
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test with same time
        timestamp = datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        
        result = service.calculate_stay_duration(timestamp, timestamp)
        
        assert result == 0
    
    def test_calculate_duration_less_than_minute(self, db_session):
        """Test stay duration for visits less than a minute."""
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Test with 30 seconds
        check_in = datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        check_out = datetime(2024, 1, 15, 10, 0, 30, tzinfo=timezone.utc)
        
        result = service.calculate_stay_duration(check_in, check_out)
        
        assert result == 0  # 0.5 minutes rounded down to 0



class TestProcessAttendanceLog:
    """Tests for process_attendance_log method."""
    
    def test_process_check_in_creates_new_record(self, db_session):
        """Test that processing a check-in log creates a new attendance record."""
        # Create a device user mapping
        person_id = str(uuid.uuid4())
        mapping = DeviceUserMapping(
            device_user_id='12345',
            person_type='member',
            person_id=person_id
        )
        db_session.add(mapping)
        db_session.commit()
        
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Create attendance log
        from services.biometric_service import AttendanceLog
        timestamp = datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
        log = AttendanceLog(
            device_user_id='12345',
            timestamp=timestamp,
            device_serial='DEVICE001'
        )
        
        # Process the log
        result = service.process_attendance_log(log)
        
        # Verify record was created
        assert result is not None
        assert result.device_user_id == '12345'
        assert result.person_type == 'member'
        assert result.person_id == person_id
        # SQLite stores datetime without timezone, so compare values
        assert result.check_in_time.replace(tzinfo=timezone.utc) == timestamp
        assert result.check_out_time is None
        assert result.stay_duration is None
        assert result.device_serial == 'DEVICE001'
        
        # Verify record is in database
        db_record = db_session.query(AttendanceRecord).filter_by(id=result.id).first()
        assert db_record is not None
        assert db_record.device_user_id == '12345'
    
    def test_process_check_out_updates_existing_record(self, db_session):
        """Test that processing a check-out log updates existing record."""
        # Create a device user mapping
        person_id = str(uuid.uuid4())
        mapping = DeviceUserMapping(
            device_user_id='12345',
            person_type='member',
            person_id=person_id
        )
        db_session.add(mapping)
        db_session.commit()
        
        # Create an open attendance record
        check_in_time = datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        record = AttendanceRecord(
            device_user_id='12345',
            person_type='member',
            person_id=person_id,
            check_in_time=check_in_time,
            check_out_time=None,
            device_serial='DEVICE001'
        )
        db_session.add(record)
        db_session.commit()
        record_id = record.id
        
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Create check-out log
        from services.biometric_service import AttendanceLog
        check_out_time = datetime(2024, 1, 15, 12, 30, 0, tzinfo=timezone.utc)
        log = AttendanceLog(
            device_user_id='12345',
            timestamp=check_out_time,
            device_serial='DEVICE001'
        )
        
        # Process the log
        result = service.process_attendance_log(log)
        
        # Verify record was updated
        assert result is not None
        assert result.id == record_id  # Same record
        # SQLite stores datetime without timezone, so compare values
        assert result.check_out_time.replace(tzinfo=timezone.utc) == check_out_time
        assert result.stay_duration == 150  # 2.5 hours = 150 minutes
        
        # Verify record is updated in database
        db_record = db_session.query(AttendanceRecord).filter_by(id=record_id).first()
        assert db_record.check_out_time.replace(tzinfo=timezone.utc) == check_out_time
        assert db_record.stay_duration == 150
    
    def test_process_duplicate_log_returns_none(self, db_session):
        """Test that processing a duplicate log returns None."""
        # Create a device user mapping
        person_id = str(uuid.uuid4())
        mapping = DeviceUserMapping(
            device_user_id='12345',
            person_type='member',
            person_id=person_id
        )
        db_session.add(mapping)
        db_session.commit()
        
        # Create an existing attendance record
        timestamp = datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
        record = AttendanceRecord(
            device_user_id='12345',
            person_type='member',
            person_id=person_id,
            check_in_time=timestamp,
            device_serial='DEVICE001'
        )
        db_session.add(record)
        db_session.commit()
        
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Create duplicate log
        from services.biometric_service import AttendanceLog
        log = AttendanceLog(
            device_user_id='12345',
            timestamp=timestamp,
            device_serial='DEVICE001'
        )
        
        # Process the log
        result = service.process_attendance_log(log)
        
        # Verify None was returned (duplicate skipped)
        assert result is None
        
        # Verify no new record was created
        records = db_session.query(AttendanceRecord).filter_by(device_user_id='12345').all()
        assert len(records) == 1  # Only the original record
    
    def test_process_unmapped_device_user_returns_none(self, db_session):
        """Test that processing log for unmapped device user returns None."""
        # Create attendance service (no mapping created)
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Create log for unmapped device user
        from services.biometric_service import AttendanceLog
        timestamp = datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
        log = AttendanceLog(
            device_user_id='99999',
            timestamp=timestamp,
            device_serial='DEVICE001'
        )
        
        # Process the log
        result = service.process_attendance_log(log)
        
        # Verify None was returned (unmapped user skipped)
        assert result is None
        
        # Verify no record was created
        records = db_session.query(AttendanceRecord).all()
        assert len(records) == 0
    
    def test_process_third_scan_creates_new_visit(self, db_session):
        """Test that third scan (after completed visit) creates new record."""
        # Create a device user mapping
        person_id = str(uuid.uuid4())
        mapping = DeviceUserMapping(
            device_user_id='12345',
            person_type='member',
            person_id=person_id
        )
        db_session.add(mapping)
        db_session.commit()
        
        # Create a completed attendance record
        check_in_time = datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        check_out_time = datetime(2024, 1, 15, 12, 0, 0, tzinfo=timezone.utc)
        record = AttendanceRecord(
            device_user_id='12345',
            person_type='member',
            person_id=person_id,
            check_in_time=check_in_time,
            check_out_time=check_out_time,
            stay_duration=120,
            device_serial='DEVICE001'
        )
        db_session.add(record)
        db_session.commit()
        
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Create third scan log
        from services.biometric_service import AttendanceLog
        third_scan_time = datetime(2024, 1, 15, 16, 30, 0, tzinfo=timezone.utc)
        log = AttendanceLog(
            device_user_id='12345',
            timestamp=third_scan_time,
            device_serial='DEVICE001'
        )
        
        # Process the log
        result = service.process_attendance_log(log)
        
        # Verify new record was created
        assert result is not None
        # SQLite stores datetime without timezone, so compare values
        assert result.check_in_time.replace(tzinfo=timezone.utc) == third_scan_time
        assert result.check_out_time is None
        
        # Verify two records exist for this person
        records = db_session.query(AttendanceRecord).filter_by(
            person_id=person_id,
            person_type='member'
        ).all()
        assert len(records) == 2
    
    def test_process_with_naive_datetime(self, db_session):
        """Test that processing log with naive datetime works correctly."""
        # Create a device user mapping
        person_id = str(uuid.uuid4())
        mapping = DeviceUserMapping(
            device_user_id='12345',
            person_type='member',
            person_id=person_id
        )
        db_session.add(mapping)
        db_session.commit()
        
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Create log with naive datetime
        from services.biometric_service import AttendanceLog
        naive_timestamp = datetime(2024, 1, 15, 10, 30, 0)  # No tzinfo
        log = AttendanceLog(
            device_user_id='12345',
            timestamp=naive_timestamp,
            device_serial='DEVICE001'
        )
        
        # Process the log
        result = service.process_attendance_log(log)
        
        # Verify record was created with UTC timezone
        assert result is not None
        # SQLite stores datetime without timezone, but we converted naive to UTC before storing
        # The value should match (ignoring timezone info in comparison)
        assert result.check_in_time.replace(tzinfo=timezone.utc) == naive_timestamp.replace(tzinfo=timezone.utc)
    
    def test_process_with_notification_emitter(self, db_session):
        """Test that notifications are emitted when notification_emitter is provided."""
        # Create a device user mapping
        person_id = str(uuid.uuid4())
        mapping = DeviceUserMapping(
            device_user_id='12345',
            person_type='member',
            person_id=person_id
        )
        db_session.add(mapping)
        db_session.commit()
        
        # Create mock notification emitter
        mock_notifier = Mock()
        mock_notifier.emit_check_in = Mock()
        
        # Create attendance service with notification emitter
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session, notification_emitter=mock_notifier)
        
        # Create check-in log
        from services.biometric_service import AttendanceLog
        timestamp = datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
        log = AttendanceLog(
            device_user_id='12345',
            timestamp=timestamp,
            device_serial='DEVICE001'
        )
        
        # Process the log
        result = service.process_attendance_log(log)
        
        # Verify notification was emitted
        assert result is not None
        mock_notifier.emit_check_in.assert_called_once()
    
    def test_process_check_out_with_notification_emitter(self, db_session):
        """Test that check-out notifications are emitted."""
        # Create a device user mapping
        person_id = str(uuid.uuid4())
        mapping = DeviceUserMapping(
            device_user_id='12345',
            person_type='member',
            person_id=person_id
        )
        db_session.add(mapping)
        db_session.commit()
        
        # Create an open attendance record
        check_in_time = datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        record = AttendanceRecord(
            device_user_id='12345',
            person_type='member',
            person_id=person_id,
            check_in_time=check_in_time,
            check_out_time=None,
            device_serial='DEVICE001'
        )
        db_session.add(record)
        db_session.commit()
        
        # Create mock notification emitter
        mock_notifier = Mock()
        mock_notifier.emit_check_out = Mock()
        
        # Create attendance service with notification emitter
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session, notification_emitter=mock_notifier)
        
        # Create check-out log
        from services.biometric_service import AttendanceLog
        check_out_time = datetime(2024, 1, 15, 12, 30, 0, tzinfo=timezone.utc)
        log = AttendanceLog(
            device_user_id='12345',
            timestamp=check_out_time,
            device_serial='DEVICE001'
        )
        
        # Process the log
        result = service.process_attendance_log(log)
        
        # Verify notification was emitted
        assert result is not None
        mock_notifier.emit_check_out.assert_called_once()
    
    def test_process_handles_notification_error_gracefully(self, db_session):
        """Test that notification errors don't prevent record creation."""
        # Create a device user mapping
        person_id = str(uuid.uuid4())
        mapping = DeviceUserMapping(
            device_user_id='12345',
            person_type='member',
            person_id=person_id
        )
        db_session.add(mapping)
        db_session.commit()
        
        # Create mock notification emitter that raises error
        mock_notifier = Mock()
        mock_notifier.emit_check_in = Mock(side_effect=Exception("Notification failed"))
        
        # Create attendance service with notification emitter
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session, notification_emitter=mock_notifier)
        
        # Create check-in log
        from services.biometric_service import AttendanceLog
        timestamp = datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
        log = AttendanceLog(
            device_user_id='12345',
            timestamp=timestamp,
            device_serial='DEVICE001'
        )
        
        # Process the log - should succeed despite notification error
        result = service.process_attendance_log(log)
        
        # Verify record was still created
        assert result is not None
        # SQLite stores datetime without timezone, so compare values
        assert result.check_in_time.replace(tzinfo=timezone.utc) == timestamp
    
    def test_process_handles_database_error_gracefully(self, db_session):
        """Test that database errors are handled gracefully."""
        # Create a device user mapping
        person_id = str(uuid.uuid4())
        mapping = DeviceUserMapping(
            device_user_id='12345',
            person_type='member',
            person_id=person_id
        )
        db_session.add(mapping)
        db_session.commit()
        
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        
        # Create mock session that raises error on commit
        mock_session = Mock()
        mock_session.query = db_session.query
        mock_session.add = Mock()
        mock_session.commit = Mock(side_effect=Exception("Database error"))
        mock_session.rollback = Mock()
        
        service = AttendanceService(device_client, mock_session)
        
        # Create check-in log
        from services.biometric_service import AttendanceLog
        timestamp = datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
        log = AttendanceLog(
            device_user_id='12345',
            timestamp=timestamp,
            device_serial='DEVICE001'
        )
        
        # Process the log - should return None on error
        result = service.process_attendance_log(log)
        
        # Verify None was returned
        assert result is None
        
        # Verify rollback was called
        mock_session.rollback.assert_called_once()
    
    def test_process_extracts_all_log_fields(self, db_session):
        """Test that all fields from log are correctly extracted and stored."""
        # Create a device user mapping
        person_id = str(uuid.uuid4())
        mapping = DeviceUserMapping(
            device_user_id='TEST123',
            person_type='trainer',
            person_id=person_id
        )
        db_session.add(mapping)
        db_session.commit()
        
        # Create attendance service
        device_client = Mock(spec=BiometricDeviceClient)
        service = AttendanceService(device_client, db_session)
        
        # Create log with specific values
        from services.biometric_service import AttendanceLog
        timestamp = datetime(2024, 1, 15, 14, 45, 30, tzinfo=timezone.utc)
        log = AttendanceLog(
            device_user_id='TEST123',
            timestamp=timestamp,
            device_serial='SERIAL999'
        )
        
        # Process the log
        result = service.process_attendance_log(log)
        
        # Verify all fields are correctly stored
        assert result is not None
        assert result.device_user_id == 'TEST123'
        assert result.person_type == 'trainer'
        assert result.person_id == person_id
        # SQLite stores datetime without timezone, so compare values
        assert result.check_in_time.replace(tzinfo=timezone.utc) == timestamp
        assert result.device_serial == 'SERIAL999'
