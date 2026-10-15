import os
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView

from api.models import (
    db, User, UserPreferences, DailyEntry,
    SleepReport, HabitLog, NutritionLog,
    DreamConcept, SleepAnalysis
)


def setup_admin(app):
    app.secret_key = os.environ.get('FLASK_APP_KEY', 'sample key')
    app.config['FLASK_ADMIN_SWATCH'] = 'cerulean'
    admin = Admin(app, name='Eusomnia Admin', template_mode='bootstrap3')

    admin.add_view(ModelView(User, db.session))
    admin.add_view(ModelView(UserPreferences, db.session))
    admin.add_view(ModelView(DailyEntry, db.session))
    admin.add_view(ModelView(SleepReport, db.session))
    admin.add_view(ModelView(HabitLog, db.session))
    admin.add_view(ModelView(NutritionLog, db.session))
    admin.add_view(ModelView(DreamConcept, db.session))
    admin.add_view(ModelView(SleepAnalysis, db.session))
