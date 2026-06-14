from rest_framework import serializers
from .models import Report, AdminLog

class ReportSerializer(serializers.ModelSerializer):
    reporter_username = serializers.CharField(source='reporter.username', read_only=True)
    reported_username = serializers.CharField(source='reported_user.username', read_only=True)

    class Meta:
        model = Report
        fields = ['id', 'reporter_username', 'reported_username', 'content_type', 'content_id', 'reason', 'status', 'created_at']
        read_only_fields = ['status']
