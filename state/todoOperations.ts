import { state } from './store';
import { Todo } from './store';

export const addTodo = (task: string, time: string, userId: string) => {
  if (!task.trim() || !userId) return;
  
  const newTodo: Todo = {
    id: Date.now().toString(),
    task,
    timeRemaining: parseInt(time) * 60,
    isRunning: false,
    completed: false,
    initialTime: parseInt(time) * 60,
    userId
  };

  state.todos.set(prev => [...prev, newTodo]);
};

export const toggleTimer = (id: string) => {
  console.log('Toggling timer for todo:', id);
  state.todos.set(prev => {
    const updatedTodos = prev.map(todo => {
      if (todo.id === id) {
        console.log('Found todo to toggle:', todo);
        return { ...todo, isRunning: !todo.isRunning };
      }
      return todo;
    });
    console.log('Updated todos:', updatedTodos);
    return updatedTodos;
  });
};

export const restartTask = (id: string) => {
  state.todos.set(prev =>
    prev.map(todo => {
      if (todo.id === id) {
        return { ...todo, timeRemaining: todo.initialTime, isRunning: false, completed: false };
      }
      return todo;
    })
  );
};

export const deleteTask = (id: string) => {
  state.todos.set(prev => prev.filter(todo => todo.id !== id));
}; 