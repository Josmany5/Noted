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
import type { Entry } from '../types';

export const NoteDetailScreen = ({ route, navigation }: any) => {
  const { noteId } = route.params;
  const { currentNote, setCurrentNote, addEntry, updateNote, deleteNote, deleteEntry, isDarkMode } = useStore();
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isEditing, setIsEditing] = useState(true); // Start in edit mode for new notes
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null); // Track which entry is being edited
  const [showNavigator, setShowNavigator] = useState(false);
  const [reverseOrder, setReverseOrder] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

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
      }
    };
    loadNote();

    return () => setCurrentNote(null);
  }, [noteId]);

  useEffect(() => {
    // Scroll to bottom (latest entry) when note loads (if NOT reversed)
    if (!reverseOrder && !isEditing) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [currentNote?.id, reverseOrder, isEditing]);

  const handleSaveEntry = async () => {
    if (!noteContent.trim() || !currentNote) return;

    try {
      // Update title if changed
      if (noteTitle !== currentNote.title) {
        await updateNote(currentNote.id, { title: noteTitle });
      }

      if (editingEntryId) {
        // Editing existing entry - need to implement updateEntry in store
        // For now, we'll add this as a new timestamped entry showing it's an edit
        await addEntry(currentNote.id, noteContent);
        setEditingEntryId(null);
      } else {
        // Add new entry with the content
        await addEntry(currentNote.id, noteContent);
      }

      // Clear content and switch to view mode
      setNoteContent('');
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
    // Load existing entry content for editing
    setIsEditing(true);
    setNoteContent(entry.content);
    setEditingEntryId(entry.id);
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

  const handleJumpToLatest = () => {
    setReverseOrder(false);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleJumpToFirst = () => {
    setReverseOrder(false);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.backText, { color: colors.accent }]}>
              {ICONS.general.back}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.appName, { color: colors.text }]}>Noted.</Text>
        </View>

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
        <View style={styles.editContainer}>
          {/* Title Input */}
          <TextInput
            style={[styles.titleInput, { color: colors.text, borderBottomColor: colors.border }, FONTS.medium]}
            placeholder="Note Title"
            placeholderTextColor={colors.textSecondary}
            value={noteTitle}
            onChangeText={setNoteTitle}
            maxLength={100}
          />

          {/* Content Input - Full Page */}
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
        </View>
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
            {groupedEntries.length > 0 && (
              <View style={styles.titleControls}>
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
                  {displayedEntries.map(entry => (
                    <View key={entry.id} style={styles.entry}>
                      <View style={styles.entryHeader}>
                        <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                          {formatTime(entry.timestamp)}
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

                      <Text style={[styles.entryText, { color: colors.text }]}>
                        {entry.content}
                      </Text>
                    </View>
                  ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  backText: {
    fontSize: 24,
  },
  appName: {
    ...FONTS.bold,
    fontSize: 32,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
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
    flex: 1,
    lineHeight: FONT_SIZES.body * 1.5,
    paddingTop: SPACING.md,
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
});
