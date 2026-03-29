"""Tests for attendance API endpoints."""
import pytest
from datetime import datetime, timezone, timedelta
from flask_jwt_extended import create_access_token
from models.user import User, UserRole
from models.member_profile import MemberProfile
from models.trainer_profile import TrainerProfile
from models.attendance_record import AttendanceRecord
from database import db


@pytest.fixture
def admin_user(app):
    """Create an admin user for testing."""
    with app.app_context():
        user = User(
            username='admin_test',
            email='admin@test.com',
            password_hash='hashed_password',
            role=UserRole.ADMIN
        )
        db.session.add(user)
        db.session.commit()
        return user


@pytest.fixture
def admin_token(app, admin_user):
    """Create JWT token for admin user."""
    with app.app_context():
        token = create_access_token(identity=admin_user.id)
        return token


@pytest.fixture
def member_profile(app):
    """Create a member profile for testing."""
    with app.app_context():
        user = User(
            username='member_test',
            email='member@test.com',
            password_hash='hashed_password',
            role=UserRole.MEMBER
        )
        db.session.add(user)
        db.session.flush()
        
        member = MemberProfile(
            user_id=user.id,
            full_name='John Doe',
            phone='1234567890',
            email='john@test.com',
            gender='Male',
            admission_date=datetime.now(timezone.utc).date()
        )
        db.session.add(member)
        db.session.commit()
        return member


@pytest.fixture
def trainer_profile(app):
    """Create a trainer profile for testing."""
    with app.app_context():
        user = User(
            username='trainer_test',
            email='trainer@test.com',
            password_hash='hashed_password',
            role=UserRole.TRAINER
        )
        db.session.add(user)
        db.session.flush()
        
        trainer = TrainerProfile(
            user_id=user.id,
            full_name='Jane Smith',
            phone='0987654321',
            email='jane@test.com',
            specialization='Fitness',
            salary_rate=5000.00
        )
        db.session.add(trainer)
        db.session.commit()
        return trainer


class TestTodayAttendance:
    """Tests for GET /api/attendance/today endpoint."""
    
    def test_today_attendance_requires_auth(self, client):
        """Test that endpoint requires authentication."""
        response = client.get('/api/attendance/today')
        assert response.status_code == 401
    
    def test_today_attendance_empty(self, client, admin_token):
        """Test getting today's attendance when no records exist."""
        headers = {'Authorization': f'Bearer {admin_token}'}
        response = client.get('/api/attendance/today', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'records' in data
        assert data['records'] == []
    
    def test_today_attendance_with_records(self, app, client, admin_token, member_profile):
        """Test getting today's attendance with existing records."""
        with app.app_context():
            now = datetime.now(timezone.utc)
            
            # Create attendance record for today
            record = AttendanceRecord(
                device_user_id='device_001',
                person_type='member',
                person_id=member_profile.id,
                check_in_time=now,
                device_serial='serial_001'
            )
            db.session.add(record)
            db.session.commit()
        
        headers = {'Authorization': f'Bearer {admin_token}'}
        response = client.get('/api/attendance/today', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['records']) == 1
        assert data['records'][0]['person_type'] == 'member'
        assert data['records'][0]['person_name'] == 'John Doe'
        assert data['records'][0]['check_out_time'] is None
    
    def test_today_attendance_with_person_type_filter(self, app, client, admin_token, member_profile, trainer_profile):
        """Test filtering today's attendance by person_type."""
        with app.app_context():
            now = datetime.now(timezone.utc)
            
            # Create member record
            member_record = AttendanceRecord(
                device_user_id='device_001',
                person_type='member',
                person_id=member_profile.id,
                check_in_time=now,
                device_serial='serial_001'
            )
            db.session.add(member_record)
            
            # Create trainer record
            trainer_record = AttendanceRecord(
                device_user_id='device_002',
                person_type='trainer',
                person_id=trainer_profile.id,
                check_in_time=now,
                device_serial='serial_002'
            )
            db.session.add(trainer_record)
            db.session.commit()
        
        headers = {'Authorization': f'Bearer {admin_token}'}
        
        # Filter by member
        response = client.get('/api/attendance/today?person_type=member', headers=headers)
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['records']) == 1
        assert data['records'][0]['person_type'] == 'member'
        
        # Filter by trainer
        response = client.get('/api/attendance/today?person_type=trainer', headers=headers)
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['records']) == 1
        assert data['records'][0]['person_type'] == 'trainer'
    
    def test_today_attendance_excludes_yesterday(self, app, client, admin_token, member_profile):
        """Test that yesterday's records are not included in today's attendance."""
        with app.app_context():
            now = datetime.now(timezone.utc)
            yesterday = now - timedelta(days=1)
            
            # Create record for yesterday
            record = AttendanceRecord(
                device_user_id='device_001',
                person_type='member',
                person_id=member_profile.id,
                check_in_time=yesterday,
                device_serial='serial_001'
            )
            db.session.add(record)
            db.session.commit()
        
        headers = {'Authorization': f'Bearer {admin_token}'}
        response = client.get('/api/attendance/today', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['records']) == 0


