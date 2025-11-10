import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './theme/layouts/admin-layout/admin-layout.component';
import { GuestLayoutComponent } from './theme/layouts/guest-layout/guest-layout.component';
import { AuthGuard } from './guards/auth.guard';
import { WorkflowAccessGuard } from './guards/workflow-access.guard';
import {SuperuserGuard} from "./guards/superuser.guard";
import { AdminGuard } from './guards/admin.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: '',
    component: AdminComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
      },
      {
        path: 'admin/staff',
        canActivate: [SuperuserGuard],
        loadComponent: () => import('./demo/dashboard/admin/admin-staff/admin-staff.component').then(c => c.AdminStaffComponent)
      },
      {
        path: 'admin/users',
        loadComponent: () => import('./demo/dashboard/admin/admin-users/admin-users.component').then(m => m.AdminUsersComponent)
      },
      {
        path: 'admin/agents',
        loadComponent: () => import('./demo/dashboard/admin/admin-agents/admin-agents.component').then(m => m.AdminAgentsComponent)
      },
      {
        path: 'admin/workflows',
        loadComponent: () => import('./demo/dashboard/admin/admin-workflows/admin-workflows.component').then(m => m.AdminWorkflowsComponent)
      },
      {
        path: 'admin/marketplace',
        loadComponent: () => import('./demo/dashboard/admin/admin-marketplace/admin-marketplace.component')
          .then(c => c.AdminMarketplaceComponent)
      },
      {
        path: 'dashboard',
        canActivate: [AuthGuard, AdminGuard],
        loadComponent: () => import('./demo/dashboard/default/default.component').then((c) => c.DefaultComponent)
      },
      {
        path: 'pricing-plans',
        loadComponent: () => import('./pages/pricing-plans/pricing-plans.component').then((c) => c.PricingPlansComponent)
      },
      {
        path: 'create-agent/:id',
        loadComponent: () => import('./pages/agents/create-agent/create-agent.component').then((c) => c.CreateAgentComponent)
      },
      {
        path: 'create-agent',
        loadComponent: () => import('./pages/agents/create-agent/create-agent.component').then((c) => c.CreateAgentComponent)
      },
      {
        path: 'marketplace',
        loadComponent: () => import('./pages/marketplace/marketplace.component').then((c) => c.MarketplaceComponent)
      },
      {
        path: 'agents',
        loadComponent: () => import('./pages/agents/agents.component').then((c) => c.AgentsComponent)
      },
      {
        path: 'chatgpt-page',
        loadComponent: () => import('./pages/agents/chatgpt-page/chatgpt-page.component').then((c) => c.ChatgptPageComponent)
      },
      {
        path: 'workflow',
        canActivate: [WorkflowAccessGuard],
        loadComponent: () => import('./pages/workflow/workflow.component').then((c) => c.WorkflowComponent)
      },
      {
        path: 'workflow/editor',
        canActivate: [WorkflowAccessGuard],
        loadComponent: () => import('./pages/workflow/worflow-editor/worflow-editor.component').then((c) => c.WorflowEditorComponent)
      },
      {
        path: 'invite-management',
        loadComponent: () => import('./pages/invite/invite.component').then((c) => c.InviteComponent)
      },
      {
        path: 'edit-profile',
        loadComponent: () => import('./demo/pages/profile/edit-profile/edit-profile.component').then((c) => c.EditProfileComponent)
      },

    ]
  },
  {
    path: '',
    component: GuestLayoutComponent,
    children: [
      {
        path: 'login',
        loadComponent: () => import('./demo/pages/authentication/auth-login/auth-login.component').then((c) => c.AuthLoginComponent)
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./demo/pages/authentication/auth-register/auth-register.component').then((c) => c.AuthRegisterComponent)
      },
      {
        path: 'forget-password',
        loadComponent: () => import('./demo/pages/authentication/auth-forget-password/auth-forget-password.component').then((c) => c.AuthForgetPasswordComponent)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./demo/pages/authentication/auth-reset-password/auth-reset-password.component').then((c) => c.AuthResetPasswordComponent)
      },
      {
        path: 'welcome',
        loadComponent: () => import('./pages/welcome/welcome.component').then((c) => c.WelcomeComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
