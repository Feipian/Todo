# Todo Timer App

A React Native application that helps users manage their tasks with built-in timers and rewards system.

## Features

- 🎯 Task Management
  - Create and manage tasks with custom timers
  - Start/Stop timer for each task
  - Mark tasks as completed
  - Restart or delete completed tasks

- 🪙 Reward System
  - Earn coins for completing tasks
  - Visual coin counter
  - Progress tracking

- 🔐 Authentication
  - Google Sign-In integration
  - Secure user data storage
  - Profile picture display

- 📱 Cross-Platform
  - Works on both Android and iOS
  - Responsive design for different screen sizes
  - Native performance

## Tech Stack

- React Native
- TypeScript
- Expo
- Google Sign-In
- AsyncStorage for data persistence
- Legend State for state management

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd Todo
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Configure Google Sign-In:
   - Create a project in Google Cloud Console
   - Configure OAuth 2.0 credentials
   - Update the client IDs in `app/index.tsx`:
     ```javascript
     const GOOGLE_CONFIG = {
       webClientId: "your-web-client-id",
       androidClientId: "your-android-client-id",
       scopes: ['profile', 'email'],
       redirectUri: makeRedirectUri({native: 'com.superwang0603.todo:'})
     };
     ```

4. Start the development server:
```bash
npx expo start
```

## Building for Production

### Android
```bash
eas build --platform android
```

### iOS
```bash
eas build --platform ios
```

## Project Structure

```
Todo/
├── app/
│   └── index.tsx          # Main application component
├── state/
│   ├── store.ts           # State management
│   └── todoOperations.ts  # Todo-related operations
├── android/               # Android-specific files
├── ios/                   # iOS-specific files
└── package.json          # Project dependencies
```

## State Management

The app uses Legend State for state management with the following main state objects:

```typescript
state = {
  todos: [],              // Array of todo items
  userInfo: null,         // Current user information
  coins: 0,              // User's coin balance
  isLoading: true        // Loading state
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- React Native team
- Expo team
- Google Sign-In team
- Legend State team