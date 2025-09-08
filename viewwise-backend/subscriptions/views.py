from rest_framework import viewsets
from .models import Subscriber, Subscription, Plan
from .serializers import SubscriberSerializer, SubscriptionSerializer, PlanSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import date, timedelta
from accounts.permissions import IsAdminOrStaff  # sinon vois note plus bas
from django.db.models import Count
from accounts.models import CustomUser

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

class PlanUserCountsView(APIView):
    """
    Renvoie le nombre d'utilisateurs par plan.
    - Comptabilise les abonnements ACTIFS (is_active=True et date dans l’intervalle).
    - Les utilisateurs sans abonnement actif sont rangés dans 'FREE'.
    """
    permission_classes = [IsAdminOrStaff]  # superuser/staff

    def get(self, request):
        today = date.today()

        # Plans existants (pour retourner 0 si aucun abonné)
        plan_names = list(Plan.objects.values_list('name', flat=True))

        # IDs d’utilisateurs qui ont une souscription active
        active_qs = Subscription.objects.filter(
            is_active=True,
            start_date__lte=today,
            end_date__gte=today
        ).select_related('subscriber', 'plan', 'subscriber__user')

        active_by_plan = (
            active_qs
            .values('plan__name')
            .annotate(count=Count('subscriber', distinct=True))
        )
        counts = {row['plan__name']: row['count'] for row in active_by_plan}

        # Comptage des FREE = utilisateurs sans souscription active
        total_users = CustomUser.objects.filter(is_active=True).count()
        active_user_ids = set(active_qs.values_list('subscriber__user_id', flat=True).distinct())
        free_count = max(total_users - len(active_user_ids), 0)

        # Si FREE n'existe pas comme Plan, on l’ajoute quand même en sortie
        if 'FREE' not in plan_names:
            plan_names.insert(0, 'FREE')

        data = []
        for name in plan_names:
            if name == 'FREE':
                data.append({'name': 'FREE', 'count': free_count})
            else:
                data.append({'name': name, 'count': int(counts.get(name, 0))})

        return Response({'plans': data}, status=status.HTTP_200_OK)