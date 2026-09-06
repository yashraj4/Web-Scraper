__all__ = ["Base", "engine", "get_db", "Project", "Template", "ScrapeJob", "Record"]

from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class JobStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    templates = relationship("Template", back_populates="project", cascade="all, delete-orphan")
    jobs = relationship("ScrapeJob", back_populates="project", cascade="all, delete-orphan")


class Template(Base):
    __tablename__ = "templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    url_pattern = Column(String(500), nullable=True)
    base_url = Column(String(500), nullable=False)
    selectors = Column(JSON, nullable=False, default=dict)
    site_type = Column(String(50), default="generic")
    scraping_method = Column(String(20), default="cloudscraper")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    project = relationship("Project", back_populates="templates")
    jobs = relationship("ScrapeJob", back_populates="template")


class ScrapeJob(Base):
    __tablename__ = "scrape_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=True)
    status = Column(SQLEnum(JobStatus), default=JobStatus.PENDING)
    name = Column(String(255), nullable=True)
    url = Column(String(500), nullable=False)
    total_records = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project = relationship("Project", back_populates="jobs")
    template = relationship("Template", back_populates="jobs")
    records = relationship("Record", back_populates="job", cascade="all, delete-orphan")


class Record(Base):
    __tablename__ = "records"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("scrape_jobs.id"), nullable=False)
    data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    job = relationship("ScrapeJob", back_populates="records")
