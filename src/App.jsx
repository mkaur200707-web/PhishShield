import React, { useEffect, useState } from 'react';

import {
  ShieldCheck, ShieldAlert, LayoutDashboard, ScanSearch, History,
  BookOpen, Bell, UserRound, LogOut, Menu, Link2, MessageSquareText,
  QrCode, Image as ImageIcon, Phone, Globe, Activity, AlertTriangle,
  CheckCircle2, Clock3, Upload, Trash2, ChevronRight, Sparkles,
  MapPinned, Trophy, Languages, LockKeyhole, FileText, LifeBuoy,
  ArrowRight, Eye, Zap, Mail, Smartphone, KeyRound, ExternalLink
} from 'lucide-react';

const STORE = 'phishshield_v2';

const nav = [
  ['overview','Overview',LayoutDashboard],
  ['scanner','Security scanner',ScanSearch],
  ['history','Scan history',History],
  ['alerts','Threat alerts',Bell],
  ['map','Threat map',MapPinned],
  ['quiz','Awareness quiz',Trophy],
  ['help','Emergency help',LifeBuoy],
  ['profile','My profile',UserRound]
];

const sampleMessage = 'URGENT! Your bank account will be blocked today. Update your KYC immediately by clicking this link and verify your details.';

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE) || '{}');
  } catch {
    return {};
  }
}

function Brand() {
  return <div className="brand">
    <span className="brand-icon"><ShieldCheck size={22}/></span>
    <span>PhishShield <b>Bharat</b></span>
  </div>;
}

function Btn({children,onClick,variant='primary',icon:Icon,disabled=false}) {
  return <button disabled={disabled} className={`btn ${variant}`} onClick={onClick}>
    {Icon && <Icon size={16}/>} {children}
  </button>;
}

function Tag({level='Low'}) {
  return <span className={`tag ${level.toLowerCase()}`}>{level} risk</span>;
}

function Field({label,icon:Icon,...props}) {
  return <label className="field">
    <span>{label}</span>
    <div className="field-wrap">
      {Icon && <Icon size={17}/>}
      <input {...props}/>
    </div>
  </label>;
}

/* ---------------- AUTHENTICATION ---------------- */

function Auth({onDone}) {
  const [mode, setMode] = useState('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    if (mode === 'signup') {
      if (
        !name.trim() ||
        !/^\S+@\S+\.\S+$/.test(email) ||
        phone.replace(/\D/g, '').length < 10
      ) {
        setError('Please enter your name, valid email and 10-digit phone number.');
        return;
      }
    }

    onDone({
      name: mode === 'signup' ? name : (name || email.split('@')[0]),
      email,
      phone,
      language: 'English'
    });
  };

  return <div className="auth-page">
    <div className="auth-glow one"/>
    <div className="auth-glow two"/>

    <div className="auth-card">
      <div className="auth-brand">
        <Brand/>
        <span className="secure-label">
          <LockKeyhole size={13}/> SECURE WORKSPACE
        </span>
      </div>

      <div className="auth-art">
        <div className="auth-orbit"><ShieldCheck size={46}/></div>
        <span className="float-dot dot1"/>
        <span className="float-dot dot2"/>
        <span className="float-dot dot3"/>
      </div>

      <div className="eyebrow">YOUR DIGITAL SAFETY STARTS HERE</div>
      <h1>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>

      <p className="muted">
        {mode === 'signup'
          ? 'Create your PhishShield account and stay protected.'
          : 'Login to continue to your security workspace.'}
      </p>

      <form onSubmit={submit} className="form-stack">
        {mode === 'signup' && <>
          <Field
            label="First name"
            icon={UserRound}
            placeholder="Your first name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />

          <Field
            label="Phone number"
            icon={Smartphone}
            type="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
          />
        </>}

        <Field
          label="Email address"
          icon={Mail}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <Field
          label="Password"
          icon={LockKeyhole}
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <Btn variant="primary full" icon={ArrowRight}>
          {mode === 'signup' ? 'Create account' : 'Login'}
        </Btn>
      </form>

      {error && <p className="error-text">{error}</p>}

      <p className="auth-switch">
        {mode === 'signup' ? 'Already have an account?' : 'New to PhishShield?'}
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signup' ? 'login' : 'signup');
            setError('');
          }}
        >
          {mode === 'signup' ? 'Sign in' : 'Create account'}
        </button>
      </p>

      <div className="auth-foot">
        <ShieldCheck size={14}/>
        Your safety workspace · Frontend demonstration
      </div>
    </div>
  </div>;
}

/* ---------------- SCAN ANALYSIS ---------------- */

