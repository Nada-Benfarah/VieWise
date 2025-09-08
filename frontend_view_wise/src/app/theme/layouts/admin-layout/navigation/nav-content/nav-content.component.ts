import  { Component, OnInit, inject, output } from '@angular/core';
import { CommonModule, Location, LocationStrategy } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { NavigationItem, NavigationItems } from '../navigation';
import { environment } from 'src/environments/environment';

import { NavGroupComponent } from './nav-group/nav-group.component';

// icon
import { IconService } from '@ant-design/icons-angular';
import {
  DashboardOutline,
  OpenAIOutline,
  HeatMapOutline,
  DollarOutline,
  CreditCardOutline,
  LoginOutline,
  QuestionOutline,
  ChromeOutline,
  FontSizeOutline,
  ProfileOutline,
  BgColorsOutline,
  AntDesignOutline,
  ApartmentOutline
} from '@ant-design/icons-angular/icons';

import { NgScrollbarModule } from 'ngx-scrollbar';
import { PlanService } from '../../../../../services/plan/plan.service';
import { PricingPlansComponent } from '../../../../../pages/pricing-plans/pricing-plans.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-nav-content',
  imports: [CommonModule, RouterModule, NavGroupComponent, NgScrollbarModule, PricingPlansComponent],
  templateUrl: './nav-content.component.html',
  styleUrls: ['./nav-content.component.scss']
})
export class NavContentComponent implements OnInit {
  private location = inject(Location);
  private locationStrategy = inject(LocationStrategy);
  private iconService = inject(IconService);

  // public props
  NavCollapsedMob = output();
  navigations: NavigationItem[] = NavigationItems;
  title = 'Demo application for version numbering';
  currentApplicationVersion = environment.appVersion;
  windowWidth = window.innerWidth;

  // abonnement
  plan: any;
  creditsUsed = 0;
  creditsLimit = 0;
  storageUsed = 0;
  storageLimit = 0;
  formattedStorage = '';
  showUpgradeModal = false;
  isSuperuser = false;
  currentUser: any = null;
   isStaff: boolean;
  constructor(
    private planService: PlanService,
    private router: Router,
    private dialog: MatDialog,
    private authService: AuthService
  ) {
    this.iconService.addIcon(
      DashboardOutline,
      OpenAIOutline,
      HeatMapOutline,
      DollarOutline,
      CreditCardOutline,
      FontSizeOutline,
      LoginOutline,
      ProfileOutline,
      BgColorsOutline,
      AntDesignOutline,
      ChromeOutline,
      QuestionOutline,
      ApartmentOutline
    );
  }

  ngOnInit(): void {
    // if (this.windowWidth < 1025) {
    //   (document.querySelector('.coded-navbar') as HTMLDivElement).classList.add('menupos-static');
    // }

      this.planService.currentPlan$.subscribe((data) => {
        this.plan = data || null;
        this.creditsLimit = data?.credits_nbr || 0;

        const storageStr = data?.data_source_size?.toUpperCase() || '0MB';
        if (storageStr.includes('GB')) {
          this.storageLimit = parseFloat(storageStr) || 0;
        } else if (storageStr.includes('MB')) {
          const mb = parseFloat(storageStr) || 0;
          this.storageLimit = +(mb / 1024).toFixed(2);
        } else {
          this.storageLimit = 0;
        }
        this.formattedStorage = `${this.storageLimit} GB`;
      });

      // Valeur initiale
      this.planService.refreshCurrentPlan().subscribe();

    this.authService.getCurrentUser().subscribe((user: any) => {
      const isAdmin = !!user?.is_admin;
      const isStaff = !!user?.is_staff;
      this.currentUser = user;
      // Masquer le groupe dashboard pour admin, staff ou superuser
      this.navigations = NavigationItems.filter(group => {
        if (group.id === 'dashboard') {
          return !(isAdmin || isStaff || user?.is_superuser);
        }
        return true;
      }).map(group => {
        if (group.id !== 'admin') return group;
        const groupClone = {...group, hidden: !(isAdmin || isStaff)};
        groupClone.children = (group.children || []).map(child => {
          if (child.id === 'admin-staff') {
            return {...child, hidden: (isAdmin || isStaff)};
          }
          if (child.id === 'admin-users') {
            return {...child, hidden: !user?.is_superuser};
          }
          return {...child, hidden: !(user?.is_superuser || isStaff)};
        });
        return groupClone;
      });
    });
  }


  fireOutClick(): void {
    let current_url = this.location.path();
    const baseHref = this.locationStrategy.getBaseHref();
    if (baseHref) {
      current_url = baseHref + this.location.path();
    }
    const link = "a.nav-link[ href='" + current_url + "' ]";
    const ele = document.querySelector(link);
    const parent = ele?.parentElement;
    const up_parent = parent?.parentElement?.parentElement;
    const last_parent = up_parent?.parentElement;
    [parent, up_parent, last_parent].forEach((p) => {
      if (p?.classList.contains('coded-hasmenu')) {
        p.classList.add('coded-trigger', 'active');
      }
    });
  }

  navMob(): void {
    if (this.windowWidth < 1025 && document.querySelector('app-navigation.coded-navbar')?.classList.contains('mob-open')) {
      this.NavCollapsedMob.emit();
    }
  }

  goToPricing(): void {
    this.router.navigate(['/pricing-plans']);
  }
  handleInvitation(): void {
    if (this.plan?.name?.toLowerCase() === 'free') {
      this.showUpgradeModal = true;
      document.body.classList.add('modal-open'); // ✅ blur activé
    } else {
      this.router.navigate(['/invite-management']);
    }
  }


  closeUpgradeModal(): void {
    this.showUpgradeModal = false;
  }

  onPlanUpgrade(planName: string): void {
    this.showUpgradeModal = false;
    document.body.classList.remove('modal-open'); // ✅ blur désactivé
    this.router.navigate(['/invite-management']);
  }


}
