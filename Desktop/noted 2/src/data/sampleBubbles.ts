// ============================================
// PROSE - Sample Bubbles for Playground
// ============================================

import { Bubble } from '../types/bubble';

export const SAMPLE_BUBBLES: Bubble[] = [
  // Note Bubble
  {
    id: 'bubble-1',
    type: 'note',
    title: 'Sample Note Bubble',
    content: 'This is what a note bubble looks like. It contains timeline entries with timestamps.',
    emoji: '📝',
    color: '#4A90E2',
    position: { x: 50, y: 100 },
    createdAt: new Date(Date.now() - 7200000), // 2 hours ago
    updatedAt: new Date(),
    tags: ['sample', 'demo'],
    typeData: {
      entries: [
        {
          timestamp: new Date(Date.now() - 7200000),
          content: 'First entry: Started exploring the bubble concept'
        },
        {
          timestamp: new Date(Date.now() - 3600000),
          content: 'Second entry: Learning how bubbles can contain multiple entries'
        },
        {
          timestamp: new Date(),
          content: 'Latest entry: Understanding the timeline system'
        }
      ]
    },
    connections: [],
    childBubbleIds: []
  },

  // Task Bubble
  {
    id: 'bubble-2',
    type: 'task',
    title: 'Complete Bubble Prototype',
    content: 'Build the bubble playground screen to test and visualize the concept',
    emoji: '✅',
    color: '#50E3C2',
    position: { x: 50, y: 250 },
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date(),
    tags: ['development', 'prototype', 'urgent'],
    typeData: {
      isCompleted: false,
      dueDate: new Date(Date.now() + 86400000), // Tomorrow
      priority: 'high' as const,
      steps: [
        {
          id: 'step-1',
          description: 'Create Bubble component',
          isCompleted: true,
          createdAt: new Date(Date.now() - 86400000)
        },
        {
          id: 'step-2',
          description: 'Add interactions (expand, connect)',
          isCompleted: false,
          createdAt: new Date(Date.now() - 86400000)
        },
        {
          id: 'step-3',
          description: 'Test with user and gather feedback',
          isCompleted: false,
          createdAt: new Date(Date.now() - 86400000)
        }
      ]
    },
    connections: [
      {
        id: 'conn-1',
        targetBubbleId: 'bubble-1',
        connectionType: 'depends_on'
      }
    ],
    childBubbleIds: []
  },

  // Project Bubble
  {
    id: 'bubble-3',
    type: 'project',
    title: 'Build PROSE App',
    content: 'Complete productivity app with revolutionary bubble system',
    emoji: '🚀',
    color: '#F5A623',
    position: { x: 50, y: 400 },
    createdAt: new Date(Date.now() - 30 * 86400000), // 30 days ago
    updatedAt: new Date(),
    tags: ['project', 'main', 'prose'],
    typeData: {
      progress: 60,
      milestones: [
        {
          id: 'milestone-1',
          title: 'Core note-taking features',
          isCompleted: true,
          dueDate: new Date(Date.now() - 15 * 86400000)
        },
        {
          id: 'milestone-2',
          title: 'Bubble system prototype',
          isCompleted: false,
          dueDate: new Date(Date.now() + 5 * 86400000)
        },
        {
          id: 'milestone-3',
          title: 'Universe View',
          isCompleted: false,
          dueDate: new Date(Date.now() + 20 * 86400000)
        }
      ],
      teamMembers: ['You', 'AI Assistant'],
      startDate: new Date(Date.now() - 30 * 86400000),
      endDate: new Date(Date.now() + 60 * 86400000)
    },
    connections: [
      {
        id: 'conn-2',
        targetBubbleId: 'bubble-2',
        connectionType: 'part_of'
      }
    ],
    childBubbleIds: ['bubble-1', 'bubble-2']
  },

  // Goal Bubble
  {
    id: 'bubble-4',
    type: 'goal',
    title: 'Launch PROSE to 10K Users',
    content: 'Get PROSE app to 10,000 active users within 6 months of launch',
    emoji: '🎯',
    color: '#BD10E0',
    position: { x: 50, y: 550 },
    createdAt: new Date(Date.now() - 60 * 86400000),
    updatedAt: new Date(),
    tags: ['goal', 'growth', 'milestone'],
    typeData: {
      progress: 25,
      target: '10,000 active users',
      deadline: new Date(Date.now() + 120 * 86400000),
      milestones: [
        'Launch beta version',
        'Get first 1000 users',
        'Achieve product-market fit',
        'Scale to 10K users'
      ]
    },
    connections: [
      {
        id: 'conn-3',
        targetBubbleId: 'bubble-3',
        connectionType: 'inspired_by'
      }
    ],
    childBubbleIds: ['bubble-3']
  },

  // Journal Bubble
  {
    id: 'bubble-5',
    type: 'journal',
    title: 'Daily Reflections',
    content: 'Personal journal entries tracking thoughts and progress',
    emoji: '📔',
    color: '#7ED321',
    position: { x: 50, y: 700 },
    createdAt: new Date(Date.now() - 5 * 86400000),
    updatedAt: new Date(),
    tags: ['journal', 'personal', 'reflection'],
    typeData: {
      entries: [
        {
          timestamp: new Date(Date.now() - 86400000 * 2),
          content: 'Feeling excited about the bubble concept. It could really change how people organize their thoughts.',
          mood: '😊'
        },
        {
          timestamp: new Date(Date.now() - 86400000),
          content: 'Made good progress today. The spatial canvas idea is coming together.',
          mood: '🚀'
        },
        {
          timestamp: new Date(),
          content: 'Testing the prototype today. Nervous but optimistic!',
          mood: '🤔'
        }
      ],
      currentMood: '🤔'
    },
    connections: [],
    childBubbleIds: []
  },

  // Ideas Bubble
  {
    id: 'bubble-6',
    type: 'ideas',
    title: 'Feature Ideas Brainstorm',
    content: 'Collection of ideas for PROSE features',
    emoji: '🔥',
    color: '#FF6B6B',
    position: { x: 50, y: 850 },
    createdAt: new Date(Date.now() - 10 * 86400000),
    updatedAt: new Date(),
    tags: ['ideas', 'brainstorm', 'features'],
    typeData: {
      ideas: [
        'AI-powered bubble clustering by topic',
        'Voice notes that transcribe automatically',
        'Collaborative bubbles with real-time editing',
        'Gamification with XP and achievements',
        'Dark mode themes for different moods',
        'Export bubbles as mind maps'
      ]
    },
    connections: [
      {
        id: 'conn-4',
        targetBubbleId: 'bubble-3',
        connectionType: 'related_to'
      }
    ],
    childBubbleIds: []
  },

  // Document Bubble
  {
    id: 'bubble-7',
    type: 'document',
    title: 'PROSE Product Brief',
    content: 'Comprehensive document outlining PROSE vision, features, and roadmap',
    emoji: '📄',
    color: '#4A4A4A',
    position: { x: 50, y: 1000 },
    createdAt: new Date(Date.now() - 20 * 86400000),
    updatedAt: new Date(Date.now() - 5 * 86400000),
    tags: ['document', 'product', 'planning'],
    typeData: {
      content: '# PROSE Product Brief\n\n## Vision\nPROSE is a revolutionary productivity platform that uses "bubbles" - flexible, living containers that can represent any type of content...',
      wordCount: 2500,
      readingTimeMinutes: 10
    },
    connections: [
      {
        id: 'conn-5',
        targetBubbleId: 'bubble-3',
        connectionType: 'part_of'
      }
    ],
    childBubbleIds: []
  }
];

