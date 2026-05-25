from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

def default_expiry():
    return timezone.now() + timedelta(hours=24)

class Story(models.Model):
    MEDIA_TYPES = (
        ('image', 'Image'),
        ('video', 'Video'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='stories')
    media = models.FileField(upload_to='stories/')
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES, default='image')
    caption = models.CharField(max_length=150, blank=True)
    # Text overlay content
    text_overlay = models.CharField(max_length=200, blank=True)
    # Text sticker position (as % of canvas, 0–100)
    text_x = models.FloatField(default=50.0)
    text_y = models.FloatField(default=50.0)
    # Text sticker rotation in degrees
    text_rotation = models.FloatField(default=0.0)
    # Text style preset id (classic / neon / pill / solid / outline / gradient)
    text_style_id = models.CharField(max_length=30, blank=True, default='classic')
    # Text size index (0=S, 1=M, 2=L, 3=XL, 4=XXL)
    text_size_idx = models.IntegerField(default=2)
    # Music sticker
    song_name = models.CharField(max_length=150, blank=True)
    song_artist = models.CharField(max_length=150, blank=True)
    # Media scaling & positioning
    media_scale = models.FloatField(default=1.0)
    media_x = models.FloatField(default=0.0)
    media_y = models.FloatField(default=0.0)
    media_fit = models.CharField(max_length=10, default='contain')
    # Music sticker position & rotation
    music_x = models.FloatField(default=50.0)
    music_y = models.FloatField(default=75.0)
    music_rotation = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=default_expiry)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Story by {self.user.username} (Expires {self.expires_at.strftime('%m-%d %H:%M')})"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at


class StoryViewer(models.Model):
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='viewers')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='viewed_stories')
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('story', 'user')

    def __str__(self):
        return f"{self.user.username} viewed Story {self.story.id}"


class StoryReaction(models.Model):
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='story_reactions')
    reaction = models.CharField(max_length=20, help_text="Emoji character (e.g. 🔥)")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('story', 'user')

    def __str__(self):
        return f"{self.user.username} reacted {self.reaction} to Story {self.story.id}"
