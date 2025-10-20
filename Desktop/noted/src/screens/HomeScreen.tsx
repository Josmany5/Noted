// ============================================
// NOTED - Home Screen
// ============================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useStore } from '../store';
import { COLORS, FONTS, FONT_SIZES, SPACING, ICONS, getThemedColors, getUrgencyColor } from '../theme';
import { formatRelativeTime, sortNotesByUrgencyAndImportance } from '../utils';
import type { Note, StandaloneTask } from '../types';
import { UrgencyLevel, NoteFormat, FORMAT_EMOJIS } from '../types';

// Helper functions for due dates
const getDueDateStatus = (dueDate: Date | undefined): 'overdue' | 'today' | 'upcoming' | 'none' => {
  if (!dueDate) return 'none';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  if (dueDateOnly < today) return 'overdue';
  if (dueDateOnly.getTime() === today.getTime()) return 'today';
  return 'upcoming';
};

const formatDueDate = (dueDate: Date | undefined): string => {
  if (!dueDate) return '';

  const status = getDueDateStatus(dueDate);
  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (status === 'overdue') {
    const overdueDays = Math.abs(diffDays);
    return `Overdue by ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'}`;
  }
  if (status === 'today') return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays <= 7) return `Due in ${diffDays} days`;

  return `Due ${dueDate.toLocaleDateString()}`;
};

