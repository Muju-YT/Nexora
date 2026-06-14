from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

from .models import Report, AdminLog
from .serializers import ReportSerializer
from apps.users.serializers import UserSerializer

User = get_user_model()

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.is_staff


class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Admin can see all, standard users can only see reports they filed
        if self.request.user.is_staff:
            return Report.objects.all()
        return Report.objects.filter(reporter=self.request.user)

    def perform_create(self, serializer):
        reported_username = self.request.data.get('reported_username')
        reported_user = get_object_or_404(User, username=reported_username)
        serializer.save(reporter=self.request.user, reported_user=reported_user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def resolve(self, request, pk=None):
        report = self.get_object()
        action_type = request.data.get('action') # 'suspend', 'delete_content', 'dismiss'
        
        if action_type == 'suspend':
            report.reported_user.is_active = False
            report.reported_user.save()
            report.status = 'resolved'
            AdminLog.objects.create(
                admin=request.user,
                action='SUSPEND_USER',
                details=f'Suspended user {report.reported_user.username} based on Report #{report.id}'
            )
        elif action_type == 'delete_content':
            # Simulated deletion of reported post/reel
            report.status = 'resolved'
            AdminLog.objects.create(
                admin=request.user,
                action='DELETE_CONTENT',
                details=f'Deleted content type {report.content_type} ID {report.content_id} based on Report #{report.id}'
            )
        else:
            report.status = 'dismissed'
            AdminLog.objects.create(
                admin=request.user,
                action='DISMISS_REPORT',
                details=f'Dismissed Report #{report.id} on user {report.reported_user.username}'
            )
        
        report.save()
        return Response({'status': report.status, 'message': f'Report {report.status} successfully.'})


class AdminDashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAdminUser]

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        flagged_reports = Report.objects.filter(status='pending').count()
        logs = AdminLog.objects.all()[:10]
        
        log_data = [{
            'id': log.id,
            'admin': log.admin.username,
            'action': log.action,
            'details': log.details,
            'created_at': log.created_at
        } for log in logs]

        return Response({
            'total_users': total_users,
            'active_users': active_users,
            'pending_reports': flagged_reports,
            'admin_actions': log_data
        })
