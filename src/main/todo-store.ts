import { randomUUID } from 'crypto';

import type { TodoItem, TodoPriority, TodoState } from './ayah-types';

const MAX_TITLE_LENGTH = 120;
const MAX_NOTES_LENGTH = 2000;
const PRIORITY_WEIGHT: Record<TodoPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
  none: 0,
};

function sanitizeTitle(title: unknown): string {
  const normalized = typeof title === 'string' ? title.trim().replace(/\s+/g, ' ') : '';
  if (!normalized) throw new Error('Task title is required.');
  if (normalized.length > MAX_TITLE_LENGTH) throw new Error('Task title must be 120 characters or fewer.');
  return normalized;
}

function sanitizeNotes(notes: unknown): string {
  if (typeof notes !== 'string') return '';
  return notes.trim().slice(0, MAX_NOTES_LENGTH);
}

function sanitizePriority(priority: unknown): TodoPriority {
  return priority === 'low' || priority === 'medium' || priority === 'high' || priority === 'none'
    ? priority
    : 'none';
}

function sanitizeTimestamp(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function sortTodoItems(items: TodoItem[], now: number): TodoItem[] {
  return [...items].sort((left, right) => {
    const leftComplete = Boolean(left.completedAt);
    const rightComplete = Boolean(right.completedAt);
    if (leftComplete !== rightComplete) return leftComplete ? 1 : -1;

    const leftDue = left.dueAt ?? Number.MAX_SAFE_INTEGER;
    const rightDue = right.dueAt ?? Number.MAX_SAFE_INTEGER;
    const leftOverdue = !leftComplete && leftDue < now;
    const rightOverdue = !rightComplete && rightDue < now;
    if (leftOverdue !== rightOverdue) return leftOverdue ? -1 : 1;
    if (leftDue !== rightDue) return leftDue - rightDue;

    const priorityDiff = PRIORITY_WEIGHT[right.priority] - PRIORITY_WEIGHT[left.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return right.createdAt - left.createdAt;
  });
}

/** Local calendar day start (00:00:00) for the given timestamp. */
export function getStartOfLocalDay(now: number): number {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** Removes completed tasks from before today (local midnight rollover). */
export function purgeCompletedTodos(state: TodoState, now: number = Date.now()): TodoState {
  const startOfToday = getStartOfLocalDay(now);
  const items = state.items.filter((item) => !item.completedAt || item.completedAt >= startOfToday);
  if (items.length === state.items.length) return state;

  const remainingIds = new Set(items.map((item) => item.id));
  return {
    ...state,
    items,
    sentReminderIds: state.sentReminderIds.filter((id) => remainingIds.has(id)),
  };
}

export function listTodos(state: TodoState, now: number = Date.now()): TodoItem[] {
  return sortTodoItems(state.items, now);
}

export function createTodo(
  state: TodoState,
  input: {
    title: string;
    notes?: string;
    priority?: TodoPriority;
    dueAt?: number | null;
    reminderAt?: number | null;
  },
  now: number = Date.now(),
): TodoState {
  const item: TodoItem = {
    id: randomUUID(),
    title: sanitizeTitle(input.title),
    notes: sanitizeNotes(input.notes),
    priority: sanitizePriority(input.priority),
    createdAt: now,
    updatedAt: now,
    dueAt: sanitizeTimestamp(input.dueAt),
    reminderAt: sanitizeTimestamp(input.reminderAt),
    completedAt: null,
  };
  return { ...state, items: [item, ...state.items] };
}

export function updateTodo(
  state: TodoState,
  todoId: string,
  patch: Partial<Pick<TodoItem, 'title' | 'notes' | 'priority' | 'dueAt' | 'reminderAt'>>,
  now: number = Date.now(),
): TodoState {
  return {
    ...state,
    sentReminderIds: state.sentReminderIds.filter((id) => id !== todoId),
    items: state.items.map((item) => {
      if (item.id !== todoId) return item;
      return {
        ...item,
        title: patch.title === undefined ? item.title : sanitizeTitle(patch.title),
        notes: patch.notes === undefined ? item.notes : sanitizeNotes(patch.notes),
        priority: patch.priority === undefined ? item.priority : sanitizePriority(patch.priority),
        dueAt: patch.dueAt === undefined ? item.dueAt : sanitizeTimestamp(patch.dueAt),
        reminderAt: patch.reminderAt === undefined ? item.reminderAt : sanitizeTimestamp(patch.reminderAt),
        updatedAt: now,
      };
    }),
  };
}

export function setTodoCompleted(state: TodoState, todoId: string, completed: boolean, now: number = Date.now()): TodoState {
  return {
    ...state,
    items: state.items.map((item) => (
      item.id === todoId
        ? { ...item, completedAt: completed ? now : null, updatedAt: now }
        : item
    )),
  };
}

export function deleteTodo(state: TodoState, todoId: string): TodoState {
  return {
    ...state,
    items: state.items.filter((item) => item.id !== todoId),
    sentReminderIds: state.sentReminderIds.filter((id) => id !== todoId),
  };
}

export function getDueTodoReminder(state: TodoState, now: number): TodoItem | null {
  if (!state.settings.petRemindersEnabled) return null;
  return listTodos(state, now).find((item) => {
    if (item.completedAt || state.sentReminderIds.includes(item.id)) return false;
    const reminderAt = item.reminderAt ?? item.dueAt;
    return typeof reminderAt === 'number' && reminderAt <= now;
  }) ?? null;
}
