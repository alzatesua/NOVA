"""
Vistas para el módulo de contactos del e-commerce.
API pública para recibir mensajes del formulario de contacto.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.db import transaction
import logging

from .models import Contacto
from .serializers import ContactoCreateSerializer
from nova.models import Dominios
from nova.utils.db import conectar_db_tienda
from nova.utils.email import enviar_correo_mailjet

logger = logging.getLogger(__name__)


class ContactoPublicView(APIView):
    """
    API pública para recibir contactos desde el formulario web.

    POST /api/contacto/enviar/

    Body:
        - nombre_completo: Nombre del contacto (requerido)
        - email: Email del contacto (requerido)
        - mensaje: Mensaje del contacto (requerido)
        - subdominio: Subdominio de la tienda (requerido)

    No requiere autenticación. Solo valida el subdominio del tenant.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            # 1. Resolver tenant por subdominio
            subdom = request.data.get('subdominio') or request.query_params.get('subdominio')

            if not subdom:
                return Response({
                    'detail': 'El parámetro subdominio es requerido.'
                }, status=status.HTTP_400_BAD_REQUEST)

            host = request.get_host().split(':')[0]
            subdominio = subdom if subdom else host.split('.')[0].lower()

            dominio_obj = Dominios.objects.filter(
                dominio__icontains=subdominio
            ).select_related('tienda').first()

            if not dominio_obj or not dominio_obj.tienda:
                return Response({
                    'detail': 'Dominio no válido.'
                }, status=status.HTTP_401_UNAUTHORIZED)

            tienda = dominio_obj.tienda
            alias = str(tienda.id)
            conectar_db_tienda(alias, tienda)

            logger.info(f'[CONTACTO] Procesando para tienda: {tienda.nombre_tienda}')

        except Exception as e:
            logger.error(f'[CONTACTO] Error resolviendo tenant: {e}')
            return Response({
                'detail': f'Error al identificar la tienda: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

        # 2. Validar datos del formulario
        serializer = ContactoCreateSerializer(
            data=request.data,
            context={'db_alias': alias}
        )

        if not serializer.is_valid():
            logger.warning(f'[CONTACTO] Datos inválidos: {serializer.errors}')
            return Response({
                'detail': 'Datos inválidos',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic(using=alias):
                # 3. Guardar contacto con metadata
                validated_data = serializer.validated_data.copy()
                validated_data['subdominio'] = subdominio
                validated_data['tienda_id'] = tienda.id
                validated_data['ip_cliente'] = self._get_client_ip(request)
                validated_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')[:500]
                validated_data['origen_referer'] = request.META.get('HTTP_REFERER', '')[:500]

                contacto = Contacto.objects.using(alias).create(**validated_data)
                logger.info(f'[CONTACTO] Mensaje guardado (ID: {contacto.id})')

                # 4. Enviar email (no bloqueante)
                self._enviar_notificacion_email(contacto, tienda)

                return Response({
                    'message': 'Mensaje enviado exitosamente',
                    'contacto_id': contacto.id
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f'[CONTACTO] Error guardando: {e}', exc_info=True)
            return Response({
                'detail': 'Error al procesar el mensaje.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')

    def _enviar_notificacion_email(self, contacto, tienda):
        """Envía email de notificación. Maneja errores silenciosamente."""
        try:
            asunto = f'Nuevo contacto desde {tienda.nombre_tienda}: {contacto.nombre_completo}'

            mensaje_html = f'''
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }}
                    .field {{ margin-bottom: 15px; }}
                    .label {{ font-weight: bold; color: #667eea; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>🔔 Nuevo Mensaje de Contacto</h2>
                        <p>Tienda: {tienda.nombre_tienda}</p>
                    </div>
                    <div class="content">
                        <div class="field">
                            <span class="label">Nombre:</span>
                            <span>{contacto.nombre_completo}</span>
                        </div>
                        <div class="field">
                            <span class="label">Email:</span>
                            <span>{contacto.email}</span>
                        </div>
                        <div class="field">
                            <span class="label">Fecha:</span>
                            <span>{contacto.creado_en.strftime("%Y-%m-%d %H:%M:%S")}</span>
                        </div>
                        <div class="field">
                            <span class="label">IP:</span>
                            <span>{contacto.ip_cliente}</span>
                        </div>
                        <div class="field">
                            <span class="label">Mensaje:</span>
                            <p style="background: white; padding: 10px; border-left: 3px solid #667eea;">
                                {contacto.mensaje.replace(chr(10), '<br>')}
                            </p>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
                        <p>ID: {contacto.id} | Tienda ID: {tienda.id}</p>
                    </div>
                </div>
            </body>
            </html>
            '''

            mensaje_texto = f'''
            NUEVO CONTACTO - {tienda.nombre_tienda}
            {'='*50}
            Nombre: {contacto.nombre_completo}
            Email: {contacto.email}
            Fecha: {contacto.creado_en.strftime("%Y-%m-%d %H:%M:%S")}
            IP: {contacto.ip_cliente}

            Mensaje:
            {contacto.mensaje}

            {'='*50}
            ID: {contacto.id}
            '''

            status_code, result = enviar_correo_mailjet(
                destinatario='zuletajonathan18@gmail.com',
                asunto=asunto,
                mensaje_html=mensaje_html,
                mensaje_texto=mensaje_texto
            )

            if status_code in [200, 201]:
                logger.info(f'[CONTACTO] Email enviado (ID: {contacto.id})')
            else:
                logger.warning(f'[CONTACTO] Error email (ID: {contacto.id}): {result}')

        except Exception as e:
            logger.error(f'[CONTACTO] Excepción email (ID: {contacto.id}): {e}', exc_info=True)
