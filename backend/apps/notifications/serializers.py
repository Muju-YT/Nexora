from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_avatar = serializers.ImageField(source='sender.profile.avatar', read_only=True)
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
            if obj.notification_type in ['like', 'comment']:
                from apps.posts.models import Post
                post = Post.objects.filter(id=int(obj.target_id)).first()
                if post:
                    first_media = post.media.first()
                    if first_media and first_media.file:
                        request = self.context.get('request')
                        if request:
                            return request.build_absolute_uri(first_media.file.url)
                        return first_media.file.url
            elif obj.notification_type in ['story_reaction', 'story_reply']:
                from apps.stories.models import Story
                story = Story.objects.filter(id=int(obj.target_id)).first()
                if story and story.media:
                    request = self.context.get('request')
                    if request:
                        return request.build_absolute_uri(story.media.url)
                    return story.media.url
            elif obj.notification_type in ['reel_like', 'reel_comment']:
                from apps.reels.models import Reel
                reel = Reel.objects.filter(id=int(obj.target_id)).first()
                if reel and reel.video:
                    request = self.context.get('request')
                    if request:
                        return request.build_absolute_uri(reel.video.url)
                    return reel.video.url
        except Exception as e:
            print("Error getting target_media in NotificationSerializer:", e)
        return None
