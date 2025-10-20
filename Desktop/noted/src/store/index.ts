// ============================================
// NOTED - Global State Management (Zustand)
// ============================================

import { create } from 'zustand';
import type { Note, Folder, PipelineGroup, UrgencyLevel, PipelineStage, StandaloneTask } from '../types';
import { NoteFormat } from '../types';
import { db } from '../services';
import { extractHashtags } from '../utils';

interface NotesState {
  // Data
  notes: Note[];
  folders: Folder[];
  pipelineGroups: PipelineGroup[];
  standaloneTasks: StandaloneTask[];
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
  addEntry: (noteId: string, content: string, entryFormats?: NoteFormat[], formatData?: any) => Promise<void>;
  updateEntry: (noteId: string, entryId: string, content: string, entryFormats?: NoteFormat[], formatData?: any) => Promise<void>;
  deleteEntry: (noteId: string, entryId: string) => Promise<void>;

  // Folder actions
  createFolder: (name: string, isAuto?: boolean) => Promise<string>;
  deleteFolder: (folderId: string) => Promise<void>;

  // Standalone Task actions
  loadStandaloneTasks: () => Promise<void>;
  createStandaloneTask: (description: string) => Promise<string>;
  updateStandaloneTask: (taskId: string, updates: Partial<StandaloneTask>) => Promise<void>;
  toggleStandaloneTask: (taskId: string) => Promise<void>;
  deleteStandaloneTask: (taskId: string) => Promise<void>;
  addStandaloneTaskStep: (taskId: string, description: string) => Promise<string>;
  toggleStandaloneTaskStep: (taskId: string, stepId: string) => Promise<void>;
  deleteStandaloneTaskStep: (taskId: string, stepId: string) => Promise<void>;

