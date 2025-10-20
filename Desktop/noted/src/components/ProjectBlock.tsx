import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FONTS, FONT_SIZES, SPACING } from '../theme';
import type { ProjectMilestone } from '../types';

interface ProjectBlockProps {
  milestones: ProjectMilestone[];
  onMilestonesChange: (milestones: ProjectMilestone[]) => void;
  colors: any;
}

export const ProjectBlock: React.FC<ProjectBlockProps> = ({ milestones, onMilestonesChange, colors }) => {
  const [newMilestoneText, setNewMilestoneText] = useState('');

  const handleAddMilestone = () => {
    if (!newMilestoneText.trim()) return;

    const newMilestone: ProjectMilestone = {
      id: `milestone_${Date.now()}`,
      description: newMilestoneText.trim(),
      isCompleted: false,
    };

    onMilestonesChange([...milestones, newMilestone]);
    setNewMilestoneText('');
  };

  const handleToggleMilestone = (milestoneId: string) => {
    onMilestonesChange(milestones.map(m =>
      m.id === milestoneId
        ? { ...m, isCompleted: !m.isCompleted, completedAt: !m.isCompleted ? new Date() : undefined }
        : m
    ));
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    onMilestonesChange(milestones.filter(m => m.id !== milestoneId));
  };

  const completedCount = milestones.filter(m => m.isCompleted).length;
  const totalCount = milestones.length;

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: colors.text }]}>🚀 Project</Text>
        {totalCount > 0 && (
          <Text style={[styles.progress, { color: colors.textSecondary }]}>
            Phase {completedCount}/{totalCount}
          </Text>
        )}
      </View>

      {/* Milestone List */}
      {milestones.map(milestone => (
        <View key={milestone.id} style={styles.milestoneRow}>
          <TouchableOpacity onPress={() => handleToggleMilestone(milestone.id)}>
            <View style={[
              styles.checkbox,
              { borderColor: colors.border },
              milestone.isCompleted && { backgroundColor: colors.accent }
            ]}>
              {milestone.isCompleted && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>

          <Text style={[
            styles.milestoneText,
            { color: colors.text },
            milestone.isCompleted && styles.milestoneCompleted
          ]}>
            {milestone.description}
          </Text>

          <TouchableOpacity onPress={() => handleDeleteMilestone(milestone.id)}>
            <Text style={styles.deleteButton}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Add Milestone Input */}
      <View style={styles.addMilestoneRow}>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholder="Add milestone..."
          placeholderTextColor={colors.textSecondary}
          value={newMilestoneText}
          onChangeText={setNewMilestoneText}
          onSubmitEditing={handleAddMilestone}
        />
        <TouchableOpacity onPress={handleAddMilestone} disabled={!newMilestoneText.trim()}>
          <Text style={[styles.addButton, { color: newMilestoneText.trim() ? colors.accent : colors.textSecondary }]}>
            +
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  headerText: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
  },
  progress: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  milestoneText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    flex: 1,
  },
  milestoneCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  deleteButton: {
    color: '#FF3B30',
    fontSize: 18,
    padding: SPACING.xs,
  },
  addMilestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  input: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    flex: 1,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderRadius: 4,
  },
  addButton: {
    fontSize: 24,
    fontWeight: 'bold',
    width: 32,
    textAlign: 'center',
  },
});
