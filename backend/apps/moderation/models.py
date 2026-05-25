from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Report(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending Review'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
    )
    CONTENT_TYPES = (
        ('user', 'User Profile'),
        ('post', 'Feed Post'),
        ('comment', 'Comment'),
        ('reel', 'Short Reel'),
    )
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='filed_reports')
    reported_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_received')
    content_type = models.CharField(max_length=15, choices=CONTENT_TYPES)
    content_id = models.CharField(max_length=50, help_text="ID of the offending object")
    reason = models.TextField(max_length=1000)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Report #{self.id} on {self.reported_user.username} (Status: {self.status})"


class AdminLog(models.Model):
    admin = models.ForeignKey(User, on_delete=models.CASCADE, related_name='admin_actions')
    action = models.CharField(max_length=100, help_text="e.g. Suspended user, Deleted post")
    details = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.admin.username} performed: {self.action} at {self.created_at.strftime('%Y-%m-%d %H:%M')}"
