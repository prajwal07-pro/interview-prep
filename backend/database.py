from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Replace this with the POOLER string from Supabase (Port 6543)
SQLALCHEMY_DATABASE_URL = "postgresql://postgres.gndglqzkehrrhrxtlmxd:hJPzwmZPgLSRywQE@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()