import React, { useState, useEffect } from 'react';
import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { observer } from '@legendapp/state/react';
import { AuthSessionResult } from 'expo-auth-session';
import Constants from 'expo-constants';



import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  Image,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ObservablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage';
import { configureObservablePersistence } from '@legendapp/state/persist';
import { observable, computed } from '@legendapp/state';
import { state, userTodos, initializeDefaultTodos } from '../state/store';
import { addTodo, toggleTimer, restartTask, deleteTask, } from '../state/todoOperations';

import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';



interface Todo {
  id: string;
  task: string;
  timeRemaining: number;
  isRunning: boolean;
  completed: boolean;
  initialTime: number;
}

// Define a new interface for the user data
interface UserInfo {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

// Define the structure of the authentication object
interface Authentication {
  accessToken: string;
  idToken?: string; // Optional, depending on your needs
  // Add other properties if needed
}

type GoogleResponse = AuthSessionResult & {
  authentication?: {
    accessToken: string;
  };
};





const GOOGLE_CONFIG = {
  webClientId: "395792301872-6skqlqgjbcfsr46r7jrmjefhihnslnik.apps.googleusercontent.com",
  androidClientId: "395792301872-s48d9tdvvl9k48kervlmb4avp1trupur.apps.googleusercontent.com",
  // scopes: ['profile', 'email'],
  redirectUri:  makeRedirectUri({native: 'com.superwang0603.todo:'})
  // redirectUri: makeRedirectUri({
  //   scheme: "com.superwang0603.Todo",
  // isTripleSlashed: true,
  // })

};

WebBrowser.maybeCompleteAuthSession();



const App = observer(() => {
  const [taskInput, setTaskInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [coins, setCoins] = useState<number>(0);
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInProgress, setIsInProgress] = useState(false);


  // determent is mobile or not
  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android'

  const [request, response, promptAsync] = Google.useAuthRequest(GOOGLE_CONFIG);

  // GoogleSignin.configure({
  //   androidClientId: GOOGLE_CONFIG.androidClientId,
  // });

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTodos = state.todos.get();
      const updatedTodos = currentTodos.map(todo => {
        if (todo.isRunning && todo.timeRemaining > 0) {
          return { ...todo, timeRemaining: todo.timeRemaining - 1 };
        } else if (todo.isRunning && todo.timeRemaining === 0 && !todo.completed) {
          state.coins.set(prevCoins => prevCoins + 10);
          return { ...todo, isRunning: false, completed: true };
        }
        return todo;
      });
      state.todos.set(updatedTodos);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function handleSignInWithGoogle() {
      try {

        const user = AsyncStorage.getItem("@user");
        console.log("user: ", user)
        console.log(response)
        if (response?.type === "success" && response.authentication?.accessToken) {
          // Store the access token securely
          console.warn("set google_access_token")

          // Fetch and store user info
          await fetchUserInfo(response.authentication.accessToken);



        }
        else {
          // maybe alreay had login info
          setUserInfo(user);
        }

      } catch (error) {
        console.error("Error in handleSignInWithGoogle:", error);
        // Clear stored data on error
        await AsyncStorage.removeItem('@google_access_token');
        state.userInfo.set(null);
      }
    }

    handleSignInWithGoogle();
  }, [response]);

  // Load todos from AsyncStorage on app start
  useEffect(() => {
    const loadTodos = async () => {
      try {
        const savedTodos = await AsyncStorage.getItem('@todos');
        if (savedTodos) {
          const parsedTodos = JSON.parse(savedTodos);
          console.log("Loaded todos:", parsedTodos);
          state.todos.set(parsedTodos);
        }
      } catch (error) {
        console.error('Error loading todos:', error);
      } finally {
        state.isLoading.set(false);
      }
    };
    loadTodos();
  }, []);

  // Save todos to AsyncStorage whenever they change
  useEffect(() => {
    if (!state.isLoading.get()) {
      const saveTodos = async () => {
        try {
          const currentTodos = state.todos.get();
          console.log("Saving todos:", currentTodos);
          await AsyncStorage.setItem('@todos', JSON.stringify(currentTodos));
        } catch (error) {
          console.error('Error saving todos:', error);
        }
      };
      saveTodos();
    }
  }, [state.todos.get(), state.isLoading.get()]);

