from __future__ import annotations

from django.db import models
from django.db.models import Manager


class MenuItem(models.Model):
    objects: Manager[MenuItem]

    name = models.CharField(max_length=120)
    flavor = models.CharField(max_length=80)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    image_url = models.TextField()
    quantity = models.PositiveIntegerField(default=0)
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']

    def __str__(self) -> str:
        return f'{self.name} ({self.flavor})'


class Cart(models.Model):
    objects: Manager[Cart]

    uid = models.CharField(max_length=128, unique=True)
    email = models.EmailField(blank=True)
    items = models.JSONField(default=list, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']


class Order(models.Model):
    objects: Manager[Order]

    STATUS_RECEIVED = 'received'
    STATUS_PREPARING = 'preparing'
    STATUS_READY = 'ready'
    STATUS_COMPLETED = 'completed'
    STATUS_CHOICES = [
        (STATUS_RECEIVED, 'Received'),
        (STATUS_PREPARING, 'Preparing'),
        (STATUS_READY, 'Ready'),
        (STATUS_COMPLETED, 'Completed'),
    ]

    uid = models.CharField(max_length=128)
    email = models.EmailField(blank=True)
    customer_name = models.CharField(max_length=120)
    customer_email = models.EmailField()
    pickup_date = models.CharField(max_length=32)
    pickup_time = models.CharField(max_length=32)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_RECEIVED)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']


class OrderItem(models.Model):
    objects: Manager[OrderItem]

    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    menu_item = models.ForeignKey(MenuItem, null=True, blank=True, on_delete=models.SET_NULL)
    item_name = models.CharField(max_length=120)
    flavor = models.CharField(max_length=80, blank=True)
    image_url = models.TextField(blank=True)
    unit_price = models.DecimalField(max_digits=8, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    cone_type = models.CharField(max_length=16, default='cup')
    toppings = models.JSONField(default=list, blank=True)
    note = models.TextField(blank=True)

    class Meta:
        ordering = ['id']