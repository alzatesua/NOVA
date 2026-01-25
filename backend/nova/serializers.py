from rest_framework import serializers
from .models import Direccion, Tiendas, Dominios, TipoDocumento, Documento, LoginUsuario
from django.contrib.auth.hashers import make_password
from django.db import IntegrityError
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from nova.services.db_creator import crear_db
from rest_framework import viewsets
from rest_framework import filters
from cities_light.models import Country, Region, SubRegion, City

class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ['id', 'name', 'code2']

class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ['id', 'name', 'country']

class SubRegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubRegion
        fields = ['id', 'name', 'region']

class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = ['id', 'name', 'region', 'subregion', 'country']


class DireccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Direccion
        fields = ['calle_numero', 'ciudad_estado', 'codigo_postal', 'pais']


class DominioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dominios
        fields = ['id', 'tienda', 'dominio', 'es_principal', 'creado_en']
        read_only_fields = ['id', 'creado_en']

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginUsuario
        fields = ['usuario', 'password', 'correo_usuario', 'tienda', 'rol']
        extra_kwargs = {
            'password': {'write_only': True},
            'tienda':   {'required': False},
            'usuario':  {'validators': []},
            'rol':      {'required': False},
        }

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)



class TipoDocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoDocumento
        fields = ['id', 'nombre']





class DocumentoSerializer(serializers.ModelSerializer):
    tipo_id = serializers.PrimaryKeyRelatedField(
        queryset=TipoDocumento.objects.all(), source='tipo', write_only=True
    )
    tipo = TipoDocumentoSerializer(read_only=True)

    class Meta:
        model = Documento
        fields = ['tipo_id', 'tipo', 'documento']

    def create(self, validated_data):
        tienda = self.context.get('tienda')
        if not tienda:
            raise serializers.ValidationError("La tienda no fue proporcionada en el contexto.")
        return Documento.objects.create(tienda=tienda, **validated_data)


class TiendaSerializer(serializers.ModelSerializer):
    direccion = DireccionSerializer()
    usuario_data = UsuarioSerializer(write_only=True)
    documento_data = serializers.DictField(write_only=True, required=False)  # ✅ cambio aquí
    email = serializers.EmailField(write_only=True, required=False)
    es_activo = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = Tiendas
        fields = [
            'id', 'nombre_tienda', 'nit', 'db_nombre', 'db_usuario', 'db_password',
            'nombre_completo', 'telefono', 'direccion', 'nombre_propietario',
            'usuario_data', 'documento_data', 'email', 'es_activo', 'creado_en'
        ]
        read_only_fields = ['id', 'creado_en']

    def validate_email(self, value):
        if Tiendas.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este email ya está registrado.")
        return value
    
    def create(self, validated_data):
        direccion_data = validated_data.pop('direccion')
        usuario_data = validated_data.pop('usuario_data')
        documento_data = validated_data.pop('documento_data', None)

        print("🧾 documento_data recibido:", documento_data)

        # Crear dirección
        direccion = Direccion.objects.create(**direccion_data)

        # Crear tienda
        tienda = Tiendas(direccion=direccion, **validated_data)
        tienda.save(usuario_data=usuario_data)

        # Crear documento, si fue enviado
        if documento_data:
            documento_serializer = DocumentoSerializer(
                data=documento_data,
                context={'tienda': tienda}
            )
            documento_serializer.is_valid(raise_exception=True)
            documento = documento_serializer.save()
            tienda.documento = documento
            tienda.save()

        # Crear dominio principal
        Dominios.objects.create(tienda=tienda, es_principal=True)

        return tienda


class LoginSerializer(serializers.Serializer):
    correo_usuario = serializers.EmailField()
    password       = serializers.CharField(write_only=True)
    subdominio     = serializers.CharField(max_length=100, write_only=True, required=False
)


class pedir_cambio_contrasena_serializer(serializers.Serializer):
    correo_usuario = serializers.EmailField()


class Proveedor_Serializer(serializers.Serializer):
    razon_social         = serializers.CharField()
    correo               = serializers.EmailField()
    telefono             = serializers.IntegerField()
    direccion            = serializers.CharField()
    n_registro_mercantil = serializers.CharField()
    nit                  = serializers.IntegerField()





class CustomTokenObtainPairSerializer(serializers.Serializer):
    correo_usuario = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        correo = attrs.get('correo_usuario')
        password = attrs.get('password')

        try:
            user = LoginUsuario.objects.get(correo_usuario=correo)
        except LoginUsuario.DoesNotExist:
            raise serializers.ValidationError("Usuario no encontrado")

        if not user.check_password(password):
            raise serializers.ValidationError("Contraseña incorrecta")

        refresh = RefreshToken.for_user(user)

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'usuario_id': user.id,
            'rol': 'admin' if user.is_admin else 'usuario',
        }
