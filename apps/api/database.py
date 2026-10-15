from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from core.config import settings

# Some Postgres providers (Heroku-style connection strings, some of Render's
# older docs/examples) hand out "postgres://" URLs, but SQLAlchemy 1.4+ only
# recognizes the "postgresql://" scheme and raises on the old one -- normalize
# defensively rather than relying on every hosting provider using the new form.
SQLALCHEMY_DATABASE_URL = settings.SQLALCHEMY_DATABASE_URL
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = "postgresql://" + SQLALCHEMY_DATABASE_URL[len("postgres://"):]

# check_same_thread is a SQLite-only pysqlite arg; passing it to a Postgres
# (or any other) driver raises a TypeError, so it's only included when the
# configured URL is actually SQLite. Production points this at Postgres via
# the SQLALCHEMY_DATABASE_URL env var -- see database.py's role in
# render.yaml -- because SQLite's data file doesn't survive a redeploy on
# most hosting platforms' ephemeral filesystems.
connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

