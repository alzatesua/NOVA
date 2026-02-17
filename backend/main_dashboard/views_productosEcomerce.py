# ------------------- API Productos -------------------
from django.apps import apps
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Prefetch
import logging
from nova.utils.db import conectar_db_tienda
from nova.models import Dominios
from django.conf import settings
from main_dashboard.models import Producto

logger = logging.getLogger(__name__)


class SubdomainMixin:
    """
    Mixin para resolver multi-tenancy SOLO por subdominio.
    No requiere autenticación de usuario/token.
    Flujo:
    1. Extrae subdominio del Host o querystring
    2. Busca en tabla Dominios
    3. Obtiene tienda y credenciales BD
    4. Conecta dinámicamente a esa BD
    5. Retorna alias para usar en queries
    """
    permission_classes = []  # Sin autenticación requerida
    db_alias = None
    _tenant_tienda = None

    def _resolve_alias(self, request):
        """Resuelve el alias de BD usando solo el subdominio"""
        if self.db_alias:
            return self.db_alias

        # 1. Obtener subdominio (de querystring o del Host)
        subdom = request.data.get('subdominio') or request.query_params.get('subdominio')

        if not subdom:
            # Extraer del Host HTTP (ej: midominio.com -> subdominio.midominio.com)
            host = request.get_host().split(':')[0]
            partes = host.split('.')

            # Si tiene subdominio (ej: tienda-abc.midominio.com)
            if len(partes) > 2:
                subdom = partes[0].lower()
            else:
                # Si es dominio principal, busca el dominio principal en BD
                subdom = host.lower()

        if not subdom:
            raise ValueError('No se pudo determinar el subdominio desde el request.')

        # 2. Buscar en tabla Dominios
        try:
            dominio_obj = Dominios.objects.using('default').filter(
                dominio__iexact=subdom
            ).select_related('tienda').first()

            if not dominio_obj:
                raise ValueError(f'Subdominio "{subdom}" no encontrado en tabla Dominios.')

        except Exception as e:
            raise ValueError(f'Error al buscar subdominio: {str(e)}')

        # 3. Obtener tienda con credenciales
        tienda = dominio_obj.tienda

        # 4. Crear alias y conectar a BD
        alias = str(tienda.id)
        try:
            conectar_db_tienda(alias, tienda)
        except Exception as e:
            raise ValueError(f'Error al conectar a la base de datos: {str(e)}')

        # 5. Guardar estado y retornar alias
        self.db_alias = alias
        self._tenant_tienda = tienda

        logger.info(f"✅ SubdomainMixin: Conectado a BD '{tienda.db_nombre}' (alias: {alias}) via subdominio '{subdom}'")

        return self.db_alias


class ProductoView(SubdomainMixin, APIView):
    """
    Retorna todos los productos con su ficha técnica
    POST /api/productos/list/
    """

    def post(self, request):
        # Usar el método del mixin para resolver el alias y conectar la BD
        try:
            alias = self._resolve_alias(request)
        except Exception as e:
            return Response(
                {"ok": False, "detail": str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            productos_qs = (
                Producto.objects.using(alias)
                .select_related(
                    'categoria_id',
                    'marca_id',
                    'tipo_medida',
                    'iva_id',
                    'descuento'
                )
            )
        except Exception as e:
            return Response(
                {"ok": False, "detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = []
        for producto in productos_qs:
            data.append({
                "id": producto.id,
                "sku": producto.sku,
                "nombre": producto.nombre,
                "descripcion": producto.descripcion,
                "precio": str(producto.precio),
                "stock": producto.stock,
                "estado": "Disponible" if producto.stock > 0 else "Agotado",

                # Relaciones ForeignKey
                "categoria": {
                    "id": producto.categoria_id.id_categoria if producto.categoria_id else None,
                    "nombre": producto.categoria_id.nombre if producto.categoria_id else None,
                } if producto.categoria_id else None,

                "marca": {
                    "id": producto.marca_id.id_marca if producto.marca_id else None,
                    "nombre": producto.marca_id.nombre if producto.marca_id else None,
                } if producto.marca_id else None,

                "tipo_medida": {
                    "id": producto.tipo_medida.id_tipo_medida if producto.tipo_medida else None,
                    "nombre": producto.tipo_medida.nombre if producto.tipo_medida else None,
                } if producto.tipo_medida else None,

                "iva": {
                    "id": producto.iva_id.id_iva if producto.iva_id else None,
                    "porcentaje": str(producto.iva_id.porcentaje) if producto.iva_id else None,
                } if producto.iva_id else None,

                "descuento": {
                    "id": producto.descuento.id_descuento if producto.descuento else None,
                    "porcentaje": str(producto.descuento.porcentaje) if producto.descuento else None,
                } if producto.descuento else None,

                # Campos adicionales
                "codigo_barras": producto.codigo_barras,
                "imei": producto.imei,
                "imagen_producto": producto.imagen_producto,
                "atributo": producto.atributo,
                "valor_atributo": producto.valor_atributo,
                "creado_en": producto.creado_en,
            })

        logger.info(f"Productos finales en respuesta: {len(data)}")

        return Response({
            "ok": True,
            "mensaje": "Listado de productos con ficha técnica",
            "total_productos": len(data),
            "data": data
        }, status=status.HTTP_200_OK)