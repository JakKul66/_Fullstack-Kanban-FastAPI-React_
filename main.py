from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, Session, declarative_base

# 1. Database Configuration (SQLite)
SQLALCHEMY_DATABASE_URL = "sqlite:///./kanban.db"

# connect_args={"check_same_thread": False} is needed only for SQLite in FastAPI
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 2. SQLAlchemy Model (This creates the actual table in the database)
class TaskDB(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    status = Column(String, default="todo")

# Automatically create tables when the app starts
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Dependency Injection: Get database session per request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 4. Pydantic Models (For data validation and API documentation)
class TaskBase(BaseModel):
    title: str
    status: str = "todo"

class TaskUpdate(BaseModel):
    status: str

class TaskResponse(BaseModel):
    id: int
    title: str
    status: str
    
    class Config:
        from_attributes = True # Tells Pydantic to read data from SQLAlchemy object

# 5. Endpoints
@app.get("/tasks", response_model=list[TaskResponse])
def get_tasks(db: Session = Depends(get_db)):
    return db.query(TaskDB).all()

@app.post("/tasks", response_model=TaskResponse)
def create_task(task: TaskBase, db: Session = Depends(get_db)):
    new_task = TaskDB(title=task.title, status=task.status)
    db.add(new_task)
    db.commit()
    db.refresh(new_task) # Get the generated ID back from DB
    return new_task

@app.patch("/tasks/{task_id}", response_model=TaskResponse)
def update_task_status(task_id: int, task_update: TaskUpdate, db: Session = Depends(get_db)):
    db_task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db_task.status = task_update.status
    db.commit()
    db.refresh(db_task)
    return db_task

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if db_task:
        db.delete(db_task)
        db.commit()
    return {"message": "Task deleted successfully"}