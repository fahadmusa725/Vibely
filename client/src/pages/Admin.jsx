import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowTrendDown, faArrowTrendUp, faChartLine, faChevronLeft, faChevronRight, faComment, faFire, faGauge, faHashtag, faImage, faLayerGroup, faMagnifyingGlass, faRightFromBracket, faTrash, faUserShield, faUsers, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl } from '../utils/avatar';
import VerifiedBadge from '../components/VerifiedBadge';
import './Admin.css';

const PAGE_SIZE = 10;

const tooltipStyle = {
  background: 'var(--bg-surface-elevated)',
  border: '1px solid var(--border-color)',
  borderRadius: 10,
  color: 'var(--text-primary)',
  fontSize: '0.8rem',
  boxShadow: 'var(--shadow-md)',
};

const shortDay = (date) => date.slice(5).replace('-', '/');

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

const sumCounts = (rows) => rows.reduce((sum, row) => sum + row.count, 0);

const trendOf = (current, previous) => {
  if (previous === 0) return current > 0 ? { isNew: true } : null;
  const change = Math.round(((current - previous) / previous) * 100);
  return { percent: Math.abs(change), direction: change >= 0 ? 'up' : 'down' };
};

const EmptyState = ({ icon, title, text }) => (
  <div className="admin-empty">
    <span className="admin-empty-icon">
      <FontAwesomeIcon icon={icon} style={{ fontSize: 18 }} />
    </span>
    <p className="admin-empty-title">{title}</p>
    {text && <p className="admin-empty-text">{text}</p>}
  </div>
);

const TrendPill = ({ trend }) => {
  if (!trend) return null;
  if (trend.isNew) return <span className="admin-trend neutral">New this week</span>;

  const up = trend.direction === 'up';
  return (
    <span className={`admin-trend ${up ? 'up' : 'down'}`}>
      <FontAwesomeIcon icon={up ? faArrowTrendUp : faArrowTrendDown} style={{ fontSize: 11 }} />
      {trend.percent}% vs last week
    </span>
  );
};

const StatTile = ({ icon, label, value, tone, trend, footnote }) => (
  <div className="card admin-stat-tile">
    <div className="admin-stat-top">
      <div className={`admin-stat-icon ${tone}`}>
        <FontAwesomeIcon icon={icon} style={{ fontSize: 18 }} />
      </div>
      <span className="admin-stat-label">{label}</span>
    </div>
    {value === null ? (
      <div className="skeleton admin-stat-skeleton" />
    ) : (
      <span className="admin-stat-value">{value.toLocaleString()}</span>
    )}
    <div className="admin-stat-foot">
      {value !== null && trend !== undefined && <TrendPill trend={trend} />}
      {footnote && <span className="admin-stat-note">{footnote}</span>}
    </div>
  </div>
);

const lastPointDot = (color, lastIndex) => ({ cx, cy, index }) =>
  index === lastIndex ? (
    <circle key={`last-${index}`} cx={cx} cy={cy} r={5} fill={color} stroke="var(--bg-surface)" strokeWidth={2} />
  ) : null;

