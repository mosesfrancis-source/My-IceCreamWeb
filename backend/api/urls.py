from django.urls import path

from .views import (
    AdminUserDetailView,
    AdminUserListCreateView,
    CartView,
    HealthView,
    MeView,
    MenuDetailView,
    MenuListCreateView,
    OrderListCreateView,
    OrderStatusView,
)


urlpatterns = [
    path('health/', HealthView.as_view(), name='health'),
    path('auth/me/', MeView.as_view(), name='auth-me'),
    path('menu/', MenuListCreateView.as_view(), name='menu-list-create'),
    path('menu/<int:item_id>/', MenuDetailView.as_view(), name='menu-detail'),
    path('cart/', CartView.as_view(), name='cart'),
    path('orders/', OrderListCreateView.as_view(), name='orders'),
    path('orders/<int:order_id>/status/', OrderStatusView.as_view(), name='order-status'),
    path('admin/users/', AdminUserListCreateView.as_view(), name='admin-users'),
    path('admin/users/<str:uid>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
]