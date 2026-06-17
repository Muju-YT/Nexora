import os
import django

# Configure Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nexora_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.posts.models import PostMedia, Post
from apps.reels.models import Reel
from apps.stories.models import Story

User = get_user_model()

def main():
    print("Starting database media cleanup...")
    
    # 1. Clean user profile avatars and cover photos
    print("\nCleaning user profiles...")
    for user in User.objects.all():
        profile = getattr(user, 'profile', None)
        if profile:
            updated = False
            if profile.avatar:
                print(f"Removing broken avatar '{profile.avatar.name}' for user {user.username}")
                profile.avatar = None
                updated = True
            if profile.cover_photo:
                print(f"Removing broken cover_photo '{profile.cover_photo.name}' for user {user.username}")
                profile.cover_photo = None
                updated = True
            if updated:
                profile.save()

    # 2. Clean Post media
    print("\nCleaning post media...")
    for pm in PostMedia.objects.all():
        print(f"Deleting post media {pm.id} ({pm.file.name})")
        pm.delete()

    # 3. Clean Reels
    print("\nCleaning reels...")
    for reel in Reel.objects.all():
        print(f"Deleting reel {reel.id} ({reel.video.name})")
        reel.delete()

    # 4. Clean Stories
    print("\nCleaning stories...")
    for story in Story.objects.all():
        print(f"Deleting story {story.id} ({story.media.name})")
        story.delete()

    print("\nDatabase media cleanup complete!")

if __name__ == '__main__':
    main()
