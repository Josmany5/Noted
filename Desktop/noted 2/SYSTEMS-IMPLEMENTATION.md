# PROSE - Hierarchical Systems Implementation
## Session Handoff Document

**Date**: January 2025
**Status**: Foundation Complete - Database & Registry Ready
**Next Step**: Create Screen Components

---

## 🎯 PROJECT VISION

Transform PROSE into a hierarchical note organization system with:
- **Systems Hub** - Central page showing active systems + library of 30+ predefined systems
- **Apple Notes-style navigation** - Back button hierarchy (not tabs)
- **Folder-based & Visual systems** - PARA folders, Ikigai canvas, Eisenhower matrix, etc.
- **Cross-system intelligence** - Notes can appear in multiple systems based on their formats

### Navigation Flow:
```
Systems View (ROOT)
    ↓ [📁 Folders] button OR tap system card
All Folders View (tree with inline expansion)
    ↓ [📝 Notes] button
All Notes View (flat list, most recent first)
    ↓ [← Folders] back button
All Folders View
    ↓ [← Systems] back button
Systems View
```

---

## ✅ COMPLETED IN THIS SESSION

### 1. Systems Registry Service ✅
**File**: `/Users/josmanyjuvier/Desktop/noted 2/src/services/systemsRegistry.ts`

**Created comprehensive registry with 15 predefined systems:**

**Management Systems:**
- PARA (Projects/Areas/Resources/Archives)
- PALA (Projects/Areas/Life/Archives)
- GTD (Getting Things Done)
- Zettelkasten (Slip-box method)
- Johnny Decimal (Numerical organization)

**Purpose Systems:**
- Ikigai (Japanese life purpose - 4 circles canvas)
- Life Wheel (8 life areas balance)

**Analysis Systems:**
- Eisenhower Matrix (Urgent/Important quadrants)
- SWOT Analysis (Strengths/Weaknesses/Opportunities/Threats)

**Functional Systems:**
- Planner (Calendar, tasks, events)
- Tracker (Metrics, habits, progress)
- Journal (Personal diary)
- Logbook (Professional work log)

**Each system includes:**
- Type (folder/canvas/matrix/timeline/table)
- Category (management/purpose/analysis/functional)
- Full description & "Learn More" content
- Template structure (folder definitions for folder-based systems, zone layouts for visual systems)

**Helper Functions:**
```typescript
getSystemById(id: string): SystemDefinition | undefined
getSystemsByCategory(category: SystemCategory): SystemDefinition[]
getAllSystems(): SystemDefinition[]
getSystemCategories(): SystemCategory[]
```

---

### 2. Database Schema Updates ✅
**File**: `/Users/josmanyjuvier/Desktop/noted 2/src/services/database.ts`

**Added new `systems` table:**
```sql
CREATE TABLE systems (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  isActive INTEGER DEFAULT 0,
  activatedAt INTEGER,
  config TEXT
);
```

**Updated `notes` table:**
- Added `systemIds TEXT DEFAULT '[]'` - JSON array of system IDs the note belongs to

**Updated `folders` table:**
- Added `systemId TEXT` - Which system this folder belongs to

**These changes enable:**
- Track which systems are active
- Link folders to their parent system
- Allow notes to appear in multiple systems (cross-system intelligence)

---

## 📋 NEXT STEPS (Remaining Implementation)

### Phase 1: Core Screen Components (Week 1)

#### 1. SystemsScreen Component ⚡ PRIORITY 1
**File to create**: `/Users/josmanyjuvier/Desktop/noted 2/src/screens/SystemsScreen.tsx`

**Layout:**
```
┌────────────────────────────────────────┐
│  PROSE                                 │
│  [📁 Folders]                          │
├────────────────────────────────────────┤
│                                        │
│  🎯 ACTIVE SYSTEMS                     │
│  ┌────────┐ ┌────────┐ ┌────────┐     │
│  │📂 PARA │ │📅Plan. │ │🎯Ikigai│     │
│  │8 notes │ │23 items│ │Active  │     │
│  └────────┘ └────────┘ └────────┘     │
│                                        │
│ ──────────────────────────────────────│
│                                        │
│  📚 SYSTEM LIBRARY                     │
│  🏢 Management Systems                 │
│  • GTD [ℹ️ Learn] [+ Activate]        │
│  • PALA [ℹ️ Learn] [+ Activate]       │
│                                        │
│  🎯 Purpose Systems                    │
│  • Life Wheel [ℹ️ Learn] [+ Activate] │
│                                        │
└────────────────────────────────────────┘
```

