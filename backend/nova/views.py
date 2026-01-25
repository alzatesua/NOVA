### Archivo: nova/views.py
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework_simplejwt.tokens import RefreshToken
from django.apps import apps
from django.contrib.auth.hashers import check_password
from .utils.db import conectar_db_tienda
from login.serializers import LoginSerializer  # Importa el serializer desde la app de login
from .models import Tiendas, Direccion, Documento, LoginUsuario, Dominios, TipoDocumento
from .serializers import TiendaSerializer, CustomTokenObtainPairSerializer, DireccionSerializer, DocumentoSerializer, TipoDocumentoSerializer
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from django.core.exceptions import ValidationError
import logging
import json, requests
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError
from datetime import timedelta
from cities_light.models import Country, Region, SubRegion, City
from .serializers import CountrySerializer, RegionSerializer, SubRegionSerializer, CitySerializer
from nova.utils.email import enviar_correo_mailjet  # Ajusta la ruta si lo cambias de lugar

logger = logging.getLogger(__name__)

User = get_user_model()


@api_view(['GET'])
def get_countries(request):
    countries = Country.objects.all().order_by('name')
    serializer = CountrySerializer(countries, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_regions(request):
    country_code = request.GET.get('country')
    regions = Region.objects.all()
    if country_code:
        regions = regions.filter(country__code2=country_code.upper())
    serializer = RegionSerializer(regions, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_subregions(request):
    region_id = request.GET.get('region')
    subregions = SubRegion.objects.all()
    if region_id:
        subregions = subregions.filter(region__id=region_id)
    serializer = SubRegionSerializer(subregions, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_cities(request):
    country_code = request.GET.get('country')
    region_id = request.GET.get('region')
    subregion_id = request.GET.get('subregion')

    cities = City.objects.all()
    if country_code:
        cities = cities.filter(country__code2=country_code.upper())
    if region_id:
        cities = cities.filter(region__id=region_id)
    if subregion_id:
        cities = cities.filter(subregion__id=subregion_id)

    serializer = CitySerializer(cities, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def refresh_token_custom_view(request):
    refresh_token = request.data.get("refresh")

    if not refresh_token:
        return Response({"error": "Falta el token refresh"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        refresh = RefreshToken(refresh_token)
        new_access = refresh.access_token

        # Copiar claims antiguos al nuevo access token
        for key in ['usuario', 'rol', 'tienda_id']:
            if key in refresh.payload:
                new_access[key] = refresh.payload[key]

        return Response({
            "access": str(new_access)
        }, status=status.HTTP_200_OK)

    except TokenError as e:
        return Response({"error": "Token inválido o expirado", "detalle": str(e)}, status=status.HTTP_401_UNAUTHORIZED)




# ---------------------- VALIDACION Y ACTIVACION DE CUENTA ----------------------
@csrf_exempt
def activar_tienda(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        payload = json.loads(request.body)
        token = payload.get('token')
        if not token:
            return JsonResponse({'error': 'Token requerido'}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)

    # Validar el token con Google
    resp = requests.get(f'https://oauth2.googleapis.com/tokeninfo?id_token={token}')
    if resp.status_code != 200:
        return JsonResponse({'error': 'Token inválido'}, status=401)
    user_info = resp.json()
    email = user_info.get('email')
    if not email:
        return JsonResponse({'error': 'Email no proporcionado'}, status=400)

    try:
        tienda = Tiendas.objects.get(correo_usuario=email)
        tienda.es_activo = True
        tienda.save()
        return JsonResponse({'mensaje': 'Cuenta activada correctamente'})
    except Tiendas.DoesNotExist:
        return JsonResponse({'error': 'Correo no valido'}, status=404)

# ---------------------- CREACIÓN DE TIENDAS ----------------------
@csrf_exempt
@api_view(['POST'])
def crear_tienda(request):
    print("🔍 Payload recibido del frontend:")
    print(request.data)

    serializer = TiendaSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    usuario_data = request.data.get('usuario_data', None)

    # ✅ Validación: asegúrate de que viene el usuario
    if not usuario_data or not usuario_data.get("usuario"):
        return Response(
            {"detail": "El campo 'usuario' es obligatorio en 'usuario_data'."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ✅ Validación: usuario único
    if Tiendas.objects.filter(usuario=usuario_data['usuario']).exists():
        return Response(
            {"detail": f"El usuario '{usuario_data['usuario']}' ya está registrado."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        tienda = serializer.save(usuario_data=usuario_data)

        dominio = Dominios.objects.filter(tienda=tienda).first()
        dominio_str = dominio.dominio if dominio else None

        return Response({
            'tienda': TiendaSerializer(tienda).data,
            'dominio': dominio_str,
        }, status=status.HTTP_201_CREATED)

    except ValidationError as e:
        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.exception("Error inesperado al crear tienda")
        return Response({'detail': 'Error interno del servidor.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    
# ------------------ TIPOS DE DOCUMENTO ------------------
class TipoDocumentoViewSet(viewsets.ModelViewSet):
    queryset = TipoDocumento.objects.all()
    serializer_class = TipoDocumentoSerializer



@api_view(["POST"])
def test_enviar_correo(request):
    email = request.data.get("email", "correo@ejemplo.com")
    asunto = request.data.get("asunto", "Prueba desde Django")
    html = request.data.get("html", "<h1>Hola desde Django y Mailjet</h1>")
    texto = request.data.get("texto", "Este es un mensaje de texto.")

    status, respuesta = enviar_correo_mailjet(email, asunto, html, texto)

    return Response({
        "status": status,
        "respuesta": respuesta
    })
