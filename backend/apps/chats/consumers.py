import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Send initial success message
        await self.send_json({
            'status': 'connected',
            'room': self.room_name,
            'message': 'Connected to Nexora Realtime Room'
        })

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive_json(self, content):
        action = content.get('type')
        
        # Actions: chat_message, typing, seen, reaction
        if action == 'chat_message':
            message = content.get('message', '')
            sender = content.get('sender', 'Anonymous')
            media_url = content.get('media_url', '')
            media_type = content.get('media_type', '') # image, video, audio
            reply_to = content.get('reply_to', None)
            
            # Broadcast to the group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'send_chat_message',
                    'message': message,
                    'sender': sender,
                    'media_url': media_url,
                    'media_type': media_type,
                    'reply_to': reply_to
                }
            )
        elif action == 'typing':
            sender = content.get('sender', 'Anonymous')
            is_typing = content.get('is_typing', False)
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'send_typing_status',
                    'sender': sender,
                    'is_typing': is_typing
                }
            )
        elif action == 'seen':
            message_id = content.get('message_id')
            user = content.get('user', '')
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'send_seen_status',
                    'message_id': message_id,
                    'user': user
                }
            )
        elif action == 'reaction':
            message_id = content.get('message_id')
            user = content.get('user', '')
            reaction = content.get('reaction', '')
            is_removed = content.get('is_removed', False)
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'send_reaction',
                    'message_id': message_id,
                    'user': user,
                    'reaction': reaction,
                    'is_removed': is_removed
                }
            )

    # Receive message from room group
    async def send_chat_message(self, event):
        await self.send_json({
            'type': 'chat_message',
            'message': event['message'],
            'sender': event['sender'],
            'media_url': event['media_url'],
            'media_type': event['media_type'],
            'reply_to': event['reply_to']
        })

    async def send_typing_status(self, event):
        await self.send_json({
            'type': 'typing',
            'sender': event['sender'],
            'is_typing': event['is_typing']
        })

    async def send_seen_status(self, event):
        await self.send_json({
            'type': 'seen',
            'message_id': event['message_id'],
            'user': event['user']
        })

    async def send_reaction(self, event):
        await self.send_json({
            'type': 'reaction',
            'message_id': event['message_id'],
            'user': event['user'],
            'reaction': event['reaction'],
            'is_removed': event['is_removed']
        })


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.group_name = 'global_notifications'
        
        # Join global group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        
        await self.send_json({
            'status': 'connected',
            'message': 'Connected to Nexora Global Notification Stream'
        })

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    # Receive notification event and forward to client
    async def send_notification(self, event):
        await self.send_json({
            'type': 'notification',
            'notification_type': event['notification_type'], # like, comment, follow, mention, message
            'sender': event['sender'],
            'message': event['message'],
            'target_id': event.get('target_id'),
            'created_at': event.get('created_at')
        })
