from django.urls import path
from .views import (CheckFollowingStatusView, FeedListView, FollowUserView, LikeView, ListUserFollowsView,
PostCreateView, PostDeleteView, PostUpdateView, RegisterUserView, RetrieveUserView,
 UserPostsView)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


urlpatterns = [
    path('users/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('users/register/', RegisterUserView.as_view(), name='register'),
    path('users/<user_identifier>/info/', RetrieveUserView.as_view(), name='user_info'),
    path('users/<str:username>/follow/', FollowUserView.as_view(), name='follow_user'),
    path('users/follows/', ListUserFollowsView.as_view(), name='list_user_follows'),
    path('users/<user_identifier>/following-status/', CheckFollowingStatusView.as_view(), name='check_following_status'),
    path('users/feed/', FeedListView.as_view(), name='feed'),
    path('users/<user_identifier>/posts/', UserPostsView.as_view(), name='retrieve_posts'),
    path('posts/', PostCreateView.as_view(), name='create_post'),
    path('posts/<int:post_id>/', PostDeleteView.as_view(), name='delete_post'),
    path('posts/<int:post_id>/like/', LikeView.as_view(), name='like-post'),
    path('posts/<int:post_id>/edit/', PostUpdateView.as_view(), name='update_post'),
]