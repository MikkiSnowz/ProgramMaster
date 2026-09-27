/** Weekly availability, keyed by JS weekday (0 = Sunday): list of [start, end] "HH:MM" ranges. */
export type Schedule = Record<string, [string, string][]>;

export interface Course {
  code: string;
  subject: string;
  title: string;
  rate: number;
  duration_hours: number;
  tags: string[];
  description: string;
  mode: Mode;
  syllabus: string[];
  active: boolean;
  pending?: number; // tutor dashboard only
  booked?: number;
}

export type Mode = keyof typeof MODES;
export const MODES = { online: 'ออนไลน์', onsite: 'เจอตัวที่สถานที่', hybrid: 'ออนไลน์หรือเจอตัว' };

/** Target levels; stored in a course's tags and used by the marketplace level filter. */
export const LEVELS = ['มัธยมต้น', 'มัธยมปลาย', 'มหาวิทยาลัย', 'วัยทำงาน'];

export interface CatalogCourse extends Course {
  tutor_id: string;
  tutor_name: string;
  avatar: string;
  rating: number;
  schedule: Schedule;
}

export const SUBJECTS = ['Mathematics', 'English', 'Physics', 'Computer', 'General'];

/** Monday-first display order: [weekday index, Thai name]. */
export const DAYS: [string, string][] = [
  ['1', 'วันจันทร์'], ['2', 'วันอังคาร'], ['3', 'วันพุธ'], ['4', 'วันพฤหัสบดี'],
  ['5', 'วันศุกร์'], ['6', 'วันเสาร์'], ['0', 'วันอาทิตย์'],
];

/** Hours shown on the schedule editor's day timeline. */
export const DAY_START = 6;
export const DAY_END = 24;

/** True if any open range in the schedule fully covers the "HH:MM - HH:MM" slot. */
export function covers(schedule: Schedule, slot: string) {
  const [from, to] = slot.split(' - ');
  return Object.values(schedule).some((ranges) => ranges.some(([s, e]) => s <= from && e >= to));
}
