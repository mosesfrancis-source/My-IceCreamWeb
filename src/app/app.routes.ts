import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { CartComponent } from './components/cart/cart.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { CustomizeOrderComponent } from './components/customize-order/customize-order.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { ManageMenuComponent } from './components/manage-menu/manage-menu.component';
import { ManageOrdersComponent } from './components/manage-orders/manage-orders.component';
import { MenuComponent } from './components/menu/menu.component';
import { OrderConfirmationComponent } from './components/order-confirmation/order-confirmation.component';
import { PickupSchedulerComponent } from './components/pickup-scheduler/pickup-scheduler.component';
import { RegisterComponent } from './components/register/register.component';
import { ManageUsersComponent } from './components/manage-users/manage-users.component';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'menu', component: MenuComponent },
  { path: 'customize/:id', component: CustomizeOrderComponent },
  { path: 'cart', component: CartComponent },
  { path: 'schedule-pickup', component: PickupSchedulerComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'order-confirmation', component: OrderConfirmationComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [adminGuard] },
  { path: 'admin/menu', component: ManageMenuComponent, canActivate: [adminGuard] },
  { path: 'admin/orders', component: ManageOrdersComponent, canActivate: [adminGuard] },
  { path: 'admin/users', component: ManageUsersComponent, canActivate: [adminGuard] },
  { path: '**', redirectTo: '' },
];
