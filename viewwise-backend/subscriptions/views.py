from rest_framework import viewsets
from .models import Subscriber, Subscription, Plan
from .serializers import SubscriberSerializer, SubscriptionSerializer, PlanSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import date, timedelta

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

class UpgradePlanView(APIView):

    def post(self, request):
        user = request.user
        plan_name = request.data.get('plan_name')

        if not plan_name:
            return Response({"error": "Plan name is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            plan = Plan.objects.get(name=plan_name)
        except Plan.DoesNotExist:
            return Response({"error": "Plan not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            subscriber, created = Subscriber.objects.get_or_create(
                    user=user,
                )
        except Subscriber.DoesNotExist:
            return Response({"error": "Subscriber not found."}, status=status.HTTP_404_NOT_FOUND)

        # Désactiver l'ancien abonnement
        Subscription.objects.filter(subscriber=subscriber, is_active=True).update(is_active=False)

        today = date.today()
        end_date = today + timedelta(days=30)

        Subscription.objects.create(
            subscriber=subscriber,
            plan=plan,
            start_date=today,
            end_date=end_date,
            is_active=True
        )

        return Response({"message": f"Subscription to {plan.name} created successfully."}, status=status.HTTP_201_CREATED)
