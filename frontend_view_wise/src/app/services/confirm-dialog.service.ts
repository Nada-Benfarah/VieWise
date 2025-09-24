import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;         // styliser bouton confirmer en rouge
  html?: string;            // (optionnel) message HTML
  inputPlaceholder?: string;
  inputValue?: string;
}

type Resolver = (v: boolean) => void;

interface ConfirmState extends Required<ConfirmOptions> {
  open: boolean;
}
const DEFAULTS: Required<ConfirmOptions> = {
  title: 'Confirmer',
  message: '',
  confirmText: 'Confirmer',
  cancelText: 'Annuler',
  danger: false,
  html: '',
  inputPlaceholder: undefined,
  inputValue: '',
};

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private resolver: Resolver | null = null;

  readonly state$ = new BehaviorSubject<ConfirmState>({
    ...DEFAULTS,
    open: false
  });

  open(opts: ConfirmOptions = {}): Promise<boolean> {
    if (this.resolver) {
      // Une modale est déjà ouverte : on la rejette proprement
      this.resolver(false);
      this.resolver = null;
    }

    const merged: ConfirmState = {
      ...DEFAULTS,
      ...opts,
      open: true
    };
    this.state$.next(merged);

    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  confirm() {
    if (this.resolver) this.resolver(true);
    this.close();
  }

  cancel() {
    if (this.resolver) this.resolver(false);
    this.close();
  }

  private close() {
    this.resolver = null;
    this.state$.next({ ...this.state$.value, open: false });
  }

  getInputValue(): string {
    return this.state$.value.inputValue || '';
  }

  setInputValue(value: string): void {
    this.state$.next({ ...this.state$.value, inputValue: value });
  }
}
