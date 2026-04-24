from rest_framework import permissions, response, status, views

from .models import Cart, MenuItem, Order
from .permissions import IsFirebaseAdmin
from .serializers import (
    CartSerializer,
    MenuItemSerializer,
    OrderSerializer,
    OrderStatusSerializer,
)


class HealthView(views.APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, _request):
        return response.Response({'status': 'ok'})


class MeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return response.Response(
            {
                'uid': user.uid,
                'email': user.email,
                'name': user.name,
                'claims': user.claims,
            }
        )


class MenuListCreateView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, _request):
        menu_manager = getattr(MenuItem, 'objects')
        serializer = MenuItemSerializer(menu_manager.all(), many=True)
        return response.Response(serializer.data)

    def post(self, request):
        if not IsFirebaseAdmin().has_permission(request, self):
            return response.Response({'detail': 'Admin claim required.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = MenuItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return response.Response(serializer.data, status=status.HTTP_201_CREATED)


class MenuDetailView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def patch(self, request, item_id: int):
        if not IsFirebaseAdmin().has_permission(request, self):
            return response.Response({'detail': 'Admin claim required.'}, status=status.HTTP_403_FORBIDDEN)

        menu_manager = getattr(MenuItem, 'objects')
        item = menu_manager.filter(id=item_id).first()
        if not item:
            return response.Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = MenuItemSerializer(item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return response.Response(serializer.data)

    def delete(self, request, item_id: int):
        if not IsFirebaseAdmin().has_permission(request, self):
            return response.Response({'detail': 'Admin claim required.'}, status=status.HTTP_403_FORBIDDEN)

        menu_manager = getattr(MenuItem, 'objects')
        item = menu_manager.filter(id=item_id).first()
        if not item:
            return response.Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        item.delete()
        return response.Response(status=status.HTTP_204_NO_CONTENT)


class CartView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart_manager = getattr(Cart, 'objects')
        cart, _ = cart_manager.get_or_create(
            uid=request.user.uid,
            defaults={'email': request.user.email},
        )
        serializer = CartSerializer(cart)
        return response.Response(serializer.data)

    def put(self, request):
        cart_manager = getattr(Cart, 'objects')
        cart, _ = cart_manager.get_or_create(
            uid=request.user.uid,
            defaults={'email': request.user.email},
        )
        serializer = CartSerializer(cart, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(email=request.user.email)
        return response.Response(serializer.data)


class OrderListCreateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        is_admin = IsFirebaseAdmin().has_permission(request, self)
        order_manager = getattr(Order, 'objects')
        queryset = order_manager.all() if is_admin else order_manager.filter(uid=request.user.uid)
        serializer = OrderSerializer(queryset, many=True)
        return response.Response(serializer.data)

    def post(self, request):
        serializer = OrderSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return response.Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderStatusView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, order_id: int):
        if not IsFirebaseAdmin().has_permission(request, self):
            return response.Response({'detail': 'Admin claim required.'}, status=status.HTTP_403_FORBIDDEN)

        order_manager = getattr(Order, 'objects')
        order = order_manager.filter(id=order_id).first()
        if not order:
            return response.Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = OrderStatusSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return response.Response(OrderSerializer(order).data)