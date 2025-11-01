# NOTED - Multi-Format Entry System Implementation
## Handoff Document - Session Continuation

**Date**: October 20, 2025
**Status**: Foundation Complete, UI Implementation Needed
**App Running**: http://localhost:8081
**Token Usage**: ~134k/200k used

---

## 🎯 PROJECT VISION

Transform Noted into a flexible multi-format entry system where:
- **Notes are containers** with titles, hashtags, and a primary format
- **Entries can have multiple formats** mixed together in one entry
- Formats add specialized UI blocks (tasks, projects, goals, etc.)
- Text can flow freely between format blocks

### Example Entry:
```
Meeting notes here...

✅ Tasks:
  □ Follow up with Sarah
  □ Review budget

More text...

🚀 Project Timeline:
  Phase 2/5 - Website Launch
  □ Design mockups

Final thoughts...

👑 Goal:
  Increase revenue by 20% [███████░░░] 70%
```

---

## ✅ COMPLETED IN THIS SESSION

### 1. Type System Updated ✅
**File**: `/Users/josmanyjuvier/Desktop/noted/src/types/index.ts`

**Changes Made**:
- ✅ Added `entryFormats: NoteFormat[]` to Entry interface (line 103)
- ✅ Added `formatData?: EntryFormatData` to Entry interface (line 104)
- ✅ Created `EntryFormatData` interface (lines 123-129)
- ✅ Created `ProjectMilestone` interface (lines 132-137)
- ✅ Created `GoalData` interface (lines 140-145)
- ✅ Kept `noteFormat: NoteFormat` on Note interface (line 72) for left emoji

**What This Means**:
- Notes still have a `noteFormat` (primary type, shown as left emoji)
- Each entry now has `entryFormats: NoteFormat[]` array
- One entry can have multiple formats: [NOTE, TASK, GOAL, PROJECT]
- formatData stores the actual content for each format type

### 2. Database Layer Updated ✅
**File**: `/Users/josmanyjuvier/Desktop/noted/src/services/webDatabase.ts`

**Changes Made** (lines 76-77):
```typescript
entryFormats: entry.entryFormats || [NoteFormat.NOTE], // Backwards compatibility
formatData: entry.formatData || {}, // Backwards compatibility
```

**What This Does**:
- Existing entries without formats default to `[NoteFormat.NOTE]`
- Existing entries without formatData get empty object `{}`
- No data loss - all old entries will continue working

### 3. Store Method Updated ✅
**File**: `/Users/josmanyjuvier/Desktop/noted/src/store/index.ts`

**Changes Made** (lines 192-198):
```typescript
addEntry: async (noteId: string, content: string, entryFormats?: NoteFormat[], formatData?: any) => {
  const entry = {
    timestamp: new Date(),
    content,
    entryFormats: entryFormats || [NoteFormat.NOTE], // Default to NOTE format
    formatData: formatData || {}, // Empty format data by default
    // ... rest of entry
  };
```

**What This Does**:
- addEntry now accepts optional entryFormats and formatData parameters
- Defaults to NOTE format if not provided
- Backwards compatible with existing code

---

## 🔄 WHAT NEEDS TO BE DONE NEXT

### Priority 1: HomeScreen Blue Button ⚡ CRITICAL
**File**: `/Users/josmanyjuvier/Desktop/noted/src/screens/HomeScreen.tsx`

**Current State** (WRONG):
- Blue + button shows modal with "Create New: Note | Task | Project..."
- Clicking options tries to create different entity types

**What To Do**:
1. **Remove the entire Plus Menu Modal** (lines 1032-1096):
   - Delete `showPlusMenu` state
   - Delete entire `<Modal>` component for plus menu

2. **Update handleCreateNote** function:
```typescript
const handleCreateNote = async () => {
  try {
    const id = await createNote('New Note');
    navigation.navigate('NoteDetail', { noteId: id });
  } catch (error) {
    console.error('Failed to create note:', error);
  }
};
```

3. **Update Blue + Button** (around line 1050):
```typescript
<TouchableOpacity
  style={[styles.createButton, { backgroundColor: colors.accent }]}
  onPress={handleCreateNote}  // Direct call, no menu
  activeOpacity={0.8}
>
  <Text style={styles.createButtonText}>{ICONS.general.add}</Text>
</TouchableOpacity>
```

