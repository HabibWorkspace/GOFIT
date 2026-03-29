"""Unit tests for DeviceUserMapping model."""
import pytest
from models.device_user_mapping import DeviceUserMapping
from database import db
import uuid


def test_device_user_mapping_creation(db_session):
    """Test creating a device user mapping."""
    mapping = DeviceUserMapping(
        device_user_id='12345',
        person_type='member',
        person_id=str(uuid.uuid4())
    )
    db_session.add(mapping)
    db_session.commit()
    
    assert mapping.id is not None
    assert mapping.device_user_id == '12345'
    assert mapping.person_type == 'member'
    assert mapping.created_at is not None
    assert mapping.updated_at is not None


def test_device_user_mapping_to_dict(db_session):
    """Test to_dict method returns correct format."""
    person_id = str(uuid.uuid4())
    mapping = DeviceUserMapping(
        device_user_id='67890',
        person_type='trainer',
        person_id=person_id
    )
    db_session.add(mapping)
    db_session.commit()
    
    result = mapping.to_dict()
    
    assert 'id' in result
    assert result['device_user_id'] == '67890'
    assert result['person_type'] == 'trainer'
    assert result['person_id'] == person_id
    assert result['created_at'].endswith('Z')
    assert result['updated_at'].endswith('Z')


def test_device_user_id_unique_constraint(db_session):
    """Test that device_user_id must be unique."""
    person_id1 = str(uuid.uuid4())
    person_id2 = str(uuid.uuid4())
    
    mapping1 = DeviceUserMapping(
        device_user_id='11111',
        person_type='member',
        person_id=person_id1
    )
    db_session.add(mapping1)
    db_session.commit()
    
    # Try to create another mapping with same device_user_id
    mapping2 = DeviceUserMapping(
        device_user_id='11111',
        person_type='trainer',
        person_id=person_id2
    )
    db_session.add(mapping2)
    
    with pytest.raises(Exception):  # SQLAlchemy will raise IntegrityError
        db_session.commit()


def test_person_unique_constraint(db_session):
    """Test that (person_type, person_id) combination must be unique."""
    person_id = str(uuid.uuid4())
    
    mapping1 = DeviceUserMapping(
        device_user_id='22222',
        person_type='member',
        person_id=person_id
    )
    db_session.add(mapping1)
    db_session.commit()
    
    # Try to create another mapping for same person
    mapping2 = DeviceUserMapping(
        device_user_id='33333',
        person_type='member',
        person_id=person_id
    )
    db_session.add(mapping2)
    
    with pytest.raises(Exception):  # SQLAlchemy will raise IntegrityError
        db_session.commit()


def test_different_person_types_same_id_allowed(db_session):
    """Test that same person_id can exist for different person_types."""
    person_id = str(uuid.uuid4())
    
    # This is allowed - same person_id but different person_type
    mapping1 = DeviceUserMapping(
        device_user_id='44444',
        person_type='member',
        person_id=person_id
    )
    mapping2 = DeviceUserMapping(
        device_user_id='55555',
        person_type='trainer',
        person_id=person_id
    )
    
    db_session.add(mapping1)
    db_session.add(mapping2)
    db_session.commit()
    
    assert mapping1.id != mapping2.id
    assert mapping1.person_id == mapping2.person_id
    assert mapping1.person_type != mapping2.person_type
