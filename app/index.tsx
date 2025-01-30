import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
} from 'react-native';

import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { initializeApp } from 'firebase/app';
import firebaseConfig from '../firebaseConfig';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

interface Todo {
  id: string;
  task: string;
  timeRemaining: number;
  isRunning: boolean;
  completed: boolean;
  initialTime: number;
}

const App = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [taskInput, setTaskInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [coins, setCoins] = useState<number>(0);

  // determent is mobile or not
  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android'

  useEffect(() => {
    const interval = setInterval(() => {
      setTodos(currentTodos =>
        currentTodos.map(todo => {
          if (todo.isRunning && todo.timeRemaining > 0) {
            return { ...todo, timeRemaining: todo.timeRemaining - 1 };
          } else if (todo.isRunning && todo.timeRemaining === 0 && !todo.completed) {
            setCoins(prevCoins => prevCoins + 10);
            return { ...todo, isRunning: false, completed: true };
          }
          return todo;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const addTodo = () => {
    const minutes = parseInt(timeInput);
    
    // Validate input
    if (!taskInput.trim()) {
      alert('Please enter a task name');
      return;
    }
    
    if (isNaN(minutes) || minutes <= 0) {
      alert('Please enter a valid time (greater than 0 minutes)');
      return;
    }

    const newTodo: Todo = {
      id: Date.now().toString(),
      task: taskInput,
      timeRemaining: minutes * 60,
      initialTime: minutes * 60,
      isRunning: false,
      completed: false,
    };
    setTodos([...todos, newTodo]);
    setTaskInput('');
    setTimeInput('');
  };

  const toggleTimer = (id: string) => {
    setTodos(currentTodos =>
      currentTodos.map(todo => {
        if (todo.id === id) {
          // If the clicked task is running, stop it
          return { ...todo, isRunning: !todo.isRunning };
        } else {
          // If another task is running, stop it
          return { ...todo, isRunning: false };
        }
      })
    );
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const restartTask = (id: string) => {
    setTodos(currentTodos =>
      currentTodos.map(todo => {
        if (todo.id === id) {
          return { ...todo, isRunning: false, completed: false, timeRemaining: todo.initialTime }; // Reset task
        }
        return todo;
      })
    );
  };

  const deleteTask = (id: string) => {
    setTodos(currentTodos => currentTodos.filter(todo => todo.id !== id)); // Remove task
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential) {
        const token = credential.accessToken;
        const user = result.user;
      }
    } catch (error: any) {
      console.error('Error during Google login:', error); // Log the error for debugging
      const errorCode = error.code;
      const errorMessage = error.message;
      const email = error.customData.email;
      const credential = GoogleAuthProvider.credentialFromError(error);
    }
  };

  const renderTodo = ({ item }: { item: Todo }) => (
    <View style={styles.todoContainer}>
      <Text style={styles.todoTitle}>{item.task}</Text>
      <Text style={styles.timerText}>{formatTime(item.timeRemaining)}</Text>
      {item.completed && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={() => restartTask(item.id)} style={styles.restartButton}>
            <Text style={styles.buttonText}>Restart</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteTask(item.id)} style={styles.deleteButton}>
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
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {!isMobile ? // PC web
            <View style={styles.titleContainer}>
            <Text style={styles.title}>Todo Timer</Text>
                <View style={styles.coinContainer}>
                    <Text style={styles.coinText}>🪙 {coins}</Text>
                </View>
            </View>
            : (
            <View>
                <View style={styles.headerMobileContainer}>
                    <Text style={styles.title_mobile}>Todo Timer</Text>

                    <View style={styles.coinContainer}>
                    <Text style={styles.coinText}>🪙 {coins}</Text>
                    </View>
                </View>
                
            </View>
        
            )
        }
      </View>
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
            // Only allow numeric input
            if (text === '' || /^\d+$/.test(text)) {
              setTimeInput(text);
            }
          }}
          keyboardType="numeric"
          maxLength={3} // Limit to 999 minutes
        />
        <TouchableOpacity 
          style={[
            styles.addButton,
            (!taskInput.trim() || !timeInput.trim()) && styles.disabledButton
          ]} 
          onPress={addTodo}
        >
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity 
        style={styles.loginButton} 
        onPress={loginWithGoogle}
      >
        <Text style={styles.buttonText}>Login with Google</Text>
      </TouchableOpacity>
      <FlatList
        data={todos}
        renderItem={renderTodo}
        keyExtractor={item => item.id}
        style={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    width: '100%',
  },
  title_mobile:{
    textAlign: 'center',
    flexDirection : 'row',
    fontSize: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
    backgroundColor: 'white',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  todoContainer: {
    marginBottom: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
  },
  todoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  restartButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    padding: 10,
    borderRadius: 5,
    flex: 1,
  },
  button: {
    padding: 8,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerMobileContainer :{
    flexDirection :'row',
    justifyContent: 'center',
    width: '100%',
  },
  coinContainer: {
    alignItems: 'center',
    backgroundColor: '#FFD700',
    padding: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginLeft: 20,
    width: 100,
  },
  coinText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 5,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
    marginVertical: 10,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    marginBottom: 20,
  },
});

export default App;

