import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FONTS, FONT_SIZES, SPACING } from '../theme';
import type { Task } from '../types';

interface TaskBlockProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  colors: any;
}

export const TaskBlock: React.FC<TaskBlockProps> = ({ tasks, onTasksChange, colors }) => {
  const [newTaskText, setNewTaskText] = useState('');

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;

    const newTask: Task = {
      id: `task_${Date.now()}`,
      description: newTaskText.trim(),
      isCompleted: false,
      createdAt: new Date(),
      steps: [],
    };

    onTasksChange([...tasks, newTask]);
    setNewTaskText('');
  };

  const handleToggleTask = (taskId: string) => {
    onTasksChange(tasks.map(task =>
      task.id === taskId
        ? { ...task, isCompleted: !task.isCompleted, completedAt: !task.isCompleted ? new Date() : undefined }
        : task
    ));
  };

  const handleDeleteTask = (taskId: string) => {
    onTasksChange(tasks.filter(t => t.id !== taskId));
  };

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: colors.text }]}>✅ Tasks</Text>
      </View>

      {/* Task List */}
      {tasks.map(task => (
        <View key={task.id} style={styles.taskRow}>
          <TouchableOpacity onPress={() => handleToggleTask(task.id)}>
            <View style={[
              styles.checkbox,
              { borderColor: colors.border },
              task.isCompleted && { backgroundColor: colors.accent }
            ]}>
              {task.isCompleted && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>

          <Text style={[
            styles.taskText,
            { color: colors.text },
            task.isCompleted && styles.taskCompleted
          ]}>
            {task.description}
          </Text>

          <TouchableOpacity onPress={() => handleDeleteTask(task.id)}>
            <Text style={styles.deleteButton}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Add Task Input */}
      <View style={styles.addTaskRow}>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholder="Add task..."
          placeholderTextColor={colors.textSecondary}
          value={newTaskText}
          onChangeText={setNewTaskText}
          onSubmitEditing={handleAddTask}
        />
        <TouchableOpacity onPress={handleAddTask} disabled={!newTaskText.trim()}>
          <Text style={[styles.addButton, { color: newTaskText.trim() ? colors.accent : colors.textSecondary }]}>
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
    marginBottom: SPACING.sm,
  },
  headerText: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
  },
  taskRow: {
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
  taskText: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    flex: 1,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  deleteButton: {
    color: '#FF3B30',
    fontSize: 18,
    padding: SPACING.xs,
  },
  addTaskRow: {
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
