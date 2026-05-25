from rest_framework import serializers
from .models import ChatRoom, ChatMember, Message, MessageReaction

class ChatMemberSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    avatar = serializers.ImageField(source='user.profile.avatar', read_only=True)
    is_online = serializers.BooleanField(source='user.is_online', read_only=True)
    last_activity = serializers.DateTimeField(source='user.last_activity', read_only=True)

    class Meta:
        model = ChatMember
        fields = ['id', 'username', 'avatar', 'is_admin', 'is_pinned', 'is_muted', 'joined_at', 'is_online', 'last_activity']


class MessageReactionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = MessageReaction
        fields = ['id', 'username', 'reaction', 'created_at']


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_avatar = serializers.ImageField(source='sender.profile.avatar', read_only=True)
    reactions = MessageReactionSerializer(many=True, read_only=True)
    seen_by_usernames = serializers.SlugRelatedField(
        many=True, read_only=True, slug_field='username', source='seen_by'
    )

    class Meta:
        model = Message
        fields = [
            'id', 'room', 'sender_username', 'sender_avatar', 'content', 
            'media_file', 'media_type', 'reply_to', 'is_forwarded', 
            'is_pinned', 'seen_by_usernames', 'reactions', 'created_at'
        ]


class ChatRoomSerializer(serializers.ModelSerializer):
    members = ChatMemberSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['id', 'title', 'is_group', 'avatar', 'description', 'members', 'last_message', 'unread_count', 'created_at']

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-created_at').first()
        if msg:
            return MessageSerializer(msg).data
        return None

    def get_unread_count(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if user and user.is_authenticated:
            # Message not sent by user and user not in seen_by list
            return obj.messages.exclude(sender=user).exclude(seen_by=user).count()
        return 0
