from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StoryViewSet

router = DefaultRouter()
router.register(r'', StoryViewSet, basename='story')

urlpatterns = [
    path('', include(router.urls)),
]
