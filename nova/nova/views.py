from django.contrib.auth import authenticate, login, logout
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from .serializers import LoginSerializer
from django.shortcuts import render
from django.shortcuts import redirect


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
