export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;         // 👈 utilisé pour masquer/afficher
  url?: string;
  classes?: string;
  groupClasses?: string;
  exactMatch?: boolean;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  children?: NavigationItem[];
  link?: string;
  description?: string;
  path?: string;
}

export const NavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    type: 'group',
    icon: 'icon-navigation',
    children: [

      {
        id: 'marketplace',
        title: 'Marketplace',
        type: 'item',
        classes: 'nav-item',
        url: '/marketplace',
        icon: 'heat-map',
        breadcrumbs: false
      },
      {
        id: 'agents',
        title: 'Agents',
        type: 'item',
        classes: 'nav-item',
        url: '/agents',
        icon: 'open-a-i',
        breadcrumbs: false
      },
      {
        id: 'prices',
        title: 'Prices',
        type: 'item',
        classes: 'nav-item',
        url: '/pricing-plans',
        icon: 'dollar',
        breadcrumbs: false
      },
      {
        id: 'workflow',
        title: 'Workflow',
        type: 'item',
        classes: 'nav-item',
        url: '/workflow',
        icon: 'apartment',
        breadcrumbs: false
      }
    ]
  },

  // 👇 Groupe admin masqué par défaut
  {
    id: 'admin',
    title: 'Administration',
    type: 'group',
    icon: 'icon-settings',
    hidden: true, // 👈 on l'affichera dynamiquement dans le composant
    children: [
      {
        id: 'default',
        title: 'Default',
        type: 'item',
        classes: 'nav-item',
        url: '/dashboard',
        icon: 'dashboard',
        breadcrumbs: false
      },
      {
        id: 'admin-users',
        title: 'Admin — Utilisateurs',
        type: 'item',
        url: '/admin/users',
        icon: 'user',
        hidden: true,
        classes: 'nav-item' // Ajouté pour éviter le background spécial
      },
      {
        id: 'admin-staff',
        title: 'Admin — Staff',
        type: 'item',
        url: '/admin/staff',
        classes: 'nav-item',
        icon: 'user',
        hidden: true
      },
      {
        id: 'admin-agents',
        title: 'Gestion des agents',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/agents',
        icon: 'open-a-i',
        breadcrumbs: false,
        hidden: true
      },
      {
        id: 'admin-marketplace',
        title: 'Gestion Marketplace',
        type: 'item',
        url: '/admin/marketplace',
        classes: 'nav-item',
        icon: 'heat-map',
        hidden: true
      },
      {
        id: 'admin-workflows',
        title: 'Gestion des workflows',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/workflows',
        icon: 'apartment',
        breadcrumbs: false,
        hidden: true
      }
    ]
  }
];
