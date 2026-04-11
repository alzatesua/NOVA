"""
Endpoint de prueba para verificar el guardado de historial de login
Este código se puede agregar en login/views.py o analytics/views.py
"""

@api_view(['POST'])
@permission_classes([AllowAny])
def test_historial_login(request):
    """
    Endpoint de prueba para verificar si se puede guardar en historial_login

    POST /api/test-historial-login/
    Body:
        - usuario: str
        - token: str
        - subdominio: str
    """
    import logging
    logger = logging.getLogger(__name__)

    try:
        # Obtener credenciales
        usuario = request.data.get('usuario')
        token = request.data.get('token')
        subdom = request.data.get('subdominio')

        if not subdom:
            host = request.get_host().split(':')[0]
            subdom = host.split('.')[0].lower()

        # Buscar tenant
        from nova.models import Dominios
        from nova.utils.db import conectar_db_tienda

        dominio_obj = Dominios.objects.filter(
            dominio__icontains=subdom
        ).select_related('tienda').first()

        if not dominio_obj:
            return Response({
                'error': 'Dominio no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)

        tienda = dominio_obj.tienda
        alias = str(tienda.id)

        # Conectar a BD del tenant
        conectar_db_tienda(alias, tienda)

        # Intentar crear registro de prueba
        from main_dashboard.models import HistorialLogin
        from django.utils import timezone

        test_data = {
            'usuario_id': 9999,
            'usuario_correo': f'test_{timezone.now().timestamp()}@prueba.com',
            'usuario_nombre': 'test_usuario',
            'fecha_hora_login': timezone.now(),
            'direccion_ip': '127.0.0.1',
            'user_agent': 'Test Agent',
            'exitoso': True,
            'duracion_segundos': 60
        }

        logger.info(f"Intentando crear registro de prueba: {test_data}")

        registro = HistorialLogin.objects.using(alias).create(**test_data)

        logger.info(f"Registro creado exitosamente: ID {registro.id_historial}")

        # Verificar que se guardó
        total_registros = HistorialLogin.objects.using(alias).count()

        return Response({
            'success': True,
            'message': 'Registro de prueba creado exitosamente',
            'registro_id': registro.id_historial,
            'total_registros': total_registros,
            'tienda': tienda.nombre_tienda,
            'db_alias': alias
        }, status=status.HTTP_200_OK)

    except Exception as e:
        import traceback
        error_detalle = traceback.format_exc()

        logger.error(f"Error en test_historial_login: {str(e)}")
        logger.error(f"Traceback: {error_detalle}")

        return Response({
            'success': False,
            'error': str(e),
            'traceback': error_detalle
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
