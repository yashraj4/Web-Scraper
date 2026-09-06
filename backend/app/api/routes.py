from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models import models, schemas
from app.scraper.engine import ScraperEngine
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/projects", response_model=schemas.ProjectResponse)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    db_project = models.Project(**project.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@router.get("/projects", response_model=List[schemas.ProjectResponse])
def list_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Project).offset(skip).limit(limit).all()


@router.get("/projects/{project_id}", response_model=schemas.ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.delete("/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"message": "Project deleted"}


@router.post("/templates", response_model=schemas.TemplateResponse)
def create_template(template: schemas.TemplateCreate, db: Session = Depends(get_db)):
    db_template = models.Template(**template.model_dump())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template


@router.get("/templates", response_model=List[schemas.TemplateResponse])
def list_templates(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Template).offset(skip).limit(limit).all()


@router.get("/templates/{template_id}", response_model=schemas.TemplateResponse)
def get_template(template_id: int, db: Session = Depends(get_db)):
    template = db.query(models.Template).filter(models.Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.put("/templates/{template_id}", response_model=schemas.TemplateResponse)
def update_template(template_id: int, template_update: schemas.TemplateUpdate, db: Session = Depends(get_db)):
    template = db.query(models.Template).filter(models.Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    if template_update.name is not None:
        template.name = template_update.name
    if template_update.project_id is not None:
        template.project_id = template_update.project_id
    if template_update.url_pattern is not None:
        template.url_pattern = template_update.url_pattern
    if template_update.base_url is not None:
        template.base_url = template_update.base_url
    if template_update.selectors is not None:
        template.selectors = template_update.selectors
    if template_update.site_type is not None:
        template.site_type = template_update.site_type
    if template_update.scraping_method is not None:
        template.scraping_method = template_update.scraping_method
    
    db.commit()
    db.refresh(template)
    return template
@router.delete("/templates/{template_id}")
def delete_template(template_id: int, db: Session = Depends(get_db)):
    template = db.query(models.Template).filter(models.Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(template)
    db.commit()
    return {"message": "Template deleted"}


@router.post("/jobs", response_model=schemas.ScrapeJobResponse)
def create_job(job: schemas.ScrapeJobCreate, db: Session = Depends(get_db)):
    db_job = models.ScrapeJob(
        name=job.name,
        url=job.url,
        template_id=job.template_id,
        project_id=job.project_id,
        status=models.JobStatus.PENDING
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job


@router.get("/jobs", response_model=List[schemas.ScrapeJobResponse])
def list_jobs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.ScrapeJob).order_by(models.ScrapeJob.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/jobs/{job_id}", response_model=schemas.ScrapeJobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.ScrapeJob).filter(models.ScrapeJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/jobs/{job_id}/records", response_model=List[schemas.RecordResponse])
def get_job_records(job_id: int, db: Session = Depends(get_db)):
    return db.query(models.Record).filter(models.Record.job_id == job_id).all()


@router.post("/jobs/{job_id}/run")
def run_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.ScrapeJob).filter(models.ScrapeJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job.status = models.JobStatus.RUNNING
    job.started_at = datetime.utcnow()
    job.error_message = None
    db.commit()
    
    try:
        template = None
        selectors = {}
        scraping_method = "cloudscraper"
        
        if job.template_id:
            template = db.query(models.Template).filter(models.Template.id == job.template_id).first()
            if template:
                if template.selectors:
                    selectors = dict(template.selectors)
                scraping_method = template.scraping_method or "cloudscraper"
        
        if not selectors:
            selectors = {
                "_container": "body",
                "content": "body",
            }
        
        logger.info(f"Starting scrape job {job.id} with method {scraping_method}")
        scraper = ScraperEngine(method=scraping_method)
        results = scraper.scrape(job.url, selectors)
        logger.info(f"Scrape completed with {len(results)} results")
        
        for data in results:
            record = models.Record(job_id=job.id, data=data)
            db.add(record)
        
        job.status = models.JobStatus.COMPLETED
        job.total_records = len(results)
        job.completed_at = datetime.utcnow()
        db.commit()
        
        return {"message": "Job completed", "records": len(results)}
    
    except Exception as e:
        error_msg = str(e)
        import traceback
        traceback.print_exc()
        print(f"DEBUG: Job failed with error: {error_msg}")
        logger.error(f"Job {job.id} failed: {error_msg}")
        job.status = models.JobStatus.FAILED
        job.error_message = error_msg
        job.completed_at = datetime.utcnow()
        db.commit()
        
        return {"message": "Job failed", "error": error_msg, "records": 0}


@router.put("/jobs/{job_id}", response_model=schemas.ScrapeJobResponse)
def update_job(job_id: int, job_update: schemas.ScrapeJobUpdate, db: Session = Depends(get_db)):
    job = db.query(models.ScrapeJob).filter(models.ScrapeJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job_update.url is not None:
        job.url = job_update.url
    if job_update.name is not None:
        job.name = job_update.name
    if job_update.template_id is not None:
        job.template_id = job_update.template_id
    if job_update.project_id is not None:
        job.project_id = job_update.project_id
    
    db.commit()
    db.refresh(job)
    return job


@router.delete("/jobs/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.ScrapeJob).filter(models.ScrapeJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # If job is running, we should try to stop it first or at least mark it
    # For now, we'll just delete it from DB as requested
    db.delete(job)
    db.commit()
    return {"message": "Job deleted"}


@router.post("/jobs/{job_id}/retry")
def retry_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.ScrapeJob).filter(models.ScrapeJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job.status = models.JobStatus.PENDING
    job.error_message = None
    job.total_records = 0
    job.started_at = None
    job.completed_at = None
    db.commit()
    
    return {"message": "Job reset for retry", "status": job.status.value}


@router.post("/jobs/{job_id}/cancel")
def cancel_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.ScrapeJob).filter(models.ScrapeJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status not in [models.JobStatus.PENDING, models.JobStatus.RUNNING]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel job with status: {job.status.value}")
    
    job.status = models.JobStatus.CANCELLED
    job.completed_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Job cancelled", "status": job.status.value}


@router.get("/jobs/{job_id}/export/csv")
def export_job_csv(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.ScrapeJob).filter(models.ScrapeJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    records = db.query(models.Record).filter(models.Record.job_id == job_id).all()
    
    if not records:
        raise HTTPException(status_code=404, detail="No records found for this job")
    
    import csv
    import io
    
    output = io.StringIO()
    fieldnames = list(records[0].data.keys())
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    for record in records:
        writer.writerow(record.data)
    
    return {"csv": output.getvalue(), "filename": f"job_{job_id}_export.csv"}


@router.get("/jobs/{job_id}/export/json")
def export_job_json(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.ScrapeJob).filter(models.ScrapeJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    records = db.query(models.Record).filter(models.Record.job_id == job_id).all()
    
    return {"records": [r.data for r in records], "count": len(records)}


@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    total_jobs = db.query(models.ScrapeJob).count()
    completed_jobs = db.query(models.ScrapeJob).filter(models.ScrapeJob.status == models.JobStatus.COMPLETED).count()
    failed_jobs = db.query(models.ScrapeJob).filter(models.ScrapeJob.status == models.JobStatus.FAILED).count()
    total_records = db.query(models.Record).count()
    
    recent_jobs = db.query(models.ScrapeJob).order_by(models.ScrapeJob.created_at.desc()).limit(10).all()
    
    return {
        "total_jobs": total_jobs,
        "completed_jobs": completed_jobs,
        "failed_jobs": failed_jobs,
        "total_records": total_records,
        "recent_jobs": [
            {"id": j.id, "url": j.url, "status": j.status.value, "total_records": j.total_records, "created_at": j.created_at}
            for j in recent_jobs
        ]
    }
