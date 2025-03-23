import { Component, inject, Signal, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ChatService } from './chat.services';

interface User {
  uid: string;
  username: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent {
  private chatService = inject(ChatService);
  private authService = inject(AuthService);

  users = signal<User[]>([]);
  currentUser = signal<User | null>(null);
  selectedChatId = signal<string | null>(null);
  selectedChatUser = signal<string>('');
  newMessage = signal<string>('');
  messages = signal<any[]>([]); // تحديث كود الرسائل ليستخدم Signal بدلاً من Observable

  constructor() {
    // 🟢 مراقبة المستخدم الحالي وتحديثه تلقائيًا
    effect(() => {
      this.authService.getCurrentUser().subscribe(user => {
        if (user) {
          this.currentUser.set({ uid: user.uid, username: user.displayName || 'Unknown' });
        }
      });
    });

    // 🟢 جلب قائمة المستخدمين وتحديثها تلقائيًا
    effect(() => {
      this.chatService.getUsers().subscribe(users => {
        this.users.set(users);
      });
    });

    // 🟢 تحديث الرسائل عند تغيير الشات المحدد
    effect(() => {
      const chatId = this.selectedChatId();
      if (chatId) {
        this.chatService.getMessages(chatId).subscribe(messages => {
          this.messages.set(messages);
        });
      }
    });
  }

  async startChat(userId: string, username: string) {
    const currentUser = this.currentUser();
    if (!currentUser?.uid || this.selectedChatId() === userId) return; // تجنب إعادة تحميل الشات إذا لم يتغير

    const chatId = await this.chatService.getChatId(currentUser.uid, userId);
    this.selectedChatId.set(chatId);
    this.selectedChatUser.set(username);
  }

  sendMessage() {
    const currentUser = this.currentUser();
    const messageText = this.newMessage().trim();

    if (!messageText || !this.selectedChatId() || !currentUser?.uid) return;

    this.chatService.sendMessage(this.selectedChatId()!, currentUser.uid, messageText);
    this.newMessage.set('');
  }

  updateMessage(event: Event) {
    this.newMessage.set((event.target as HTMLInputElement).value);
  }
}
