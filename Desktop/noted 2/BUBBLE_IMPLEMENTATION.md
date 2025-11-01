# 🫧 Bubble System - Complete Implementation Documentation

## Table of Contents
1. [Overview & Philosophy](#overview--philosophy)
2. [Core Architecture](#core-architecture)
3. [Three Types of Bubbles](#three-types-of-bubbles)
4. [Data Models](#data-models)
5. [Calendar & Planner Integration](#calendar--planner-integration)
6. [Media & Library System](#media--library-system)
7. [Organization Systems](#organization-systems)
8. [Dashboard Design](#dashboard-design)
9. [AI Capabilities](#ai-capabilities)
10. [Business Use Cases](#business-use-cases)
11. [Implementation Roadmap](#implementation-roadmap)

---

## Overview & Philosophy

### Vision
Build a **unified Bubble architecture** that **replaces Notes, Folders, AND Systems** with a single, powerful, polymorphic container system.

### What is a Bubble?
A bubble is a **living, polymorphic container** that can:
1. **BE content** (like a Note) - holds text, tasks, goals, journals, etc.
2. **CONTAIN other bubbles** (like a Folder) - parent-child hierarchy
3. **ORGANIZE principles** (like a System) - GTD, PARA, Kanban templates
4. **CONNECT spatially** (like Notion pages) - 2D/3D relationships
5. **EVOLVE over time** (timeline axis) - Transform Note → Task → Project → Goal

### Three Axes Framework
- **Y-Axis (Depth):** Hierarchy - Goal → Project → Task → Subtask
- **X-Axis (Breadth):** Relationships - Idea ↔ Note ↔ Resource ↔ Reference
- **Z-Axis (Time):** Evolution - Past → Present → Future (blockchain timeline)

---

## Core Architecture

### Bubble Types
```typescript
type BubbleType =
  | 'note'      // Free-form notes
  | 'task'      // To-do items with checklists
  | 'project'   // Multi-step projects
  | 'goal'      // Long-term objectives
  | 'journal'   // Daily reflections
  | 'library'   // Reference materials
  | 'ideas'     // Brainstorming
  | 'document'  // Formal documents
  | 'planner'   // Scheduling
  | 'tracker'   // Metrics/habits
  | 'meeting'   // Meeting notes
  | 'workout'   // Exercise logs
  | 'budget';   // Financial tracking
```

### Hierarchy Types
```typescript
type HierarchyType =
  | 'goal'       // Top-level (0 depth)
  | 'project'    // Mid-level (1 depth)
  | 'task'       // Low-level (2 depth)
  | 'standalone'; // No hierarchy
```

### Connection Types
```typescript
type ConnectionType =
  | 'inspired_by'   // Creative inspiration
  | 'depends_on'    // Blocking dependency
  | 'part_of'       // Hierarchy relationship
  | 'related_to'    // General relationship
  | 'blocks'        // Inverse of depends_on
  | 'references'    // Citation/link
  | 'evolved_from'; // Transformation history
```

---

## Three Types of Bubbles

### 1. Standard Bubbles (One-Time)
- Create once, use forever
- No recurrence, no archiving
- Example: "Project Ideas" bubble

### 2. Recurring Instance Bubbles (Same Bubble Repeats)
- Same bubble appears on calendar repeatedly
- No archiving, no fresh instances
- Example: "🏃 Morning Routine" (personal routine)

**Use Case:**
```
Bubble: "🏃 Morning Routine"
└─ Recurrence: Daily at 6:00 AM

Every day:
└─ Same bubble content appears
   (Meditation, Exercise, Breakfast)
```

### 3. Persistent Template Bubbles (Fresh Instances)
- Template spawns new instances on schedule
- Each instance is archived when complete
- Real-time tracking for managers
- Triggers automations on completion
- Historical analytics

**Use Case:**
```
Template: "☕ Opening Checklist"
└─ Recurrence: Daily at 6:00 AM

Day 1 (Nov 10):
├─ Instance created at 6:00 AM
├─ Employee completes checklist
├─ ✅ Triggers: Email to boss
├─ Instance archived with completion data
└─ Ready to spawn new instance tomorrow

Day 2 (Nov 11):
├─ New fresh instance created at 6:00 AM
├─ All checkboxes unchecked (fresh start)
└─ Previous day's data archived
```

---

## Data Models

### Core Bubble Interface
```typescript
interface Bubble {
  // Core identity
  id: string;
  type: BubbleType;
  title: string;
  emoji: string;
  color: string;

  // Hierarchy (Y-axis)
  hierarchyType: 'goal' | 'project' | 'task' | 'standalone';
  parentBubbleId?: string;
  childBubbleIds: string[];
  depth: number; // 0=top-level, 1=project, 2=task, 3=subtask

  // Spatial positioning (X-axis)
  position: { x: number; y: number };
  connections: BubbleConnection[];

  // Time evolution (Z-axis)
  createdAt: Date;
  updatedAt: Date;
  timelineStage: 'past' | 'present' | 'future';

  // Multi-format entries
  entries: BubbleEntry[];

  // Organization
  tags: string[];
  importance: 1 | 2 | 3 | 4 | 5; // Star rating
  systemId?: string; // GTD, PARA, Kanban, etc.

  // Scheduling
  schedule?: BubbleSchedule;
  dueDate?: Date; // For tasks
  completedAt?: Date;

  // Metadata
  isShared: boolean;
  assignedTo?: string[]; // User IDs

  // Type-specific data
  typeData: BubbleTypeData;

  // Media attachments
  attachments: MediaAttachment[];
}
```

### Multi-Format Entry System
```typescript
type EntryType =
  | 'text'      // Free text
  | 'task'      // Checklist with progress
  | 'goal'      // Goal with milestones
  | 'project'   // Project with steps
  | 'idea'      // Brainstorming
  | 'journal'   // Reflection + mood
  | 'link'      // URL bookmarks
  | 'budget'    // Income/expenses
  | 'workout'   // Exercise log
  | 'library'   // File attachments
  | 'table'     // Data tables
  | 'tracker';  // Metrics

interface BubbleEntry {
  id: string;
  type: EntryType;
  content: string;
  position: number; // Order within bubble
  timestamp: Date;
  formatData: TaskData | GoalData | JournalData | etc.; // Type-specific
}
```

### Connection System
```typescript
interface BubbleConnection {
  id: string;
  targetBubbleId: string;
  type: ConnectionType;
  strength: number; // Visual thickness 0-1
  label?: string;
}
```

### Timeline/Blockchain System
```typescript
interface TimelineBlock {
  id: string;
  action: 'created' | 'edited' | 'connected' | 'shared' | 'completed' | 'evolved';
  bubbleId: string;
  changes: {
    before: Partial<Bubble>;
    after: Partial<Bubble>;
  };
  timestamp: Date;
  userId?: string; // For collaboration
}
```

### Media Attachments
```typescript
type MediaType = 'image' | 'video' | 'audio' | 'document' | 'link';

interface MediaAttachment {
  id: string;
  type: MediaType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string; // Storage URL
  thumbnailUrl?: string;
  uploadedAt: Date;
  uploadedBy: string;
}
```

### Recurring Templates
```typescript
interface RecurringBubbleTemplate {
  id: string;
  templateBubbleId: string; // The master template

  // Recurrence settings
  schedule: {
    type: 'daily' | 'weekly' | 'monthly' | 'custom';
    time: string; // HH:MM
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
    dayOfMonth?: number; // 1-31
    customPattern?: string; // Cron-like
  };

  // Instance behavior
  instanceBehavior: 'persistent_template' | 'single_instance';

  // Automation triggers
  onComplete?: {
    emailTo?: string[]; // ["boss@company.com"]
    notifyUsers?: string[];
    webhook?: string;
    customAction?: string; // Function name to run
  };

  // Archiving
  archiveOnComplete: boolean;
  retentionDays?: number; // How long to keep archives

  // Assignment
  assignedTo?: string[]; // User IDs

  // Real-time tracking
  enableRealtimeUpdates: boolean; // Boss sees live progress
}

interface BubbleInstance {
  id: string;
  templateId: string; // Links to template
  instanceDate: Date; // Which day this instance is for

  // Completion tracking
  startedAt?: Date;
  completedAt?: Date;
  completedBy?: string; // User ID

  // Content (copied from template)
  content: BubbleEntry[]; // Fresh copy each time

  // Status
  status: 'active' | 'completed' | 'archived' | 'overdue';

  // Triggers fired
  triggersFired: {
    type: string;
    firedAt: Date;
    success: boolean;
  }[];
}
```

### Scheduling System
```typescript
interface BubbleSchedule {
  id: string;
  bubbleId: string;

  // Scheduling
  type: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  date?: Date; // For one-time
  time?: string; // HH:MM format

  // Recurring patterns
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  dayOfMonth?: number; // 1-31
  customPattern?: string; // Cron-like pattern

  // Reminders
  reminderMinutesBefore?: number;

  // Metadata
  createdAt: Date;
  isActive: boolean;
}
```

---

## Calendar & Planner Integration

### Auto-Collection Behavior

**All Task bubbles automatically appear in:**
1. **Planner View** - Shows all tasks organized by due date
2. **Calendar View** - Tasks appear on their scheduled dates

**Any bubble type can be scheduled:**
- 📝 Journal bubble: "Daily Reflection" → Every day at 8 PM
- 🏃 Workout bubble: "Morning Routine" → Weekdays at 6 AM
- 🎯 Goal bubble: "Quarterly Review" → First Monday of each quarter
- 💡 Idea bubble: "Brainstorm Session" → Friday afternoons

### Calendar View UI
```
Calendar View 📅
┌─────────────────────────────────────┐
│  < November 2025 >                  │
├─────────────────────────────────────┤
│ Mon    Tue    Wed    Thu    Fri     │
│   1      2      3      4      5     │
│  [2]    [3]   [1]    [4]    [2]    │ ← Number of bubbles
│                                     │
│   8      9     10     11     12    │
│  [1]    [0]   [🔴3]  [1]    [0]    │ ← Today highlighted
├─────────────────────────────────────┤
│ Today's Bubbles (Nov 10):          │
│                                     │
│ 🏃 Morning Routine                  │
│    6:00 AM • Recurring daily       │
│                                     │
│ ✓ Buy groceries                    │
│    2:00 PM • Due today             │
│                                     │
│ 📝 Daily Reflection                 │
│    8:00 PM • Recurring daily       │
└─────────────────────────────────────┘
```

### Planner View UI
```
Planner View 🗓️
┌─────────────────────────────────────┐
│ [Day] [Week] [Month]                │
├─────────────────────────────────────┤
│ Overdue (2)                         │
│ ❗ ✓ Submit report                  │
│ ❗ 📋 Call dentist                  │
├─────────────────────────────────────┤
│ Today - Nov 10 (3)                  │
│ 🏃 Morning Routine (6:00 AM)        │
│ ✓ Buy groceries (2:00 PM)          │
│ 📝 Daily Reflection (8:00 PM)       │
├─────────────────────────────────────┤
│ Tomorrow - Nov 11 (1)               │
│ ✓ Team standup (9:00 AM)           │
├─────────────────────────────────────┤
│ This Week (5)                       │
│ 🎯 Quarterly Review (Nov 13)        │
│ 💡 Brainstorm Session (Nov 14)      │
│ ... [View All]                      │
├─────────────────────────────────────┤
│ Unscheduled Tasks (8)               │
│ ✓ Fix bug in login                 │
│ ✓ Update documentation             │
│ ... [View All]                      │
└─────────────────────────────────────┘
```

### Scheduling Options
- **One-time**: Specific date/time
- **Daily**: Every day (or specific days of week)
- **Weekly**: Every week on specific days
- **Monthly**: Specific day of month
- **Custom**: Advanced patterns (first Monday, last Friday, etc.)

---

## Media & Library System

### Key Principle
**Voice, images, videos, links are NOT bubble types** - they are **attachments/content within bubbles**.

Any bubble can have:
- 📎 File attachments (PDF, DOCX, etc.)
- 🖼️ Images
- 🎥 Videos
- 🔗 URLs/Links
- 🎤 Voice recordings

### Image Display
**Inline by default** - Images show directly in bubble content (like WhatsApp/Slack).

### User Can Create Collection Bubbles
**Manual process:**
1. User creates bubble: "Photo Book - Colorado Trip"
2. User drags/selects images from other bubbles
3. Images get **copied** to new bubble (originals stay in place)
4. AI suggests: "Convert to Photo Book bubble type?"

**AI can assist:**
```
User has 20 images across 5 bubbles
AI Suggests:
  💬 "I noticed you have 20 vacation images.
      Want me to create a Photo Book bubble?"
  [Create Photo Book] [No Thanks]
```

### Library View - Universal Media Browser

A smart aggregation view that shows **ALL media across ALL bubbles**:
- **Filterable** by type (images, videos, files, links, voice)
- **Shows source** - which bubble each media lives in
- **Timestamped** - when it was added
- **Clickable** - tap media → opens parent bubble
- **No auto-collections** - user manually creates collections

```
Library View 🔗
Filters: [All] [🖼️ Images] [🎥 Videos] [📎 Files] [🔗 Links] [🎤 Voice]

Showing: Images (23)

🖼️ Mountain Photo
   From: 🏔️ Vacation Planning bubble
   Added: Oct 26, 2025
   [Select] [Open Bubble] [Add to Collection]

🖼️ Wireframe Sketch
   From: 📱 App Design bubble
   Added: Oct 25, 2025
   [Select] [Open Bubble] [Add to Collection]

[Bulk Actions: Move Selected | Create Collection from Selected]
```

### Library Location
- Located on **Homepage** as a main tab/widget
- Also accessible from any bubble (quick add to library)

---

## Organization Systems

### System Philosophy
**New paradigm:** Bubbles ARE Systems

```
OLD (Current):
System (GTD) → Folders → Notes

NEW (Bubbles):
Bubbles (with systemType) → Child bubbles → Child bubbles (unlimited depth)
```

### System Creation Approach
**Hybrid Pre-Defined (Option C):**
1. System creates with **pre-defined types** (recommended)
2. User can **change any type** anytime
3. AI provides **suggestions** if user seems stuck
4. **First-time prompt**: "Use recommended types or customize?"

### Example Systems

#### GTD (Getting Things Done)
**When user activates GTD:**

Creates full structure with **recommended types**:
```
📥 Inbox (Project bubble - recommended)
  ├─ 📋 Next Actions (Task bubble - recommended)
  ├─ 📋 Waiting For (Task bubble - recommended)
  └─ 📋 Someday/Maybe (Idea bubble - recommended)

📅 Contexts (Goal bubble - recommended)
  ├─ 📋 @Home (Project bubble - recommended)
  ├─ 📋 @Work (Project bubble - recommended)
  ├─ 📋 @Errands (Project bubble - recommended)
  └─ 📋 @Computer (Project bubble - recommended)

🎯 Projects (Goal bubble - recommended)
  └─ (empty - user adds projects)

📚 Reference (Library bubble - recommended)
  └─ (empty - user adds reference)
```

**AI Onboarding:**
```
System Created! 🎉

GTD is now active with 4 main areas:
• 📥 Inbox - Capture everything here first
• 📅 Contexts - Organize by location/tool
• 🎯 Projects - Multi-step outcomes
• 📚 Reference - Information to keep

💡 Pro tip: Tap any bubble to convert it to a
   specific type (Task, Project, Goal, etc.)

[Start Tour] [Skip]
```

#### PARA (Projects, Areas, Resources, Archives)
**Focus:** Outcome-oriented life organization

```
📁 Projects (Goal bubble - recommended)
  └─ Active projects with deadlines

🎯 Areas (Goal bubble - recommended)
  ├─ 💪 Health (Project bubble - recommended)
  ├─ 💰 Finance (Project bubble - recommended)
  └─ ❤️ Relationships (Project bubble - recommended)

📚 Resources (Library bubble - recommended)
  └─ Reference materials, how-tos

🗄️ Archives (Generic bubble - recommended)
  └─ Completed items
```

**Best for:** Life organization, long-term planning

#### Kanban (Visual Workflow)
**Focus:** Flow-oriented task management

```
📋 To Do (Task bubble - recommended)
  └─ Backlog of tasks

⚡ In Progress (Task bubble - recommended)
  └─ Currently working on

✅ Done (Generic bubble - recommended)
  └─ Completed tasks
```

**Best for:** Team collaboration, sprint planning

#### Zettelkasten (Knowledge Building)
**Focus:** Interconnected knowledge

```
💭 Fleeting Notes (Note bubble - recommended)
  └─ Quick captures, raw ideas

📖 Literature Notes (Note bubble - recommended)
  └─ Summaries from reading

💎 Permanent Notes (Note bubble - recommended)
  └─ Fully developed thoughts

🔗 Index (Library bubble - recommended)
  └─ Entry points to knowledge areas
```

**Best for:** Research, learning, writing

#### Bullet Journal (Daily Logging)
**Focus:** Time-oriented personal tracking

```
📅 Future Log (Planner bubble - recommended)
  └─ 6-12 month overview

📆 Monthly Log (Planner bubble - recommended)
  └─ Current month tasks/events

📓 Daily Log (Journal bubble - recommended)
  └─ Today's tasks/notes/reflections

📚 Collections (Generic bubble - recommended)
  └─ Topic-based lists (books, movies, etc.)
```

**Best for:** Journaling, habit tracking, personal reflection

### Generic Bubbles with Smart Suggestions

**Default behavior:** Bubbles start with **recommended type** based on system context.

**User can change anytime:**
```
User taps bubble "Next Actions"
Current type: Task bubble (recommended)

[Change Type]
  ○ Task (recommended for actions)
  ○ Project (for multi-step work)
  ○ Goal (for outcomes)
  ○ Generic (no specific type)
  ○ Other types...

💡 Why Task? Next Actions in GTD are
   single-step items you can complete now.
```

**Context-aware suggestions:**
```
User creates bubble in "GTD → Next Actions"
AI: "This system bubble is for actions.
     Current type: Task (recommended)

     Want to change it?"
[Keep as Task] [Change Type...]
```

```
User adds 5 images to a bubble
AI: "You've added 5 images.
     Want to convert this to a Photo Book bubble?"
[Convert to Photo Book] [Keep As-Is]
```

---

## Dashboard Design

### Homepage - Productivity Dashboard

#### Top Section - Navigation Tabs
```
┌─────────────────────────────────────┐
│ [Bubbles] [Library] [Calendar] [...] │ ← Main tabs
│ [Settings] [Account] [AI Assistant] │ ← Utility
└─────────────────────────────────────┘
```

#### Main Dashboard - Customizable Widgets

**Default Layout:**
```
┌─────────────────────────────────────┐
│ [💬 Messages] [🔔 Notifications]     │ ← Collaboration first
├─────────────────┬───────────────────┤
│ ✅ To Do Today  │ 📅 Calendar       │ ← Action items
├─────────────────┼───────────────────┤
│ 🎯 Main System  │ ⏰ Pending        │ ← System overview
├─────────────────┴───────────────────┤
│ 💡 New Ideas    📊 Progress Stats   │ ← Insights
├─────────────────────────────────────┤
│ 📰 Workflow Marketplace             │ ← Discovery
└─────────────────────────────────────┘
```

### Dashboard Widgets

#### 💬 Messages (Slack-Style Collaboration)
- Direct messages from team members
- Channel/workspace messages
- @mentions and replies
- Thread conversations
- File sharing in messages

#### 🔔 Notifications
- System alerts (task due, bubble updated)
- Collaboration notifications (comment, mention, share)
- Automation triggers (workflow completed)
- Calendar reminders
- Team activity

#### ✅ To Do Today
- Tasks due today
- Scheduled bubbles for today
- Quick checkbox completion
- Priority sorting

#### 📅 Calendar
- Mini calendar widget
- Today's scheduled bubbles
- Upcoming events
- Quick date navigation

#### 🎯 Main System
- User's primary active system (GTD, PARA, etc.)
- Quick access to system bubbles
- Progress overview
- System-specific actions

#### ⏰ Pending/Follow-ups
- Tasks waiting on others
- Follow-up reminders
- Blocked tasks
- Future review items

#### 💡 New Ideas
- Recent idea bubbles
- Brainstorm captures
- Unprocessed thoughts
- Quick add new idea

#### 📊 Progress Stats
- Completion rates
- Streaks and habits
- XP and levels (gamification)
- Weekly/monthly trends

#### 📰 Workflow Marketplace
- Popular workflows (e.g., "Morning Routine" - 1.2k users)
- New workflow templates
- Community workflows
- Install with one click

#### 🎉 App Updates
- Newsletter-style announcements
- New features
- Tips and tricks
- Community highlights

### Customization
Users can:
- ✅ **Rearrange widgets** - Drag to reorder
- ✅ **Show/hide widgets** - Toggle on/off
- ✅ **Resize widgets** - Small/medium/large
- ✅ **Set defaults** - What shows on startup

---

## AI Capabilities

### Full System Agent

AI can perform **ANY action** in the system:

#### 1. Create Bubbles
```
User: "Create a project for app launch"
AI: Creates bubble with:
  - Title: "App Launch Project"
  - Type: Project
  - Pre-populated entries (tasks, milestones)
  - Suggested connections to related bubbles
```

#### 2. Design Structure
```
User: "Build me a GTD system with 10 bubbles"
AI: Creates complete GTD hierarchy:
  - 4 main areas
  - 6 sub-bubbles
  - All with recommended types
  - Connected appropriately
```

#### 3. Update Bubbles
```
User: "Mark all tasks in 'App Launch' as complete"
AI: Finds all task entries in bubble
  - Marks checkboxes as complete
  - Updates progress bars
  - Triggers completion automations
  - Archives if configured
```

#### 4. Build Workflows
```
User: "When I complete a task, move it to archive"
AI: Creates automation:
  - Trigger: Task completion
  - Action: Move to Archive bubble
  - Notification: None (silent)
  - Saves as reusable workflow
```

#### 5. Triggers & Automation
```
User: "Every Monday, create a weekly review bubble"
AI: Sets up recurring automation:
  - Schedule: Weekly on Mondays, 9:00 AM
  - Action: Create bubble from template
  - Type: Journal
  - Pre-filled prompts (wins, learnings, plans)
```

#### 6. Smart Suggestions
```
AI detects: Bubble has 5+ subtasks
AI suggests: "This bubble is growing. Want to
              convert it to a Project bubble?"
[Convert to Project] [No Thanks]
```

```
AI detects: User creates 3 "Morning" bubbles
AI suggests: "I see multiple morning routines.
              Want me to combine them into one
              recurring bubble?"
[Combine & Schedule] [Keep Separate]
```

#### 7. Collection Creation
```
AI detects: 20 images across 5 bubbles, all tagged #vacation
AI suggests: "Want me to create a 'Vacation Photos'
              collection bubble?"
[Create Collection] [No Thanks]
```

#### 8. Response to Events
```
Event: Bubble gets 5 subtasks
AI: "This is becoming a project. Convert it?"

Event: Task overdue by 2 days
AI: "This task is overdue. Reschedule or mark complete?"

Event: User completes 7-day streak
AI: "🔥 7-day streak! Want to set a 30-day challenge?"
```

### AI Command Parser
Natural language understanding:
```
"Create a daily standup for my team at 9am"
→ AI creates recurring bubble template with:
  - Schedule: Weekdays at 9:00 AM
  - Type: Meeting
  - Assigned to: Team members
  - Persistent template mode

"Show me all my overdue tasks"
→ AI filters and displays:
  - All task bubbles with past due dates
  - Sorted by priority
  - Grouped by project/system

"Build a workout tracker for the gym"
→ AI creates:
  - Workout bubble with tracker entries
  - Pre-populated exercises
  - Progress charts
  - Weekly schedule suggestions
```

---

## Business Use Cases

### Use Case 1: Coffee Shop Opening Checklist

**Persistent Template Bubble:**
```
Template: "☕ Opening Checklist"
├─ Type: persistent_template
├─ Schedule: Daily at 6:00 AM
├─ Assigned to: Morning shift staff
├─ Archive on complete: Yes
├─ On complete:
│   └─ Email: manager@coffeeshop.com
│       Subject: "Opening checklist completed"
│       Body: "Completed by {user} at {time}"
└─ Real-time updates: Yes (manager sees live progress)

Checklist Items:
✓ Unlock doors
✓ Turn on espresso machine
✓ Check inventory
✓ Count register
✓ Clean counters
✓ Turn on Open sign
```

**Daily Flow:**
```
Day 1 (Nov 10):
├─ Instance created: 6:00 AM
├─ Started: 6:15 AM (Sarah)
├─ Progress: 4/6 tasks complete (67%)
│   ✅ Unlock doors
│   ✅ Turn on espresso machine
│   ✅ Check inventory
│   ✅ Count register
│   □ Clean counters (in progress...)
│   □ Turn on Open sign
├─ Manager Dashboard: Shows "Sarah - 67% complete"
└─ On 6/6 complete:
    ├─ Completed: 6:42 AM
    ├─ Email sent to manager ✓
    ├─ Instance archived with timestamp
    └─ New instance scheduled for tomorrow
```

### Use Case 2: Weekly Sales Report

```
Template: "📊 Weekly Sales Report"
├─ Type: persistent_template
├─ Schedule: Every Friday at 5:00 PM
├─ Assigned to: Sales team lead
├─ Archive on complete: Yes
├─ On complete:
│   ├─ Email: executives@company.com
│   ├─ Webhook: https://api.company.com/sales-reports
│   └─ Generate PDF attachment
└─ Real-time updates: Yes

Weekly Instance (Nov 14):
├─ Created: Friday 5:00 PM
├─ Entries:
│   ✓ Total revenue: $45,000
│   ✓ New customers: 23
│   ✓ Top products: Product A, B, C
│   ✓ Notes: Strong week, exceeding targets
├─ Completed: Friday 6:30 PM
└─ Triggers:
    ├─ Email sent with PDF ✓
    ├─ Webhook POST successful ✓
    └─ Archived in "Sales Reports" collection
```

### Use Case 3: Team Daily Standup

```
Template: "🗣️ Team Standup"
├─ Type: persistent_template
├─ Schedule: Weekdays at 9:00 AM
├─ Assigned to: All team members (5 people)
├─ Archive on complete: Yes
├─ On complete:
│   └─ Post to Slack #standup channel
└─ Real-time updates: Yes

Daily Instance (Nov 10):
├─ Created: 9:00 AM
├─ Team members add:
│
│   👤 Sarah:
│   📝 Yesterday: Completed login feature
│   📝 Today: Working on API integration
│   📝 Blockers: None
│
│   👤 Mike:
│   📝 Yesterday: Fixed 3 bugs
│   📝 Today: Code review, testing
│   📝 Blockers: Waiting on design feedback
│
│   ... (3 more team members)
│
├─ Real-time: Everyone sees updates as typed
├─ End of day: Archived with full history
└─ Tomorrow: Fresh standup bubble at 9:00 AM
```

### Manager Dashboard (Real-Time Tracking)

```
Manager Dashboard 👔
┌─────────────────────────────────────┐
│ Active Checklists (Live Updates)    │
├─────────────────────────────────────┤
│ ☕ Opening Checklist                │
│    👤 Sarah Johnson                 │
│    ▓▓▓▓▓▓░░ 67% (4/6)              │
│    Started: 6:15 AM (15 min ago)   │
│    [View Details]                   │
├─────────────────────────────────────┤
│ 🧹 Closing Checklist                │
│    👤 Mike Chen                     │
│    ▓▓░░░░░░ 25% (2/8)              │
│    Started: 9:45 PM (5 min ago)    │
│    [View Details]                   │
├─────────────────────────────────────┤
│ ⏰ Overdue (1)                      │
│ ❗ 📊 Weekly Inventory               │
│    Due: 2 hours ago                 │
│    Assigned: Alex Kim               │
│    [Send Reminder]                  │
└─────────────────────────────────────┘

Completed Today (3)
├─ ✅ ☕ Opening Checklist (Sarah, 6:42 AM)
├─ ✅ 🚚 Delivery Check-in (Mike, 2:15 PM)
└─ ✅ 💰 Cash Register Count (Sarah, 3:30 PM)

Weekly Performance
├─ Opening Checklist: 100% completion rate
├─ Avg completion time: 27 minutes
└─ Most common blocker: Espresso machine issues

[View All Archives] [Export Report] [Analytics]
```

### Historical Analytics

```
Opening Checklist Analytics 📊
┌─────────────────────────────────────┐
│ Last 30 Days                        │
├─────────────────────────────────────┤
│ Completion Rate: 100% (30/30)       │
│ Avg Time: 27 minutes                │
│ Fastest: 18 min (Nov 5, Sarah)      │
│ Slowest: 45 min (Nov 2, Mike)       │
├─────────────────────────────────────┤
│ By Employee:                        │
│ 👤 Sarah: 18 completions, 25min avg │
│ 👤 Mike: 12 completions, 32min avg  │
├─────────────────────────────────────┤
│ Most Common Delays:                 │
│ • Espresso machine issues (8x)      │
│ • Inventory discrepancies (3x)      │
│ • Late deliveries (2x)              │
└─────────────────────────────────────┘

[Export CSV] [View Trend Chart] [Compare Months]
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal:** Enhanced type system and data models

- [ ] Update Bubble type definitions in `bubble.ts`
- [ ] Add `BubbleEntry` interface (multi-format entries)
- [ ] Add hierarchy fields (hierarchyType, depth, parent/child)
- [ ] Add spatial positioning (x, y coordinates)
- [ ] Add connection strength to `BubbleConnection`
- [ ] Add `'evolved_from'` to `ConnectionType`
- [ ] Add `TimelineBlock` interface
- [ ] Add `OrganizationSystem` and `SystemTemplate` types
- [ ] Add `MediaAttachment` interface
- [ ] Add `BubbleSchedule` interface
- [ ] Add `RecurringBubbleTemplate` and `BubbleInstance` interfaces
- [ ] Update database schema

### Phase 2: UI Components (Week 3-4)
**Goal:** Build enhanced bubble display and editing

- [ ] Enhanced Bubble card component
  - Hierarchy indicators: `[Child]` `[↓ 3]` badges
  - Format type indicators: `[Task]` `[Goal]` `[Project]`
  - Progress bars for tasks/goals
  - Connection count indicator
  - Importance stars (1-5)
- [ ] Bubble editor enhancements
  - Breadcrumb navigation
  - Child bubble chips (horizontal scroll)
  - Format toolbar (8+ types)
  - Entry renderers for each type
- [ ] Four view modes for BubblePlayground
  - List View (current)
  - Grid View
  - Spatial View (2D canvas)
  - Timeline View

### Phase 3: Hierarchy System (Week 5-6)
**Goal:** Parent-child relationships and navigation

- [ ] Smart child creation flow
  - Auto-suggests type based on parent
  - Opens new bubble with breadcrumb
- [ ] Breadcrumb component
  - Click to jump levels
  - Show full path
- [ ] Child bubble management
  - Add/remove children
  - Reorder children
  - Convert to/from hierarchy
- [ ] Hierarchy filtering on HomeScreen
  - Tree View (top-level only)
  - List View (all bubbles)
  - System View (grouped by system)

### Phase 4: Organization Templates (Week 7-8)
**Goal:** Pre-built system structures

- [ ] System template selector modal
- [ ] Template data structures
  - GTD template
  - PARA template
  - Kanban template
  - Bullet Journal template
  - Zettelkasten template
- [ ] System activation flow
  - Create full structure
  - Set recommended types
  - Show onboarding
  - Allow customization
- [ ] Custom template builder
  - Save user-created structures
  - Share templates

### Phase 5: Spatial Canvas (Week 9-10)
**Goal:** 2D interactive workspace

- [ ] Universe View implementation
  - 2D interactive canvas
  - Pan, zoom, drag bubbles
  - Mini-map navigation
- [ ] Connection rendering
  - Bezier curves between bubbles
  - Color-coded by type
  - Thickness based on strength
- [ ] Auto-clustering algorithm
  - Smart layout based on connections
  - Group by tags/system
- [ ] Zoom levels
  - Macro (dots with labels)
  - Meso (cards with previews)
  - Micro (full content)

### Phase 6: Timeline & Evolution (Week 11-12)
**Goal:** Blockchain history and version tracking

- [ ] Timeline block creation
  - Track all bubble actions
  - Immutable history
- [ ] Timeline View UI
  - Chronological list
  - Filters (bubble, action, date)
  - Search functionality
- [ ] AI-generated summaries
  - Weekly recaps
  - Monthly milestones
- [ ] Bubble evolution
  - Transform types (Note → Task → Project → Goal)
  - Track transformation history
- [ ] Version restore
  - Roll back to previous state
  - Compare versions

### Phase 7: Calendar & Planner (Week 13-14)
**Goal:** Scheduling and time management

- [ ] Calendar View
  - Month/week/day views
  - Scheduled bubbles display
  - Quick date navigation
- [ ] Planner View
  - Overdue section
  - Today section
  - This week section
  - Unscheduled tasks
- [ ] Scheduling UI
  - Quick schedule options
  - Recurring schedule builder
  - Reminder settings
- [ ] Auto-collection logic
  - Tasks → Planner/Calendar
  - Update on due date changes
  - Overdue tracking

### Phase 8: Persistent Templates (Week 15-16)
**Goal:** Recurring business checklists

- [ ] Template creation UI
  - Instance behavior selector
  - Schedule configuration
  - Assignment settings
- [ ] Instance management
  - Spawn new instances on schedule
  - Archive completed instances
  - Track completion data
- [ ] Automation triggers
  - Email on completion
  - Webhook calls
  - Custom functions
- [ ] Real-time updates
  - WebSocket implementation
  - Live progress tracking
  - Manager dashboard

### Phase 9: Media & Library (Week 17-18)
**Goal:** Universal media management

- [ ] Media attachments
  - Upload images/videos/files
  - Inline display in bubbles
  - File management
- [ ] Library View
  - Aggregate all media
  - Filter by type
  - Show source bubble
  - Bulk actions
- [ ] Collection creation
  - Manual collections
  - AI-suggested collections
  - Photo book type

### Phase 10: Dashboard & Widgets (Week 19-20)
**Goal:** Customizable homepage

- [ ] Dashboard layout system
  - Widget grid
  - Drag-to-rearrange
  - Resize widgets
- [ ] Core widgets
  - Messages (Slack-style)
  - Notifications
  - To Do Today
  - Calendar mini
  - Main System
  - Pending/Follow-ups
  - New Ideas
  - Progress Stats
  - Workflow Marketplace
  - App Updates
- [ ] Customization settings
  - Show/hide widgets
  - Default layout
  - Widget preferences

### Phase 11: AI Integration (Week 21-22)
**Goal:** Full AI capabilities

- [ ] AI command parser
  - Natural language understanding
  - Action execution
- [ ] Smart suggestions
  - Type conversion suggestions
  - Collection suggestions
  - Workflow suggestions
- [ ] Automation builder
  - AI-generated workflows
  - Trigger configuration
  - Action setup
- [ ] AI assistant chat
  - Conversational interface
  - Context-aware responses
  - Multi-step tasks

### Phase 12: Collaboration (Week 23-24)
**Goal:** Team features and sharing

- [ ] Sharing system
  - Share individual bubbles
  - Permission levels
  - Link sharing
- [ ] Real-time collaboration
  - Live editing
  - Presence indicators
  - Cursor tracking
- [ ] Messages & notifications
  - Direct messages
  - Channel messages
  - @mentions
  - Thread conversations
- [ ] Team features
  - Assign tasks
  - Comment threads
  - Activity tracking

### Phase 13: Storage & Migration (Week 25-26)
**Goal:** Database and data migration

- [ ] Enhanced database schema
  - Create new tables
  - Indexes for performance
- [ ] Migration tool
  - Convert Notes → Bubbles
  - Convert Folders → Hierarchy
  - Convert Systems → Templates
- [ ] Data validation
  - Test migration
  - Verify integrity
- [ ] Offline sync
  - Local-first storage
  - Conflict resolution

### Phase 14: Polish & Launch (Week 27-28)
**Goal:** Final refinements and release

- [ ] Performance optimization
  - Query optimization
  - Lazy loading
  - Caching strategies
- [ ] Bug fixes
  - Edge cases
  - Error handling
- [ ] User testing
  - Beta group
  - Feedback iteration
- [ ] Documentation
  - User guide
  - Video tutorials
  - In-app help
- [ ] Launch preparation
  - Marketing materials
  - App store assets
  - Announcement plan

---

## Success Criteria

### Bubble System Can:
- ✅ Replace Notes (multi-format entries)
- ✅ Replace Folders (parent-child hierarchy)
- ✅ Replace Systems (GTD/PARA/Kanban templates)
- ✅ Add Spatial organization (2D canvas)
- ✅ Add Temporal evolution (timeline)
- ✅ Add Connections (typed relationships)
- ✅ Add Scheduling (calendar/planner integration)
- ✅ Add Persistence (recurring templates)
- ✅ Add Collaboration (messages, real-time updates)
- ✅ Add AI (full system agent)

### When Successful:
1. Keep Bubble Playground working alongside old system
2. User testing with both systems available
3. Gradual migration of users to Bubble system
4. Monitor feedback and metrics
5. If successful after 2-4 weeks:
   - Delete old Notes system
   - Delete old Folders system
   - Delete old Systems system
   - Bubble Playground becomes main interface
6. If issues arise:
   - Keep both systems
   - Iterate on Bubble system
   - Try again when ready

---

## Open Questions

### 1. Persistent Template Completion
For persistent template bubbles, should they:
- **A**: Require manual completion (employee must mark "Complete")?
- **B**: Auto-complete when all tasks checked?
- **C**: Both options (configurable per template)?

**Recommendation:** Option C - Let user configure per template

### 2. Manager Permissions
Should managers be able to:
- **A**: View only (see progress, can't edit)
- **B**: View + edit (can help complete tasks)
- **C**: View + edit + reassign (full control)

**Recommendation:** Option C - Full permissions with role-based controls

### 3. Overdue Instance Behavior
If instance not completed by next scheduled time:
- **A**: Create new instance anyway (employee now has 2)
- **B**: Don't create new until old one complete
- **C**: Create new, mark old as "Skipped/Overdue"

**Recommendation:** Option C - Track skipped instances for analytics

### 4. Calendar/Planner Filtering
Should scheduled bubbles be:
- **A**: Always visible in Calendar/Planner (can't hide)
- **B**: Toggleable (user can show/hide scheduled bubbles)
- **C**: Filterable (can filter by bubble type, system, etc.)

**Recommendation:** Option C - Maximum flexibility

### 5. Recurring Bubble Instances
When a bubble is scheduled to recur (like "Daily Reflection"):
- **A**: Single bubble appears every day (same instance)
- **B**: New bubble instance created each day (separate entries)
- **C**: User choice (can pick per bubble)

**Recommendation:** Option C - Different use cases need different behaviors

---

## Technical Notes

### Database Schema Updates Needed

```sql
-- Enhanced bubbles table
ALTER TABLE bubbles ADD COLUMN hierarchy_type TEXT;
ALTER TABLE bubbles ADD COLUMN depth INTEGER DEFAULT 0;
ALTER TABLE bubbles ADD COLUMN importance INTEGER DEFAULT 3;
ALTER TABLE bubbles ADD COLUMN system_id TEXT;
ALTER TABLE bubbles ADD COLUMN position_x REAL DEFAULT 0;
ALTER TABLE bubbles ADD COLUMN position_y REAL DEFAULT 0;
ALTER TABLE bubbles ADD COLUMN timeline_stage TEXT DEFAULT 'present';

-- New tables
CREATE TABLE bubble_entries (
  id TEXT PRIMARY KEY,
  bubble_id TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT,
  format_data TEXT,
  position INTEGER,
  timestamp INTEGER,
  FOREIGN KEY (bubble_id) REFERENCES bubbles (id)
);

CREATE TABLE bubble_connections (
  id TEXT PRIMARY KEY,
  from_bubble_id TEXT NOT NULL,
  to_bubble_id TEXT NOT NULL,
  type TEXT NOT NULL,
  strength REAL DEFAULT 1.0,
  label TEXT,
  FOREIGN KEY (from_bubble_id) REFERENCES bubbles (id),
  FOREIGN KEY (to_bubble_id) REFERENCES bubbles (id)
);

CREATE TABLE timeline_blocks (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  bubble_id TEXT,
  changes TEXT,
  timestamp INTEGER,
  user_id TEXT
);

CREATE TABLE bubble_schedules (
  id TEXT PRIMARY KEY,
  bubble_id TEXT NOT NULL,
  type TEXT NOT NULL,
  date INTEGER,
  time TEXT,
  days_of_week TEXT,
  day_of_month INTEGER,
  custom_pattern TEXT,
  reminder_minutes_before INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER,
  FOREIGN KEY (bubble_id) REFERENCES bubbles (id)
);

CREATE TABLE recurring_templates (
  id TEXT PRIMARY KEY,
  template_bubble_id TEXT NOT NULL,
  schedule_type TEXT NOT NULL,
  schedule_time TEXT,
  schedule_days TEXT,
  instance_behavior TEXT NOT NULL,
  archive_on_complete INTEGER DEFAULT 0,
  retention_days INTEGER,
  assigned_to TEXT,
  enable_realtime INTEGER DEFAULT 0,
  on_complete_actions TEXT,
  FOREIGN KEY (template_bubble_id) REFERENCES bubbles (id)
);

CREATE TABLE bubble_instances (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  instance_date INTEGER NOT NULL,
  started_at INTEGER,
  completed_at INTEGER,
  completed_by TEXT,
  status TEXT DEFAULT 'active',
  content TEXT,
  triggers_fired TEXT,
  FOREIGN KEY (template_id) REFERENCES recurring_templates (id)
);

CREATE TABLE media_attachments (
  id TEXT PRIMARY KEY,
  bubble_id TEXT NOT NULL,
  type TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  url TEXT,
  thumbnail_url TEXT,
  uploaded_at INTEGER,
  uploaded_by TEXT,
  FOREIGN KEY (bubble_id) REFERENCES bubbles (id)
);
```

### State Management Updates

Add to Zustand store:
- `bubbles` array (replaces notes)
- `bubbleConnections` array
- `timelineBlocks` array
- `bubbleSchedules` array
- `recurringTemplates` array
- `bubbleInstances` array
- `mediaAttachments` array
- `organizationSystems` array

### Performance Considerations

- **Lazy loading** for large bubble lists
- **Virtualization** for timeline view
- **Indexed queries** for fast search
- **Caching** for frequently accessed bubbles
- **Debouncing** for real-time updates
- **Pagination** for archive views

---

## Conclusion

This document captures the complete vision and implementation plan for the unified Bubble system. The architecture is designed to be:

- **Flexible** - Bubbles can be anything
- **Hierarchical** - Unlimited depth of organization
- **Connected** - Rich relationships between bubbles
- **Temporal** - Time-aware and evolving
- **Collaborative** - Built for teams
- **Intelligent** - AI-powered automation
- **Business-ready** - Persistent templates for processes

The roadmap is aggressive but achievable with focused execution. The key is to build incrementally, validate each phase, and maintain backward compatibility until the new system proves superior.

**Next Steps:**
1. Review and approve this document
2. Begin Phase 1: Foundation (type system updates)
3. Build iteratively, testing at each phase
4. Gather user feedback early and often
5. Migrate when ready, delete when confident

🫧✨ **Let's build the future of productivity!**
