from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Replace [YOUR-PASSWORD] with your actual Supabase DB password
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:[YOUR-PASSWORD]@db.gndglqzkehrrhrxtlmxd.supabase.co:5432/postgres"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()