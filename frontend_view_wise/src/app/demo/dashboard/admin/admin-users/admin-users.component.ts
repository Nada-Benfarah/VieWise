import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminUser, AdminUsersService } from 'src/app/services/admin/admin-user.service';
import { NotificationService } from 'src/app/services/notification/notification.service';
import {AuthService} from "../../../../services/auth.service";
import {ConfirmDialogService} from "../../../../services/confirm-dialog.service";

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss']
})
export class AdminUsersComponent implements OnInit {
  rows: AdminUser[] = [];
  filtered: AdminUser[] = [];
  loading = false;
  q = '';
  page = 1;
  pageSize = 10;

  showModal = false;
  isEdit = false;
  current: AdminUser | null = null;
  form: FormGroup;
  isSuperuser = false;
  showPassword = false;
  constructor(
    private api: AdminUsersService,
    private notificationService: NotificationService,private auth: AuthService,fb: FormBuilder, private confirm: ConfirmDialogService
  ) {
    this.form = fb.group({
      email: ['', [Validators.required, Validators.email]],
      first_name: ['', [Validators.required, Validators.maxLength(150)]],
      last_name: ['', [Validators.required, Validators.maxLength(150)]],
      phone_number: ['', [Validators.pattern(/^\+?[0-9]\d{6,14}$/)]],
      role: ['client', [Validators.required]],                         // 👈 nouveau
      password: [''],                                                  // requis en création
      is_active: [true],
      is_staff: [false],
      is_superuser: [false]
    });
  }

  ngOnInit() {
    this.auth.getCurrentUser().subscribe((user: any) => {
      this.isSuperuser = !!user?.is_superuser;
    });
    this.load();
  }

  get paged() {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  load() {
    this.loading = true;
    this.api.list().subscribe({
      next: (rows) => {
        // on ne garde que les vrais clients
        this.rows = rows.filter(u => !u.is_superuser && !u.is_staff);
        this.apply();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notificationService.error('Erreur lors du chargement des utilisateurs.');
        console.error(err);
      }
    });
  }

  apply() {
    const t = this.q.toLowerCase().trim();
    const base = this.rows; // déjà filtré pour clients uniquement
    this.filtered = !t
      ? [...base]
      : base.filter(
        (u) =>
          (u.email || '').toLowerCase().includes(t) ||
          (u.first_name || '').toLowerCase().includes(t) ||
          (u.last_name || '').toLowerCase().includes(t) ||
          (u.phone_number || '').toLowerCase().includes(t)
      );
    this.page = 1;
  }

  openCreate() {
    this.isEdit = false;
    this.current = null;
    this.form.reset({
      email: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      role: 'client',            // 👈 par défaut
      password: '',
      is_active: true,
      is_staff: false,
      is_superuser: false
    });
    this.showPassword = false;
    this.showModal = true;
  }

  private mapRoleToFlags(role: 'client' | 'admin') {
    // superuser reste géré ailleurs; ici, admin = staff
    return {
      is_staff: role === 'admin',
      is_superuser: false
    };
  }

  save() {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();

    // map role -> flags
    const { is_staff, is_superuser } = this.mapRoleToFlags(raw.role);
    const basePayload = {
      email: raw.email,
      first_name: raw.first_name,
      last_name: raw.last_name,
      phone_number: raw.phone_number,
      is_active: !!raw.is_active,
      is_staff,
      is_superuser
    };

    if (this.isEdit && this.current) {
      // mot de passe optionnel
      const payload = raw.password ? { ...basePayload, password: raw.password } : basePayload;

      this.api.update(this.current.id, payload).subscribe({
        next: (upd) => {
          const i = this.rows.findIndex((x) => x.id === upd.id);
          if (i > -1) this.rows[i] = upd;

          // si devient staff => il disparaît de la liste (clients uniquement)
          if (upd.is_staff) {
            this.rows = this.rows.filter(x => x.id !== upd.id);
          }
          this.apply();
          this.showModal = false;
          this.notificationService.success('Utilisateur mis à jour avec succès.');
        },
        error: (err) => {
          console.error(err);
          this.notificationService.error("Erreur lors de la mise à jour de l'utilisateur.");
        }
      });
    } else {
      // création → mot de passe requis
      if (!raw.password) {
        this.notificationService.warning('Le mot de passe est requis pour créer un utilisateur.');
        return;
      }
      const payload = { ...basePayload, password: raw.password, email_verified: true };

      this.api.create(payload).subscribe({
        next: (created) => {
          // on affiche seulement les clients : si admin, ne pas l’ajouter à la liste
          if (!created.is_staff) {
            this.rows.unshift(created);
          }
          this.apply();
          this.showModal = false;
          this.notificationService.success('Utilisateur créé avec succès.');
        },
        error: (err) => {
          console.error(err);
          this.notificationService.error("Erreur lors de la création de l'utilisateur.");
        }
      });
    }
  }

  togglePasswordVisibility() { this.showPassword = !this.showPassword; }

  toggleActive(u: AdminUser) {
    const target = !u.is_active;
    this.api.toggleActive(u.id, target).subscribe({
      next: (upd: AdminUser) => {
        u.is_active = upd.is_active;
        this.notificationService.success(`Compte ${u.email} ${u.is_active ? 'activé' : 'désactivé'} avec succès.`);
      },
      error: (err) => {
        console.error(err);
        this.notificationService.error("Impossible de changer l'état du compte.");
      }
    });
  }

  onToggleStaff(u: AdminUser, checked: boolean) {
    this.api.toggleStaff(u.id, checked).subscribe({
      next: (upd: AdminUser) => {
        u.is_staff = upd.is_staff;
        this.notificationService.success(`Rôle staff ${u.is_staff ? 'activé' : 'désactivé'} pour ${u.email}.`);

        // s’il devient staff => disparaît de la liste “clients”
        if (upd.is_staff) {
          this.rows = this.rows.filter(x => x.id !== u.id);
          this.apply();
        }
      },
      error: (err) => {
        console.error(err);
        u.is_staff = !checked; // rollback visuel
        this.notificationService.error('Impossible de changer le rôle staff.');
      }
    });
  }



  async remove(u: AdminUser) {
    const ok = await this.confirm.open({
      title: 'Supprimer l’utilisateur',
      message: `Supprimer « ${u.email} » ?`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      danger: false
    });
    if (!ok) return;
    this.api.delete(u.id).subscribe({
      next: () => {
        this.rows = this.rows.filter((x) => x.id !== u.id);
        this.apply();
        this.notificationService.success('Utilisateur supprimé avec succès.');
      },
      error: (err) => {
        console.error(err);
        this.notificationService.error("Erreur lors de la suppression de l'utilisateur.");
      }
    });
  }

  closeModal() {
    this.showModal = false;
  }
  openEdit(u: AdminUser) {
    this.isEdit = true;
    this.current = u;

    // Rôle déduit des flags existants
    const role: 'client' | 'admin' = u.is_staff ? 'admin' : 'client';

    // Pré-remplir le formulaire (mot de passe vide => optionnel)
    this.form.reset({
      email: u.email || '',
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      phone_number: u.phone_number || '',
      role,
      password: '',                // ← vide en édition (optionnel)
      is_active: !!u.is_active,
      is_staff: !!u.is_staff,
      is_superuser: !!u.is_superuser
    });

    this.showPassword = false;
    this.showModal = true;
  }



  protected readonly Math = Math;
}
