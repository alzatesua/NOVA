from django.apps import AppConfig


class MainDashboardConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'main_dashboard'

    def ready(self):
        """
        Importar signals cuando la app esté lista.
        Esto es necesario para que los signals se registren correctamente.
        """
        import main_dashboard.models
