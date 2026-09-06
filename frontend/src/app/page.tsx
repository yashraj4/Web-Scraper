"use client";

import { useState, useEffect } from "react";
import { API } from "@/lib/api";
import { Analytics, ScrapeJob, Record as ScrapeRecord, Template } from "@/types";
import {
  PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";
import {
  Activity, Database, FileText, Plus, Play, Trash2,
  LayoutTemplate, RefreshCw, X, Download, Edit2, StopCircle,
  Moon, Sun
} from "lucide-react";

const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#6366f1", "#8b5cf6"];

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  running: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-yellow-100 text-yellow-700",
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [records, setRecords] = useState<ScrapeRecord[]>([]);
  const [selectedJob, setSelectedJob] = useState<ScrapeJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check local storage or system preference
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDarkMode(true);
    }
  };

  // Job form state
  const [showNewJob, setShowNewJob] = useState(false);
  const [editingJob, setEditingJob] = useState<ScrapeJob | null>(null);
  const [jobName, setJobName] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [jobTemplateId, setJobTemplateId] = useState<number | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // Template form state
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [confirmDeleteTemplate, setConfirmDeleteTemplate] = useState<number | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    base_url: "",
    site_type: "generic",
    scraping_method: "cloudscraper",
    selectors: "{\n  \"_container\": \".product-item\",\n  \"name\": \".product-title\",\n  \"price\": \".price\"\n}",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setError(null);
      const [analyticsData, jobsData, templatesData] = await Promise.all([
        API.getAnalytics(),
        API.getJobs(),
        API.getTemplates(),
      ]);
      setAnalytics(analyticsData);
      setJobs(jobsData);
      setTemplates(templatesData);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load data. Make sure the backend is running.");
    }
  }

  // Job functions
  async function createJob() {
    if (!jobUrl) return;
    setLoading(true);
    setError(null);
    try {
      await API.createJob({ name: jobName || undefined, url: jobUrl, template_id: jobTemplateId });
      resetJobForm();
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to create job");
    }
    setLoading(false);
  }

  async function updateJob() {
    if (!editingJob || !jobUrl) return;
    setLoading(true);
    setError(null);
    try {
      await API.updateJob(editingJob.id, { name: jobName || undefined, url: jobUrl, template_id: jobTemplateId });
      resetJobForm();
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to update job");
    }
    setLoading(false);
  }

  async function deleteJob(jobId: number) {
    setLoading(true);
    setError(null);
    try {
      await API.deleteJob(jobId);
      setConfirmDelete(null);
      if (selectedJob?.id === jobId) {
        setSelectedJob(null);
        setRecords([]);
      }
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to delete job");
    }
    setLoading(false);
  }

  async function runJob(jobId: number) {
    setLoading(true);
    setError(null);
    try {
      await API.runJob(jobId);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to run job");
    }
    setLoading(false);
  }

  async function retryJob(jobId: number) {
    setLoading(true);
    setError(null);
    try {
      await API.retryJob(jobId);
      await API.runJob(jobId); // Automatically start after reset
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to restart job");
    }
    setLoading(false);
  }

  async function cancelJob(jobId: number) {
    setLoading(true);
    setError(null);
    try {
      await API.cancelJob(jobId);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to cancel job");
    }
    setLoading(false);
  }

  async function exportCsv(jobId: number) {
    try {
      const result = await API.exportCsv(jobId);
      const blob = new Blob([result.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
    } catch (err: any) {
      setError(err.message || "Failed to export CSV");
    }
  }

  async function exportJson(jobId: number) {
    try {
      const result = await API.exportJson(jobId);
      const blob = new Blob([JSON.stringify(result.records, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `job_${jobId}_export.json`;
      a.click();
    } catch (err: any) {
      setError(err.message || "Failed to export JSON");
    }
  }

  async function loadRecords(jobId: number) {
    const job = jobs.find(j => j.id === jobId);
    setSelectedJob(job || null);
    const data = await API.getJobRecords(jobId);
    setRecords(data);
  }

  function resetJobForm() {
    setShowNewJob(false);
    setEditingJob(null);
    setJobName("");
    setJobUrl("");
    setJobTemplateId(undefined);
  }

  function openEditJob(job: ScrapeJob) {
    setEditingJob(job);
    setJobName(job.name || "");
    setJobUrl(job.url);
    setJobTemplateId(job.template_id || undefined);
    setShowNewJob(true);
  }

  // Template functions
  function resetTemplateForm() {
    setNewTemplate({ name: "", base_url: "", site_type: "generic", scraping_method: "cloudscraper", selectors: "{}" });
    setEditingTemplate(null);
    setShowNewTemplate(false);
  }

  function openEditTemplate(template: Template) {
    setEditingTemplate(template);
    setNewTemplate({
      name: template.name,
      base_url: template.base_url,
      site_type: template.site_type || "generic",
      scraping_method: template.scraping_method || "cloudscraper",
      selectors: JSON.stringify(template.selectors, null, 2),
    });
    setShowNewTemplate(true);
  }

  async function createTemplate() {
    if (!newTemplate.name || !newTemplate.base_url) return;
    setLoading(true);
    setError(null);
    try {
      const templateData = {
        name: newTemplate.name,
        base_url: newTemplate.base_url,
        site_type: newTemplate.site_type,
        scraping_method: newTemplate.scraping_method,
        selectors: JSON.parse(newTemplate.selectors),
      };

      if (editingTemplate) {
        await API.updateTemplate(editingTemplate.id, templateData);
      } else {
        await API.createTemplate(templateData);
      }

      resetTemplateForm();
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to save template. Check JSON format.");
    }
    setLoading(false);
  }

  async function deleteTemplate(templateId: number) {
    setLoading(true);
    setError(null);
    try {
      await API.deleteTemplate(templateId);
      setConfirmDeleteTemplate(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to delete template");
    }
    setLoading(false);
  }

  const pieData = analytics ? [
    { name: "Completed", value: analytics.completed_jobs },
    { name: "Failed", value: analytics.failed_jobs },
    { name: "Pending", value: analytics.total_jobs - analytics.completed_jobs - analytics.failed_jobs },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Header */}
      <nav className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 px-6 py-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-600" />
            Web Scraper Platform
          </h1>
          <div className="flex gap-2 items-center">
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors mr-2"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-5 h-5 transition-transform hover:rotate-45" /> : <Moon className="w-5 h-5 transition-transform hover:-rotate-12" />}
            </button>
            <button onClick={() => setActiveTab("dashboard")} className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${activeTab === "dashboard" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
              <Activity className="w-4 h-4" /> Dashboard
            </button>
            <button onClick={() => setActiveTab("jobs")} className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${activeTab === "jobs" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
              <FileText className="w-4 h-4" /> Jobs
            </button>
            <button onClick={() => setActiveTab("templates")} className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${activeTab === "templates" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
              <LayoutTemplate className="w-4 h-4" /> Templates
            </button>
            <button onClick={loadData} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg ml-1" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-4 py-3 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="hover:opacity-75 transition-opacity"><X className="w-4 h-4" /></button>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-6 transition-all">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div><p className="text-gray-600 dark:text-gray-400 text-sm">Total Jobs</p><p className="text-2xl font-bold dark:text-white">{analytics.total_jobs}</p></div>
                  <Activity className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div><p className="text-gray-600 dark:text-gray-400 text-sm">Completed</p><p className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics.completed_jobs}</p></div>
                  <FileText className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div><p className="text-gray-600 dark:text-gray-400 text-sm">Failed</p><p className="text-2xl font-bold text-red-600 dark:text-red-400">{analytics.failed_jobs}</p></div>
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div><p className="text-gray-600 dark:text-gray-400 text-sm">Total Records</p><p className="text-2xl font-bold dark:text-white">{analytics.total_records}</p></div>
                  <Database className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border dark:border-gray-800">
                <h3 className="text-lg font-semibold dark:text-white mb-4">Job Status Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border dark:border-gray-800">
                <h3 className="text-lg font-semibold dark:text-white mb-4">Recent Jobs</h3>
                <div className="space-y-3">
                  {analytics.recent_jobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg transition-colors border border-transparent dark:border-gray-800/50">
                      <div className="truncate flex-1 mr-2">
                        <p className="text-sm font-medium dark:text-gray-200 truncate">{job.url}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{new Date(job.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full border ${job.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' :
                          job.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800' :
                            job.status === 'running' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
                              'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                          }`}>{job.status}</span>
                        <div className="flex gap-1 border-l dark:border-gray-700 pl-2 ml-1">
                          {job.status === "running" && (
                            <button onClick={() => cancelJob(job.id)} className="p-1 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/40 rounded transition-colors" title="Cancel">
                              <StopCircle className="w-3 h-3" />
                            </button>
                          )}
                          {(job.status === "failed" || job.status === "cancelled" || job.status === "completed") && (
                            <button onClick={() => retryJob(job.id)} className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded transition-colors" title="Restart">
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          )}
                          <button onClick={() => setConfirmDelete(job.id)} className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40 rounded transition-colors" title="Delete">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {analytics.recent_jobs.length === 0 && <p className="text-gray-600 dark:text-gray-400 text-center py-6 italic">No jobs found</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border dark:border-gray-800 shadow-sm">
              <h2 className="text-xl font-bold dark:text-white">Scrape Jobs</h2>
              <button onClick={() => { resetJobForm(); setShowNewJob(true); }} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 text-sm uppercase tracking-wide">
                <Plus className="w-4 h-4" /> New Job
              </button>
            </div>

            {/* Job Form Modal */}
            {showNewJob && (
              <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm transition-all">
                <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl p-7 w-full max-w-lg shadow-2xl scale-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold dark:text-white">{editingJob ? "Edit Job" : "Create New Job"}</h3>
                    <button onClick={resetJobForm} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><X className="w-6 h-6" /></button>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Job Name (Optional)</label>
                      <input type="text" value={jobName} onChange={(e) => setJobName(e.target.value)} placeholder="My Price Scraper" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">URL to Scrape *</label>
                      <input type="text" value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} placeholder="https://example.com/products" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Template (Optional)</label>
                      <select value={jobTemplateId || ""} onChange={(e) => setJobTemplateId(e.target.value ? Number(e.target.value) : undefined)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white">
                        <option value="">No template - use defaults</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.site_type})</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-8">
                    <button onClick={editingJob ? updateJob : createJob} disabled={loading || !jobUrl} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20">
                      {editingJob ? "Save Changes" : "Create Job"}
                    </button>
                    <button onClick={resetJobForm} className="px-6 py-3 border dark:border-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {/* Jobs Table */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border dark:border-gray-800 overflow-hidden transition-colors">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">URL</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Template</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Records</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-800">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium dark:text-gray-200">{job.name || "-"}</td>
                      <td className="px-4 py-3 truncate max-w-xs text-sm dark:text-gray-400">{job.url}</td>
                      <td className="px-4 py-3 text-sm dark:text-gray-400">{job.template_id ? templates.find(t => t.id === job.template_id)?.name || "N/A" : "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${job.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' :
                          job.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800' :
                            'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                          }`}>{job.status}</span>
                      </td>
                      <td className="px-4 py-3 text-sm dark:text-gray-200">{job.total_records}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{new Date(job.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {job.status === "pending" && <button onClick={() => runJob(job.id)} className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/40 rounded transition-colors" title="Run"><Play className="w-4 h-4" /></button>}
                          {job.status === "running" && <button onClick={() => cancelJob(job.id)} className="p-1.5 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/40 rounded transition-colors" title="Cancel"><StopCircle className="w-4 h-4" /></button>}
                          {(job.status === "failed" || job.status === "cancelled" || job.status === "completed") && (
                            <button onClick={() => retryJob(job.id)} className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded transition-colors" title="Restart"><RefreshCw className="w-4 h-4" /></button>
                          )}
                          {job.status === "completed" && (
                            <>
                              <button onClick={() => exportCsv(job.id)} className="p-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/40 rounded transition-colors" title="Export CSV"><Download className="w-4 h-4" /></button>
                              <button onClick={() => loadRecords(job.id)} className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded transition-colors" title="View Records"><FileText className="w-4 h-4" /></button>
                            </>
                          )}
                          <button onClick={() => openEditJob(job)} className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => setConfirmDelete(job.id)} className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40 rounded transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {jobs.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">No jobs yet. Create one to get started.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Error Message Display */}
            {selectedJob?.error_message && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-4 transition-all">
                <h4 className="font-semibold text-red-800 dark:text-red-400 mb-1 flex items-center gap-2">
                  <X className="w-4 h-4" /> Error Details
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">{selectedJob.error_message}</p>
              </div>
            )}

            {/* Records Table */}
            {selectedJob && records.length > 0 && (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border dark:border-gray-800 transition-colors">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold dark:text-white">Records for Job #{selectedJob.id}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => exportCsv(selectedJob.id)} className="px-4 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1.5 transition-all shadow-md shadow-purple-500/20"><Download className="w-3.5 h-3.5" /> CSV</button>
                    <button onClick={() => exportJson(selectedJob.id)} className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/20"><Download className="w-3.5 h-3.5" /> JSON</button>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-[500px] border dark:border-gray-800 rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-10">
                      <tr>
                        {Object.keys(records[0]?.data || {}).map((key) => <th key={key} className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap uppercase tracking-wider text-xs">{key}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-800">
                      {records.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                          {Object.values(record.data).map((value, idx) => <td key={idx} className="px-4 py-3 whitespace-nowrap dark:text-gray-300">{String(value)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
              <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm transition-all">
                <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl p-7 w-full max-w-md shadow-2xl transition-all scale-100">
                  <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-5 mx-auto">
                    <Trash2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold dark:text-white mb-2 text-center">Confirm Deletion</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 text-center leading-relaxed">Are you sure you want to delete this job? This action will remove all associated records and cannot be undone.</p>
                  <div className="flex gap-3">
                    <button onClick={() => deleteJob(confirmDelete)} disabled={loading} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg shadow-red-500/20">Delete Job</button>
                    <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-3 border dark:border-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === "templates" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border dark:border-gray-800 shadow-sm">
              <h2 className="text-xl font-bold dark:text-white">Templates</h2>
              <button onClick={() => { resetTemplateForm(); setShowNewTemplate(true); }} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 text-sm uppercase tracking-wide">
                <Plus className="w-4 h-4" /> New Template
              </button>
            </div>

            {showNewTemplate && (
              <div className="bg-white dark:bg-gray-900 p-7 rounded-2xl shadow-sm border dark:border-gray-800 transition-all">
                <h3 className="text-xl font-bold dark:text-white mb-6 flex items-center gap-2">
                  <LayoutTemplate className="w-5 h-5 text-blue-500" />
                  {editingTemplate ? "Edit Template" : "Create New Template"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Template Name</label>
                    <input type="text" value={newTemplate.name} onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })} placeholder="e.g. Costco Product" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Base URL</label>
                    <input type="text" value={newTemplate.base_url} onChange={(e) => setNewTemplate({ ...newTemplate, base_url: e.target.value })} placeholder="https://costco.ca" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Site Type</label>
                    <select value={newTemplate.site_type} onChange={(e) => setNewTemplate({ ...newTemplate, site_type: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white">
                      <option value="generic">Generic</option>
                      <option value="ecommerce">E-commerce</option>
                      <option value="directory">Business Directory</option>
                      <option value="maps">Google Maps</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Scraping Method</label>
                    <select value={newTemplate.scraping_method} onChange={(e) => setNewTemplate({ ...newTemplate, scraping_method: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white">
                      <option value="cloudscraper">Cloudscraper (Default)</option>
                      <option value="playwright">Playwright (JS Rendering)</option>
                      <option value="requests">Plain Requests</option>
                    </select>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Selectors (JSON)</label>
                    <textarea value={newTemplate.selectors} onChange={(e) => setNewTemplate({ ...newTemplate, selectors: e.target.value })} placeholder='{"price": ".value", "title": "h1"}' className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm transition-all dark:text-white h-32" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={createTemplate} disabled={loading || !newTemplate.name || !newTemplate.base_url} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20">
                    {editingTemplate ? "Save Changes" : "Create Template"}
                  </button>
                  <button onClick={resetTemplateForm} className="px-8 py-3 border dark:border-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div key={template.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border dark:border-gray-800 hover:shadow-md transition-all flex flex-col group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{template.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide font-medium">{template.site_type}</p>
                    </div>
                    <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold border border-blue-100 dark:border-blue-800 uppercase tracking-tighter self-start">{template.scraping_method}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-4 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border dark:border-gray-800">{template.base_url}</p>
                  <pre className="text-[11px] bg-gray-900 text-gray-300 p-3 rounded-xl overflow-x-auto max-h-40 mb-5 font-mono leading-relaxed custom-scrollbar">
                    {JSON.stringify(template.selectors, null, 2)}
                  </pre>
                  <div className="flex gap-2 justify-end mt-auto pt-4 border-t dark:border-gray-800">
                    <button onClick={() => openEditTemplate(template)} className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border dark:border-gray-800" title="Edit Template">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setConfirmDeleteTemplate(template.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg transition-colors border dark:border-gray-800" title="Delete Template">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {templates.length === 0 && <p className="text-gray-500 dark:text-gray-400 col-span-3 text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800">No templates yet. Create one to get started.</p>}
            </div>

            {/* Template Delete Confirmation Modal */}
            {confirmDeleteTemplate && (
              <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm transition-all">
                <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl p-7 w-full max-w-md shadow-2xl transition-all scale-100">
                  <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-5 mx-auto">
                    <Trash2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold dark:text-white mb-2 text-center">Delete Template</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 text-center leading-relaxed">Are you sure you want to delete this template? Any existing jobs using this template will lose their selector definitions.</p>
                  <div className="flex gap-3">
                    <button onClick={() => deleteTemplate(confirmDeleteTemplate)} disabled={loading} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg shadow-red-500/20">Delete Template</button>
                    <button onClick={() => setConfirmDeleteTemplate(null)} className="flex-1 px-4 py-3 border dark:border-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
