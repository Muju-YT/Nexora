import random
from django.utils import timezone
from rest_framework import status, viewsets, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Profile
from .serializers import RegisterSerializer, UserSerializer, ProfileSerializer

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    # Customize JWT response payload here if desired
    pass


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate 6-digit OTP code for verification
        otp = str(random.randint(100000, 999999))
        user.otp_code = otp
        user.otp_created_at = timezone.now()
        user.save()

        # Generate tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'otp_preview': otp,  # Returned for local dev testing; remove in production
            'message': 'Registration successful! Verification OTP code dispatched to email.'
        }, status=status.HTTP_201_CREATED)


class MeView(APIView):
    """Returns or updates the currently authenticated user's own full profile."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        user = request.user
        profile = user.profile

        # Update top-level user fields
        for field in ['first_name', 'last_name']:
            if field in request.data:
                setattr(user, field, request.data[field])
        user.save()

        # Handle avatar file upload
        if 'avatar' in request.FILES:
            profile.avatar = request.FILES['avatar']

        # Update other profile fields
        profile_fields = ['bio', 'location', 'profession', 'website', 'interests']
        for field in profile_fields:
            if field in request.data:
                setattr(profile, field, request.data[field])
        profile.save()

        return Response(UserSerializer(user).data)


class VerifyOTPView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        otp = request.data.get('otp')
        if not otp:
            return Response({'error': 'OTP is required'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if user.is_email_verified:
            return Response({'message': 'Email already verified'}, status=status.HTTP_400_BAD_REQUEST)

        if user.otp_code == otp:
            elapsed = timezone.now() - user.otp_created_at
            if elapsed.total_seconds() < 600:  # valid for 10 minutes
                user.is_email_verified = True
                user.otp_code = None
                user.save()
                return Response({'message': 'Email verified successfully! Welcome to Nexora.'}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'OTP has expired'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'error': 'Invalid OTP code'}, status=status.HTTP_400_BAD_REQUEST)


class ResendOTPView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.is_email_verified:
            return Response({'message': 'Email already verified'}, status=status.HTTP_400_BAD_REQUEST)

        otp = str(random.randint(100000, 999999))
        user.otp_code = otp
        user.otp_created_at = timezone.now()
        user.save()

        return Response({
            'otp_preview': otp,
            'message': 'A new OTP has been dispatched to your email.'
        }, status=status.HTTP_200_OK)


class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'user__username'

    def get_queryset(self):
        return Profile.objects.all()

    @action(detail=True, methods=['post'])
    def follow(self, request, user__username=None):
        target_profile = self.get_object()
        user_profile = request.user.profile

        if target_profile == user_profile:
            return Response({'error': 'You cannot follow yourself'}, status=status.HTTP_400_BAD_REQUEST)

        if target_profile.followers.filter(id=user_profile.id).exists():
            target_profile.followers.remove(user_profile)
            return Response({'status': 'unfollowed', 'message': f'You unfollowed {user__username}'})
        else:
            target_profile.followers.add(user_profile)
            # Notify the target user that someone started following them
            from apps.notifications.models import Notification
            Notification.objects.create(
                recipient=target_profile.user,
                sender=request.user,
                notification_type='follow',
                message=f'{request.user.username} started following you.',
                target_id=str(request.user.id)
            )
            return Response({'status': 'followed', 'message': f'You followed {user__username}'})

    @action(detail=True, methods=['post'])
    def block(self, request, user__username=None):
        target_profile = self.get_object()
        user_profile = request.user.profile

        if target_profile == user_profile:
            return Response({'error': 'You cannot block yourself'}, status=status.HTTP_400_BAD_REQUEST)

        if user_profile.blocked_users.filter(id=target_profile.id).exists():
            user_profile.blocked_users.remove(target_profile)
            return Response({'status': 'unblocked', 'message': f'You unblocked {user__username}'})
        else:
            user_profile.blocked_users.add(target_profile)
            user_profile.followers.remove(target_profile)
            target_profile.followers.remove(user_profile)
            return Response({'status': 'blocked', 'message': f'You blocked {user__username}'})

    @action(detail=True, methods=['get'])
    def followers_list(self, request, user__username=None):
        profile = self.get_object()
        followers = profile.followers.all()
        serializer = self.get_serializer(followers, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def following_list(self, request, user__username=None):
        profile = self.get_object()
        following = profile.following.all()
        serializer = self.get_serializer(following, many=True)
        return Response(serializer.data)
