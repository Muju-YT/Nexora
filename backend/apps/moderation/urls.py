from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportViewSet, AdminDashboardViewSet

router = DefaultRouter()
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'dashboard', AdminDashboardViewSet, basename='admin_dashboard')

urlpatterns = [
    path('', include(router.urls)),
]
