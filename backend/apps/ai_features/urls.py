from django.urls import path
from .views import AICaptionView, AIBioView, AIToxicityScanView

urlpatterns = [
    path('caption/', AICaptionView.as_view(), name='ai_caption'),
    path('bio/', AIBioView.as_view(), name='ai_bio'),
    path('scan/', AIToxicityScanView.as_view(), name='ai_scan'),
]