const sortTasksByPriority = (tasks: StandaloneTask[]): StandaloneTask[] => {
  return [...tasks].sort((a, b) => {
    // Sort by urgency first (HIGH > MEDIUM > LOW > NONE)
    const urgencyOrder = { [UrgencyLevel.HIGH]: 3, [UrgencyLevel.MEDIUM]: 2, [UrgencyLevel.LOW]: 1, [UrgencyLevel.NONE]: 0 };
    const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;

    // Then by importance
    if (b.importance !== a.importance) return b.importance - a.importance;

    // Then by due date (sooner first)
    if (a.dueDate && b.dueDate) {
      const aTime = a.dueDate instanceof Date ? a.dueDate.getTime() : new Date(a.dueDate).getTime();
      const bTime = b.dueDate instanceof Date ? b.dueDate.getTime() : new Date(b.dueDate).getTime();
      return aTime - bTime;
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;

    // Finally by creation date (newest first)
    const aCreated = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
    const bCreated = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
    return bCreated - aCreated;
  });
};

export const HomeScreen = ({ navigation }: any) => {
  const {
    notes,
    folders,
    standaloneTasks,
    loadNotes,
    loadFolders,
    loadStandaloneTasks,
    createNote,
    createFolder,
    createStandaloneTask,
    updateStandaloneTask,
    updateNote,
    deleteNote,
    deleteFolder,
    toggleStandaloneTask,
    deleteStandaloneTask,
    addStandaloneTaskStep,
    toggleStandaloneTaskStep,
    deleteStandaloneTaskStep,
    // Note-level task methods
    addTaskStep,
    toggleTaskStep,
    deleteTask,
    isDarkMode,
    searchQuery,
    setSearchQuery,
    migrateTasksToNotes,
  } = useStore();

  const [sortedNotes, setSortedNotes] = useState<Note[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<NoteFormat | null>(null); // Format filter
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newTaskInput, setNewTaskInput] = useState('');

  // Task Detail Modal states
  const [selectedTask, setSelectedTask] = useState<StandaloneTask | null>(null);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [newStepInput, setNewStepInput] = useState('');
  const [expandedSteps, setExpandedSteps] = useState<{ [taskId: string]: boolean }>({});
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const [expandedNoteTasks, setExpandedNoteTasks] = useState<{ [noteId: string]: boolean }>({});

  // Date picker states
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [tempDueDate, setTempDueDate] = useState<Date | undefined>(undefined);
  const [tempReminderTime, setTempReminderTime] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const initializeApp = async () => {
      // Run migration first (converts standalone tasks to notes)
      await migrateTasksToNotes();
      // Then load data
      await loadNotes();
      await loadFolders();
      await loadStandaloneTasks();
    };
    initializeApp();
  }, []);

  useEffect(() => {
    // Filter by search query
    let filtered = notes.filter(note => {
      const query = searchQuery.toLowerCase();

      // Search in title
      if (note.title.toLowerCase().includes(query)) return true;

      // Search in entry content
      const hasMatchingEntry = note.entries.some(entry =>
        entry.content.toLowerCase().includes(query)
      );
      if (hasMatchingEntry) return true;

      // Search in hashtags
      const hasMatchingHashtag = note.hashtags.some(tag =>
        tag.toLowerCase().includes(query)
      );
      if (hasMatchingHashtag) return true;

      return false;
    });

    // Filter by selected folder/hashtag
    if (selectedFolder) {
      filtered = filtered.filter(note =>
        note.hashtags.includes(selectedFolder)
      );
    }

    // Filter by selected format (check both note format AND entries)
    if (selectedFormat) {
      filtered = filtered.filter(note =>
        note.noteFormat === selectedFormat || // Check main note format
        note.entries.some(e => e.entryFormats?.includes(selectedFormat)) // Check entry formats
      );
    }

    setSortedNotes(sortNotesByUrgencyAndImportance(filtered));
  }, [notes, searchQuery, selectedFolder, selectedFormat]);

  // Combine standalone tasks with tasks from notes
  const allTasks = React.useMemo(() => {
    const noteTasks = notes.flatMap(note =>
      note.tasks.map(task => ({
        ...task,
        noteId: note.id,
        noteTitle: note.title,
        // Convert Task to StandaloneTask format
        urgency: note.urgency,
        importance: note.importance,
        hashtags: note.hashtags,
        notificationEnabled: true,
        // Ensure dates are Date objects
        createdAt: task.createdAt instanceof Date ? task.createdAt : new Date(task.createdAt),
        completedAt: task.completedAt ? (task.completedAt instanceof Date ? task.completedAt : new Date(task.completedAt)) : undefined,
      }))
    );

    // Return standalone tasks and note tasks combined
    return [...standaloneTasks, ...noteTasks] as (StandaloneTask & { noteId?: string; noteTitle?: string })[];
  }, [standaloneTasks, notes]);

  const colors = getThemedColors(isDarkMode);

  const handleCreateNote = async () => {
    try {
      const id = await createNote('New Note');
      navigation.navigate('NoteDetail', { noteId: id });
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleCreateTask = async () => {
    const description = prompt('Enter task description:');

    if (!description || !description.trim()) return;

    try {
      await createStandaloneTask(description.trim());
      await loadStandaloneTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task');
    }
  };

  const handleOpenTaskDetail = (task: StandaloneTask) => {
    setSelectedTask(task);
    setEditTaskDescription(task.description);
    setTempDueDate(task.dueDate);
    setTempReminderTime(task.reminderTime);
    setShowTaskDetailModal(true);
  };

  const handleCloseTaskDetail = async () => {
    // Auto-save description before closing
    if (selectedTask && editTaskDescription.trim() && editTaskDescription !== selectedTask.description) {
      try {
        await updateStandaloneTask(selectedTask.id, {
          description: editTaskDescription.trim(),
          lastEditedAt: new Date(),
        });
      } catch (error) {
        console.error('Failed to save task description on close:', error);
      }
    }

    setShowTaskDetailModal(false);
    setSelectedTask(null);
    setEditTaskDescription('');
    setNewStepInput('');
    setTempDueDate(undefined);
    setTempReminderTime(undefined);
  };

  const handleSaveTaskDescription = async () => {
    if (!selectedTask || !editTaskDescription.trim()) return;

    try {
      await updateStandaloneTask(selectedTask.id, {
        description: editTaskDescription.trim(),
        lastEditedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to update task description:', error);
      alert('Failed to update task description');
    }
  };

  const handleSaveDueDate = async () => {
    if (!selectedTask) return;

    try {
      await updateStandaloneTask(selectedTask.id, {
        dueDate: tempDueDate,
        lastEditedAt: new Date(),
      });
      setShowDueDatePicker(false);
    } catch (error) {
      console.error('Failed to update due date:', error);
      alert('Failed to update due date');
    }
  };

  const handleSaveReminderTime = async () => {
    if (!selectedTask) return;

    try {
      await updateStandaloneTask(selectedTask.id, {
        reminderTime: tempReminderTime,
        lastEditedAt: new Date(),
      });
      setShowReminderPicker(false);
    } catch (error) {
      console.error('Failed to update reminder:', error);
      alert('Failed to update reminder');
    }
  };

  const handleCompleteTask = async () => {
    if (!selectedTask) return;

    try {
      await toggleStandaloneTask(selectedTask.id);
      handleCloseTaskDetail();
    } catch (error) {
      console.error('Failed to complete task:', error);
      alert('Failed to complete task');
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;

    // Check if this task belongs to a note
    const isNoteTask = (selectedTask as any).noteId !== undefined;

    if (confirm('Delete this task? This action cannot be undone.')) {
      try {
        if (isNoteTask) {
          // Task belongs to a note - use note-level delete
          await deleteTask(selectedTask.id);
          loadNotes(); // Reload notes to update
        } else {
          // Standalone task - use standalone delete
          await deleteStandaloneTask(selectedTask.id);
          loadStandaloneTasks();
        }
        handleCloseTaskDetail();
      } catch (error) {
        console.error('Failed to delete task:', error);
        alert('Failed to delete task');
      }
    }
  };

  const handleAddStep = async () => {
    if (!selectedTask || !newStepInput.trim()) return;

    // Check if this task belongs to a note
    const isNoteTask = (selectedTask as any).noteId !== undefined;
    const noteId = (selectedTask as any).noteId;

    const stepDescription = newStepInput.trim();
    const originalTask = { ...selectedTask };

    // OPTIMISTIC UPDATE: Add step to UI immediately
    const newStep = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Temporary ID
      description: stepDescription,
      isCompleted: false,
      createdAt: new Date(),
    };

    setSelectedTask({
      ...selectedTask,
      steps: [...selectedTask.steps, newStep],
    });
    setNewStepInput('');

    // THEN: Save to database in background (use different method based on task type)
    try {
      let realStepId: string;
      if (isNoteTask && noteId) {
        // Task belongs to a note
        realStepId = await addTaskStep(noteId, selectedTask.id, stepDescription);
        loadNotes();
      } else {
        // Standalone task
        realStepId = await addStandaloneTaskStep(selectedTask.id, stepDescription);
        loadStandaloneTasks();
      }

      // Replace temp ID with real ID
      setSelectedTask(prev => prev ? {
        ...prev,
        steps: prev.steps.map(s => s.id === newStep.id ? { ...s, id: realStepId } : s),
      } : prev);
    } catch (error) {
      // Revert on error
      setSelectedTask(originalTask);
      setNewStepInput(stepDescription);
      console.error('Failed to add step:', error);
      alert('Failed to add step');
    }
  };

  const handleToggleStep = async (stepId: string) => {
    if (!selectedTask) return;

    // Check if this task belongs to a note
    const isNoteTask = (selectedTask as any).noteId !== undefined;

    // Store original state for rollback
    const originalTask = { ...selectedTask };

    // OPTIMISTIC UPDATE: Update UI immediately
    const updatedSteps = selectedTask.steps.map(step =>
      step.id === stepId
        ? {
            ...step,
            isCompleted: !step.isCompleted,
            completedAt: !step.isCompleted ? new Date() : undefined,
          }
        : step
    );

    // Check if all steps are completed (auto-complete logic)
    const allStepsCompleted = updatedSteps.length > 0 && updatedSteps.every(s => s.isCompleted);

    // Update local state immediately for instant UI feedback
    setSelectedTask({
      ...selectedTask,
      steps: updatedSteps,
      isCompleted: allStepsCompleted ? true : (updatedSteps.some(s => !s.isCompleted) ? false : selectedTask.isCompleted),
      completedAt: allStepsCompleted ? new Date() : (updatedSteps.some(s => !s.isCompleted) ? undefined : selectedTask.completedAt),
    });

    // THEN: Save to database in background (use different method based on task type)
    try {
      if (isNoteTask) {
        // Task belongs to a note - use note-level methods
        await toggleTaskStep(selectedTask.id, stepId);
        loadNotes(); // Reload notes to update the task
      } else {
        // Standalone task - use standalone methods
        await toggleStandaloneTaskStep(selectedTask.id, stepId);
        loadStandaloneTasks();
      }
    } catch (error) {
      // Revert to original state on error
      setSelectedTask(originalTask);
      console.error('Failed to toggle step:', error);
      alert('Failed to toggle step');
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!selectedTask) return;

    const originalTask = { ...selectedTask };

    // OPTIMISTIC UPDATE: Remove step from UI immediately
    const updatedSteps = selectedTask.steps.filter(s => s.id !== stepId);

    setSelectedTask({
      ...selectedTask,
      steps: updatedSteps,
    });

    // THEN: Delete from database in background
    try {
      await deleteStandaloneTaskStep(selectedTask.id, stepId);
      // Reload in background
      loadStandaloneTasks();
    } catch (error) {
      // Revert on error
      setSelectedTask(originalTask);
      console.error('Failed to delete step:', error);
      alert('Failed to delete step');
    }
  };

  const toggleStepsExpanded = (taskId: string) => {
    setExpandedSteps(prev => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleQuickCreateTask = async () => {
    if (!newTaskInput.trim()) return;

    try {
      await createStandaloneTask(newTaskInput.trim());
      setNewTaskInput('');
      await loadStandaloneTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task');
    }
  };

  const handleCreateItem = (type: 'note' | 'task' | 'project' | 'goal' | 'library' | 'journal') => {
    switch (type) {
      case 'note':
        handleCreateNote();
        break;
      case 'task':
        handleCreateTask();
        break;
      default:
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} feature coming soon!`);
    }
  };

  const handleDeleteNote = async (noteId: string, event: any) => {
    // Stop propagation to prevent navigating to the note
    event.stopPropagation();

    const confirmed = confirm('Delete this note? This cannot be undone.');
    if (!confirmed) return;

    try {
      await deleteNote(noteId);
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleSetUrgency = async (noteId: string, urgency: UrgencyLevel, event: any) => {
    event.stopPropagation();

    try {
      await updateNote(noteId, { urgency });
    } catch (error) {
      console.error('Failed to update urgency:', error);
    }
  };

  const handleSetImportance = async (noteId: string, importance: number, event: any) => {
    event.stopPropagation();

    try {
      await updateNote(noteId, { importance });
    } catch (error) {
      console.error('Failed to update importance:', error);
    }
  };

  const handleDeleteFolder = async (folderId: string, event: any) => {
    event.stopPropagation();

    const confirmed = confirm('Delete this folder? Notes will not be deleted, only the folder.');
    if (!confirmed) return;

    try {
      await deleteFolder(folderId);
      // Clear selection if we deleted the selected folder
      setSelectedFolder(null);
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  const handleCreateFolder = async () => {
    const folderName = newFolderName.trim();

    if (!folderName) {
      alert('Please enter a folder name');
      return;
    }

    // Auto-add # prefix if not present
    const folderNameWithHash = folderName.startsWith('#') ? folderName.substring(1) : folderName;

    // Check for duplicates (case-insensitive)
    const folderExists = folders.some(f => f.name.toLowerCase() === folderNameWithHash.toLowerCase());

    if (folderExists) {
      alert(`Folder #${folderNameWithHash} already exists`);
      return;
    }

    try {
      await createFolder(folderNameWithHash, false); // false = manually created
      setNewFolderName('');
      setShowCreateFolderModal(false);
      await loadFolders();
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder');
    }
  };

  const renderNoteCard = ({ item }: { item: Note }) => {
    const lastEntry = item.entries[item.entries.length - 1];
    const urgencyColor = getUrgencyColor(item.urgency);

    // Get urgency icon
    const getUrgencyIcon = () => {
      if (item.urgency === UrgencyLevel.HIGH) return '🔴';
      if (item.urgency === UrgencyLevel.MEDIUM) return '🟡';
      if (item.urgency === UrgencyLevel.LOW) return '🟢';
      return '';
    };

    // Get importance stars display
    const getImportanceStars = () => {
      if (item.importance === 0) return '';
      return '⭐'.repeat(item.importance);
    };

    // Get unique formats from all entries (excluding the primary note format)
    const entryFormats = new Set<NoteFormat>();
    item.entries.forEach(entry => {
      if (entry.entryFormats) {
        entry.entryFormats.forEach(format => {
          if (format !== item.noteFormat) {
            entryFormats.add(format);
          }
        });
      }
    });
    const uniqueEntryFormats = Array.from(entryFormats);

    // Get format-specific preview based on selected filter
    const getFormatPreview = () => {
      if (!selectedFormat || !lastEntry) return lastEntry?.content || '';

      // Find first entry with the selected format
      const entryWithFormat = item.entries.find(e => e.entryFormats?.includes(selectedFormat));
      if (!entryWithFormat || !entryWithFormat.formatData) return lastEntry.content;

      // Generate preview based on format type
      switch (selectedFormat) {
        case NoteFormat.TASK:
          const tasks = entryWithFormat.formatData.tasks || [];
          if (tasks.length === 0) return lastEntry.content;
          const taskPreview = tasks.slice(0, 2).map((t: any) =>
            `${t.isCompleted ? '✓' : '□'} ${t.description}`
          ).join(' • ');
          return `✅ ${taskPreview}${tasks.length > 2 ? ` (+${tasks.length - 2} more)` : ''}`;

        case NoteFormat.PROJECT:
          const milestones = entryWithFormat.formatData.projectMilestones || [];
          if (milestones.length === 0) return lastEntry.content;
          const completedCount = milestones.filter((m: any) => m.isCompleted).length;
          const milestonePreview = milestones.slice(0, 2).map((m: any) =>
            `${m.isCompleted ? '✓' : '□'} ${m.description}`
          ).join(' • ');
          return `🚀 Phase ${completedCount}/${milestones.length} • ${milestonePreview}`;

        case NoteFormat.GOAL:
          const goal = entryWithFormat.formatData.goalProgress;
          if (!goal) return lastEntry.content;
          return `👑 ${goal.description || 'Goal'} • ${goal.progress}% complete`;

        default:
          return lastEntry.content;
      }
    };

    return (
      <TouchableOpacity
        style={[styles.noteCard, { borderBottomColor: colors.border }]}
        onPress={() => navigation.navigate('NoteDetail', { noteId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.noteHeader}>
          {/* Format Icon */}
          <Text style={styles.formatIcon}>{FORMAT_EMOJIS[item.noteFormat]}</Text>
          <Text style={[styles.noteTitle, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          {/* Entry Format Emojis (from entries) - Clickable */}
          {uniqueEntryFormats.length > 0 && (
            <View style={styles.entryFormatEmojisContainer}>
              {uniqueEntryFormats.map(format => (
                <TouchableOpacity
                  key={format}
                  onPress={(e) => {
                    e.stopPropagation();
                    navigation.navigate('NoteDetail', { noteId: item.id, filterFormat: format });
                  }}
                  style={styles.formatEmojiButton}
                >
                  <Text style={styles.entryFormatEmojis}>{FORMAT_EMOJIS[format]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {/* Priority Icons on the right side */}
          <View style={styles.priorityIcons}>
            {getUrgencyIcon() ? (
              <Text style={styles.priorityIconText}>{getUrgencyIcon()}</Text>
            ) : null}
            {getImportanceStars() ? (
              <Text style={styles.priorityIconText}>{getImportanceStars()}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={(e) => handleDeleteNote(item.id, e)}
            style={styles.deleteButton}
          >
            <Text style={[styles.deleteButtonText, { color: '#FF3B30' }]}>
              🗑️
            </Text>
          </TouchableOpacity>
        </View>

        {/* Note Preview */}
        {lastEntry && (
          <Text style={[styles.notePreview, { color: colors.textSecondary }]} numberOfLines={2}>
            {getFormatPreview()}
          </Text>
        )}

        {/* Meta Info */}
        <View style={styles.noteMeta}>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {`${formatRelativeTime(item.lastModified)} • ${item.entries.length} ${item.entries.length === 1 ? 'entry' : 'entries'}`}
          </Text>
        </View>

        {/* Hashtags */}
        {item.hashtags.length > 0 && (
          <View style={styles.hashtagsRow}>
            {item.hashtags.slice(0, 3).map(tag => (
              <Text key={tag} style={[styles.hashtag, { color: colors.textSecondary }]}>
                #{tag}
              </Text>
            ))}
            {item.hashtags.length > 3 && (
              <Text style={[styles.hashtag, { color: colors.textSecondary }]}>
                +{item.hashtags.length - 3}
              </Text>
            )}
          </View>
        )}

        {/* Compact Task Preview */}
        {item.tasks && item.tasks.length > 0 && (
          <View style={styles.noteTaskPreview}>
            <TouchableOpacity
              style={styles.noteTaskPreviewHeader}
              onPress={(e) => {
                e.stopPropagation();
                setExpandedNoteTasks(prev => ({
                  ...prev,
                  [item.id]: !prev[item.id],
                }));
              }}
            >
              <Text style={[styles.noteTaskPreviewText, { color: colors.textSecondary }]}>
                {expandedNoteTasks[item.id] ? '▼' : '▶'} Tasks: {item.tasks.filter(t => t.isCompleted).length}/{item.tasks.length} completed
              </Text>
            </TouchableOpacity>

            {/* Expanded Task List */}
            {expandedNoteTasks[item.id] && (
              <View style={styles.noteTaskList}>
                {item.tasks.map(task => (
                  <View key={task.id} style={styles.noteTaskItem}>
                    <Text
                      style={[
                        styles.noteTaskItemText,
                        { color: colors.text },
                        task.isCompleted && styles.noteTaskItemCompleted,
                      ]}
                    >
                      {task.isCompleted ? '✓' : '○'} {task.description}
                    </Text>
                    {task.steps && task.steps.length > 0 && (
                      <Text style={[styles.noteTaskStepsCount, { color: colors.textSecondary }]}>
                        {task.steps.filter(s => s.isCompleted).length}/{task.steps.length} steps
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          NOTED.
        </Text>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={styles.searchIcon}>{ICONS.general.search}</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }, FONTS.regular]}
          placeholder="Search notes..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Folder Filter */}
      {folders.length > 0 && (
        <View style={styles.folderFilter}>
          {/* Add Folder Button */}
          <TouchableOpacity
            style={[styles.addFolderButton, { borderColor: colors.border }]}
            onPress={() => setShowCreateFolderModal(true)}
          >
            <Text style={[styles.addFolderText, { color: colors.accent }]}>
              + Add Folder
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.folderChip,
              !selectedFolder && { backgroundColor: colors.accent },
              { borderColor: colors.border }
            ]}
            onPress={() => setSelectedFolder(null)}
          >
            <Text style={[
              styles.folderChipText,
              !selectedFolder ? { color: '#FFFFFF' } : { color: colors.text }
            ]}>
              All Notes ({notes.length})
            </Text>
          </TouchableOpacity>

          {folders.map(folder => {
            const count = notes.filter(n => n.hashtags.includes(folder.name)).length;
            return (
              <View key={folder.id} style={styles.folderChipContainer}>
                <TouchableOpacity
                  style={[
                    styles.folderChip,
                    selectedFolder === folder.name && { backgroundColor: colors.accent },
                    { borderColor: colors.border }
                  ]}
                  onPress={() => setSelectedFolder(folder.name)}
                >
                  <Text style={[
                    styles.folderChipText,
                    selectedFolder === folder.name ? { color: '#FFFFFF' } : { color: colors.text }
                  ]}>
                    #{folder.name} ({count})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteFolderButton}
                  onPress={(e) => handleDeleteFolder(folder.id, e)}
                >
                  <Text style={[styles.deleteFolderText, { color: colors.textSecondary }]}>
                    −
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* Format Filter Row */}
      <View style={styles.formatFilterContainer}>
        <Text style={[styles.formatFilterLabel, { color: colors.textSecondary }]}>Formats:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.formatFilterScroll}>
          {/* All Formats option */}
          <TouchableOpacity
            style={[
              styles.formatChip,
              !selectedFormat && { backgroundColor: colors.accent },
              { borderColor: colors.border }
            ]}
            onPress={() => setSelectedFormat(null)}
          >
            <Text style={[
              styles.formatChipText,
              !selectedFormat ? { color: '#FFFFFF' } : { color: colors.text }
            ]}>
              All
            </Text>
          </TouchableOpacity>

          {/* Individual format filters */}
          {Object.entries(FORMAT_EMOJIS).map(([format, emoji]) => {
            const formatKey = format as NoteFormat;
            const count = notes.filter(n =>
              n.noteFormat === formatKey || // Count notes with this main format
              n.entries.some(e => e.entryFormats?.includes(formatKey)) // Count notes with entries of this format
            ).length;
            return (
              <TouchableOpacity
                key={format}
                style={[
                  styles.formatChip,
                  selectedFormat === formatKey && { backgroundColor: colors.accent },
                  { borderColor: colors.border }
                ]}
                onPress={() => setSelectedFormat(formatKey)}
              >
                <Text style={[
                  styles.formatChipText,
                  selectedFormat === formatKey ? { color: '#FFFFFF' } : { color: colors.text }
                ]}>
                  {emoji} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content Area */}
      <FlatList
          data={sortedNotes}
          renderItem={renderNoteCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {searchQuery ? 'No notes found' : 'No notes yet'}
              </Text>
              {!searchQuery && (
                <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                  Tap [ + ] to create your first note
                </Text>
              )}
            </View>
          }
        />

      {/* Tasks Tab Content - Now Hidden (migrated to notes with format) */}
      {false && (
        <>
          {/* Quick Add Input */}
          <View style={[styles.quickAddContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.quickAddInput, { color: colors.text }]}
              placeholder="Add a task..."
              placeholderTextColor={colors.textSecondary}
              value={newTaskInput}
              onChangeText={setNewTaskInput}
              onSubmitEditing={handleQuickCreateTask}
            />
            <TouchableOpacity onPress={handleQuickCreateTask} disabled={!newTaskInput.trim()}>
              <Text style={[styles.quickAddButton, { color: newTaskInput.trim() ? colors.accent : colors.textSecondary }]}>
                +
              </Text>
            </TouchableOpacity>
          </View>

          {/* Active Tasks Section */}
          <ScrollView style={styles.tasksScrollView} contentContainerStyle={styles.listContent}>
            {sortTasksByPriority(allTasks.filter(t => !t.isCompleted)).length > 0 ? (
              <>
                <Text style={[styles.sectionHeader, { color: colors.text }]}>Active Tasks</Text>
                {sortTasksByPriority(allTasks.filter(t => !t.isCompleted)).map(task => {
                  const completedSteps = task.steps.filter(s => s.isCompleted).length;
                  const totalSteps = task.steps.length;
                  const dueStatus = getDueDateStatus(task.dueDate);

                  return (
                    <TouchableOpacity
                      key={task.id}
                      style={[styles.taskCardClickable, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
                      onPress={() => handleOpenTaskDetail(task)}
                      activeOpacity={0.7}
                    >
                      {/* Task Header */}
                      <View style={styles.taskHeader}>
                        <Text style={[styles.taskDescription, { color: colors.text }]} numberOfLines={2}>
                          {task.description}
                        </Text>
                      </View>

                      {/* Priority Indicators */}
                      {(task.urgency !== UrgencyLevel.NONE || task.importance > 0) && (
                        <View style={styles.taskPriorityRow}>
                          {task.urgency === UrgencyLevel.HIGH && <Text style={styles.taskPriorityIcon}>🔴</Text>}
                          {task.urgency === UrgencyLevel.MEDIUM && <Text style={styles.taskPriorityIcon}>🟡</Text>}
                          {task.urgency === UrgencyLevel.LOW && <Text style={styles.taskPriorityIcon}>🟢</Text>}
                          {task.importance > 0 && (
                            <Text style={styles.taskPriorityIcon}>{'⭐'.repeat(task.importance)}</Text>
                          )}
                        </View>
                      )}

                      {/* Steps Progress */}
                      {totalSteps > 0 && (
                        <View style={styles.stepsPreviewContainer}>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              toggleStepsExpanded(task.id);
                            }}
                            style={styles.stepsToggle}
                          >
                            <Text style={[styles.stepsProgressText, { color: colors.textSecondary }]}>
                              {expandedSteps[task.id] ? '▼' : '▶'} {completedSteps}/{totalSteps} steps
                            </Text>
                          </TouchableOpacity>

                          {expandedSteps[task.id] && (
                            <View style={styles.stepsExpandedList}>
                              {task.steps.map((step, index) => (
                                <View key={step.id} style={styles.stepPreviewRow}>
                                  <Text style={[
                                    styles.stepPreviewText,
                                    { color: colors.textSecondary },
                                    step.isCompleted && styles.stepCompletedText
                                  ]}>
                                    {step.isCompleted ? '✓' : '○'} {index + 1}. {step.description}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      )}

                      {/* Task Meta Info */}
                      <View style={styles.taskMeta}>
                        {/* Note Badge - show if task belongs to a note */}
                        {(task as any).noteTitle && (
                          <View style={[styles.noteBadge, { backgroundColor: colors.accent + '20', borderColor: colors.accent }]}>
                            <Text style={[styles.noteBadgeText, { color: colors.accent }]}>
                              📝 {(task as any).noteTitle}
                            </Text>
                          </View>
                        )}

                        <Text style={[styles.taskTimestamp, { color: colors.textSecondary }]}>
                          Created {formatRelativeTime(task.createdAt)}
                        </Text>

                        {/* Due Date Badge */}
                        {task.dueDate && (
                          <View style={[
                            styles.dueDateBadge,
                            dueStatus === 'overdue' && styles.dueDateOverdue,
                            dueStatus === 'today' && styles.dueDateToday,
                            dueStatus === 'upcoming' && styles.dueDateUpcoming,
                          ]}>
                            <Text style={[
                              styles.dueDateText,
                              dueStatus === 'overdue' && styles.dueDateTextOverdue,
                              dueStatus === 'today' && styles.dueDateTextToday,
                            ]}>
                              {formatDueDate(task.dueDate)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No active tasks
                </Text>
                <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                  Add a task above to get started
                </Text>
              </View>
            )}

            {/* Completed Tasks Section */}
            {allTasks.filter(t => t.isCompleted).length > 0 && (
              <>
                <TouchableOpacity
                  style={styles.completedSectionHeader}
                  onPress={() => setShowCompletedTasks(!showCompletedTasks)}
                >
                  <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
                    {showCompletedTasks ? '▼' : '▶'} Completed ({allTasks.filter(t => t.isCompleted).length})
                  </Text>
                </TouchableOpacity>

                {showCompletedTasks && allTasks.filter(t => t.isCompleted).map(task => {
                  const completedSteps = task.steps.filter(s => s.isCompleted).length;
                  const totalSteps = task.steps.length;

                  return (
                    <TouchableOpacity
                      key={task.id}
                      style={[styles.taskCardClickable, styles.taskCardCompleted, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
                      onPress={() => handleOpenTaskDetail(task)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.taskHeader}>
                        <Text style={[styles.taskDescription, styles.taskCompletedText, { color: colors.textSecondary }]} numberOfLines={2}>
                          {task.description}
                        </Text>
                      </View>

                      {totalSteps > 0 && (
                        <Text style={[styles.stepsProgressText, { color: colors.textSecondary }]}>
                          {completedSteps}/{totalSteps} steps
                        </Text>
                      )}

                      <View style={styles.taskMeta}>
                        <Text style={[styles.taskTimestamp, { color: colors.textSecondary }]}>
                          Completed {formatRelativeTime(task.completedAt!)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </ScrollView>
        </>
      )}


      {/* Create Button */}
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.accent }]}
        onPress={handleCreateNote}
        activeOpacity={0.8}
      >
        <Text style={styles.createButtonText}>{ICONS.general.add}</Text>
      </TouchableOpacity>

      {/* Create Folder Modal */}
      <Modal
        visible={showCreateFolderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateFolderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create New Folder</Text>

            <View style={[styles.modalInputContainer, { borderColor: colors.border }]}>
              <Text style={[styles.hashSymbol, { color: colors.textSecondary }]}>#</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text }]}
                placeholder="Folder name"
                placeholderTextColor={colors.textSecondary}
                value={newFolderName}
                onChangeText={setNewFolderName}
                autoFocus
                onSubmitEditing={handleCreateFolder}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowCreateFolderModal(false);
                  setNewFolderName('');
                }}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.createButton2, { backgroundColor: colors.accent }]}
                onPress={handleCreateFolder}
              >
                <Text style={styles.createButtonText2}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Task Detail Modal */}
      <Modal
        visible={showTaskDetailModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseTaskDetail}
      >
        <View style={[styles.editTaskModalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.editTaskHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.editTaskTitle, { color: colors.text }]}>Task Details</Text>
            <TouchableOpacity onPress={handleCloseTaskDetail}>
              <Text style={[styles.closeButton, { color: colors.accent }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.editTaskContent}>
            {/* Task Description */}
            <View style={[styles.editTaskSection, { borderBottomColor: colors.border }]}>
              <Text style={[styles.editTaskLabel, { color: colors.textSecondary }]}>Description</Text>
              <TextInput
                style={[styles.editTaskDescriptionInput, { color: colors.text }]}
                placeholder="Task description"
                placeholderTextColor={colors.textSecondary}
                value={editTaskDescription}
                onChangeText={setEditTaskDescription}
                onBlur={handleSaveTaskDescription}
              />
            </View>

            {/* Steps Section */}
            <View style={styles.editTaskSection}>
              <Text style={[styles.editTaskLabel, { color: colors.textSecondary }]}>Steps</Text>

              {/* Existing Steps */}
              {selectedTask && selectedTask.steps && selectedTask.steps.map((step, index) => (
                <View key={step.id} style={[styles.editStepRow, { borderBottomColor: colors.border }]}>
                  <TouchableOpacity onPress={() => handleToggleStep(step.id)}>
                    <View
                      style={[
                        styles.editStepCheckbox,
                        { borderColor: colors.border },
                        step.isCompleted && { backgroundColor: colors.accent, borderColor: colors.accent },
                      ]}
                    >
                      {step.isCompleted && <Text style={styles.editStepCheckmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                  <Text style={[styles.editStepNumber, { color: colors.textSecondary }]}>{index + 1}.</Text>
                  <Text
                    style={[
                      styles.editStepText,
                      { color: colors.text },
                      step.isCompleted && styles.editStepCompletedText,
                    ]}
                  >
                    {step.description}
                  </Text>
                  <TouchableOpacity onPress={() => handleDeleteStep(step.id)}>
                    <Text style={[styles.editStepDelete, { color: '#FF3B30' }]}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add Step Input */}
              <View style={[styles.editAddStepRow, { borderColor: colors.border }]}>
                <TextInput
                  style={[styles.editAddStepInput, { color: colors.text }]}
                  placeholder="Add a step..."
                  placeholderTextColor={colors.textSecondary}
                  value={newStepInput}
                  onChangeText={setNewStepInput}
                  onSubmitEditing={handleAddStep}
                />
                <TouchableOpacity
                  onPress={handleAddStep}
                  disabled={!newStepInput.trim()}
                >
                  <Text style={[styles.editAddStepButton, { color: newStepInput.trim() ? colors.accent : colors.textSecondary }]}>
                    +
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.taskActionButtons}>
              {/* Complete Task Button */}
              {selectedTask && !selectedTask.isCompleted && (
                <TouchableOpacity
                  style={[styles.completeTaskButton, { backgroundColor: colors.accent }]}
                  onPress={handleCompleteTask}
                >
                  <Text style={styles.completeTaskButtonText}>✓ Mark Complete</Text>
                </TouchableOpacity>
              )}

              {/* Reopen Task Button (if completed) */}
              {selectedTask && selectedTask.isCompleted && (
                <TouchableOpacity
                  style={[styles.completeTaskButton, { backgroundColor: colors.accent }]}
                  onPress={handleCompleteTask}
                >
                  <Text style={styles.completeTaskButtonText}>↺ Reopen Task</Text>
                </TouchableOpacity>
              )}

              {/* Delete Task Button */}
              <TouchableOpacity
                style={[styles.deleteTaskButton, { borderColor: '#FF3B30' }]}
                onPress={handleDeleteTask}
              >
                <Text style={[styles.deleteTaskButtonText, { color: '#FF3B30' }]}>🗑️ Delete Task</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 30,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.bold,
    fontSize: 32,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderRadius: 8,
  },
  searchIcon: {
    fontSize: FONT_SIZES.bodyLarge,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.bodyLarge,
    padding: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  tabEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
  },
  activeTabText: {
    ...FONTS.medium,
  },
  folderFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  folderChipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  folderChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    borderWidth: 1,
  },
  folderChipText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
  },
  deleteFolderButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteFolderText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addFolderButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addFolderText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
  },
  listContent: {
    paddingTop: SPACING.sm,
    paddingBottom: 100,
  },
  noteCard: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  noteTitle: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.bodyLarge,
    flexShrink: 1,
  },
  priorityIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  priorityIconText: {
    fontSize: 16,
  },
  deleteButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  notePreview: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    marginBottom: SPACING.xs,
    lineHeight: 20,
  },
  noteMeta: {
    marginBottom: SPACING.xs,
  },
  metaText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
    opacity: 0.6,
  },
  hashtagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  hashtag: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
  },
  noteTaskPreview: {
    marginTop: SPACING.sm,
  },
  noteTaskPreviewHeader: {
    paddingVertical: SPACING.xs,
  },
  noteTaskPreviewText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
  },
  noteTaskList: {
    marginTop: SPACING.xs,
    marginLeft: SPACING.md,
    gap: SPACING.xs,
  },
  noteTaskItem: {
    paddingVertical: 2,
  },
  noteTaskItemText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
  },
  noteTaskItemCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  noteTaskStepsCount: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp - 1,
    marginLeft: SPACING.md,
    opacity: 0.7,
  },
  formatIcon: {
    fontSize: 18,
    marginRight: SPACING.xs,
  },
  entryFormatEmojisContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: SPACING.xs,
  },
  formatEmojiButton: {
    padding: 2,
  },
  entryFormatEmojis: {
    fontSize: 14,
    opacity: 0.8,
  },
  formatFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  formatFilterLabel: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
  },
  formatFilterScroll: {
    flex: 1,
  },
  formatChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: SPACING.sm,
  },
  formatChipText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.bodyLarge,
    marginBottom: SPACING.sm,
  },
  emptyHint: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
    textAlign: 'center',
  },
  createButton: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.md,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonText: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    borderRadius: 12,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.h3,
    marginBottom: SPACING.md,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  hashSymbol: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.bodyLarge,
    marginRight: SPACING.xs,
  },
  modalInput: {
    flex: 1,
    ...FONTS.regular,
    fontSize: FONT_SIZES.bodyLarge,
    paddingVertical: SPACING.sm,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  createButton2: {
    // backgroundColor handled by accent color
  },
  createButtonText2: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
    color: '#FFFFFF',
  },
  // Plus Menu styles
  plusMenuContent: {
    width: 250,
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  plusMenuTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.h3,
    marginBottom: SPACING.md,
  },
  plusMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
  },
  plusMenuEmoji: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  plusMenuText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.bodyLarge,
  },
  // Task card styles
  taskCard: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  taskCheckmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskContent: {
    flex: 1,
  },
  taskDescription: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.bodyLarge,
  },
  taskCompletedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  taskPriorityRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: SPACING.xs,
  },
  taskPriorityIcon: {
    fontSize: 14,
  },
  taskDeleteButton: {
    padding: SPACING.xs,
  },
  taskDeleteButtonText: {
    fontSize: 20,
  },
  taskEditButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  taskEditButtonText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
  },
  quickAddContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  quickAddInput: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    flex: 1,
    paddingVertical: SPACING.xs,
  },
  quickAddButton: {
    fontSize: 28,
    fontWeight: 'bold',
    width: 32,
    textAlign: 'center',
  },
  editTaskModalContainer: {
    flex: 1,
    marginTop: 60,
  },
  editTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  editTaskTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.header,
  },
  closeButton: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  editTaskContent: {
    flex: 1,
  },
  editTaskSection: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  editTaskLabel: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
    marginBottom: SPACING.sm,
  },
  editTaskDescriptionInput: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    paddingVertical: SPACING.sm,
  },
  editStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    gap: SPACING.sm,
  },
  editStepCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editStepCheckmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  editStepNumber: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
    width: 24,
  },
  editStepText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    flex: 1,
  },
  editStepCompletedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  editStepDelete: {
    fontSize: 18,
    padding: SPACING.xs,
  },
  editAddStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  editAddStepInput: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    flex: 1,
    paddingVertical: SPACING.xs,
  },
  editAddStepButton: {
    fontSize: 28,
    fontWeight: 'bold',
    width: 32,
    textAlign: 'center',
  },
  // New task card styles
  sectionHeader: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.bodyLarge,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    marginHorizontal: SPACING.md,
  },
  tasksScrollView: {
    flex: 1,
  },
  taskCardClickable: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    marginHorizontal: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  taskCardCompleted: {
    opacity: 0.6,
  },
  taskHeader: {
    marginBottom: SPACING.xs,
  },
  stepsPreviewContainer: {
    marginTop: SPACING.xs,
  },
  stepsToggle: {
    paddingVertical: SPACING.xs,
  },
  stepsProgressText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
  },
  stepsExpandedList: {
    marginTop: SPACING.xs,
    marginLeft: SPACING.md,
  },
  stepPreviewRow: {
    paddingVertical: 2,
  },
  stepPreviewText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  dueDateBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
  },
  dueDateOverdue: {
    backgroundColor: '#FFEBEE',
  },
  dueDateToday: {
    backgroundColor: '#FFF3E0',
  },
  dueDateUpcoming: {
    backgroundColor: '#E8F5E9',
  },
  dueDateText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
    color: '#666',
  },
  dueDateTextOverdue: {
    color: '#D32F2F',
  },
  dueDateTextToday: {
    color: '#F57C00',
  },
  completedSectionHeader: {
    marginTop: SPACING.lg,
  },
  noteBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  noteBadgeText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
  },
  taskActionButtons: {
    padding: SPACING.md,
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  completeTaskButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeTaskButtonText: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
    color: '#FFFFFF',
  },
  deleteTaskButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  deleteTaskButtonText: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
  },
});
