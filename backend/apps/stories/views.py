from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from django.db.models import Q
from django.contrib.auth import get_user_model

from .models import Story, StoryViewer, StoryReaction
from .serializers import StorySerializer
from apps.notifications.models import Notification
from apps.chats.models import ChatRoom, ChatMember, Message

User = get_user_model()


def get_or_create_dm_room(user_a, user_b):
    """Find or create a 1-to-1 ChatRoom between two users."""
    # Look for a non-group room where BOTH users are members
    shared = ChatRoom.objects.filter(
        is_group=False,
        members__user=user_a
    ).filter(
        members__user=user_b
    ).first()
    if shared:
        return shared
    # Create a new 1-to-1 room
    room = ChatRoom.objects.create(is_group=False, creator=user_a)
    ChatMember.objects.create(room=room, user=user_a, is_admin=True)
    ChatMember.objects.create(room=room, user=user_b)
    return room


class StoryViewSet(viewsets.ModelViewSet):
    serializer_class = StorySerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        now = timezone.now()
        user = self.request.user
        following_profiles = user.profile.following.all()
        following_users = [p.user for p in following_profiles] + [user]
        return Story.objects.filter(user__in=following_users, expires_at__gt=now)

    def perform_create(self, serializer):
        media = self.request.FILES.get('media')
        media_type = 'video' if media and media.name.endswith(('.mp4', '.mov', '.avi')) else 'image'
        serializer.save(
            user=self.request.user,
            media_type=media_type,
            text_overlay=self.request.data.get('text_overlay', ''),
            text_x=float(self.request.data.get('text_x', 50)),
            text_y=float(self.request.data.get('text_y', 50)),
            text_rotation=float(self.request.data.get('text_rotation', 0)),
            text_style_id=self.request.data.get('text_style_id', 'classic'),
            text_size_idx=int(self.request.data.get('text_size_idx', 2)),
            song_name=self.request.data.get('song_name', ''),
            song_artist=self.request.data.get('song_artist', ''),
            media_scale=float(self.request.data.get('media_scale', 1.0)),
            media_x=float(self.request.data.get('media_x', 0.0)),
            media_y=float(self.request.data.get('media_y', 0.0)),
            media_fit=self.request.data.get('media_fit', 'contain'),
            music_x=float(self.request.data.get('music_x', 50.0)),
            music_y=float(self.request.data.get('music_y', 75.0)),
            music_rotation=float(self.request.data.get('music_rotation', 0.0)),
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user != request.user:
            return Response({'error': 'You can only delete your own stories'}, status=status.HTTP_403_FORBIDDEN)
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def view(self, request, pk=None):
        story = self.get_object()
        StoryViewer.objects.get_or_create(story=story, user=request.user)
        return Response({'message': 'Story marked as viewed'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def react(self, request, pk=None):
        story = self.get_object()
        reaction_emoji = request.data.get('reaction', '❤️')
        reactor = request.user
        owner = story.user

        # Create or update the reaction
        StoryReaction.objects.update_or_create(
            story=story, user=reactor,
            defaults={'reaction': reaction_emoji}
        )

        # Create a notification for the story owner (skip if reacting to own story)
        if owner != reactor:
            Notification.objects.create(
                recipient=owner,
                sender=reactor,
                notification_type='story_reaction',
                message=f'reacted {reaction_emoji} to your story.',
                target_id=str(story.id),
            )

        return Response({'message': f'Reacted {reaction_emoji} to story'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        """Reply to a story — sends a DM to the story owner and creates a notification."""
        story = self.get_object()
        reply_text = request.data.get('text', '').strip()
        replier = request.user
        owner = story.user

        if not reply_text:
            return Response({'error': 'Reply text is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if owner == replier:
            return Response({'error': 'Cannot reply to your own story.'}, status=status.HTTP_400_BAD_REQUEST)

        # Find or create DM room between replier and story owner
        room = get_or_create_dm_room(replier, owner)

        # Send the message into that DM room
        message_content = f'Replied to your story: "{reply_text}"'
        Message.objects.create(
            room=room,
            sender=replier,
            content=message_content,
            media_type='text',
        )

        # Also create a notification for the story owner
        Notification.objects.create(
            recipient=owner,
            sender=replier,
            notification_type='story_reply',
            message=f'replied to your story: "{reply_text[:60]}"',
            target_id=str(story.id),
        )

        return Response({'message': 'Reply sent', 'room_id': room.id}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def viewers(self, request, pk=None):
        """Returns the list of users who viewed this story (only for the story owner)."""
        story = self.get_object()
        if story.user != request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        viewers = story.viewers.select_related('user__profile').all()
        data = []
        for v in viewers:
            avatar_url = None
            if v.user.profile.avatar:
                try:
                    avatar_url = request.build_absolute_uri(v.user.profile.avatar.url)
                except Exception:
                    pass
            data.append({
                'username': v.user.username,
                'avatar': avatar_url,
                'viewed_at': v.viewed_at,
            })
        return Response({'count': len(data), 'viewers': data})