const GrowthChart = ({ title, subtitle, data, color, gradientId }) => {
  const total = data ? sumCounts(data) : 0;

  return (
    <div className="card admin-chart-card">
      <div className="admin-card-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        {data && <span className="admin-chart-total" style={{ color }}>{total.toLocaleString()}</span>}
      </div>

      {!data ? (
        <div className="skeleton admin-chart-skeleton" />
      ) : total === 0 ? (
        <EmptyState icon={faChartLine} title="No activity this week" text="New sign-ups will show up here as they happen." />
      ) : (
        <div className="admin-chart">
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={data} margin={{ top: 14, right: 12, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.5} />
                  <stop offset="60%" stopColor={color} stopOpacity={0.14} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickFormatter={shortDay} tickLine={false} axisLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={shortDay} />
              <Area
                type="monotone"
                dataKey="count"
                name={title}
                stroke={color}
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                dot={lastPointDot(color, data.length - 1)}
                activeDot={{ r: 5, strokeWidth: 0, fill: color }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

const VerifiedDonut = ({ verified, total }) => {
  const regular = Math.max(0, total - verified);
  const share = total > 0 ? Math.round((verified / total) * 100) : 0;
  const segments = [
    { name: 'Verified', value: verified, color: '#0095f6' },
    { name: 'Regular', value: regular, color: '#6c5ce7' },
  ];

  return (
    <div className="card admin-chart-card admin-donut-card">
      <div className="admin-card-header">
        <div>
          <h3>Verified accounts</h3>
          <p>Share of all users</p>
        </div>
        {verified !== null && total > 0 && <span className="admin-chart-total">{share}%</span>}
      </div>

      {verified === null ? (
        <div className="skeleton admin-chart-skeleton" />
      ) : total === 0 ? (
        <EmptyState icon={faUsers} title="No accounts yet" />
      ) : (
        <div className="admin-donut-body">
          <div className="admin-donut">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={segments}
                  dataKey="value"
                  innerRadius={58}
                  outerRadius={80}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                  paddingAngle={verified > 0 && regular > 0 ? 3 : 0}
                >
                  {segments.map((segment) => (
                    <Cell key={segment.name} fill={segment.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="admin-donut-center">
              <span className="admin-donut-value">{verified.toLocaleString()}</span>
              <span className="admin-donut-label">verified</span>
            </div>
          </div>

          <ul className="admin-donut-legend">
            {segments.map((segment) => (
              <li key={segment.name}>
                <span className="admin-legend-dot" style={{ background: segment.color }} />
                <span className="admin-legend-name">{segment.name}</span>
                <span className="admin-legend-count">{segment.value.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const TrendingCard = ({ tags }) => (
  <div className="card admin-list-card">
    <div className="admin-card-header">
      <div>
        <h3>Trending hashtags</h3>
        <p>Last 30 days</p>
      </div>
      <span className="admin-card-badge">
        <FontAwesomeIcon icon={faHashtag} style={{ fontSize: 14 }} />
      </span>
    </div>

    {!tags ? (
      <div className="admin-list-skeleton">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    ) : tags.length === 0 ? (
      <EmptyState icon={faHashtag} title="No hashtags yet" text="Tags from the last 30 days will appear here." />
    ) : (
      <ol className="admin-rank-list">
        {tags.map((item, index) => (
          <li key={item.tag} className="admin-rank-item">
            <span className="admin-rank-number">{index + 1}</span>
            <span className="admin-rank-name">#{item.tag}</span>
            <span className="admin-rank-count">{item.count.toLocaleString()} posts</span>
          </li>
        ))}
      </ol>
    )}
  </div>
);

const TopUsersCard = ({ users }) => (
  <div className="card admin-list-card admin-top-card">
    <div className="admin-card-header">
      <div>
        <h3>Most followed</h3>
        <p>Top creators by followers</p>
      </div>
      <span className="admin-card-badge">
        <FontAwesomeIcon icon={faFire} style={{ fontSize: 14 }} />
      </span>
    </div>

    {!users ? (
      <div className="admin-top-grid">
        {[0, 1, 2, 3, 4].map((item) => (
          <div key={item} className="admin-top-skeleton skeleton" />
        ))}
      </div>
    ) : users.length === 0 ? (
      <EmptyState icon={faFire} title="No followers yet" text="Creators with the most followers will be listed here." />
    ) : (
      <ul className="admin-top-grid">
        {users.map((user) => (
          <li key={user._id} className="admin-top-user">
            <img
              src={getAvatarUrl(user.avatar, user.fullName)}
              alt={user.username}
              className={`admin-top-avatar ${user.isVerified ? 'is-verified' : ''}`}
            />
            <span className="admin-top-name">
              {user.fullName}
              {user.isVerified && <VerifiedBadge size={13} />}
            </span>
            <span className="admin-top-handle">@{user.username}</span>
            <span className="admin-top-followers">{user.followersCount.toLocaleString()} followers</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const Overview = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    api
      .get('/admin/stats')
      .then((res) => {
        if (!ignore) setStats(res.data.data);
      })
      .catch((err) => {
        console.error('Failed to load admin stats:', err);
        if (!ignore) setError('Could not load dashboard stats.');
      });
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const retry = () => {
    setError('');
    setStats(null);
    setReloadKey((key) => key + 1);
  };

  if (error) {
    return (
      <div className="card admin-error">
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={retry}>Try again</button>
      </div>
    );
  }

  const usersThisWeek = stats ? sumCounts(stats.newUsersByDay) : 0;
  const postsThisWeek = stats ? sumCounts(stats.newPostsByDay) : 0;

  return (
    <>
      <div className="admin-stat-grid">
        <StatTile
          icon={faUsers}
          label="Total users"
          value={stats ? stats.totals.users : null}
          tone="tone-accent"
          trend={stats ? trendOf(usersThisWeek, stats.previousWeek.users) : undefined}
        />
        <StatTile
          icon={faImage}
          label="Total posts"
          value={stats ? stats.totals.posts : null}
          tone="tone-blue"
          trend={stats ? trendOf(postsThisWeek, stats.previousWeek.posts) : undefined}
        />
        <StatTile
          icon={faComment}
          label="Total comments"
          value={stats ? stats.totals.comments : null}
          tone="tone-green"
          footnote="All time"
        />
        <StatTile
          icon={faLayerGroup}
          label="Active stories"
          value={stats ? stats.totals.stories : null}
          tone="tone-amber"
          footnote="Live right now"
        />
      </div>

      <div className="admin-row admin-row-split">
        <GrowthChart
          title="New users"
          subtitle="Daily sign-ups, last 7 days"
          data={stats ? stats.newUsersByDay : null}
          color="#6c5ce7"
          gradientId="adminUsersGradient"
        />
        <VerifiedDonut
          verified={stats ? stats.totals.verified : null}
          total={stats ? stats.totals.users : 0}
        />
      </div>

      <div className="admin-row admin-row-split">
        <GrowthChart
          title="New posts"
          subtitle="Daily posts, last 7 days"
          data={stats ? stats.newPostsByDay : null}
          color="#0095f6"
          gradientId="adminPostsGradient"
        />
        <TrendingCard tags={stats ? stats.trendingTags : null} />
      </div>

      <TopUsersCard users={stats ? stats.topFollowed : null} />
    </>
  );
};

const UsersSection = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, hasMore: false });
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(() => {
      setError('');
      api
        .get('/admin/users', { params: { q: search.trim(), page, limit: PAGE_SIZE } })
        .then((res) => {
          if (ignore) return;
          setUsers(res.data.data);
          setPagination(res.data.pagination);
        })
        .catch((err) => {
          console.error('Failed to load users:', err);
          if (!ignore) setError('Could not load users.');
        });
    }, 250);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [search, page, reloadKey]);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
    setUsers(null);
  };

  const toggleVerify = async (user) => {
    setActionError('');
    try {
      const res = await api.patch(`/admin/users/${user._id}/verify`);
      setUsers((prev) =>
        prev.map((item) => (item._id === user._id ? { ...item, isVerified: res.data.data.isVerified } : item))
      );
    } catch (err) {
      console.error('Failed to update verification:', err);
      setActionError(err.response?.data?.message || 'Could not update verification.');
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete @${user.username}? Their posts, comments, stories and follows will be removed. This cannot be undone.`)) return;

    setActionError('');
    try {
      await api.delete(`/admin/users/${user._id}`);
      setUsers((prev) => prev.filter((item) => item._id !== user._id));
      setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    } catch (err) {
      console.error('Failed to delete user:', err);
      setActionError(err.response?.data?.message || 'Could not delete this account.');
    }
  };

  const totalPages = Math.max(1, Math.ceil(pagination.total / PAGE_SIZE));

  return (
    <div className="card admin-users-card">
      <div className="admin-users-toolbar">
        <div className="admin-search">
          <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: 15 }} className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search by username or email"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="admin-search-input"
          />
          {search && (
            <button className="admin-search-clear" onClick={() => handleSearch('')} aria-label="Clear search">
              <FontAwesomeIcon icon={faXmark} style={{ fontSize: 13 }} />
            </button>
          )}
        </div>
        <span className="admin-users-total">{pagination.total.toLocaleString()} accounts</span>
      </div>

      {actionError && <div className="admin-action-error">{actionError}</div>}

      {error ? (
        <div className="admin-empty admin-empty-error">
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={() => setReloadKey((key) => key + 1)}>Try again</button>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="admin-col-user">User</th>
                <th className="admin-col-joined">Joined</th>
                <th className="admin-col-num">Posts</th>
                <th className="admin-col-num">Followers</th>
                <th className="admin-col-status">Status</th>
                <th className="admin-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!users &&
                [0, 1, 2, 3, 4].map((row) => (
                  <tr key={row} className="admin-row-skeleton">
                    <td colSpan={6}>
                      <div className="admin-row-loading">
                        <span className="skeleton admin-skel-avatar" />
                        <span className="skeleton admin-skel-line" />
                        <span className="skeleton admin-skel-line short" />
                      </div>
                    </td>
                  </tr>
                ))}

              {users && users.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={faMagnifyingGlass}
                      title={search ? 'No users match this search' : 'No users yet'}
                      text={search ? 'Try a different username or email.' : undefined}
                    />
                  </td>
                </tr>
              )}

              {users &&
                users.map((user) => {
                  const isAdmin = user.role === 'admin';
                  return (
                    <tr key={user._id}>
                      <td>
                        <div className="admin-user-cell">
                          <img
                            src={getAvatarUrl(user.avatar, user.username)}
                            alt={user.username}
                            className={`admin-user-avatar ${user.isVerified ? 'is-verified' : ''}`}
                          />
                          <div className="admin-user-info">
                            <span className="admin-user-name">@{user.username}</span>
                            <span className="admin-user-email">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="admin-cell-joined">{formatDate(user.createdAt)}</td>
                      <td className="admin-cell-num">{user.postsCount.toLocaleString()}</td>
                      <td className="admin-cell-num">{user.followersCount.toLocaleString()}</td>
                      <td>
                        <div className="admin-badges">
                          {isAdmin && <span className="admin-badge admin">Admin</span>}
                          {user.isVerified ? (
                            <span className="admin-badge verified">
                              <VerifiedBadge size={12} /> Verified
                            </span>
                          ) : (
                            !isAdmin && <span className="admin-badge">Member</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button className="btn btn-secondary admin-verify-btn" onClick={() => toggleVerify(user)}>
                            {user.isVerified ? 'Remove badge' : 'Verify'}
                          </button>
                          <button
                            className="admin-delete-btn"
                            onClick={() => deleteUser(user)}
                            disabled={isAdmin}
                            title={isAdmin ? 'The admin account cannot be deleted' : 'Delete account'}
                            aria-label={`Delete @${user.username}`}
                          >
                            <FontAwesomeIcon icon={faTrash} style={{ fontSize: 14 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      <div className="admin-pagination">
        <button
          className="btn btn-secondary"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page <= 1 || !users}
        >
          <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: 12 }} /> Previous
        </button>
        <span className="admin-page-label">Page {page} of {totalPages}</span>
        <button
          className="btn btn-secondary"
          onClick={() => setPage((current) => current + 1)}
          disabled={!pagination.hasMore || !users}
        >
          Next <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 12 }} />
        </button>
      </div>
    </div>
  );
};

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: faGauge, subtitle: 'Platform activity at a glance' },
  { id: 'users', label: 'Users', icon: faUsers, subtitle: 'Search, verify and manage accounts' },
];

const Admin = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const current = SECTIONS.find((section) => section.id === activeSection);
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-page">
      <aside className="card admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-badge">
            <FontAwesomeIcon icon={faUserShield} style={{ fontSize: 16 }} />
          </span>
          <span>Admin</span>
        </div>

        <nav className="admin-nav">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              className={`admin-nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <FontAwesomeIcon icon={section.icon} style={{ fontSize: 16 }} />
              <span>{section.label}</span>
            </button>
          ))}
        </nav>

        <button className="admin-logout-btn" onClick={handleLogout}>
          <FontAwesomeIcon icon={faRightFromBracket} style={{ fontSize: 14 }} />
          <span>Log out</span>
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>{current.label}</h1>
            <p>{current.subtitle}</p>
          </div>
          <span className="admin-header-date">{today}</span>
        </header>

        {activeSection === 'overview' ? <Overview /> : <UsersSection />}
      </main>
    </div>
  );
};

export default Admin;
