from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .services import ai_service

class AICaptionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        prompt = request.data.get('prompt')
        style = request.data.get('style', 'futuristic')
        if not prompt:
            return Response({'error': 'Prompt is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        result = ai_service.generate_caption(prompt, style)
        return Response({'caption': result}, status=status.HTTP_200_OK)


class AIBioView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profession = request.data.get('profession', 'Cyber Explorer')
        interests = request.data.get('interests', [])
        
        result = ai_service.generate_bio(profession, interests)
        return Response({'bio': result}, status=status.HTTP_200_OK)


class AIToxicityScanView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        text = request.data.get('text')
        if not text:
            return Response({'error': 'Text is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        result = ai_service.scan_for_toxicity(text)
        return Response(result, status=status.HTTP_200_OK)
