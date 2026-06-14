from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
   openapi.Info(
      title="Nexora API Platform",
      default_version='v1',
      description="Futuristic premium social media platform API architecture",
      terms_of_service="https://nexora.io/terms/",
      contact=openapi.Contact(email="developer@nexora.io"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Modular REST API endpoints
    path('api/auth/', include('apps.users.urls_auth')),
    path('api/users/', include('apps.users.urls_users')),
    path('api/posts/', include('apps.posts.urls')),
    path('api/stories/', include('apps.stories.urls')),
    path('api/reels/', include('apps.reels.urls')),
    path('api/chats/', include('apps.chats.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/ai/', include('apps.ai_features.urls')),
    path('api/moderation/', include('apps.moderation.urls')),
    
    # Swagger Documentation URLs
    path('swagger<format>\.json|\.yaml', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
