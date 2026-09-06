/// <reference types="next" />
/// <reference types="next/image-types/global" />

export interface Project {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface Template {
  id: number;
  name: string;
  base_url: string;
  selectors: Record<string, string>;
  site_type: string;
  scraping_method: string;
  project_id?: number;
  created_at: string;
}

export interface ScrapeJob {
  id: number;
  name?: string;
  url: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  template_id?: number;
  project_id?: number;
  total_records: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface Record {
  id: number;
  job_id: number;
  data: Record<string, any>;
  created_at: string;
}

export interface Analytics {
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  total_records: number;
  recent_jobs: Array<{
    id: number;
    url: string;
    status: string;
    total_records: number;
    created_at: string;
  }>;
}
