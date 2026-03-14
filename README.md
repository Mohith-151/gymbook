# GymBook 💪

A personal workout tracking app built with React Native and Expo.

## Features

- **Session Tracking** — Add exercises, track sets, and lock your session when done
- **Exercise Library** — Save your go-to exercises with default sets and reps
- **Templates** — Create workout templates like "Push Day" to load quickly into sessions
- **Heatmap** — GitHub-style quarterly consistency heatmap starting from Jan 1, 2026
- **Streak Counter** — Tracks consecutive days with locked sessions
- **Light / Dark Theme** — Toggle between themes, preference saved automatically

## Tech Stack

- React Native + Expo SDK 54 (TypeScript)
- expo-router for navigation
- AsyncStorage for local data persistence
- EAS Build for APK generation

## Getting Started

1. Install dependencies
   ```bash
   npm install --legacy-peer-deps
   ```

2. Start the app
   ```bash
   npx expo start
   ```

3. Scan the QR code with Expo Go on Android to preview

## Build APK

```bash
eas build -p android --profile preview
```

Download the APK from [expo.dev](https://expo.dev) after the build completes.

## Project Structure

```
gymbook/
├── app/
│   ├── _layout.tsx          # Root layout with ThemeProvider
│   └── (tabs)/
│       ├── _layout.tsx      # Tab navigator
│       ├── index.tsx        # Home screen (heatmap + today)
│       ├── session.tsx      # Session tracking
│       ├── templates.tsx    # Workout templates
│       └── library.tsx      # Exercise library
├── constants/
│   ├── theme.ts             # Light and dark color themes
│   └── ThemeContext.tsx     # Global theme state
└── store/
    └── storage.ts           # AsyncStorage data layer
```
