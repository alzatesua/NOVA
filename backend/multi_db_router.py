# backend/multi_db_router.py
from django.conf import settings
from nova.models import Tiendas

import threading

_thread_locals = threading.local()

def set_current_tienda_db(db_info):
    _thread_locals.db_info = db_info

def get_current_tienda_db():
    return getattr(_thread_locals, 'db_info', None)

class TiendaDatabaseRouter:
    def db_for_read(self, model, **hints):
        db_info = get_current_tienda_db()
        return db_info.get('alias') if db_info else None

    def db_for_write(self, model, **hints):
        db_info = get_current_tienda_db()
        return db_info.get('alias') if db_info else None
