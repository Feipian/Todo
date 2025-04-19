import AsyncStorage from '@react-native-async-storage/async-storage';
import { ObservablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage';
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';
import { configureObservablePersistence, persistObservable } from '@legendapp/state/persist';
import { observable, computed } from '@legendapp/state';
import { Platform } from 'react-native';

// Configure persistence based on platform
if (Platform.OS === 'web') {
  // Use localStorage for web
  configureObservablePersistence({
    pluginLocal: ObservablePersistLocalStorage
  });
} else {
  // Use AsyncStorage for native platforms
  configureObservablePersistence({
    pluginLocal: ObservablePersistAsyncStorage,
    localOptions: {
      asyncStorage: {
        AsyncStorage,
      },
    },
  });
}

// Define interfaces
export interface Todo {
  id: string;
  task: string;
  timeRemaining: number;
  isRunning: boolean;
  completed: boolean;
  initialTime: number;
  userId: string;
}

export interface UserInfo {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

const defaultTodos: Todo[] = [
  {
    id: '1',
    task: '🎯 Learn Todo Timer App',
    timeRemaining: 300, // 5 minutes
    isRunning: false,
    completed: false,
    initialTime: 300,
    userId: ''
  },
  {
    id: '2',
    task: '📚 Complete First Task',
    timeRemaining: 180, // 3 minutes
    isRunning: false,
    completed: false,
    initialTime: 180,
    userId: ''
  }
];

// Define your state
export const state = observable({
  todos: [] as Todo[],
  userInfo: null as UserInfo | null,
  coins: 0,
  isLoading: true,
});

// Configure persistence for each part of the state
persistObservable(state.todos, {
  local: 'todos-storage'
});

persistObservable(state.userInfo, {
  local: 'user-info-storage'
});

persistObservable(state.coins, {
  local: 'coins-storage'
});

// Add this function to initialize default todos
export const initializeDefaultTodos = async (userId: string) => {
  try {
    // Get current todos for this user
    const currentTodos = state.todos.get().filter(todo => todo.userId === userId);
    
    // Only add default todos if user has no todos
    if (currentTodos.length === 0) {
      const todosWithUserId = defaultTodos.map(todo => ({
        ...todo,
        id: Date.now().toString() + Math.random(),
        userId
      }));
      state.todos.set(prev => [...prev, ...todosWithUserId]);
    }
  } catch (error) {
    console.error('Error initializing default todos:', error);
  }
};

// Define computed values
export const userTodos = computed(() => 
  state.todos.get().filter(todo => todo.userId === state.userInfo.get()?.id)
); 