import os
import sqlite3
import django

# Setup Django (which connects to Postgres via settings)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nexora_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from apps.users.models import Profile
from apps.posts.models import Post, PostMedia
from apps.reels.models import Reel
from apps.stories.models import Story

User = get_user_model()

# Connect to local SQLite database
sqlite_conn = sqlite3.connect('db.sqlite3')
sqlite_conn.row_factory = sqlite3.Row
sqlite_cur = sqlite_conn.cursor()

def upload_local_file_to_cloudinary(local_rel_path):
    if not local_rel_path:
        return None
    local_path = os.path.join('media', local_rel_path)
    if os.path.exists(local_path):
        print(f"Uploading {local_path} to Cloudinary...")
        try:
            with open(local_path, 'rb') as f:
                content = ContentFile(f.read(), name=os.path.basename(local_rel_path))
                return content
        except Exception as e:
            print(f"Error reading local file {local_path}: {e}")
            return None
    else:
        print(f"Warning: local file {local_path} not found.")
        return None

def sync_users_and_profiles():
    print("Syncing Users and Profiles...")
    sqlite_cur.execute('SELECT * FROM users_user')
    sqlite_users = sqlite_cur.fetchall()
    
    user_map = {}
    
    for sq_user in sqlite_users:
        username = sq_user['username']
        email = sq_user['email']
        
        # Check if user exists in Postgres
        pg_user = User.objects.filter(username=username).first()
        if not pg_user:
            pg_user = User.objects.filter(email=email).first()
            
        if not pg_user:
            print(f"Creating user {username} ({email}) on Postgres...")
            pg_user = User.objects.create_user(
                username=username,
                email=email,
                password=sq_user['password'],
                first_name=sq_user['first_name'],
                last_name=sq_user['last_name']
            )
            pg_user.is_active = bool(sq_user['is_active'])
            pg_user.is_staff = bool(sq_user['is_staff'])
            pg_user.save()
        else:
            print(f"User {username} already exists on Postgres.")
            
        user_map[sq_user['id']] = pg_user
        
        # Sync profile details
        sqlite_cur.execute('SELECT * FROM users_profile WHERE user_id = ?', (sq_user['id'],))
        sq_profile = sqlite_cur.fetchone()
        if sq_profile:
            pg_profile, created = Profile.objects.get_or_create(user=pg_user)
            pg_profile.bio = sq_profile['bio'] or ''
            pg_profile.website = sq_profile['website'] or ''
            pg_profile.location = sq_profile['location'] or ''
            pg_profile.profession = sq_profile['profession'] or ''
            pg_profile.is_verified = bool(sq_profile['is_verified'])
            
            # Upload avatar and cover photo if present in SQLite and missing in Postgres
            if sq_profile['avatar'] and not pg_profile.avatar:
                avatar_file = upload_local_file_to_cloudinary(sq_profile['avatar'])
                if avatar_file:
                    pg_profile.avatar.save(os.path.basename(sq_profile['avatar']), avatar_file, save=False)
            if sq_profile['cover_photo'] and not pg_profile.cover_photo:
                cover_file = upload_local_file_to_cloudinary(sq_profile['cover_photo'])
                if cover_file:
                    pg_profile.cover_photo.save(os.path.basename(sq_profile['cover_photo']), cover_file, save=False)
            
            pg_profile.save()
            
    return user_map

def sync_posts(user_map):
    print("\nSyncing Posts and PostMedia...")
    sqlite_cur.execute('SELECT * FROM posts_post')
    sqlite_posts = sqlite_cur.fetchall()
    
    for sq_post in sqlite_posts:
        author = user_map.get(sq_post['user_id'])
        if not author:
            print(f"Error: Author with ID {sq_post['user_id']} not found in user map.")
            continue
            
        pg_post = Post.objects.filter(user=author, caption=sq_post['caption'] or '').first()
        if not pg_post:
            print(f"Creating post by {author.username} on Postgres...")
            pg_post = Post.objects.create(
                user=author,
                caption=sq_post['caption'] or '',
                is_pinned=bool(sq_post['is_pinned']),
                hashtags=sq_post['hashtags'] or '',
                created_at=sq_post['created_at'],
                updated_at=sq_post['updated_at']
            )
            # Override created_at/updated_at explicitly
            Post.objects.filter(id=pg_post.id).update(created_at=sq_post['created_at'], updated_at=sq_post['updated_at'])
            
            # Sync PostMedia
            sqlite_cur.execute('SELECT * FROM posts_postmedia WHERE post_id = ?', (sq_post['id'],))
            sqlite_media = sqlite_cur.fetchall()
            for sq_m in sqlite_media:
                media_file = upload_local_file_to_cloudinary(sq_m['file'])
                if media_file:
                    pm = PostMedia(
                        post=pg_post,
                        file_type=sq_m['file_type'],
                        order=sq_m['order_val']
                    )
                    pm.file.save(os.path.basename(sq_m['file']), media_file, save=True)
                    print(f"Uploaded and saved media for post {pg_post.id}")
        else:
            print(f"Post by {author.username} already exists.")

def sync_reels(user_map):
    print("\nSyncing Reels...")
    sqlite_cur.execute('SELECT * FROM reels_reel')
    sqlite_reels = sqlite_cur.fetchall()
    
    for sq_reel in sqlite_reels:
        author = user_map.get(sq_reel['user_id'])
        if not author:
            print(f"Error: Author with ID {sq_reel['user_id']} not found in user map.")
            continue
            
        pg_reel = Reel.objects.filter(user=author, caption=sq_reel['caption'] or '').first()
        if not pg_reel:
            print(f"Creating reel by {author.username} on Postgres...")
            video_file = upload_local_file_to_cloudinary(sq_reel['video'])
            if video_file:
                pg_reel = Reel(
                    user=author,
                    caption=sq_reel['caption'] or '',
                    views_count=sq_reel['views_count'] or 0,
                    created_at=sq_reel['created_at']
                )
                pg_reel.video.save(os.path.basename(sq_reel['video']), video_file, save=True)
                Reel.objects.filter(id=pg_reel.id).update(created_at=sq_reel['created_at'])
                print(f"Uploaded and saved reel {pg_reel.id}")
        else:
            print(f"Reel by {author.username} already exists.")

def main():
    try:
        user_map = sync_users_and_profiles()
        sync_posts(user_map)
        sync_reels(user_map)
        print("\nRestore and Cloudinary sync complete!")
    finally:
        sqlite_conn.close()

if __name__ == '__main__':
    main()
