import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, orderBy, onSnapshot, doc, setDoc, getDocs, getDoc, Timestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

interface Message {
  senderId: string;
  text: string;
  timestamp: Timestamp;
}

interface User {
  uid: string;
  username: string;
  email?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  constructor(private firestore: Firestore) {}

  // 🟢 جلب جميع المستخدمين وتحديثهم في الوقت الحقيقي
  getUsers(): Observable<User[]> {
    return new Observable(observer => {
      const usersRef = collection(this.firestore, 'users');
      const unsubscribe = onSnapshot(usersRef, snapshot => {
        const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
        observer.next(users);
      });
      return () => unsubscribe();
    });
  }

  // 🟢 جلب بيانات مستخدم حسب الـ UID
  async getUserById(uid: string): Promise<User | null> {
    const userRef = doc(this.firestore, 'users', uid);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? ({ uid: userSnap.id, ...userSnap.data() } as User) : null;
  }

  // 🔵 البحث عن محادثة بين مستخدمين أو إنشاؤها
  async getChatId(user1: string, user2: string): Promise<string> {
    if (user1 === user2) return ''; // لا يمكن للمستخدم بدء محادثة مع نفسه

    const chatQuery = query(collection(this.firestore, 'chats'), where('users', 'array-contains', user1));
    const snapshot = await getDocs(chatQuery);

    for (const docSnap of snapshot.docs) {
      const chat = docSnap.data();
      if (chat['users'].includes(user2)) {
        return docSnap.id;
      }
    }

    // إنشاء محادثة جديدة إذا لم تكن موجودة
    const newChatRef = doc(collection(this.firestore, 'chats'));
    await setDoc(newChatRef, { users: [user1, user2], createdAt: Timestamp.now() });

    return newChatRef.id;
  }

  // 🔵 إرسال رسالة جديدة
  async sendMessage(chatId: string, senderId: string, text: string) {
    if (!text.trim()) return; // لا نرسل رسائل فارغة

    const messagesRef = collection(this.firestore, 'chats', chatId, 'messages');
    await addDoc(messagesRef, {
      senderId,
      text,
      timestamp: Timestamp.now(),
    });
  }

  // 🔵 الاستماع إلى الرسائل في الوقت الحقيقي
  getMessages(chatId: string): Observable<Message[]> {
    return new Observable(observer => {
      const messagesRef = collection(this.firestore, 'chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(q, snapshot => {
        const messages: Message[] = snapshot.docs.map(doc => doc.data() as Message);
        observer.next(messages);
      });

      return () => unsubscribe();
    });
  }
}
