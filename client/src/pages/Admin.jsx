import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowTrendDown, faArrowTrendUp, faCalendarDays, faChartLine, faChevronLeft, faChevronRight, faComment, faDownload, faFire, faGauge, faHashtag, faHeart, faImage, faLayerGroup, faMagnifyingGlass, faRightFromBracket, faTrash, faUsers, faWandMagicSparkles, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl } from '../utils/avatar';
import VerifiedBadge from '../components/VerifiedBadge';
import './Admin.css';

const PAGE_SIZE = 10;
const EXPORT_PAGE_SIZE = 50;
const EXPORT_MAX_PAGES = 20;

const COLORS = {
  users: '#6c5ce7',
  posts: '#0095f6',
  comments: '#ec4899',
  stories: '#f59e0b',
  verified: '#0095f6',
  regular: '#6c5ce7',
};

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

const timeAgo = (value) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const sumCounts = (rows) => rows.reduce((sum, row) => sum + row.count, 0);

const trendOf = (current, previous) => {
  if (previous === 0) return current > 0 ? { isNew: true } : null;
  const change = Math.round(((current - previous) / previous) * 100);
  return { percent: Math.abs(change), direction: change >= 0 ? 'up' : 'down' };
};

const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const buildUsersCsv = (rows) => {
  const header = ['username', 'email', 'role', 'verified', 'joined', 'posts', 'followers'];
  const lines = rows.map((user) =>
    [
      user.username,
      user.email,
      user.role,
      user.isVerified ? 'yes' : 'no',
      new Date(user.createdAt).toISOString().slice(0, 10),
      user.postsCount,
      user.followersCount,
    ]
      .map(escapeCsv)
      .join(',')
  );
  return [header.join(','), ...lines].join('\r\n');
};

const downloadFile = (content, filename) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const fetchAllUsers = async () => {
  const rows = [];
  for (let page = 1; page <= EXPORT_MAX_PAGES; page += 1) {
    const res = await api.get('/admin/users', { params: { page, limit: EXPORT_PAGE_SIZE } });
    rows.push(...res.data.data);
    if (!res.data.pagination.hasMore) break;
  }
  return rows;
};

