from .models import LoginUsuario
from django.http import HttpResponse


def holamundo(request):
    persona = LoginUsuario.objects.get(id_tienda=1)
    return HttpResponse(persona.correo_usuario + " " + persona.password_usuario)

