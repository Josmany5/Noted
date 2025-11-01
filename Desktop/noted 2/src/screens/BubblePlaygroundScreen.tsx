import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, PanResponder, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Bubble } from '../components/Bubble';
import { SAMPLE_BUBBLES } from '../data/sampleBubbles';
import { Bubble as BubbleType } from '../types/bubble';
import { FONTS, FONT_SIZES, SPACING } from '../theme';
import { useTheme } from '../store/useTheme';

type ViewMode = 'list' | 'grid';

export const BubblePlaygroundScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [bubbles, setBubbles] = useState<BubbleType[]>(SAMPLE_BUBBLES);
  const [expandedBubbleId, setExpandedBubbleId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const handleBubblePress = (bubble: BubbleType) => {
    setExpandedBubbleId(expandedBubbleId === bubble.id ? null : bubble.id);
  };

  const handleExpand = (bubble: BubbleType) => {
    Alert.alert(
      `${bubble.emoji} ${bubble.title}`,
      `This would open the full detail view for this ${bubble.type} bubble.\n\nType: ${bubble.type}\nCreated: ${new Date(bubble.createdAt).toLocaleDateString()}\nConnections: ${bubble.connections.length}\nChild Bubbles: ${bubble.childBubbleIds.length}`,
      [{ text: 'OK' }]
    );
  };

  const handleConnect = (bubble: BubbleType) => {
    Alert.alert(
      '🔗 Connect Bubbles',
      `This would allow you to create a connection from "${bubble.title}" to another bubble.\n\nConnection types:\n• Inspired by 💡\n• Depends on 🔗\n• Part of 🧩\n• Related to ↔️\n• Blocks 🚧\n• References 📎`,
      [{ text: 'OK' }]
    );
  };

  const handleTransform = (bubble: BubbleType) => {
    Alert.alert(
      '🔄 Transform Bubble',
      `This would transform "${bubble.title}" from a ${bubble.type} bubble to another type.\n\nFor example:\n• Note → Task (when you want to take action)\n• Task → Project (when it grows bigger)\n• Project → Goal (when you complete it and want to track achievement)`,
      [{ text: 'OK' }]
    );
  };

  const handleCreateBubble = () => {
    Alert.alert(
      '➕ Create New Bubble',
      'This would open a creation flow where you can:\n\n1. Choose a bubble type (note, task, project, etc.)\n2. Add a title and emoji\n3. Fill in type-specific details\n4. Position it in the universe\n5. Connect it to other bubbles',
      [{ text: 'OK' }]
    );
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'grid' : 'list');
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newBubbles = [...bubbles];
    const [movedBubble] = newBubbles.splice(fromIndex, 1);
    newBubbles.splice(toIndex, 0, movedBubble);
    setBubbles(newBubbles);
  };

  const handleLongPress = (index: number) => {
    setDraggingIndex(index);
    Alert.alert(
      '🫧 Reorder Bubble',
      `Long press to drag "${bubbles[index].title}" to reorder.\n\nTip: Tap the ↑ or ↓ buttons to move this bubble up or down in the list.`,
      [
        {
          text: 'Move Up',
          onPress: () => {
            if (index > 0) {
              handleReorder(index, index - 1);
            }
            setDraggingIndex(null);
          },
        },
        {
          text: 'Move Down',
          onPress: () => {
            if (index < bubbles.length - 1) {
              handleReorder(index, index + 1);
            }
            setDraggingIndex(null);
          },
        },
        {
          text: 'Cancel',
          onPress: () => setDraggingIndex(null),
          style: 'cancel',
        },
      ]
    );
  };

  const renderBubble = (bubble: BubbleType, index: number) => (
    <TouchableOpacity
      key={bubble.id}
      style={viewMode === 'grid' && styles.gridItem}
      onLongPress={() => handleLongPress(index)}
      delayLongPress={500}
    >
      <Bubble
        bubble={bubble}
        onPress={handleBubblePress}
        onExpand={handleExpand}
        onConnect={handleConnect}
        onTransform={handleTransform}
        isExpanded={expandedBubbleId === bubble.id}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.accent }]}>← Home</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>🫧 Bubble Playground</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: colors.surfaceVariant }]}>
        <Text style={[styles.infoBannerText, { color: colors.text }]}>
          🎨 This is a prototype space to explore bubbles - the core building blocks of NOTED.
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.accent }]}
          onPress={handleCreateBubble}
        >
          <Text style={styles.controlButtonText}>➕ Create Bubble</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
          onPress={toggleViewMode}
        >
          <Text style={[styles.controlButtonTextAlt, { color: colors.text }]}>
            {viewMode === 'list' ? '⊞ Grid' : '☰ List'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bubbles Display */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          viewMode === 'grid' && styles.gridContainer,
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Sample Bubbles ({bubbles.length})
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Tap to expand • Long press to reorder
        </Text>

        {viewMode === 'list' ? (
          <View style={styles.listContainer}>
            {bubbles.map((bubble, index) => renderBubble(bubble, index))}
          </View>
        ) : (
          <View style={styles.gridView}>
            {bubbles.map((bubble, index) => renderBubble(bubble, index))}
          </View>
        )}

        {/* Feature Info */}
        <View style={[styles.featureInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.featureInfoTitle, { color: colors.text }]}>
            🌟 What are Bubbles?
          </Text>
          <Text style={[styles.featureInfoText, { color: colors.textSecondary }]}>
            Bubbles are polymorphic containers that can represent any type of content:
            notes, tasks, projects, goals, journals, ideas, documents, and more.
          </Text>
          <Text style={[styles.featureInfoText, { color: colors.textSecondary }]}>
            Key features:{'\n'}
            • 🔗 Connect bubbles to show relationships{'\n'}
            • 🫧 Nest bubbles inside other bubbles{'\n'}
            • 🔄 Transform between types as needs evolve{'\n'}
            • 📍 Position in 2D space (Universe View){'\n'}
            • ⏳ View evolution over time (Timeline View)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  backButton: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  headerTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.title,
    flex: 1,
    textAlign: 'center',
  },
  infoBanner: {
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: 8,
  },
  infoBannerText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.small,
    textAlign: 'center',
    lineHeight: FONT_SIZES.small * 1.4,
  },
  controls: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  controlButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  controlButtonText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
    color: '#FFFFFF',
  },
  controlButtonTextAlt: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.body,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.subtitle,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.small,
    marginBottom: SPACING.lg,
  },
  listContainer: {
    gap: SPACING.md,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridView: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  gridItem: {
    width: '48%',
    minWidth: 150, // Ensure minimum size
    maxWidth: 400, // Limit width on web so it doesn't get too wide
  },
  featureInfo: {
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: 12,
    borderWidth: 1,
  },
  featureInfoTitle: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.subtitle,
    marginBottom: SPACING.sm,
  },
  featureInfoText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    lineHeight: FONT_SIZES.body * 1.5,
    marginBottom: SPACING.sm,
  },
});
