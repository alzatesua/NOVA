class DisableCSRFForAPIMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Deshabilitar CSRF para cualquier ruta que contenga /api/
        if '/api/' in request.path:
            setattr(request, '_dont_enforce_csrf_checks', True)
        
        response = self.get_response(request)
        return response