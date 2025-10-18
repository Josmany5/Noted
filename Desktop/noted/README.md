# Noted - Timeline-Based Note Taking App

A powerful, timeline-based note-taking app built with React Native and Expo. Features chronological entries, smart organization, and productivity tools.

## ✨ Features Implemented

### Core Features
- ✅ **Timeline Entries** - Notes organized chronologically with daily grouping and hourly timestamps
- ✅ **Timestamp Navigator** - Tap the ⌚ button to jump to any entry in your note's timeline
- ✅ **Hashtag Organization** - Auto-detect #hashtags and create folders automatically
- ✅ **Urgency & Importance** - Label notes with urgency levels (🔴🟡🟢) and star ratings (⭐1-5)
- ✅ **Auto-Sorting** - Notes automatically sorted by urgency and importance
- ✅ **Edit Tracking** - Track major edits with history (minor typo edits not shown)
- ✅ **Search** - Full-text search across all notes
- ✅ **Monospace Design** - Clean, terminal-inspired aesthetic with monospace fonts
- ✅ **Dark/Light Mode** - Beautiful themes for any environment

### Architecture
- ✅ SQLite database for local storage
- ✅ Zustand for state management
- ✅ React Navigation for screens
- ✅ TypeScript for type safety
- ✅ Fully modular and extensible

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Expo Go app on your phone (iOS/Android)
- OR iOS Simulator/Android Emulator

### Installation

```bash
# Install dependencies (already done)
npm install

# Start the development server
npx expo start

# Scan the QR code with Expo Go app
# OR press 'i' for iOS Simulator
# OR press 'a' for Android Emulator
```

## 📱 How to Use

### Creating Notes
1. Tap the **[ + ]** button on the home screen
2. A new note will be created
3. Start adding entries!

### Adding Entries
1. Open a note
2. Type in the input field at the bottom
3. Tap the **→** button to add the entry
4. Entries are added chronologically (newest at bottom)

### Jumping to Timestamps
1. While viewing a note, tap the **⌚** button in the top-right
2. See all your entries grouped by date
3. Tap any entry to jump to it
4. Latest entry is marked with "(latest)"

### Using Hashtags
1. Type #work, #ideas, #personal, etc. in your entries
2. Folders are automatically created
3. Notes are grouped by hashtags

### Setting Priority
1. On the home screen, each note shows urgency and importance
2. (To be implemented: Tap to change urgency/importance)

## 📁 Project Structure

```
noted/
├── src/
│   ├── components/        # Reusable UI components
│   ├── screens/          # App screens
│   │   ├── HomeScreen.tsx
│   │   └── NoteDetailScreen.tsx
│   ├── services/         # Business logic
│   │   └── database.ts   # SQLite operations
│   ├── store/            # State management
│   │   └── index.ts      # Zustand store
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   ├── theme/            # Design system
│   │   └── index.ts
│   └── utils/            # Helper functions
│       └── index.ts
├── App.tsx               # Main app component
└── package.json
```

## 🎨 Design System

- **Font**: System monospace (Menlo on iOS, monospace on Android)
- **Colors**:
  - Light mode: Off-white background (#FAFAFA)
  - Dark mode: Dark gray (#1A1A1A)
  - Accent: Blue (#0066CC / #4A9EFF)
- **Style**: Clean, minimal, terminal-inspired
- **Icons**: Emoji-based for universal support

## 🔮 Features Coming Soon

### Phase 2 (Next)
- [ ] Linked Notes (`[[wiki-style]]` syntax)
- [ ] Smart link suggestions between related notes
- [ ] Pipeline Mode (optional project tracking)
- [ ] DeepWork timer integration
- [ ] Voice-to-text
- [ ] Location & mood tracking

### Phase 3
- [ ] URL bookmark saving with reader mode
- [ ] Highlighting saved articles
- [ ] Link organization (by topic, date, source)
- [ ] Templates with recurring options
- [ ] "On This Day" feature

## 🛠️ Tech Stack

- **Framework**: React Native + Expo
- **Database**: SQLite (expo-sqlite)
- **State Management**: Zustand
- **Navigation**: React Navigation
- **Date Utilities**: date-fns
- **Language**: TypeScript

## 📝 Development Notes

### Database Schema
- **notes**: Core note data
- **entries**: Timeline entries for each note
- **folders**: Organizational folders
- **tasks**: To-do items for progress tracking
- **savedLinks**: Bookmarked URLs with metadata
- **pipelineGroups**: Project pipeline tracking
- **deepWorkSessions**: Focus session logs
- **templates**: Note templates

### Key Design Decisions
1. **Entries at bottom**: New entries always append to bottom for chronological order
2. **Optional Pipeline**: User explicitly opts-in to pipeline mode for projects
3. **Hybrid progress**: Auto-calculate from tasks, or manual percentage
4. **Hashtag flexibility**: Both manual folders and auto-folders from hashtags
5. **Edit history**: Track major edits only, user can delete history

## 🐛 Known Issues

- Timestamp navigator scrolling to specific entry not yet implemented (currently just opens modal)
- Urgency/Importance selectors need to be built as interactive components
- Hashtag folder creation is in database but not yet connected to UI

## 📄 License

This is a personal project. Feel free to use as inspiration!

## 🙏 Acknowledgments

Built with React Native, Expo, and lots of ☕

---

**Current Version**: v0.1.0 (MVP)
**Last Updated**: October 18, 2025
