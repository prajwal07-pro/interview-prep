from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models
from database import SessionLocal, engine

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configure CORS to allow your React app to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Update with your Vite frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get the DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/api/sessions/")
def create_session(
    role: str = Form(...),
    experience: str = Form(...),
    db: Session = Depends(get_db)
):
    new_session = models.InterviewSession(role=role, experience_level=experience)
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return {"session_id": new_session.id}

@app.post("/api/upload-video/")
async def upload_video(
    session_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Must be a video.")
    
    # Read the video file into memory
    video_bytes = await file.read()
    
    # Save to database
    db_video = models.VideoRecord(
        session_id=session_id,
        filename=file.filename,
        video_data=video_bytes
    )
    db.add(db_video)
    db.commit()
    
    return {"message": "Video uploaded and saved to database successfully"}