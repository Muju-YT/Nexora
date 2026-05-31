from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Profile


# Custom User Admin (recommended for AbstractBaseUser)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'is_staff', 'is_active', 'is_email_verified')
    search_fields = ('email', 'username')
    ordering = ('email',)

    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'is_superuser')}),
        ('Extra Info', {'fields': ('is_email_verified', 'otp_code', 'otp_created_at', 'last_activity')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'is_staff', 'is_active')
        }),
    )


# Register User properly
admin.site.register(User, UserAdmin)


# Safe Profile Admin (avoid crash in production)
@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_verified', 'created_at')
    search_fields = ('user__email', 'user__username')
    list_filter = ('is_verified',)

    # IMPORTANT: prevents admin crash from heavy relations
    exclude = ('followers', 'blocked_users', 'muted_users')