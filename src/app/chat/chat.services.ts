import { Injectable, inject } from '@angular/core';
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
  private firestore = inject(Firestore); // ✅ استخدام inject بدل constructor

  // 🟢 جلب جميع المستخدمين في الوقت الحقيقي
  getUsers(): Observable<User[]> {
    return new Observable(observer => {
      const usersRef = collection(this.firestore, 'users');
      const unsubscribe = onSnapshot(usersRef, snapshot => {
        const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
        observer.next(users);
      }, error => console.error("Error fetching users:", error)); // ✅ التعامل مع الأخطاء

      return () => unsubscribe();
    });
  }

  // 🟢 جلب بيانات مستخدم معين
  async getUserById(uid: string): Promise<User | null> {
    try {
      const userRef = doc(this.firestore, 'users', uid);
      const userSnap = await getDoc(userRef);
      return userSnap.exists() ? ({ uid: userSnap.id, ...userSnap.data() } as User) : null;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  }

  // 🔵 البحث عن محادثة أو إنشاؤها
  async getChatId(user1: string, user2: string): Promise<string> {
    if (user1 === user2) return ''; // ✅ منع المحادثة مع النفس

    try {
      const chatQuery = query(collection(this.firestore, 'chats'), where('users', 'array-contains', user1));
      const snapshot = await getDocs(chatQuery);

      for (const docSnap of snapshot.docs) {
        const chat = docSnap.data();
        if (chat['users'].includes(user2)) {
          return docSnap.id;
        }
      }

      // ✅ إنشاء محادثة جديدة مع `merge: true` لتجنب الكتابة فوق البيانات
      const newChatRef = doc(collection(this.firestore, 'chats'));
      await setDoc(newChatRef, { users: [user1, user2], createdAt: Timestamp.now() }, { merge: true });

      return newChatRef.id;
    } catch (error) {
      console.error("Error getting/creating chat:", error);
      return '';
    }
  }

  // 🔵 إرسال رسالة جديدة
  async sendMessage(chatId: string, senderId: string, text: string) {
    if (!text.trim()) return; // ✅ منع إرسال رسائل فارغة

    try {
      const messagesRef = collection(this.firestore, 'chats', chatId, 'messages');
      await addDoc(messagesRef, {
        senderId,
        text,
        timestamp: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  // 🔵 الاستماع إلى الرسائل في الوقت الحقيقي
  getMessages(chatId: string): Observable<Message[]> {
    return new Observable(observer => {
      const messagesRef = collection(this.firestore, 'chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(q, snapshot => {
        const messages: Message[] = snapshot.docs.map(doc => doc.data() as Message);
        observer.next(messages);
      }, error => console.error("Error fetching messages:", error)); // ✅ التعامل مع الأخطاء

      return () => unsubscribe();
    });
  }
}
