// ============================================
// PROSE - Bubble Type Definitions
// ============================================

export type BubbleType =
  | 'note'
  | 'task'
  | 'project'
  | 'goal'
  | 'journal'
  | 'library'
  | 'ideas'
  | 'document'
  | 'planner'
  | 'tracker'
  | 'meeting';

export type ConnectionType =
  | 'inspired_by'
  | 'depends_on'
  | 'part_of'
  | 'related_to'
  | 'blocks'
  | 'references';

export type Priority = 'low' | 'medium' | 'high';

export interface BubbleConnection {
  id: string;
  targetBubbleId: string;
  connectionType: ConnectionType;
  label?: string;
}

export interface TaskStep {
  id: string;
  description: string;
  isCompleted: boolean;
  createdAt: Date;
}

export interface TaskData {
  isCompleted: boolean;
  dueDate?: Date;
  priority: Priority;
  steps: TaskStep[];
}

export interface Milestone {
  id: string;
  title: string;
  isCompleted: boolean;
  dueDate?: Date;
}

export interface ProjectData {
  progress: number; // 0-100
  milestones: Milestone[];
  teamMembers?: string[];
  startDate?: Date;
  endDate?: Date;
}

export interface GoalData {
  progress: number; // 0-100
  target: string;
  deadline?: Date;
  milestones: string[];
}

export interface JournalEntry {
  timestamp: Date;
  content: string;
  mood?: string;
}

export interface JournalData {
  entries: JournalEntry[];
  currentMood?: string;
}

export interface LibraryItem {
  id: string;
  title: string;
  url?: string;
  type: 'article' | 'book' | 'video' | 'podcast';
  isRead: boolean;
}

export interface LibraryData {
  items: LibraryItem[];
}

export interface IdeasData {
  ideas: string[];
}

export interface DocumentData {
  content: string; // Rich text HTML or Markdown
  wordCount: number;
  readingTimeMinutes: number;
}

export interface PlannerEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime?: Date;
  isAllDay: boolean;
}

export interface PlannerData {
  events: PlannerEvent[];
}

export interface TrackerMetric {
  date: Date;
  value: number;
}

export interface TrackerData {
  metricName: string;
  unit: string;
  metrics: TrackerMetric[];
  goal?: number;
}

export interface MeetingData {
  attendees: string[];
  date: Date;
  duration: number; // minutes
  agenda?: string[];
  notes: string;
}

export interface NoteEntry {
  timestamp: Date;
  content: string;
}

export interface NoteData {
  entries: NoteEntry[];
}

export type BubbleTypeData =
  | TaskData
  | ProjectData
  | GoalData
  | JournalData
  | LibraryData
  | IdeasData
  | DocumentData
  | PlannerData
  | TrackerData
  | MeetingData
  | NoteData;

export interface Bubble {
  id: string;
  type: BubbleType;
  title: string;
  content: string; // Preview/summary

  // Visual
  emoji: string;
  color: string;
  position: { x: number; y: number };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  tags: string[];

  // Type-specific data
  typeData: BubbleTypeData;

  // Connections & Hierarchy
  connections: BubbleConnection[];
  parentBubbleId?: string;
  childBubbleIds: string[];
}

// Helper type for bubble creation
export interface CreateBubbleInput {
  type: BubbleType;
  title: string;
  content?: string;
  emoji?: string;
  tags?: string[];
}
