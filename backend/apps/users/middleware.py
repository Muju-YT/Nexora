import time
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db import connection, InterfaceError, OperationalError

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
                
                # Retry database queries if there is a transient connection error
                for attempt in range(3):
                    try:
                        from rest_framework_simplejwt.authentication import JWTAuthentication
                        authenticator = JWTAuthentication()
                        validated_token = authenticator.get_validated_token(token)
                        user = authenticator.get_user(validated_token)
                        break
                    except (InterfaceError, OperationalError):
                        if attempt == 2:
                            break
                        connection.close()
                        time.sleep(0.5)
                    except Exception:
                        # Other non-database exceptions (e.g. invalid token) should fail immediately
                        break

        # Update last_activity if authenticated user
        if user and user.is_authenticated:
            # Retry database update if there is a transient connection error
            for attempt in range(3):
                try:
                    User = get_user_model()
                    User.objects.filter(pk=user.pk).update(last_activity=timezone.now())
                    break
                except (InterfaceError, OperationalError):
                    if attempt == 2:
                        break
                    connection.close()
                    time.sleep(0.5)

        return self.get_response(request)
