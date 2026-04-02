from models import UserPreference, UserInteraction, db
from app import app

with app.app_context():
    # Clean up any existing test data first
    print('Cleaning up existing test data...')
    try:
        UserPreference.query.filter_by(user_id=1, pref_key='budget').delete()
        UserInteraction.query.filter_by(user_id=1, action='viewed').delete()
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f'Cleanup failed: {e}')

    # Test UserPreference table
    print('Testing UserPreference table...')
    try:
        # Create a test preference
        pref = UserPreference(user_id=1, pref_key='budget', pref_value='{"max": 50000000}')
        db.session.add(pref)
        db.session.commit()

        # Query it back
        retrieved = UserPreference.query.filter_by(user_id=1, pref_key='budget').first()
        print(f'UserPreference works: {retrieved.pref_key} = {retrieved.pref_value}')

        # Clean up
        db.session.delete(pref)
        db.session.commit()
    except Exception as e:
        print(f'UserPreference test failed: {e}')
        db.session.rollback()

    # Test UserInteraction table
    print('Testing UserInteraction table...')
    try:
        # Create a test interaction
        interaction = UserInteraction(
            user_id=1,
            property_id=1,
            action='viewed',
            duration_seconds=30,
            session_id='test_session'
        )
        db.session.add(interaction)
        db.session.commit()

        # Query it back
        retrieved = UserInteraction.query.filter_by(user_id=1, action='viewed').first()
        print(f'UserInteraction works: {retrieved.action} on property {retrieved.property_id}')

        # Clean up
        db.session.delete(interaction)
        db.session.commit()
    except Exception as e:
        print(f'UserInteraction test failed: {e}')
        db.session.rollback()

print('Table verification complete.')