function analyseMessage(text) {
  const s = text.toLowerCase();

  const rules = [
    [
      'Urgency & pressure',
      ['urgent','immediately','today','within 24 hours','expires','act now','last warning','final notice'],
      18,
      'Creates time pressure so you may act before checking.'
    ],
    [
      'Account / KYC threat',
      ['account blocked','account suspended','update kyc','kyc expired','verify your account','sim blocked'],
      25,
      'Uses an account restriction or KYC warning to trigger action.'
    ],
    [
      'Credential request',
      ['share otp','send otp','enter otp','upi pin','password','cvv','card number'],
      30,
      'Mentions sensitive credentials. Never share OTP, PIN, CVV or passwords.'
    ],
    [
      'Payment demand',
      ['registration fee','processing fee','pay now','claim reward','collect request','refund fee'],
      20,
      'Requests money or payment approval that should be independently verified.'
    ],
    [
      'Suspicious link language',
      ['click here','verify through this link','open the link','http://','bit.ly','tinyurl'],
      18,
      'Encourages link use or contains a shortened/insecure URL pattern.'
    ]
  ];

  const hits = rules
    .filter(r => r[1].some(w => s.includes(w)))
    .map(r => ({
      name: r[0],
      matched: r[1].filter(w => s.includes(w)),
      explanation: r[3]
    }));

  const score = Math.min(
    98,
    hits.reduce((n,h) => n + (rules.find(r => r[0] === h.name)?.[2] || 0), 5)
  );

  return {
    hits,
    score,
    level: score >= 65 ? 'High' : score >= 35 ? 'Medium' : 'Low',
    confidence: hits.length ? 'Signals found' : 'No known rule matched'
  };
}

function analyseUrl(value) {
  const raw = value.trim();

  if (!raw) return analyseMessage('');

  let host = '';

  try {
    host = new URL(raw.includes('://') ? raw : `https://${raw}`)
      .hostname.toLowerCase();
  } catch {
    return {
      hits: [{
        name: 'Invalid URL format',
        matched: [],
        explanation: 'The entered text could not be parsed as a web address.'
      }],
      score: 45,
      level: 'Medium',
      confidence: 'Format warning'
    };
  }

  const hits = [];

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    hits.push({
      name: 'IP address host',
      matched: [host],
      explanation: 'A raw IP address is unusual for many trusted consumer services.'
    });
  }

  if (host.includes('xn--')) {
    hits.push({
      name: 'Punycode domain',
      matched: [host],
      explanation: 'Internationalized domain encoding can be abused to imitate familiar names.'
    });
  }

  if (host.split('.').length > 4) {
    hits.push({
      name: 'Many subdomains',
      matched: [host],
      explanation: 'Long nested subdomains can make the true registered domain harder to notice.'
    });
  }

  if (/bit\.ly|tinyurl|t\.co|goo\.gl|cutt\.ly/.test(host)) {
    hits.push({
      name: 'URL shortener',
      matched: [host],
      explanation: 'Shortened links hide the final destination until expanded.'
    });
  }

  if (raw.startsWith('http://')) {
    hits.push({
      name: 'No HTTPS',
      matched: ['http://'],
      explanation: 'The connection is not encrypted with HTTPS.'
    });
  }

  if (/login|verify|kyc|wallet|bank|secure|claim|reward/.test(host)) {
    hits.push({
      name: 'Sensitive keyword in domain',
      matched: [host],
      explanation: 'A domain containing trusted-service or urgency terms deserves closer inspection.'
    });
  }

  const score = Math.min(92, 8 + hits.length * 19);

  return {
    hits,
    score,
    level: score >= 65 ? 'High' : score >= 35 ? 'Medium' : 'Low',
    confidence: hits.length ? 'URL pattern signals found' : 'No obvious pattern matched'
  };
}

/* ---------------- NAVIGATION ---------------- */

function Sidebar({page,setPage,profile,onLogout,collapsed,setCollapsed}) {
  return <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
    <div className="side-head">
      <Brand/>
      <button
        className="icon-only side-toggle"
        onClick={() => setCollapsed(!collapsed)}
      >
        <Menu size={18}/>
      </button>
    </div>

    <div className="side-caption">WORKSPACE</div>

    <nav className="side-nav">
      {nav.map(([id,label,Icon]) => (
        <button
          key={id}
          className={page === id ? 'active' : ''}
          onClick={() => setPage(id)}
          title={label}
        >
          <Icon size={18}/>
          <span>{label}</span>
          {id === 'alerts' && <i className="nav-dot"/>}
        </button>
      ))}
    </nav>

    <div className="side-bottom">
      <div className="profile-mini">
        <div className="avatar">
          {(profile.name || 'P').slice(0,1).toUpperCase()}
        </div>
        <div>
          <b>{profile.name || 'User'}</b>
          <small>Protected workspace</small>
        </div>
      </div>

      <button className="side-logout" onClick={onLogout}>
        <LogOut size={16}/> <span>Sign out</span>
      </button>

      <div className="side-version">PHISHSHIELD BHARAT · DEMO</div>
    </div>
  </aside>;
}

function Header({page,profile,onMenu}) {
  const label = nav.find(x => x[0] === page)?.[1] || 'Overview';

  return <header className="topbar-app">
    <button className="icon-only mobile-menu" onClick={onMenu}>
      <Menu/>
    </button>

    <div className="breadcrumb">
      Workspace <ChevronRight size={14}/> <b>{label}</b>
    </div>

    <div className="top-actions">
      <span className="live-status"><i/> Demo workspace</span>
      <button className="top-avatar" title="Profile">
        {(profile.name || 'P').slice(0,1).toUpperCase()}
      </button>
    </div>
  </header>;
}

function Stat({label,value,detail,icon:Icon,tone='green'}) {
  return <article className="stat-card">
    <div className={`stat-icon ${tone}`}><Icon size={19}/></div>
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  </article>;
}

