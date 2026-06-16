from rest_framework import serializers
from .models import Notification
from nexora_backend.utils import AbsoluteImageField, get_absolute_media_url

class NotificationSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_avatar = AbsoluteImageField(source='sender.profile.avatar', read_only=True)
    target_media = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'sender_username', 'sender_avatar', 'notification_type', 
            'message', 'target_id', 'is_read', 'created_at', 'target_media'
        ]

    def get_target_media(self, obj):
        if not obj.target_id:
            return None
        try:
            request = self.context.get('request')
            if obj.notification_type in ['like', 'comment']:
                from apps.posts.models import Post
                post = Post.objects.filter(id=int(obj.target_id)).first()
                if post:
                    first_media = post.media.first()
                    if first_media and first_media.file:
                        return get_absolute_media_url(first_media.file.url, request)
            elif obj.notification_type in ['story_reaction', 'story_reply']:
                from apps.stories.models import Story
                story = Story.objects.filter(id=int(obj.target_id)).first()
                if story and story.media:
                    return get_absolute_media_url(story.media.url, request)
            elif obj.notification_type in ['reel_like', 'reel_comment']:
                from apps.reels.models import Reel
                reel = Reel.objects.filter(id=int(obj.target_id)).first()
                if reel and reel.video:
                    return get_absolute_media_url(reel.video.url, request)
        except Exception as e:
            print("Error getting target_media in NotificationSerializer:", e)
        return None
