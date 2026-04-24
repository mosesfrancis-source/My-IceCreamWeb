from rest_framework import permissions, response, status, views
from firebase_admin import auth as firebase_auth
from django.conf import settings

from .models import Cart, MenuItem, Order
from .permissions import IsFirebaseAdmin, IsOwnerAdmin
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


class AdminUserListCreateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerAdmin]

    def get(self, request):
        users = []
        page = firebase_auth.list_users()

        while page:
            for user in page.users:
                users.append(
                    {
                        'uid': user.uid,
                        'email': user.email,
                        'display_name': user.display_name,
                        'disabled': user.disabled,
                    }
                )
            page = page.get_next_page()

        users.sort(key=lambda user: (user.get('email') or '').lower())
        return response.Response(users)

    def post(self, request):
        email = str(request.data.get('email', '')).strip()
        password = str(request.data.get('password', '')).strip()
        display_name = str(request.data.get('display_name', '')).strip()

        if not email or not password:
            return response.Response(
                {'detail': 'Email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = firebase_auth.create_user(
                email=email,
                password=password,
                display_name=display_name or None,
            )
            firebase_auth.set_custom_user_claims(user.uid, {'admin': False})
        except Exception as exc:  # noqa: BLE001
            return response.Response(
                {'detail': f'Unable to create user: {exc}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return response.Response(
            {
                'uid': user.uid,
                'email': user.email,
                'display_name': user.display_name,
                'disabled': user.disabled,
            },
            status=status.HTTP_201_CREATED,
        )


class AdminUserDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerAdmin]

    def delete(self, request, uid: str):
        owner_email = str(getattr(settings, 'OWNER_ADMIN_EMAIL', '')).strip().lower()
        requester_email = str(getattr(request.user, 'email', '')).strip().lower()

        try:
            user = firebase_auth.get_user(uid)
        except Exception as exc:  # noqa: BLE001
            return response.Response({'detail': f'User not found: {exc}'}, status=status.HTTP_404_NOT_FOUND)

        target_email = (user.email or '').strip().lower()
        if target_email and owner_email and target_email == owner_email:
            return response.Response(
                {'detail': 'The owner admin account cannot be deleted.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if uid == getattr(request.user, 'uid', '') and requester_email == owner_email:
            return response.Response(
                {'detail': 'You cannot delete your own owner admin account.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            firebase_auth.delete_user(uid)
        except Exception as exc:  # noqa: BLE001
            return response.Response(
                {'detail': f'Unable to delete user: {exc}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return response.Response(status=status.HTTP_204_NO_CONTENT)