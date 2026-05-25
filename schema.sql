-- =========================================================================
-- Nexora Database Schema (MySQL 8.0+)
-- =========================================================================

CREATE DATABASE IF NOT EXISTS nexora_db;
USE nexora_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    password VARCHAR(128) NOT NULL,
    last_login DATETIME(6) NULL,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(150) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL DEFAULT '',
    last_name VARCHAR(100) NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    date_joined DATETIME(6) NOT NULL,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    otp_code VARCHAR(6) NULL,
    otp_created_at DATETIME(6) NULL,
    INDEX idx_user_email (email),
    INDEX idx_user_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS users_profile (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    avatar VARCHAR(100) NULL,
    cover_photo VARCHAR(100) NULL,
    bio TEXT NULL,
    website VARCHAR(200) NOT NULL DEFAULT '',
    location VARCHAR(100) NOT NULL DEFAULT '',
    profession VARCHAR(100) NOT NULL DEFAULT '',
    interests JSON NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Profile Social Graph (Followers)
CREATE TABLE IF NOT EXISTS users_profile_followers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    from_profile_id BIGINT NOT NULL,
    to_profile_id BIGINT NOT NULL,
    UNIQUE KEY unique_followers (from_profile_id, to_profile_id),
    FOREIGN KEY (from_profile_id) REFERENCES users_profile(id) ON DELETE CASCADE,
    FOREIGN KEY (to_profile_id) REFERENCES users_profile(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Posts Table
CREATE TABLE IF NOT EXISTS posts_post (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    caption TEXT NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    hashtags VARCHAR(255) NOT NULL DEFAULT '',
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users_user(id) ON DELETE CASCADE,
    INDEX idx_post_created (created_at),
    INDEX idx_post_pinned (is_pinned)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Post Media Table
CREATE TABLE IF NOT EXISTS posts_postmedia (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL,
    file VARCHAR(100) NOT NULL,
    file_type VARCHAR(10) NOT NULL DEFAULT 'image',
    order_val INT UNSIGNED NOT NULL DEFAULT 0,
    FOREIGN KEY (post_id) REFERENCES posts_post(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Likes Table
CREATE TABLE IF NOT EXISTS posts_like (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    UNIQUE KEY unique_post_like (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts_post(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Comments Table
CREATE TABLE IF NOT EXISTS posts_comment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    parent_id BIGINT NULL,
    content TEXT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts_post(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users_user(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES posts_comment(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Saved Posts Table
CREATE TABLE IF NOT EXISTS posts_savedpost (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    UNIQUE KEY unique_saved_post (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts_post(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Poll Table
CREATE TABLE IF NOT EXISTS posts_poll (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL UNIQUE,
    question VARCHAR(255) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts_post(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Poll Options Table
CREATE TABLE IF NOT EXISTS posts_polloption (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    poll_id BIGINT NOT NULL,
    text VARCHAR(100) NOT NULL,
    FOREIGN KEY (poll_id) REFERENCES posts_poll(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Poll Votes Table
CREATE TABLE IF NOT EXISTS posts_pollvote (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    option_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    UNIQUE KEY unique_poll_vote (option_id, user_id),
    FOREIGN KEY (option_id) REFERENCES posts_polloption(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Stories Table
CREATE TABLE IF NOT EXISTS stories_story (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    media VARCHAR(100) NOT NULL,
    media_type VARCHAR(10) NOT NULL DEFAULT 'image',
    caption VARCHAR(150) NOT NULL DEFAULT '',
    created_at DATETIME(6) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users_user(id) ON DELETE CASCADE,
    INDEX idx_story_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Reels Table
CREATE TABLE IF NOT EXISTS reels_reel (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    video VARCHAR(100) NOT NULL,
    caption TEXT NULL,
    views_count INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Chats Rooms Table
CREATE TABLE IF NOT EXISTS chats_chatroom (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NULL,
    is_group BOOLEAN NOT NULL DEFAULT FALSE,
    avatar VARCHAR(100) NULL,
    description TEXT NULL,
    creator_id BIGINT NULL,
    created_at DATETIME(6) NOT NULL,
    FOREIGN KEY (creator_id) REFERENCES users_user(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Messages Table
CREATE TABLE IF NOT EXISTS chats_message (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    content TEXT NULL,
    media_file VARCHAR(100) NULL,
    media_type VARCHAR(10) NOT NULL DEFAULT 'text',
    reply_to_id BIGINT NULL,
    is_forwarded BOOLEAN NOT NULL DEFAULT FALSE,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL,
    FOREIGN KEY (room_id) REFERENCES chats_chatroom(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users_user(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_id) REFERENCES chats_message(id) ON DELETE SET NULL,
    INDEX idx_message_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Notifications Table
CREATE TABLE IF NOT EXISTS notifications_notification (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipient_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    notification_type VARCHAR(20) NOT NULL,
    message VARCHAR(255) NOT NULL,
    target_id VARCHAR(50) NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL,
    FOREIGN KEY (recipient_id) REFERENCES users_user(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users_user(id) ON DELETE CASCADE,
    INDEX idx_notification_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
