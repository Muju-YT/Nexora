from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action

from .models import Reel, ReelLike, ReelComment, SavedReel
from .serializers import ReelSerializer, ReelCommentSerializer

class ReelViewSet(viewsets.ModelViewSet):
    queryset = Reel.objects.all()
    serializer_class = ReelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        queryset = Reel.objects.all()
        username = self.request.query_params.get('username')
        if username:
            queryset = queryset.filter(user__username=username)
        feed = self.request.query_params.get('feed')
        if feed == 'saved':
            queryset = queryset.filter(saved_by__user=self.request.user)
        return queryset

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        reel = self.get_object()
        user = request.user
        like_filter = ReelLike.objects.filter(reel=reel, user=user)

        if like_filter.exists():
            like_filter.delete()
            return Response({'status': 'unliked', 'message': 'Reel unliked'}, status=status.HTTP_200_OK)
        else:
            ReelLike.objects.create(reel=reel, user=user)
            # Notify reel owner
            if reel.user != user:
                from apps.notifications.models import Notification
                Notification.objects.create(
                    recipient=reel.user,
                    sender=user,
                    notification_type='reel_like',
                    message=f'{user.username} liked your reel.',
                    target_id=str(reel.id)
                )
            return Response({'status': 'liked', 'message': 'Reel liked'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def save_reel(self, request, pk=None):
        reel = self.get_object()
        user = request.user
        saved_filter = SavedReel.objects.filter(reel=reel, user=user)

        if saved_filter.exists():
            saved_filter.delete()
            return Response({'status': 'unsaved', 'message': 'Reel unsaved'}, status=status.HTTP_200_OK)
        else:
            SavedReel.objects.create(reel=reel, user=user)
            return Response({'status': 'saved', 'message': 'Reel saved'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def view(self, request, pk=None):
        reel = self.get_object()
        reel.views_count += 1
        reel.save()
        return Response({'message': 'Reel view count incremented'}, status=status.HTTP_200_OK)



class ReelCommentViewSet(viewsets.ModelViewSet):
    queryset = ReelComment.objects.all()
    serializer_class = ReelCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = ReelComment.objects.all()
        reel_id = self.request.query_params.get('reel')
        if reel_id:
            queryset = queryset.filter(reel_id=reel_id)
        return queryset

    def perform_create(self, serializer):
        comment = serializer.save(user=self.request.user)
        # Notify reel owner
        reel = comment.reel
        if reel.user != self.request.user:
            from apps.notifications.models import Notification
            Notification.objects.create(
                recipient=reel.user,
                sender=self.request.user,
                notification_type='reel_comment',
                message=f'{self.request.user.username} commented on your reel.',
                target_id=str(reel.id)
            )
