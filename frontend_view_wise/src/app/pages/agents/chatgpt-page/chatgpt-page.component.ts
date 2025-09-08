import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type Role = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  attachments?: { name: string; type: string }[];
}

interface ChatItem {
  id: string;
  label: string;
  createdAt: number;
}

@Component({
  selector: 'app-chatgpt-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatgpt-page.component.html',
  styleUrls: ['./chatgpt-page.component.scss']
})
export class ChatgptPageComponent {
  // Sidebar
  chats: ChatItem[] = [
    { id: 'c1', label: 'Idées de voyage', createdAt: Date.now() - 86400000 },
    { id: 'c2', label: 'Résumé de réunion', createdAt: Date.now() - 43200000 }
  ];
  currentChatId: string = this.chats[0]?.id || 'new';

  // Messages
  messages: ChatMessage[] = []; // affiche la welcome quand vide
  message = '';

  // Fichiers / audio
  files: File[] = [];
  audioBlob: Blob | null = null;

  // Enregistrement vocal
  isRecording = false;
  recordingSeconds = 0;
  private mediaRecorder?: MediaRecorder;
  private recordChunks: BlobPart[] = [];
  private timerRef: any = null;

  // Drag/drop & streaming
  isDragging = false;
  isStreaming = false;
  private readonly imgRe = /\.(png|jpe?g|gif|webp)$/i;
  private readonly pdfRe = /\.pdf$/i;
  // Sidebar actions
  newChat() {
    const id = 'c' + crypto.randomUUID();
    const item: ChatItem = { id, label: 'Nouvelle discussion', createdAt: Date.now() };
    this.chats.unshift(item);
    this.currentChatId = id;
    this.messages = [];
    this.message = '';
    this.files = [];
    this.audioBlob = null;
  }

  selectChat(item: ChatItem) {
    this.currentChatId = item.id;
    // TODO: Charger l'historique de ce chat via votre service
    // Ici, demo: vider ou simuler
    this.messages = [];
  }

  renameChat(item: ChatItem, event: MouseEvent) {
    event.stopPropagation();
    const label = prompt('Renommer la discussion', item.label);
    if (label?.trim()) item.label = label.trim();
  }

  deleteChat(item: ChatItem, event: MouseEvent) {
    event.stopPropagation();
    this.chats = this.chats.filter(c => c.id !== item.id);
    if (this.currentChatId === item.id) this.newChat();
  }

  // Welcome examples
  usePrompt(text: string) {
    this.message = text;
    setTimeout(() => this.send(), 0);
  }

  // Footer helpers
  get sendDisabled(): boolean {
    const hasText = this.message.trim().length > 0;
    const hasFiles = this.files.length > 0;
    const hasAudio = !!this.audioBlob;
    return !(hasText || hasFiles || hasAudio) || this.isStreaming;
  }

  autoResize(ta: HTMLTextAreaElement) {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }

  onKeyDown(ev: KeyboardEvent) {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      this.send();
    }
  }

  send() {
    if (this.sendDisabled) return;

    // Push user message
    const att = this.files.map(f => ({ name: f.name, type: f.type }));
    this.messages.push({
      id: 'm' + crypto.randomUUID(),
      role: 'user',
      text: this.message.trim(),
      attachments: att
    });

    // Reset input
    this.message = '';
    this.files = [];
    this.audioBlob = null;

    // Simuler une réponse (REMPLACEZ par votre service)
    this.isStreaming = true;
    const replyId = 'm' + crypto.randomUUID();
    this.messages.push({ id: replyId, role: 'assistant', text: '…' });

    // Démo "stream"
    const chunks = [
      'Bien sûr ! ',
      'Voici une réponse de démonstration ',
      'que vous remplacerez par votre backend. '
    ];
    let i = 0;
    const int = setInterval(() => {
      const idx = this.messages.findIndex(m => m.id === replyId);
      if (idx > -1) {
        this.messages[idx].text = (this.messages[idx].text || '') + chunks[i];
      }
      i++;
      if (i >= chunks.length) {
        clearInterval(int);
        this.isStreaming = false;
      }
    }, 400);
  }

  stopStream() {
    // TODO: annulez la requête réelle (AbortController, Subject, etc.)
    this.isStreaming = false;
  }

  // Files
  onFilePick(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.pushFiles(Array.from(input.files));
    input.value = '';
  }

  onDragOver(ev: DragEvent) {
    ev.preventDefault();
    this.isDragging = true;
  }
  onDragLeave(_ev: DragEvent) {
    this.isDragging = false;
  }
  onDrop(ev: DragEvent) {
    ev.preventDefault();
    this.isDragging = false;
    const items = ev.dataTransfer?.files;
    if (items?.length) this.pushFiles(Array.from(items));
  }
  onPaste(ev: ClipboardEvent) {
    if (!ev.clipboardData) return;
    const fs: File[] = [];
    for (let i = 0; i < ev.clipboardData.items.length; i++) {
      const it = ev.clipboardData.items[i];
      if (it.kind === 'file') {
        const f = it.getAsFile();
        if (f) fs.push(f);
      }
    }
    if (fs.length) this.pushFiles(fs);
  }

  pushFiles(list: File[]) {
    const maxFiles = 10;
    const allowed = list.filter(f => this.isAllowedFile(f));
    this.files = [...this.files, ...allowed].slice(0, maxFiles);
  }

  isAllowedFile(f: File): boolean {
    const maxSize = 25 * 1024 * 1024;
    if (f.size > maxSize) return false;
    const okExt = [
      'png','jpg','jpeg','gif','webp','pdf','txt','csv','json',
      'doc','docx','ppt','pptx','xls','xlsx'
    ];
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    return okExt.includes(ext);
  }

  fileIcon(f: File): string {
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    if (['png','jpg','jpeg','gif','webp'].includes(ext)) return 'fa-image';
    if (ext === 'pdf') return 'fa-file-pdf';
    if (['csv','xls','xlsx'].includes(ext)) return 'fa-file-excel';
    if (['ppt','pptx'].includes(ext)) return 'fa-file-powerpoint';
    if (['doc','docx'].includes(ext)) return 'fa-file-word';
    if (['json','txt'].includes(ext)) return 'fa-file-lines';
    return 'fa-file';
  }

  removeFile(i: number) {
    this.files.splice(i, 1);
  }

  // Voice
  async toggleRecording() {
    if (this.isRecording) return this.stopRecording();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.startRecording(stream);
    } catch (e) {
      console.error('Micro refusé', e);
    }
  }

  startRecording(stream: MediaStream) {
    this.recordChunks = [];
    this.recordingSeconds = 0;
    this.isRecording = true;

    const mime = this.getMimeType();
    this.mediaRecorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    this.mediaRecorder.ondataavailable = (e) => e.data.size && this.recordChunks.push(e.data);
    this.mediaRecorder.onstop = () => {
      const type = this.mediaRecorder?.mimeType || 'audio/webm';
      this.audioBlob = new Blob(this.recordChunks, { type });
      stream.getTracks().forEach(t => t.stop());
    };
    this.mediaRecorder.start(200);
    this.timerRef = setInterval(() => this.recordingSeconds++, 1000);
  }

  stopRecording() {
    if (!this.isRecording) return;
    this.isRecording = false;
    clearInterval(this.timerRef);
    this.timerRef = null;
    this.mediaRecorder?.stop();
  }

  getMimeType(): string | '' {
    if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
    return '';
  }

  isImageName(name?: string): boolean {
    return !!name && this.imgRe.test(name);
  }

  isPdf(name?: string): boolean {
    return !!name && this.pdfRe.test(name);
  }
}