**Result**: Blue + button directly creates note and opens NoteDetailScreen

---

### Priority 2: NoteDetailScreen Entry Editor 🎨 UI REDESIGN

**File**: `/Users/josmanyjuvier/Desktop/noted/src/screens/NoteDetailScreen.tsx`

This is the BIG ONE. Complete redesign of how entries are created/edited.

#### Current State (WRONG):
- Note-level format toolbar (lines 556-583) - formats the whole note
- Text input with save button
- No way to add multiple formats to one entry

#### What To Build:

**A. Entry Editor Layout**:
```
┌─────────────────────────────────────────┐
│ Format Buttons (Top):                   │
│ [📝] [✅] [🚀] [👑] [📔] [📚]           │
│ (Selected formats highlighted)          │
├─────────────────────────────────────────┤
│ Text Input Area:                        │
│ [Multiline text input - full height]   │
│                                         │
│ <<< Format blocks inserted here >>>    │
│                                         │
└─────────────────────────────────────────┘
```

**B. Implementation Steps**:

1. **Add State for Active Formats**:
```typescript
const [activeFormats, setActiveFormats] = useState<NoteFormat[]>([NoteFormat.NOTE]);
const [currentFormatData, setCurrentFormatData] = useState<any>({});
```

2. **Replace Note-Level Format Toolbar** (delete lines 556-583):
Remove the current toolbar that formats the whole note.

3. **Add Format Buttons to Entry Editor**:
```typescript
{isEditing && (
  <View style={styles.entryFormatButtons}>
    {Object.entries(FORMAT_EMOJIS).map(([format, emoji]) => {
      const formatKey = format as NoteFormat;
      const isActive = activeFormats.includes(formatKey);
      return (
        <TouchableOpacity
          key={format}
          style={[
            styles.formatButton,
            isActive && { backgroundColor: colors.accent }
          ]}
          onPress={() => handleToggleFormat(formatKey)}
        >
          <Text style={[
            styles.formatButtonEmoji,
            isActive && { color: '#FFFFFF' }
          ]}>{emoji}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
)}
```

4. **Add Format Toggle Handler**:
```typescript
const handleToggleFormat = (format: NoteFormat) => {
  setActiveFormats(prev => {
    if (prev.includes(format)) {
      // Remove format
      return prev.filter(f => f !== format);
    } else {
      // Add format
      return [...prev, format];
    }
  });
};
```

5. **Render Format Blocks Based on Active Formats**:
```typescript
{isEditing && (
  <View style={styles.formatBlocksContainer}>
    {activeFormats.includes(NoteFormat.TASK) && (
      <TaskBlock
        tasks={currentFormatData.tasks || []}
        onTasksChange={(tasks) => {
          setCurrentFormatData({...currentFormatData, tasks});
        }}
      />
    )}

    {activeFormats.includes(NoteFormat.PROJECT) && (
      <ProjectBlock
        milestones={currentFormatData.projectMilestones || []}
        onMilestonesChange={(milestones) => {
          setCurrentFormatData({...currentFormatData, projectMilestones: milestones});
        }}
      />
    )}

    {activeFormats.includes(NoteFormat.GOAL) && (
      <GoalBlock
        goalData={currentFormatData.goalProgress || {description: '', progress: 0}}
        onGoalChange={(goalData) => {
          setCurrentFormatData({...currentFormatData, goalProgress: goalData});
        }}
      />
    )}
  </View>
)}
```

6. **Update Save Handler** to pass formats:
```typescript
const handleSaveEntry = async () => {
  if (!noteContent.trim() && activeFormats.length === 1) return; // Allow save if has formats

  try {
    // ... existing title update code ...

    if (editingEntryId) {
      await updateEntry(currentNote.id, editingEntryId, noteContent);
    } else {
      // NEW: Pass formats and formatData
      await addEntry(
        currentNote.id,
        noteContent,
        activeFormats,
        currentFormatData
      );
    }

    // Reset state
    setNoteContent('');
    setActiveFormats([NoteFormat.NOTE]);
    setCurrentFormatData({});
    setIsEditing(false);

    // Reload note...
  }
};
```

---

### Priority 3: Create Format Block Components 🧩

Create these new component files:

#### A. TaskBlock Component
**File**: `/Users/josmanyjuvier/Desktop/noted/src/components/TaskBlock.tsx`

