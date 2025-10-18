// ============================================
// NOTED - Global State Management (Zustand)
// ============================================

import { create } from 'zustand';
import type { Note, Folder, PipelineGroup, UrgencyLevel, PipelineStage } from '../types';
import { db } from '../services';
import { extractHashtags } from '../utils';

interface NotesState {
  // Data
  notes: Note[];
  folders: Folder[];
  pipelineGroups: PipelineGroup[];
  currentNote: Note | null;

  // UI State
  isDarkMode: boolean;
  isLoading: boolean;
  searchQuery: string;

  // Actions
  loadNotes: () => Promise<void>;
  loadFolders: () => Promise<void>;
  createNote: (title: string) => Promise<string>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setCurrentNote: (note: Note | null) => void;

  // Entry actions
  addEntry: (noteId: string, content: string) => Promise<void>;
  deleteEntry: (noteId: string, entryId: string) => Promise<void>;

  // Folder actions
  createFolder: (name: string, isAuto?: boolean) => Promise<string>;

  // UI actions
  toggleDarkMode: () => void;
  setSearchQuery: (query: string) => void;

  // Urgency/Importance actions
  setUrgency: (noteId: string, urgency: UrgencyLevel) => Promise<void>;
  setImportance: (noteId: string, importance: number) => Promise<void>;

  // Pipeline actions
  setPipelineStage: (noteId: string, stage: PipelineStage) => Promise<void>;
  createPipelineGroup: (name: string, noteIds: string[]) => Promise<void>;
}

export const useStore = create<NotesState>((set, get) => ({
  // Initial state
  notes: [],
  folders: [],
  pipelineGroups: [],
  currentNote: null,
  isDarkMode: false,
  isLoading: false,
  searchQuery: '',

  // ============================================
  // Note Actions
  // ============================================

  loadNotes: async () => {
    try {
      set({ isLoading: true });
      const notes = await db.getAllNotes();
      set({ notes, isLoading: false });
    } catch (error) {
      console.error('Failed to load notes:', error);
      set({ isLoading: false });
    }
  },

  createNote: async (title: string) => {
    try {
      const now = new Date();
      const noteData = {
        title,
        createdAt: now,
        lastModified: now,
        hashtags: [],
        linkedNoteIds: [],
        urgency: 'none' as UrgencyLevel,
        importance: 0,
        progressPercentage: 0,
        totalDeepWorkTime: 0,
        deepWorkSessionCount: 0,
      };

      const id = await db.createNote(noteData);
      await get().loadNotes();
      return id;
    } catch (error) {
      console.error('Failed to create note:', error);
      throw error;
    }
  },

  updateNote: async (id: string, updates: Partial<Note>) => {
    try {
      await db.updateNote(id, {
        ...updates,
        lastModified: new Date(),
      });
      await get().loadNotes();

      // Update current note if it's the one being updated
      if (get().currentNote?.id === id) {
        const updatedNote = await db.getNoteById(id);
        set({ currentNote: updatedNote });
      }
    } catch (error) {
      console.error('Failed to update note:', error);
      throw error;
    }
  },

  deleteNote: async (id: string) => {
    try {
      await db.deleteNote(id);
      await get().loadNotes();

      // Clear current note if it was deleted
      if (get().currentNote?.id === id) {
        set({ currentNote: null });
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
      throw error;
    }
  },

  setCurrentNote: (note: Note | null) => {
    set({ currentNote: note });
  },

  // ============================================
  // Entry Actions
  // ============================================

  addEntry: async (noteId: string, content: string) => {
    try {
      const entry = {
        timestamp: new Date(),
        content,
        isDeepWorkSession: false,
        isEdited: false,
        editHistory: [],
        embeddedLinks: [],
        imageUrls: [],
      };

      await db.createEntry(noteId, entry);

      // Extract hashtags from entry content
      const newHashtags = extractHashtags(content);

      // Get current note to merge hashtags
      const currentNote = await db.getNoteById(noteId);
      if (currentNote && newHashtags.length > 0) {
        const mergedHashtags = Array.from(new Set([...currentNote.hashtags, ...newHashtags]));

        // Auto-create folders for NEW hashtags only
        for (const tag of newHashtags) {
          if (!currentNote.hashtags.includes(tag)) {
            try {
              await get().createFolder(tag, true); // true = auto-created
            } catch (error) {
              // Folder might already exist, that's fine
              console.log(`Folder "${tag}" may already exist`);
            }
          }
        }

        await db.updateNote(noteId, {
          hashtags: mergedHashtags,
          lastModified: new Date()
        });
      } else {
        await db.updateNote(noteId, { lastModified: new Date() });
      }

      await get().loadNotes();

      // Reload current note if it's the one being updated
      if (get().currentNote?.id === noteId) {
        const updatedNote = await db.getNoteById(noteId);
        set({ currentNote: updatedNote });
      }
    } catch (error) {
      console.error('Failed to add entry:', error);
      throw error;
    }
  },

  deleteEntry: async (noteId: string, entryId: string) => {
    try {
      await db.deleteEntry(noteId, entryId);
      await db.updateNote(noteId, { lastModified: new Date() });
      await get().loadNotes();

      // Reload current note if it's the one being updated
      if (get().currentNote?.id === noteId) {
        const updatedNote = await db.getNoteById(noteId);
        set({ currentNote: updatedNote });
      }
    } catch (error) {
      console.error('Failed to delete entry:', error);
      throw error;
    }
  },

  // ============================================
  // Folder Actions
  // ============================================

  loadFolders: async () => {
    try {
      const folders = await db.getAllFolders();
      set({ folders });
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  },

  createFolder: async (name: string, isAuto: boolean = false) => {
    try {
      const id = await db.createFolder(name, isAuto);
      await get().loadFolders();
      return id;
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw error;
    }
  },

  // ============================================
  // UI Actions
  // ============================================

  toggleDarkMode: () => {
    set((state) => ({ isDarkMode: !state.isDarkMode }));
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  // ============================================
  // Urgency/Importance Actions
  // ============================================

  setUrgency: async (noteId: string, urgency: UrgencyLevel) => {
    try {
      await db.updateNote(noteId, { urgency });
      await get().loadNotes();
    } catch (error) {
      console.error('Failed to set urgency:', error);
      throw error;
    }
  },

  setImportance: async (noteId: string, importance: number) => {
    try {
      await db.updateNote(noteId, { importance });
      await get().loadNotes();
    } catch (error) {
      console.error('Failed to set importance:', error);
      throw error;
    }
  },

  // ============================================
  // Pipeline Actions
  // ============================================

  setPipelineStage: async (noteId: string, stage: PipelineStage) => {
    try {
      await db.updateNote(noteId, { pipelineStage: stage });
      await get().loadNotes();
    } catch (error) {
      console.error('Failed to set pipeline stage:', error);
      throw error;
    }
  },

  createPipelineGroup: async (name: string, noteIds: string[]) => {
    try {
      // This would be implemented with database support
      // For now, just a placeholder
      console.log('Creating pipeline group:', name, noteIds);
    } catch (error) {
      console.error('Failed to create pipeline group:', error);
      throw error;
    }
  },
}));
