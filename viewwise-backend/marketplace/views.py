from rest_framework import viewsets
from .models import Marketplace
from .serializers import MarketplaceSerializer

class MarketplaceViewSet(viewsets.ModelViewSet):
    queryset = Marketplace.objects.all()
    serializer_class = MarketplaceSerializer