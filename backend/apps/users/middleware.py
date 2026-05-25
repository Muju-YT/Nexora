from django.utils import timezone
from django.contrib.auth import get_user_model

class ActiveUserMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = request.user
        
        # If user is not authenticated via sessions, try simplejwt bearer token
        if not (user and user.is_authenticated):
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
                try:
                    from rest_framework_simplejwt.authentication import JWTAuthentication
                    authenticator = JWTAuthentication()
                    validated_token = authenticator.get_validated_token(token)
                    user = authenticator.get_user(validated_token)
                except Exception:
                    pass

        # Update last_activity if authenticated user
        if user and user.is_authenticated:
            User = get_user_model()
            User.objects.filter(pk=user.pk).update(last_activity=timezone.now())

        return self.get_response(request)
