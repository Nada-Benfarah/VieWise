import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { AdminStaffService } from 'src/app/services/admin-staff/admin-staff.service';
import {AdminUser, AdminUsersService} from 'src/app/services/admin/admin-user.service';
import {NotificationService} from "../../../../services/notification/notification.service";
import {ConfirmDialogService} from "../../../../services/confirm-dialog.service";


@Component({
  selector: 'app-admin-staff',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-staff.component.html',
  styleUrls: ['./admin-staff.component.scss']
})
export class AdminStaffComponent implements OnInit {
  rows: AdminUser[] = [];
  filtered: AdminUser[] = [];
  q = '';
  loading = false;
  page = 1;
  pageSize = 10;

  showModal = false;
  isEdit = false;
  current: AdminUser | null = null;
  form: FormGroup;
  showPassword = false;

  constructor(
    private api: AdminStaffService,private apiUsers: AdminUsersService, private notificationService: NotificationService,private  confirm:ConfirmDialogService,
    fb: FormBuilder
  ) {
    this.form = fb.group({
      email: ['', [Validators.required, Validators.email]],
      first_name: ['', [Validators.required, Validators.maxLength(150)]],
      last_name: [''],
      phone_number: [''],
      password: [''] // requis en création
    });
  }

  ngOnInit() {
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
        this.rows = rows;
        this.apply();
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  apply() {
    const t = this.q.toLowerCase().trim();
    this.filtered = !t
      ? [...this.rows]
      : this.rows.filter(
          (u) =>
            (u.email || '').toLowerCase().includes(t) ||
            (u.first_name || '').toLowerCase().includes(t) ||
            (u.last_name || '').toLowerCase().includes(t)
        );
    this.page = 1;
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
  togglePasswordVisibility() { this.showPassword = !this.showPassword; }


  save() {
    if (this.form.invalid) return;
    const payload = this.form.getRawValue();
    if (this.isEdit && this.current) {
      const { password, ...rest } = payload;
      const data = password ? payload : rest;
      this.api.update(this.current.id, data).subscribe({
        next: (upd) => {
          const i = this.rows.findIndex((x) => x.id === upd.id);
          if (i > -1) this.rows[i] = upd;
          this.apply();
          this.showModal = false;
        }
      });
    } else {
      if (!payload.password) return
      this.notificationService.error("'Mot de passe requis à la création");

      this.api.create(payload).subscribe({
        next: (c) => {
          this.rows.unshift(c);
          this.apply();
          this.showModal = false;
        }
      });
    }
  }



  async remove(u: AdminUser) {
    const ok = await this.confirm.open({
      title: 'Supprimer l’admin',
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
      }
    });
  }

  closeModal() {
    this.showModal = false;
  }

  toggleActive(u: AdminUser) {
    const target = !u.is_active;
    this.apiUsers.toggleActive(u.id, target).subscribe({
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
    this.apiUsers.toggleStaff(u.id, checked).subscribe({
      next: (upd) => {
        u.is_staff = upd.is_staff;
        // S’il n’est plus staff => on le retire de la liste (cette page ne montre que les admins)
        if (!upd.is_staff) {
          this.rows = this.rows.filter(x => x.id !== u.id);
          this.apply();
        }
      },
      error: (err) => {
        console.error(err);
        // rollback visuel
        u.is_staff = !checked;
      }
    });
  }

  protected readonly Math = Math;
}