```typescript
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
```

#### B. ProjectBlock Component
**File**: `/Users/josmanyjuvier/Desktop/noted/src/components/ProjectBlock.tsx`

```typescript
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
```

#### C. GoalBlock Component
**File**: `/Users/josmanyjuvier/Desktop/noted/src/components/GoalBlock.tsx`

```typescript
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FONTS, FONT_SIZES, SPACING } from '../theme';
import type { GoalData } from '../types';

interface GoalBlockProps {
  goalData: GoalData;
  onGoalChange: (goalData: GoalData) => void;
  colors: any;
}

export const GoalBlock: React.FC<GoalBlockProps> = ({ goalData, onGoalChange, colors }) => {
  const handleProgressChange = (delta: number) => {
    const newProgress = Math.max(0, Math.min(100, goalData.progress + delta));
    onGoalChange({ ...goalData, progress: newProgress });
  };

  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: colors.text }]}>👑 Goal</Text>
      </View>

      {/* Goal Description */}
      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        placeholder="What's your goal?"
        placeholderTextColor={colors.textSecondary}
        value={goalData.description}
        onChangeText={(text) => onGoalChange({ ...goalData, description: text })}
      />

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Progress:</Text>

        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[
            styles.progressFill,
            { width: `${goalData.progress}%`, backgroundColor: colors.accent }
          ]} />
        </View>

        <Text style={[styles.progressText, { color: colors.text }]}>{goalData.progress}%</Text>
      </View>

      {/* Progress Controls */}
      <View style={styles.progressControls}>
        <TouchableOpacity
          style={[styles.progressButton, { borderColor: colors.border }]}
          onPress={() => handleProgressChange(-10)}
        >
          <Text style={[styles.progressButtonText, { color: colors.text }]}>-10%</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.progressButton, { borderColor: colors.border }]}
          onPress={() => handleProgressChange(-5)}
        >
          <Text style={[styles.progressButtonText, { color: colors.text }]}>-5%</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.progressButton, { borderColor: colors.border }]}
          onPress={() => handleProgressChange(5)}
        >
          <Text style={[styles.progressButtonText, { color: colors.text }]}>+5%</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.progressButton, { borderColor: colors.border }]}
          onPress={() => handleProgressChange(10)}
        >
          <Text style={[styles.progressButtonText, { color: colors.text }]}>+10%</Text>
        </TouchableOpacity>
      </View>

      {/* Target */}
      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        placeholder="Target (optional)"
        placeholderTextColor={colors.textSecondary}
        value={goalData.target}
        onChangeText={(text) => onGoalChange({ ...goalData, target: text })}
      />
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
  input: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.body,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: SPACING.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginVertical: SPACING.sm,
  },
  progressLabel: {
    ...FONTS.regular,
    fontSize: FONT_SIZES.timestamp,
  },
  progressBar: {
    flex: 1,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 10,
  },
  progressText: {
    ...FONTS.bold,
    fontSize: FONT_SIZES.body,
    minWidth: 45,
    textAlign: 'right',
  },
  progressControls: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  progressButton: {
    flex: 1,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
  },
  progressButtonText: {
    ...FONTS.medium,
    fontSize: FONT_SIZES.timestamp,
  },
});
```

---

### Priority 4: Entry Display in Timeline 📋

**File**: `/Users/josmanyjuvier/Desktop/noted/src/screens/NoteDetailScreen.tsx`

Update how entries are displayed in the timeline to show their formats:

1. **Add Collapse/Expand State**:
```typescript
const [collapsedEntries, setCollapsedEntries] = useState<{ [entryId: string]: boolean }>({});
```

