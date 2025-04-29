from django.shortcuts import render

from .models import Follow, Like, Post
from .serializers import UserSerializer, PostSerializer
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework.exceptions import NotFound
from rest_framework.decorators import api_view, permission_classes
from django.db import models

class RegisterUserView(generics.CreateAPIView):

    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            "user": UserSerializer(user).data,
            "message": "User created successfully"
        }, status=status.HTTP_201_CREATED)
    
class RetrieveUserView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        username = self.kwargs.get('username')
        try:
            return User.objects.get(username=username)
        except User.DoesNotExist:
            raise NotFound(detail="User not found")
    
class PostCreateView(generics.CreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class FollowUserView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, username, *args, **kwargs):
        try:
            user_to_follow = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if user_to_follow == request.user:
            return Response({"error": "You cannot follow yourself"}, status=status.HTTP_400_BAD_REQUEST)

        follow, created = Follow.objects.get_or_create(
            follower=request.user,
            following=user_to_follow
        )

        if created:
            return Response({"message": f"You are now following {username}"}, status=status.HTTP_201_CREATED)
        else:
            return Response({"message": f"You are already following {username}"}, status=status.HTTP_200_OK)
        
class UnfollowUserView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def destroy(self, request, username, *args, **kwargs):
        try:
            user_to_unfollow = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if user_to_unfollow == request.user:
            return Response({"error": "You cannot unfollow yourself"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            follow = Follow.objects.get(follower=request.user, following=user_to_unfollow)
            follow.delete()
            return Response({"message": f"You have unfollowed {username}"}, status=status.HTTP_200_OK)
        except Follow.DoesNotExist:
            return Response({"error": f"You are not following {username}"}, status=status.HTTP_400_BAD_REQUEST)
        
class ListUserFollowsView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return User.objects.filter(followers__follower=user)

class FeedListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PostSerializer

    def get_queryset(self):
        following_users = Follow.objects.filter(follower=self.request.user).values_list('following_id', flat=True)
        return Post.objects.filter(author__in=following_users).order_by('-created_at')
    
class LikePostView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id, *args, **kwargs):
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

        like, created = Like.objects.get_or_create(user=request.user, post=post)
        if created:
            post.likes = models.F('likes') + 1
            post.save(update_fields=['likes'])
            post.refresh_from_db(fields=['likes'])
            return Response({"message": "Post liked", "likes": post.likes}, status=status.HTTP_201_CREATED)
        else:
            return Response({"message": "Already liked", "likes": post.likes}, status=status.HTTP_200_OK)

class UnlikePostView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, post_id, *args, **kwargs):
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            like = Like.objects.get(user=request.user, post=post)
            like.delete()
            post.likes = models.F('likes') - 1
            post.save(update_fields=['likes'])
            post.refresh_from_db(fields=['likes'])
            return Response({"message": "Post unliked", "likes": post.likes}, status=status.HTTP_200_OK)
        except Like.DoesNotExist:
            return Response({"error": "You haven't liked this post"}, status=status.HTTP_400_BAD_REQUEST)
