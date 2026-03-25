# main_dashboard/views_proveedores.py
"""
Vistas para gestionar el módulo de Proveedores
"""
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from django.utils import timezone
from django.conf import settings
from django.db.models import Q, Sum, Avg, Count, F, FloatField
from django.db.models.functions import Round
import logging
import os
import requests
from urllib.parse import urljoin, urlparse

logger = logging.getLogger(__name__)


def extraer_logo_desde_sitio_web(sitio_web):
    """
    Extrae la URL del logo/favicon desde la página web del proveedor.
    Busca en este orden:
    1. apple-touch-icon
    2. favicon con tamaños grandes
    3. Open Graph image
    4. favicon estándar
    """
    if not sitio_web:
        return None

    try:
        # Asegurar que la URL tenga protocolo
        if not sitio_web.startswith(('http://', 'https://')):
            sitio_web = 'https://' + sitio_web

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

        response = requests.get(sitio_web, headers=headers, timeout=10, allow_redirects=True)
        if response.status_code != 200:
            logger.warning(f"No se pudo acceder a {sitio_web}: status {response.status_code}")
            return None

        html = response.text
        parsed_url = urlparse(sitio_web)
        base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"

        # Buscar diferentes tipos de iconos en orden de prioridad
        iconos_encontrados = []

        # 1. Buscar apple-touch-icon (usualmente es el logo de mejor calidad)
        import re
        apple_touch_icon = re.search(r'<link[^>]+rel=["\']apple-touch-icon["\'][^>]*href=["\']([^"\']+)["\']', html, re.IGNORECASE)
        if apple_touch_icon:
            iconos_encontrados.append(('apple-touch-icon', apple_touch_icon.group(1)))

        # 2. Buscar favicon con tamaño grande (preferiblemente 192x192 o mayor)
        favicon_large = re.search(r'<link[^>]+rel=["\'](?:shortcut )?icon["\'][^>]*sizes=["\'][^"\']*192[^"\']*["\'][^>]*href=["\']([^"\']+)["\']', html, re.IGNORECASE)
        if favicon_large:
            iconos_encontrados.append(('favicon-large', favicon_large.group(1)))

        # 3. Buscar Open Graph image
        og_image = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', html, re.IGNORECASE)
        if og_image:
            iconos_encontrados.append(('og:image', og_image.group(1)))

        # 4. Buscar favicon estándar
        favicon = re.search(r'<link[^>]+rel=["\'](?:shortcut )?icon["\'][^>]*href=["\']([^"\']+)["\']', html, re.IGNORECASE)
        if favicon:
            iconos_encontrados.append(('favicon', favicon.group(1)))

        if not iconos_encontrados:
            logger.info(f"No se encontraron iconos en {sitio_web}")
            return None

        # Usar el primer icono encontrado (prioridad por orden de búsqueda)
        logo_url = iconos_encontrados[0][1]

        # Convertir URL relativa a absoluta
        if logo_url.startswith('//'):
            logo_url = f"{parsed_url.scheme}:{logo_url}"
        elif not logo_url.startswith(('http://', 'https://')):
            logo_url = urljoin(base_url, logo_url)

        logger.info(f"Logo encontrado para {sitio_web}: {logo_url} (tipo: {iconos_encontrados[0][0]})")

        return logo_url

    except requests.RequestException as e:
        logger.warning(f"Error al acceder a {sitio_web}: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Error inesperado al extraer logo de {sitio_web}: {str(e)}", exc_info=True)
        return None


def _get_tenant_alias(request):
    """Helper para obtener el alias de BD del tenant."""
    from nova.models import Dominios, Tiendas
    from nova.utils.db import conectar_db_tienda
    from django.conf import settings

    subdom = request.data.get('subdominio') or request.query_params.get('subdominio')
    if not subdom:
        host = request.get_host().split(':')[0]
        subdom = host.split('.')[0].lower()

    logger.info(f"Buscando tenant para subdominio: '{subdom}'")

    # Intentar buscar por coincidencia exacta primero
    dominio_obj = Dominios.objects.filter(dominio=subdom).select_related('tienda').first()

    # Si no encuentra, intentar por contains (por si tiene http:// o www)
    if not dominio_obj:
        dominio_obj = Dominios.objects.filter(dominio__icontains=subdom).select_related('tienda').first()

    if not dominio_obj:
        # Fallback para desarrollo: usar la primera tienda disponible
        todos_dominios = list(Dominios.objects.values_list('dominio', flat=True))
        logger.warning(f"No se encontró dominio para subdominio '{subdom}'. Dominios disponibles: {todos_dominios}")

        # En desarrollo, usar la primera tienda disponible como fallback
        if settings.DEBUG:
            primera_tienda = Tiendas.objects.first()
            if primera_tienda:
                logger.warning(f"Modo DEBUG: Usando tienda fallback ID {primera_tienda.id} ({primera_tienda.nombre})")
                alias = str(primera_tienda.id)
                conectar_db_tienda(alias, primera_tienda)
                return alias

        # En producción, lanzar error
        logger.error(f"No se encontró dominio para subdominio '{subdom}' y no hay fallback disponible")
        raise ValueError(f'Dominio no válido para subdominio: {subdom}. Dominios disponibles: {todos_dominios}')

    tienda = dominio_obj.tienda
    alias = str(tienda.id)
    conectar_db_tienda(alias, tienda)

    logger.info(f"Tenant encontrado: {alias} (dominio: {dominio_obj.dominio})")
    return alias


