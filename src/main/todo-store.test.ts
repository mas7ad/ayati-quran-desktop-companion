import { describe, expect, it } from 'vitest';

import {
  createTodo,
  deleteTodo,
  getDueTodoReminder,
  listTodos,
  setTodoCompleted,
  updateTodo,
} from './todo-store';
import { createDefaultAyahLensState } from './ayah-reflection-store';

const NOW = new Date('2026-05-02T12:00:00Z').getTime();

describe('todo store', () => {
  it('creates, updates, completes, reopens, and deletes a local task', () => {
    const initial = createDefaultAyahLensState().todos;
    const created = createTodo(initial, {
      title: '  Review tafsir notes  ',
      notes: 'After Dhuhr',
      priority: 'high',
      dueAt: NOW + 60_000,
      reminderAt: NOW,
    }, NOW);
    const task = created.items[0];
    expect(task).toMatchObject({ title: 'Review tafsir notes', notes: 'After Dhuhr', priority: 'high', completedAt: null });

    const updated = updateTodo(created, task.id, { title: 'Review Qur’an notes', priority: 'medium' }, NOW + 1);
    expect(updated.items[0]).toMatchObject({ title: 'Review Qur’an notes', priority: 'medium', updatedAt: NOW + 1 });

    const completed = setTodoCompleted(updated, task.id, true, NOW + 2);
    expect(completed.items[0].completedAt).toBe(NOW + 2);

    const reopened = setTodoCompleted(completed, task.id, false, NOW + 3);
    expect(reopened.items[0].completedAt).toBeNull();

    expect(deleteTodo(reopened, task.id).items).toHaveLength(0);
  });

  it('rejects invalid task titles', () => {
    expect(() => createTodo(createDefaultAyahLensState().todos, { title: '' }, NOW)).toThrow('Task title is required.');
    expect(() => createTodo(createDefaultAyahLensState().todos, { title: 'x'.repeat(121) }, NOW)).toThrow('Task title must be 120 characters or fewer.');
  });

  it('finds due unreminded tasks and sorts active tasks before completed tasks', () => {
    let state = createDefaultAyahLensState().todos;
    state = createTodo(state, { title: 'Later', dueAt: NOW + 60_000, priority: 'low' }, NOW);
    state = createTodo(state, { title: 'Due now', dueAt: NOW - 60_000, priority: 'high' }, NOW + 1);
    state = setTodoCompleted(state, state.items.find((item) => item.title === 'Later')?.id ?? '', true, NOW + 2);

    expect(getDueTodoReminder(state, NOW)?.title).toBe('Due now');
    const listed = listTodos(state, NOW);
    expect(listed[0].title).toBe('Due now');
    expect(listed[listed.length - 1].title).toBe('Later');
  });
});
