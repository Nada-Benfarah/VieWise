// chatgpt-page.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { IconDirective } from '@ant-design/icons-angular';

@Component({
  selector: 'app-chatgpt-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './chatgpt-page.component.html',
  styleUrl: './chatgpt-page.component.scss'
})
export class ChatgptPageComponent {
  @Input() icon!: string;
  @Input() questions: string[] = [];

  menuOpen: boolean = false;
  showChatNames: boolean = true;

  chatItems = [
    { icon: 'message', label: 'Conversation 1' },
    { icon: 'message', label: 'Conversation 2' },
    { icon: 'message', label: 'Conversation 3' }
  ];

  suggestionCards = [
    { title: 'Exemple', icon: 'fas fa-robot', questions: ['Que puis-je faire ?', 'Comment ça fonctionne ?'] }
  ];

  chatHistory = [
    { name: 'Conversation 1', editable: false, session: { showSuggestions: true, showQuestions: true }, messages: [] },
    { name: 'Conversation 2', editable: false, session: { showSuggestions: true, showQuestions: true }, messages: [] }
  ];

  selectedChat = this.chatHistory[0];
  selectedQuestions: string[] = [];
  newMessage: string = '';
  userAvatar: string = 'Moi';

  getArrowDirection() {
    return this.showChatNames ? 'arrow-up' : 'arrow-down';
  }

  toggleChatNames() {
    this.showChatNames = !this.showChatNames;
  }

  selectChat(chat: any) {
    this.selectedChat = chat;
  }

  isSelected(chat: any) {
    return this.selectedChat === chat;
  }

  toggleChatNameEditing(chat: any) {
    chat.editable = !chat.editable;
  }

  updateChatName(chat: any, value: string) {
    chat.name = value;
    chat.editable = false;
  }

  deleteChat(chat: any) {
    const index = this.chatHistory.indexOf(chat);
    if (index > -1) this.chatHistory.splice(index, 1);
  }

  startNewChat() {
    const newChat = {
      name: 'Nouvelle conversation',
      editable: true,
      session: { showSuggestions: true, showQuestions: true },
      messages: []
    };
    this.chatHistory.unshift(newChat);
    this.selectedChat = newChat;
  }

  copyToChatInput(question: string) {
    this.newMessage = question;
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.selectedChat.messages.push({ user: true, text: this.newMessage });
      this.newMessage = '';
      setTimeout(() => {
        this.selectedChat.messages.push({ user: false, text: 'Merci pour votre message !' });
      }, 1000);
    }
  }

  selectCard(card: any) {
    this.selectedQuestions = card.questions;
  }
}
