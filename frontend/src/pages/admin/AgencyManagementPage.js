import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { getAgencies } from '../../services/adminService';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ScrollReveal } from '../../hooks/useScrollAnimation';

function AgencyManagementPage() {
  const { t } = useTranslation();
  const [agencies, setAgencies] = useState([]);
  const [agencyAdmins, setAgencyAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', phone: '', adminId: '' });
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch agency admins dropdown list (once)
  useEffect(() => {
    api.get('/admin/users')
      .then(res => {
        setAgencyAdmins((res.data || []).filter(u => u.role === 'agency_admin'));
      })
      .catch(() => {});
  }, []);

  // Fetch paginated/searched agencies list
  useEffect(() => {
    setLoading(true);
    getAgencies(page, 10, debouncedSearch)
      .then(data => {
        setAgencies(Array.isArray(data) ? data : data.data || []);
        setTotalPages(data.totalPages || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, debouncedSearch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/admin/agencies', form);
      setForm({ name: '', email: '', phone: '', adminId: '' });
      setShowForm(false);
      // Reload current search/page
      const res = await getAgencies(page, 10, debouncedSearch);
      setAgencies(Array.isArray(res) ? res : res.data || []);
      setTotalPages(res.totalPages || 0);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await api.put(`/admin/agencies/${id}/deactivate`);
      setAgencies(prev => prev.map(a => a.id === id ? { ...a, active: !isActive } : a));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="admin-page">
      <div className="container">
        <ScrollReveal className="animate-fade-up">
          <div className="admin-header" style={{ flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 className="admin-title">{t('admin.agencyManagement', 'Agency Management')}</h1>
              <p className="text-muted">{t('admin.agenciesRegisteredCount', '{{count}} agencies registered', { count: agencies.length })}</p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                className="form-input"
                style={{ maxWidth: 280, margin: 0 }}
                placeholder={t('admin.searchAgencies', 'Search by name, email, phone…')}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Button onClick={() => setShowForm(!showForm)}>
                {showForm ? t('common.cancel', 'Cancel') : t('admin.newAgency', 'Create Agency')}
              </Button>
            </div>
          </div>
        </ScrollReveal>

        {showForm && (
          <ScrollReveal className="animate-fade-up">
            <div className="card mb-xl">
              <h3 className="card-title mb-lg">{t('admin.newAgency', 'New Agency')}</h3>
              <form onSubmit={handleCreate}>
                <div className="form-input-group">
                  <div className="form-group" style={{ flex: 1 }}>
                    <input
                      className="form-input"
                      placeholder={t('admin.agencyNamePlaceholder', 'Agency Name')}
                      value={form.name}
                      onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <input
                      className="form-input"
                      type="email"
                      placeholder={t('auth.email', 'Email')}
                      value={form.email}
                      onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <input
                      className="form-input"
                      placeholder={t('auth.phone', 'Phone')}
                      value={form.phone}
                      onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <select
                      className="form-input"
                      value={form.adminId}
                      onChange={e => setForm(prev => ({ ...prev, adminId: e.target.value }))}
                      required
                    >
                      <option value="">{t('admin.selectAgencyAdmin', 'Select Agency Admin')}</option>
                      {agencyAdmins.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <Button type="submit" loading={creating}>{t('common.create', 'Create')}</Button>
                  </div>
                </div>
              </form>
            </div>
          </ScrollReveal>
        )}

        {loading ? (
          <LoadingSpinner text={t('admin.loadingAgencies', 'Loading agencies...')} />
        ) : agencies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <h3 className="empty-state-title">{t('admin.noAgencies', 'No Agencies')}</h3>
            <p className="empty-state-text">{search ? 'No agencies match your search.' : t('admin.createFirstAgency', 'Create your first agency to get started.')}</p>
          </div>
        ) : (
          <ScrollReveal className="animate-fade-up">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('auth.name', 'Name')}</th>
                    <th>{t('auth.email', 'Email')}</th>
                    <th>{t('auth.phone', 'Phone')}</th>
                    <th>{t('agency.status', 'Status')}</th>
                    <th>{t('common.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {agencies.map(a => (
                    <tr key={a.id}>
                      <td><span className="font-semibold">{a.name}</span></td>
                      <td>{a.email}</td>
                      <td>{a.phone}</td>
                      <td>
                        <span className="user-list-item-status">
                          <span className={`status-dot ${a.active !== false ? 'active' : 'inactive'}`} />
                          {a.active !== false ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                        </span>
                      </td>
                      <td>
                        <Button
                          variant={a.active !== false ? 'danger' : 'secondary'}
                          size="sm"
                          onClick={() => handleToggleActive(a.id, a.active !== false)}
                        >
                          {a.active !== false ? t('agency.deactivate', 'Deactivate') : t('agency.activate', 'Activate')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}

export default AgencyManagementPage;