2. **Update Entry Rendering** (around lines 579-610):
```typescript
{displayedEntries.map(entry => {
  const isCollapsed = collapsedEntries[entry.id] || false;
  const formatEmojis = entry.entryFormats.map(f => FORMAT_EMOJIS[f]).join('');

  return (
    <View key={entry.id} style={styles.entry}>
      <View style={styles.entryHeader}>
        <TouchableOpacity onPress={() => {
          setCollapsedEntries(prev => ({
            ...prev,
            [entry.id]: !isCollapsed
          }));
        }}>
          <Text style={[styles.expandIcon, { color: colors.textSecondary }]}>
            {isCollapsed ? '▶' : '▼'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.formatEmojis, { color: colors.text }]}>
          [{formatEmojis}]
        </Text>

        <Text style={[styles.timeText, { color: colors.textSecondary }]}>
          {formatTime(entry.timestamp)}
        </Text>

        <View style={styles.entryActions}>
          <TouchableOpacity onPress={() => handleEditEntry(entry)}>
            <Text style={[styles.editEntryButton, { color: colors.accent }]}>edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteEntry(entry.id)}>
            <Text style={[styles.deleteEntryButton, { color: '#FF3B30' }]}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!isCollapsed && (
        <View style={styles.entryContent}>
          {/* Text Content */}
          {entry.content && (
            <Text style={[styles.entryText, { color: colors.text }]}>
              {entry.content}
            </Text>
          )}

          {/* Format Blocks (Read-only) */}
          {entry.entryFormats.includes(NoteFormat.TASK) && entry.formatData?.tasks && (
            <View style={styles.entryFormatBlock}>
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

          {entry.entryFormats.includes(NoteFormat.PROJECT) && entry.formatData?.projectMilestones && (
            <View style={styles.entryFormatBlock}>
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

          {entry.entryFormats.includes(NoteFormat.GOAL) && entry.formatData?.goalProgress && (
            <View style={styles.entryFormatBlock}>
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
```

3. **Add New Styles**:
```typescript
expandIcon: {
  fontSize: 14,
  marginRight: SPACING.xs,
},
formatEmojis: {
  ...FONTS.bold,
  fontSize: FONT_SIZES.timestamp,
  marginRight: SPACING.sm,
},
entryFormatBlock: {
  marginTop: SPACING.sm,
  paddingLeft: SPACING.md,
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
```

---

## 🧪 TESTING CHECKLIST

After implementing the above:

### Basic Flow Test:
1. ✅ Click blue + button → Opens NoteDetailScreen with empty note
2. ✅ See format buttons at top (📝 ✅ 🚀 👑 📔 📚)
3. ✅ Click ✅ button → TaskBlock appears
4. ✅ Add a task → Task shows with checkbox
5. ✅ Type some text in main content area
6. ✅ Click 🚀 button → ProjectBlock appears
7. ✅ Add a milestone → Milestone shows
8. ✅ Click Save → Entry appears in timeline
9. ✅ Entry shows format emojis: [📝✅🚀]
10. ✅ Entry displays text + tasks + project milestones

### Multi-Format Test:
1. ✅ Create entry with all 6 formats
2. ✅ Verify each format block renders
3. ✅ Verify data saves correctly
4. ✅ Verify entry displays all formats in timeline

### Collapse/Expand Test:
1. ✅ Click ▼ on entry → Entry collapses
2. ✅ Only shows header with emojis and timestamp
3. ✅ Click ▶ → Entry expands
4. ✅ Shows all content and format blocks

### Note Title Emoji Test:
1. ✅ Create note as TASK format → Left emoji is ✅
2. ✅ Add entry with PROJECT format → Right emoji shows 🚀
3. ✅ Note title shows: `✅ Note Title 🚀`

---

## 🚨 KNOWN ISSUES TO FIX

### Issue 1: Migration Cleanup
**Location**: `/Users/josmanyjuvier/Desktop/noted/src/services/webDatabase.ts` (lines 494-549)

**Problem**: Migration method `migrateStandaloneTasksToNotes()` is still there but may not be needed now

**Solution**: Either remove it or update it to convert standalone tasks to notes with task-format entries

### Issue 2: Home Screen Format Filter
**Location**: `/Users/josmanyjuvier/Desktop/noted/src/screens/HomeScreen.tsx` (lines 796-841)

**Problem**: Format filter checks note.noteFormat, but should check if any entries have that format

**Fix**:
```typescript
const count = notes.filter(n =>
  n.entries.some(e => e.entryFormats.includes(formatKey))
).length;
```

### Issue 3: Store Method Signatures
**Location**: `/Users/josmanyjuvier/Desktop/noted/src/store/index.ts`

**Problem**: updateEntry doesn't support entryFormats/formatData yet

**Solution**: Add optional parameters to updateEntry method

---

## 📁 PROJECT STRUCTURE

