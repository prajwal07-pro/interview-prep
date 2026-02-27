from sqlalchemy import Column, Integer, String, LargeBinary, ForeignKey
from database import Base

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String)
    experience_level = Column(String)
    interview_type = Column(String)
    difficulty = Column(String)

class VideoRecord(Base):
    __tablename__ = "video_records"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"))
    filename = Column(String)
    # Storing the actual video bytes in the database
    video_data = Column(LargeBinary)