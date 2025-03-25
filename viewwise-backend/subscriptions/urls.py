from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubscriberViewSet, SubscriptionViewSet

router = DefaultRouter()
router.register(r'subscribers', SubscriberViewSet)
router.register(r'subscriptions', SubscriptionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
