import os
import django
from django.core.files.storage import default_storage

# Configure Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nexora_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.posts.models import PostMedia
from apps.reels.models import Reel
from apps.stories.models import Story

User = get_user_model()

def upload_file_if_exists(field, local_rel_path):
    if not field or not local_rel_path:
        return False
    
    # Check if the file is already uploaded to Cloudinary
    try:
        url = field.url
        if url.startswith(('http://', 'https://')) and 'cloudinary' in url:
            print(f"Skipping {field.name} - already on Cloudinary: {url}")
            return True
    except Exception:
        pass
        
    # Check if the file exists in the local media directory
    local_path = os.path.join('media', local_rel_path)
    if os.path.exists(local_path):
        print(f"Found local file for {field.name}: {local_path}. Uploading to Cloudinary...")
        try:
            with open(local_path, 'rb') as f:
                # Save to the configured default storage (Cloudinary)
                saved_name = default_storage.save(local_rel_path, f)
                print(f"Successfully uploaded to Cloudinary as: {saved_name}")
                return True
        except Exception as e:
            print(f"Failed to upload {local_path}: {e}")
            return False
    else:
        print(f"Local file {local_path} not found. Media bytes are missing (likely deleted from Render disk).")
        return False

def main():
    print("Starting migration to Cloudinary...")
    
    # 1. Migrate user avatars and cover photos
    print("\nChecking user profiles...")
    for user in User.objects.all():
        profile = getattr(user, 'profile', None)
        if profile:
            if profile.avatar:
                upload_file_if_exists(profile.avatar, profile.avatar.name)
            if profile.cover_photo:
                upload_file_if_exists(profile.cover_photo, profile.cover_photo.name)

    # 2. Migrate Post media
    print("\nChecking post media...")
    for pm in PostMedia.objects.all():
        if pm.file:
            upload_file_if_exists(pm.file, pm.file.name)

    # 3. Migrate Reels
    print("\nChecking reels...")
    for reel in Reel.objects.all():
        if reel.video:
            upload_file_if_exists(reel.video, reel.video.name)

    # 4. Migrate Stories
    print("\nChecking stories...")
    for story in Story.objects.all():
        if story.media:
            upload_file_if_exists(story.media, story.media.name)

    print("\nMigration check complete!")

if __name__ == '__main__':
    main()
