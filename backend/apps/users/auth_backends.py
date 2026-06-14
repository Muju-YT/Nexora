import time
from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q
from django.db import connection, InterfaceError, OperationalError

User = get_user_model()

class EmailOrUsernameModelBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD) or kwargs.get('username')
        
        if not username:
            return None
            
        user = None
        for attempt in range(3):
            try:
                # Query case-insensitively for either username or email matches
                user = User.objects.get(Q(username__iexact=username) | Q(email__iexact=username))
                break
            except User.DoesNotExist:
                # Run password hasher to prevent timing attacks
                User().set_password(password)
                return None
            except (InterfaceError, OperationalError) as e:
                if attempt == 2:
                    raise e
                connection.close()
                time.sleep(0.5)
            
        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
