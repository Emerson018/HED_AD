import threading

_thread_locals = threading.local()

def set_active_db(db_name):
    _thread_locals.active_db = db_name

def get_active_db():
    return getattr(_thread_locals, 'active_db', 'supabase')

class DynamicDBRouter:
    def db_for_read(self, model, **hints):
        return get_active_db()

    def db_for_write(self, model, **hints):
        return get_active_db()

    def allow_relation(self, obj1, obj2, **hints):
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        return True
