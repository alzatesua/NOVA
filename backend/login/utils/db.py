from threading import local

_user_db = local()

def set_current_tienda_db(alias):
    _user_db.alias = alias

def get_current_tienda_db():
    return getattr(_user_db, 'alias', 'default')
