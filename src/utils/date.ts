import dayjs from 'dayjs';

export const DATE_PATTERN = 'YYYY-MM-DD';

export function getTodayStr() {
  return dayjs().format(DATE_PATTERN);
}
