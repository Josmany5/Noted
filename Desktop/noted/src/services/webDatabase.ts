// ============================================
// NOTED - Web Database Service (localStorage)
// Fallback for web browsers
// ============================================

import type {
  Note,
  Entry,
  Folder,
} from '../types';

const STORAGE_KEYS = {
  NOTES: 'noted_notes',
  FOLDERS: 'noted_folders',
};

class WebDatabaseService {
  async init() {
    try {
      // Initialize storage if not exists
      if (!localStorage.getItem(STORAGE_KEYS.NOTES)) {
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.FOLDERS)) {
        localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify([]));
      }
      console.log('✅ Web Database initialized successfully');
    } catch (error) {
      console.error('❌ Web Database initialization failed:', error);
      throw error;
    }
  }

  // ============================================
  // NOTES Operations
  // ============================================

  async createNote(note: Omit<Note, 'id' | 'entries' | 'tasks'>): Promise<string> {
    const id = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newNote: Note = {
      ...note,
      id,
      entries: [],
      tasks: [],
    };

    const notes = await this.getAllNotes();
    notes.push(newNote);
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));

    return id;
  }

  async getAllNotes(): Promise<Note[]> {
    const notesJson = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (!notesJson) return [];

    const notes = JSON.parse(notesJson);

    // Convert date strings back to Date objects
    return notes.map((note: any) => ({
      ...note,
      createdAt: new Date(note.createdAt),
      lastModified: new Date(note.lastModified),
      entries: note.entries.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
        editHistory: entry.editHistory.map((edit: any) => ({
          ...edit,
          editedAt: new Date(edit.editedAt),
        })),
      })),
      tasks: note.tasks.map((task: any) => ({
        ...task,
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      })),
    }));
  }

  async getNoteById(id: string): Promise<Note | null> {
    const notes = await this.getAllNotes();
    return notes.find(note => note.id === id) || null;
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<void> {
    const notes = await this.getAllNotes();
    const index = notes.findIndex(note => note.id === id);

    if (index === -1) throw new Error('Note not found');

    notes[index] = {
      ...notes[index],
      ...updates,
      lastModified: new Date(),
    };

    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  }

  async deleteNote(id: string): Promise<void> {
    const notes = await this.getAllNotes();
    const filtered = notes.filter(note => note.id !== id);
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(filtered));
  }

  // ============================================
  // ENTRIES Operations
  // ============================================

  async createEntry(noteId: string, entry: Omit<Entry, 'id'>): Promise<string> {
    const id = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newEntry: Entry = {
      ...entry,
      id,
    };

    const notes = await this.getAllNotes();
    const note = notes.find(n => n.id === noteId);

    if (!note) throw new Error('Note not found');

    note.entries.push(newEntry);
    note.lastModified = new Date();

    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));

    return id;
  }

  async getEntriesByNoteId(noteId: string): Promise<Entry[]> {
    const note = await this.getNoteById(noteId);
    return note?.entries || [];
  }

  async deleteEntry(noteId: string, entryId: string): Promise<void> {
    const notes = await this.getAllNotes();
    const note = notes.find(n => n.id === noteId);

    if (!note) throw new Error('Note not found');

    note.entries = note.entries.filter(entry => entry.id !== entryId);
    note.lastModified = new Date();

    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  }

  // ============================================
  // TASKS Operations
  // ============================================

  async createTask(noteId: string, description: string): Promise<string> {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const notes = await this.getAllNotes();
    const note = notes.find(n => n.id === noteId);

    if (!note) throw new Error('Note not found');

    note.tasks.push({
      id,
      description,
      isCompleted: false,
    });

    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));

    return id;
  }

  async getTasksByNoteId(noteId: string): Promise<any[]> {
    const note = await this.getNoteById(noteId);
    return note?.tasks || [];
  }

  async toggleTask(taskId: string): Promise<void> {
    const notes = await this.getAllNotes();

    for (const note of notes) {
      const task = note.tasks.find(t => t.id === taskId);
      if (task) {
        task.isCompleted = !task.isCompleted;
        task.completedAt = task.isCompleted ? new Date() : undefined;
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
        return;
      }
    }

    throw new Error('Task not found');
  }

  // ============================================
  // FOLDERS Operations
  // ============================================

  async createFolder(name: string, isAutoGenerated: boolean = false): Promise<string> {
    const id = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newFolder: Folder = {
      id,
      name,
      isAutoGenerated,
      createdAt: new Date(),
    };

    const foldersJson = localStorage.getItem(STORAGE_KEYS.FOLDERS);
    const folders: Folder[] = foldersJson ? JSON.parse(foldersJson) : [];

    folders.push(newFolder);
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));

    return id;
  }

  async getAllFolders(): Promise<Folder[]> {
    const foldersJson = localStorage.getItem(STORAGE_KEYS.FOLDERS);
    if (!foldersJson) return [];

    const folders = JSON.parse(foldersJson);

    return folders.map((folder: any) => ({
      ...folder,
      createdAt: new Date(folder.createdAt),
    }));
  }
}

export const webDb = new WebDatabaseService();
