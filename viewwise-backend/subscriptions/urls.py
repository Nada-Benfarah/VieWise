from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import SubscriberViewSet, SubscriptionViewSet, PlanViewSet
from .views import CurrentUserPlanView

router = DefaultRouter()
router.register(r'subscribers', SubscriberViewSet)
router.register(r'subscriptions', SubscriptionViewSet)
router.register(r'plans', PlanViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('my-plan/', CurrentUserPlanView.as_view()),
]
