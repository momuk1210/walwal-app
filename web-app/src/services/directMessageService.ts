/**
 * directMessageService.ts
 * Manages 1:1 Direct Messages & Note History across WalWal
 */

export interface DirectMessageItem {
  id: string;
  sender: 'me' | 'target';
  text: string;
  timestamp: number;
  time?: string;
}

export interface DirectConversationTargetDog {
  id?: string;
  name: string;
  ownerName?: string;
  avatar?: string;
  breed?: string;
  age?: string | number;
  gender?: string;
  personality?: string[];
  distance?: string;
}

export interface DirectConversation {
  conversationId: string;
  targetDog: DirectConversationTargetDog;
  lastMessage: string;
  lastUpdated: number;
  messages: DirectMessageItem[];
}

const STORAGE_KEY = 'WALWAL_DIRECT_MESSAGES';

export const getConversationKey = (targetDog: { id?: string; name: string }): string => {
  if (!targetDog) return 'unknown';
  if (targetDog.id) return String(targetDog.id).trim();
  return String(targetDog.name || 'unknown').trim();
};

export const getStoredConversations = (): Record<string, DirectConversation> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (e) {
    console.error('Failed to parse WALWAL_DIRECT_MESSAGES:', e);
    return {};
  }
};

export const getConversation = (targetDog: { id?: string; name: string }): DirectConversation | null => {
  if (!targetDog) return null;
  const key = getConversationKey(targetDog);
  const all = getStoredConversations();
  return all[key] || null;
};

export const getAllConversationsList = (): DirectConversation[] => {
  const all = getStoredConversations();
  return Object.values(all).sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
};

export const saveDirectMessage = (
  targetDog: DirectConversationTargetDog,
  messageContent: { text: string; sender?: 'me' | 'target'; time?: string }
): DirectMessageItem => {
  const key = getConversationKey(targetDog);
  const all = getStoredConversations();
  const existing = all[key] || {
    conversationId: key,
    targetDog: {
      id: targetDog.id,
      name: targetDog.name,
      ownerName: targetDog.ownerName,
      avatar: targetDog.avatar,
      breed: targetDog.breed,
      age: targetDog.age,
      gender: targetDog.gender,
      personality: targetDog.personality,
      distance: targetDog.distance
    },
    lastMessage: '',
    lastUpdated: Date.now(),
    messages: []
  };

  // Always update targetDog profile in case avatar or name changed
  existing.targetDog = {
    ...existing.targetDog,
    ...targetDog
  };

  const now = Date.now();
  const newItem: DirectMessageItem = {
    id: `msg_${now}_${Math.random().toString(36).slice(2, 7)}`,
    sender: messageContent.sender || 'me',
    text: messageContent.text.trim(),
    timestamp: now,
    time: messageContent.time
  };

  existing.messages = [...(existing.messages || []), newItem];
  existing.lastMessage = newItem.text;
  existing.lastUpdated = now;

  all[key] = existing;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Failed to save WALWAL_DIRECT_MESSAGES:', e);
  }

  // Notify any active listeners/inbox
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('walwal_messages_updated', {
        detail: { conversationKey: key, message: newItem }
      })
    );
  }

  return newItem;
};

export const deleteConversation = (targetDogOrKey: string | { id?: string; name: string }): void => {
  const key = typeof targetDogOrKey === 'string' ? targetDogOrKey : getConversationKey(targetDogOrKey);
  const all = getStoredConversations();
  if (all[key]) {
    delete all[key];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to update WALWAL_DIRECT_MESSAGES on delete:', e);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('walwal_messages_updated', {
          detail: { deletedKey: key }
        })
      );
    }
  }
};