/* ---------------- DASHBOARD ---------------- */

function Dashboard({profile,history,setPage}) {
  const high = history.filter(x => x.level === 'High').length;

  const score = history.length
    ? Math.max(
        35,
        100 - Math.min(
          65,
          high * 9 + history.filter(x => x.level === 'Medium').length * 4
        )
      )
    : 92;

  return <div className="page-content">
    <div className="welcome-line">
      <div>
        <div className="eyebrow">YOUR PERSONAL SECURITY SPACE</div>
        <h1>
          Good {
            new Date().getHours() < 12
              ? 'morning'
              : new Date().getHours() < 18
                ? 'afternoon'
                : 'evening'
          }, {profile.name || 'there'} <span>✦</span>
        </h1>
        <p>Stay one step ahead of suspicious messages, links and digital scams.</p>
      </div>

      <div className="date-chip">
        <Activity size={15}/> Security overview
      </div>
    </div>

    <div className="hero-banner">
      <div>
        <span className="banner-kicker">
          <Sparkles size={14}/> YOUR DIGITAL SAFETY COMPANION
        </span>
        <h2>Pause. Check. <em>Stay protected.</em></h2>
        <p>Check suspicious content before you click, pay or share personal information.</p>
        <Btn onClick={() => setPage('scanner')} icon={ScanSearch}>
          Start a security scan
        </Btn>
      </div>

      <div className="banner-shield">
        <div className="shield-ring"><ShieldCheck size={62}/></div>
        <span className="orbit-label label-a">CHECK</span>
        <span className="orbit-label label-b">PROTECT</span>
      </div>
    </div>

    <div className="stats-grid">
      <Stat label="Total scans" value={history.length} detail="Saved on this device" icon={ScanSearch}/>
      <Stat label="High-risk findings" value={high} detail="Review before acting" icon={ShieldAlert} tone="red"/>
      <Stat
        label="Medium-risk findings"
        value={history.filter(x => x.level === 'Medium').length}
        detail="Verify independently"
        icon={AlertTriangle}
        tone="amber"
      />
      <Stat label="Safety score" value={`${score}/100`} detail="Illustrative activity score" icon={ShieldCheck} tone="blue"/>
    </div>

    <div className="content-grid">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>Quick actions</h3>
            <p>Choose what you want to check today.</p>
          </div>
          <span className="subtle-label">GET STARTED</span>
        </div>

        <div className="quick-grid">
          <button onClick={() => setPage('scanner')}>
            <span className="quick-icon teal"><MessageSquareText/></span>
            <b>Scan a message</b>
            <small>SMS, email or chat</small>
            <ArrowRight size={16}/>
          </button>

          <button onClick={() => setPage('scanner')}>
            <span className="quick-icon blue"><Link2/></span>
            <b>Check a URL</b>
            <small>Inspect a suspicious link</small>
            <ArrowRight size={16}/>
          </button>

          <button onClick={() => setPage('scanner')}>
            <span className="quick-icon violet"><QrCode/></span>
            <b>QR / screenshot</b>
            <small>Review uploaded content</small>
            <ArrowRight size={16}/>
          </button>

          <button onClick={() => setPage('quiz')}>
            <span className="quick-icon amber"><Trophy/></span>
            <b>Take a quiz</b>
            <small>Practice scam awareness</small>
            <ArrowRight size={16}/>
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>Recent activity</h3>
            <p>Your latest checks</p>
          </div>
          <button className="text-btn" onClick={() => setPage('history')}>
            View all <ArrowRight size={14}/>
          </button>
        </div>

        {history.length ? (
          <div className="recent-list">
            {history.slice(0,4).map(x => (
              <div className="recent-row" key={x.id}>
                <span className={`recent-icon ${x.level.toLowerCase()}`}>
                  <ShieldAlert size={16}/>
                </span>
                <div>
                  <b>
                    {x.kind === 'url'
                      ? 'Website URL scan'
                      : x.kind === 'phone'
                        ? 'Phone number check'
                        : 'Message scan'}
                  </b>
                  <small>
                    {x.input.slice(0,55)}{x.input.length > 55 ? '…' : ''}
                  </small>
                </div>
                <Tag level={x.level}/>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-mini">
            <ScanSearch size={24}/>
            <b>No scans yet</b>
            <span>Your scan results will appear here.</span>
          </div>
        )}
      </section>
    </div>

    <div className="bottom-grid">
      <section className="panel safety-panel">
        <div className="panel-head">
          <div>
            <h3>Safety reminder</h3>
            <p>Three habits that prevent common scams.</p>
          </div>
          <ShieldCheck className="panel-accent"/>
        </div>

        <div className="reminder-list">
          <p><CheckCircle2/> Never share OTP, UPI PIN, CVV or passwords.</p>
          <p><CheckCircle2/> Verify unexpected requests using official channels.</p>
          <p><CheckCircle2/> Do not rush because a message says “urgent”.</p>
        </div>
      </section>

      <section className="panel alert-preview">
        <div className="panel-head">
          <div>
            <h3>Threat watch</h3>
            <p>Common scam patterns to remember.</p>
          </div>
          <button className="text-btn" onClick={() => setPage('alerts')}>
            Explore <ArrowRight size={14}/>
          </button>
        </div>

        <div className="watch-pills">
          <span>Fake KYC alerts</span>
          <span>UPI collect requests</span>
          <span>Fake job offers</span>
          <span>OTP theft attempts</span>
        </div>
      </section>
    </div>

    <p className="disclaimer">
      <LockKeyhole size={13}/> Your scan history is stored in this browser for this demo.
      No server-side account or threat feed is connected.
    </p>
  </div>;
}

/* ---------------- SCANNER ---------------- */

function Scanner({onSave}) {
  const [mode,setMode] = useState('message');
  const [input,setInput] = useState(sampleMessage);
  const [result,setResult] = useState(null);
  const [busy,setBusy] = useState(false);
  const [file,setFile] = useState(null);
  const [phone,setPhone] = useState('');

  const run = () => {
    setBusy(true);
    setResult(null);

    setTimeout(() => {
      let r = mode === 'url'
        ? analyseUrl(input)
        : mode === 'phone'
          ? {
              hits: [{
                name: 'No live reputation lookup connected',
                matched: [phone],
                explanation: 'This demo cannot confirm who owns this number. Treat unexpected payment or OTP requests cautiously.'
              }],
              score: 32,
              level: 'Medium',
              confidence: 'Manual review required'
            }
          : analyseMessage(input);

      setResult(r);
      setBusy(false);
      onSave({kind:mode,input:mode === 'phone' ? phone : input,...r});
    },650);
  };

  const upload = (e) => {
    const f = e.target.files?.[0];

    if (f) {
      setFile(f);
      setResult({
        hits: [{
          name: 'File received',
          matched: [f.name],
          explanation: 'The file preview is available, but OCR and QR decoding are not connected in this frontend demo. Paste any readable text or URL into the message/URL scanner for analysis.'
        }],
        score: 0,
        level: 'Low',
        confidence: 'Upload preview only'
      });
    }
  };

  const modes = [
    ['message','Message',MessageSquareText],
    ['url','Website URL',Link2],
    ['qr','QR code',QrCode],
    ['image','Screenshot',ImageIcon],
    ['phone','Phone number',Phone],
    ['website','Fake website',Globe]
  ];

  return <div className="page-content">
    <div className="page-heading">
      <div>
        <div className="eyebrow">CHECK BEFORE YOU TRUST</div>
        <h1>Security scanner</h1>
        <p>Review suspicious messages, URLs and other scam signals.</p>
      </div>
      <span className="mode-badge"><Zap size={14}/> Rule-based demo</span>
    </div>

    <div className="scanner-layout">
      <section className="panel scanner-panel">
        <div className="panel-head">
          <div>
            <h3>What would you like to check?</h3>
            <p>Select a scan type to begin.</p>
          </div>
          <span className="subtle-label">STEP 01</span>
        </div>

        <div className="scan-tabs">
          {modes.map(([id,label,Icon]) => (
            <button
              key={id}
              className={mode === id ? 'selected' : ''}
              onClick={() => {
                setMode(id);
                setResult(null);
                setFile(null);
                setInput(id === 'message' ? sampleMessage : '');
              }}
            >
              <Icon size={16}/>{label}
            </button>
          ))}
        </div>

        {['message','url','website'].includes(mode) && <>
          <label className="input-label">
            {mode === 'message'
              ? 'Paste the suspicious message'
              : mode === 'url'
                ? 'Paste the website URL'
                : 'Enter the website address'}
          </label>

          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={
              mode === 'message'
                ? 'Paste SMS, WhatsApp or email content here…'
                : 'https://example.com'
            }
            rows={7}
          />

          <div className="input-hint">
            <LockKeyhole size={13}/> Avoid entering real passwords, OTPs, card details or private information.
          </div>
        </>}

        {mode === 'phone' && <>
          <label className="input-label">Suspicious phone number</label>
          <input
            className="big-input"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
          />
          <div className="input-hint">
            No live caller database is connected. This is a safety guidance demo, not a caller identity lookup.
          </div>
        </>}

        {['qr','image'].includes(mode) && (
          <label className="upload-box">
            <input type="file" accept="image/*" onChange={upload}/>
            <span className="upload-icon"><Upload size={24}/></span>
            <b>
              {file
                ? file.name
                : `Upload ${mode === 'qr' ? 'a QR code image' : 'a suspicious screenshot'}`}
            </b>
            <small>PNG, JPG or WEBP · Preview only in this demo</small>
          </label>
        )}

        <div className="scan-actions">
          <Btn
            onClick={run}
            disabled={
              busy ||
              (['message','url','website'].includes(mode) && !input.trim()) ||
              (mode === 'phone' && !phone.trim())
            }
            icon={ScanSearch}
          >
            {busy ? 'Analysing…' : 'Analyse now'}
          </Btn>

          <button
            className="text-btn"
            onClick={() => {
              setInput('');
              setPhone('');
              setResult(null);
              setFile(null);
            }}
          >
            <Trash2 size={14}/> Clear
          </button>
        </div>

        <div className="scan-note">
          <ShieldCheck size={15}/> Results are indicative pattern checks, not a guarantee that content is safe or malicious.
        </div>
      </section>

      <aside className="panel side-info">
        <div className="scanner-orb">
          <div><ShieldCheck size={36}/></div>
          <span className="scan-pulse"/>
        </div>

        <h3>Look for the warning signs</h3>
        <p>Phishing messages often rely on urgency, impersonation, suspicious links or requests for secrets.</p>

        <div className="signal-points">
          <span><Zap/> Urgent or threatening language</span>
          <span><KeyRound/> OTP, PIN or credential requests</span>
          <span><FileText/> KYC or account suspension claims</span>
          <span><Link2/> Suspicious links and payment pressure</span>
        </div>

        <div className="tip-box">
          <b>Remember</b>
          <p>A familiar keyword alone does not prove a scam. Context and independent verification matter.</p>
        </div>
      </aside>
    </div>

    {result && <section className="panel result-panel">
      <div className="result-title">
        <div>
          <div className="eyebrow">SCAN RESULT</div>
          <h2>Analysis complete</h2>
        </div>
        <Tag level={result.level}/>
      </div>

      <div className="result-overview">
        <div className={`score-circle ${result.level.toLowerCase()}`}>
          <strong>{result.score}</strong><small>/ 100</small>
        </div>

        <div>
          <h3>
            {result.level === 'High'
              ? 'Multiple warning signs found'
              : result.level === 'Medium'
                ? 'Some warning signs need review'
                : 'No strong known signals found'}
          </h3>

          <p>
            {result.level === 'High'
              ? 'Do not click links or share sensitive information until you verify independently.'
              : result.level === 'Medium'
                ? 'Pause and verify the sender through an official channel.'
                : 'This basic check found few known patterns. That does not prove the content is safe.'}
          </p>

          <span className="confidence"><Eye size={13}/> {result.confidence}</span>
        </div>
      </div>

      <div className="breakdown">
        <div className="panel-head">
          <div>
            <h3>Why this result?</h3>
            <p>{result.hits.length} indicator(s) identified</p>
          </div>
        </div>

        {result.hits.length ? result.hits.map(h => (
          <div className="reason-row" key={h.name}>
            <span><AlertTriangle size={17}/></span>
            <div>
              <b>{h.name}</b>
              <p>{h.explanation}</p>
              {h.matched.length > 0 && <small>Matched: {h.matched.join(', ')}</small>}
            </div>
          </div>
        )) : (
          <div className="empty-mini">
            <CheckCircle2/> No known keyword rules matched.
          </div>
        )}
      </div>

      <div className="advice-strip">
        <b><ShieldCheck size={16}/> Recommended next steps</b>
        <p>
          Do not share OTP/PIN/password. Avoid unexpected links. Verify using the official app or website.
          If money is lost in India, contact your bank and call 1930 promptly.
        </p>
      </div>

      <div className="result-disclaimer">
        <AlertTriangle size={14}/> Rule-based demo only. Risk score is not a probability.
        OCR, QR decoding, AI and live reputation checks are not connected.
      </div>
    </section>}
  </div>;
}

/* ---------------- HISTORY ---------------- */

function HistoryPage({items,onDelete,onClear}) {
  const [filter,setFilter] = useState('All');
  const visible = items.filter(x => filter === 'All' || x.level === filter);

  return <div className="page-content">
    <div className="page-heading">
      <div>
        <div className="eyebrow">YOUR LOCAL ACTIVITY</div>
        <h1>Scan history</h1>
        <p>{items.length} saved scan(s) on this device.</p>
      </div>
      {items.length > 0 && (
        <Btn variant="secondary" icon={Trash2} onClick={onClear}>Clear history</Btn>
      )}
    </div>

    <div className="panel">
      <div className="filter-row">
        <div className="filter-tabs">
          {['All','High','Medium','Low'].map(f => (
            <button
              className={filter === f ? 'active' : ''}
              key={f}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="subtle-label">{visible.length} RESULTS</span>
      </div>

      {visible.length ? (
        <div className="history-list">
          {visible.map(item => (
            <article className="history-item" key={item.id}>
              <span className={`history-mark ${item.level.toLowerCase()}`}>
                <ShieldAlert size={18}/>
              </span>

              <div className="history-copy">
                <div>
                  <b>
                    {item.kind === 'url'
                      ? 'URL scan'
                      : item.kind === 'phone'
                        ? 'Phone check'
                        : 'Message scan'}
                  </b>
                  <Tag level={item.level}/>
                </div>

                <p>{item.input}</p>

                <small>
                  <Clock3 size={12}/> {new Date(item.date).toLocaleString()} · Score {item.score}/100
                </small>
              </div>

              <button
                className="icon-only"
                onClick={() => onDelete(item.id)}
                title="Delete"
              >
                <Trash2 size={16}/>
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <History size={32}/>
          <h3>No scans found</h3>
          <p>Run a scan to see the result here.</p>
        </div>
      )}
    </div>
  </div>;
}

/* ---------------- THREAT ALERTS ---------------- */

const alertItems = [
  [
    'Fake KYC / account block warning',
    'A message claims your bank or SIM will be blocked unless you update KYC through a link.',
    'Never use the message link. Open the official bank app or website yourself.',
    'High'
  ],
  [
    'UPI collect request',
    'Someone says you must approve a collect request to receive a refund, prize or payment.',
    'Receiving money does not require entering your UPI PIN. Decline unexpected requests.',
    'High'
  ],
  [
    'Fake job registration fee',
    'A recruiter promises quick employment but asks for a registration or training fee.',
    'Verify the employer on its official careers website. Be cautious of upfront fees.',
    'Medium'
  ],
  [
    'OTP / account takeover',
    'A caller asks you to read out an OTP or approve an unfamiliar login.',
    'Keep OTPs private, even if the caller claims to be support.',
    'High'
  ],
  [
    'Prize / scholarship claim',
    'An unexpected reward requires a fee, bank details or OTP to release it.',
    'Check the scheme on an official institution or government website.',
    'Medium'
  ]
];

function Alerts() {
  return <div className="page-content">
    <div className="page-heading">
      <div>
        <div className="eyebrow">STAY INFORMED</div>
        <h1>Threat alert centre</h1>
        <p>Common scam patterns and practical ways to respond.</p>
      </div>
      <span className="mode-badge"><Bell size={14}/> Awareness feed</span>
    </div>

    <div className="alert-banner">
      <ShieldAlert size={25}/>
      <div>
        <b>Pause before you act.</b>
        <p>Scammers create urgency, impersonate trusted organisations and ask for money or secrets.</p>
      </div>
    </div>

    <div className="alert-grid">
      {alertItems.map((a,i) => (
        <article className="panel alert-card" key={a[0]}>
          <div className="alert-card-top">
            <span className="alert-number">0{i+1}</span>
            <Tag level={a[3]}/>
          </div>
          <h3>{a[0]}</h3>
          <p>{a[1]}</p>
          <div className="safe-response">
            <b><CheckCircle2 size={14}/> Safer response</b>
            <span>{a[2]}</span>
          </div>
        </article>
      ))}
    </div>

    <p className="disclaimer">
      These are educational examples, not a live threat-intelligence feed or real-time alerts.
    </p>
  </div>;
}

/* ---------------- THREAT MAP ---------------- */

function ThreatMap() {
  const points = [
    [18,28,'New Delhi'],
    [31,55,'Mumbai'],
    [53,37,'Kolkata'],
    [65,68,'Hyderabad'],
    [77,48,'Bengaluru'],
    [84,76,'Chennai'],
    [40,18,'Jaipur']
  ];

  return <div className="page-content">
    <div className="page-heading">
      <div>
        <div className="eyebrow">VISUAL THREAT AWARENESS</div>
        <h1>Threat activity map</h1>
        <p>Illustrative India map visualization for the product demo.</p>
      </div>
      <span className="mode-badge"><Activity size={14}/> Simulated data</span>
    </div>

    <div className="map-layout">
      <section className="panel map-panel">
        <div className="panel-head">
          <div>
            <h3>India threat awareness view</h3>
            <p>Sample markers · Not live incident reports</p>
          </div>
          <span className="live-status"><i/> DEMO</span>
        </div>

        <div className="india-map">
          <div className="map-gridlines"/>

          <svg viewBox="0 0 600 520" role="img" aria-label="Stylized illustrative map of India">
            <path d="M215 35 L260 49 287 75 323 91 346 128 383 145 397 181 427 205 407 244 425 275 397 306 388 344 356 368 340 414 311 451 280 426 258 390 225 374 205 342 177 317 160 281 133 251 151 218 141 185 163 154 175 119 197 91 199 59Z"/>
          </svg>

          {points.map((p,i) => (
            <span
              key={p[2]}
              className={`map-point p${i}`}
              style={{left:`${p[0]}%`,top:`${p[1]}%`}}
              title={p[2]}
            />
          ))}

          <div className="map-legend">
            <span><i/> Illustrative awareness marker</span>
            <span><i/> Sample location</span>
          </div>
        </div>
      </section>

      <section className="panel map-side">
        <h3>Demo locations</h3>
        <p>Locations below are illustrative labels, not verified reports.</p>

        {points.map(p => (
          <div className="location-row" key={p[2]}>
            <MapPinned size={16}/>
            <div>
              <b>{p[2]}</b>
              <small>Awareness demo</small>
            </div>
            <span className="map-status">Sample</span>
          </div>
        ))}
      </section>
    </div>
  </div>;
}

/* ---------------- QUIZ ---------------- */

const questions = [
  {
    q: 'A caller asks you to share an OTP to stop your bank account from being blocked. What should you do?',
    o: [
      'Share it if they know your name',
      'Never share it; contact your bank through official channels',
      'Send a screenshot of the OTP'
    ],
    a: 1,
    why: 'Banks and legitimate support teams should never ask you to disclose your OTP.'
  },
  {
    q: 'Someone sends a UPI collect request saying it will credit a refund. What is safest?',
    o: [
      'Enter your UPI PIN to receive the money',
      'Approve quickly before it expires',
      'Decline unexpected requests and verify independently'
    ],
    a: 2,
    why: 'Entering a UPI PIN authorizes a payment; it is not required to receive money.'
  },
  {
    q: 'A job offer asks for a registration fee before an interview. What is a warning sign?',
    o: [
      'Upfront payment request',
      'A company careers page',
      'A scheduled interview'
    ],
    a: 0,
    why: 'Upfront fees for guaranteed jobs are a common recruitment scam pattern.'
  },
  {
    q: 'You receive a KYC update link in an unexpected SMS. What should you do?',
    o: [
      'Open it and enter details',
      'Use the bank’s official app or known website instead',
      'Forward it to friends'
    ],
    a: 1,
    why: 'Do not use unexpected message links for account or identity updates.'
  }
];

function Quiz() {
  const [answers,setAnswers] = useState({});
  const [submitted,setSubmitted] = useState(false);
  const score = questions.filter((q,i) => answers[i] === String(q.a)).length;

  return <div className="page-content">
    <div className="page-heading">
      <div>
        <div className="eyebrow">LEARN TO SPOT THE SIGNS</div>
        <h1>Phishing awareness quiz</h1>
        <p>Test your instincts with realistic scam scenarios.</p>
      </div>
      <span className="mode-badge"><Trophy size={14}/> 4 questions</span>
    </div>

    <div className="quiz-wrap">
      {questions.map((q,i) => (
        <section className="panel quiz-card" key={q.q}>
          <div className="quiz-q-head">
            <span>QUESTION 0{i+1}</span>
            {submitted && <Tag level={answers[i] === String(q.a) ? 'Low' : 'High'}/>}
          </div>

          <h3>{q.q}</h3>

          <div className="quiz-options">
            {q.o.map((o,j) => (
              <label
                key={o}
                className={`${answers[i] === String(j) ? 'chosen' : ''} ${submitted && j === q.a ? 'correct' : ''}`}
              >
                <input
                  type="radio"
                  name={`q${i}`}
                  value={j}
                  checked={answers[i] === String(j)}
                  disabled={submitted}
                  onChange={e => setAnswers({...answers,[i]:e.target.value})}
                />
                <span>{String.fromCharCode(65+j)}</span>{o}
              </label>
            ))}
          </div>

          {submitted && <div className="quiz-explain"><CheckCircle2 size={16}/>{q.why}</div>}
        </section>
      ))}

      <div className="quiz-footer">
        {submitted ? <>
          <div className="quiz-score">
            <Trophy size={20}/>
            <b>Your score: {score}/{questions.length}</b>
            <span>
              {score === 4
                ? 'Excellent work!'
                : score >= 2
                  ? 'Good effort. Keep learning.'
                  : 'Review the explanations and try again.'}
            </span>
          </div>
          <Btn onClick={() => {setAnswers({});setSubmitted(false);}} variant="secondary">
            Try again
          </Btn>
        </> : (
          <Btn
            onClick={() => setSubmitted(true)}
            disabled={Object.keys(answers).length !== questions.length}
          >
            Submit answers
          </Btn>
        )}
      </div>
    </div>
  </div>;
}

/* ---------------- EMERGENCY HELP ---------------- */

function Emergency() {
  return <div className="page-content">
    <div className="page-heading">
      <div>
        <div className="eyebrow">IF YOU THINK YOU HAVE BEEN SCAMMED</div>
        <h1>Emergency fraud help</h1>
        <p>Act quickly, preserve evidence and contact the right official channels.</p>
      </div>
      <span className="mode-badge danger-mode"><LifeBuoy size={14}/> Important</span>
    </div>

    <div className="emergency-hero">
      <div className="emergency-icon"><LifeBuoy size={30}/></div>
      <div>
        <span>INDIA · FINANCIAL CYBER FRAUD</span>
        <h2>Call 1930 promptly</h2>
        <p>
          If money has been lost through a cyber financial fraud, contact the national
          cyber fraud helpline as soon as possible and inform your bank/payment provider.
        </p>
        <a href="tel:1930" className="btn primary">
          Call 1930 <ArrowRight size={15}/>
        </a>
      </div>
    </div>

    <div className="emergency-grid">
      <section className="panel">
        <h3>What to do immediately</h3>
        <ol className="steps-list">
          <li>
            <b>Contact your bank or payment app</b>
            <span>Ask them to report the transaction and secure your account.</span>
          </li>
          <li>
            <b>Call the cyber fraud helpline</b>
            <span>In India, dial 1930 promptly for financial cyber fraud.</span>
          </li>
          <li>
            <b>Preserve evidence</b>
            <span>Keep transaction IDs, screenshots, phone numbers, URLs and message details.</span>
          </li>
          <li>
            <b>Report through the official portal</b>
            <span>Use the National Cyber Crime Reporting Portal.</span>
          </li>
          <li>
            <b>Secure your accounts</b>
            <span>Change compromised passwords and revoke unknown sessions or app access.</span>
          </li>
        </ol>
      </section>

      <section className="panel official-links">
        <h3>Official resources</h3>
        <a href="https://cybercrime.gov.in/" target="_blank" rel="noreferrer">
          <Globe/> National Cyber Crime Reporting Portal <ExternalLink size={14}/>
        </a>
        <a href="https://www.npci.org.in/" target="_blank" rel="noreferrer">
          <ShieldCheck/> NPCI information <ExternalLink size={14}/>
        </a>
        <a href="https://www.rbi.org.in/" target="_blank" rel="noreferrer">
          <FileText/> Reserve Bank of India <ExternalLink size={14}/>
        </a>

        <div className="tip-box">
          <b>Important</b>
          <p>Never pay someone who promises to recover your lost money for an advance fee. Verify all help channels independently.</p>
        </div>
      </section>
    </div>
  </div>;
}

/* ---------------- PROFILE ---------------- */

function Profile({profile,onUpdate}) {
  const [form,setForm] = useState(profile);
  const [saved,setSaved] = useState(false);
  const update = (k,v) => setForm({...form,[k]:v});

  return <div className="page-content">
    <div className="page-heading">
      <div>
        <div className="eyebrow">ACCOUNT & PREFERENCES</div>
        <h1>My profile</h1>
        <p>Manage your account details and workspace preferences.</p>
      </div>
      <span className="mode-badge"><UserRound size={14}/> Personal account</span>
    </div>

    <div className="profile-layout">
      <section className="panel profile-card">
        <div className="profile-hero">
          <div className="profile-avatar">
            {(form.name || 'P').slice(0,1).toUpperCase()}
          </div>
          <div>
            <h3>{form.name}</h3>
            <span>PhishShield user account</span>
          </div>
        </div>

        <div className="profile-fields">
          <Field
            label="First name"
            icon={UserRound}
            value={form.name}
            onChange={e => update('name',e.target.value)}
          />

          <Field label="Email address" icon={Mail} value={form.email} readOnly/>
          <Field label="Phone number" icon={Smartphone} value={form.phone} readOnly/>

          <label className="field">
            <span>Preferred language</span>
            <div className="field-wrap">
              <Languages size={17}/>
              <select
                value={form.language || 'English'}
                onChange={e => update('language',e.target.value)}
              >
                <option>English</option>
                <option>Hindi</option>
                <option>Hinglish</option>
              </select>
            </div>
          </label>

          <Btn
            onClick={() => {
              onUpdate(form);
              setSaved(true);
              setTimeout(() => setSaved(false),2200);
            }}
            icon={CheckCircle2}
          >
            Save profile
          </Btn>

          {saved && <span className="success-text">Profile preferences saved on this device.</span>}
        </div>
      </section>

      <section className="panel preference-panel">
        <h3>Privacy & workspace</h3>
        <div className="preference-row">
          <span><LockKeyhole/> Local demo storage</span>
          <b>Enabled</b>
        </div>
        <div className="preference-row">
          <span><Bell/> Threat notifications</span>
          <b>Demo only</b>
        </div>
        <div className="preference-row">
          <span><Globe/> Language support</span>
          <b>UI preference</b>
        </div>
        <div className="tip-box">
          <b>Account information</b>
          <p>This is a frontend demo. Real account authentication and password security require a backend.</p>
        </div>
      </section>
    </div>
  </div>;
}

/* ---------------- MAIN APP ---------------- */

export default function App() {
  const [profile,setProfile] = useState(() => readStore().profile || null);
  const [page,setPage] = useState('overview');
  const [collapsed,setCollapsed] = useState(false);
  const [mobileOpen,setMobileOpen] = useState(false);
  const [history,setHistory] = useState(() => readStore().history || []);

  useEffect(() => {
    localStorage.setItem(STORE,JSON.stringify({profile,history}));
  },[profile,history]);

  const completeAuth = p => {
    setProfile(p);
    setPage('overview');
  };

  const logout = () => {
    setProfile(null);
    setPage('overview');
  };

  const addScan = s => setHistory(old => [
    {...s,id:Date.now(),date:new Date().toISOString()},
    ...old
  ].slice(0,100));

  const clearHistory = () => {
    if (window.confirm('Delete all scan history saved in this browser?')) {
      setHistory([]);
    }
  };

  if (!profile) return <Auth onDone={completeAuth}/>;

  return <div className="app-shell">
    <Sidebar
      page={page}
      setPage={p => {setPage(p);setMobileOpen(false);}}
      profile={profile}
      onLogout={logout}
      collapsed={collapsed}
      setCollapsed={setCollapsed}
    />

    {mobileOpen && (
      <button
        className="mobile-scrim"
        onClick={() => setMobileOpen(false)}
        aria-label="Close navigation"
      />
    )}

    <main className={`main-area ${collapsed ? 'expanded' : ''}`}>
      <Header
        page={page}
        profile={profile}
        onMenu={() => setMobileOpen(true)}
      />

      {page === 'overview'
        ? <Dashboard profile={profile} history={history} setPage={setPage}/>
        : page === 'scanner'
          ? <Scanner onSave={addScan}/>
          : page === 'history'
            ? <HistoryPage
                items={history}
                onDelete={id => setHistory(h => h.filter(x => x.id !== id))}
                onClear={clearHistory}
              />
            : page === 'alerts'
              ? <Alerts/>
              : page === 'map'
                ? <ThreatMap/>
                : page === 'quiz'
                  ? <Quiz/>
                  : page === 'help'
                    ? <Emergency/>
                    : <Profile profile={profile} onUpdate={setProfile}/>
      }

      <footer className="app-footer">
        <Brand/>
        <span>Pause. Check. Stay protected. <b>·</b> Frontend demo</span>
      </footer>
    </main>
  </div>;
}