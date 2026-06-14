from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.contrib.auth import get_user_model

from .models import ChatRoom, ChatMember, Message
from .serializers import ChatRoomSerializer, MessageSerializer

User = get_user_model()

class ChatRoomViewSet(viewsets.ModelViewSet):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users can only see rooms they are a member of
        return ChatRoom.objects.filter(members__user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        is_group = self.request.data.get('is_group', False)
        room = serializer.save(is_group=is_group, creator=self.request.user)
        
        # Add creator as admin
        ChatMember.objects.create(room=room, user=self.request.user, is_admin=True)

        if not is_group:
            # 1-to-1 chat: Add target member automatically
            target_username = self.request.data.get('target_username')
            if target_username:
                target_user = get_object_or_404(User, username=target_username)
                ChatMember.objects.create(room=room, user=target_user)

    @action(detail=True, methods=['get', 'post'])
    def messages(self, request, pk=None):
        room = self.get_object()
        
        if request.method == 'POST':
            content = request.data.get('content', '')
            media_type = request.data.get('media_type', 'text')
            media_file = request.FILES.get('media_file') or request.data.get('media_file')
            
            msg = Message.objects.create(
                room=room,
                sender=request.user,
                content=content,
                media_type=media_type,
                media_file=media_file
            )
            msg.seen_by.add(request.user)
            
            serializer = MessageSerializer(msg, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        msgs = room.messages.all()
        
        # Mark all messages in room as seen by this user
        for m in msgs.exclude(sender=request.user):
            m.seen_by.add(request.user)

        serializer = MessageSerializer(msgs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def pin(self, request, pk=None):
        room = self.get_object()
        member = get_object_or_404(ChatMember, room=room, user=request.user)
        member.is_pinned = not member.is_pinned
        member.save()
        status_msg = "pinned" if member.is_pinned else "unpinned"
        return Response({'status': status_msg, 'message': f'Room {status_msg} successfully.'})

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        room = self.get_object()
        if not room.is_group:
            return Response({'error': 'Cannot add members to a 1-to-1 chat'}, status=status.HTTP_400_BAD_REQUEST)
        
        username = request.data.get('username')
        user_to_add = get_object_or_404(User, username=username)
        ChatMember.objects.get_or_create(room=room, user=user_to_add)
        return Response({'message': f'{username} added to the group.'})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        user = request.user
        rooms = ChatRoom.objects.filter(members__user=user)
        count = Message.objects.filter(room__in=rooms).exclude(sender=user).exclude(seen_by=user).count()
        return Response({'unread_count': count}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='messages/(?P<message_pk>[^/.]+)/react')
    def react_message(self, request, pk=None, message_pk=None):
        room = self.get_object()
        from .models import Message, MessageReaction
        from .serializers import MessageSerializer
        
        message = get_object_or_404(Message, id=message_pk, room=room)
        reaction_char = request.data.get('reaction')
        
        if not reaction_char:
            return Response({'error': 'Reaction is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        reaction_obj, created = MessageReaction.objects.get_or_create(
            message=message,
            user=request.user,
            defaults={'reaction': reaction_char}
        )
        
        is_removed = False
        if not created:
            if reaction_obj.reaction == reaction_char:
                # Toggle off
                reaction_obj.delete()
                is_removed = True
                action_type = 'removed'
            else:
                # Update
                reaction_obj.reaction = reaction_char
                reaction_obj.save()
                action_type = 'updated'
        else:
            action_type = 'created'
            
        serializer = MessageSerializer(message, context={'request': request})
        return Response({
            'status': 'success',
            'action': action_type,
            'is_removed': is_removed,
            'message': serializer.data
        })
