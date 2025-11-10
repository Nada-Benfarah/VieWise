import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
  selector: '[appEmailsList]',
  providers: [
    { provide: NG_VALIDATORS, useExisting: EmailsListValidatorDirective, multi: true }
  ]
})
export class EmailsListValidatorDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    const value = (control.value ?? '') as string;
    if (!value.trim()) return null;
    const emails = value.split(',').map(e => e.trim()).filter(Boolean);
    if (emails.length === 0) {
      return { emailsList: { reason: 'noEmails' } };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    const invalids = emails.filter(e => !emailRegex.test(e));
    return invalids.length ? { emailsList: { invalid: invalids } } : null;
  }
}
