from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from .models import Post, Follow, Like


class UserRegistrationTests(APITestCase):
    def test_register_user_success(self):
        """
        Ensure we can create a new user account.
        """
        url = reverse('register')
        data = {
            'username': 'newuser',
            'password': 'password123',
            'email': 'newuser@example.com'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().username, 'newuser')
        self.assertIn('user', response.data)
        self.assertIn('message', response.data)
        
    def test_register_duplicate_username(self):
        """
        Ensure registration fails with duplicate username.
        """
        
        User.objects.create_user(username='existinguser', password='password123', email='existing@example.com')
        
        url = reverse('register')
        data = {
            'username': 'existinguser',  
            'password': 'differentpassword',
            'email': 'different@example.com'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(User.objects.count(), 1)  


class UserAuthenticationTests(APITestCase):
    def setUp(self):
        
        self.user = User.objects.create_user(
            username='testuser',
            password='testpassword',
            email='test@example.com'
        )
    
    def test_login_success(self):
        """
        Ensure we can obtain a JWT token with valid credentials.
        """
        url = reverse('token_obtain_pair')
        data = {
            'username': 'testuser',
            'password': 'testpassword'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
    
    def test_login_invalid_credentials(self):
        """
        Ensure login fails with invalid credentials.
        """
        url = reverse('token_obtain_pair')
        data = {
            'username': 'testuser',
            'password': 'wrongpassword'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserInfoTests(APITestCase):
    def setUp(self):
        
        self.user1 = User.objects.create_user(
            username='user1',
            password='password123',
            email='user1@example.com'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            password='password123',
            email='user2@example.com'
        )
        
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.user1)
    
    def test_get_user_by_id(self):
        """
        Test retrieving user info by ID.
        """
        url = f"{reverse('user_info', kwargs={'user_identifier':self.user2.id})}"
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'user2')
    
    def test_get_user_by_username(self):
        """
        Test retrieving user info by username.
        """
        url = f"{reverse('user_info', kwargs={'user_identifier':'user2'})}"
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'user2@example.com')
    
    def test_get_nonexistent_user(self):
        """
        Test retrieving info for a non-existent user.
        """
        url = f"{reverse('user_info', kwargs={'user_identifier':'nonexistent'})}"
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class PostTests(APITestCase):
    def setUp(self):
        
        self.user1 = User.objects.create_user(
            username='user1',
            password='password123',
            email='user1@example.com'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            password='password123',
            email='user2@example.com'
        )
        
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.user1)
        
        
        self.post1 = Post.objects.create(author=self.user1, content="Post by user1")
        self.post2 = Post.objects.create(author=self.user2, content="Post by user2")
    
    def test_create_post(self):
        """
        Test creating a new post.
        """
        url = reverse('create_post')
        data = {'content': 'This is a test post'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Post.objects.count(), 3)  
        self.assertEqual(response.data['content'], 'This is a test post')
        self.assertEqual(response.data['author'], self.user1.username)
    
    def test_delete_own_post(self):
        """
        Test deleting user's own post.
        """
        url = reverse('delete_post', kwargs={'post_id': self.post1.id})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Post.objects.count(), 1)  
        self.assertFalse(Post.objects.filter(id=self.post1.id).exists())
    
    def test_delete_other_user_post(self):
        """
        Test attempting to delete another user's post.
        """
        url = reverse('delete_post', kwargs={'post_id': self.post2.id})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Post.objects.count(), 2)  
        self.assertTrue(Post.objects.filter(id=self.post2.id).exists())
    
    def test_update_post(self):
        """
        Test updating a post's content.
        """
        url = reverse('update_post', kwargs={'post_id': self.post1.id})
        data = {'content': 'Updated post content'}
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['content'], 'Updated post content')
        
        
        self.post1.refresh_from_db()
        self.assertEqual(self.post1.content, 'Updated post content')
    
    def test_update_other_user_post(self):
        """
        Test attempting to update another user's post.
        """
        url = reverse('update_post', kwargs={'post_id': self.post2.id})
        data = {'content': 'Should not update'}
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        
        self.post2.refresh_from_db()
        self.assertEqual(self.post2.content, 'Post by user2')


class FollowTests(APITestCase):
    def setUp(self):
        
        self.user1 = User.objects.create_user(
            username='user1',
            password='password123',
            email='user1@example.com'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            password='password123',
            email='user2@example.com'
        )
        self.user3 = User.objects.create_user(
            username='user3',
            password='password123',
            email='user3@example.com'
        )
        
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.user1)
    
    def test_follow_user(self):
        """
        Test following another user.
        """
        url = reverse('follow_user', kwargs={'username': self.user2.username})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Follow.objects.filter(follower=self.user1, following=self.user2).exists())
    
    def test_follow_self(self):
        """
        Test attempting to follow oneself.
        """
        url = reverse('follow_user', kwargs={'username': self.user1.username})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Follow.objects.filter(follower=self.user1, following=self.user1).exists())
    
    def test_follow_already_following(self):
        """
        Test following a user who is already being followed.
        """
        
        Follow.objects.create(follower=self.user1, following=self.user2)
        
        url = reverse('follow_user', kwargs={'username': self.user2.username})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertEqual(Follow.objects.filter(follower=self.user1, following=self.user2).count(), 1)
    
    def test_unfollow_user(self):
        """
        Test unfollowing a user.
        """
        
        Follow.objects.create(follower=self.user1, following=self.user2)
        
        url = reverse('follow_user', kwargs={'username': self.user2.username})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Follow.objects.filter(follower=self.user1, following=self.user2).exists())
    
    def test_unfollow_not_following(self):
        """
        Test attempting to unfollow a user who is not being followed.
        """
        url = reverse('follow_user', kwargs={'username': self.user2.username})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_list_follows(self):
        """
        Test listing users that the authenticated user follows.
        """
        
        Follow.objects.create(follower=self.user1, following=self.user2)
        Follow.objects.create(follower=self.user1, following=self.user3)
        
        url = reverse('list_user_follows')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        
        usernames = [user['username'] for user in response.data['results']]
        self.assertIn('user2', usernames)
        self.assertIn('user3', usernames)


