// angular import
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Project import
import { AdminComponent } from './theme/layouts/admin-layout/admin-layout.component';
import { GuestLayoutComponent } from './theme/layouts/guest-layout/guest-layout.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    // canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
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
        loadComponent: () => import('./pages/workflow/workflow.component').then((c) => c.WorkflowComponent)
      },
      {
        path: 'workflow/editor',
        loadComponent: () => import('./pages/workflow/worflow-editor/worflow-editor.component').then((c) => c.WorflowEditorComponent)
      }



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
