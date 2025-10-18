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
} from 'react-native';
import { useStore } from '../store';
import { COLORS, FONTS, FONT_SIZES, SPACING, ICONS, getThemedColors, getUrgencyColor } from '../theme';
import { formatRelativeTime, sortNotesByUrgencyAndImportance } from '../utils';
import type { Note } from '../types';

export const HomeScreen = ({ navigation }: any) => {
  const {
    notes,
    loadNotes,
    createNote,
    deleteNote,
    isDarkMode,
    searchQuery,
    setSearchQuery,
  } = useStore();

  const [sortedNotes, setSortedNotes] = useState<Note[]>([]);

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    // Sort and filter notes
    const filtered = notes.filter(note =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSortedNotes(sortNotesByUrgencyAndImportance(filtered));
  }, [notes, searchQuery]);

  const colors = getThemedColors(isDarkMode);

  const handleCreateNote = async () => {
    try {
      const id = await createNote('New Note');
      navigation.navigate('NoteDetail', { noteId: id });
    } catch (error) {
      console.error('Failed to create note:', error);
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

  const renderNoteCard = ({ item }: { item: Note }) => {
    const lastEntry = item.entries[item.entries.length - 1];
    const urgencyColor = getUrgencyColor(item.urgency);

    return (
      <TouchableOpacity
        style={[styles.noteCard, { borderBottomColor: colors.border }]}
        onPress={() => navigation.navigate('NoteDetail', { noteId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.noteHeader}>
          <Text style={[styles.noteTitle, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <TouchableOpacity
            onPress={(e) => handleDeleteNote(item.id, e)}
            style={styles.deleteButton}
          >
            <Text style={[styles.deleteButtonText, { color: '#FF3B30' }]}>
              🗑️
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.noteMeta}>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {formatRelativeTime(item.lastModified)} · {item.entries.length} {item.entries.length === 1 ? 'entry' : 'entries'}
          </Text>
        </View>

        {/* Hashtags */}
        {item.hashtags.length > 0 && (
          <View style={styles.hashtags}>
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
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Noted.
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

      {/* Notes List */}
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

      {/* Create Button */}
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.accent }]}
        onPress={handleCreateNote}
        activeOpacity={0.8}
      >
        <Text style={styles.createButtonText}>{ICONS.general.add}</Text>
      </TouchableOpacity>
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
  },
  headerTitle: {
    ...FONTS.bold,
    fontSize: 32,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  noteTitle: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.bodyLarge,
    flex: 1,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  noteMeta: {
    marginBottom: SPACING.xs,
  },
  metaText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
    opacity: 0.6,
  },
  hashtags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  hashtag: {
    ...FONTS.regular,
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
});
