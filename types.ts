export enum TaskStatus {
  BACKLOG = 'BACKLOG',
  SPRINT_TODO = 'SPRINT_TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}

export enum TaskType {
  STORY = 'STORY',
  BUG = 'BUG',
  TASK = 'TASK',
}

export enum Priority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export interface User {
  id: string;
  name: string;
  avatar: string; // Color or Initials
}

export interface Task {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria?: string;
  status: TaskStatus;
  type: TaskType;
  priority: Priority;
  points: number;
  assignee?: string; // User ID
  createdAt: string;
}

export type ViewMode = 'BACKLOG' | 'SPRINT' | 'KANBAN' | 'PROMPTS';

export interface SprintSettings {
  isStarted: boolean;
  durationWeeks: number;
  startDate?: string;
  goal: string;
}