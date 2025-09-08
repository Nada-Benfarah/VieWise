import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { AdminStaffService } from 'src/app/services/admin-staff/admin-staff.service';
import {AdminUser, AdminUsersService} from 'src/app/services/admin/admin-user.service';


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

  constructor(
    private api: AdminStaffService,private apiUsers: AdminUsersService,
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

  openCreate() {
    this.isEdit = false;
    this.current = null;
    this.form.reset({ email: '', first_name: '', last_name: '', phone_number: '', password: '' });
    this.showModal = true;
  }

  openEdit(u: AdminUser) {
    this.isEdit = true;
    this.current = u;
    this.form.reset({
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name || '',
      phone_number: u.phone_number || '',
      password: ''
    });
    this.showModal = true;
  }

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
      if (!payload.password) return alert('Mot de passe requis à la création');
      this.api.create(payload).subscribe({
        next: (c) => {
          this.rows.unshift(c);
          this.apply();
          this.showModal = false;
        }
      });
    }
  }

  demote(u: AdminUser) {
    if (!confirm(`Retirer les droits staff de ${u.email} ?`)) return;
    this.apiUsers.toggleStaff(u.id, false).subscribe({
      next: () => {
        this.rows = this.rows.filter((x) => x.id !== u.id);
        this.apply();
      }
    });
  }

  remove(u: AdminUser) {
    if (!confirm(`Supprimer ${u.email} ?`)) return;
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
