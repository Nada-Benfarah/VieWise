from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import SubscriberViewSet, SubscriptionViewSet, PlanViewSet
from .views import CurrentUserPlanView
from .views import UpgradePlanView

router = DefaultRouter()
router.register(r'subscribers', SubscriberViewSet)
router.register(r'subscriptions', SubscriptionViewSet)
router.register(r'plans', PlanViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('my-plan/', CurrentUserPlanView.as_view()),
    path('upgrade-plan/', UpgradePlanView.as_view()),
]
