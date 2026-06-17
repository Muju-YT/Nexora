import re
from rest_framework import serializers
from django.conf import settings

def get_absolute_media_url(url, request=None):
    if not url:
        return None
    url_str = str(url)
    
    # Check if it's already an absolute URL
    if url_str.startswith(('http://', 'https://')):
        # In production, replace localhost/127.0.0.1 references with the real production domain
        if not getattr(settings, 'DEBUG', True):
            for host in ['localhost', '127.0.0.1', '10.0.2.2']:
                if host in url_str:
                    url_str = re.sub(r'https?://[^/]+', 'https://nexora-backend-9ivc.onrender.com', url_str)
                    break
        return url_str

    # If it's a relative path, resolve it using request if available, otherwise prepend domain
    if request:
        try:
            return request.build_absolute_uri(url_str)
        except Exception:
            pass
        
    # Default fallback base URL
    base_url = 'https://nexora-backend-9ivc.onrender.com'
    if getattr(settings, 'DEBUG', True):
        base_url = 'http://localhost:8000'
        
    # Ensure correct slash joining
    if url_str.startswith('/'):
        return f"{base_url}{url_str}"
    return f"{base_url}/{url_str}"

class AbsoluteFileField(serializers.FileField):
    def to_representation(self, value):
        if not value:
            return None
        try:
            url = value.url
        except Exception:
            return None
        return get_absolute_media_url(url, self.context.get('request'))
        
class AbsoluteImageField(serializers.ImageField):
    def to_representation(self, value):
        if not value:
            return None
        try:
            url = value.url
        except Exception:
            return None
        return get_absolute_media_url(url, self.context.get('request'))
