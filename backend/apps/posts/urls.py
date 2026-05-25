from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, CommentViewSet, VotePollView

router = DefaultRouter()
router.register(r'feed', PostViewSet, basename='post')
router.register(r'comments', CommentViewSet, basename='comment')

urlpatterns = [
    path('', include(router.urls)),
    path('polls/vote/<int:option_id>/', VotePollView.as_view(), name='poll_vote'),
]