class FeedTests(APITestCase):
    def setUp(self):
        
        self.user1 = User.objects.create_user(
            username='user1',
            password='password123',
            email='user1@example.com'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            password='password123',
            email='user2@example.com'
        )
        self.user3 = User.objects.create_user(
            username='user3',
            password='password123',
            email='user3@example.com'
        )
        
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.user1)
        
        
        Follow.objects.create(follower=self.user1, following=self.user2)
        
        
        
        self.post1 = Post.objects.create(author=self.user1, content="User1's post")
        self.post2 = Post.objects.create(author=self.user2, content="User2's post")
        self.post3 = Post.objects.create(author=self.user3, content="User3's post")
    
    def test_feed_content(self):
        """
        Test that the feed contains posts from self and followed users only.
        """
        url = reverse('feed')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)  
        
        
        contents = [post['content'] for post in response.data['results']]
        self.assertIn("User1's post", contents)
        self.assertIn("User2's post", contents)
        self.assertNotIn("User3's post", contents)


class UserPostsTests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='testuser1', password='password123', email='testuser1@email.com')
        self.user2 = User.objects.create_user(username='testuser2', password='password456', email='testuser2@email.com')
        self.client.force_authenticate(user=self.user1)

        Post.objects.create(author=self.user1, content="User1 post 1")
        Post.objects.create(author=self.user1, content="User1 post 2")
        Post.objects.create(author=self.user2, content="User2 post")

    def test_get_posts_by_username(self):
        """
        Test retrieving posts by username in the URL path.
        """
        url = reverse('retrieve_posts', kwargs={'user_identifier': self.user2.username})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)  # Assuming ListAPIView returns a list directly
        self.assertEqual(response.data['results'][0]['content'], "User2 post")
        self.assertEqual(response.data['results'][0]['author'], self.user2.username) # Verify author ID

    def test_get_posts_by_id(self):
        """
        Test retrieving posts by user ID in the URL path.
        """
        url = reverse('retrieve_posts', kwargs={'user_identifier': str(self.user1.id)})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2) # Assuming ListAPIView returns a list directly
        contents = [post['content'] for post in response.data['results']]
        author_usernames = [post['author'] for post in response.data['results']]
        self.assertIn("User1 post 1", contents)
        self.assertIn("User1 post 2", contents)
        self.assertTrue(all(author_username == self.user1.username for author_username in author_usernames)) # Verify all posts are by user1

    def test_get_posts_by_invalid_username(self):
        """
        Test retrieving posts with an invalid username.
        """
        url = reverse('retrieve_posts', kwargs={'user_identifier': 'nonexistentuser'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_posts_by_invalid_id(self):
        """
        Test retrieving posts with an invalid user ID.
        """
        url = reverse('retrieve_posts', kwargs={'user_identifier': '999'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)



class LikeTests(APITestCase):
    def setUp(self):
        
        self.user1 = User.objects.create_user(
            username='user1',
            password='password123',
            email='user1@example.com'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            password='password123',
            email='user2@example.com'
        )
        
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.user1)
        
        
        self.post = Post.objects.create(author=self.user2, content="Test post", likes=0)
    
    def test_like_post(self):
        """
        Test liking a post.
        """
        url = reverse('like-post', kwargs={'post_id': self.post.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Like.objects.filter(user=self.user1, post=self.post).exists())
        
        
        self.post.refresh_from_db()
        self.assertEqual(self.post.likes, 1)
    
    def test_like_already_liked_post(self):
        """
        Test liking a post that's already liked.
        """
        
        Like.objects.create(user=self.user1, post=self.post)
        self.post.likes = 1
        self.post.save()
        
        url = reverse('like-post', kwargs={'post_id': self.post.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Like.objects.filter(user=self.user1, post=self.post).count(), 1)
        
        
        self.post.refresh_from_db()
        self.assertEqual(self.post.likes, 1)
    
    def test_unlike_post(self):
        """
        Test unliking a previously liked post.
        """
        
        Like.objects.create(user=self.user1, post=self.post)
        self.post.likes = 1
        self.post.save()
        
        url = reverse('like-post', kwargs={'post_id': self.post.id})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Like.objects.filter(user=self.user1, post=self.post).exists())
        
        
        self.post.refresh_from_db()
        self.assertEqual(self.post.likes, 0)
    
    def test_unlike_not_liked_post(self):
        """
        Test attempting to unlike a post that hasn't been liked.
        """
        url = reverse('like-post', kwargs={'post_id': self.post.id})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        
        self.post.refresh_from_db()
        self.assertEqual(self.post.likes, 0)