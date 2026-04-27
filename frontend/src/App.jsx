import { useEffect, useState } from 'react';
import './App.css'; 

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const columns = ["todo", "in_progress", "done"];


  useEffect(() => {
    fetch('http://localhost:8000/tasks')
      .then((res) => res.json())
      .then((data) => setTasks(data));
  }, []);

 
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); 
  };

  const handleDrop = async (e, newStatus) => {
    const taskId = parseInt(e.dataTransfer.getData("taskId"));

    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    ));

    await fetch(`http://localhost:8000/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
  };

  // Handler for adding a new task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const response = await fetch('http://localhost:8000/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTaskTitle })
    });
    
    const createdTask = await response.json();
    setTasks([...tasks, createdTask]);
    setNewTaskTitle(""); 
  };

  // Handler for deleting a task
  const handleDelete = async (taskId) => {
    // Optimistic UI update
    setTasks(prev => prev.filter(t => t.id !== taskId));

    // Delete in Python backend
    await fetch(`http://localhost:8000/tasks/${taskId}`, {
      method: 'DELETE'
    });
  };

  return (
    <div className="app-container">
      <h1>Custom Kanban 🚀</h1>

      <form onSubmit={handleAddTask} className="task-form">
        <input 
          type="text" 
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="task-input"
        />
        <button type="submit" className="submit-btn">
          Add Task
        </button>
      </form>
      
      <div className="board">
        {columns.map(status => (
          <div 
            key={status}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
            className="column"
          >
            <h3 className="column-title">{status.replace('_', ' ')}</h3>
            
            {tasks.filter(t => t.status === status).map(task => (
              <div 
                key={task.id} 
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                className="task-card"
              >
                {task.title}

                {/* Delete Button */}
                <button 
                  className="delete-btn"
                  onClick={() => handleDelete(task.id)}
                  title="Delete task"
                >
                  ✖
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;