**Implementation:**
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useStore } from '../store';
import { getAllSystems, getSystemCategories, getSystemsByCategory } from '../services/systemsRegistry';
import { getThemedColors } from '../theme';

export const SystemsScreen = ({ navigation }: any) => {
  const { isDarkMode } = useStore();
  const colors = getThemedColors(isDarkMode);

  const [activeSystems, setActiveSystems] = useState([]);
  const allSystems = getAllSystems();
  const categories = getSystemCategories();

  // TODO: Load active systems from database
  useEffect(() => {
    loadActiveSystems();
  }, []);

  const loadActiveSystems = async () => {
    // TODO: Query database for active systems
    // const active = await db.getActiveSystems();
    // setActiveSystems(active);
  };

  const handleActivateSystem = async (systemId: string) => {
    // TODO: Implement system activation
    // await activateSystem(systemId);
    // await loadActiveSystems();
  };

  const handleOpenFolders = () => {
    navigation.navigate('AllFolders', { showAllSystems: true });
  };

  const handleOpenSystem = (systemId: string) => {
    navigation.navigate('AllFolders', { systemId, showAllSystems: false });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>PROSE</Text>
        <TouchableOpacity
          style={[styles.foldersButton, { backgroundColor: colors.accent }]}
          onPress={handleOpenFolders}
        >
          <Text style={styles.foldersButtonText}>📁 Folders</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Active Systems */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            🎯 ACTIVE SYSTEMS
          </Text>
          <View style={styles.systemsGrid}>
            {activeSystems.map((system) => (
              <TouchableOpacity
                key={system.id}
                style={[styles.systemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => handleOpenSystem(system.id)}
              >
                <Text style={styles.systemIcon}>{system.icon}</Text>
                <Text style={[styles.systemName, { color: colors.text }]}>
                  {system.name}
                </Text>
                <Text style={[styles.systemCount, { color: colors.textSecondary }]}>
                  {/* TODO: Get note count */}
                  0 notes
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* System Library */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            📚 SYSTEM LIBRARY
          </Text>

          {categories.map((category) => {
            const systems = getSystemsByCategory(category);
            return (
              <View key={category} style={styles.category}>
                <Text style={[styles.categoryTitle, { color: colors.text }]}>
                  {category === 'management' && '🏢 Management Systems'}
                  {category === 'purpose' && '🎯 Purpose Systems'}
                  {category === 'analysis' && '📊 Analysis Systems'}
                  {category === 'functional' && '⚙️ Functional Systems'}
                </Text>

                {systems.map((system) => (
                  <View key={system.id} style={[styles.systemRow, { borderColor: colors.border }]}>
                    <Text style={styles.systemRowIcon}>{system.icon}</Text>
                    <View style={styles.systemRowInfo}>
                      <Text style={[styles.systemRowName, { color: colors.text }]}>
                        {system.name}
                      </Text>
                      <Text style={[styles.systemRowDesc, { color: colors.textSecondary }]}>
                        {system.description}
                      </Text>
                    </View>
                    <View style={styles.systemRowActions}>
                      <TouchableOpacity style={styles.learnMoreButton}>
                        <Text style={[styles.learnMoreText, { color: colors.accent }]}>
                          ℹ️ Learn
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.activateButton, { backgroundColor: colors.accent }]}
                        onPress={() => handleActivateSystem(system.id)}
                      >
                        <Text style={styles.activateButtonText}>+ Activate</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  foldersButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  foldersButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  systemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  systemCard: {
    width: '30%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  systemIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  systemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  systemCount: {
    fontSize: 12,
  },
  category: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  systemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  systemRowIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  systemRowInfo: {
    flex: 1,
  },
  systemRowName: {
    fontSize: 16,
    fontWeight: '600',
  },
  systemRowDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  systemRowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  learnMoreButton: {
    padding: 8,
  },
  learnMoreText: {
    fontSize: 12,
  },
  activateButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  activateButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
```

---

#### 2. AllFoldersScreen Component
**File to create**: `/Users/josmanyjuvier/Desktop/noted 2/src/screens/AllFoldersScreen.tsx`

**Key Features:**
- Shows all folders from all systems (or filtered to one system)
- Tree view with inline expansion
- Tap arrow (▶/▼) to expand/collapse
- Tap folder name to open folder detail
- [📝 Notes] button to jump to AllNotesScreen

**Use FolderTreeNode component (recursive)** - see next section

---

#### 3. FolderTreeNode Component (Recursive)
**File to create**: `/Users/josmanyjuvier/Desktop/noted 2/src/components/FolderTreeNode.tsx`

**Interface:**
```typescript
interface FolderTreeNodeProps {
  folder: Folder;
  notes: Note[];
  depth: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClickFolder: () => void;
  onClickNote: (noteId: string) => void;
  colors: any;
}
```

**Renders:**
- Indented based on `depth`
- [▶/▼] arrow for expand/collapse
- Folder icon, name, note count
- When expanded: subfolders (recursive) + notes
- Tap arrow → toggle expand, Tap name → open detail

---

#### 4. AllNotesScreen Component
**File to create**: `/Users/josmanyjuvier/Desktop/noted 2/src/screens/AllNotesScreen.tsx`

**Key Features:**
- Flat list of ALL notes from ALL systems
- Sorted by most recent first
- Each note card shows: systems tags, folder breadcrumb, format badges
- [← Folders] back button (NOT Systems!)
- Search/Filter/Sort controls

---

#### 5. FolderDetailScreen Component
**File to create**: `/Users/josmanyjuvier/Desktop/noted 2/src/screens/FolderDetailScreen.tsx`

**Shows:**
- Breadcrumb: System > Parent > Current Folder
- Subfolders section (grid/list)
- Notes section (list)
- [+ New Subfolder] [+ New Note] buttons
- [← All Folders] back button

---

### Phase 2: Services & Database Methods (Week 1-2)

#### System Activation Service
**File to create**: `/Users/josmanyjuvier/Desktop/noted 2/src/services/systemActivation.ts`

```typescript
import { getSystemById } from './systemsRegistry';
import { getDatabase } from './database';

export async function activateSystem(systemId: string): Promise<void> {
  const system = getSystemById(systemId);
  if (!system) throw new Error(`System not found: ${systemId}`);

  const db = await getDatabase();

  if (system.type === 'folder') {
    // Create folder structure from template
    for (const folderDef of system.templateStructure.folders) {
      await db.createFolder({
        name: folderDef.name,
        icon: folderDef.icon,
        systemId: systemId,
        parentFolderId: null,
        isAutoGenerated: false,
        createdAt: new Date()
      });
    }
  }

  // Mark system as active
  await db.activateSystem(systemId);
}

export async function deactivateSystem(systemId: string): Promise<void> {
  const db = await getDatabase();
  await db.deactivateSystem(systemId);
}
```

#### Database Methods to Add
**File to update**: `/Users/josmanyjuvier/Desktop/noted 2/src/services/database.ts`

**Add these methods:**
```typescript
// Systems
async activateSystem(systemId: string): Promise<void> {
  if (!this.db) throw new Error('Database not initialized');
  this.db.runSync(
    'INSERT OR REPLACE INTO systems (id, name, type, isActive, activatedAt) VALUES (?, ?, ?, 1, ?)',
    [systemId, systemName, systemType, Date.now()]
  );
}

async deactivateSystem(systemId: string): Promise<void> {
  if (!this.db) throw new Error('Database not initialized');
  this.db.runSync(
    'UPDATE systems SET isActive = 0 WHERE id = ?',
    [systemId]
  );
}

async getActiveSystems(): Promise<System[]> {
  if (!this.db) throw new Error('Database not initialized');
  const rows = this.db.getAllSync('SELECT * FROM systems WHERE isActive = 1');
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    type: row.type,
    isActive: Boolean(row.isActive),
    activatedAt: row.activatedAt ? new Date(row.activatedAt) : undefined,
    config: row.config ? JSON.parse(row.config) : undefined
  }));
}

async isSystemActive(systemId: string): Promise<boolean> {
  if (!this.db) throw new Error('Database not initialized');
  const row = this.db.getFirstSync('SELECT isActive FROM systems WHERE id = ?', [systemId]);
  return row ? Boolean(row.isActive) : false;
}

// Folders
async getFoldersBySystem(systemId: string): Promise<Folder[]> {
  if (!this.db) throw new Error('Database not initialized');
  const rows = this.db.getAllSync('SELECT * FROM folders WHERE systemId = ? ORDER BY name', [systemId]);
  return rows.map(row => this.mapFolderFromRow(row));
}

async getAllFoldersGroupedBySystem(): Promise<Record<string, Folder[]>> {
  if (!this.db) throw new Error('Database not initialized');
  const rows = this.db.getAllSync('SELECT * FROM folders ORDER BY systemId, name');
  const grouped: Record<string, Folder[]> = {};
  rows.forEach(row => {
    const systemId = row.systemId || 'uncategorized';
    if (!grouped[systemId]) grouped[systemId] = [];
    grouped[systemId].push(this.mapFolderFromRow(row));
  });
  return grouped;
}

// Notes
async getNotesBySystem(systemId: string): Promise<Note[]> {
  if (!this.db) throw new Error('Database not initialized');
  const rows = this.db.getAllSync(
    `SELECT * FROM notes WHERE systemIds LIKE ? ORDER BY lastModified DESC`,
    [`%"${systemId}"%`]
  );
  return rows.map(row => this.mapNoteFromRow(row));
}

async addSystemToNote(noteId: string, systemId: string): Promise<void> {
  if (!this.db) throw new Error('Database not initialized');
  const note = await this.getNoteById(noteId);
  if (!note) return;

  const systemIds = note.systemIds || [];
  if (!systemIds.includes(systemId)) {
    systemIds.push(systemId);
    this.db.runSync(
      'UPDATE notes SET systemIds = ? WHERE id = ?',
      [JSON.stringify(systemIds), noteId]
    );
  }
}

async removeSystemFromNote(noteId: string, systemId: string): Promise<void> {
  if (!this.db) throw new Error('Database not initialized');
  const note = await this.getNoteById(noteId);
  if (!note) return;

  const systemIds = (note.systemIds || []).filter(id => id !== systemId);
  this.db.runSync(
    'UPDATE notes SET systemIds = ? WHERE id = ?',
    [JSON.stringify(systemIds), noteId]
  );
}
```

---

### Phase 3: Navigation Stack Update

**File to update**: `App.tsx` or create `/Users/josmanyjuvier/Desktop/noted 2/src/navigation/AppNavigator.tsx`

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SystemsScreen } from './screens/SystemsScreen';
import { AllFoldersScreen } from './screens/AllFoldersScreen';
import { AllNotesScreen } from './screens/AllNotesScreen';
import { FolderDetailScreen } from './screens/FolderDetailScreen';
import { NoteDetailScreen } from './screens/NoteDetailScreen';
import { HomeScreen } from './screens/HomeScreen'; // Keep existing for now

const Stack = createStackNavigator();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Systems" component={SystemsScreen} />
        <Stack.Screen name="AllFolders" component={AllFoldersScreen} />
        <Stack.Screen name="AllNotes" component={AllNotesScreen} />
        <Stack.Screen name="FolderDetail" component={FolderDetailScreen} />
        <Stack.Screen name="NoteDetail" component={NoteDetailScreen} />
        <Stack.Screen name="Home" component={HomeScreen} /> {/* Legacy */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## 🔄 Cross-System Intelligence (Phase 4)

### Format → System Auto-Mapping

When a note has certain formats, automatically add it to relevant systems:

```typescript
// src/services/systemMapping.ts
export const FORMAT_SYSTEM_MAP: Record<NoteFormat, string[]> = {
  TASK: ['planner'],
  GOAL: ['goals', 'tracker'],
  JOURNAL: ['journal'],
  METRIC: ['tracker'],
  EVENT: ['planner'],
  PROJECT: ['goals', 'para'],
  NOTE: [],
  LIBRARY: [],
  IDEAS: []
};

export async function updateNoteSystemMappings(noteId: string, formats: NoteFormat[]): Promise<void> {
  const systemIds = new Set<string>();

  formats.forEach(format => {
    const systems = FORMAT_SYSTEM_MAP[format] || [];
    systems.forEach(sId => systemIds.add(sId));
  });

  const db = await getDatabase();
  for (const systemId of systemIds) {
    await db.addSystemToNote(noteId, systemId);
  }
}
```

**Integration**: Call this function whenever format boxes are added to a note.

---

## 🎨 Visual System Types (Phase 5+)

### Canvas Systems (Ikigai, Life Wheel)
**File to create**: `/Users/josmanyjuvier/Desktop/noted 2/src/screens/CanvasViewScreen.tsx`

- Render visual zones where notes can be placed
- Drag-and-drop functionality
- Custom layouts per system (circles for Ikigai, wheel for Life Wheel)

### Matrix Systems (Eisenhower, SWOT)
**File to create**: `/Users/josmanyjuvier/Desktop/noted 2/src/screens/MatrixViewScreen.tsx`

- 2x2 or 3x3 grid layout
- Notes can be moved between cells
- Color coding per cell

### Timeline Systems (GTD Workflow, Kanban)
**File to create**: `/Users/josmanyjuvier/Desktop/noted 2/src/screens/KanbanViewScreen.tsx`

- Horizontal columns (workflow stages)
- Drag notes through stages
- Progress visualization

---

## ✅ TESTING CHECKLIST

After implementing Phase 1-2:

- [ ] Can open Systems View (new root screen)
- [ ] Systems library displays all 15 systems grouped by category
- [ ] Can tap "Activate" on PARA system
- [ ] PARA creates 4 folders: Projects, Areas, Resources, Archives
- [ ] Can tap [📁 Folders] button to see all folders
- [ ] All Folders shows PARA folders in tree structure
- [ ] Can tap folder arrow to expand/collapse inline
- [ ] Can tap folder name to open folder detail
- [ ] Can tap [📝 Notes] from folders view
- [ ] All Notes shows all notes, most recent first
- [ ] Back button from All Notes goes to All Folders (not Systems)
- [ ] Back button from All Folders goes to Systems
- [ ] Can tap system card to filter folders to that system only

---

## 📁 PROJECT STRUCTURE

```
/Users/josmanyjuvier/Desktop/noted 2/
├── src/
│   ├── screens/
│   │   ├── SystemsScreen.tsx           # 🆕 To create (Priority 1)
│   │   ├── AllFoldersScreen.tsx        # 🆕 To create
│   │   ├── AllNotesScreen.tsx          # 🆕 To create
│   │   ├── FolderDetailScreen.tsx      # 🆕 To create
│   │   ├── CanvasViewScreen.tsx        # 🆕 Later (Phase 5)
│   │   ├── MatrixViewScreen.tsx        # 🆕 Later (Phase 5)
│   │   ├── KanbanViewScreen.tsx        # 🆕 Later (Phase 5)
│   │   ├── HomeScreen.tsx              # ✅ Keep for now (legacy)
│   │   └── NoteDetailScreen.tsx        # ✅ Exists (no changes needed yet)
│   ├── components/
│   │   ├── FolderTreeNode.tsx          # 🆕 To create (recursive)
│   │   ├── EmojiSelector.tsx           # ✅ Exists (working)
│   │   ├── EntryTreeView.tsx           # ✅ Exists (can reuse pattern)
│   │   └── [Format blocks from prev]   # ✅ Exists
│   ├── services/
│   │   ├── systemsRegistry.ts          # ✅ Created (15 systems defined)
│   │   ├── systemActivation.ts         # 🆕 To create
│   │   ├── systemMapping.ts            # 🆕 To create (Phase 4)
│   │   └── database.ts                 # ⚠️ Update with new methods
│   ├── navigation/
│   │   └── AppNavigator.tsx            # 🆕 To create or update App.tsx
│   └── types/
│       └── index.ts                    # ✅ Updated (has systemTemplate, systemIds)
└── SYSTEMS-IMPLEMENTATION.md           # 📄 This file
```

---

## 💡 IMPLEMENTATION ORDER

**Week 1 - Foundation:**
1. Create SystemsScreen (bare bones - show systems, activate button)
2. Add database methods (activateSystem, getActiveSystems)
3. Create systemActivation service
4. Test: Can activate PARA, creates folders in database

**Week 2 - Navigation:**
5. Create AllFoldersScreen (simple list first, no tree)
6. Update App.tsx navigation stack
7. Test: Can navigate Systems → Folders → Systems

**Week 3 - Tree View:**
8. Create FolderTreeNode component (recursive)
9. Add expand/collapse to AllFoldersScreen
10. Create AllNotesScreen (flat list)
11. Create FolderDetailScreen

**Week 4 - Polish:**
12. Add Learn More modals
13. Add search/filter to AllNotesScreen
14. Implement cross-system intelligence (format mapping)

**Week 5+ - Visual Systems:**
15. Canvas, Matrix, Timeline views for non-folder systems

---

## 🚀 QUICK START (Next Developer)

1. **Read this document** completely
2. **Start with SystemsScreen.tsx** - use the code template provided above
3. **Add database methods** for systems (activate, getActive)
4. **Test activation flow** with PARA system
5. **Create AllFoldersScreen** next
6. **Follow the implementation order** week by week

---

## 📞 RESUMING THIS SESSION

When continuing, tell Claude:

> "Read /Users/josmanyjuvier/Desktop/noted 2/SYSTEMS-IMPLEMENTATION.md and continue implementing the hierarchical systems. Start by creating SystemsScreen.tsx as outlined in Phase 1."

---

**Good luck! The foundation is solid - database and registry are ready. Now build the UI! 🚀**