```
/Users/josmanyjuvier/Desktop/noted/
├── src/
│   ├── components/               # NEW! Format block components
│   │   ├── TaskBlock.tsx        # ✅ To create
│   │   ├── ProjectBlock.tsx     # 🚀 To create
│   │   ├── GoalBlock.tsx        # 👑 To create
│   │   ├── JournalBlock.tsx     # 📔 To create (later)
│   │   └── LibraryBlock.tsx     # 📚 To create (later)
│   ├── screens/
│   │   ├── HomeScreen.tsx       # ⚠️ Blue button needs update
│   │   └── NoteDetailScreen.tsx # 🎨 Major redesign needed
│   ├── services/
│   │   ├── webDatabase.ts       # ✅ Updated
│   │   └── database.ts          # ⚠️ Needs similar updates (SQLite)
│   ├── store/
│   │   └── index.ts             # ✅ Partially updated
│   ├── types/
│   │   └── index.ts             # ✅ Fully updated
│   └── theme/
│       └── index.ts             # (No changes needed)
└── HANDOFF.md                   # 📄 This file
```

---

## 💡 IMPLEMENTATION TIPS

### Tip 1: Start Small
Don't try to implement all formats at once. Start with:
1. Blue button fix
2. Add TaskBlock component
3. Test TaskBlock in entry editor
4. Then add ProjectBlock, GoalBlock, etc.

### Tip 2: Import Components
When you create the format block components, import them in NoteDetailScreen:
```typescript
import { TaskBlock } from '../components/TaskBlock';
import { ProjectBlock } from '../components/ProjectBlock';
import { GoalBlock } from '../components/GoalBlock';
```

### Tip 3: Get Colors
All format block components need `colors` prop. Get it from:
```typescript
const colors = getThemedColors(isDarkMode);
```
Then pass to components:
```typescript
<TaskBlock colors={colors} ... />
```

### Tip 4: Type Imports
Make sure to import the new types:
```typescript
import { EntryFormatData, ProjectMilestone, GoalData } from '../types';
```

### Tip 5: Test as You Go
After each change, refresh the app and test:
- Check browser console for errors
- Verify data saves correctly
- Verify UI renders properly

---

## 🎯 SUCCESS CRITERIA

You'll know you're done when:

1. ✅ Blue + button creates note instantly (no menu)
2. ✅ Entry editor shows format buttons at top
3. ✅ Clicking format buttons adds/removes format blocks
4. ✅ Can add text + tasks + projects + goals in one entry
5. ✅ Entry saves with all formats and data
6. ✅ Timeline shows entries with format emojis
7. ✅ Can collapse/expand entries
8. ✅ Note title shows primary emoji (left) + other formats (right)
9. ✅ Format filter on home screen works correctly
10. ✅ All existing notes still work (backwards compatibility)

---

## 🔗 QUICK REFERENCE

### Key Files Modified:
- ✅ `/Users/josmanyjuvier/Desktop/noted/src/types/index.ts`
- ✅ `/Users/josmanyjuvier/Desktop/noted/src/services/webDatabase.ts`
- ✅ `/Users/josmanyjuvier/Desktop/noted/src/store/index.ts`

### Key Files To Modify:
- ⚠️ `/Users/josmanyjuvier/Desktop/noted/src/screens/HomeScreen.tsx`
- ⚠️ `/Users/josmanyjuvier/Desktop/noted/src/screens/NoteDetailScreen.tsx`

### Files To Create:
- 🆕 `/Users/josmanyjuvier/Desktop/noted/src/components/TaskBlock.tsx`
- 🆕 `/Users/josmanyjuvier/Desktop/noted/src/components/ProjectBlock.tsx`
- 🆕 `/Users/josmanyjuvier/Desktop/noted/src/components/GoalBlock.tsx`

### App Status:
- 🟢 Running at http://localhost:8081
- 🟢 Database has backwards compatibility
- 🟢 Types are fully updated
- 🟡 UI needs redesign
- 🟡 Components need creation

---

## 📞 NEXT SESSION START

When you start the next session, tell Claude:

> "Read /Users/josmanyjuvier/Desktop/noted/HANDOFF.md and continue implementing the multi-format entry system. Start with Priority 1 (HomeScreen blue button) and work through each priority in order."

That's it! The new Claude instance will read this document and pick up exactly where we left off.

---

**Good luck! You've got a solid foundation and a clear path forward. 🚀**
