from django.contrib.auth import authenticate, login, logout
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from .serializers import LoginSerializer, pedir_cambio_contrasena_serializer
from django.contrib import messages
from django.shortcuts import render, redirect
from .models import LoginUsuario
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.core.mail import send_mail
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode


@api_view(['POST'])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        print(request.data)
        user = authenticate(username=serializer.validated_data['correo_usuario'], password=serializer.validated_data['password'])
        if user:
            login(request, user)
            return Response({"message": "Inicio de sesión exitoso", "redirect": "http://127.0.0.1:8000/logout/"}, status=status.HTTP_200_OK)
    return Response({"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)

def login_page(request):
    return render(request, 'login.html')

@api_view(['POST'])
def logout_view(request):
    logout(request)  # Esto cierra la sesión del usuario actual.
    return Response({"message": "Logout exitoso", "redirect": "http://127.0.0.1:8000/login/"}, status=status.HTTP_200_OK)

def logout_page(request):
    return render(request, 'logout.html')

@api_view(["POST"])
def email_request(request):
    serializer = pedir_cambio_contrasena_serializer(data=request.data)
    if serializer.is_valid():
        correo_usuario = serializer.validated_data['correo_usuario']
        if not correo_usuario:
            return Response("Error: El correo del usuario es obligatorio", status=status.HTTP_400_BAD_REQUEST)
        try:
            user = LoginUsuario.objects.get(correo_usuario=correo_usuario)
        except Exception as e:
            return Response({"message": f"Si el correo existe, se ha enviado correctamente o hay errror: {e}"}, status=status.HTTP_200_OK)
        
        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        # Construye el enlace de restablecimiento; asegúrate de ajustar la URL según tu frontend o backend.
        reset_url = request.build_absolute_uri(f"http://127.0.0.1:8000/api/reset-password-confirm/{uid}/{token}/")

    subject = "Restablece tu contraseña"
    message = f"Haz click en el siguiente enlace para restablecer tu contraseña:\n{reset_url}"
    send_mail(subject, message, 'zuletajonathan18@gmail.com', [user.correo_usuario])

    return Response({"success": "Si el email existe, se ha enviado un enlace de reseteo."})

def recuperar_contrasena(request):
    return render(request, 'recuperar_contrasena.html')


def reset_password_confirm(request, uidb64, token):
    try:
        # Decodificamos el uid que está en base64
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = LoginUsuario.objects.get(pk=uid)
    except Exception:
        user = None

    token_generator = PasswordResetTokenGenerator()
    if user is not None and token_generator.check_token(user, token):
        if request.method == 'POST':
            nueva_contrasena = request.POST.get('nueva_contrasena')
            confirmar_contrasena = request.POST.get('confirmar_contrasena')
            print(confirmar_contrasena, nueva_contrasena)
            if not nueva_contrasena:
                
                messages.error(request, "Debes ingresar una contraseña.")
                return render(request, 'nueva_contrasena.html', {'uidb64': uidb64, 'token': token})

            if nueva_contrasena != confirmar_contrasena:
                messages.error(request, "Las contraseñas no coinciden.")
                return render(request, 'nueva_contrasena.html', {'uidb64': uidb64, 'token': token})

            # Actualizamos la contraseña del usuario
            user.set_password(nueva_contrasena)
            user.save()
            messages.success(request, "Tu contraseña ha sido actualizada exitosamente.")
            return redirect('http://127.0.0.1:8000/login/')  # Redirige a la página de login u otra de tu preferencia
        else:
            # Método GET: mostramos el formulario para que ingrese la nueva contraseña
            return render(request, 'nueva_contrasena.html', {'uidb64': uidb64, 'token': token})
    else:
        messages.error(request, "El enlace de restablecimiento es inválido o ha expirado.")
        return redirect('http://127.0.0.1:8000/pedir_cambio_contrasena/')
