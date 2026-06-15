import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getUsers, toggleUserStatus } from '../../services/adminService';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import { ScrollReveal } from '../../hooks/useScrollAnimation';
import { SkeletonList } from '../../components/common/SkeletonLoader';

function UserManagementPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState(null);
  const [toggleError, setToggleError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    setError('');
    getUsers(page, 10, debouncedSearch)
      .then(data => {
        setUsers(Array.isArray(data) ? data : data.data || []);
        setTotalPages(data.totalPages || 0);
      })
      .catch(() => setError(t('admin.errorLoadingUsers', 'Failed to load users')))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch]);

  const handleToggle = async (id) => {
    setToggling(id);
    setToggleError('');
    try {
      await toggleUserStatus(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
    } catch (err) {
      setToggleError(err.response?.data?.message || t('admin.errorUpdateUserStatus', 'Failed to update user status'));
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="container">
        <ScrollReveal className="animate-fade-up">
          <div className="admin-header">
            <div>
              <h1 className="admin-title">{t('admin.userManagement', 'User Management')}</h1>
              <p className="text-muted">{t('admin.usersCount', '{{count}} users on the platform', { count: users.length })}</p>
            </div>
            <input
              className="form-input"
              style={{ maxWidth: 280 }}
              placeholder={t('admin.searchUsers', 'Search by name, email, phone, role…')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </ScrollReveal>

        {error ? (
          <div className="error-state">
            <div className="error-state-icon">✕</div>
            <h3>{t('admin.errorLoadingUsers', 'Error Loading Users')}</h3>
            <p className="text-muted mt-sm">{error}</p>
          </div>
        ) : loading ? (
          <SkeletonList rows={8} />
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3 className="empty-state-title">{t('admin.noUsersFound', 'No Users Found')}</h3>
            <p className="empty-state-text">{search ? 'No users match your search.' : t('admin.noUsersRegistered', 'No users are registered yet.')}</p>
          </div>
        ) : (
          <ScrollReveal className="animate-fade-up">
            {toggleError && (
              <div className="error-state" style={{ marginBottom: 16 }}>
                <p className="text-muted">{toggleError}</p>
              </div>
            )}
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('admin.user', 'User')}</th>
                    <th>{t('admin.email', 'Email')}</th>
                    <th>{t('agency.status', 'Status')}</th>
                    <th>{t('common.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="user-list-item-info">
                          <div className="user-list-item-avatar">
                            {u.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                          </div>
                          <span className="user-list-item-name">{u.name}</span>
                        </div>
                      </td>
                      <td><span className="user-list-item-email">{u.email}</span></td>
                      <td>
                        <span className="user-list-item-status">
                          <span className={`status-dot ${u.active ? 'active' : 'inactive'}`} />
                          {u.active ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                        </span>
                      </td>
                      <td>
                        <Button
                          variant={u.active ? 'danger' : 'secondary'}
                          size="sm"
                          loading={toggling === u.id}
                          onClick={() => handleToggle(u.id)}
                        >
                          {u.active ? t('agency.deactivate', 'Deactivate') : t('agency.activate', 'Activate')}
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

export default UserManagementPage;