const EmptyState = ({ icon, title, text }) => (
  <div className="admin-empty">
    <span className="admin-empty-icon">
      <FontAwesomeIcon icon={icon} style={{ fontSize: 16 }} />
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

const StatCard = ({ icon, label, value, tone, trend, footnote }) => (
  <div className={`card admin-stat-card ${tone}`}>
    <div className="admin-stat-top">
      <span className="admin-stat-icon">
        <FontAwesomeIcon icon={icon} style={{ fontSize: 17 }} />
      </span>
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

const UserGrowthChart = ({ data }) => {
  const total = data ? sumCounts(data) : 0;

  return (
    <div className="card admin-chart-card">
      <div className="admin-card-header">
        <div>
          <h3>User growth</h3>
          <p>New users over the last 7 days</p>
        </div>
        <span className="admin-period-chip">Last 7 days</span>
      </div>

      {!data ? (
        <div className="skeleton admin-chart-skeleton" />
      ) : total === 0 ? (
        <EmptyState icon={faChartLine} title="No new users this week" text="Sign-ups will show up here as they happen." />
      ) : (
        <div className="admin-chart">
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={data} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="adminUsersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.users} stopOpacity={0.5} />
                  <stop offset="65%" stopColor={COLORS.users} stopOpacity={0.12} />
                  <stop offset="100%" stopColor={COLORS.users} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickFormatter={shortDay} tickLine={false} axisLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={shortDay} />
              <Area
                type="monotone"
                dataKey="count"
                name="New users"
                stroke={COLORS.users}
                strokeWidth={2.5}
                fill="url(#adminUsersGradient)"
                dot={lastPointDot(COLORS.users, data.length - 1)}
                activeDot={{ r: 5, strokeWidth: 0, fill: COLORS.users }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

const AccountsDonut = ({ verified, total }) => {
  const regular = Math.max(0, total - verified);
  const segments = [
    { name: 'Verified', value: verified, color: COLORS.verified },
    { name: 'Regular', value: regular, color: COLORS.regular },
  ];

  return (
    <div className="card admin-chart-card admin-donut-card">
      <div className="admin-card-header">
        <div>
          <h3>Account mix</h3>
          <p>Verified against regular accounts</p>
        </div>
      </div>

      {verified === null ? (
        <div className="skeleton admin-chart-skeleton" />
      ) : total === 0 ? (
        <EmptyState icon={faUsers} title="No accounts yet" />
      ) : (
        <div className="admin-donut-body">
          <div className="admin-donut">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie
                  data={segments}
                  dataKey="value"
                  innerRadius={62}
                  outerRadius={86}
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
              <span className="admin-donut-value">{total.toLocaleString()}</span>
              <span className="admin-donut-label">Total users</span>
            </div>
          </div>

          <ul className="admin-donut-legend">
            {segments.map((segment) => (
              <li key={segment.name}>
                <span className="admin-legend-dot" style={{ background: segment.color }} />
                <span className="admin-legend-name">{segment.name}</span>
                <span className="admin-legend-count">
                  {segment.value.toLocaleString()}
                  <span className="admin-legend-share">
                    {total > 0 ? ` ${Math.round((segment.value / total) * 100)}%` : ''}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const RecentPostsCard = () => {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    api
      .get('/admin/posts/recent')
      .then((res) => {
        if (!ignore) setPosts(res.data.data);
      })
      .catch((err) => {
        console.error('Failed to load recent posts:', err);
        if (!ignore) setError('Could not load recent posts.');
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="card admin-list-card">
      <div className="admin-card-header">
        <div>
          <h3>Recent posts</h3>
          <p>Latest activity across the platform</p>
        </div>
        <span className="admin-card-badge" style={{ color: COLORS.posts }}>
          <FontAwesomeIcon icon={faImage} style={{ fontSize: 13 }} />
        </span>
      </div>

      {error ? (
        <EmptyState icon={faImage} title={error} />
      ) : !posts ? (
        <div className="admin-list-skeleton">
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState icon={faImage} title="No posts yet" text="Posts from creators will be listed here." />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-posts-table">
            <thead>
              <tr>
                <th>Post</th>
                <th>Author</th>
                <th>Engagement</th>
                <th className="admin-col-date">Date</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post._id}>
                  <td>
                    <div className="admin-post-cell">
                      {post.image ? (
                        <img src={post.image} alt="" className="admin-post-thumb" />
                      ) : (
                        <span className="admin-post-thumb admin-post-thumb-empty">
                          <FontAwesomeIcon icon={faImage} style={{ fontSize: 14 }} />
                        </span>
                      )}
                      <span className="admin-post-caption">{post.caption || 'Untitled post'}</span>
                    </div>
                  </td>
                  <td>
                    {post.author ? (
                      <div className="admin-author-cell">
                        <img src={getAvatarUrl(post.author.avatar, post.author.fullName)} alt="" className="admin-author-avatar" />
                        <span>{post.author.fullName}</span>
                      </div>
                    ) : (
                      <span className="admin-author-missing">Deleted account</span>
                    )}
                  </td>
                  <td>
                    <div className="admin-engagement">
                      <span className="admin-engagement-item likes">
                        <FontAwesomeIcon icon={faHeart} style={{ fontSize: 12 }} />
                        {post.likesCount.toLocaleString()}
                      </span>
                      <span className="admin-engagement-item comments">
                        <FontAwesomeIcon icon={faComment} style={{ fontSize: 12 }} />
                        {post.commentsCount.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="admin-col-date admin-cell-joined">{formatDate(post.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const TopUsersCard = ({ users }) => (
  <div className="card admin-list-card">
    <div className="admin-card-header">
      <div>
        <h3>Top users</h3>
        <p>Most followed creators</p>
      </div>
      <span className="admin-card-badge" style={{ color: COLORS.stories }}>
        <FontAwesomeIcon icon={faFire} style={{ fontSize: 13 }} />
      </span>
    </div>

    {!users ? (
      <div className="admin-list-skeleton">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    ) : users.length === 0 ? (
      <EmptyState icon={faFire} title="No followers yet" text="Creators with the most followers will be listed here." />
    ) : (
      <ol className="admin-top-list">
        {users.map((user, index) => (
          <li key={user._id} className="admin-top-item">
            <span className="admin-top-rank">{index + 1}</span>
            <img
              src={getAvatarUrl(user.avatar, user.fullName)}
              alt={user.username}
              className={`admin-top-avatar ${user.isVerified ? 'is-verified' : ''}`}
            />
            <div className="admin-top-info">
              <span className="admin-top-name">
                {user.fullName}
                {user.isVerified && <VerifiedBadge size={12} />}
              </span>
              <span className="admin-top-handle">@{user.username}</span>
            </div>
            <span className="admin-top-count">{user.followersCount.toLocaleString()}</span>
          </li>
        ))}
      </ol>
    )}
  </div>
);

const QuickActions = ({ onManageUsers, onExport, exporting, exportError }) => (
  <div className="card admin-side-card">
    <div className="admin-card-header">
      <div>
        <h3>Quick actions</h3>
        <p>Common admin tasks</p>
      </div>
    </div>
    <div className="admin-quick-list">
      <button className="admin-quick-action manage" onClick={onManageUsers}>
        <span className="admin-quick-icon">
          <FontAwesomeIcon icon={faUsers} style={{ fontSize: 15 }} />
        </span>
        <span className="admin-quick-text">Manage users</span>
        <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 12 }} className="admin-quick-arrow" />
      </button>
      <button className="admin-quick-action export" onClick={onExport} disabled={exporting}>
        <span className="admin-quick-icon">
          <FontAwesomeIcon icon={faDownload} style={{ fontSize: 14 }} />
        </span>
        <span className="admin-quick-text">{exporting ? 'Exporting...' : 'Export user list (CSV)'}</span>
        <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 12 }} className="admin-quick-arrow" />
      </button>
    </div>
    {exportError && <p className="admin-export-error">{exportError}</p>}
  </div>
);

const RecentSignupsCard = () => {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    api
      .get('/admin/users', { params: { page: 1, limit: 5 } })
      .then((res) => {
        if (!ignore) setUsers(res.data.data);
      })
      .catch((err) => {
        console.error('Failed to load recent signups:', err);
        if (!ignore) setError('Could not load recent signups.');
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="card admin-side-card">
      <div className="admin-card-header">
        <div>
          <h3>Recent signups</h3>
          <p>Newest accounts first</p>
        </div>
      </div>

      {error ? (
        <EmptyState icon={faUsers} title={error} />
      ) : !users ? (
        <div className="admin-list-skeleton">
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      ) : users.length === 0 ? (
        <EmptyState icon={faUsers} title="No signups yet" />
      ) : (
        <ul className="admin-signup-list">
          {users.map((user) => (
            <li key={user._id} className="admin-signup-item">
              <img
                src={getAvatarUrl(user.avatar, user.username)}
                alt={user.username}
                className="admin-signup-avatar"
              />
              <div className="admin-signup-info">
                <span className="admin-signup-name">@{user.username}</span>
                <span className="admin-signup-time">{timeAgo(user.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const TrendingCard = ({ tags }) => (
  <div className="card admin-side-card">
    <div className="admin-card-header">
      <div>
        <h3>Trending hashtags</h3>
        <p>Last 30 days</p>
      </div>
      <span className="admin-card-badge" style={{ color: COLORS.comments }}>
        <FontAwesomeIcon icon={faHashtag} style={{ fontSize: 13 }} />
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
            <span className="admin-rank-count">{item.count.toLocaleString()}</span>
          </li>
        ))}
      </ol>
    )}
  </div>
);

const Overview = ({ onManageUsers }) => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

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

  const exportUsers = async () => {
    setExporting(true);
    setExportError('');
    try {
      const rows = await fetchAllUsers();
      if (rows.length === 0) {
        setExportError('There are no users to export.');
        return;
      }
      const date = new Date().toISOString().slice(0, 10);
      downloadFile(buildUsersCsv(rows), `vibely-users-${date}.csv`);
    } catch (err) {
      console.error('Failed to export users:', err);
      setExportError('Could not export users. Please try again.');
    } finally {
      setExporting(false);
    }
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
    <div className="admin-dashboard">
      <div className="admin-dash-main">
        <div className="admin-stat-grid">
          <StatCard
            icon={faUsers}
            label="Total users"
            value={stats ? stats.totals.users : null}
            tone="tone-violet"
            trend={stats ? trendOf(usersThisWeek, stats.previousWeek.users) : undefined}
          />
          <StatCard
            icon={faImage}
            label="Total posts"
            value={stats ? stats.totals.posts : null}
            tone="tone-blue"
            trend={stats ? trendOf(postsThisWeek, stats.previousWeek.posts) : undefined}
          />
          <StatCard
            icon={faComment}
            label="Total comments"
            value={stats ? stats.totals.comments : null}
            tone="tone-pink"
            footnote="All time"
          />
          <StatCard
            icon={faLayerGroup}
            label="Active stories"
            value={stats ? stats.totals.stories : null}
            tone="tone-amber"
            footnote="Live right now"
          />
        </div>

        <div className="admin-row admin-row-split">
          <UserGrowthChart data={stats ? stats.newUsersByDay : null} />
          <AccountsDonut verified={stats ? stats.totals.verified : null} total={stats ? stats.totals.users : 0} />
        </div>

        <div className="admin-row admin-row-split">
          <RecentPostsCard />
          <TopUsersCard users={stats ? stats.topFollowed : null} />
        </div>
      </div>

      <aside className="admin-dash-side">
        <QuickActions
          onManageUsers={onManageUsers}
          onExport={exportUsers}
          exporting={exporting}
          exportError={exportError}
        />
        <RecentSignupsCard />
        <TrendingCard tags={stats ? stats.trendingTags : null} />
      </aside>
    </div>
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
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const current = SECTIONS.find((section) => section.id === activeSection);
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-badge">
            <FontAwesomeIcon icon={faWandMagicSparkles} style={{ fontSize: 16 }} />
          </span>
          <div className="admin-brand-text">
            <span className="admin-brand-name">Vibely</span>
            <span className="admin-brand-sub">Admin console</span>
          </div>
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

        <div className="admin-quick-links">
          <span className="admin-quick-links-title">Quick links</span>
          <button className="admin-link-item" onClick={() => setActiveSection('users')}>
            <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: 13 }} />
            <span>Find an account</span>
          </button>
        </div>

        <button className="admin-logout-btn" onClick={handleLogout}>
          <FontAwesomeIcon icon={faRightFromBracket} style={{ fontSize: 14 }} />
          <span>Log out</span>
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>Welcome back, {user?.fullName || 'Admin'}</h1>
            <p>{current.subtitle}</p>
          </div>
          <span className="admin-header-date">
            <FontAwesomeIcon icon={faCalendarDays} style={{ fontSize: 13 }} />
            {today}
          </span>
        </header>

        {activeSection === 'overview' ? (
          <Overview onManageUsers={() => setActiveSection('users')} />
        ) : (
          <UsersSection />
        )}
      </main>
    </div>
  );
};

export default Admin;
