import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2,
  Brain,
  MapPin,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  Bell,
  UserCheck,
  Camera,
  Database,
  Activity,
  ChevronRight,
  CheckCircle2,
  Clock,
  Users,
  Globe,
  ArrowRight,
  Server,
  Layers,
  Map
} from 'lucide-react';
import './LandingPage.css';
import cctvWasteFeed from './cctv_waste_feed.png';

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('cctv'); // 'cctv', 'reports', 'heatmap'
  const [theme, setTheme] = useState(() => localStorage.getItem('agnix-theme') || 'dark');
  const [mockAlerts, setMockAlerts] = useState([
    { id: 1, location: 'Ward 4 - Town Hall', severity: 'critical', status: 'Pending', time: '2m ago' },
    { id: 2, location: 'Ward 12 - Railway Station', severity: 'high', status: 'Assigned', time: '12m ago' },
    { id: 3, location: 'Ward 7 - Connaught Place', severity: 'medium', status: 'Completed', time: '1h ago' },
  ]);

  // Keep track of theme shifts from global toggle
  useEffect(() => {
    const handleStorageChange = () => {
      setTheme(localStorage.getItem('agnix-theme') || 'dark');
    };
    window.addEventListener('storage', handleStorageChange);
    // Periodically sync theme in case of local updates
    const interval = setInterval(() => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      if (currentTheme !== theme) {
        setTheme(currentTheme);
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [theme]);

  const handleScrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'superadmin') return '/superadmin';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'worker') return '/admin/tasks';
    return '/citizen';
  };

  const handleResolveAlert = (id) => {
    setMockAlerts(prev => prev.map(alert =>
      alert.id === id
        ? { ...alert, status: alert.status === 'Pending' ? 'Assigned' : alert.status === 'Assigned' ? 'Completed' : 'Pending' }
        : alert
    ));
  };

  return (
    <div className="landing-container">
      {/* Navigation */}
      <nav className="landing-nav">
        <Link to="/" className="nav-brand">
          <h2>🤖 AgniX</h2>
        </Link>
        <ul className="nav-links">
          <li><span onClick={() => handleScrollTo('problem')} className="nav-link">Problem</span></li>
          <li><span onClick={() => handleScrollTo('solution')} className="nav-link">Solution</span></li>
          <li><span onClick={() => handleScrollTo('features')} className="nav-link">Features</span></li>
          <li><span onClick={() => handleScrollTo('showcase')} className="nav-link">Dashboard</span></li>
          <li><span onClick={() => handleScrollTo('tech')} className="nav-link">Technology</span></li>
          <li><span onClick={() => handleScrollTo('about')} className="nav-link">About</span></li>
        </ul>
        <div className="nav-ctas">
          {user ? (
            <Link to={getDashboardLink()} className="btn btn-primary btn-sm">
              Dashboard <ChevronRight size={14} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Report Waste</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg">
          <div className="hero-mesh" />
          <div className="hero-glow-1" />
          <div className="hero-glow-2" />
        </div>

        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="hero-badge"
          >
            <Brain size={14} /> Next-Gen Civic Intelligence
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="hero-title"
          >
            Autonomous AI Agent for <br />
            <span className="gradient-text-green">Illegal Dumping Detection & Evidence Collection</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 600, marginTop: '12px', opacity: 0.9 }}>
              बेकायदेशीर कचरा टाकणे शोधणे आणि पुरावा गोळा करण्यासाठी स्वायत्त एआय एजंट
            </div>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hero-subtitle"
          >
            Empowering municipal corporations with real-time YOLOv11 surveillance, autonomous environmental logic, and instant WhatsApp dispatch alerts with irrefutable evidence.
            <span style={{ display: 'block', marginTop: '8px', fontSize: '0.98rem', opacity: 0.85, fontWeight: 500 }}>
              यलोव्ह११ (YOLOv11) रिअल-टाइम सर्वेक्षण, स्वायत्त निर्णय प्रणाली आणि संपूर्ण पुराव्यासह त्वरित व्हॉट्सॲप सूचनांद्वारे महानगरपालिकांना सक्षम करणे.
            </span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hero-ctas"
          >
            <Link to={user ? "/report/new" : "/register"} className="btn btn-primary">
              <Camera size={18} /> Report Waste
            </Link>
            <button onClick={() => handleScrollTo('solution')} className="btn btn-secondary">
              Explore Solution <ArrowRight size={16} />
            </button>
          </motion.div>
        </div>

        {/* Floating Mockup Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="hero-mockup-wrapper"
        >
          <div className="hero-mockup">
            <div className="mockup-header">
              <div className="dot red" />
              <div className="dot yellow" />
              <div className="dot green" />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '12px', fontFamily: 'monospace' }}>
                agnix-ai-dashboard.gov
              </span>
            </div>
            <div className="mockup-body">
              {/* Mockup Sidebar */}
              <div className="mockup-sidebar">
                <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                    🤖 AgniX Admin
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                    SECURE MUNICIPAL PORTAL
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { id: 'cctv', icon: <Camera size={14} />, label: 'Live CCTV AI Feeds' },
                    { id: 'reports', icon: <AlertTriangle size={14} />, label: 'Citizen Reports' },
                    { id: 'heatmap', icon: <Map size={14} />, label: 'Hotspot Heatmaps' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        background: activeTab === tab.id ? 'var(--glass)' : 'transparent',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        color: activeTab === tab.id ? 'var(--accent-green)' : 'var(--text-secondary)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        textAlign: 'left',
                        cursor: 'pointer',
                        width: '100%',
                        transition: 'var(--transition)'
                      }}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: '60px', padding: '10px', background: 'rgba(59,130,246,0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59,130,246,0.1)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>SYSTEM HEALTH</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '4px' }}>🟢 YOLOv11 Engine Active</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>🟢 WhatsApp Dispatcher Ready</div>
                </div>
              </div>

              {/* Mockup Content Panels */}
              <div className="mockup-main">
                <AnimatePresence mode="wait">
                  {activeTab === 'cctv' && (
                    <motion.div
                      key="cctv"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.3 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Camera Stream: CAM-04A</h4>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sector 4 - Commercial Zone Market</p>
                        </div>
                        <span className="badge badge-critical">AI DETECTING</span>
                      </div>

                      <div className="cctv-feed-simulator">
                        <img src={cctvWasteFeed} alt="Simulated AI detection feed" className="cctv-img" />
                        <div className="cctv-overlay">
                          <div className="cctv-meta">
                            <span>REC 🟢</span>
                            <span>CAM-04A | 2026-06-05 00:31:04</span>
                          </div>
                          {/* YOLO Bounding Box */}
                          <div className="cctv-bbox" style={{ top: '35%', left: '20%', width: '45%', height: '40%' }}>
                            <span className="cctv-bbox-label">🗑️ Illegal Waste Pile (94.2%)</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'reports' && (
                    <motion.div
                      key="reports"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.3 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Incoming Incident Reports</h4>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Citizen-uploaded issues waiting for action</p>
                        </div>
                        <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.7rem', padding: '4px 10px' }}>Refresh</button>
                      </div>

                      <div className="mock-alert-list">
                        {mockAlerts.map(alert => (
                          <div className="mock-alert-card" key={alert.id}>
                            <div className="mock-alert-left">
                              <div className={`mock-alert-indicator ${alert.severity === 'critical' ? 'red' : 'orange'}`} />
                              <div>
                                <div className="mock-alert-title">{alert.location}</div>
                                <div className="mock-alert-time">Severity: <span style={{ textTransform: 'capitalize', fontWeight: 'bold', color: alert.severity === 'critical' ? 'var(--accent-red)' : 'var(--accent-orange)' }}>{alert.severity}</span> • {alert.time}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className={`badge ${alert.status === 'Pending' ? 'badge-pending' : alert.status === 'Assigned' ? 'badge-assigned' : 'badge-completed'
                                }`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                                {alert.status}
                              </span>
                              {alert.status !== 'Completed' && (
                                <button
                                  onClick={() => handleResolveAlert(alert.id)}
                                  className="btn btn-primary btn-sm"
                                  style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: '4px' }}
                                >
                                  {alert.status === 'Pending' ? 'Assign Worker' : 'Mark Done'}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'heatmap' && (
                    <motion.div
                      key="heatmap"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.3 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                    >
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Dynamic GIS Waste Heatmap</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Identifying high-frequency dumping hotspots</p>
                      </div>

                      <div className="map-heatmap-mock">
                        <div className="map-bg-grid" />
                        {/* Simulated roads */}
                        <div className="map-road" style={{ top: '40px', left: 0, width: '100%', height: '14px' }} />
                        <div className="map-road" style={{ top: '180px', left: 0, width: '100%', height: '20px' }} />
                        <div className="map-road" style={{ top: 0, left: '120px', width: '16px', height: '100%' }} />
                        <div className="map-road" style={{ top: 0, left: '380px', width: '22px', height: '100%' }} />

                        {/* Heatmap glowing dots */}
                        <div className="heat-glow high" style={{ top: '25%', left: '18%' }} />
                        <div className="heat-glow med" style={{ top: '65%', left: '55%' }} />
                        <div className="heat-glow low" style={{ top: '45%', left: '75%' }} />
                        <div className="heat-glow high" style={{ top: '10%', left: '70%' }} />

                        {/* Interactive map markers */}
                        <div style={{ position: 'absolute', top: '35%', left: '26%', color: 'var(--accent-red)', animation: 'bounce 2s infinite' }}>
                          <MapPin size={24} />
                        </div>
                        <div style={{ position: 'absolute', top: '70%', left: '60%', color: 'var(--accent-orange)' }}>
                          <MapPin size={20} />
                        </div>

                        <div style={{
                          position: 'absolute',
                          bottom: '10px',
                          right: '10px',
                          background: 'rgba(10, 14, 26, 0.8)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '8px 12px',
                          fontSize: '0.65rem'
                        }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Legend</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-red)' }} /> High Density Spot</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-orange)' }} /> Medium Density Spot</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)' }} /> Cleaned Area</div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="landing-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">The Municipal Challenge / शहरासमोरील आव्हाने</span>
            <h2 className="section-title">The Challenge Cities Face / कचरा व्यवस्थापनातील समस्या</h2>
            <p className="section-subtitle">
              Municipal corporations struggle with outdated, manual systems to keep public areas clean. Passive infrastructure leads to delayed responses and structural inefficiencies.
              <span style={{ display: 'block', marginTop: '6px', fontSize: '0.92rem', opacity: 0.85 }}>
                सार्वजनिक ठिकाणे स्वच्छ ठेवण्यासाठी महानगरपालिकांना जुन्या आणि मानवी पद्धतींमुळे अनेक अडचणी येतात. यामुळे तक्रार निवारण्यास विलंब होतो आणि मनुष्यबळाचे योग्य नियोजन करता येत नाही.
              </span>
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            <motion.div
              viewport={{ once: true }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="glass-card"
            >
              <div className="card-icon-wrapper">
                <Trash2 />
              </div>
              <h3 className="card-title-lg">Illegal Garbage Dumping <br /><span style={{ fontSize: '0.95rem', color: 'var(--accent-green)' }}>बेकायदेशीर कचरा टाकणे</span></h3>
              <p className="card-description">
                Piles of waste pile up on roadsides, street corners, and empty lots. Without automated monitoring, these spots rapidly become persistent public health hazards.
                <span style={{ display: 'block', marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                  रस्त्यांच्या कडेला आणि मोकळ्या भूखंडांवर कचऱ्याचे ढीग साचतात, ज्यामुळे आरोग्याला मोठा धोका निर्माण होतो.
                </span>
              </p>
            </motion.div>

            <motion.div
              viewport={{ once: true }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="glass-card blue-card"
            >
              <div className="card-icon-wrapper" style={{ color: 'var(--accent-blue)' }}>
                <Clock />
              </div>
              <h3 className="card-title-lg">Delayed Complaint Resolution <br /><span style={{ fontSize: '0.95rem', color: 'var(--accent-blue)' }}>तक्रार निवारण्यास विलंब</span></h3>
              <p className="card-description">
                Traditional complaints rely on citizens calling or writing. Processing, forwarding, and acting on these issues takes days or weeks, resulting in unhygienic environments.
                <span style={{ display: 'block', marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                  नागरिकांच्या तक्रारी पोहोचण्यास आणि त्यावर प्रत्यक्ष कारवाई होण्यास दिवस किंवा आठवडे लागतात, ज्यामुळे परिसरात दुर्गंधी व अस्वच्छता पसरते.
                </span>
              </p>
            </motion.div>

            <motion.div
              viewport={{ once: true }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="glass-card"
            >
              <div className="card-icon-wrapper">
                <Camera />
              </div>
              <h3 className="card-title-lg">Lack of Live Monitoring <br /><span style={{ fontSize: '0.95rem', color: 'var(--accent-green)' }}>देखरेखीचा अभाव</span></h3>
              <p className="card-description">
                Cities have thousands of CCTV cameras, but they are only checked after an incident. Authorities lack the manpower to monitor feeds live for civic violations.
                <span style={{ display: 'block', marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                  शहरात सीसीटीव्ही आहेत, पण कचरा फेकणाऱ्यांवर २४/७ लक्ष ठेवण्यासाठी सतत मनुष्यबळ उपलब्ध नसते.
                </span>
              </p>
            </motion.div>

            <motion.div
              viewport={{ once: true }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="glass-card blue-card"
            >
              <div className="card-icon-wrapper" style={{ color: 'var(--accent-blue)' }}>
                <TrendingUp />
              </div>
              <h3 className="card-title-lg">Poor Resource Allocation <br /><span style={{ fontSize: '0.95rem', color: 'var(--accent-blue)' }}>संसाधनांचे अयोग्य वाटप</span></h3>
              <p className="card-description">
                Sanitation crews are deployed on fixed schedules instead of dynamic demand. Trucks sweep clean streets while garbage piles block busy commercial sectors.
                <span style={{ display: 'block', marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                  कचरा उचलणाऱ्या गाड्या ठराविक वेळापत्रकानुसार फिरतात, जिथे कचऱ्याचा ढीग मोठा आहे तिथे वेळेवर जात नाहीत.
                </span>
              </p>
            </motion.div>

            <motion.div
              viewport={{ once: true }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="glass-card"
              style={{ gridColumn: 'span 1' }}
            >
              <div className="card-icon-wrapper">
                <AlertTriangle />
              </div>
              <h3 className="card-title-lg">Unhygienic Public Spaces <br /><span style={{ fontSize: '0.95rem', color: 'var(--accent-green)' }}>अस्वच्छ सार्वजनिक ठिकाणे</span></h3>
              <p className="card-description">
                Accumulated garbage leads to foul odors, bacterial growth, stray animals, and waterlogging, posing massive risks to general public health.
                <span style={{ display: 'block', marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                  साचलेल्या कचऱ्यामुळे दुर्गंधी पसरते, रोगराईचे प्रमाण वाढते आणि भटक्या प्राण्यांचा वावर वाढतो.
                </span>
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="landing-section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="section-container">
          <div className="section-header">
            <span className="section-label" style={{ color: 'var(--accent-green)' }}>Our Workflow</span>
            <h2 className="section-title">Our Smart Solution</h2>
            <p className="section-subtitle">
              Bridging the gap between computer vision detection and field action. Here is how our automated agent closes the loop on civic cleanliness.
            </p>
          </div>

          <div className="workflow-grid">
            {[
              { num: '1', title: 'Upload Image', desc: 'Citizen uploads an image of the dumping site or CCTV stream observes it.' },
              { num: '2', title: 'AI Detection', desc: 'Custom YOLOv11 computer vision models classify waste type and estimate size.' },
              { num: '3', title: 'GPS Tagging', desc: 'Incident coordinates are immediately captured and mapped to the nearest ward.' },
              { num: '4', title: 'Authority Alert', desc: 'Express API dispatches live socket alerts and WhatsApp updates to ward officers.' },
              { num: '5', title: 'Crew Assigned', desc: 'Task system assigns the closest cleaning crew with exact route optimizations.' },
              { num: '6', title: 'Issue Resolved', desc: 'Sanitation team uploads clean-up proof. The dashboard updates and tracks completion.' },
            ].map((step, i) => (
              <motion.div
                key={i}
                viewport={{ once: true }}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`workflow-step ${i % 2 === 1 ? 'even' : ''}`}
              >
                <div className="step-num">{step.num}</div>
                <h4 className="step-title">{step.title}</h4>
                <p className="step-desc">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="landing-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">Core Capabilities</span>
            <h2 className="section-title">System Features</h2>
            <p className="section-subtitle">
              Designed from the ground up for modern city command centers. Built with enterprise-grade stability and startup speed.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {[
              { icon: <Brain />, title: 'AI Garbage Detection', desc: 'Detects plastic bags, organic waste, debris, and cardboard using high-speed custom vision classifiers.' },
              { icon: <Activity />, title: 'Real-Time Tracking', desc: 'Websocket-enabled event pipeline lets admin monitor the status of every ticket from report to completion live.' },
              { icon: <MapPin />, title: 'Geo-Location Mapping', desc: 'Leaflet mapping plotting coordinates. Heatmaps highlight persistent dump locations for preventive cleanups.' },
              { icon: <Layers />, title: 'Municipal Dashboard', desc: 'A multi-tier access platform separating Super Admins, Ward Admins, Field Workers, and Citizens.' },
              { icon: <UserCheck />, title: 'Worker Assignment', desc: 'Instantly dispatches tasks to field workers. Enables clean-up progress updates with before/after evidence validation.' },
              { icon: <TrendingUp />, title: 'Analytics & Reports', desc: 'Generates comprehensive charts detailing average resolution time, ward cleanliness ranks, and hotspot trends.' },
              { icon: <Bell />, title: 'Smart Notifications', desc: 'Connects directly with mobile. Sends automated WhatsApp alerts with image attachments and location pins to supervisors.' }
            ].map((feature, i) => (
              <motion.div
                key={i}
                viewport={{ once: true }}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="glass-card"
                style={{ padding: '24px' }}
              >
                <div className="card-icon-wrapper" style={{ width: '48px', height: '48px', fontSize: '1.2rem', marginBottom: '16px', color: i % 2 === 0 ? 'var(--accent-green)' : 'var(--accent-blue)' }}>
                  {feature.icon}
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                  {feature.title}
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section id="showcase" className="landing-section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="section-container">
          <div className="section-header">
            <span className="section-label" style={{ color: 'var(--accent-green)' }}>Cmd Center View</span>
            <h2 className="section-title">City Command Dashboard</h2>
            <p className="section-subtitle">
              Visualizing how ward administrators interact with spatial intelligence, live video feeds, and task tracking metrics.
            </p>
          </div>

          <div className="dashboard-grid-mock">
            {/* Panel 1: Live CCTV Simulator */}
            <motion.div
              viewport={{ once: true }}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="mock-window"
            >
              <div className="mock-window-header">
                <span className="mock-window-title">
                  <Camera size={16} className="text-red" />
                  LIVE CAMERA ANOMALY SURVEILLANCE
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-red)', fontWeight: 'bold' }}>● LIVE BROADCAST</span>
              </div>
              <div className="mock-window-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="cctv-feed-simulator" style={{ height: '240px' }}>
                  <img src={cctvWasteFeed} alt="CCTV live stream simulation" className="cctv-img" />
                  <div className="cctv-overlay">
                    <div className="cctv-meta">
                      <span>CH-02 [OUTDOOR]</span>
                      <span>100% SIGNAL</span>
                    </div>
                    <div className="cctv-bbox" style={{ top: '35%', left: '20%', width: '45%', height: '40%' }}>
                      <span className="cctv-bbox-label" style={{ background: 'var(--accent-red)' }}>ILLEGAL DUMPING (94%)</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', background: 'var(--glass)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Location: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>Ward 4 Crossroads</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>AI Status: </span>
                    <strong style={{ color: 'var(--accent-red)' }}>VIO-102 Active</strong>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Panel 2: Stats & Prediction mockup */}
            <motion.div
              viewport={{ once: true }}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="mock-window"
            >
              <div className="mock-window-header">
                <span className="mock-window-title">
                  <TrendingUp size={16} style={{ color: 'var(--accent-green)' }} />
                  WARD CLEANLINESS INDEX & ANALYTICS
                </span>
              </div>
              <div className="mock-window-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Simulated Chart */}
                <div style={{ background: 'var(--glass)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 'bold' }}>Resolution Efficiency Trend</span>
                    <span className="text-green">+14.2% This Month</span>
                  </div>

                  {/* Fake SVG Bar Chart */}
                  <svg viewBox="0 0 300 100" style={{ width: '100%', height: '90px' }}>
                    {/* Gridlines */}
                    <line x1="0" y1="20" x2="300" y2="20" stroke="rgba(255,255,255,0.05)" />
                    <line x1="0" y1="50" x2="300" y2="50" stroke="rgba(255,255,255,0.05)" />
                    <line x1="0" y1="80" x2="300" y2="80" stroke="rgba(255,255,255,0.05)" />

                    {/* Area path */}
                    <path
                      d="M0 90 Q 50 70, 100 50 T 200 40 T 300 20 L 300 100 L 0 100 Z"
                      fill="url(#chart-glow)"
                    />
                    {/* Line path */}
                    <path
                      d="M0 90 Q 50 70, 100 50 T 200 40 T 300 20"
                      fill="none"
                      stroke="var(--accent-green)"
                      strokeWidth="3"
                    />

                    <defs>
                      <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent-green)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--accent-green)" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                  </svg>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    <span>Week 1</span>
                    <span>Week 2</span>
                    <span>Week 3</span>
                    <span>Week 4</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ background: 'var(--glass)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>AVG RESPONSE TIME</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-cyan)', marginTop: '4px' }}>14.2 Mins</div>
                  </div>
                  <div style={{ background: 'var(--glass)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>COMPLAINT ACCURACY</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-green)', marginTop: '4px' }}>98.6%</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="landing-section">
        <div className="section-container">
          <div className="stats-banner">
            <div className="stat-item">
              <div className="stat-number">95%</div>
              <div className="stat-label">Faster Detection Rate</div>
            </div>
            <div className="stat-item blue-stat">
              <div className="stat-number">10k+</div>
              <div className="stat-label">Complaints Resolved</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">Municipal Zones Covered</div>
            </div>
            <div className="stat-item blue-stat">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Automated Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="tech" className="landing-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">State-of-the-Art Stack</span>
            <h2 className="section-title">The Technology Behind AgniX</h2>
            <p className="section-subtitle">
              We leverage modern frameworks, cloud architectures, and machine learning models to deploy real-time civic solutions.
            </p>
          </div>

          <div className="tech-grid">
            {[
              { icon: <Brain className="tech-icon" />, title: 'Artificial Intelligence', desc: 'Custom trained object recognition parsing images and CCTV streams.' },
              { icon: <Camera className="tech-icon" style={{ color: 'var(--accent-green)' }} />, title: 'Computer Vision', desc: 'ONNX runtime and YOLO architectures optimized for high framerate edge systems.' },
              { icon: <Activity className="tech-icon" />, title: 'Machine Learning', desc: 'Spatial cluster analysis grouping recurring dump sites to identify hotspots.' },
              { icon: <Map className="tech-icon" style={{ color: 'var(--accent-green)' }} />, title: 'GIS Mapping', desc: 'Leaflet APIs indexing geographic points into municipal wards.' },
              { icon: <Server className="tech-icon" />, title: 'Cloud Infrastructure', desc: 'High availability Node.js cluster backed by MongoDB Atlas storage.' },
              { icon: <TrendingUp className="tech-icon" style={{ color: 'var(--accent-green)' }} />, title: 'Real-Time Analytics', desc: 'Bidirectional WebSockets and WhatsApp hook integrations pushing alerts immediately.' },
            ].map((tech, i) => (
              <motion.div
                key={i}
                viewport={{ once: true }}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="tech-badge-card"
              >
                <div>{tech.icon}</div>
                <div className="tech-info">
                  <h4>{tech.title}</h4>
                  <p>{tech.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="landing-section" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)' }}>
        <div className="section-container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px', alignItems: 'center' }}>
            <motion.div
              viewport={{ once: true }}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="section-label" style={{ color: 'var(--accent-green)' }}>Our Mission</span>
              <h2 className="section-title" style={{ fontSize: '2.4rem' }}>Supporting Smart City Initiatives Everywhere</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '20px' }}>
                AgniX AI is committed to helping municipal corporations transition from passive, reactive cleanup schedules to proactive, AI-informed enforcement and rapid sanitization workflows.
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                By equipping city administrators with live geographic alerts, automated WhatsApp dispatch systems, and worker tracking interfaces, we turn CCTV cameras and citizen phones into an active defense against environmental decay.
              </p>
            </motion.div>

            <motion.div
              viewport={{ once: true }}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="glass-card"
              style={{ borderLeft: '4px solid var(--accent-green)' }}
            >
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '16px' }}>Supporting Municipal Corporations</h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '16px' }}>
                Our systems are custom tailored to assist local authorities in meeting national cleanliness targets. We support ward command centers in automating reports, managing shifts, and evaluating zone ratings.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--glass)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '1.8rem' }}>🏛️</span>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>OFFICIALLY COMPATIBLE WITH</div>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--accent-green)' }}>Chhatrapati Sambhajinagar Municipal Corporation</strong>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>🤖 AgniX</h3>
            <p>Empowering municipal corporations with computer vision and smart dispatch systems to build healthier, cleaner, and more sustainable cities.</p>
          </div>
          <div>
            <h4 className="footer-heading">Platform</h4>
            <ul className="footer-links">
              <li><span onClick={() => handleScrollTo('problem')} style={{ cursor: 'pointer' }}>Problems</span></li>
              <li><span onClick={() => handleScrollTo('solution')} style={{ cursor: 'pointer' }}>Solutions</span></li>
              <li><span onClick={() => handleScrollTo('features')} style={{ cursor: 'pointer' }}>System Features</span></li>
              <li><span onClick={() => handleScrollTo('showcase')} style={{ cursor: 'pointer' }}>Interactive Demo</span></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-heading">Security</h4>
            <ul className="footer-links">
              <li><Link to="/login">Officer Login</Link></li>
              <li><Link to="/register">Citizen Portal</Link></li>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
            </ul>
          </div>
          <div className="footer-newsletter">
            <h4 className="footer-heading">Smart City Command</h4>
            <p>Connect with our technical integration team to deploy AgniX AI in your municipal ward.</p>
            <Link to="/register" className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
              Register Ward
            </Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} AgniX AI. Developed for Swachh Bharat & Smart Cities.</p>
          <p>Designed with 💚 for Chhatrapati Sambhajinagar</p>
        </div>
      </footer>
    </div>
  );
}