  // Note-level Task actions
  createTask: (noteId: string, description: string) => Promise<string>;
  addTaskStep: (noteId: string, taskId: string, description: string) => Promise<string>;
  toggleTaskStep: (taskId: string, stepId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  // UI actions
  toggleDarkMode: () => void;
  setSearchQuery: (query: string) => void;

  // Urgency/Importance actions
  setUrgency: (noteId: string, urgency: UrgencyLevel) => Promise<void>;
  setImportance: (noteId: string, importance: number) => Promise<void>;

  // Pipeline actions
  setPipelineStage: (noteId: string, stage: PipelineStage) => Promise<void>;
  createPipelineGroup: (name: string, noteIds: string[]) => Promise<void>;

  // Migration actions
  migrateTasksToNotes: () => Promise<void>;
}

// Helper function to clean up empty folders
const cleanupEmptyFolders = async (allNotes: Note[], allFolders: Folder[]) => {
  // Get all hashtags currently in use across all notes
  const hashtagsInUse = new Set<string>();
  allNotes.forEach(note => {
    note.hashtags.forEach(tag => hashtagsInUse.add(tag.toLowerCase()));
  });

  // Find folders with no matching notes (case-insensitive)
  const foldersToDelete = allFolders.filter(
    folder => !hashtagsInUse.has(folder.name.toLowerCase())
  );

  // Delete empty folders
  for (const folder of foldersToDelete) {
    try {
      await db.deleteFolder(folder.id);
    } catch (error) {
      console.error(`Failed to delete empty folder "${folder.name}":`, error);
    }
  }

  return foldersToDelete.length > 0;
};

export const useStore = create<NotesState>((set, get) => ({
  // Initial state
  notes: [],
  folders: [],
  pipelineGroups: [],
  standaloneTasks: [],
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
        noteFormat: NoteFormat.NOTE, // Default to regular note format
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

  addEntry: async (noteId: string, content: string, entryFormats?: NoteFormat[], formatData?: any) => {
    try {
      const entry = {
        timestamp: new Date(),
        content,
        entryFormats: entryFormats || [NoteFormat.NOTE], // Default to NOTE format
        formatData: formatData || {}, // Empty format data by default
        isDeepWorkSession: false,
        isEdited: false,
        editHistory: [],
        embeddedLinks: [],
        imageUrls: [],
      };

      await db.createEntry(noteId, entry);

      // Get current note to recalculate all hashtags
      const currentNote = await db.getNoteById(noteId);
      if (currentNote) {
        // Recalculate all hashtags from ALL entries
        const allHashtags = new Set<string>();
        currentNote.entries.forEach(entry => {
          const entryHashtags = extractHashtags(entry.content);
          entryHashtags.forEach(tag => allHashtags.add(tag));
        });

        const newHashtagsArray = Array.from(allHashtags);

        // Auto-create folders for NEW hashtags only
        const existingFolders = get().folders;
        for (const tag of newHashtagsArray) {
          if (!currentNote.hashtags.includes(tag)) {
            // Check if folder already exists (case-insensitive)
            const folderExists = existingFolders.some(f => f.name.toLowerCase() === tag.toLowerCase());
            if (!folderExists) {
              try {
                await get().createFolder(tag, true); // true = auto-created
              } catch (error) {
                console.log(`Failed to create folder "${tag}":`, error);
              }
            }
          }
        }

        await db.updateNote(noteId, {
          hashtags: newHashtagsArray,
          lastModified: new Date()
        });
      } else {
        await db.updateNote(noteId, { lastModified: new Date() });
      }

      await get().loadNotes();

      // Clean up empty folders
      const allNotes = get().notes;
      const allFolders = get().folders;
      const foldersDeleted = await cleanupEmptyFolders(allNotes, allFolders);
      if (foldersDeleted) {
        await get().loadFolders();
      }

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

  updateEntry: async (noteId: string, entryId: string, content: string, entryFormats?: NoteFormat[], formatData?: any) => {
    try {
      const updates: any = { content };
      if (entryFormats !== undefined) updates.entryFormats = entryFormats;
      if (formatData !== undefined) updates.formatData = formatData;

      await db.updateEntry(noteId, entryId, updates);

      // Get current note to recalculate all hashtags
      const currentNote = await db.getNoteById(noteId);
      if (currentNote) {
        // Recalculate all hashtags from ALL entries
        const allHashtags = new Set<string>();
        currentNote.entries.forEach(entry => {
          const entryHashtags = extractHashtags(entry.content);
          entryHashtags.forEach(tag => allHashtags.add(tag));
        });

        const newHashtagsArray = Array.from(allHashtags);

        // Auto-create folders for NEW hashtags only
        const existingFolders = get().folders;
        for (const tag of newHashtagsArray) {
          if (!currentNote.hashtags.includes(tag)) {
            // Check if folder already exists (case-insensitive)
            const folderExists = existingFolders.some(f => f.name.toLowerCase() === tag.toLowerCase());
            if (!folderExists) {
              try {
                await get().createFolder(tag, true);
              } catch (error) {
                console.log(`Failed to create folder "${tag}":`, error);
              }
            }
          }
        }

        await db.updateNote(noteId, {
          hashtags: newHashtagsArray,
          lastModified: new Date()
        });
      } else {
        await db.updateNote(noteId, { lastModified: new Date() });
      }

      await get().loadNotes();

      // Clean up empty folders
      const allNotes = get().notes;
      const allFolders = get().folders;
      const foldersDeleted = await cleanupEmptyFolders(allNotes, allFolders);
      if (foldersDeleted) {
        await get().loadFolders();
      }

      // Reload current note if it's the one being updated
      if (get().currentNote?.id === noteId) {
        const updatedNote = await db.getNoteById(noteId);
        set({ currentNote: updatedNote });
      }
    } catch (error) {
      console.error('Failed to update entry:', error);
      throw error;
    }
  },

  deleteEntry: async (noteId: string, entryId: string) => {
    try {
      await db.deleteEntry(noteId, entryId);

      // Recalculate hashtags after deleting entry
      const currentNote = await db.getNoteById(noteId);
      if (currentNote) {
        // Recalculate all hashtags from remaining entries
        const allHashtags = new Set<string>();
        currentNote.entries.forEach(entry => {
          const entryHashtags = extractHashtags(entry.content);
          entryHashtags.forEach(tag => allHashtags.add(tag));
        });

        await db.updateNote(noteId, {
          hashtags: Array.from(allHashtags),
          lastModified: new Date()
        });
      } else {
        await db.updateNote(noteId, { lastModified: new Date() });
      }

      await get().loadNotes();

      // Clean up empty folders
      const allNotes = get().notes;
      const allFolders = get().folders;
      const foldersDeleted = await cleanupEmptyFolders(allNotes, allFolders);
      if (foldersDeleted) {
        await get().loadFolders();
      }

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

  deleteFolder: async (folderId: string) => {
    try {
      await db.deleteFolder(folderId);
      await get().loadFolders();
    } catch (error) {
      console.error('Failed to delete folder:', error);
      throw error;
    }
  },

  // ============================================
  // Standalone Task Actions
  // ============================================

  loadStandaloneTasks: async () => {
    try {
      const tasks = await db.getAllStandaloneTasks();
      set({ standaloneTasks: tasks });
    } catch (error) {
      console.error('Failed to load standalone tasks:', error);
    }
  },

  createStandaloneTask: async (description: string) => {
    try {
      const id = await db.createStandaloneTask(description);
      await get().loadStandaloneTasks();
      return id;
    } catch (error) {
      console.error('Failed to create standalone task:', error);
      throw error;
    }
  },

  updateStandaloneTask: async (taskId: string, updates: Partial<StandaloneTask>) => {
    try {
      await db.updateStandaloneTask(taskId, updates);
      await get().loadStandaloneTasks();
    } catch (error) {
      console.error('Failed to update standalone task:', error);
      throw error;
    }
  },

  toggleStandaloneTask: async (taskId: string) => {
    try {
      await db.toggleStandaloneTask(taskId);
      await get().loadStandaloneTasks();
    } catch (error) {
      console.error('Failed to toggle standalone task:', error);
      throw error;
    }
  },

  deleteStandaloneTask: async (taskId: string) => {
    try {
      await db.deleteStandaloneTask(taskId);
      await get().loadStandaloneTasks();
    } catch (error) {
      console.error('Failed to delete standalone task:', error);
      throw error;
    }
  },

  addStandaloneTaskStep: async (taskId: string, description: string) => {
    try {
      const stepId = await db.addStandaloneTaskStep(taskId, description);
      await get().loadStandaloneTasks();
      return stepId;
    } catch (error) {
      console.error('Failed to add standalone task step:', error);
      throw error;
    }
  },

  toggleStandaloneTaskStep: async (taskId: string, stepId: string) => {
    try {
      await db.toggleStandaloneTaskStep(taskId, stepId);
      await get().loadStandaloneTasks();
    } catch (error) {
      console.error('Failed to toggle standalone task step:', error);
      throw error;
    }
  },

  deleteStandaloneTaskStep: async (taskId: string, stepId: string) => {
    try {
      await db.deleteStandaloneTaskStep(taskId, stepId);
      await get().loadStandaloneTasks();
    } catch (error) {
      console.error('Failed to delete standalone task step:', error);
      throw error;
    }
  },

  // ============================================
  // Note-level Task Actions
  // ============================================

  createTask: async (noteId: string, description: string) => {
    try {
      const id = await db.createTask(noteId, description);
      await get().loadNotes();

      // Reload current note if it's the one being updated
      if (get().currentNote?.id === noteId) {
        const updatedNote = await db.getNoteById(noteId);
        set({ currentNote: updatedNote });
      }

      return id;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  },

  addTaskStep: async (noteId: string, taskId: string, description: string) => {
    try {
      const stepId = await db.addTaskStep(noteId, taskId, description);
      await get().loadNotes();

      // Reload current note if it's the one being updated
      if (get().currentNote?.id === noteId) {
        const updatedNote = await db.getNoteById(noteId);
        set({ currentNote: updatedNote });
      }

      return stepId;
    } catch (error) {
      console.error('Failed to add task step:', error);
      throw error;
    }
  },

  toggleTaskStep: async (taskId: string, stepId: string) => {
    try {
      await db.toggleTaskStep(taskId, stepId);
      await get().loadNotes();

      // Reload current note if we have one active
      const currentNoteId = get().currentNote?.id;
      if (currentNoteId) {
        const updatedNote = await db.getNoteById(currentNoteId);
        set({ currentNote: updatedNote });
      }
    } catch (error) {
      console.error('Failed to toggle task step:', error);
      throw error;
    }
  },

  deleteTask: async (taskId: string) => {
    try {
      await db.deleteTask(taskId);
      await get().loadNotes();

      // Reload current note if we have one active
      const currentNoteId = get().currentNote?.id;
      if (currentNoteId) {
        const updatedNote = await db.getNoteById(currentNoteId);
        set({ currentNote: updatedNote });
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
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

  // ============================================
  // Migration Actions
  // ============================================

  migrateTasksToNotes: async () => {
    try {
      console.log('🔄 Starting task to note migration...');
      // Check if migration method exists (web only for now)
      if ('migrateStandaloneTasksToNotes' in db) {
        await (db as any).migrateStandaloneTasksToNotes();
        await get().loadNotes();
        await get().loadStandaloneTasks();
        console.log('✅ Migration complete');
      } else {
        console.log('⚠️ Migration not available on this platform');
      }
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },
}));
