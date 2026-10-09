// Utility to parse meetup date/time and dynamically determine display string and status

export interface ParsedMeetupTime {
  date: string;       // YYYY-MM-DD
  time: string;       // HH:mm
  targetDate: Date;
  isPast: boolean;
  status: 'upcoming' | 'past';
  statusLabelKo: string;
  statusLabelEn: string;
}

export const getTodayDateStr = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * Extract absolute YYYY-MM-DD and HH:mm from a meetup object,
 * using explicit fields, id timestamp, or text fallback.
 */
export const extractMeetupDateTime = (meetup: {
  id?: string;
  date?: string;
  rawDate?: string;
  timeStr?: string;
  rawTime?: string;
  dateTime?: string;
  time?: string;
  createdAt?: number;
}): { date: string; time: string; targetDate: Date } => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayStr = getTodayDateStr();

  // 1. Explicit absolute date string (e.g. 2026-10-06)
  if (meetup.date && /^\d{4}-\d{2}-\d{2}$/.test(meetup.date.trim())) {
    const dStr = meetup.date.trim();
    let tStr = meetup.rawTime || meetup.timeStr || '15:00';
    if (!/^\d{1,2}:\d{2}$/.test(tStr)) {
      const parsedFromTime = parseTimeOnly(meetup.time || '');
      tStr = parsedFromTime;
    }
    const [y, m, d] = dStr.split('-').map(Number);
    const [hh, mm] = tStr.split(':').map(Number);
    return {
      date: dStr,
      time: `${pad(hh)}:${pad(mm)}`,
      targetDate: new Date(y, m - 1, d, hh, mm, 0)
    };
  }

  // 2. Explicit ISO dateTime string
  if (meetup.dateTime && meetup.dateTime.includes('T')) {
    const [dPart, tPart] = meetup.dateTime.split('T');
    if (/^\d{4}-\d{2}-\d{2}$/.test(dPart)) {
      const [hh, mm] = tPart.split(':').map(Number);
      const [y, m, d] = dPart.split('-').map(Number);
      return {
        date: dPart,
        time: `${pad(hh || 15)}:${pad(mm || 0)}`,
        targetDate: new Date(y, m - 1, d, hh || 15, mm || 0, 0)
      };
    }
  }

  // 3. Fallback: Parse from meetup.time text
  const timeText = (meetup.dateTime || meetup.time || '').trim();
  const lowerText = timeText.toLowerCase();

  // Determine creation date from id (e.g. m_1759680000000) or createdAt
  let createdDateStr = todayStr;
  if (meetup.createdAt && typeof meetup.createdAt === 'number') {
    const cd = new Date(meetup.createdAt);
    createdDateStr = `${cd.getFullYear()}-${pad(cd.getMonth() + 1)}-${pad(cd.getDate())}`;
  } else if (meetup.id && meetup.id.startsWith('m_')) {
    const ts = parseInt(meetup.id.replace('m_', ''), 10);
    if (!isNaN(ts) && ts > 1000000000000) {
      const cd = new Date(ts);
      createdDateStr = `${cd.getFullYear()}-${pad(cd.getMonth() + 1)}-${pad(cd.getDate())}`;
    }
  }

  let resolvedDate = todayStr;

  if (timeText.includes('내일') || lowerText.includes('tomorrow') || timeText.includes('明日') || lowerText.includes('mañana')) {
    // If text says tomorrow relative to when it was created:
    const baseDate = new Date(createdDateStr + 'T00:00:00');
    baseDate.setDate(baseDate.getDate() + 1);
    resolvedDate = `${baseDate.getFullYear()}-${pad(baseDate.getMonth() + 1)}-${pad(baseDate.getDate())}`;
  } else if (timeText.includes('오늘') || lowerText.includes('today') || timeText.includes('今日') || lowerText.includes('hoy')) {
    // Relative to the day it was created!
    resolvedDate = createdDateStr;
  } else {
    // Look for explicit full date YYYY-MM-DD
    const fullDateMatch = timeText.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (fullDateMatch) {
      resolvedDate = `${fullDateMatch[1]}-${pad(Number(fullDateMatch[2]))}-${pad(Number(fullDateMatch[3]))}`;
    } else {
      const monthDayMatch = timeText.match(/(\d{1,2})[월月\/\.-]\s*(\d{1,2})[일日]?/);
      if (monthDayMatch) {
        const m = pad(Number(monthDayMatch[1]));
        const d = pad(Number(monthDayMatch[2]));
        resolvedDate = `${now.getFullYear()}-${m}-${d}`;
      } else {
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const esMonths = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        let matchedMonthIdx = -1;
        for (let i = 0; i < 12; i++) {
          if (lowerText.includes(monthNames[i]) || lowerText.includes(esMonths[i])) {
            matchedMonthIdx = i;
            break;
          }
        }
        if (matchedMonthIdx !== -1) {
          const dayMatch = timeText.match(/\b(\d{1,2})\b/);
          if (dayMatch) {
            resolvedDate = `${now.getFullYear()}-${pad(matchedMonthIdx + 1)}-${pad(Number(dayMatch[1]))}`;
          }
        }
      }
    }
  }

  const timeOnly = parseTimeOnly(timeText);
  const [hh, mm] = timeOnly.split(':').map(Number);
  const [y, m, d] = resolvedDate.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d, hh, mm, 0);

  return {
    date: resolvedDate,
    time: timeOnly,
    targetDate
  };
};

