import os

DB_CHOICE_FILE = os.path.join(os.path.dirname(__file__), 'active_db.txt')

def get_active_db():
    if os.path.exists(DB_CHOICE_FILE):
        try:
            with open(DB_CHOICE_FILE, 'r') as f:
                db_name = f.read().strip()
                if db_name in ('default', 'supabase'):
                    return db_name
        except Exception:
            pass
    return 'supabase'

def set_active_db(db_name):
    try:
        with open(DB_CHOICE_FILE, 'w') as f:
            f.write(db_name)
    except Exception:
        pass

class DynamicDBRouter:
    def db_for_read(self, model, **hints):
        return get_active_db()

    def db_for_write(self, model, **hints):
        return get_active_db()

    def allow_relation(self, obj1, obj2, **hints):
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        return True
