from rest_framework import serializers
from .models import Post, PostMedia, Like, Comment, SavedPost, Poll, PollOption, PollVote
from django.contrib.auth import get_user_model
from nexora_backend.utils import AbsoluteFileField, AbsoluteImageField

User = get_user_model()

class PostMediaSerializer(serializers.ModelSerializer):
    file = AbsoluteFileField()

    class Meta:
        model = PostMedia
        fields = ['id', 'file', 'file_type', 'order']


class PollOptionSerializer(serializers.ModelSerializer):
    votes_count = serializers.SerializerMethodField()
    has_voted = serializers.SerializerMethodField()

    class Meta:
        model = PollOption
        fields = ['id', 'text', 'votes_count', 'has_voted']

    def get_votes_count(self, obj):
        return obj.votes.count()

    def get_has_voted(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if user and user.is_authenticated:
            return obj.votes.filter(user=user).exists()
        return False


class PollSerializer(serializers.ModelSerializer):
    options = PollOptionSerializer(many=True, read_only=True)
    total_votes = serializers.SerializerMethodField()

    class Meta:
        model = Poll
        fields = ['id', 'question', 'expires_at', 'options', 'total_votes']

    def get_total_votes(self, obj):
        return PollVote.objects.filter(option__poll=obj).count()


class CommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    avatar = AbsoluteImageField(source='user.profile.avatar', read_only=True)
    replies_count = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'post', 'username', 'avatar', 'content', 'parent', 'replies_count', 'created_at']

    def get_replies_count(self, obj):
        return obj.replies.count()


class PostSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    avatar = AbsoluteImageField(source='user.profile.avatar', read_only=True)
    media = PostMediaSerializer(many=True, read_only=True)
    poll = PollSerializer(read_only=True)
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    has_liked = serializers.SerializerMethodField()
    has_saved = serializers.SerializerMethodField()
    music_file = AbsoluteFileField(read_only=True)

    class Meta:
        model = Post
        fields = [
            'id', 'username', 'avatar', 'caption', 'is_pinned', 'hashtags', 
            'media', 'poll', 'likes_count', 'comments_count', 'has_liked', 
            'has_saved', 'created_at', 'updated_at',
            'music_title', 'music_artist', 'music_file'
        ]

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_has_liked(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if user and user.is_authenticated:
            return obj.likes.filter(user=user).exists()
        return False

    def get_has_saved(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if user and user.is_authenticated:
            return obj.saved_by.filter(user=user).exists()
        return False
