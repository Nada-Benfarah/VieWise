import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { IconDirective } from '@ant-design/icons-angular';

@Component({
  selector: 'app-chatgpt-page',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, IconDirective],
  templateUrl: './chatgpt-page.component.html',
  styleUrl: './chatgpt-page.component.scss'
})
export class ChatgptPageComponent {
  chatItems = [
    { icon: 'message', label: 'Conversation 1' },
    { icon: 'message', label: 'Conversation 2' },
    { icon: 'message', label: 'Conversation 3' }
  ];

  // Liste des messages de la conversation actuelle
  messages: { sender: string; text: string }[] = [{ sender: 'bot', text: 'Hello! How can I assist you today?' }];

  // Nouveau message saisi par l'utilisateur
  newMessage: string = '';

  // Historique des conversations
  history: { title: string; date: string; messages: { sender: string; text: string }[] }[] = [
    {
      title: 'Conversation 1',
      date: '2023-10-01',
      messages: [
        { sender: 'user', text: 'Hi!' },
        { sender: 'bot', text: 'Hello! How can I help you?' }
      ]
    },
    {
      title: 'Conversation 2',
      date: '2023-10-02',
      messages: [
        { sender: 'user', text: 'What is Angular?' },
        { sender: 'bot', text: 'Angular is a platform for building web applications.' }
      ]
    }
  ];

  // Méthode pour envoyer un message
  sendMessage() {
    if (this.newMessage.trim()) {
      // Ajouter le message de l'utilisateur
      this.messages.push({ sender: 'user', text: this.newMessage });
      this.newMessage = '';

      // Simuler une réponse du bot
      setTimeout(() => {
        this.messages.push({ sender: 'bot', text: 'Thank you for your message!' });
      }, 1000);
    }
  }

  // Méthode pour charger une conversation depuis l'historique
  loadConversation(conversation: { title: string; date: string; messages: { sender: string; text: string }[] }) {
    this.messages = conversation.messages;
  }
}
