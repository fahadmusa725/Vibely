import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCircleCheck, faMagnifyingGlass, faUsers } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Search.css';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(urlQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popularCreators, setPopularCreators] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialCreators();
  }, []);

  useEffect(() => {
    setQuery(urlQuery);
    if (urlQuery.trim()) {
      handleSearch(urlQuery);
    } else {
      setResults([]);
    }
  }, [urlQuery]);

  const fetchInitialCreators = async () => {
    try {
      const res = await api.get('/users/search?q=a');
      if (res.data.success) {
        setPopularCreators(res.data.data.slice(0, 6));
      }
    } catch (err) {
      console.error('Initial creators fetch error:', err);
    }
  };

  const handleSearch = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(searchTerm.trim())}`);
      if (res.data.success) {
        setResults(res.data.data);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    setQuery(text);
    setSearchParams(text.trim() ? { q: text } : {});
  };

  const handleFollowToggle = async (e, targetUserId) => {
    e.stopPropagation();
    try {
      await api.post(`/users/${targetUserId}/follow`);
      setResults((prev) =>
        prev.map((u) => {
          if (u._id === targetUserId) {
            const isFollowing = u.followers?.includes(user._id);
            return {
              ...u,
              followers: isFollowing
                ? u.followers.filter((id) => id !== user._id)
                : [...(u.followers || []), user._id],
            };
          }
          return u;
        })
      );
    } catch (err) {
      console.error('Follow toggle error:', err);
    }
  };

  const displayList = query.trim() ? results : popularCreators;

  return (
    <div className="search-page-container">
      <div className="search-input-wrapper card">
        <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: 20 }} className="search-icon" />
        <input
          type="text"
          placeholder="Search creators by username or name..."
          value={query}
          onChange={handleInputChange}
          autoFocus
          className="search-input"
        />
        {query && (
          <button
            className="clear-btn"
            onClick={() => {
              setQuery('');
              setSearchParams({});
            }}
          >
            ✕
          </button>
        )}
      </div>

      <div className="search-results-section">
        <div className="results-header">
          <h3>
            {query.trim()
              ? `Results for "${query}" (${results.length})`
              : 'Discover Creators'}
          </h3>
        </div>

        {loading ? (
          <div className="search-skeletons">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="card user-result-skeleton">
                <div className="skeleton skeleton-circle-sm" />
                <div className="skeleton-lines">
                  <div className="skeleton" style={{ width: '40%', height: 14 }} />
                  <div className="skeleton" style={{ width: '60%', height: 12 }} />
                </div>
              </div>
            ))}
          </div>
        ) : displayList.length > 0 ? (
          <div className="users-results-grid">
            {displayList.map((creator) => {
              const isCurrentUser = user && user._id === creator._id;
              const isFollowing = user && creator.followers?.includes(user._id);

              return (
                <div
                  key={creator._id}
                  className="card user-result-card"
                  onClick={() => navigate(`/profile/${creator.username}`)}
                >
                  <img
                    src={creator.avatar}
                    alt={creator.fullName}
                    className="user-result-avatar"
                  />

                  <div className="user-result-info">
                    <div className="user-result-name-row">
                      <span className="user-fullname">{creator.fullName}</span>
                      {creator.isVerified && (
                        <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 14 }} className="verified-badge" />
                      )}
                    </div>
                    <span className="user-handle">@{creator.username}</span>
                    {creator.bio && <p className="user-bio-snippet">{creator.bio}</p>}
                  </div>

                  <div className="user-result-action">
                    {!isCurrentUser && (
                      <button
                        className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                        onClick={(e) => handleFollowToggle(e, creator._id)}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    )}
                    <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 18 }} className="arrow-nav-icon" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card empty-search-state">
            <FontAwesomeIcon icon={faUsers} style={{ fontSize: 40 }} className="empty-icon" />
            <h4>No creators found</h4>
            <p>Try searching for a different username or full name</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
