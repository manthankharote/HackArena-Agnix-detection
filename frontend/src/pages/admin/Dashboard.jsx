import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import MapView from '../../components/MapView';
import { getReports, getReportStats, getDashboard } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';

const sev = { critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };
const statusBadge = { pending: 'badge-pending', assigned: 'badge-assigned', 'in-progress': 'badge-in-progress', completed: 'badge-completed', rejected: 'badge-rejected' };

export default function AdminDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const { alerts } = useSocket() || {};

  // CCTV source-switching state
  const [cctvSource, setCctvSource] = useState('webcam');
  const [cctvUrl, setCctvUrl] = useState('');
  const [cctvLoading, setCctvLoading] = useState(false);
  const [cctvMsg, setCctvMsg] = useState('');

  const handleSwitchSource = async (e) => {
    e.preventDefault();
    setCctvLoading(true);
    setCctvMsg('');
    try {
      const res = await API.post('/cctv/config', { source: cctvSource, url: cctvUrl });
      setCctvMsg('✅ ' + res.data.message);
      if (cctvSource === 'webcam') setCctvUrl('');
      
      // Force refresh the image tag by appending a timestamp to bypass browser caching
      const img = document.getElementById('cctv-stream-feed');
      if (img) {
        const baseUrl = img.src.split('?')[0];
        img.src = `${baseUrl}?token=${localStorage.getItem('cc_token')}&t=${Date.now()}`;
        img.style.display = 'block';
        if (img.nextSibling) img.nextSibling.style.display = 'none';
      }
    } catch (err) {
      setCctvMsg('❌ ' + (err.response?.data?.message || err.message));
    } finally {
      setCctvLoading(false);
      setTimeout(() => setCctvMsg(''), 4000);
    }
  };

  // Ward staff state
  const [wardStaff, setWardStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [editingPhones, setEditingPhones] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [staffMsg, setStaffMsg] = useState('');

  const load = async () => {
    try {
      const [rRes, sRes] = await Promise.all([getReports({ limit: 100 }), getDashboard()]);
      setReports(rRes.data.data || []);
      setStats(sRes.data.data || {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadWardStaff = async () => {
    setStaffLoading(true);
    try {
      const res = await API.get('/users/ward-staff');
      setWardStaff(res.data.data || []);
      const phones = {};
      (res.data.data || []).forEach(s => { phones[s._id] = s.phone || ''; });
      setEditingPhones(phones);
    } catch (e) { console.error(e); }
    finally { setStaffLoading(false); }
  };

  const savePhone = async (userId) => {
    const phone = editingPhones[userId];
    if (!phone || phone.trim() === '') return setStaffMsg('❌ Enter a valid phone number');
    setSavingId(userId);
    setStaffMsg('');
    try {
      await API.put(`/users/${userId}/phone`, { phone: phone.trim() });
      setStaffMsg('✅ Phone number updated successfully!');
      // Refresh staff list
      await loadWardStaff();
    } catch (e) {
      setStaffMsg('❌ Failed to update: ' + (e.response?.data?.message || e.message));
    } finally {
      setSavingId(null);
      setTimeout(() => setStaffMsg(''), 3000);
    }
  };

  useEffect(() => { load(); loadWardStaff(); }, []);

  // Refresh when new socket alert comes in
  useEffect(() => {
    if (alerts && alerts.length > 0) load();
  }, [alerts]);

  const filtered = filter ? reports.filter(r => r.status === filter) : reports;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <div className="page-title">📊 Admin Dashboard</div>
            <div className="page-subtitle">Monitor alerts and manage cleanup tasks</div>
          </div>
          <button className="btn btn-secondary" onClick={load}>🔄 Refresh</button>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {[
            { label: 'Total Reports', value: stats.totalReports || 0, icon: '📁', cls: 'blue' },
            { label: 'Pending', value: stats.pendingReports || 0, icon: '⏳', cls: 'orange' },
            { label: 'Active', value: stats.assignedReports || 0, icon: '🔄', cls: 'cyan' },
            { label: 'Completed', value: stats.completedReports || 0, icon: '✅', cls: 'green' },
            { label: 'Resolution %', value: `${stats.resolutionRate || 0}%`, icon: '📈', cls: 'purple' },
            { label: 'Live Alerts', value: alerts?.length || 0, icon: '🔴', cls: 'red' },
          ].map(s => (
            <div key={s.label} className={`stat-card ${s.cls}`}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-info"><div className="value">{s.value}</div><div className="label">{s.label}</div></div>
            </div>
          ))}
        </div>

        {/* Ward Staff Phone Management */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>📱 WhatsApp Alert Numbers — Ward Staff</div>
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={loadWardStaff}>🔄 Reload</button>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16, marginTop: 0 }}>
            Manage phone numbers for all workers and admins in your ward. Alerts are sent to every number listed below.
          </p>

          {staffMsg && (
            <div style={{
              padding: '8px 14px', borderRadius: 8, marginBottom: 12,
              fontSize: '0.85rem', fontWeight: 500,
              background: staffMsg.startsWith('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              color: staffMsg.startsWith('✅') ? '#22c55e' : '#ef4444',
              border: `1px solid ${staffMsg.startsWith('✅') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}>
              {staffMsg}
            </div>
          )}

          {staffLoading ? (
            <div className="empty-state"><div className="spinner" /></div>
          ) : wardStaff.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <p>No staff found in your ward. Register workers and admins with your ward name first.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Email</th>
                    <th style={{ minWidth: 180 }}>WhatsApp Number</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {wardStaff.map(person => (
                    <tr key={person._id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                        {person.name}
                      </td>
                      <td>
                        <span className={`badge ${person.role === 'admin' ? 'badge-high' : 'badge-medium'}`} style={{ fontSize: '0.75rem' }}>
                          {person.role === 'admin' ? '🧑‍💼 Admin' : '👷 Worker'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{person.email}</td>
                      <td>
                        <input
                          type="text"
                          className="form-input"
                          style={{ padding: '6px 10px', fontSize: '0.85rem', height: 34, width: '100%' }}
                          placeholder="e.g. 9421718269"
                          value={editingPhones[person._id] || ''}
                          onChange={e => setEditingPhones(prev => ({ ...prev, [person._id]: e.target.value }))}
                        />
                      </td>
                      <td>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '5px 14px', fontSize: '0.78rem', height: 34 }}
                          disabled={savingId === person._id}
                          onClick={() => savePhone(person._id)}
                        >
                          {savingId === person._id ? '⏳...' : '💾 Save'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live Alerts Banner */}
        {alerts?.length > 0 && (
          <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.05)' }}>
            <div className="card-title" style={{ color: 'var(--accent-red)' }}>🔴 Live Alerts ({alerts.length})</div>
            <div className="alert-feed">
              {alerts.slice(0, 3).map((a, i) => (
                <div key={i} className={`alert-item ${a.severity}`}>
                  <span style={{ fontSize: '1.5rem' }}>🚨</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{a.address || 'New Alert'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Severity: <span className={`badge ${sev[a.severity]}`}>{a.severity}</span> · {a.source}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {new Date(a._alertTs || Date.now()).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CCTV Live Stream Panel (Admins Only) */}
        {(user?.role === 'admin' || user?.role === 'superadmin') && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="flex-between" style={{ marginBottom: 16 }}>
              <div className="card-title" style={{ marginBottom: 0 }}>
                📹 Live CCTV Surveillance & AI Detection (Team AgniX)
              </div>
              <span className="badge badge-high" style={{ background: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                🔴 LIVE
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#0b0f19', borderRadius: 8, padding: 12, border: '1px solid #1e293b' }}>
              <img 
                id="cctv-stream-feed"
                src={`${import.meta.env.VITE_API_URL || '/api'}/cctv/stream?token=${localStorage.getItem('cc_token')}`} 
                alt="Live AI Surveillance Stream" 
                style={{ width: '100%', maxHeight: '480px', objectFit: 'contain', borderRadius: 6, border: '1px solid #334155' }} 
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '360px', width: '100%', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '3rem', marginBottom: 16 }}>📹</span>
                <p style={{ margin: 0, fontWeight: 500 }}>Live stream offline or connecting...</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>Make sure your YOLO python script is running.</p>
              </div>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <span>🎯 Model: YOLOv11 (Garbage-Detection-Env)</span>
                <span>📶 Status: Connected to local/AWS proxy</span>
              </div>
            </div>

            {/* Camera Control Panel Form */}
            <form onSubmit={handleSwitchSource} style={{ width: '100%', marginTop: 16, borderTop: '1px solid #1e293b', paddingTop: 16 }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 12 }}>
                ⚙️ Change Camera Stream Source
              </div>
              
              {cctvMsg && (
                <div style={{
                  padding: '8px 12px', borderRadius: 6, marginBottom: 12,
                  fontSize: '0.8rem', fontWeight: 500,
                  background: cctvMsg.startsWith('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  color: cctvMsg.startsWith('✅') ? '#22c55e' : '#ef4444',
                  border: `1px solid ${cctvMsg.startsWith('✅') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                }}>
                  {cctvMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>Source Type</label>
                  <select 
                    className="form-select" 
                    style={{ width: '100%', height: 36, padding: '4px 10px', fontSize: '0.82rem' }}
                    value={cctvSource} 
                    onChange={e => setCctvSource(e.target.value)}
                  >
                    <option value="webcam">💻 Local Webcam</option>
                    <option value="droidcam">📱 DroidCam (IP Camera)</option>
                    <option value="youtube">📺 YouTube Live Stream</option>
                    <option value="rtsp">📹 RTSP Feed</option>
                    <option value="video">📂 Video File</option>
                  </select>
                </div>

                {cctvSource !== 'webcam' && (
                  <div style={{ flex: 2, minWidth: 200 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                      {cctvSource === 'youtube' ? 'YouTube Video URL' : cctvSource === 'video' ? 'Video File Path (on host)' : 'Stream URL / IP Address'}
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ width: '100%', height: 36, padding: '6px 12px', fontSize: '0.82rem' }}
                      placeholder={
                        cctvSource === 'youtube' ? 'https://www.youtube.com/watch?v=...' 
                        : cctvSource === 'droidcam' ? 'http://192.168.1.15:4747/video' 
                        : cctvSource === 'video' ? 'photos/demo.mp4'
                        : 'rtsp://admin:admin123@192.168.1.100:554/stream1'
                      }
                      value={cctvUrl}
                      onChange={e => setCctvUrl(e.target.value)}
                      required
                    />
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ height: 36, padding: '0 20px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                  disabled={cctvLoading}
                >
                  {cctvLoading ? '⏳ Applying...' : '⚡ Apply Source'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Map */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">🗺️ Incident Map</div>
          {!loading && <MapView reports={filtered} height="380px" />}
        </div>

        {/* Reports Table */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>📋 Reports</div>
            <select className="form-select" style={{ width: 160 }} value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All Status</option>
              {['pending', 'assigned', 'in-progress', 'completed', 'rejected'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {loading ? (
            <div className="empty-state"><div className="spinner" /></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Image</th><th>Address</th><th>Source</th><th>Severity</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r._id}>
                      <td><img src={r.image} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} onError={e => e.target.style.display = 'none'} /></td>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{r.address}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.ward}</div>
                      </td>
                      <td><span style={{ fontSize: '0.82rem' }}>{r.source === 'cctv' ? '📹 CCTV' : '📱 Citizen'}</span></td>
                      <td><span className={`badge ${sev[r.severity]}`}>{r.severity}</span></td>
                      <td><span className={`badge ${statusBadge[r.status]}`}>{r.status}</span></td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="empty-state"><div className="empty-icon">📭</div><p>No reports found</p></div>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
