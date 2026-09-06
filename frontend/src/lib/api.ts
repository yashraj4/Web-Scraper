const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const API = {
  async getProjects() {
    const res = await fetch(`${API_URL}/api/projects`);
    return res.json();
  },

  async createProject(data: { name: string; description?: string }) {
    const res = await fetch(`${API_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getTemplates() {
    const res = await fetch(`${API_URL}/api/templates`);
    return res.json();
  },

  async createTemplate(data: {
    name: string;
    base_url: string;
    selectors: Record<string, string>;
    site_type?: string;
    scraping_method?: string;
  }) {
    const res = await fetch(`${API_URL}/api/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateTemplate(templateId: number, data: {
    name?: string;
    base_url?: string;
    selectors?: Record<string, string>;
    site_type?: string;
    scraping_method?: string;
  }) {
    const res = await fetch(`${API_URL}/api/templates/${templateId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteTemplate(templateId: number) {
    const res = await fetch(`${API_URL}/api/templates/${templateId}`, { method: 'DELETE' });
    return res.json();
  },

  async getJobs() {
    const res = await fetch(`${API_URL}/api/jobs`);
    return res.json();
  },

  async createJob(data: { name?: string; url: string; template_id?: number; project_id?: number }) {
    const res = await fetch(`${API_URL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateJob(jobId: number, data: { name?: string; url?: string; template_id?: number; project_id?: number }) {
    const res = await fetch(`${API_URL}/api/jobs/${jobId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async runJob(jobId: number) {
    const res = await fetch(`${API_URL}/api/jobs/${jobId}/run`, { method: 'POST' });
    return res.json();
  },

  async retryJob(jobId: number) {
    const res = await fetch(`${API_URL}/api/jobs/${jobId}/retry`, { method: 'POST' });
    return res.json();
  },

  async cancelJob(jobId: number) {
    const res = await fetch(`${API_URL}/api/jobs/${jobId}/cancel`, { method: 'POST' });
    return res.json();
  },

  async getJobRecords(jobId: number) {
    const res = await fetch(`${API_URL}/api/jobs/${jobId}/records`);
    return res.json();
  },

  async exportCsv(jobId: number) {
    const res = await fetch(`${API_URL}/api/jobs/${jobId}/export/csv`);
    return res.json();
  },

  async exportJson(jobId: number) {
    const res = await fetch(`${API_URL}/api/jobs/${jobId}/export/json`);
    return res.json();
  },

  async getAnalytics() {
    const res = await fetch(`${API_URL}/api/analytics`);
    return res.json();
  },

  async deleteJob(jobId: number) {
    const res = await fetch(`${API_URL}/api/jobs/${jobId}`, { method: 'DELETE' });
    return res.json();
  },
};
