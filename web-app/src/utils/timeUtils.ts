import { Language } from '../i18n/translations';

/**
 * Format a Date object into local clock time (e.g., "오후 1:15" / "1:15 PM" / "午後 1:15")
 */
export const formatClockTime = (date: Date, language: Language = 'ko'): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');

  if (language === 'ko') {
    const period = hours < 12 ? '오전' : '오후';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    return `${period} ${displayHour}:${minutes}`;
  } else if (language === 'ja') {
    const period = hours < 12 ? '午前' : '午後';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    return `${period} ${displayHour}:${minutes}`;
  } else if (language === 'zh') {
    const period = hours < 12 ? '上午' : '下午';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    return `${period} ${displayHour}:${minutes}`;
  } else if (language === 'fr') {
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  } else {
    const period = hours < 12 ? 'AM' : 'PM';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHour}:${minutes} ${period}`;
  }
};

/**
 * Format chat message timestamp:
 * - If under 60 seconds (1 minute): returns "방금" (or "Just now" / "たった今" / "Ahora" / "À l'instant" / "刚刚")
 * - If 60 seconds or older: returns exact clock time (e.g. "오후 1:15")
 * - If it's already a formatted string like "오후 1:00", preserves it unless timestamp is available
 */
export const formatChatTime = (
  timestamp?: number | string,
  language: Language = 'ko',
  fallbackTimeString?: string
): string => {
  let timeVal: number | null = null;

  if (typeof timestamp === 'number') {
    timeVal = timestamp;
  } else if (typeof timestamp === 'string') {
    if (/^\d{10,}$/.test(timestamp)) {
      timeVal = parseInt(timestamp, 10);
    } else if (/^(msg_|my_msg_|reply_)\d{10,}$/.test(timestamp)) {
      const numPart = timestamp.replace(/^(msg_|my_msg_|reply_)/, '');
      timeVal = parseInt(numPart, 10);
    }
  }

  // If we have a valid numeric timestamp
  if (timeVal && !isNaN(timeVal)) {
    const diffMs = Date.now() - timeVal;
    const diffSec = Math.floor(diffMs / 1000);

    // If within 60 seconds -> "방금"
    if (diffSec < 60) {
      if (language === 'ko') return '방금';
      if (language === 'ja') return 'たった今';
      if (language === 'es') return 'Ahora';
      if (language === 'fr') return "À l'instant";
      if (language === 'zh') return '刚刚';
      return 'Just now';
    }

    // After 60 seconds -> Exact clock time (e.g. "오후 1:15")
    return formatClockTime(new Date(timeVal), language);
  }

  // Check fallbackTimeString first if provided (e.g. "오후 1:00")
  if (fallbackTimeString && fallbackTimeString !== '방금' && fallbackTimeString !== '방금 전' && !/^(msg|reply)\d*$/i.test(fallbackTimeString)) {
    return fallbackTimeString;
  }

  // If already a pre-formatted string like "오후 1:00"
  if (
    typeof timestamp === 'string' &&
    timestamp !== '방금' &&
    timestamp !== '방금 전' &&
    timestamp !== 'Just now' &&
    timestamp !== 'たった今' &&
    timestamp !== 'Ahora' &&
    !/^(msg|reply)\d*$/i.test(timestamp)
  ) {
    return timestamp;
  }

  // If no timestamp available, format current time
  return formatClockTime(new Date(), language);
};