class TestAttendanceHistory:
    """Tests for GET /api/attendance/history endpoint."""
    
    def test_history_requires_auth(self, client):
        """Test that endpoint requires authentication."""
        response = client.get('/api/attendance/history')
        assert response.status_code == 401
    
    def test_history_empty(self, client, admin_token):
        """Test getting history when no records exist."""
        headers = {'Authorization': f'Bearer {admin_token}'}
        response = client.get('/api/attendance/history', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'records' in data
        assert 'total' in data
        assert 'page' in data
        assert 'per_page' in data
        assert 'pages' in data
        assert data['total'] == 0
        assert data['records'] == []
    
    def test_history_pagination(self, app, client, admin_token, member_profile):
        """Test pagination in history endpoint."""
        with app.app_context():
            now = datetime.now(timezone.utc)
            
            # Create 25 records
            for i in range(25):
                record = AttendanceRecord(
                    device_user_id=f'device_{i:03d}',
                    person_type='member',
                    person_id=member_profile.id,
                    check_in_time=now - timedelta(minutes=i),
                    device_serial='serial_001'
                )
                db.session.add(record)
            db.session.commit()
        
        headers = {'Authorization': f'Bearer {admin_token}'}
        
        # Get first page (default 20 per page)
        response = client.get('/api/attendance/history', headers=headers)
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['records']) == 20
        assert data['total'] == 25
        assert data['page'] == 1
        assert data['pages'] == 2
        
        # Get second page
        response = client.get('/api/attendance/history?page=2', headers=headers)
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['records']) == 5
        assert data['page'] == 2
    
    def test_history_custom_per_page(self, app, client, admin_token, member_profile):
        """Test custom per_page parameter."""
        with app.app_context():
            now = datetime.now(timezone.utc)
            
            # Create 15 records
            for i in range(15):
                record = AttendanceRecord(
                    device_user_id=f'device_{i:03d}',
                    person_type='member',
                    person_id=member_profile.id,
                    check_in_time=now - timedelta(minutes=i),
                    device_serial='serial_001'
                )
                db.session.add(record)
            db.session.commit()
        
        headers = {'Authorization': f'Bearer {admin_token}'}
        response = client.get('/api/attendance/history?per_page=10', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['records']) == 10
        assert data['per_page'] == 10
        assert data['pages'] == 2
    
    def test_history_date_range_filter(self, app, client, admin_token, member_profile):
        """Test date range filtering."""
        with app.app_context():
            now = datetime.now(timezone.utc)
            
            # Create records on different days
            for i in range(5):
                record = AttendanceRecord(
                    device_user_id=f'device_{i:03d}',
                    person_type='member',
                    person_id=member_profile.id,
                    check_in_time=now - timedelta(days=i),
                    device_serial='serial_001'
                )
                db.session.add(record)
            db.session.commit()
        
        headers = {'Authorization': f'Bearer {admin_token}'}
        
        # Filter by date range (last 2 days)
        start_date = (now - timedelta(days=2)).date().isoformat()
        end_date = now.date().isoformat()
        response = client.get(
            f'/api/attendance/history?start_date={start_date}&end_date={end_date}',
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['total'] == 3  # Today, yesterday, 2 days ago
    
    def test_history_person_type_filter(self, app, client, admin_token, member_profile, trainer_profile):
        """Test person_type filtering."""
        with app.app_context():
            now = datetime.now(timezone.utc)
            
            # Create member records
            for i in range(3):
                record = AttendanceRecord(
                    device_user_id=f'member_{i}',
                    person_type='member',
                    person_id=member_profile.id,
                    check_in_time=now - timedelta(minutes=i),
                    device_serial='serial_001'
                )
                db.session.add(record)
            
            # Create trainer records
            for i in range(2):
                record = AttendanceRecord(
                    device_user_id=f'trainer_{i}',
                    person_type='trainer',
                    person_id=trainer_profile.id,
                    check_in_time=now - timedelta(minutes=i),
                    device_serial='serial_002'
                )
                db.session.add(record)
            db.session.commit()
        
        headers = {'Authorization': f'Bearer {admin_token}'}
        
        # Filter by member
        response = client.get('/api/attendance/history?person_type=member', headers=headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data['total'] == 3
        
        # Filter by trainer
        response = client.get('/api/attendance/history?person_type=trainer', headers=headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data['total'] == 2
    
    def test_history_person_id_filter(self, app, client, admin_token, member_profile, trainer_profile):
        """Test person_id filtering."""
        with app.app_context():
            now = datetime.now(timezone.utc)
            
            # Create records for different people
            for i in range(2):
                record = AttendanceRecord(
                    device_user_id=f'device_{i}',
                    person_type='member',
                    person_id=member_profile.id,
                    check_in_time=now - timedelta(minutes=i),
                    device_serial='serial_001'
                )
                db.session.add(record)
            
            record = AttendanceRecord(
                device_user_id='device_trainer',
                person_type='trainer',
                person_id=trainer_profile.id,
                check_in_time=now,
                device_serial='serial_002'
            )
            db.session.add(record)
            db.session.commit()
        
        headers = {'Authorization': f'Bearer {admin_token}'}
        
        # Filter by member_profile.id
        response = client.get(f'/api/attendance/history?person_id={member_profile.id}', headers=headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data['total'] == 2
    
    def test_history_sort_order(self, app, client, admin_token, member_profile):
        """Test that records are sorted by check_in_time descending."""
        with app.app_context():
            now = datetime.now(timezone.utc)
            
            # Create records with different times
            times = [now - timedelta(minutes=i) for i in range(5)]
            for i, time in enumerate(times):
                record = AttendanceRecord(
                    device_user_id=f'device_{i}',
                    person_type='member',
                    person_id=member_profile.id,
                    check_in_time=time,
                    device_serial='serial_001'
                )
                db.session.add(record)
            db.session.commit()
        
        headers = {'Authorization': f'Bearer {admin_token}'}
        response = client.get('/api/attendance/history', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        
        # Verify descending order
        for i in range(len(data['records']) - 1):
            current_time = datetime.fromisoformat(data['records'][i]['check_in_time'].replace('Z', '+00:00'))
            next_time = datetime.fromisoformat(data['records'][i + 1]['check_in_time'].replace('Z', '+00:00'))
            assert current_time >= next_time


class TestCurrentlyInside:
    """Tests for GET /api/attendance/live endpoint."""
    
    def test_live_requires_auth(self, client):
        """Test that endpoint requires authentication."""
        response = client.get('/api/attendance/live')
        assert response.status_code == 401
    
    def test_live_empty(self, client, admin_token):
        """Test getting live data when no one is inside."""
        headers = {'Authorization': f'Bearer {admin_token}'}
        response = client.get('/api/attendance/live', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'members' in data
        assert 'trainers' in data
        assert data['members'] == []
        assert data['trainers'] == []
    
    def test_live_with_checked_in_members(self, app, client, admin_token, member_profile):
        """Test getting live data with checked-in members."""
        with app.app_context():
            now = datetime.now(timezone.utc)
            
            # Create check-in record (no check-out)
            record = AttendanceRecord(
                device_user_id='device_001',
                person_type='member',
                person_id=member_profile.id,
                check_in_time=now - timedelta(minutes=30),
                device_serial='serial_001'
            )
            db.session.add(record)
            db.session.commit()
        
        headers = {'Authorization': f'Bearer {admin_token}'}
        response = client.get('/api/attendance/live', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['members']) == 1
        assert len(data['trainers']) == 0
        
        member_entry = data['members'][0]
        assert member_entry['person_name'] == 'John Doe'
        assert member_entry['time_spent_so_far'] >= 29  # At least 29 minutes
        assert 'time_spent_formatted' in member_entry
    
    def test_live_excludes_checked_out(self, app, client, admin_token, member_profile):
        """Test that checked-out records are not included in live data."""
        with app.app_context():
            now = datetime.now(timezone.utc)
            
            # Create check-in and check-out record
            record = AttendanceRecord(
                device_user_id='device_001',
                person_type='member',
                person_id=member_profile.id,
                check_in_time=now - timedelta(hours=1),
                check_out_time=now - timedelta(minutes=30),
                stay_duration=30,
                device_serial='serial_001'
            )
            db.session.add(record)
            db.session.commit()
        
        headers = {'Authorization': f'Bearer {admin_token}'}
        response = client.get('/api/attendance/live', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['members']) == 0
        assert len(data['trainers']) == 0
    
    def test_live_groups_by_person_type(self, app, client, admin_token, member_profile, trainer_profile):
        """Test that live data is grouped by person_type."""
        with app.app_context():
            now = datetime.now(timezone.utc)
            
            # Create member check-in
            member_record = AttendanceRecord(
                device_user_id='device_001',
                person_type='member',
                person_id=member_profile.id,
                check_in_time=now - timedelta(minutes=20),
                device_serial='serial_001'
            )
            db.session.add(member_record)
            
            # Create trainer check-in
            trainer_record = AttendanceRecord(
                device_user_id='device_002',
                person_type='trainer',
                person_id=trainer_profile.id,
                check_in_time=now - timedelta(minutes=10),
                device_serial='serial_002'
            )
            db.session.add(trainer_record)
            db.session.commit()
        
        headers = {'Authorization': f'Bearer {admin_token}'}
        response = client.get('/api/attendance/live', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['members']) == 1
        assert len(data['trainers']) == 1
        assert data['members'][0]['person_name'] == 'John Doe'
        assert data['trainers'][0]['person_name'] == 'Jane Smith'
    
    def test_live_time_spent_calculation(self, app, client, admin_token, member_profile):
        """Test that time_spent_so_far is calculated correctly."""
        with app.app_context():
            now = datetime.now(timezone.utc)
            check_in_time = now - timedelta(minutes=45)
            
            record = AttendanceRecord(
                device_user_id='device_001',
                person_type='member',
                person_id=member_profile.id,
                check_in_time=check_in_time,
                device_serial='serial_001'
            )
            db.session.add(record)
            db.session.commit()
        
        headers = {'Authorization': f'Bearer {admin_token}'}
        response = client.get('/api/attendance/live', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['members']) == 1
        
        # Time spent should be approximately 45 minutes (allow 1 minute variance)
        time_spent = data['members'][0]['time_spent_so_far']
        assert 44 <= time_spent <= 46


class TestManualSync:
    """Tests for POST /api/attendance/sync endpoint."""
    
    def test_sync_requires_auth(self, client):
        """Test that endpoint requires authentication."""
        response = client.post('/api/attendance/sync')
        assert response.status_code == 401
    
    def test_sync_endpoint_exists(self, client, admin_token):
        """Test that sync endpoint is accessible with auth."""
        headers = {'Authorization': f'Bearer {admin_token}'}
        response = client.post('/api/attendance/sync', headers=headers)
        
        # Should return 200 or 500 depending on device availability
        # We're just testing that the endpoint exists and requires auth
        assert response.status_code in [200, 500]
        data = response.get_json()
        assert 'success' in data
        assert 'records_processed' in data
        assert 'message' in data


class TestStayDurationFormatting:
    """Tests for stay duration formatting."""
    
    def test_format_stay_duration_minutes_only(self, app, client, admin_token, member_profile):
        """Test formatting stay duration with only minutes."""
        with app.app_context():
            now = datetime.now(timezone.utc)
            
            record = AttendanceRecord(
                device_user_id='device_001',
                person_type='member',
                person_id=member_profile.id,
                check_in_time=now - timedelta(hours=1),
                check_out_time=now - timedelta(minutes=45),
                stay_duration=15,
                device_serial='serial_001'
            )
            db.session.add(record)
            db.session.commit()
        
        headers = {'Authorization': f'Bearer {admin_token}'}
        response = client.get('/api/attendance/history', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['records']) == 1
        assert data['records'][0]['stay_duration_formatted'] == '15m'
    
    def test_format_stay_duration_hours_and_minutes(self, app, client, admin_token, member_profile):
        """Test formatting stay duration with hours and minutes."""
        with app.app_context():
            now = datetime.now(timezone.utc)
            
            record = AttendanceRecord(
                device_user_id='device_001',
                person_type='member',
                person_id=member_profile.id,
                check_in_time=now - timedelta(hours=2),
                check_out_time=now - timedelta(minutes=30),
                stay_duration=90,
                device_serial='serial_001'
            )
            db.session.add(record)
            db.session.commit()
        
        headers = {'Authorization': f'Bearer {admin_token}'}
        response = client.get('/api/attendance/history', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['records']) == 1
        assert data['records'][0]['stay_duration_formatted'] == '1h 30m'
    
    def test_format_stay_duration_hours_only(self, app, client, admin_token, member_profile):
        """Test formatting stay duration with only hours."""
        with app.app_context():
            now = datetime.now(timezone.utc)
            
            record = AttendanceRecord(
                device_user_id='device_001',
                person_type='member',
                person_id=member_profile.id,
                check_in_time=now - timedelta(hours=3),
                check_out_time=now,
                stay_duration=180,
                device_serial='serial_001'
            )
            db.session.add(record)
            db.session.commit()
        
        headers = {'Authorization': f'Bearer {admin_token}'}
        response = client.get('/api/attendance/history', headers=headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert len(data['records']) == 1
        assert data['records'][0]['stay_duration_formatted'] == '3h'