// Bubble type metadata for display
export const BUBBLE_TYPE_INFO = {
  note: { label: 'Note', emoji: '📝', color: '#4A90E2', description: 'Timeline-based notes with entries' },
  task: { label: 'Task', emoji: '✅', color: '#50E3C2', description: 'Tasks with steps and due dates' },
  project: { label: 'Project', emoji: '🚀', color: '#F5A623', description: 'Multi-milestone projects with progress tracking' },
  goal: { label: 'Goal', emoji: '🎯', color: '#BD10E0', description: 'Long-term goals with targets' },
  journal: { label: 'Journal', emoji: '📔', color: '#7ED321', description: 'Personal journal entries with mood tracking' },
  library: { label: 'Library', emoji: '📚', color: '#9013FE', description: 'Collection of links, articles, and resources' },
  ideas: { label: 'Ideas', emoji: '🔥', color: '#FF6B6B', description: 'Brainstorm list of ideas' },
  document: { label: 'Document', emoji: '📄', color: '#4A4A4A', description: 'Rich text documents' },
  planner: { label: 'Planner', emoji: '🗓️', color: '#5AC8FA', description: 'Calendar and event planning' },
  tracker: { label: 'Tracker', emoji: '📈', color: '#FF9500', description: 'Metrics and habit tracking' },
  meeting: { label: 'Meeting', emoji: '💬', color: '#8E8E93', description: 'Meeting notes with attendees and agenda' },
  workout: { label: 'Workout', emoji: '💪', color: '#FF3B30', description: 'Exercise logs with sets, reps, and duration' },
  budget: { label: 'Budget', emoji: '💰', color: '#34C759', description: 'Financial tracking with income and expenses' }
};

// Connection type metadata
export const CONNECTION_TYPE_INFO = {
  inspired_by: { label: 'Inspired by', icon: '💡', color: '#F5A623' },
  depends_on: { label: 'Depends on', icon: '🔗', color: '#FF6B6B' },
  part_of: { label: 'Part of', icon: '🧩', color: '#4A90E2' },
  related_to: { label: 'Related to', icon: '↔️', color: '#7ED321' },
  blocks: { label: 'Blocks', icon: '🚧', color: '#FF3B30' },
  references: { label: 'References', icon: '📎', color: '#8E8E93' },
  evolved_from: { label: 'Evolved from', icon: '🔄', color: '#BD10E0' }
};
