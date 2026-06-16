from rest_framework import serializers
from .models import Story, StoryViewer, StoryReaction
from nexora_backend.utils import AbsoluteFileField, AbsoluteImageField

class StoryViewerSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    avatar = AbsoluteImageField(source='user.profile.avatar', read_only=True)

    class Meta:
        model = StoryViewer
        fields = ['id', 'username', 'avatar', 'viewed_at']


class StoryReactionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = StoryReaction
        fields = ['id', 'username', 'reaction', 'created_at']


class StorySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    avatar = AbsoluteImageField(source='user.profile.avatar', read_only=True)
    media = AbsoluteFileField()
    viewers = StoryViewerSerializer(many=True, read_only=True)
    reactions = StoryReactionSerializer(many=True, read_only=True)
    viewers_count = serializers.SerializerMethodField()

    class Meta:
        model = Story
        fields = [
            'id', 'username', 'avatar', 'media', 'media_type',
            'caption', 'text_overlay',
            'text_x', 'text_y', 'text_rotation', 'text_style_id', 'text_size_idx',
            'song_name', 'song_artist',
            'media_scale', 'media_x', 'media_y', 'media_fit',
            'music_x', 'music_y', 'music_rotation',
            'viewers', 'reactions', 'viewers_count', 'created_at', 'expires_at'
        ]

    def get_viewers_count(self, obj):
        return obj.viewers.count()
