from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Count
from django.utils import timezone

from .models import Post, PostMedia, Like, Comment, SavedPost, Poll, PollOption, PollVote
from .serializers import PostSerializer, CommentSerializer

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        music_title = self.request.data.get('music_title')
        music_artist = self.request.data.get('music_artist')
        music_file = self.request.FILES.get('music_file')

        post = serializer.save(
            user=self.request.user,
            music_title=music_title,
            music_artist=music_artist,
            music_file=music_file
        )
        # Handle files if uploaded
        files = self.request.FILES.getlist('media_files')
        for i, file in enumerate(files):
            file_type = 'video' if file.name.endswith(('.mp4', '.mov', '.avi')) else 'image'
            PostMedia.objects.create(post=post, file=file, file_type=file_type, order=i)
            
        # Handle Poll if provided
        poll_question = self.request.data.get('poll_question')
        poll_options = self.request.data.getlist('poll_options')
        if poll_question and poll_options:
            expiry = timezone.now() + timezone.timedelta(days=7) # Default 1 week
            poll = Poll.objects.create(post=post, question=poll_question, expires_at=expiry)
            for opt_text in poll_options:
                PollOption.objects.create(poll=poll, text=opt_text)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user != request.user:
            return Response({'error': 'You can only delete your own posts'}, status=status.HTTP_403_FORBIDDEN)
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_queryset(self):
        user = self.request.user
        queryset = Post.objects.all()
        
        # Filter by username
        username = self.request.query_params.get('username')
        if username:
            queryset = queryset.filter(user__username=username)
        
        # Simple feed query: posts by users they follow or themselves
        feed_type = self.request.query_params.get('feed', 'global')
        if feed_type == 'personal':
            following_profiles = user.profile.following.all()
            following_users = [p.user for p in following_profiles] + [user]
            queryset = queryset.filter(user__in=following_users)
        elif feed_type == 'trending':
            # Order by most liked posts
            queryset = queryset.annotate(num_likes=Count('likes')).order_by('-num_likes', '-created_at')
        elif feed_type == 'saved':
            # Filter posts saved by the user
            queryset = queryset.filter(saved_by__user=user)

        # Filter by hashtags
        hashtag = self.request.query_params.get('hashtag')
        if hashtag:
            queryset = queryset.filter(hashtags__icontains=hashtag)

        return queryset

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()
        user = request.user
        like_filter = Like.objects.filter(post=post, user=user)
        
        if like_filter.exists():
            like_filter.delete()
            return Response({'status': 'unliked', 'message': 'Post unliked'}, status=status.HTTP_200_OK)
        else:
            Like.objects.create(post=post, user=user)
            # Trigger real-time notification in the background
            from apps.notifications.models import Notification
            if post.user != user:
                Notification.objects.create(
                    recipient=post.user,
                    sender=user,
                    notification_type='like',
                    message=f'{user.username} liked your post.',
                    target_id=str(post.id)
                )
            return Response({'status': 'liked', 'message': 'Post liked'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def save_post(self, request, pk=None):
        post = self.get_object()
        user = request.user
        saved_filter = SavedPost.objects.filter(post=post, user=user)

        if saved_filter.exists():
            saved_filter.delete()
            return Response({'status': 'unsaved', 'message': 'Post unsaved'}, status=status.HTTP_200_OK)
        else:
            SavedPost.objects.create(post=post, user=user)
            return Response({'status': 'saved', 'message': 'Post saved'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def pin(self, request, pk=None):
        post = self.get_object()
        if post.user != request.user:
            return Response({'error': 'You can only pin your own posts'}, status=status.HTTP_403_FORBIDDEN)
        
        post.is_pinned = not post.is_pinned
        post.save()
        status_msg = "pinned" if post.is_pinned else "unpinned"
        return Response({'status': status_msg, 'message': f'Post {status_msg} successfully.'})


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Comment.objects.all()
        post_id = self.request.query_params.get('post')
        if post_id:
            queryset = queryset.filter(post_id=post_id)
        return queryset

    def perform_create(self, serializer):
        comment = serializer.save(user=self.request.user)
        # Notify post author
        post = comment.post
        if post.user != self.request.user:
            from apps.notifications.models import Notification
            Notification.objects.create(
                recipient=post.user,
                sender=self.request.user,
                notification_type='comment',
                message=f'{self.request.user.username} commented on your post.',
                target_id=str(post.id)
            )


class VotePollView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, option_id=None):
        option = get_object_or_404(PollOption, id=option_id)
        poll = option.poll
        
        # Check expiry
        if timezone.now() > poll.expires_at:
            return Response({'error': 'This poll has expired.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Remove any previous votes by this user in this specific poll
        PollVote.objects.filter(option__poll=poll, user=request.user).delete()
        
        # Register new vote
        PollVote.objects.create(option=option, user=request.user)
        return Response({'message': 'Vote cast successfully'}, status=status.HTTP_201_CREATED)
