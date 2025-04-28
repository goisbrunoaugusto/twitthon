from .models import Post
from rest_framework import serializers
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'date_joined')
        extra_kwargs = {'password': {'write_only': True},
                        'date_joined': {'read_only': True},
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
        )
        return user
    
class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ('id', 'author', 'content', 'image', 'created_at', 'likes')
        extra_kwargs = {'author': {'read_only': True},
                        'created_at': {'read_only': True},
                        'likes': {'read_only': True},
        }