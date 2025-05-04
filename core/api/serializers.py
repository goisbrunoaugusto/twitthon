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
    author = serializers.CharField(source='author.username', read_only=True)
    content = serializers.CharField(required=False, allow_blank=True)
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Post
        fields = ('id', 'author', 'content', 'image', 'created_at', 'likes')
    
    def validate(self, data):
        content = data.get('content', '')
        image = data.get('image', None)
        if not content and not image:
            raise serializers.ValidationError("Either content or image must be provided.")
        return data