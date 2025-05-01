from django.urls import path
from .views import FeedListView, FollowUserView, LikePostView, ListUserFollowsView, PostCreateView, PostUpdateView, RegisterUserView, RetrieveUserView, UnfollowUserView, UnlikePostView, UserPostsView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


urlpatterns = [
    path('user/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user/register/', RegisterUserView.as_view(), name='register'),
    path('user/info/', RetrieveUserView.as_view(), name='user_info'),
    path('posts/', PostCreateView.as_view(), name='create_post'),
    path('user/follow/<str:username>/', FollowUserView.as_view(), name='follow_user'),
    path('user/unfollow/<str:username>/', UnfollowUserView.as_view(), name='unfollow_user'),
    path('user/follows/', ListUserFollowsView.as_view(), name='list_user_follows'),
    path('user/feed/', FeedListView.as_view(), name='feed'),
    path('posts/like/<int:post_id>/', LikePostView.as_view(), name='like-post'),
    path('posts/unlike/<int:post_id>/', UnlikePostView.as_view(), name='unlike-post'),
    path('posts/edit/<int:pk>/', PostUpdateView.as_view(), name='update_post'),
    path('posts/<str:username>/', UserPostsView.as_view(), name='retrieve_post'),
]