from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatRoom(models.Model):
    title = models.CharField(max_length=150, blank=True, null=True, help_text="Null for 1-to-1 rooms")
    is_group = models.BooleanField(default=False)
    avatar = models.ImageField(upload_to='chat_groups/', blank=True, null=True)
    description = models.TextField(blank=True, max_length=500)
    creator = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='created_rooms')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.is_group:
            return f"Group Room: {self.title}"
        return f"1-to-1 Chat Room #{self.id}"


class ChatMember(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_memberships')
    joined_at = models.DateTimeField(auto_now_add=True)
    
    # Administrative control
    is_admin = models.BooleanField(default=False)
    
    # Custom preferences per member
    is_pinned = models.BooleanField(default=False)
    is_muted = models.BooleanField(default=False)

    class Meta:
        unique_together = ('room', 'user')

    def __str__(self):
        role = "Admin" if self.is_admin else "Member"
        return f"{self.user.username} in {self.room} ({role})"


class Message(models.Model):
    MEDIA_TYPES = (
        ('text', 'Text'),
        ('image', 'Image'),
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('file', 'File'),
    )
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField(blank=True, max_length=4000)
    
    # Media message support
    media_file = models.FileField(upload_to='chat_media/', blank=True, null=True)
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES, default='text')
    
    # Nesting/replying and forwarding
    reply_to = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True, related_name='replies')
    is_forwarded = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    # Read status details
    seen_by = models.ManyToManyField(User, related_name='seen_messages', blank=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        sender_name = self.sender.username
        snippet = self.content[:35] if self.content else f"[Media: {self.media_type}]"
        return f"{sender_name}: {snippet} ({self.created_at.strftime('%H:%M')})"


class MessageReaction(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='message_reactions')
    reaction = models.CharField(max_length=20, help_text="Emoji character (e.g. ❤️)")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message', 'user')

    def __str__(self):
        return f"{self.user.username} reacted {self.reaction} to message #{self.message.id}"