const parseTimeOnly = (timeText: string): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const lowerText = timeText.toLowerCase();

  let hours = 15;
  let minutes = 0;
  const pmMatch = lowerText.includes('오후') || lowerText.includes('저녁') || lowerText.includes('밤') || lowerText.includes('pm') || lowerText.includes('午後');
  const amMatch = lowerText.includes('오전') || lowerText.includes('아침') || lowerText.includes('새벽') || lowerText.includes('am') || lowerText.includes('午前');

  const colonMatch = timeText.match(/(\d{1,2}):(\d{2})/);
  if (colonMatch) {
    hours = parseInt(colonMatch[1], 10);
    minutes = parseInt(colonMatch[2], 10);
    if (pmMatch && hours < 12) hours += 12;
    if (amMatch && hours === 12) hours = 0;
  } else {
    const hourMatch = timeText.match(/(\d{1,2})\s*(시|時|h|pm|am)/i) || timeText.match(/\b(\d{1,2})\s*(?:pm|am)\b/i);
    const minMatch = timeText.match(/(\d{1,2})\s*(분|m|min)/i);
    if (hourMatch) {
      hours = parseInt(hourMatch[1], 10);
      if (pmMatch && hours < 12) hours += 12;
      if (amMatch && hours === 12) hours = 0;
      if (minMatch) minutes = parseInt(minMatch[1], 10);
    }
  }

  return `${pad(hours)}:${pad(minutes)}`;
};

/**
 * Format date & time dynamically relative to CURRENT time (Today, Tomorrow, or Month Day)
 */
export const formatMeetupDisplay = (
  meetup: {
    id?: string;
    date?: string;
    rawDate?: string;
    timeStr?: string;
    rawTime?: string;
    dateTime?: string;
    time?: string;
    createdAt?: number;
  },
  lang: string = 'ko'
): string => {
  const { date, time, targetDate } = extractMeetupDateTime(meetup);
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');

  const todayStr = getTodayDateStr();
  const tm = new Date(now);
  tm.setDate(now.getDate() + 1);
  const tomorrowStr = `${tm.getFullYear()}-${pad(tm.getMonth() + 1)}-${pad(tm.getDate())}`;

  const isToday = date === todayStr;
  const isTomorrow = date === tomorrowStr;

  const [hours, minutes] = time.split(':').map(Number);
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;

  let timeFormatted = '';
  if (lang === 'en') {
    const ampm = hours < 12 ? 'AM' : 'PM';
    timeFormatted = minutes === 0 ? `${displayHour} ${ampm}` : `${displayHour}:${pad(minutes)} ${ampm}`;
  } else if (lang === 'ja') {
    const ampm = hours < 12 ? '午前' : '午後';
    timeFormatted = minutes === 0 ? `${ampm}${displayHour}時` : `${ampm}${displayHour}時${minutes}分`;
  } else if (lang === 'es') {
    const ampm = hours < 12 ? 'AM' : 'PM';
    timeFormatted = minutes === 0 ? `${displayHour} ${ampm}` : `${displayHour}:${pad(minutes)} ${ampm}`;
  } else {
    const ampm = hours < 12 ? '오전' : '오후';
    const minStr = minutes === 0 ? '' : ` ${minutes}분`;
    timeFormatted = `${ampm} ${displayHour}시${minStr}`;
  }

  if (isToday) {
    if (lang === 'en') return `Today ${timeFormatted}`;
    if (lang === 'ja') return `今日 ${timeFormatted}`;
    if (lang === 'es') return `Hoy ${timeFormatted}`;
    return `오늘 ${timeFormatted}`;
  }

  if (isTomorrow) {
    if (lang === 'en') return `Tomorrow ${timeFormatted}`;
    if (lang === 'ja') return `明日 ${timeFormatted}`;
    if (lang === 'es') return `Mañana ${timeFormatted}`;
    return `내일 ${timeFormatted}`;
  }

  // Other dates: Format as explicit date
  const [year, month, day] = date.split('-').map(Number);
  const dayOfWeek = targetDate.getDay();

  if (lang === 'en') {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[month - 1]} ${day} (${dayNames[dayOfWeek]}) ${timeFormatted}`;
  }
  if (lang === 'ja') {
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    return `${month}月${day}日 (${dayNames[dayOfWeek]}) ${timeFormatted}`;
  }
  if (lang === 'es') {
    const dayNames = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${day} ${monthNames[month - 1]} (${dayNames[dayOfWeek]}) ${timeFormatted}`;
  }

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  return `${month}월 ${day}일 (${dayNames[dayOfWeek]}) ${timeFormatted}`;
};

export const getMeetupDynamicStatus = (meetup: {
  id?: string;
  date?: string;
  dateTime?: string;
  time?: string;
  status?: string;
  createdAt?: number;
}): {
  status: 'upcoming' | 'past';
  isPast: boolean;
  labelKo: string;
  labelEn: string;
} => {
  try {
    const { targetDate } = extractMeetupDateTime(meetup);
    const now = new Date();
    // 모임 시작 시간으로부터 2시간 경과 시 마감/종료
    const isPast = targetDate.getTime() + (2 * 60 * 60 * 1000) < now.getTime();
    return {
      status: isPast ? 'past' : 'upcoming',
      isPast,
      labelKo: isPast ? '일정 종료' : '모집중',
      labelEn: isPast ? 'past' : 'upcoming'
    };
  } catch (e) {
    const isPast = meetup.status === 'past';
    return {
      status: isPast ? 'past' : 'upcoming',
      isPast,
      labelKo: isPast ? '일정 종료' : '모집중',
      labelEn: isPast ? 'past' : 'upcoming'
    };
  }
};
