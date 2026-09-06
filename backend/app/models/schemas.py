from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class JobStatusEnum(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(ProjectBase):
    pass


class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class TemplateBase(BaseModel):
    name: str
    base_url: str
    selectors: Dict[str, str]
    site_type: str = "generic"
    url_pattern: Optional[str] = None
    scraping_method: str = "cloudscraper"


class TemplateCreate(TemplateBase):
    project_id: Optional[int] = None


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    project_id: Optional[int] = None
    base_url: Optional[str] = None
    url_pattern: Optional[str] = None
    selectors: Optional[Dict[str, str]] = None
    site_type: Optional[str] = None
    scraping_method: Optional[str] = None


class TemplateResponse(TemplateBase):
    id: int
    project_id: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True


class RecordBase(BaseModel):
    data: Dict[str, Any]


class RecordResponse(RecordBase):
    id: int
    job_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class ScrapeJobBase(BaseModel):
    url: str
    name: Optional[str] = None


class ScrapeJobCreate(ScrapeJobBase):
    template_id: Optional[int] = None
    project_id: Optional[int] = None


class ScrapeJobUpdate(BaseModel):
    url: Optional[str] = None
    name: Optional[str] = None
    template_id: Optional[int] = None
    project_id: Optional[int] = None


class ScrapeJobResponse(ScrapeJobBase):
    id: int
    status: JobStatusEnum
    template_id: Optional[int]
    project_id: Optional[int]
    total_records: int
    error_message: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ScrapeJobWithRecords(ScrapeJobResponse):
    records: List[RecordResponse] = []
    
    class Config:
        from_attributes = True
