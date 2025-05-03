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
from django.db.models import Q
from rest_framework.permissions import BasePermission
from rest_framework.views import APIView

class IsAuthor(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.author == request.user

class PostUpdateView(generics.UpdateAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated, IsAuthor]

    def get_object(self):
        post_id = self.kwargs.get('post_id')
        try:
            post = Post.objects.get(pk=post_id)
        except Post.DoesNotExist:
            raise NotFound("Post not found")
        self.check_object_permissions(self.request, post)
        return post

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
    
class RetrieveUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user_id = request.GET.get('id')
        username = request.GET.get('username')
        try:
            if user_id:
                user = User.objects.get(pk=user_id)
            elif username:
                user = User.objects.get(username=username)
            else:
                raise NotFound(detail="No id or username provided")
            serializer = UserSerializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            raise NotFound(detail="User not found")
    
class PostCreateView(generics.CreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class FollowUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, username):
        try:
            user_to_follow = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User to follow not found"}, status=status.HTTP_404_NOT_FOUND)

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

    def delete(self, request, username):
        try:
            user_to_unfollow = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User to unfollow not found"}, status=status.HTTP_404_NOT_FOUND)

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
        return Post.objects.filter(
            Q(author__in=following_users) | Q(author=self.request.user)
        ).order_by('-created_at')
    
class UserPostsView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_identifier = self.kwargs.get('user_identifier')

        try:
            user_id = int(user_identifier)
            try:
                user = User.objects.get(pk=user_id)
                return Post.objects.filter(author=user).order_by('-created_at')
            except User.DoesNotExist:
                raise NotFound(f"User with ID '{user_id}' not found")
        except ValueError:
            try:
                user = User.objects.get(username=user_identifier)
                return Post.objects.filter(author=user).order_by('-created_at')
            except User.DoesNotExist:
                raise NotFound(f"User with username '{user_identifier}' not found")


class PostDeleteView(generics.DestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated, IsAuthor]

    def get_object(self):
        post_id = self.kwargs.get('post_id')
        try:
            post = Post.objects.get(pk=post_id)
        except Post.DoesNotExist:
            raise NotFound("Post not found")
        self.check_object_permissions(self.request, post)
        return post

class LikeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
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
            return Response({"message": "Already liked"}, status=status.HTTP_200_OK)

    def delete(self, request, post_id):
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

