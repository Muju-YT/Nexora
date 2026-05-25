from rest_framework import serializers
from .models import Reel, ReelLike, ReelComment, SavedReel

class ReelCommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    avatar = serializers.ImageField(source='user.profile.avatar', read_only=True)

    class Meta:
        model = ReelComment
        fields = ['id', 'reel', 'username', 'avatar', 'content', 'created_at']


class ReelSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    avatar = serializers.ImageField(source='user.profile.avatar', read_only=True)
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    has_liked = serializers.SerializerMethodField()
    has_saved = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = Reel
        fields = [
            'id', 'username', 'avatar', 'video', 'caption', 'views_count', 
            'likes_count', 'comments_count', 'has_liked', 'has_saved', 'is_following', 'created_at'
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

    def get_is_following(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if user and user.is_authenticated:
            creator_profile = getattr(obj.user, 'profile', None)
            user_profile = getattr(user, 'profile', None)
            if creator_profile and user_profile:
                return creator_profile.followers.filter(id=user_profile.id).exists()
        return False

