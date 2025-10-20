// ============================================
// NOTED - Note Detail Screen with Timeline Navigator
// ============================================

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StatusBar,
} from 'react-native';
import { useStore } from '../store';
import { COLORS, FONTS, FONT_SIZES, SPACING, ICONS, getThemedColors } from '../theme';
import { formatDate, formatTime, groupEntriesByDate } from '../utils';
import type { Entry, EntryFormatData } from '../types';
import { UrgencyLevel, NoteFormat, FORMAT_EMOJIS } from '../types';
import { TaskBlock } from '../components/TaskBlock';
import { ProjectBlock } from '../components/ProjectBlock';
import { GoalBlock } from '../components/GoalBlock';

export const NoteDetailScreen = ({ route, navigation }: any) => {
  const { noteId, filterFormat } = route.params;
  const {
    currentNote,
    setCurrentNote,
    addEntry,
    updateEntry,
    updateNote,
    deleteNote,
    deleteEntry,
    createTask,
    addTaskStep,
    toggleTaskStep,
    deleteTask,
    isDarkMode
  } = useStore();
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isEditing, setIsEditing] = useState(true); // Start in edit mode for new notes
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null); // Track which entry is being edited
  const [showNavigator, setShowNavigator] = useState(false);
  const [reverseOrder, setReverseOrder] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null); // Track which task is expanded
  const [newStepText, setNewStepText] = useState(''); // New step input
  const scrollViewRef = useRef<ScrollView>(null);

  // NEW: Entry-level format states
  const [activeFormats, setActiveFormats] = useState<NoteFormat[]>([NoteFormat.NOTE]);
  const [currentFormatData, setCurrentFormatData] = useState<any>({});
  const [collapsedEntries, setCollapsedEntries] = useState<{ [entryId: string]: boolean }>({});

  const colors = getThemedColors(isDarkMode);

  useEffect(() => {
    // Load note
    const loadNote = async () => {
      const { notes } = useStore.getState();
      const note = notes.find(n => n.id === noteId);
      if (note) {
        setCurrentNote(note);
        setNoteTitle(note.title);
        // If note has entries, we're viewing it (not editing)
        if (note.entries.length > 0) {
          setIsEditing(false);
        }

        // Auto-expand entries with the filtered format
        if (filterFormat) {
          const newCollapsedState: { [entryId: string]: boolean } = {};
          note.entries.forEach(entry => {
            // Collapse entries that DON'T have the filtered format
            const hasFormat = entry.entryFormats?.includes(filterFormat);
            newCollapsedState[entry.id] = !hasFormat;
          });
          setCollapsedEntries(newCollapsedState);
        }
      }
    };
    loadNote();

    return () => setCurrentNote(null);
  }, [noteId, filterFormat]);

  const handleSaveEntry = async () => {
    if (!noteContent.trim() && activeFormats.length === 1 && activeFormats[0] === NoteFormat.NOTE) {
      // Don't save if there's no content and no special formats
      return;
    }
    if (!currentNote) return;

    try {
      // Update title if changed
      if (noteTitle !== currentNote.title) {
        await updateNote(currentNote.id, { title: noteTitle });
      }

      if (editingEntryId) {
        // Update existing entry with formats and formatData
        await updateEntry(currentNote.id, editingEntryId, noteContent, activeFormats, currentFormatData);
        setEditingEntryId(null);
      } else {
        // Add new entry with formats and formatData
        await addEntry(currentNote.id, noteContent, activeFormats, currentFormatData);
      }

      // Clear content, reset formats, and switch to view mode
      setNoteContent('');
      setActiveFormats([NoteFormat.NOTE]);
      setCurrentFormatData({});
      setIsEditing(false);

      // Reload note
      const { notes } = useStore.getState();
      const updatedNote = notes.find(n => n.id === noteId);
      if (updatedNote) {
        setCurrentNote(updatedNote);
      }
    } catch (error) {
      console.error('Failed to save entry:', error);
    }
  };

  const handleStartEditing = () => {
    setIsEditing(true);
    setNoteContent('');
    setEditingEntryId(null);
  };

  const handleEditEntry = (entry: Entry) => {
    // Load existing entry content AND formats for editing
    setIsEditing(true);
    setNoteContent(entry.content);
    setEditingEntryId(entry.id);
    // Load the entry's formats
    setActiveFormats(entry.entryFormats || [NoteFormat.NOTE]);
    setCurrentFormatData(entry.formatData || {});
  };

  const handleToggleFormat = (format: NoteFormat) => {
    setActiveFormats(prev => {
      if (prev.includes(format)) {
        // Remove format (but keep at least NOTE format)
        const filtered = prev.filter(f => f !== format);
        return filtered.length > 0 ? filtered : [NoteFormat.NOTE];
      } else {
        // Add format
        return [...prev, format];
      }
    });
  };

  const handleBack = () => {
    if (isEditing) {
      // If editing, cancel edit and return to view mode
      setIsEditing(false);
      setNoteContent('');
      setEditingEntryId(null);
      setActiveFormats([NoteFormat.NOTE]);
      setCurrentFormatData({});
    } else {
      // If viewing, go back to home
      navigation.goBack();
    }
  };

  const handleSetUrgency = async (urgency: UrgencyLevel) => {
    if (!currentNote) return;

    try {
      await updateNote(currentNote.id, { urgency });
    } catch (error) {
      console.error('Failed to update urgency:', error);
    }
  };

  const handleSetImportance = async (importance: number) => {
    if (!currentNote) return;

    try {
      await updateNote(currentNote.id, { importance });
    } catch (error) {
      console.error('Failed to update importance:', error);
    }
  };

  const handleSetFormat = async (format: NoteFormat) => {
    if (!currentNote) return;

    try {
      await updateNote(currentNote.id, { noteFormat: format });
    } catch (error) {
      console.error('Failed to update format:', error);
    }
  };

  const handleDeleteNote = async () => {
    if (!currentNote) return;

    // Simple confirmation
    const confirmed = confirm('Delete this note? This cannot be undone.');
    if (!confirmed) return;

    try {
      await deleteNote(currentNote.id);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!currentNote) return;

    const confirmed = confirm('Delete this entry? This cannot be undone.');
    if (!confirmed) return;

    try {
      await deleteEntry(currentNote.id, entryId);
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const handleCreateTask = async () => {
    if (!currentNote) return;

    const taskDescription = prompt('Task description:');
    if (!taskDescription || !taskDescription.trim()) return;

    try {
      await createTask(currentNote.id, taskDescription.trim());
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!currentNote) return;

    const task = currentNote.tasks.find(t => t.id === taskId);
    if (!task) return;

    // If task has steps, only toggle via steps completion
    if (task.steps && task.steps.length > 0) {
      alert('Complete all steps to finish this task');
      return;
    }

    // For tasks without steps, toggle directly
    try {
      await toggleTaskStep(taskId, ''); // Empty stepId toggles the task itself
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const handleToggleStep = async (taskId: string, stepId: string) => {
    try {
      await toggleTaskStep(taskId, stepId);
    } catch (error) {
      console.error('Failed to toggle step:', error);
    }
  };

  const handleAddStep = async (taskId: string) => {
    if (!currentNote || !newStepText.trim()) return;

    try {
      await addTaskStep(currentNote.id, taskId, newStepText.trim());
      setNewStepText('');
    } catch (error) {
      console.error('Failed to add step:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const confirmed = confirm('Delete this task? This cannot be undone.');
    if (!confirmed) return;

    try {
      await deleteTask(taskId);
      setExpandedTaskId(null);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleJumpToEntry = (entryId: string) => {
    setShowNavigator(false);
    // In a real implementation, you would scroll to the specific entry
    // For now, we'll just close the navigator
    console.log('Jump to entry:', entryId);
  };

  if (!currentNote) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }

  const groupedEntries = groupEntriesByDate(currentNote.entries);

  // Reverse order if needed (latest first)
  const displayedGroups = reverseOrder ? [...groupedEntries].reverse() : groupedEntries;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleBack}>
            <Text style={[styles.backText, { color: colors.accent }]}>
              {ICONS.general.back}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.appName, { color: colors.text }]}>NOTED.</Text>

        <View style={styles.headerButtons}>
          {isEditing && (
            <TouchableOpacity
              onPress={handleSaveEntry}
              disabled={!noteContent.trim()}
            >
              <Text style={[styles.saveText, { color: noteContent.trim() ? colors.accent : colors.textSecondary }]}>
                Save
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isEditing ? (
        /* EDITING MODE - Full Page */
        <ScrollView style={styles.editContainer}>
          {/* Title Input */}
          <TextInput
            style={[styles.titleInput, { color: colors.text, borderBottomColor: colors.border }, FONTS.medium]}
            placeholder="Note Title"
            placeholderTextColor={colors.textSecondary}
            value={noteTitle}
            onChangeText={setNoteTitle}
            maxLength={100}
          />

          {/* Format Buttons - At Top of Entry Editor */}
          <View style={[styles.entryFormatButtons, { borderBottomColor: colors.border }]}>
            <Text style={[styles.formatLabel, { color: colors.textSecondary }]}>Formats:</Text>
            <View style={styles.formatButtonsRow}>
              {Object.entries(FORMAT_EMOJIS).map(([format, emoji]) => {
                const formatKey = format as NoteFormat;
                const isActive = activeFormats.includes(formatKey);
                return (
                  <TouchableOpacity
                    key={format}
                    style={[
                      styles.formatButton,
                      isActive && { backgroundColor: colors.accent },
                      { borderColor: colors.border }
                    ]}
                    onPress={() => handleToggleFormat(formatKey)}
                  >
                    <Text style={[
                      styles.formatButtonEmoji,
                      isActive && { color: '#FFFFFF' }
                    ]}>
                      {emoji}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Content Input */}
          <TextInput
            style={[styles.contentInput, { color: colors.text }, FONTS.regular]}
            placeholder="Start typing..."
            placeholderTextColor={colors.textSecondary}
            value={noteContent}
            onChangeText={setNoteContent}
            multiline
            textAlignVertical="top"
            autoFocus
          />

          {/* Format Blocks */}
          <View style={styles.formatBlocksContainer}>
            {activeFormats.includes(NoteFormat.TASK) && (
              <TaskBlock
                tasks={currentFormatData.tasks || []}
                onTasksChange={(tasks) => {
                  setCurrentFormatData({...currentFormatData, tasks});
                }}
                colors={colors}
              />
            )}

            {activeFormats.includes(NoteFormat.PROJECT) && (
              <ProjectBlock
                milestones={currentFormatData.projectMilestones || []}
                onMilestonesChange={(milestones) => {
                  setCurrentFormatData({...currentFormatData, projectMilestones: milestones});
                }}
                colors={colors}
              />
            )}

            {activeFormats.includes(NoteFormat.GOAL) && (
              <GoalBlock
                goalData={currentFormatData.goalProgress || {description: '', progress: 0}}
                onGoalChange={(goalData) => {
                  setCurrentFormatData({...currentFormatData, goalProgress: goalData});
                }}
                colors={colors}
              />
            )}
          </View>
        </ScrollView>
      ) : (
        /* VIEW MODE - Timeline */
        <>
          {/* Title Display - Always Editable */}
          <View style={[styles.titleDisplay, { borderBottomColor: colors.border }]}>
            <TextInput
              style={[styles.titleText, { color: colors.text }, FONTS.bold]}
              value={noteTitle}
              onChangeText={setNoteTitle}
              placeholder="Untitled"
              placeholderTextColor={colors.textSecondary}
              onBlur={async () => {
                // Save title when user finishes editing
                if (noteTitle !== currentNote.title) {
                  await updateNote(currentNote.id, { title: noteTitle });
                  // Reload note
                  const { notes } = useStore.getState();
                  const updatedNote = notes.find(n => n.id === noteId);
                  if (updatedNote) {
                    setCurrentNote(updatedNote);
                  }
                }
              }}
            />

            {/* Right side controls */}
            <View style={styles.titleControls}>
              {/* Priority Controls */}
              {currentNote && (
                <View style={styles.priorityControls}>
                  {/* Urgency */}
                  <View style={styles.prioritySection}>
                    <Text style={[styles.priorityLabel, { color: colors.textSecondary }]}>Urgency</Text>
                    <View style={styles.urgencyButtons}>
                      <TouchableOpacity
                        onPress={() => handleSetUrgency(UrgencyLevel.HIGH)}
                        style={[
                          styles.urgencyButton,
                          currentNote.urgency === UrgencyLevel.HIGH && styles.urgencyButtonActive
                        ]}
                      >
                        <Text style={styles.urgencyEmoji}>🔴</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleSetUrgency(UrgencyLevel.MEDIUM)}
                        style={[
                          styles.urgencyButton,
                          currentNote.urgency === UrgencyLevel.MEDIUM && styles.urgencyButtonActive
                        ]}
                      >
                        <Text style={styles.urgencyEmoji}>🟡</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleSetUrgency(UrgencyLevel.LOW)}
                        style={[
                          styles.urgencyButton,
                          currentNote.urgency === UrgencyLevel.LOW && styles.urgencyButtonActive
                        ]}
                      >
                        <Text style={styles.urgencyEmoji}>🟢</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Importance */}
                  <View style={styles.prioritySection}>
                    <Text style={[styles.priorityLabel, { color: colors.textSecondary }]}>Importance</Text>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                          key={star}
                          onPress={() => handleSetImportance(star)}
                        >
                          <Text style={styles.starIcon}>
                            {star <= currentNote.importance ? '⭐' : '☆'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {/* Entry Finder & Order Toggle - Stacked Vertically */}
              {groupedEntries.length > 0 && (
                <View style={styles.entryControls}>
                  {/* Entry Finder */}
                  <TouchableOpacity onPress={() => setShowNavigator(true)} style={styles.entryFinder}>
                    <Text style={[styles.entryFinderLabel, { color: colors.textSecondary }]}>
                      entry finder
                    </Text>
                    <Text style={styles.watchIcon}>{ICONS.general.navigator}</Text>
                  </TouchableOpacity>

                  {/* Order Toggle */}
                  <TouchableOpacity onPress={() => setReverseOrder(!reverseOrder)} style={styles.orderToggle}>
                    <Text style={[styles.orderToggleLabel, { color: colors.textSecondary }]}>
                      entry order
                    </Text>
                    <Text style={[styles.orderToggleText, { color: colors.accent }]}>
                      {reverseOrder ? '↓' : '↑'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Tasks Section - Only show for TASK format */}
          {currentNote.noteFormat === NoteFormat.TASK && currentNote.tasks && currentNote.tasks.length > 0 && (
            <View style={[styles.tasksSection, { borderBottomColor: colors.border }]}>
              {currentNote.tasks.map((task, index) => {
                const isExpanded = expandedTaskId === task.id;
                const completedSteps = task.steps?.filter(s => s.isCompleted).length || 0;
                const totalSteps = task.steps?.length || 0;
                const hasSteps = totalSteps > 0;

                return (
                  <View key={task.id} style={[styles.taskCard, { borderBottomColor: colors.border }]}>
                    {/* Task Header */}
                    <TouchableOpacity
                      style={styles.taskHeader}
                      onPress={() => setExpandedTaskId(isExpanded ? null : task.id)}
                    >
                      {/* Checkbox - Hidden for completed tasks */}
                      {!task.isCompleted && (
                        <TouchableOpacity
                          onPress={() => hasSteps ? null : handleToggleTask(task.id)}
                          disabled={hasSteps}
                        >
                          <View
                            style={[
                              styles.taskCheckbox,
                              { borderColor: colors.border },
                            ]}
                          >
                          </View>
                        </TouchableOpacity>
                      )}

                      {/* Task Description */}
                      <View style={styles.taskContent}>
                        <Text
                          style={[
                            styles.taskDescription,
                            { color: colors.text },
                            task.isCompleted && styles.taskCompletedText,
                          ]}
                        >
                          {task.description}
                        </Text>

                        {/* Timestamps */}
                        <Text style={[styles.taskTimestamp, { color: colors.textSecondary }]}>
                          Created {formatTime(task.createdAt)}
                          {task.completedAt && ` • Completed ${formatTime(task.completedAt)}`}
                        </Text>

                        {/* Progress if has steps */}
                        {hasSteps && (
                          <Text style={[styles.taskProgress, { color: colors.textSecondary }]}>
                            {completedSteps}/{totalSteps} steps completed
                          </Text>
                        )}
                      </View>

                      {/* Expand indicator */}
                      <Text style={[styles.expandIndicator, { color: colors.textSecondary }]}>
                        {isExpanded ? '▼' : '▶'}
                      </Text>
                    </TouchableOpacity>

                    {/* Expanded: Steps */}
                    {isExpanded && (
                      <View style={styles.taskSteps}>
                        {task.steps && task.steps.map((step, stepIndex) => (
                          <View key={step.id} style={styles.stepRow}>
                            {/* Step Checkbox */}
                            <TouchableOpacity onPress={() => handleToggleStep(task.id, step.id)}>
                              <View
                                style={[
                                  styles.stepCheckbox,
                                  { borderColor: colors.border },
                                  step.isCompleted && { backgroundColor: colors.accent, borderColor: colors.accent },
                                ]}
                              >
                                {step.isCompleted && <Text style={styles.stepCheckmark}>✓</Text>}
                              </View>
                            </TouchableOpacity>

                            {/* Step Description */}
                            <View style={styles.stepContent}>
                              <Text
                                style={[
                                  styles.stepDescription,
                                  { color: colors.text },
                                  step.isCompleted && styles.stepCompletedText,
                                ]}
                              >
                                {stepIndex + 1}. {step.description}
                              </Text>
                              <Text style={[styles.stepTimestamp, { color: colors.textSecondary }]}>
                                Created {formatTime(step.createdAt)}
                                {step.completedAt && ` • Completed ${formatTime(step.completedAt)}`}
                              </Text>
                            </View>
                          </View>
                        ))}

                        {/* Add Step Input */}
                        <View style={styles.addStepRow}>
                          <TextInput
                            style={[styles.addStepInput, { color: colors.text, borderColor: colors.border }]}
                            placeholder="Add a step..."
                            placeholderTextColor={colors.textSecondary}
                            value={newStepText}
                            onChangeText={setNewStepText}
                            onSubmitEditing={() => handleAddStep(task.id)}
                          />
                          <TouchableOpacity
                            onPress={() => handleAddStep(task.id)}
                            disabled={!newStepText.trim()}
                          >
                            <Text style={[styles.addStepButton, { color: newStepText.trim() ? colors.accent : colors.textSecondary }]}>
                              +
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* Delete Task */}
                        <TouchableOpacity
                          onPress={() => handleDeleteTask(task.id)}
                          style={styles.deleteTaskButton}
                        >
                          <Text style={styles.deleteTaskText}>Delete Task</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Timeline */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.timeline}
            contentContainerStyle={styles.timelineContent}
          >
            {groupedEntries.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No entries yet
                </Text>
              </View>
            ) : (
              displayedGroups.map(group => {
              const displayedEntries = reverseOrder ? [...group.entries].reverse() : group.entries;
              return (
                <View key={group.dateLabel} style={styles.dateGroup}>
                  {/* Date Header */}
                  <View style={[styles.dateHeader, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.dateText, { color: colors.text }]}>
                      {ICONS.general.calendar} {group.dateLabel}
                    </Text>
                  </View>

                  {/* Entries for this date */}
                  {displayedEntries.map(entry => {
                    const isCollapsed = collapsedEntries[entry.id] || false;
                    const entryFormats = entry.entryFormats || [NoteFormat.NOTE];
                    const isHighlighted = filterFormat && entry.entryFormats?.includes(filterFormat);

                    return (
                      <View
                        key={entry.id}
                        style={[
                          styles.entry,
                          isHighlighted && { backgroundColor: colors.accent + '10', borderLeftWidth: 3, borderLeftColor: colors.accent }
                        ]}
                      >
                        <View style={styles.entryHeader}>
                          <TouchableOpacity
                            onPress={() => {
                              setCollapsedEntries(prev => ({
                                ...prev,
                                [entry.id]: !isCollapsed
                              }));
                            }}
                            style={styles.expandToggle}
                          >
                            <Text style={[styles.expandIcon, { color: colors.textSecondary }]}>
                              {isCollapsed ? '▶' : '▼'}
                            </Text>
                          </TouchableOpacity>

                          <Text style={[styles.formatEmojis, { color: colors.text }]}>
                            [{entryFormats.map(f => FORMAT_EMOJIS[f]).join('')}]
                          </Text>

                          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                            {formatTime(entry.timestamp)}
                            {entry.isEdited && entry.editedAt && (
                              <Text style={{ opacity: 0.7 }}> • Edited {formatTime(entry.editedAt)}</Text>
                            )}
                          </Text>

                          <View style={styles.entryActions}>
                            <TouchableOpacity onPress={() => handleEditEntry(entry)}>
                              <Text style={[styles.editEntryButton, { color: colors.accent }]}>
                                edit
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteEntry(entry.id)}>
                              <Text style={[styles.deleteEntryButton, { color: '#FF3B30' }]}>
                                🗑️
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Preview when collapsed */}
                        {isCollapsed && entry.content && (
                          <Text style={[styles.entryPreview, { color: colors.textSecondary }]} numberOfLines={2}>
                            {entry.content}
                          </Text>
                        )}

                        {!isCollapsed && (
                          <View style={styles.entryContent}>
                            {/* Text Content */}
                            {entry.content && (
                              <Text style={[styles.entryText, { color: colors.text }]}>
                                {entry.content}
                              </Text>
                            )}

                            {/* Format Blocks (Read-only) */}
                            {entry.entryFormats?.includes(NoteFormat.TASK) && entry.formatData?.tasks && (
                              <View style={[
                                styles.entryFormatBlock,
                                filterFormat === NoteFormat.TASK && styles.highlightedFormatBlock
                              ]}>
                                <Text style={[styles.formatBlockTitle, { color: colors.text }]}>✅ Tasks:</Text>
                                {entry.formatData.tasks.map((task: any) => (
                                  <Text key={task.id} style={[
                                    styles.formatBlockItem,
                                    { color: colors.text },
                                    task.isCompleted && styles.completedItem
                                  ]}>
                                    {task.isCompleted ? '✓' : '□'} {task.description}
                                  </Text>
                                ))}
                              </View>
                            )}

                            {entry.entryFormats?.includes(NoteFormat.PROJECT) && entry.formatData?.projectMilestones && (
                              <View style={[
                                styles.entryFormatBlock,
                                filterFormat === NoteFormat.PROJECT && styles.highlightedFormatBlock
                              ]}>
                                <Text style={[styles.formatBlockTitle, { color: colors.text }]}>🚀 Project:</Text>
                                {entry.formatData.projectMilestones.map((m: any) => (
                                  <Text key={m.id} style={[
                                    styles.formatBlockItem,
                                    { color: colors.text },
                                    m.isCompleted && styles.completedItem
                                  ]}>
                                    {m.isCompleted ? '✓' : '□'} {m.description}
                                  </Text>
                                ))}
                              </View>
                            )}

                            {entry.entryFormats?.includes(NoteFormat.GOAL) && entry.formatData?.goalProgress && (
                              <View style={[
                                styles.entryFormatBlock,
                                filterFormat === NoteFormat.GOAL && styles.highlightedFormatBlock
                              ]}>
                                <Text style={[styles.formatBlockTitle, { color: colors.text }]}>👑 Goal:</Text>
                                <Text style={[styles.formatBlockItem, { color: colors.text }]}>
                                  {entry.formatData.goalProgress.description}
                                </Text>
                                <Text style={[styles.formatBlockItem, { color: colors.textSecondary }]}>
                                  Progress: {entry.formatData.goalProgress.progress}%
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })
            )}
          </ScrollView>

          {/* Add Entry Button */}
          <TouchableOpacity
            style={[styles.addEntryButton, { backgroundColor: colors.accent }]}
            onPress={handleStartEditing}
          >
            <Text style={styles.addEntryText}>[ + Add Entry ]</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Timeline Navigator Modal */}
      <Modal
        visible={showNavigator}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNavigator(false)}
      >
        <View style={[styles.navigatorModal, { backgroundColor: colors.background }]}>
          <View style={[styles.navigatorHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.navigatorTitle, { color: colors.text }]}>
              Jump to Entry
            </Text>
            <TouchableOpacity onPress={() => setShowNavigator(false)}>
              <Text style={[styles.closeText, { color: colors.accent }]}>
                {ICONS.general.close}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.navigatorList}>
            {currentNote.entries.map((entry, index) => {
              const preview = entry.content.substring(0, 80) + (entry.content.length > 80 ? '...' : '');
              const isFirst = index === 0;
              const isLatest = index === currentNote.entries.length - 1;
              const dateLabel = formatDate(entry.timestamp);

              return (
                <TouchableOpacity
                  key={entry.id}
                  style={[styles.navigatorItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => handleJumpToEntry(entry.id)}
                >
                  <View style={styles.navigatorItemHeader}>
                    <Text style={[styles.navigatorDate, { color: colors.textSecondary }]}>
                      {ICONS.general.calendar} {dateLabel}
                    </Text>
                    <Text style={[styles.navigatorTime, { color: colors.textSecondary }]}>
                      {ICONS.general.clock} {formatTime(entry.timestamp)}
                      {entry.isEdited && entry.editedAt && (
                        <Text style={{ opacity: 0.7 }}> • Edited {formatTime(entry.editedAt)}</Text>
                      )}
                    </Text>
                  </View>

                  <Text style={[styles.navigatorPreview, { color: colors.text }]} numberOfLines={2}>
                    {preview}
                  </Text>

                  {(isFirst || isLatest) && (
                    <View style={styles.navigatorBadges}>
                      {isFirst && (
                        <Text style={[styles.navigatorBadge, { color: colors.accent }]}>
                          [ first ]
                        </Text>
                      )}
                      {isLatest && (
                        <Text style={[styles.navigatorBadge, { color: colors.accent }]}>
                          [ latest ]
                        </Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 30,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    width: 60,
    zIndex: 10,
  },
  backText: {
    fontSize: 24,
  },
  appName: {
    ...FONTS.bold,
    fontSize: 32,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 1,
  },
  headerButtons: {
    width: 60,
    alignItems: 'flex-end',
    zIndex: 10,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityControls: {
    flexDirection: 'column',
    gap: SPACING.xs,
    alignItems: 'center',
  },
  prioritySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  priorityLabel: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
    minWidth: 70,
  },
  urgencyButtons: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  urgencyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.4,
  },
  urgencyButtonActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  urgencyEmoji: {
    fontSize: 16,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starIcon: {
    fontSize: 16,
  },
  saveText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.bodyLarge,
  },
  timeline: {
    flex: 1,
  },
  timelineContent: {
    padding: SPACING.md,
  },
  dateGroup: {
    marginBottom: SPACING.md,
  },
  dateHeader: {
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  dateText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
    opacity: 0.6,
  },
  entry: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  entryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  editEntryButton: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
  },
  deleteEntryButton: {
    fontSize: FONT_SIZES.timestamp,
  },
  timeText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
    opacity: 0.6,
  },
  entryText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    lineHeight: FONT_SIZES.body * 1.6,
  },
  entryPreview: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    marginTop: SPACING.xs,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  expandToggle: {
    paddingRight: SPACING.xs,
  },
  expandIcon: {
    fontSize: 14,
  },
  formatEmojis: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.timestamp,
    marginRight: SPACING.sm,
  },
  entryContent: {
    marginTop: SPACING.xs,
  },
  entryFormatBlock: {
    marginTop: SPACING.sm,
    paddingLeft: SPACING.md,
    padding: SPACING.sm,
    borderRadius: 8,
  },
  highlightedFormatBlock: {
    backgroundColor: '#FFD70030',
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  formatBlockTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
    marginBottom: SPACING.xs,
  },
  formatBlockItem: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    marginBottom: 4,
  },
  completedItem: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  deepWorkBadge: {
    marginTop: SPACING.sm,
  },
  deepWorkText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.small,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
    marginBottom: SPACING.sm,
  },
  emptyHint: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.meta,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderTopWidth: 1,
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    fontSize: FONT_SIZES.body,
    paddingVertical: SPACING.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  navigatorModal: {
    flex: 1,
  },
  navigatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  navigatorTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.header,
  },
  closeText: {
    fontSize: 28,
  },
  quickJumpContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
    borderBottomWidth: 1,
  },
  quickJumpButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickJumpText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.small,
  },
  navigatorList: {
    flex: 1,
    padding: SPACING.md,
  },
  navigatorDateHeader: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.meta,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  navigatorItem: {
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  navigatorItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  navigatorDate: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.small,
  },
  navigatorTime: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.small,
  },
  navigatorPreview: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.meta,
    marginTop: SPACING.xs,
    lineHeight: FONT_SIZES.meta * 1.4,
  },
  navigatorBadges: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  navigatorBadge: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.small,
  },
  loadingText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    textAlign: 'center',
    marginTop: 100,
  },
  // EDITING MODE STYLES
  editContainer: {
    flex: 1,
    padding: SPACING.md,
  },
  titleInput: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.header,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    marginBottom: SPACING.md,
  },
  contentInput: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    lineHeight: FONT_SIZES.body * 1.5,
    paddingTop: SPACING.md,
    minHeight: 150,
  },
  entryFormatButtons: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    marginBottom: SPACING.md,
  },
  formatButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  formatButtonEmoji: {
    fontSize: 20,
  },
  formatBlocksContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  // VIEW MODE STYLES
  titleDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  titleText: {
    fontSize: FONT_SIZES.bodyLarge,
    flex: 1,
  },
  titleControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flexWrap: 'wrap',
  },
  entryControls: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  entryFinder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  entryFinderLabel: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
  },
  watchIcon: {
    fontSize: 18,
  },
  orderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  orderToggleLabel: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
  },
  orderToggleText: {
    fontSize: 22,
  },
  addEntryButton: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    margin: SPACING.md,
    borderRadius: 6,
  },
  addEntryText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
    color: '#FFFFFF',
  },
  // TASK STYLES
  tasksSection: {
    borderBottomWidth: 1,
    paddingBottom: SPACING.md,
  },
  taskCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderBottomWidth: 1,
    paddingBottom: SPACING.sm,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: FONT_SIZES.body,
  },
  taskCompletedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  taskTimestamp: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
    marginTop: SPACING.xs,
  },
  taskProgress: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
    marginTop: 2,
  },
  expandIndicator: {
    fontSize: 12,
  },
  taskSteps: {
    marginLeft: 36,
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  stepCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepCheckmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepDescription: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
  },
  stepCompletedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  stepTimestamp: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
    marginTop: 2,
  },
  addStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  addStepInput: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    flex: 1,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderRadius: 4,
  },
  addStepButton: {
    fontSize: 24,
    fontWeight: 'bold',
    width: 32,
    textAlign: 'center',
  },
  deleteTaskButton: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
  },
  deleteTaskText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
    color: '#FF3B30',
  },
  formatToolbar: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  formatLabel: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
    marginBottom: SPACING.sm,
  },
  formatButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  formatButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 44,
    alignItems: 'center',
  },
  formatButtonText: {
    fontSize: 20,
  },
});
