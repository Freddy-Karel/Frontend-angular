export interface Board {
  id: number;
  title: string;
  description?: string;
  backgroundColor?: string;
  coverImageUrl?: string;
  ownerId: number;
  createdAt: string;
  lists?: List[];
  members?: User[];
}

export interface List {
  id: number;
  title: string;
  position: number;
  boardId: number;
  cards?: Card[];
}

export interface Card {
  id: number;
  title: string;
  description?: string;
  position: number;
  listId: number;
  dueDate?: string;
  assigneeId?: number;
  assignee?: User;
  subtasks?: Subtask[];
  comments?: Comment[];
  labels?: Label[];
}

export interface Subtask {
  id: number;
  title: string;
  isCompleted: boolean;
  cardId: number;
}

export interface Comment {
  id: number;
  content: string;
  cardId: number;
  userId: number;
  user?: User;
  createdAt: string;
}

export interface Label {
  id: number;
  name: string;
  color: string;
  cardId: number;
}

export interface User {
  id: number;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role?: 'admin' | 'member' | 'viewer';
}
