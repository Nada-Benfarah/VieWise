from rest_framework import viewsets
from .models import Subscriber, Subscription, Plan
from .serializers import SubscriberSerializer, SubscriptionSerializer, PlanSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class SubscriberViewSet(viewsets.ModelViewSet):
    queryset = Subscriber.objects.all()
    serializer_class = SubscriberSerializer

class SubscriptionViewSet(viewsets.ModelViewSet):
    queryset = Subscription.objects.all()
    serializer_class = SubscriptionSerializer

class PlanViewSet(viewsets.ModelViewSet):
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer


class CurrentUserPlanView(APIView):
    def get(self, request):
        try:
            subscriber = Subscriber.objects.get(user=request.user)
            subscription = Subscription.objects.filter(subscriber=subscriber, is_active=True).first()
            if subscription:
                return Response(PlanSerializer(subscription.plan).data)
        except Subscriber.DoesNotExist:
            pass

        try:
            default_plan = Plan.objects.get(name="FREE")
            return Response(PlanSerializer(default_plan).data)
        except Plan.DoesNotExist:
            return Response({
                "name": "FREE",
                "credits_nbr": 100,
                "data_source_size": "10MB",
                "agent_nbr": "1",
                "tools_nbr": "0",
                "price": 0
            }, status=status.HTTP_200_OK)