  // fetch google account info from token
  const fetchUserInfo = async (accessToken: string | undefined) => {
    if (!accessToken) {
      console.error('No access token available');
      return;
    }
    try {
      console.log("fetch userInfo")
      const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!userInfoResponse.ok) {
        console.warn('Failed to fetch user info');
        throw new Error('Failed to fetch user info');
        
      }

      const userData = await userInfoResponse.json();

      if (!userData.name || !userData.email) {
        console.error('Incomplete user data received:', userData);
        return;
      }

      await AsyncStorage.setItem("@user", JSON.stringify(userData))
      if (userData.name && userData.email) {
        state.userInfo.set({
          id: userData.id,
          displayName: userData.name,
          email: userData.email,
          photoURL: userData.picture
        });
      }

      // Initialize default todos only if this is user's first time
      await initializeDefaultTodos(userData.id);
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const TodoItem = observer(({ item }: { item: Todo }) => (
    <View style={styles.todoContainer}>
      <Text style={styles.todoTitle}>{item.task}</Text>
      <Text style={styles.timerText}>{formatTime(item.timeRemaining)}</Text>
      {item.completed && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={() => restartTask(item.id)}
            style={styles.restartButton}
          >
            <Text style={styles.buttonText}>Restart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => deleteTask(item.id)}
            style={styles.deleteButton}
          >
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
      {!item.completed &&
        <TouchableOpacity
          style={[styles.button, item.isRunning ? styles.stopButton : styles.startButton]}
          onPress={() => toggleTimer(item.id)}
        >
          <Text style={styles.buttonText}>
            {item.isRunning ? 'Stop' : 'Start'}
          </Text>
        </TouchableOpacity>
      }
    </View>
  ));

  const renderTodo = ({ item }: { item: Todo }) => <TodoItem item={item} />;

  const signIn = async () => {
    try {
      setIsInProgress(true);
      await GoogleSignin.hasPlayServices();
      const signInResult = await GoogleSignin.signIn() as any;
      if (signInResult?.idToken && signInResult?.user) {
        state.userInfo.set({
          id: signInResult.idToken,
          displayName: signInResult.user.name,
          email: signInResult.user.email
        });
        await initializeDefaultTodos(signInResult.idToken);
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
    } finally {
      setIsInProgress(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Todo Timer</Text>
          <View style={styles.coinContainer}>
            <Text style={styles.coinText}>🪙 {state.coins.get()}</Text>
          </View>
        </View>
      </View>

      {state.userInfo.get() && (
        <View style={styles.userInfoContainer}>
          {state.userInfo.get()?.photoURL && (
            <Image 
              source={{ uri: state.userInfo.get()?.photoURL }} 
              style={styles.profileImage}
            />
          )}
          <Text style={styles.userInfoText}>Welcome, {state.userInfo.get()?.displayName}!</Text>
          <Text style={styles.userInfoText}>{state.userInfo.get()?.email}</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter task"
          value={taskInput}
          onChangeText={setTaskInput}
        />
        <TextInput
          style={styles.input}
          placeholder="Minutes"
          value={timeInput}
          onChangeText={(text) => {
            if (text === '' || /^\d+$/.test(text)) {
              setTimeInput(text);
            }
          }}
          keyboardType="numeric"
          maxLength={3}
        />
        <TouchableOpacity
          style={[styles.addButton, (!taskInput.trim() || !timeInput.trim()) && styles.disabledButton]}
          onPress={() => {
            if (state.userInfo.get()) {
              addTodo(taskInput, timeInput, state.userInfo.get()!.id);
              setTaskInput('');
              setTimeInput('');
            }
          }}
        >
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
      </View>
      {!state.userInfo.get()?.id &&
        (
          <TouchableOpacity style={styles.button} onPress={() => promptAsync()}>
            <Text style={styles.buttonText}>Sign in with Google</Text>
          </TouchableOpacity>
        )
      }
      <FlatList
        data={userTodos.get()}
        renderItem={renderTodo}
        keyExtractor={item => item.id}
        style={styles.list}
      />
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: 'white',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 80,
  },
  userInfoContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 12,
    alignSelf: 'center',
  },
  userInfoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  todoContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  todoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginVertical: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  restartButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#FF5722',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  coinContainer: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 4,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  title_mobile: {
    textAlign: 'center',
    flexDirection: 'row',
    fontSize: 30,
  },
  headerMobileContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  list: {
    flex: 1,
  },
});

export default App;

