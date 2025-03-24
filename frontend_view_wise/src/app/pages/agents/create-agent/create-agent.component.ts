import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-create-agent',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule],
  templateUrl: './create-agent.component.html',
  styleUrl: './create-agent.component.scss'
})
export class CreateAgentComponent {

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  fileNames: string[] = [];

  triggerFileInput(): void {
    this.fileInputRef.nativeElement.click();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.fileNames = Array.from(input.files).map((file) => file.name);
    }
  }

  agent = {
    name: '',
    description: '',
    selectedOption: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    gender: '',
  };




  conversationStarters: string[] = [''];

  handleInputChange(index: number): void {
    const value = this.conversationStarters[index];

    // Si le champ contient du texte et qu'aucun champ vide n'existe encore à la fin
    const hasEmpty = this.conversationStarters.some(v => !v || v.trim() === '');

    if (value && value.trim() !== '' && !hasEmpty) {
      this.conversationStarters.push('');
    }
  }

  removeStarter(index: number): void {
    if (this.conversationStarters.length === 1) return;

    this.conversationStarters.splice(index, 1);
  }

}
