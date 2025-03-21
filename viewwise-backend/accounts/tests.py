from django.urls import reverse
from django.core import mail
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import CustomUser

import re

class AuthenticationTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('register')
        self.login_url = reverse('token_obtain_pair')
        self.confirm_base_url = '/api/auth/confirm-email/'  # base, on ajoutera la clé reçue

    def test_registration_confirmation_and_login_flow(self):
        """Test complet du flux inscription -> confirmation email -> connexion JWT."""
        user_data = {
            "email": "test@example.com",
            "first_name": "Test",
            "last_name": "User",
            "password": "Passw0rd!"
        }
        # 1. Inscription
        response = self.client.post(self.register_url, data=user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Un utilisateur doit avoir été créé en base, mais inactif
        user = CustomUser.objects.get(email="test@example.com")
        self.assertFalse(user.is_active, "Le nouvel utilisateur devrait être inactif avant confirmation")
        # Un email de confirmation doit avoir été envoyé
        self.assertEqual(len(mail.outbox), 1)
        confirm_email = mail.outbox[0]
        self.assertIn("confirm", confirm_email.subject.lower())  # le sujet devrait mentionner la confirmation
        # Le contenu de l'email doit contenir le lien de confirmation avec la clé
        match = re.search(r'/api/auth/confirm-email/(?P<key>[-:\w]+)/', confirm_email.body)
        self.assertIsNotNone(match, "Le mail de confirmation doit contenir l'URL avec la clé")
        confirm_key = match.group('key')
        # 2. Tentative de connexion avant confirmation (doit échouer)
        login_data = {"email": user_data["email"], "password": user_data["password"]}
        login_response = self.client.post(self.login_url, data=login_data, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("No active account", login_response.data.get("detail", ""), "Sans confirmation, la connexion doit être refusée")
        # 3. Confirmation de l'email via l'URL
        confirm_url = f"{self.confirm_base_url}{confirm_key}/"
        confirm_response = self.client.get(confirm_url)
        # La vue allauth ConfirmEmailView redirige après succès (302 vers LOGIN_URL)
        self.assertIn(confirm_response.status_code, (status.HTTP_200_OK, status.HTTP_302_FOUND))
        # Rafraîchir l'utilisateur depuis la base pour voir les changements
        user.refresh_from_db()
        self.assertTrue(user.is_active, "L'utilisateur devrait être actif après confirmation de l'email")
        # 4. Nouvelle tentative de connexion après confirmation (devrait réussir)
        login_response2 = self.client.post(self.login_url, data=login_data, format='json')
        self.assertEqual(login_response2.status_code, status.HTTP_200_OK)
        # On doit recevoir un access token et un refresh token
        tokens = login_response2.data
        self.assertIn('access', tokens)
        self.assertIn('refresh', tokens)
        access_token = tokens['access']
        # 5. Accès à une ressource protégée avec le token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        profile_url = reverse('user-profile')
        profile_response = self.client.get(profile_url)
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_response.data['email'], user_data["email"])
        # 6. Vérification des permissions (un utilisateur normal ne peut pas lister tous les users)
        users_list_url = reverse('user-list')
        list_response = self.client.get(users_list_url)
        self.assertEqual(list_response.status_code, status.HTTP_403_FORBIDDEN)
        # Donner temporairement les droits admin à l'utilisateur pour tester l'accès admin
        user.is_staff = True
        user.save()
        list_response2 = self.client.get(users_list_url)
        self.assertEqual(list_response2.status_code, status.HTTP_200_OK)
        self.assertTrue(len(list_response2.data) >= 1, "La liste des utilisateurs devrait être accessible par un admin")
