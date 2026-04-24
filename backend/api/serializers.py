from decimal import Decimal

from rest_framework import serializers

from .models import Cart, MenuItem, Order, OrderItem


class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = ['id', 'name', 'flavor', 'description', 'price', 'image_url', 'quantity', 'tags']


class CartSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cart
        fields = ['items']


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_id = serializers.IntegerField(source='menu_item.id', required=False, allow_null=True)

    class Meta:
        model = OrderItem
        fields = [
            'menu_item_id',
            'item_name',
            'flavor',
            'image_url',
            'unit_price',
            'quantity',
            'cone_type',
            'toppings',
            'note',
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'customer_name',
            'customer_email',
            'pickup_date',
            'pickup_time',
            'status',
            'total',
            'created_at',
            'items',
        ]
        read_only_fields = ['id', 'total', 'created_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        request = self.context['request']
        principal = request.user
        order_manager = getattr(Order, 'objects')
        menu_item_manager = getattr(MenuItem, 'objects')
        order_item_manager = getattr(OrderItem, 'objects')

        order = order_manager.create(
            uid=principal.uid,
            email=principal.email,
            **validated_data,
        )

        total = Decimal('0')
        for item_data in items_data:
            menu_item = None
            menu_item_info = item_data.pop('menu_item', None)
            if isinstance(menu_item_info, dict):
                menu_item_id = menu_item_info.get('id')
                if menu_item_id:
                    menu_item = menu_item_manager.filter(id=menu_item_id).first()

            quantity = int(item_data.get('quantity', 1) or 1)
            unit_price = Decimal(item_data.get('unit_price', 0) or 0)
            total += unit_price * quantity

            order_item_manager.create(
                order=order,
                menu_item=menu_item,
                **item_data,
            )

        order.total = total
        order.save(update_fields=['total'])
        return order


class OrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['status']