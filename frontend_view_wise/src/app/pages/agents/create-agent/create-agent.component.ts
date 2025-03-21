import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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

  agent = {
    name: '',
    description: '',
    selectedOption: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    gender: '',
  };






  cancel() {
    console.log('Formulaire annulé');
    this.agent = {
      name: '',
      description: '',
      selectedOption: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      gender: '',
    };
  }
}
