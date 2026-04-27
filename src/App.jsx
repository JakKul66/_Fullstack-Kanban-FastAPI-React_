import { useEffect, useState } from 'react';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState(""); // State for new task input
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

  // Handle submitting new task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    // Send POST request to backend
    const response = await fetch('http://localhost:8000/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTaskTitle })
    });
    
    const createdTask = await response.json();
    
    // Update UI with the task returned from backend
    setTasks([...tasks, createdTask]);
    setNewTaskTitle(""); // Clear input
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Kanban Board 🚀</h1>

      {/* Form to add new tasks */}
      <form onSubmit={handleAddTask} style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="What needs to be done?"
          style={{ padding: '10px', width: '300px', marginRight: '10px' }}
        />
        <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Add Task
        </button>
      </form>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        {columns.map(status => (
          <div 
            key={status}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
            style={{ background: '#f4f5f7', padding: '15px', borderRadius: '8px', minWidth: '250px' }}
          >
            <h3>{status.toUpperCase().replace('_', ' ')}</h3>
            
            {tasks.filter(t => t.status === status).map(task => (
              <div 
                key={task.id} 
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                style={{ 
                  background: 'white', 
                  padding: '10px', 
                  margin: '10px 0', 
                  borderRadius: '4px', 
                  cursor: 'grab',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)' 
                }}
              >
                {task.title}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;