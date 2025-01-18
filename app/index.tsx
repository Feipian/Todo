import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';

interface Todo {
  id: string;
  task: string;
  timeRemaining: number;
  isRunning: boolean;
}

const App = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [taskInput, setTaskInput] = useState('');
  const [timeInput, setTimeInput] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setTodos(currentTodos =>
        currentTodos.map(todo => {
          if (todo.isRunning && todo.timeRemaining > 0) {
            return { ...todo, timeRemaining: todo.timeRemaining - 1 };
          }
          return todo;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const addTodo = () => {
    if (taskInput.trim() && timeInput.trim()) {
      const newTodo: Todo = {
        id: Date.now().toString(),
        task: taskInput,
        timeRemaining: parseInt(timeInput) * 60, // Convert minutes to seconds
        isRunning: false,
      };
      setTodos([...todos, newTodo]);
      setTaskInput('');
      setTimeInput('');
    }
  };

  const toggleTimer = (id: string) => {
    setTodos(currentTodos =>
      currentTodos.map(todo =>
        todo.id === id ? { ...todo, isRunning: !todo.isRunning } : todo
      )
    );
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderTodo = ({ item }: { item: Todo }) => (
    <View style={styles.todoItem}>
      <Text style={styles.todoText}>{item.task}</Text>
      <Text style={styles.timerText}>{formatTime(item.timeRemaining)}</Text>
      <TouchableOpacity
        style={[styles.button, item.isRunning ? styles.stopButton : styles.startButton]}
        onPress={() => toggleTimer(item.id)}
      >
        <Text style={styles.buttonText}>
          {item.isRunning ? 'Stop' : 'Start'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Todo Timer</Text>
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
          onChangeText={setTimeInput}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.addButton} onPress={addTodo}>
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
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
  todoItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  todoText: {
    flex: 1,
    fontSize: 16,
  },
  timerText: {
    fontSize: 16,
    marginRight: 10,
    fontWeight: 'bold',
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
});

export default App;