# ============================================================================
# PROVEEDORES - CRUD BÁSICO
# ============================================================================

@api_view(['GET', 'POST'])
def proveedores_list(request):
    try:
        logger.info(f"=== PROVEEDORES_LIST ===")
        logger.info(f"Method: {request.method}")
        logger.info(f"Request data: {dict(request.data)}")
        logger.info(f"Request GET params: {dict(request.query_params)}")

        alias = _get_tenant_alias(request)
        logger.info(f"PASO 1 - alias obtenido: {alias}")

        from .models import Proveedor
        logger.info(f"PASO 2 - modelo Proveedor importado")

        es_creacion = (request.method == 'POST' and
                       request.data.get('nit') and
                       request.data.get('razon_social'))
        logger.info(f"PASO 3 - es_creacion: {es_creacion}")

        if request.method == 'GET' or (request.method == 'POST' and not es_creacion):

            buscar = request.query_params.get('buscar', '')
            estado_filtro = request.query_params.get('estado', '')
            solo_calificados = request.query_params.get('solo_calificados', 'false').lower() == 'true'
            ordenar_por = request.query_params.get('ordenar_por', 'razon_social')
            logger.info(f"PASO 4 - filtros obtenidos")

            try:
                queryset = list(Proveedor.objects.using(alias).all())
                logger.info(f"PASO 5 - query OK, total proveedores: {len(queryset)}")
            except Exception as e:
                logger.error(f"PASO 5 - query FALLÓ: {e}", exc_info=True)
                return Response({'success': True, 'data': [], 'total': 0}, status=status.HTTP_200_OK)

            # Aplicar filtros en memoria ya que evaluamos el queryset
            if buscar:
                queryset = [p for p in queryset if
                    buscar.lower() in (p.razon_social or '').lower() or
                    buscar.lower() in (p.nombre_comercial or '').lower() or
                    buscar.lower() in (p.nit or '').lower() or
                    buscar.lower() in (p.contacto_principal or '').lower()
                ]

            if estado_filtro:
                queryset = [p for p in queryset if p.estado == estado_filtro]

            if solo_calificados:
                queryset = [p for p in queryset if p.calificacion_promedio and p.calificacion_promedio > 0]

            # Ordenar
            if ordenar_por == 'calificacion':
                queryset = sorted(queryset, key=lambda p: (-(p.calificacion_promedio or 0), p.razon_social or ''))
            elif ordenar_por == 'mas_reciente':
                queryset = sorted(queryset, key=lambda p: p.creado_en, reverse=True)
            else:
                queryset = sorted(queryset, key=lambda p: getattr(p, 'razon_social', '') or '')

            logger.info(f"PASO 6 - filtros aplicados, total: {len(queryset)}")

            data = []
            for prov in queryset:
                total_productos = 0
                total_pedidos = 0

                try:
                    total_compras = float(prov.get_total_compras(alias=alias))
                except Exception as e:
                    logger.warning(f"get_total_compras falló para proveedor {prov.id}: {e}")
                    total_compras = 0

                # Extraer logo automáticamente si el proveedor tiene sitio web pero no logo
                logo_url = prov.logo_url
                if prov.sitio_web and not prov.logo_url:
                    try:
                        logger.info(f"Extrayendo logo automáticamente para proveedor {prov.id}: {prov.razon_social}")
                        logo_url = extraer_logo_desde_sitio_web(prov.sitio_web)
                        if logo_url:
                            # Actualizar el proveedor en segundo plano
                            prov.logo_url = logo_url
                            prov.save(using=alias)
                            logger.info(f"Logo extraído y guardado para proveedor {prov.id}")
                    except Exception as e:
                        logger.warning(f"No se pudo extraer logo para {prov.razon_social}: {str(e)}")

                data.append({
                    'id': prov.id,
                    'nit': prov.nit,
                    'razon_social': prov.razon_social,
                    'nombre_comercial': prov.nombre_comercial,
                    'direccion': prov.direccion,
                    'ciudad': prov.ciudad,
                    'correo_electronico': prov.correo_electronico,
                    'telefono': prov.telefono,
                    'telefono_whatsapp': prov.telefono_whatsapp,
                    'contacto_principal': prov.contacto_principal,
                    'cargo_contacto': prov.cargo_contacto,
                    'sitio_web': prov.sitio_web,
                    'logo_url': logo_url,
                    'plazo_pago_dias': prov.plazo_pago_dias,
                    'descuento_comercial': float(prov.descuento_comercial) if prov.descuento_comercial else 0,
                    'limite_credito': float(prov.limite_credito) if prov.limite_credito else 0,
                    'estado': prov.estado,
                    'calificacion_promedio': float(prov.calificacion_promedio) if prov.calificacion_promedio else 0,
                    'numero_calificaciones': prov.numero_calificaciones,
                    'observaciones': prov.observaciones,
                    'total_productos': total_productos,
                    'total_pedidos': total_pedidos,
                    'total_compras': total_compras,
                    'creado_en': prov.creado_en.isoformat(),
                    'actualizado_en': prov.actualizado_en.isoformat(),
                })

            logger.info(f"PASO 7 - serialización OK, enviando {len(data)} proveedores")

            return Response({
                'success': True,
                'data': data,
                'total': len(data)
            }, status=status.HTTP_200_OK)

        elif es_creacion:
            # Crear nuevo proveedor
            data = request.data

            if Proveedor.objects.using(alias).filter(nit=data.get('nit')).exists():
                return Response({
                    'success': False,
                    'message': 'Ya existe un proveedor con este NIT'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Extraer logo automáticamente si se proporciona sitio web
            logo_url = data.get('logo_url')
            sitio_web = data.get('sitio_web')
            if sitio_web and not logo_url:
                logger.info(f"Extrayendo logo desde sitio web: {sitio_web}")
                logo_url = extraer_logo_desde_sitio_web(sitio_web)
                if logo_url:
                    logger.info(f"Logo extraído exitosamente: {logo_url}")

            proveedor = Proveedor.objects.using(alias).create(
                nit=data.get('nit'),
                razon_social=data.get('razon_social'),
                nombre_comercial=data.get('nombre_comercial'),
                direccion=data.get('direccion'),
                ciudad=data.get('ciudad'),
                pais=data.get('pais', 'Colombia'),
                correo_electronico=data.get('correo_electronico'),
                telefono=data.get('telefono'),
                telefono_whatsapp=data.get('telefono_whatsapp'),
                contacto_principal=data.get('contacto_principal'),
                cargo_contacto=data.get('cargo_contacto'),
                sitio_web=sitio_web,
                logo_url=logo_url,
                plazo_pago_dias=data.get('plazo_pago_dias'),
                descuento_comercial=data.get('descuento_comercial', 0),
                limite_credito=data.get('limite_credito', 0),
                observaciones=data.get('observaciones'),
                creado_por=None,
            )

            logger.info(f"Proveedor creado: {proveedor.id} - {proveedor.razon_social}")

            return Response({
                'success': True,
                'message': 'Proveedor creado exitosamente',
                'data': {
                    'id': proveedor.id,
                    'nit': proveedor.nit,
                    'razon_social': proveedor.razon_social,
                }
            }, status=status.HTTP_201_CREATED)

    except ValueError as e:
        logger.error(f"Error de validación en proveedores_list: {str(e)}")
        return Response({
            'success': False,
            'message': str(e),
            'error_type': 'ValueError'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error en proveedores_list: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': f'Error al procesar la solicitud: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PUT', 'DELETE'])
def proveedor_detalle(request, proveedor_id):
    """
    GET: Obtiene detalles de un proveedor específico
    PUT: Actualiza un proveedor
    DELETE: Elimina (desactiva) un proveedor

    URL: /api/proveedores/{proveedor_id}/
    """
    try:
        alias = _get_tenant_alias(request)
        from .models import Proveedor

        proveedor = Proveedor.objects.using(alias).get(id=proveedor_id)

        if request.method == 'GET':
            # Obtener detalles completos del proveedor
            return Response({
                'success': True,
                'data': {
                    'id': proveedor.id,
                    'nit': proveedor.nit,
                    'razon_social': proveedor.razon_social,
                    'nombre_comercial': proveedor.nombre_comercial,
                    'direccion': proveedor.direccion,
                    'ciudad': proveedor.ciudad,
                    'pais': proveedor.pais,
                    'correo_electronico': proveedor.correo_electronico,
                    'telefono': proveedor.telefono,
                    'telefono_whatsapp': proveedor.telefono_whatsapp,
                    'contacto_principal': proveedor.contacto_principal,
                    'cargo_contacto': proveedor.cargo_contacto,
                    'sitio_web': proveedor.sitio_web,
                    'logo_url': proveedor.logo_url,
                    'plazo_pago_dias': proveedor.plazo_pago_dias,
                    'descuento_comercial': float(proveedor.descuento_comercial) if proveedor.descuento_comercial else 0,
                    'limite_credito': float(proveedor.limite_credito) if proveedor.limite_credito else 0,
                    'estado': proveedor.estado,
                    'calificacion_promedio': float(proveedor.calificacion_promedio) if proveedor.calificacion_promedio else 0,
                    'numero_calificaciones': proveedor.numero_calificaciones,
                    'observaciones': proveedor.observaciones,
                    # TEMPORAL: Comentado hasta que se creen los modelos relacionados
                    # 'total_productos': proveedor.productos.using(alias).count() if proveedor.pk else 0,
                    # 'total_contactos': proveedor.contactos.using(alias).count() if proveedor.pk else 0,
                    # 'total_pedidos': proveedor.pedidos.using(alias).count() if proveedor.pk else 0,
                    # 'total_documentos': proveedor.documentos.using(alias).count() if proveedor.pk else 0,
                    'total_productos': 0,  # Temporal
                    'total_contactos': 0,  # Temporal
                    'total_pedidos': 0,  # Temporal
                    'total_documentos': 0,  # Temporal
                    'total_compras': float(proveedor.get_total_compras(alias=alias)),
                    'ultimo_pedido': proveedor.get_ultimo_pedido(alias=alias).isoformat() if proveedor.get_ultimo_pedido(alias=alias) else None,
                    'creado_en': proveedor.creado_en.isoformat(),
                    'actualizado_en': proveedor.actualizado_en.isoformat(),
                }
            }, status=status.HTTP_200_OK)

        elif request.method == 'PUT':
            # Actualizar proveedor
            data = request.data

            # Logging para debugging
            logger.info(f"Datos recibidos para actualizar: {data}")

            # Extraer logo automáticamente si se actualiza el sitio web y no hay logo_url
            logo_url = data.get('logo_url')
            sitio_web = data.get('sitio_web')

            # Si se actualiza el sitio web y no hay logo_url proporcionado, extraer logo
            if sitio_web and sitio_web != proveedor.sitio_web and not logo_url:
                logger.info(f"Sitio web actualizado, extrayendo logo desde: {sitio_web}")
                logo_url = extraer_logo_desde_sitio_web(sitio_web)
                if logo_url:
                    logger.info(f"Logo extraído exitosamente: {logo_url}")
                    data['logo_url'] = logo_url
            # Si no hay logo pero sí hay sitio web y el proveedor no tiene logo, extraer
            elif sitio_web and not proveedor.logo_url and not logo_url:
                logger.info(f"Proveedor sin logo, extrayendo desde: {sitio_web}")
                logo_url = extraer_logo_desde_sitio_web(sitio_web)
                if logo_url:
                    logger.info(f"Logo extraído exitosamente: {logo_url}")
                    data['logo_url'] = logo_url

            # Campos actualizables
            campos_actualizables = [
                'razon_social', 'nombre_comercial', 'direccion', 'ciudad', 'pais',
                'correo_electronico', 'telefono', 'telefono_whatsapp',
                'contacto_principal', 'cargo_contacto', 'sitio_web', 'logo_url',
                'plazo_pago_dias', 'descuento_comercial', 'limite_credito',
                'estado', 'observaciones'
            ]

            for campo in campos_actualizables:
                if campo in data:
                    setattr(proveedor, campo, data[campo])
                    logger.info(f"Campo {campo} actualizado a: {data[campo]}")

            proveedor.save(using=alias)

            logger.info(f"Proveedor actualizado: {proveedor.id} - {proveedor.razon_social}")

            return Response({
                'success': True,
                'message': 'Proveedor actualizado exitosamente',
                'data': {
                    'id': proveedor.id,
                    'razon_social': proveedor.razon_social,
                }
            }, status=status.HTTP_200_OK)

        elif request.method == 'DELETE':
            # Hard delete: eliminar completamente el proveedor
            razon_social = proveedor.razon_social
            proveedor_id = proveedor.id

            proveedor.delete(using=alias)

            logger.info(f"Proveedor eliminado: {proveedor_id} - {razon_social}")

            return Response({
                'success': True,
                'message': 'Proveedor eliminado exitosamente'
            }, status=status.HTTP_200_OK)

    except Proveedor.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Proveedor no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error en proveedor_detalle: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': f'Error al procesar la solicitud: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# PRODUCTOS DE PROVEEDOR
# ============================================================================

@api_view(['GET', 'POST'])
def proveedor_productos(request, proveedor_id):
    """
    GET: Lista productos de un proveedor
    POST: Agrega un producto a un proveedor

    URL: /api/proveedores/{proveedor_id}/productos/
    """
    try:
        alias = _get_tenant_alias(request)
        from .models import Proveedor, ProductoProveedor

        proveedor = Proveedor.objects.using(alias).get(id=proveedor_id)

        if request.method == 'GET':
            productos = ProductoProveedor.objects.using(alias).filter(proveedor=proveedor)

            data = []
            for prod in productos:
                data.append({
                    'id': prod.id,
                    'nombre_producto': prod.nombre_producto,
                    'codigo_producto': prod.codigo_producto,
                    'descripcion': prod.descripcion,
                    'precio_unitario': float(prod.precio_unitario),
                    'moneda': prod.moneda,
                    'tiempo_entrega_dias': prod.tiempo_entrega_dias,
                    'minimo_pedido': prod.minimo_pedido,
                    'disponible': prod.disponible,
                    'stock_actual': prod.stock_actual,
                    'categoria': prod.categoria,
                    'observaciones': prod.observaciones,
                    'creado_en': prod.creado_en.isoformat(),
                })

            return Response({
                'success': True,
                'data': data,
                'total': len(data)
            }, status=status.HTTP_200_OK)

        elif request.method == 'POST':
            # Crear nuevo producto
            data = request.data

            producto = ProductoProveedor.objects.using(alias).create(
                proveedor=proveedor,
                nombre_producto=data.get('nombre_producto'),
                codigo_producto=data.get('codigo_producto'),
                descripcion=data.get('descripcion'),
                precio_unitario=data.get('precio_unitario'),
                moneda=data.get('moneda', 'COP'),
                tiempo_entrega_dias=data.get('tiempo_entrega_dias'),
                minimo_pedido=data.get('minimo_pedido'),
                disponible=data.get('disponible', True),
                stock_actual=data.get('stock_actual'),
                categoria=data.get('categoria'),
                observaciones=data.get('observaciones'),
            )

            logger.info(f"Producto de proveedor creado: {producto.id}")

            return Response({
                'success': True,
                'message': 'Producto agregado exitosamente',
                'data': {
                    'id': producto.id,
                    'nombre_producto': producto.nombre_producto,
                }
            }, status=status.HTTP_201_CREATED)

    except Proveedor.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Proveedor no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error en proveedor_productos: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': f'Error al procesar la solicitud: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# CONTACTOS DE PROVEEDOR
# ============================================================================

@api_view(['GET', 'POST'])
def proveedor_contactos(request, proveedor_id):
    """
    GET: Lista contactos de un proveedor
    POST: Agrega un contacto a un proveedor

    URL: /api/proveedores/{proveedor_id}/contactos/
    """
    try:
        alias = _get_tenant_alias(request)
        from .models import Proveedor, ContactoProveedor

        proveedor = Proveedor.objects.using(alias).get(id=proveedor_id)

        if request.method == 'GET':
            contactos = ContactoProveedor.objects.using(alias).filter(
                proveedor=proveedor,
                activo=True
            )

            data = []
            for contacto in contactos:
                data.append({
                    'id': contacto.id,
                    'tipo_contacto': contacto.tipo_contacto,
                    'tipo_contacto_display': contacto.get_tipo_contacto_display(),
                    'nombre': contacto.nombre,
                    'cargo': contacto.cargo,
                    'correo_electronico': contacto.correo_electronico,
                    'telefono': contacto.telefono,
                    'telefono_whatsapp': contacto.telefono_whatsapp,
                    'extension': contacto.extension,
                    'horario_contacto': contacto.horario_contacto,
                    'notas': contacto.notas,
                    'principal': contacto.principal,
                    'creado_en': contacto.creado_en.isoformat(),
                })

            return Response({
                'success': True,
                'data': data,
                'total': len(data)
            }, status=status.HTTP_200_OK)

        elif request.method == 'POST':
            # Crear nuevo contacto
            data = request.data

            contacto = ContactoProveedor.objects.using(alias).create(
                proveedor=proveedor,
                tipo_contacto=data.get('tipo_contacto', 'ventas'),
                nombre=data.get('nombre'),
                cargo=data.get('cargo'),
                correo_electronico=data.get('correo_electronico'),
                telefono=data.get('telefono'),
                telefono_whatsapp=data.get('telefono_whatsapp'),
                extension=data.get('extension'),
                horario_contacto=data.get('horario_contacto'),
                notas=data.get('notas'),
                principal=data.get('principal', False),
            )

            logger.info(f"Contacto de proveedor creado: {contacto.id}")

            return Response({
                'success': True,
                'message': 'Contacto agregado exitosamente',
                'data': {
                    'id': contacto.id,
                    'nombre': contacto.nombre,
                }
            }, status=status.HTTP_201_CREATED)

    except Proveedor.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Proveedor no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error en proveedor_contactos: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': f'Error al procesar la solicitud: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# PEDIDOS A PROVEEDOR
# ============================================================================

@api_view(['GET', 'POST'])
def proveedor_pedidos(request, proveedor_id):
    """
    GET: Lista pedidos a un proveedor
    POST: Crea un nuevo pedido a un proveedor

    URL: /api/proveedores/{proveedor_id}/pedidos/

    Query params (GET):
    - estado: filtrar por estado
    - fecha_inicio: fecha inicial (YYYY-MM-DD)
    - fecha_fin: fecha final (YYYY-MM-DD)
    """
    try:
        alias = _get_tenant_alias(request)
        from .models import Proveedor, PedidoProveedor

        proveedor = Proveedor.objects.using(alias).get(id=proveedor_id)

        if request.method == 'GET':
            # Obtener parámetros de filtrado
            estado_filtro = request.query_params.get('estado', '')
            fecha_inicio = request.query_params.get('fecha_inicio', '')
            fecha_fin = request.query_params.get('fecha_fin', '')

            # Construir query
            pedidos = PedidoProveedor.objects.using(alias).filter(proveedor=proveedor)

            # Aplicar filtros
            if estado_filtro:
                pedidos = pedidos.filter(estado=estado_filtro)

            if fecha_inicio:
                pedidos = pedidos.filter(fecha_pedido__gte=fecha_inicio)

            if fecha_fin:
                pedidos = pedidos.filter(fecha_pedido__lte=fecha_fin)

            # Ordenar
            pedidos = pedidos.order_by('-fecha_pedido', '-creado_en')

            # Serializar resultados
            data = []
            for pedido in pedidos:
                data.append({
                    'id': pedido.id,
                    'numero_pedido': pedido.numero_pedido,
                    'fecha_pedido': pedido.fecha_pedido.isoformat(),
                    'fecha_entrega_estimada': pedido.fecha_entrega_estimada.isoformat() if pedido.fecha_entrega_estimada else None,
                    'fecha_entrega_real': pedido.fecha_entrega_real.isoformat() if pedido.fecha_entrega_real else None,
                    'monto_subtotal': float(pedido.monto_subtotal),
                    'monto_descuento': float(pedido.monto_descuento),
                    'monto_iva': float(pedido.monto_iva),
                    'monto_total': float(pedido.monto_total),
                    'estado': pedido.estado,
                    'estado_display': pedido.get_estado_display(),
                    'observaciones': pedido.observaciones,
                    'cantidad_detalles': pedido.detalles.count(),
                    'creado_en': pedido.creado_en.isoformat(),
                })

            return Response({
                'success': True,
                'data': data,
                'total': len(data),
                'total_monto': sum(float(p['monto_total']) for p in data)
            }, status=status.HTTP_200_OK)

        elif request.method == 'POST':
            # Crear nuevo pedido
            data = request.data

            # Generar número de pedido
            from django.utils import timezone
            import uuid
            numero_pedido = f"PED-{timezone.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"

            pedido = PedidoProveedor.objects.using(alias).create(
                proveedor=proveedor,
                numero_pedido=numero_pedido,
                fecha_pedido=data.get('fecha_pedido'),
                fecha_entrega_estimada=data.get('fecha_entrega_estimada'),
                monto_subtotal=data.get('monto_subtotal', 0),
                monto_descuento=data.get('monto_descuento', 0),
                monto_iva=data.get('monto_iva', 0),
                monto_total=data.get('monto_total', 0),
                estado=data.get('estado', 'borrador'),
                observaciones=data.get('observaciones'),
                notas_internas=data.get('notas_internas'),
                solicitado_por=request.user if request.user.is_authenticated else None,
            )

            logger.info(f"Pedido a proveedor creado: {pedido.id} - {pedido.numero_pedido}")

            return Response({
                'success': True,
                'message': 'Pedido creado exitosamente',
                'data': {
                    'id': pedido.id,
                    'numero_pedido': pedido.numero_pedido,
                }
            }, status=status.HTTP_201_CREATED)

    except Proveedor.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Proveedor no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error en proveedor_pedidos: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': f'Error al procesar la solicitud: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# DOCUMENTOS DE PROVEEDOR
# ============================================================================

@api_view(['GET', 'POST'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def proveedor_documentos(request, proveedor_id):
    """
    GET: Lista documentos de un proveedor
    POST: Sube un documento para un proveedor

    URL: /api/proveedores/{proveedor_id}/documentos/

    Body esperado (POST):
    - tipo_documento: contrato/certificado/factura/catalogo/cotizacion/otro
    - titulo: título del documento
    - descripcion: descripción opcional
    - archivo: archivo (multipart/form-data)
    - url_externa: URL externa si no se sube archivo
    - fecha_emision: fecha de emisión
    - fecha_vencimiento: fecha de vencimiento
    - generar_alerta_vencimiento: boolean
    - dias_alerta: días de anticipación
    """
    try:
        alias = _get_tenant_alias(request)
        from .models import Proveedor, DocumentoProveedor

        proveedor = Proveedor.objects.using(alias).get(id=proveedor_id)

        if request.method == 'GET':
            documentos = DocumentoProveedor.objects.using(alias).filter(proveedor=proveedor)

            data = []
            for doc in documentos:
                data.append({
                    'id': doc.id,
                    'tipo_documento': doc.tipo_documento,
                    'tipo_documento_display': doc.get_tipo_documento_display(),
                    'titulo': doc.titulo,
                    'descripcion': doc.descripcion,
                    'archivo': doc.archivo.url if doc.archivo else None,
                    'url_externa': doc.url_externa,
                    'fecha_emision': doc.fecha_emision.isoformat() if doc.fecha_emision else None,
                    'fecha_vencimiento': doc.fecha_vencimiento.isoformat() if doc.fecha_vencimiento else None,
                    'generar_alerta_vencimiento': doc.generar_alerta_vencimiento,
                    'dias_alerta': doc.dias_alerta,
                    'esta_proximo_a_vencer': doc.esta_proximo_a_vencer(),
                    'esta_vencido': doc.esta_vencido(),
                    'subido_por': doc.subido_por.id if doc.subido_por else None,
                    'creado_en': doc.creado_en.isoformat(),
                })

            return Response({
                'success': True,
                'data': data,
                'total': len(data)
            }, status=status.HTTP_200_OK)

        elif request.method == 'POST':
            # Crear nuevo documento
            data = request.data

            documento = DocumentoProveedor.objects.using(alias).create(
                proveedor=proveedor,
                tipo_documento=data.get('tipo_documento', 'otro'),
                titulo=data.get('titulo'),
                descripcion=data.get('descripcion'),
                archivo=data.get('archivo'),
                url_externa=data.get('url_externa'),
                fecha_emision=data.get('fecha_emision'),
                fecha_vencimiento=data.get('fecha_vencimiento'),
                generar_alerta_vencimiento=data.get('generar_alerta_vencimiento', False),
                dias_alerta=data.get('dias_alerta'),
                subido_por=request.user if request.user.is_authenticated else None,
            )

            logger.info(f"Documento de proveedor creado: {documento.id}")

            return Response({
                'success': True,
                'message': 'Documento subido exitosamente',
                'data': {
                    'id': documento.id,
                    'titulo': documento.titulo,
                    'archivo': documento.archivo.url if documento.archivo else None,
                }
            }, status=status.HTTP_201_CREATED)

    except Proveedor.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Proveedor no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error en proveedor_documentos: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': f'Error al procesar la solicitud: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# CALIFICACIONES DE PROVEEDOR
# ============================================================================

@api_view(['GET', 'POST'])
def proveedor_calificaciones(request, proveedor_id):
    """
    GET: Lista calificaciones de un proveedor
    POST: Agrega una calificación a un proveedor

    URL: /api/proveedores/{proveedor_id}/calificaciones/

    Body esperado (POST):
    {
        "categoria_evaluacion": "calidad/tiempos_entrega/servicio/precios/general",
        "calificacion": 5,
        "comentario": "Excelente proveedor",
        "puntos_fuertes": "Buena calidad",
        "puntos_a_mejorar": "Mejorar tiempos",
        "pedido_referencia": 123
    }
    """
    try:
        alias = _get_tenant_alias(request)
        from .models import Proveedor, CalificacionProveedor

        proveedor = Proveedor.objects.using(alias).get(id=proveedor_id)

        if request.method == 'GET':
            calificaciones = CalificacionProveedor.objects.using(alias).filter(
                proveedor=proveedor
            ).order_by('-fecha_evaluacion', '-creado_en')

            data = []
            for calif in calificaciones:
                data.append({
                    'id': calif.id,
                    'categoria_evaluacion': calif.categoria_evaluacion,
                    'categoria_evaluacion_display': calif.get_categoria_evaluacion_display(),
                    'calificacion': calif.calificacion,
                    'comentario': calif.comentario,
                    'puntos_fuertes': calif.puntos_fuertes,
                    'puntos_a_mejorar': calif.puntos_a_mejorar,
                    'pedido_referencia': calif.pedido_referencia,
                    'evaluado_por': calif.evaluado_por.id if calif.evaluado_por else None,
                    'fecha_evaluacion': calif.fecha_evaluacion.isoformat(),
                    'creado_en': calif.creado_en.isoformat(),
                })

            return Response({
                'success': True,
                'data': data,
                'total': len(data)
            }, status=status.HTTP_200_OK)

        elif request.method == 'POST':
            # Crear nueva calificación
            data = request.data

            from django.utils import timezone
            calificacion = CalificacionProveedor.objects.using(alias).create(
                proveedor=proveedor,
                categoria_evaluacion=data.get('categoria_evaluacion', 'general'),
                calificacion=data.get('calificacion'),
                comentario=data.get('comentario'),
                puntos_fuertes=data.get('puntos_fuertes'),
                puntos_a_mejorar=data.get('puntos_a_mejorar'),
                pedido_referencia_id=data.get('pedido_referencia'),
                evaluado_por=request.user if request.user.is_authenticated else None,
                fecha_evaluacion=data.get('fecha_evaluacion', timezone.now().date()),
            )

            logger.info(f"Calificación de proveedor creada: {calificacion.id}")

            return Response({
                'success': True,
                'message': 'Calificación agregada exitosamente',
                'data': {
                    'id': calificacion.id,
                    'calificacion': calificacion.calificacion,
                }
            }, status=status.HTTP_201_CREATED)

    except Proveedor.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Proveedor no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error en proveedor_calificaciones: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': f'Error al procesar la solicitud: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# REPORTES Y ESTADÍSTICAS
# ============================================================================

@api_view(['GET'])
def proveedores_reportes(request):
    """
    Genera reportes y estadísticas de proveedores

    Query params:
    - tipo: resumen/compras/calificaciones/alertas
    - proveedor_id: (opcional) ID de un proveedor específico

    Ejemplos:
    /api/proveedores/reportes/?tipo=resumen
    /api/proveedores/reportes/?tipo=compras&proveedor_id=123
    /api/proveedores/reportes/?tipo=calificaciones
    /api/proveedores/reportes/?tipo=alertas
    """
    try:
        alias = _get_tenant_alias(request)
        from .models import Proveedor, PedidoProveedor, CalificacionProveedor, DocumentoProveedor

        tipo_reporte = request.query_params.get('tipo', 'resumen')
        proveedor_id = request.query_params.get('proveedor_id')

        if tipo_reporte == 'resumen':
            # Reporte general de todos los proveedores
            proveedores = Proveedor.objects.using(alias).filter(estado='activo')

            total_proveedores = proveedores.count()
            total_con_calificacion = proveedores.filter(calificacion_promedio__gt=0).count()

            # Calcular estadísticas de calificación
            stats_calificacion = proveedores.filter(calificacion_promedio__gt=0).aggregate(
                promedio_general=Round(Avg('calificacion_promedio'), 2),
                maxima=Max('calificacion_promedio'),
                minima=Min('calificacion_promedio')
            )

            # Proveedores con mejores calificaciones
            top_proveedores = list(proveedores.filter(
                calificacion_promedio__gt=0
            ).order_by('-calificacion_promedio')[:10].values(
                'id', 'razon_social', 'calificacion_promedio', 'numero_calificaciones'
            ))

            # Proveedores con más compras
            from django.db.models.functions import Coalesce
            top_compras = list(proveedores.annotate(
                total_compras=Coalesce(Sum('pedidos__monto_total'), 0)
            ).order_by('-total_compras')[:10].values(
                'id', 'razon_social', 'total_compras'
            ))

            return Response({
                'success': True,
                'tipo': 'resumen',
                'data': {
                    'total_proveedores': total_proveedores,
                    'total_con_calificacion': total_con_calificacion,
                    'promedio_calificacion_general': float(stats_calificacion['promedio_general'] or 0),
                    'calificacion_maxima': float(stats_calificacion['maxima'] or 0),
                    'calificacion_minima': float(stats_calificacion['minima'] or 0),
                    'top_proveedores': top_proveedores,
                    'top_compras': top_compras,
                }
            }, status=status.HTTP_200_OK)

        elif tipo_reporte == 'compras':
            # Reporte de compras por proveedor
            if proveedor_id:
                pedidos = PedidoProveedor.objects.using(alias).filter(proveedor_id=proveedor_id)
            else:
                pedidos = PedidoProveedor.objects.using(alias).all()

            # Estadísticas generales
            stats = pedidos.aggregate(
                total_pedidos=Count('id'),
                monto_total=Sum('monto_total'),
                promedio_compra=Round(Avg('monto_total'), 2)
            )

            # Compras por mes (últimos 12 meses)
            from django.db.models.functions import TruncMonth
            compras_por_mes = list(pedidos.annotate(
                mes=TruncMonth('fecha_pedido')
            ).values('mes').annotate(
                total=Sum('monto_total'),
                cantidad=Count('id')
            ).order_by('-mes')[:12])

            return Response({
                'success': True,
                'tipo': 'compras',
                'data': {
                    'estadisticas': stats,
                    'compras_por_mes': compras_por_mes,
                }
            }, status=status.HTTP_200_OK)

        elif tipo_reporte == 'calificaciones':
            # Reporte de calificaciones
            if proveedor_id:
                calificaciones = CalificacionProveedor.objects.using(alias).filter(proveedor_id=proveedor_id)
            else:
                calificaciones = CalificacionProveedor.objects.using(alias).all()

            # Por categoría
            from django.db.models import Avg
            por_categoria = list(calificaciones.values('categoria_evaluacion').annotate(
                promedio=Round(Avg('calificacion'), 2),
                cantidad=Count('id')
            ).order_by('-promedio'))

            # Tendencia de calificaciones (últimas 10)
            ultimas_calificaciones = list(calificaciones.order_by('-fecha_evaluacion')[:10].values(
                'fecha_evaluacion', 'calificacion', 'categoria_evaluacion'
            ))

            return Response({
                'success': True,
                'tipo': 'calificaciones',
                'data': {
                    'por_categoria': por_categoria,
                    'ultimas_calificaciones': ultimas_calificaciones,
                }
            }, status=status.HTTP_200_OK)

        elif tipo_reporte == 'alertas':
            # Documentos próximos a vencer o vencidos
            documentos = DocumentoProveedor.objects.using(alias).filter(
                generar_alerta_vencimiento=True
            )

            # Documentos próximos a vencer
            proximos_vencer = [doc for doc in documentos if doc.esta_proximo_a_vencer()]

            # Documentos vencidos
            vencidos = [doc for doc in documentos if doc.esta_vencido()]

            return Response({
                'success': True,
                'tipo': 'alertas',
                'data': {
                    'documentos_proximos_a_vencer': len(proximos_vencer),
                    'documentos_vencidos': len(vencidos),
                    'proximos_a_vencer': [
                        {
                            'id': doc.id,
                            'titulo': doc.titulo,
                            'proveedor': doc.proveedor.razon_social,
                            'fecha_vencimiento': doc.fecha_vencimiento.isoformat(),
                        } for doc in proximos_vencer
                    ],
                    'vencidos': [
                        {
                            'id': doc.id,
                            'titulo': doc.titulo,
                            'proveedor': doc.proveedor.razon_social,
                            'fecha_vencimiento': doc.fecha_vencimiento.isoformat(),
                            'dias_vencido': (timezone.now().date() - doc.fecha_vencimiento).days
                        } for doc in vencidos
                    ],
                }
            }, status=status.HTTP_200_OK)

        else:
            return Response({
                'success': False,
                'message': 'Tipo de reporte no válido. Opciones: resumen, compras, calificaciones, alertas'
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.error(f"Error en proveedores_reportes: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': f'Error al generar reporte: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def proveedor_actualizar_logo(request, proveedor_id):
    """
    Actualiza el logo de un proveedor extrayéndolo desde su sitio web
    URL: /api/proveedores/{proveedor_id}/actualizar-logo/
    """
    try:
        alias = _get_tenant_alias(request)
        from .models import Proveedor

        proveedor = Proveedor.objects.using(alias).get(id=proveedor_id)

        if not proveedor.sitio_web:
            return Response({
                'success': False,
                'message': 'El proveedor no tiene un sitio web configurado'
            }, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"Extrayendo logo para proveedor {proveedor.id} desde {proveedor.sitio_web}")

        logo_url = extraer_logo_desde_sitio_web(proveedor.sitio_web)

        if logo_url:
            proveedor.logo_url = logo_url
            proveedor.save(using=alias)

            logger.info(f"Logo actualizado exitosamente para proveedor {proveedor.id}: {logo_url}")

            return Response({
                'success': True,
                'message': 'Logo actualizado exitosamente',
                'data': {
                    'logo_url': logo_url
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': 'No se pudo extraer el logo desde el sitio web'
            }, status=status.HTTP_400_BAD_REQUEST)

    except Proveedor.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Proveedor no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error en proveedor_actualizar_logo: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': f'Error al actualizar logo: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def actualizar_logos_proveedores(request):
    """
    Actualiza automáticamente los logos de todos los proveedores que tienen sitio web pero no logo
    URL: /api/proveedores/actualizar-logos/
    """
    try:
        alias = _get_tenant_alias(request)
        from .models import Proveedor

        # Buscar proveedores con sitio web pero sin logo
        proveedores_sin_logo = Proveedor.objects.using(alias).filter(
            sitio_web__isnull=False,
            sitio_web__ne='',
            logo_url__isnull=True
        ) | Proveedor.objects.using(alias).filter(
            sitio_web__isnull=False,
            sitio_web__ne='',
            logo_url=''
        )

        total = len(proveedores_sin_logo)
        actualizados = 0
        fallidos = 0

        logger.info(f"Actualizando logos para {total} proveedores")

        for proveedor in proveedores_sin_logo:
            try:
                logo_url = extraer_logo_desde_sitio_web(proveedor.sitio_web)
                if logo_url:
                    proveedor.logo_url = logo_url
                    proveedor.save(using=alias)
                    actualizados += 1
                    logger.info(f"Logo actualizado para proveedor {proveedor.id}: {proveedor.razon_social}")
                else:
                    fallidos += 1
                    logger.warning(f"No se pudo extraer logo para {proveedor.razon_social}")
            except Exception as e:
                fallidos += 1
                logger.error(f"Error actualizando logo para {proveedor.razon_social}: {str(e)}")

        return Response({
            'success': True,
            'message': f'Proceso completado. Actualizados: {actualizados}, Fallidos: {fallidos}',
            'data': {
                'total': total,
                'actualizados': actualizados,
                'fallidos': fallidos
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error en actualizar_logos_proveedores: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': f'Error al actualizar logos: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
