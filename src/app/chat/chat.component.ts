import { Component, inject, OnInit, OnDestroy, Signal, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ChatService } from './chat.services';
import { Message } from 'postcss';

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
export class ChatComponent implements OnInit, OnDestroy {
  private chatService = inject(ChatService);
  private authService = inject(AuthService);

  users = signal<User[]>([]);
  currentUser = signal<User | null>(null);
  selectedChatId = signal<string | null>(null);
  selectedChatUser = signal<string>('');
  newMessage = signal<string>('');
  messages$: Observable<Message[]> = new Observable<Message[]>();
  private subscriptions: Subscription[] = [];

  ngOnInit() {
    // 🟢 جلب المستخدم الحالي وتحديثه تلقائيًا
    const userSub = this.authService.getCurrentUser().subscribe(user => {
      if (user) {
        this.currentUser.set({ uid: user.uid, username: user.displayName || 'Unknown' });
      }
    });
    this.subscriptions.push(userSub);

    // 🟢 جلب المستخدمين وتحديثهم في الوقت الحقيقي
    const usersSub = this.chatService.getUsers().subscribe(users => {
      this.users.set(users);
    });
    this.subscriptions.push(usersSub);
  }

  async startChat(userId: string, username: string) {
    const currentUser = this.currentUser();
    if (!currentUser?.uid || this.selectedChatId() === userId) return; // تجنب إعادة التحميل إذا لم يتغير الشات

    const chatId = await this.chatService.getChatId(currentUser.uid, userId);
    this.selectedChatId.set(chatId);
    this.selectedChatUser.set(username);
    // this.messages$ = this.chatService.getMessages(chatId);
  }

  sendMessage() {
    const currentUser = this.currentUser();
    const messageText = this.newMessage().trim();

    if (!messageText || !this.selectedChatId() || !currentUser?.uid) return;

    this.chatService.sendMessage(this.selectedChatId()!, currentUser.uid, messageText);
    this.newMessage.set('');
  }

  // 🟢 تحسين الأداء عند التكرار في Angular
  trackByUserId(index: number, user: User) {
    return user.uid;
  }

  trackByMessage(index: number, message: Message) {
    return message['timestamp'];
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe()); // تفادي تسريبات الذاكرة
  }
}
