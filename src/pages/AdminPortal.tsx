import React, { useState, useEffect, useRef } from 'react';
import { Certificate } from '../types';
import { ShieldCheck, LogOut, Plus, Edit2, Trash2, X, Search, Download, Users, FileText, ChevronLeft, ChevronRight, History, FileUp, FileDown, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  if (dateStr.includes('-')) {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
  }
  return dateStr;
};

const formatFullDate = (dateTimeStr?: string) => {
  if (!dateTimeStr) return '';
  const cleanStr = dateTimeStr.includes(' ') ? dateTimeStr.replace(' ', 'T') : dateTimeStr;
  const date = new Date(cleanStr);
  if (isNaN(date.getTime())) return dateTimeStr;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

export function AdminPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('adminAuth') === 'true';
  });
  const [adminRole, setAdminRole] = useState(() => {
    return sessionStorage.getItem('adminRole') || 'Assistant';
  });
  const [dashboardFilter, setDashboardFilter] = useState<'all' | 'active' | 'expired' | 'formA' | 'formB' | 'formC'>('all');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Certificate>>({});
  const [formBPeriod, setFormBPeriod] = useState<'Jan-Jun' | 'Jul-Dec'>('Jan-Jun');
  const [formBYear, setFormBYear] = useState<number>(new Date().getFullYear());

  // PDF Multi-file and Removal state
  const [existingPdfPaths, setExistingPdfPaths] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Pagination & Audit state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditStartDate, setAuditStartDate] = useState('');
  const [auditEndDate, setAuditEndDate] = useState('');

  const tableRef = useRef<HTMLTableElement>(null);
  const theadRef = useRef<HTMLTableSectionElement>(null);

  const getAuthToken = () => sessionStorage.getItem('adminToken') || '';

  useEffect(() => {
    const handleScroll = () => {
      if (!tableRef.current || !theadRef.current) return;
      const rect = tableRef.current.getBoundingClientRect();
      const headerHeight = window.innerWidth >= 640 ? 145 : 0;

      if (rect.top < headerHeight) {
        const offset = headerHeight - rect.top;
        const maxOffset = rect.height - theadRef.current.offsetHeight;
        const finalOffset = Math.max(0, Math.min(offset, maxOffset));
        theadRef.current.style.transform = `translateY(${finalOffset}px)`;
        if (finalOffset > 0) {
          theadRef.current.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        } else {
          theadRef.current.style.boxShadow = 'none';
        }
      } else {
        theadRef.current.style.transform = `translateY(0)`;
        theadRef.current.style.boxShadow = 'none';
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`./api/audit.php?t=${Date.now()}&token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (res.ok) setAuditLogs(data);
    } catch (err) {
      console.error('Audit fetch error', err);
    }
  };

  const updateExpiryDate = (type: string, issue: string | undefined, period: string, year: number) => {
    if (!issue) return;
    const issueDateObj = new Date(issue);
    const issueYear = issueDateObj.getFullYear();
    let newExpiry = '';

    if (type === 'Form A') {
      newExpiry = `${issueYear}-12-31`;
    } else if (type === 'Form B') {
      if (period === 'Jan-Jun') {
        newExpiry = `${year}-06-30`;
      } else {
        newExpiry = `${year}-12-31`;
      }
    } else if (type === 'Form C') {
      const nextYear = new Date(issueDateObj);
      nextYear.setFullYear(issueYear + 1);
      newExpiry = nextYear.toISOString().split('T')[0];
    }
    setFormData(prev => ({ ...prev, expiryDate: newExpiry }));
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCertificates();
    }
  }, [isAuthenticated]);

  const fetchCertificates = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`./api/admin.php?t=${Date.now()}&token=${encodeURIComponent(token)}`);
      
      if (!res.ok) {
        let errorMsg = `Server error: ${res.status}`;
        try {
          const data = await res.json();
          errorMsg = data.error || data.message || errorMsg;
        } catch (_) {
          const text = await res.text();
          if (text.includes("Access Denied") || text.includes("Sucuri") || text.includes("Firewall")) {
            errorMsg = "Access Denied: Blocked by GoDaddy Website Firewall (Sucuri)";
          }
        }
        console.error('API Error:', errorMsg);
        setCertificates([]);
        if (isAuthenticated) alert(errorMsg);
        return;
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setCertificates(data);
      } else {
        console.error('API Error: Data is not an array', data);
        setCertificates([]);
      }
    } catch (err) {
      console.error('Network Error:', err);
      setCertificates([]);
      if (isAuthenticated) alert('Network Error: Could not connect to API');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('./api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(true);
        setAdminRole(data.role);
        sessionStorage.setItem('adminAuth', 'true');
        sessionStorage.setItem('adminRole', data.role);
        if (data.token) {
          sessionStorage.setItem('adminToken', data.token);
        }
        setLoginError('');
      } else {
        let errorMsg = 'Invalid username or password';
        try {
          const data = await res.json();
          errorMsg = data.message || errorMsg;
        } catch (_) {
          const text = await res.text();
          if (text.includes("Access Denied") || text.includes("Sucuri") || text.includes("Firewall")) {
            errorMsg = "Access Denied: Blocked by GoDaddy Website Firewall (Sucuri)";
          }
        }
        setLoginError(errorMsg);
      }
    } catch (err) {
      setLoginError('Could not connect to authentication server.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuth');
    sessionStorage.removeItem('adminRole');
    sessionStorage.removeItem('adminToken');
    setUsername('');
    setPassword('');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this certificate?')) {
      try {
        const token = getAuthToken();
        const res = await fetch('./api/admin.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'DELETE', id, token })
        });
        if (res.ok) {
          const updated = certificates.filter(c => c.id !== id);
          setCertificates(updated);
        } else {
          let errorMsg = 'Failed to delete certificate on server';
          try {
            const text = await res.text();
            try {
              const json = JSON.parse(text);
              errorMsg = json.error || json.message || text;
            } catch (_) {
              errorMsg = text || `Server error: ${res.status}`;
            }
          } catch (_) {
            errorMsg = `Server returned status ${res.status}`;
          }

          alert(`Delete Failed: ${errorMsg}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('API delete failed', msg);
        alert(`Network error. Delete failed: ${msg}`);
      }
    }
  };

  const openModal = (certificate?: Certificate) => {
    if (certificate) {
      setEditingCertificate(certificate);
      setFormData(certificate);

      // Load existing PDFs
      const paths = certificate.pdfPaths && certificate.pdfPaths.length > 0
        ? certificate.pdfPaths
        : (certificate.pdfPath ? [certificate.pdfPath] : []);
      setExistingPdfPaths(paths);
      setSelectedFiles([]);

      if (certificate.formType === 'Form B') {
        const year = parseInt(certificate.expiryDate.split('-')[0], 10);
        setFormBYear(year || new Date().getFullYear());
        if (certificate.expiryDate.endsWith('-06-30')) setFormBPeriod('Jan-Jun');
        else setFormBPeriod('Jul-Dec');
      }
    } else {
      setEditingCertificate(null);
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const nextYearStr = new Date(new Date().setFullYear(today.getFullYear() + 1)).toISOString().split('T')[0];
      setFormBPeriod('Jan-Jun');
      setFormBYear(today.getFullYear());
      setExistingPdfPaths([]);
      setSelectedFiles([]);
      setFormData({
        certificateId: '',
        name: '',
        course: '',
        formType: 'Form C',
        issueDate: todayStr,
        expiryDate: nextYearStr,
        status: 'Active'
      });
    }
    setIsModalOpen(true);
    setIsSaving(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.certificateId?.trim()) {
      alert('Please enter Certificate ID');
      return;
    }
    if (!formData.companyName?.trim()) {
      alert('Please enter Company Name');
      return;
    }
    if (!formData.name?.trim()) {
      alert('Please enter Project Name');
      return;
    }
    if (!formData.course?.trim()) {
      alert('Please enter Company Address');
      return;
    }
    if (!formData.issueDate?.trim()) {
      alert('Please select Issue Date');
      return;
    }
    if (!formData.status) {
      alert('Please select Status');
      return;
    }

    if (!editingCertificate && certificates.some(cert => cert.certificateId === formData.certificateId)) {
      alert('Certificate ID already exists!');
      return;
    }

    setIsSaving(true);
    try {
      const token = getAuthToken();
      const formDataToSend = new FormData();
      formDataToSend.append('token', token);

      // Skip keys that are handled separately or are non-string types
      const skipKeys = ['id', 'pdfPath', 'pdfPaths', 'createdAt'];
      Object.keys(formData).forEach(key => {
        if (skipKeys.includes(key)) return;
        const val = (formData as any)[key];
        if (val !== undefined && val !== null && typeof val !== 'object') {
          formDataToSend.append(key, String(val));
        }
      });

      // Send retained existing PDF paths as JSON string
      formDataToSend.append('existingPdfPaths', JSON.stringify(existingPdfPaths));

      // Send new PDF files
      selectedFiles.forEach((file) => {
        formDataToSend.append('pdfs[]', file);
      });

      if (editingCertificate) {
        formDataToSend.append('id', editingCertificate.id);
      } else {
        formDataToSend.append('issuedBy', adminRole);
      }

      const res = await fetch('./api/admin.php', {
        method: 'POST',
        body: formDataToSend
      });

      if (res.ok) {
        setIsModalOpen(false);
        setSelectedFiles([]);
        setExistingPdfPaths([]);
        fetchCertificates();
      } else {
        let errorMsg = 'Unknown server error';
        try {
          const text = await res.text();
          try {
            const json = JSON.parse(text);
            errorMsg = json.error || json.message || text;
          } catch (_) {
            errorMsg = text || `Server error: ${res.status}`;
          }
        } catch (_) {
          errorMsg = `Server returned status ${res.status}`;
        }
        alert(`Error: ${errorMsg}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('API save failed:', msg);
      alert(`Save Failed: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const exportToCSV = () => {
    if (certificates.length === 0) {
      alert('No certificates to export');
      return;
    }

    const headers = ['ID', 'Certificate ID', 'Name', 'Course', 'Form Type', 'Issue Date', 'Expiry Date', 'Status'];
    const csvRows = [
      headers.join(','),
      ...certificates.map(c => [
        c.id,
        `"${(c.certificateId || '').replace(/"/g, '""')}"`,
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${(c.course || '').replace(/"/g, '""')}"`,
        `"${(c.formType || 'Form C').replace(/"/g, '""')}"`,
        `"${formatDate(c.issueDate)}"`,
        `"${formatDate(c.expiryDate)}"`,
        `"${c.status}"`
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'certificates_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAuditLogsToCSV = () => {
    let filteredLogs = auditLogs;

    if (auditStartDate || auditEndDate) {
      filteredLogs = auditLogs.filter(log => {
        const logDate = new Date(log.created_at);
        logDate.setHours(0, 0, 0, 0);

        if (auditStartDate) {
          const start = new Date(auditStartDate);
          start.setHours(0, 0, 0, 0);
          if (logDate < start) return false;
        }

        if (auditEndDate) {
          const end = new Date(auditEndDate);
          end.setHours(0, 0, 0, 0);
          if (logDate > end) return false;
        }

        return true;
      });
    }

    if (filteredLogs.length === 0) {
      alert('No audit logs found for the selected date range.');
      return;
    }

    const headers = ['Time', 'Action', 'Target Cert ID', 'By', 'Details'];
    const csvRows = [
      headers.join(','),
      ...filteredLogs.map(log => [
        `"${formatFullDate(log.created_at)}"`,
        `"${log.action}"`,
        `"${log.certificate_id}"`,
        `"${log.action_by}"`,
        `"${log.details ? log.details.replace(/"/g, '""') : ''}"`
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header showAdminLink={false} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Admin Login</h2>
              <p className="text-sm text-gray-500 mt-2">Enter credentials to manage certificates</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e31e24] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e31e24] focus:border-transparent"
                  required
                />
              </div>
              {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
              <button
                type="submit"
                className="w-full bg-[#e31e24] hover:bg-red-700 text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                Sign In
              </button>
            </form>

            <div className="text-center pt-4 border-t border-gray-100">
              <Link to="/" className="text-sm text-[#1d4e9e] hover:underline">
                &larr; Back to Certificate Portal
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const filteredCertificates = certificates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.certificateId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.course.toLowerCase().includes(searchQuery.toLowerCase());

    if (dashboardFilter === 'active') {
      return matchesSearch && c.status === 'Active';
    }

    if (dashboardFilter === 'expired') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(c.expiryDate);
      let effectiveExpiry = new Date(expiry);
      if (c.formType === 'Form B') {
        effectiveExpiry.setMonth(effectiveExpiry.getMonth() + 6);
      }
      return matchesSearch && today > effectiveExpiry;
    }

    if (dashboardFilter === 'formA') {
      return matchesSearch && c.formType === 'Form A';
    }

    if (dashboardFilter === 'formB') {
      return matchesSearch && c.formType === 'Form B';
    }

    if (dashboardFilter === 'formC') {
      return matchesSearch && c.formType === 'Form C';
    }

    return matchesSearch;
  });

  const totalCertificates = certificates.length;
  const expiredCertificates = certificates.filter(c => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(c.expiryDate);
    let effectiveExpiry = new Date(expiry);
    if (c.formType === 'Form B') {
      effectiveExpiry.setMonth(effectiveExpiry.getMonth() + 6);
    }
    return today > effectiveExpiry;
  }).length;
  const activeCertificates = certificates.filter(c => c.status === 'Active').length;
  const totalFormA = certificates.filter(c => c.formType === 'Form A').length;
  const totalFormB = certificates.filter(c => c.formType === 'Form B').length;
  const totalFormC = certificates.filter(c => c.formType === 'Form C').length;

  const totalPages = Math.ceil(filteredCertificates.length / itemsPerPage);
  const currentItems = filteredCertificates.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getPdfCount = (c: Certificate) => {
    if (c.pdfPaths && c.pdfPaths.length > 0) return c.pdfPaths.length;
    return c.pdfPath ? 1 : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header isAdminMode={true} onLogout={handleLogout} showAdminLink={false} />

      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:px-8 xl:px-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Certificates</h2>
            <p className="text-sm text-gray-500">Add, edit, or remove certificate records.</p>
          </div>

          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by CERT REF NO, company or address..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e31e24] focus:border-transparent text-sm"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => { fetchAuditLogs(); setIsAuditModalOpen(true); }}
                className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 sm:gap-2 bg-gray-600 hover:bg-gray-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
              >
                <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Audit Logs
              </button>
              <button
                onClick={exportToCSV}
                className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 sm:gap-2 bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Export CSV
              </button>
              <button
                onClick={() => openModal()}
                className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 sm:gap-2 bg-[#e31e24] hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Add Certificate
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div
            onClick={() => { setDashboardFilter('all'); setCurrentPage(1); }}
            className={`cursor-pointer transition-all bg-white p-6 rounded-xl shadow-sm border-2 flex items-center gap-4 ${dashboardFilter === 'all' ? 'border-[#1d4e9e] ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-300'
              }`}
          >
            <div className="w-12 h-12 bg-blue-50 text-[#1d4e9e] rounded-full flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Certificates</p>
              <p className="text-2xl font-bold text-gray-900">{totalCertificates}</p>
            </div>
          </div>
          <div
            onClick={() => { setDashboardFilter('active'); setCurrentPage(1); }}
            className={`cursor-pointer transition-all bg-white p-6 rounded-xl shadow-sm border-2 flex items-center gap-4 ${dashboardFilter === 'active' ? 'border-green-600 ring-2 ring-green-100' : 'border-gray-200 hover:border-green-300'
              }`}
          >
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Certificates</p>
              <p className="text-2xl font-bold text-gray-900">{activeCertificates}</p>
            </div>
          </div>
          <div
            onClick={() => { setDashboardFilter('expired'); setCurrentPage(1); }}
            className={`cursor-pointer transition-all bg-white p-6 rounded-xl shadow-sm border-2 flex items-center gap-4 ${dashboardFilter === 'expired' ? 'border-[#e31e24] ring-2 ring-red-100' : 'border-gray-200 hover:border-red-300'
              }`}
          >
            <div className="w-12 h-12 bg-red-50 text-[#e31e24] rounded-full flex items-center justify-center shrink-0">
              <X className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Expired Certificates</p>
              <p className="text-2xl font-bold text-gray-900">{expiredCertificates}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-8">
          <div
            onClick={() => { setDashboardFilter('formA'); setCurrentPage(1); }}
            className={`cursor-pointer transition-all bg-white p-3 sm:p-4 rounded-xl shadow-sm border-2 flex items-center gap-3 ${dashboardFilter === 'formA' ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-indigo-300'
              }`}
          >
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Form A</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{totalFormA}</p>
            </div>
          </div>
          <div
            onClick={() => { setDashboardFilter('formB'); setCurrentPage(1); }}
            className={`cursor-pointer transition-all bg-white p-3 sm:p-4 rounded-xl shadow-sm border-2 flex items-center gap-3 ${dashboardFilter === 'formB' ? 'border-orange-500 ring-2 ring-orange-100' : 'border-gray-200 hover:border-orange-300'
              }`}
          >
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Form B</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{totalFormB}</p>
            </div>
          </div>
          <div
            onClick={() => { setDashboardFilter('formC'); setCurrentPage(1); }}
            className={`cursor-pointer transition-all bg-white p-3 sm:p-4 rounded-xl shadow-sm border-2 flex items-center gap-3 ${dashboardFilter === 'formC' ? 'border-cyan-500 ring-2 ring-cyan-100' : 'border-gray-200 hover:border-cyan-300'
              }`}
          >
            <div className="w-10 h-10 bg-cyan-50 text-cyan-600 rounded-full flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Form C</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{totalFormC}</p>
            </div>
          </div>
          <div
            onClick={() => setIsPdfModalOpen(true)}
            className="cursor-pointer transition-all bg-white p-3 sm:p-4 rounded-xl shadow-sm border-2 border-gray-200 hover:border-red-300 flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-red-50 text-[#e31e24] rounded-full flex items-center justify-center shrink-0">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">All PDFs</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {certificates.filter(c => getPdfCount(c) > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table ref={tableRef} className="w-full text-left text-sm whitespace-nowrap">
              <thead ref={theadRef} className="bg-gray-100 text-gray-700 font-medium z-20 ring-1 ring-gray-200 relative transition-shadow duration-200">
                <tr>
                  <th className="px-6 py-4">Cert ID</th>
                  <th className="px-6 py-4">Company Name</th>
                  <th className="px-6 py-4">Project Name</th>
                  <th className="px-6 py-4">Address</th>
                  <th className="px-6 py-4">Issue Date</th>
                  <th className="px-6 py-4">Expiry Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created By</th>
                  <th className="px-6 py-4">Created On</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                      No certificates found.
                    </td>
                  </tr>
                ) : (
                  currentItems.map(certificate => (
                    <tr key={certificate.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{certificate.certificateId}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{certificate.companyName || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-700">{certificate.name}</td>
                      <td className="px-6 py-4 text-gray-600 text-xs truncate max-w-[200px]" title={certificate.course}>{certificate.course}</td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(certificate.issueDate)}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {certificate.formType === 'Form B' ?
                          (certificate.expiryDate?.endsWith('06-30') ? `01/01/${certificate.expiryDate.split('-')[0]} to 30/06/${certificate.expiryDate.split('-')[0]}` :
                            certificate.expiryDate?.endsWith('12-31') ? `01/07/${certificate.expiryDate.split('-')[0]} to 31/12/${certificate.expiryDate.split('-')[0]}` :
                              formatDate(certificate.expiryDate))
                          : formatDate(certificate.expiryDate)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${certificate.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {certificate.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 italic text-xs">{certificate.issuedBy || 'Admin'}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{formatFullDate(certificate.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">

                          <button
                            onClick={() => openModal(certificate)}
                            className="p-1.5 text-gray-500 hover:text-[#1d4e9e] hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(certificate.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredCertificates.length)}</span> of <span className="font-medium">{filteredCertificates.length}</span> results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Certificate Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-bold text-gray-900">
                {editingCertificate ? 'Edit Certificate' : 'Add New Certificate'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 sm:p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Certificate ID</label>
                    <input
                      type="text"
                      value={formData.certificateId || ''}
                      onChange={e => setFormData({ ...formData, certificateId: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e31e24] focus:border-transparent text-sm uppercase"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={formData.companyName || ''}
                      onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e31e24] focus:border-transparent text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e31e24] focus:border-transparent text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Form Type</label>
                    <select
                      value={formData.formType || 'Form C'}
                      onChange={e => {
                        const newType = e.target.value as 'Form A' | 'Form B' | 'Form C';
                        setFormData({ ...formData, formType: newType });
                        updateExpiryDate(newType, formData.issueDate, formBPeriod, formBYear);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e31e24] focus:border-transparent text-sm"
                      required
                    >
                      <option value="Form A">Form A (Issue-Year Validity)</option>
                      <option value="Form B">Form B (Half-Yearly Validity)</option>
                      <option value="Form C">Form C (1 Year Validity)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Address</label>
                    <textarea
                      value={formData.course || ''}
                      onChange={e => setFormData({ ...formData, course: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e31e24] focus:border-transparent text-sm"
                      required
                      rows={2}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                    <input
                      type="date"
                      value={formData.issueDate || ''}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={e => {
                        setFormData({ ...formData, issueDate: e.target.value });
                        updateExpiryDate(formData.formType || 'Form C', e.target.value, formBPeriod, formBYear);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e31e24] focus:border-transparent text-sm"
                      required
                    />
                  </div>
                  {formData.formType === 'Form B' && (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                        <select
                          value={formBPeriod}
                          onChange={e => {
                            const newPeriod = e.target.value as 'Jan-Jun' | 'Jul-Dec';
                            setFormBPeriod(newPeriod);
                            updateExpiryDate('Form B', formData.issueDate, newPeriod, formBYear);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e31e24] focus:border-transparent text-sm"
                          required
                        >
                          <option value="Jan-Jun">Jan - Jun</option>
                          <option value="Jul-Dec">July - Dec</option>
                        </select>
                      </div>
                      <div className="w-24">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                        <input
                          type="number"
                          value={formBYear}
                          onChange={e => {
                            const newYear = parseInt(e.target.value, 10);
                            setFormBYear(newYear);
                            if (newYear) {
                              updateExpiryDate('Form B', formData.issueDate, formBPeriod, newYear);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e31e24] focus:border-transparent text-sm"
                          required
                          min="2000"
                          max="2100"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status || 'Active'}
                      onChange={e => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e31e24] focus:border-transparent text-sm"
                      required
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Multi-PDF Upload & Removal Section */}
                  <div className="sm:col-span-2 border-t border-gray-100 pt-4 mt-2">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      PDF Documents <span className="text-gray-400 font-normal italic text-xs">(Optional - Up to 3 PDFs)</span>
                    </label>

                    {/* Already Uploaded PDFs */}
                    {existingPdfPaths.length > 0 && (
                      <div className="space-y-2 mb-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Uploaded Documents ({existingPdfPaths.length}):</p>
                        {existingPdfPaths.map((path, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-blue-50/70 px-3 py-2 rounded-lg border border-blue-100 text-xs">
                            <a href={`/${path}`} target="_blank" rel="noopener noreferrer" className="text-blue-700 font-bold hover:underline truncate max-w-[280px]">
                              📄 PDF {idx + 1} ({path.split('/').pop()})
                            </a>
                            <button
                              type="button"
                              onClick={() => setExistingPdfPaths(existingPdfPaths.filter((_, i) => i !== idx))}
                              className="text-red-600 hover:text-red-800 font-bold px-2 py-1 rounded hover:bg-red-100 text-xs transition-colors flex items-center gap-1"
                              title="Remove this PDF"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Newly Selected Local Files */}
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2 mb-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">New Files to Upload ({selectedFiles.length}):</p>
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-green-50/70 px-3 py-2 rounded-lg border border-green-100 text-xs">
                            <span className="text-green-800 font-bold truncate max-w-[280px]">📎 {file.name}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))}
                              className="text-red-600 hover:text-red-800 font-bold px-2 py-1 rounded hover:bg-red-100 text-xs transition-colors flex items-center gap-1"
                              title="Remove file"
                            >
                              <X className="w-3.5 h-3.5" />
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* File Picker input if < 3 total files */}
                    {existingPdfPaths.length + selectedFiles.length < 3 && (
                      <div className="relative mt-2">
                        <input
                          type="file"
                          accept=".pdf"
                          multiple
                          onChange={e => {
                            if (e.target.files && e.target.files.length > 0) {
                              const allFiles = Array.from(e.target.files);
                              const validPdfs = allFiles.filter(f => f.name.toLowerCase().endsWith('.pdf'));
                              if (validPdfs.length === 0) {
                                alert('Please select a valid PDF file (.pdf)');
                                e.target.value = '';
                                return;
                              }
                              const remainingLimit = 3 - (existingPdfPaths.length + selectedFiles.length);
                              setSelectedFiles(prev => [...prev, ...validPdfs.slice(0, remainingLimit)]);
                              e.target.value = '';
                            }
                          }}
                          className="hidden"
                          id="pdf-upload"
                        />
                        <label
                          htmlFor="pdf-upload"
                          className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 hover:border-[#e31e24] rounded-xl hover:bg-gray-50 cursor-pointer transition-all text-sm font-medium text-gray-600"
                        >
                          <FileUp className="w-4 h-4 text-gray-500" />
                          <span>Upload PDF Document ({existingPdfPaths.length + selectedFiles.length}/3)</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end shrink-0 bg-gray-50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={`px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-all flex items-center justify-center gap-2 ${isSaving ? 'bg-gray-500 cursor-not-allowed opacity-90' : 'bg-[#e31e24] hover:bg-red-700 active:scale-95'}`}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1.5 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving Certificate...</span>
                  </>
                ) : (editingCertificate ? 'Save Changes' : 'Add Certificate')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Audit Logs Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden h-[80vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-bold text-gray-900">System Audit Logs</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportAuditLogsToCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold transition-all border border-green-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  <p className='hidden sm:block'>Export Logs</p>
                </button>
                <button
                  onClick={() => {
                    setIsAuditModalOpen(false);
                    setAuditStartDate('');
                    setAuditEndDate('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 px-6 py-3 bg-gray-100 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">From:</span>
                <input
                  type="date"
                  value={auditStartDate}
                  onChange={(e) => setAuditStartDate(e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">To:</span>
                <input
                  type="date"
                  value={auditEndDate}
                  onChange={(e) => setAuditEndDate(e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              {(auditStartDate || auditEndDate) && (
                <button
                  onClick={() => { setAuditStartDate(''); setAuditEndDate(''); }}
                  className="text-[10px] font-bold text-red-600 hover:underline"
                >
                  Clear Range
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Cert ID</th>
                    <th className="px-4 py-3">By</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500 italic">No audit logs found.</td>
                    </tr>
                  ) : (
                    auditLogs.map((log, idx) => (
                      <tr key={log.id || idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatFullDate(log.created_at)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                            log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{log.certificate_id}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs italic">{log.action_by}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs truncate max-w-[300px]" title={log.details}>{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* All PDFs Modal */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden h-[80vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <FileDown className="w-5 h-5 text-[#e31e24]" />
                <h3 className="text-lg font-bold text-gray-900">Certificate PDF Documents Repository</h3>
              </div>
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3">Cert ID</th>
                    <th className="px-4 py-3">Project Name</th>
                    <th className="px-4 py-3">Issue Date</th>
                    <th className="px-4 py-3 text-right">PDF Documents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {certificates.filter(c => getPdfCount(c) > 0).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500 italic">No PDF documents found.</td>
                    </tr>
                  ) : (
                    certificates.filter(c => getPdfCount(c) > 0).map(cert => {
                      const paths = cert.pdfPaths && cert.pdfPaths.length > 0 ? cert.pdfPaths : (cert.pdfPath ? [cert.pdfPath] : []);
                      return (
                        <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-600 font-medium">{cert.certificateId}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900">{cert.name}</td>
                          <td className="px-4 py-3 text-gray-500">{formatDate(cert.issueDate)}</td>
                          <td className="px-4 py-3 text-right flex flex-wrap justify-end gap-2">
                            {paths.map((p, pIdx) => (
                              <a
                                key={pIdx}
                                href={`/${p}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-all border border-blue-200"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                PDF {pIdx + 1}
                              </a>
                            ))}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50">
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close Repository
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-6 sm:py-8 px-4 sm:px-6 mt-auto">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
          <div className="flex items-center">
            <img
              src="https://omsaienterprisesmumbai.com/images/logo2.jpeg"
              alt="Om Sai Enterprises Logo"
              className="h-8 sm:h-10 w-auto object-contain bg-white px-2 py-1 rounded"
            />
          </div>
          <div className="text-xs sm:text-sm text-gray-500 text-center md:text-right">
            &copy; {new Date().getFullYear()} Om Sai Enterprises. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
