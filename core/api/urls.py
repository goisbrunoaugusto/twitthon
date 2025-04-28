from django.urls import path
from .views import FeedListView, FollowUserView, ListUserFollowsView, PostCreateView, RegisterUserView, RetrieveUserView, UnfollowUserView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterUserView.as_view(), name='register'),
    path('user/<str:username>/', RetrieveUserView.as_view(), name='user_info'),
    path('post/', PostCreateView.as_view(), name='create_post'),
    path('follow/<str:username>/', FollowUserView.as_view(), name='follow_user'),
    path('unfollow/<str:username>/', UnfollowUserView.as_view(), name='unfollow_user'),
    path('follows/', ListUserFollowsView.as_view(), name='list_user_follows'),
    path('feed/', FeedListView.as_view(), name='feed'),
]