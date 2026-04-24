from django.contrib import admin

from .models import Cart, MenuItem, Order, OrderItem


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'flavor', 'price', 'quantity')
    search_fields = ('name', 'flavor')


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id', 'uid', 'email', 'updated_at')
    search_fields = ('uid', 'email')


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'uid', 'customer_name', 'status', 'total', 'created_at')
    list_filter = ('status',)
    search_fields = ('uid', 'customer_name', 'customer_email')
    inlines = [OrderItemInline]