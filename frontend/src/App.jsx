import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Target,
  FileText,
  Users,
  LogOut,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  UserPlus,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Eye,
  Sliders,
  Sun,
  Calendar,
  Trash2
} from 'lucide-react';

const API_BASE = `http://${window.location.hostname}:5000/api`;

// Helper to get current week's Monday (YYYY-MM-DD)
function getMonday(d) {
  d = new Date(d);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const mon = new Date(d.setDate(diff));
  return mon.toISOString().split('T')[0];
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  // Main navigation
  const [activeTab, setActiveTab] = useState('dashboard');

  // Application Data States
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [reports, setReports] = useState([]);

  // Filter and Form States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Form creation inputs
  const [newProject, setNewProject] = useState({ name: '', description: '', status: 'Active' });
  const [newTask, setNewTask] = useState({ projectId: '', title: '', description: '', assigneeId: '', deadline: '', priority: 'Medium' });
  const [newGoalType, setNewGoalType] = useState('day');
  const [newGoalDate, setNewGoalDate] = useState(new Date().toISOString().split('T')[0]);
  const [goalInputs, setGoalInputs] = useState(['']); // Danh sách mục tiêu thêm cùng lúc
  const [newReport, setNewReport] = useState({ weekStartDate: getMonday(new Date()), doneContent: '', plannedContent: '', blockers: '' });
  
  // Weekly summary filter for Admins
  const [summaryWeek, setSummaryWeek] = useState(getMonday(new Date()));
  const [weeklySummary, setWeeklySummary] = useState(null);

  // Tab đăng nhập / đăng ký tự do
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Danh sách tài khoản đăng ký chờ phê duyệt
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvalDepts, setApprovalDepts] = useState({});
  const [approvalRoles, setApprovalRoles] = useState({});

  // Admin user creation form
  const [newMember, setNewMember] = useState({ username: '', password: '', fullName: '', role: 'employee', departmentId: '1' });

  // Popups/Modals toggle
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

  // Auto-fetch data on load/token change
  useEffect(() => {
    if (token) {
      fetchCoreData();
    }
  }, [token]);

  // Fetch all necessary data based on role
  const fetchCoreData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch departments, projects, tasks, goals
      const [deptsRes, projRes, taskRes, goalsRes] = await Promise.all([
        fetch(`${API_BASE}/departments`, { headers }),
        fetch(`${API_BASE}/projects`, { headers }),
        fetch(`${API_BASE}/tasks`, { headers }),
        fetch(`${API_BASE}/goals`, { headers })
      ]);

      if (deptsRes.ok) setDepartments(await deptsRes.json());
      if (projRes.ok) setProjects(await projRes.json());
      if (taskRes.ok) setTasks(await taskRes.json());
      if (goalsRes.ok) setGoals(await goalsRes.json());

      // If Admin or Leader, fetch users and weekly summary
      if (user && (user.role === 'admin' || user.role === 'leader')) {
        const usersRes = await fetch(`${API_BASE}/users`, { headers });
        if (usersRes.ok) setUsersList(await usersRes.json());
        
        if (user.role === 'admin') {
          const pendingRes = await fetch(`${API_BASE}/users/pending`, { headers });
          if (pendingRes.ok) setPendingUsers(await pendingRes.json());
        }
        
        fetchWeeklySummary(summaryWeek);
      }

      // Fetch user's own reports
      const reportsRes = await fetch(`${API_BASE}/reports`, { headers });
      if (reportsRes.ok) setReports(await reportsRes.json());

    } catch (err) {
      console.error("Lỗi tải dữ liệu: ", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklySummary = async (week) => {
    try {
      const res = await fetch(`${API_BASE}/reports/weekly-summary?weekStartDate=${week}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setWeeklySummary(await res.json());
      }
    } catch (err) {
      console.error("Lỗi nạp báo cáo tuần: ", err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Đăng nhập không thành công.');
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setActiveTab('dashboard');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerUsername,
          password: registerPassword,
          fullName: registerFullName
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Đăng ký không thành công.');
      }
      setSuccessMsg('Đăng ký tài khoản thành công! Hãy đợi Admin phê duyệt.');
      setRegisterUsername('');
      setRegisterPassword('');
      setRegisterFullName('');
      setIsLoginTab(true);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    const deptId = approvalDepts[userId] || '1';
    const role = approvalRoles[userId] || 'employee';
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ departmentId: deptId, role })
      });
      if (res.ok) {
        alert("Phê duyệt tài khoản thành công!");
        fetchCoreData();
      } else {
        const data = await res.json();
        alert(data.message || 'Lỗi phê duyệt.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- API MUTATIONS ---

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newProject)
      });
      if (res.ok) {
        setNewProject({ name: '', description: '', status: 'Active' });
        setShowProjectModal(false);
        fetchCoreData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTask)
      });
      if (res.ok) {
        setNewTask({ projectId: '', title: '', description: '', assigneeId: '', deadline: '', priority: 'Medium' });
        setShowTaskModal(false);
        fetchCoreData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTaskProgress = async (taskId, progress) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ progress })
      });
      if (res.ok) {
        fetchCoreData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      const goalsToSend = goalInputs
        .filter(val => val.trim().length > 0)
        .map(content => ({
          type: newGoalType,
          content,
          progress: 0,
          targetDate: newGoalDate
        }));

      if (goalsToSend.length === 0) return;

      const res = await fetch(`${API_BASE}/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(goalsToSend)
      });
      if (res.ok) {
        setGoalInputs(['']);
        setShowGoalModal(false);
        fetchCoreData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateGoalProgress = async (goalId, progress) => {
    try {
      const res = await fetch(`${API_BASE}/goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ progress })
      });
      if (res.ok) {
        fetchCoreData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!confirm("Bạn chắc chắn muốn xóa mục tiêu này chứ?")) return;
    try {
      const res = await fetch(`${API_BASE}/goals/${goalId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCoreData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newMember)
      });
      if (res.ok) {
        setNewMember({ username: '', password: '', fullName: '', role: 'employee', departmentId: '1' });
        setShowMemberModal(false);
        fetchCoreData();
      } else {
        const data = await res.json();
        alert(data.message || 'Thêm thành viên lỗi');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newReport)
      });
      if (res.ok) {
        alert("Nộp báo cáo tuần thành công!");
        setNewReport({ weekStartDate: getMonday(new Date()), doneContent: '', plannedContent: '', blockers: '' });
        fetchCoreData();
      }
    } catch (err) {
      console.error(err);
    }
  };
  const handleExportDoc = async () => {
    try {
      const res = await fetch(`${API_BASE}/reports/export-doc?weekStartDate=${summaryWeek}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Không thể xuất báo cáo.');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bao_Cao_Tuan_${summaryWeek}.doc`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Lỗi xuất file Word: " + err.message);
    }
  };
  const autoPopulateReport = () => {
    // Collect all goals/tasks that are done (100%) or active in this week
    const monday = getMonday(new Date());
    const weekGoals = goals.filter(g => g.targetDate >= monday);
    
    const completedList = weekGoals
      .map(g => `- [Mục tiêu ${g.type === 'day' ? 'Ngày' : g.type === 'week' ? 'Tuần' : 'Tháng'}] ${g.content} (${g.progress}%)`)
      .join('\n');
      
    const taskList = tasks
      .filter(t => t.assigneeId === user.id)
      .map(t => `- [Task] ${t.title} (Tiến độ: ${t.progress}%)`)
      .join('\n');

    setNewReport(prev => ({
      ...prev,
      doneContent: `--- BÁO CÁO CÔNG VIỆC ---\n${taskList || 'Không có task gán trực tiếp.'}\n\n--- CÁC MỤC TIÊU ---\n${completedList || 'Chưa đăng ký mục tiêu tuần này.'}`
    }));
  };

  // --- RENDERING HELPERS ---

  if (!token) {
    return (
      <div className="login-wrapper">
        <style>{`
          .login-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: radial-gradient(circle at center, #1e1b4b 0%, #090d16 100%);
            padding: 20px;
          }
          .login-container {
            width: 100%;
            max-width: 440px;
            padding: 40px;
            background: rgba(17, 24, 39, 0.75);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 40px rgba(99, 102, 241, 0.1);
          }
          .login-header {
            text-align: center;
            margin-bottom: 24px;
          }
          .login-logo {
            font-size: 2.2rem;
            font-weight: 800;
            background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 8px;
          }
          .login-sub {
            color: #9ca3af;
            font-size: 0.9rem;
          }
          .error-box {
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #fca5a5;
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 0.9rem;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .success-box {
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid rgba(16, 185, 129, 0.3);
            color: #a7f3d0;
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 0.9rem;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .tab-btn {
            flex-grow: 1;
            padding: 10px;
            font-size: 0.9rem;
            font-weight: 600;
            background: transparent;
            border: none;
            cursor: pointer;
            color: var(--text-secondary);
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
          }
          .tab-btn.active {
            color: #fff;
            border-bottom: 2px solid var(--accent-primary);
          }
        `}</style>
        <div className="login-container">
          <div className="login-header">
            <div className="login-logo">ANTIGRAVITY PM</div>
            <div className="login-sub">Hệ Thống Quản Lý Dự Án & Báo Cáo Nội Bộ</div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px' }}>
            <button className={`tab-btn ${isLoginTab ? 'active' : ''}`} onClick={() => { setIsLoginTab(true); setErrorMsg(''); setSuccessMsg(''); }}>Đăng Nhập</button>
            <button className={`tab-btn ${!isLoginTab ? 'active' : ''}`} onClick={() => { setIsLoginTab(false); setErrorMsg(''); setSuccessMsg(''); }}>Đăng Ký</button>
          </div>

          {errorMsg && (
            <div className="error-box">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="success-box">
              <CheckCircle size={18} style={{ color: 'var(--status-done)' }} />
              <span>{successMsg}</span>
            </div>
          )}

          {isLoginTab ? (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '20px' }}>
                <label className="input-label">Tên tài khoản</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Username đăng nhập"
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginBottom: '28px' }}>
                <label className="input-label">Mật khẩu</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }} disabled={loading}>
                {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: '16px' }}>
                <label className="input-label">Họ và tên</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ví dụ: Nguyễn Văn Nhân Sự"
                  value={registerFullName}
                  onChange={e => setRegisterFullName(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label className="input-label">Tên tài khoản (Username)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Tên viết liền không dấu"
                  value={registerUsername}
                  onChange={e => setRegisterUsername(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label className="input-label">Mật khẩu</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Mật khẩu tối thiểu 6 ký tự"
                  value={registerPassword}
                  onChange={e => setRegisterPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }} disabled={loading}>
                {loading ? 'Đang gửi đăng ký...' : 'Đăng Ký Tài Khoản'}
              </button>
            </form>
          )}
          
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.8rem', color: '#6b7280' }}>
            Yêu cầu phê duyệt từ Admin sau khi đăng ký thành công.
          </div>
        </div>
      </div>
    );
  }

  // Common Layout Styles
  const layoutStyle = `
    .app-layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      min-height: 100vh;
    }
    .sidebar {
      background: #0f172a;
      border-right: 1px solid var(--border-glass);
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: sticky;
      top: 0;
      height: 100vh;
    }
    .main-content {
      padding: 40px;
      max-height: 100vh;
      overflow-y: auto;
      background: radial-gradient(circle at 100% 0%, #1e1b4b 0%, #090d16 50%);
    }
    .sidebar-menu {
      list-style: none;
      margin-top: 32px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .sidebar-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      cursor: pointer;
      font-weight: 500;
      transition: all var(--transition-fast);
    }
    .sidebar-item:hover, .sidebar-item.active {
      color: #fff;
      background: rgba(99, 102, 241, 0.15);
    }
    .sidebar-item.active {
      border: 1px solid var(--border-glow);
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.1) 100%);
    }
    .user-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--border-glass);
      padding: 16px;
      border-radius: var(--radius-lg);
      margin-bottom: 20px;
    }
    .dashboard-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 28px;
      margin-top: 24px;
    }
    .stat-card-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-top: 24px;
    }
    .stat-card {
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .goal-column {
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--border-glass);
      border-radius: var(--radius-lg);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .goal-item {
      background: rgba(17, 24, 39, 0.6);
      border: 1px solid var(--border-glass);
      border-radius: var(--radius-md);
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }
    .modal-body {
      background: var(--bg-secondary);
      border: 1px solid var(--border-glass);
      width: 100%;
      max-width: 500px;
      border-radius: var(--radius-lg);
      padding: 28px;
      box-shadow: var(--shadow-lg);
    }
  `;

  // Compute stats helper
  const activeTasks = tasks.filter(t => t.assigneeId === user.id && t.status !== 'Done');
  const finishedTasks = tasks.filter(t => t.assigneeId === user.id && t.status === 'Done');
  const myGoalsCount = goals.filter(g => g.userId === user.id).length;

  return (
    <div className="app-layout">
      <style>{layoutStyle}</style>

      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }} />
            <h3 style={{ fontSize: '1.2rem', letterSpacing: '0px' }}>ANTIGRAVITY PM</h3>
          </div>

          <ul className="sidebar-menu">
            <li className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              <LayoutDashboard size={20} />
              <span>Bảng điều khiển</span>
            </li>
            <li className={`sidebar-item ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>
              <FolderKanban size={20} />
              <span>Dự án & Task</span>
            </li>
            <li className={`sidebar-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
              <FileText size={20} />
              <span>Báo cáo tuần</span>
            </li>
            {user.role === 'admin' && (
              <li className={`sidebar-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
                <Users size={20} />
                <span>Quản trị thành viên</span>
              </li>
            )}
          </ul>
        </div>

        <div>
          <div className="user-card">
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{user.fullName}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span>@{user.username}</span>
              <span className={`badge ${user.role === 'admin' ? 'badge-high' : user.role === 'leader' ? 'badge-medium' : 'badge-low'}`}>
                {user.role.toUpperCase()}
              </span>
            </div>
            {user.departmentId && (
              <div style={{ marginTop: '8px' }}>
                <span className="dept-tag">
                  {departments.find(d => d.id === user.departmentId)?.name || 'Chưa phân phòng'}
                </span>
              </div>
            )}
          </div>

          <button className="btn btn-danger" style={{ width: '100%' }} onClick={handleLogout}>
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className="main-content">

        {/* 1. DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Chào ngày mới, {user.fullName}!</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Hôm nay là {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <button className="btn btn-secondary" onClick={fetchCoreData} disabled={loading}>
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                <span>Làm mới</span>
              </button>
            </div>

            {/* Quick Stats Cards */}
            <div className="stat-card-row">
              <div className="glass-card stat-card">
                <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '12px', borderRadius: '12px', color: 'var(--accent-primary)' }}>
                  <FolderKanban size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tổng dự án</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{projects.length}</div>
                </div>
              </div>
              <div className="glass-card stat-card">
                <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '12px', borderRadius: '12px', color: 'var(--status-active)' }}>
                  <Clock size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Task đang làm</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{activeTasks.length}</div>
                </div>
              </div>
              <div className="glass-card stat-card">
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '12px', borderRadius: '12px', color: 'var(--status-done)' }}>
                  <CheckCircle size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Task hoàn thành</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{finishedTasks.length}</div>
                </div>
              </div>
              <div className="glass-card stat-card">
                <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '12px', borderRadius: '12px', color: 'var(--accent-secondary)' }}>
                  <Target size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mục tiêu đề ra</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{myGoalsCount}</div>
                </div>
              </div>
            </div>

            {/* Dashboard detail grid */}
            <div className="dashboard-grid">
              
              {/* Core Goals Board */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Target size={22} style={{ color: 'var(--accent-primary)' }} />
                    Mục tiêu công việc của tôi
                  </h3>
                  <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.85rem' }} onClick={() => setShowGoalModal(true)}>
                    <Plus size={16} />
                    Đặt mục tiêu
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  
                  {/* Daily Goals */}
                  <div className="goal-column">
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '2px solid rgba(99, 102, 241, 0.3)', paddingBottom: '6px', fontSize: '0.9rem', color: '#818cf8' }}>
                      <Sun size={16} />
                      HÀNG NGÀY
                    </h4>
                    {goals.filter(g => g.type === 'day' && g.userId === user.id).length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Chưa có mục tiêu ngày.</p>
                    ) : (
                      goals.filter(g => g.type === 'day' && g.userId === user.id).map(g => {
                        const borderStyle = g.progress === 100 
                          ? '1px solid rgba(16, 185, 129, 0.4)' 
                          : g.progress > 0 
                            ? '1px solid rgba(245, 158, 11, 0.3)' 
                            : '1px solid var(--border-glass)';
                        const bgStyle = g.progress === 100 
                          ? 'rgba(16, 185, 129, 0.04)' 
                          : g.progress > 0 
                            ? 'rgba(245, 158, 11, 0.02)' 
                            : 'rgba(17, 24, 39, 0.6)';
                        return (
                          <div key={g.id} className="goal-item animate-fade-in" style={{ border: borderStyle, background: bgStyle }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, textDecoration: g.progress === 100 ? 'line-through' : 'none', color: g.progress === 100 ? 'var(--text-muted)' : '#fff' }}>{g.content}</div>
                              <button 
                                className="btn" 
                                style={{ padding: '4px', background: 'transparent', border: 'none', color: 'var(--text-muted)', hoverColor: '#ef4444' }} 
                                onClick={() => handleDeleteGoal(g.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hạn: {g.targetDate}</div>
                            
                            {/* Quick Select Progress */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cập nhật:</span>
                              <div style={{ display: 'flex', gap: '3px' }}>
                                {[0, 50, 100].map(v => (
                                  <button
                                    key={v}
                                    type="button"
                                    style={{
                                      padding: '2px 5px',
                                      fontSize: '0.65rem',
                                      fontWeight: 'bold',
                                      background: g.progress === v ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                                      color: g.progress === v ? '#fff' : 'var(--text-secondary)',
                                      border: 'none',
                                      borderRadius: '3px',
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => handleUpdateGoalProgress(g.id, v)}
                                  >
                                    {v}%
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="progress-container" style={{ marginTop: '4px' }}>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={g.progress}
                                onChange={e => handleUpdateGoalProgress(g.id, e.target.value)}
                                style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                              />
                              <span className="progress-text" style={{ fontSize: '0.8rem' }}>{g.progress}%</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Weekly Goals */}
                  <div className="goal-column">
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '2px solid rgba(168, 85, 247, 0.3)', paddingBottom: '6px', fontSize: '0.9rem', color: '#c084fc' }}>
                      <Calendar size={16} />
                      HÀNG TUẦN
                    </h4>
                    {goals.filter(g => g.type === 'week' && g.userId === user.id).length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Chưa có mục tiêu tuần.</p>
                    ) : (
                      goals.filter(g => g.type === 'week' && g.userId === user.id).map(g => {
                        const borderStyle = g.progress === 100 
                          ? '1px solid rgba(16, 185, 129, 0.4)' 
                          : g.progress > 0 
                            ? '1px solid rgba(245, 158, 11, 0.3)' 
                            : '1px solid var(--border-glass)';
                        const bgStyle = g.progress === 100 
                          ? 'rgba(16, 185, 129, 0.04)' 
                          : g.progress > 0 
                            ? 'rgba(245, 158, 11, 0.02)' 
                            : 'rgba(17, 24, 39, 0.6)';
                        return (
                          <div key={g.id} className="goal-item animate-fade-in" style={{ border: borderStyle, background: bgStyle }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, textDecoration: g.progress === 100 ? 'line-through' : 'none', color: g.progress === 100 ? 'var(--text-muted)' : '#fff' }}>{g.content}</div>
                              <button 
                                className="btn" 
                                style={{ padding: '4px', background: 'transparent', border: 'none', color: 'var(--text-muted)', hoverColor: '#ef4444' }} 
                                onClick={() => handleDeleteGoal(g.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tuần: {g.targetDate}</div>
                            
                            {/* Quick Select Progress */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cập nhật:</span>
                              <div style={{ display: 'flex', gap: '3px' }}>
                                {[0, 50, 100].map(v => (
                                  <button
                                    key={v}
                                    type="button"
                                    style={{
                                      padding: '2px 5px',
                                      fontSize: '0.65rem',
                                      fontWeight: 'bold',
                                      background: g.progress === v ? 'var(--accent-secondary)' : 'rgba(255,255,255,0.05)',
                                      color: g.progress === v ? '#fff' : 'var(--text-secondary)',
                                      border: 'none',
                                      borderRadius: '3px',
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => handleUpdateGoalProgress(g.id, v)}
                                  >
                                    {v}%
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="progress-container" style={{ marginTop: '4px' }}>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={g.progress}
                                onChange={e => handleUpdateGoalProgress(g.id, e.target.value)}
                                style={{ width: '100%', accentColor: 'var(--accent-secondary)', cursor: 'pointer' }}
                              />
                              <span className="progress-text" style={{ fontSize: '0.8rem' }}>{g.progress}%</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Monthly Goals */}
                  <div className="goal-column">
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '2px solid rgba(16, 185, 129, 0.3)', paddingBottom: '6px', fontSize: '0.9rem', color: '#34d399' }}>
                      <Target size={16} />
                      HÀNG THÁNG
                    </h4>
                    {goals.filter(g => g.type === 'month' && g.userId === user.id).length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Chưa có mục tiêu tháng.</p>
                    ) : (
                      goals.filter(g => g.type === 'month' && g.userId === user.id).map(g => {
                        const borderStyle = g.progress === 100 
                          ? '1px solid rgba(16, 185, 129, 0.4)' 
                          : g.progress > 0 
                            ? '1px solid rgba(245, 158, 11, 0.3)' 
                            : '1px solid var(--border-glass)';
                        const bgStyle = g.progress === 100 
                          ? 'rgba(16, 185, 129, 0.04)' 
                          : g.progress > 0 
                            ? 'rgba(245, 158, 11, 0.02)' 
                            : 'rgba(17, 24, 39, 0.6)';
                        return (
                          <div key={g.id} className="goal-item animate-fade-in" style={{ border: borderStyle, background: bgStyle }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, textDecoration: g.progress === 100 ? 'line-through' : 'none', color: g.progress === 100 ? 'var(--text-muted)' : '#fff' }}>{g.content}</div>
                              <button 
                                className="btn" 
                                style={{ padding: '4px', background: 'transparent', border: 'none', color: 'var(--text-muted)', hoverColor: '#ef4444' }} 
                                onClick={() => handleDeleteGoal(g.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tháng: {g.targetDate}</div>
                            
                            {/* Quick Select Progress */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cập nhật:</span>
                              <div style={{ display: 'flex', gap: '3px' }}>
                                {[0, 50, 100].map(v => (
                                  <button
                                    key={v}
                                    type="button"
                                    style={{
                                      padding: '2px 5px',
                                      fontSize: '0.65rem',
                                      fontWeight: 'bold',
                                      background: g.progress === v ? 'var(--status-done)' : 'rgba(255,255,255,0.05)',
                                      color: g.progress === v ? '#fff' : 'var(--text-secondary)',
                                      border: 'none',
                                      borderRadius: '3px',
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => handleUpdateGoalProgress(g.id, v)}
                                  >
                                    {v}%
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="progress-container" style={{ marginTop: '4px' }}>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={g.progress}
                                onChange={e => handleUpdateGoalProgress(g.id, e.target.value)}
                                style={{ width: '100%', accentColor: 'var(--status-done)', cursor: 'pointer' }}
                              />
                              <span className="progress-text" style={{ fontSize: '0.8rem' }}>{g.progress}%</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              </div>

              {/* My Assigned Tasks */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <Clock size={22} style={{ color: 'var(--status-active)' }} />
                  Đầu việc được giao ({activeTasks.length})
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {activeTasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      Tuyệt vời! Bạn đã hoàn thành hết các task được giao.
                    </div>
                  ) : (
                    activeTasks.map(t => {
                      const proj = projects.find(p => p.id === t.projectId);
                      return (
                        <div key={t.id} className="goal-item" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--accent-primary)', fontWeight: 700 }}>
                                {proj ? proj.name : 'Dự án khác'}
                              </span>
                              <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '2px' }}>{t.title}</div>
                            </div>
                            <span className={`badge badge-${t.priority.toLowerCase()}`}>{t.priority}</span>
                          </div>
                          
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.description}</p>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            <span>Hạn hoàn thành:</span>
                            <span style={{ color: new Date(t.deadline) < new Date() ? 'var(--status-overdue)' : 'var(--text-primary)', fontWeight: 600 }}>
                              {t.deadline}
                            </span>
                          </div>

                          <div className="progress-container" style={{ marginTop: '8px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cập nhật tiến độ:</span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={t.progress}
                              onChange={e => handleUpdateTaskProgress(t.id, e.target.value)}
                              style={{ flexGrow: 1, accentColor: 'var(--status-done)', cursor: 'pointer' }}
                            />
                            <span className="progress-text">{t.progress}%</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 2. PROJECTS & TASKS TAB */}
        {activeTab === 'projects' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h2>Quản lý Dự án & Đầu mục công việc</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Xem danh sách các dự án đang triển khai và giao việc cho nhân sự.</p>
              </div>
              {(user.role === 'admin' || user.role === 'leader') && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-secondary" onClick={() => setShowTaskModal(true)}>
                    <Plus size={16} />
                    Tạo Công việc mới
                  </button>
                  <button className="btn btn-primary" onClick={() => setShowProjectModal(true)}>
                    <Plus size={16} />
                    Tạo Dự án mới
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {projects.map(proj => {
                const projTasks = tasks.filter(t => t.projectId === proj.id);
                const avgProgress = projTasks.length > 0
                  ? Math.round(projTasks.reduce((acc, curr) => acc + curr.progress, 0) / projTasks.length)
                  : 0;

                return (
                  <div key={proj.id} className="glass-card" style={{ padding: '28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', marginBottom: '20px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <h3 style={{ fontSize: '1.4rem' }}>{proj.name}</h3>
                          <span className={`badge badge-${proj.status === 'Active' ? 'active' : 'done'}`}>{proj.status}</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '0.9rem', maxWidth: '800px' }}>{proj.description}</p>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: '150px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tiến độ tổng thể</span>
                        <div className="progress-container" style={{ marginTop: '4px' }}>
                          <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${avgProgress}%` }} />
                          </div>
                          <span className="progress-text">{avgProgress}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Task list for this project */}
                    <div>
                      <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Danh sách task ({projTasks.length})
                      </h4>
                      {projTasks.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', padding: '10px 0' }}>Chưa có công việc nào được gán cho dự án này.</p>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                <th style={{ padding: '12px 8px' }}>Tên công việc</th>
                                <th style={{ padding: '12px 8px' }}>Người thực hiện</th>
                                <th style={{ padding: '12px 8px' }}>Độ ưu tiên</th>
                                <th style={{ padding: '12px 8px' }}>Hạn chót</th>
                                <th style={{ padding: '12px 8px', width: '200px' }}>Tiến độ</th>
                                <th style={{ padding: '12px 8px' }}>Trạng thái</th>
                              </tr>
                            </thead>
                            <tbody>
                              {projTasks.map(t => {
                                const assigneeName = usersList.find(u => u.id === t.assigneeId)?.fullName || 'Không xác định';
                                const isOverdue = new Date(t.deadline) < new Date() && t.status !== 'Done';
                                return (
                                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#e5e7eb' }}>
                                    <td style={{ padding: '14px 8px', fontWeight: 600 }}>
                                      <div>{t.title}</div>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, marginTop: '2px' }}>{t.description}</div>
                                    </td>
                                    <td style={{ padding: '14px 8px' }}>{assigneeName}</td>
                                    <td style={{ padding: '14px 8px' }}>
                                      <span className={`badge badge-${t.priority.toLowerCase()}`}>{t.priority}</span>
                                    </td>
                                    <td style={{ padding: '14px 8px', color: isOverdue ? 'var(--status-overdue)' : '#fff', fontWeight: isOverdue ? 700 : 400 }}>
                                      {t.deadline} {isOverdue && '(Quá hạn)'}
                                    </td>
                                    <td style={{ padding: '14px 8px' }}>
                                      {/* Slider progress or text */}
                                      <div className="progress-container">
                                        <div className="progress-bar-bg" style={{ height: '6px' }}>
                                          <div className="progress-bar-fill" style={{ width: `${t.progress}%` }} />
                                        </div>
                                        <span className="progress-text" style={{ fontSize: '0.8rem' }}>{t.progress}%</span>
                                      </div>
                                    </td>
                                    <td style={{ padding: '14px 8px' }}>
                                      <span className={`badge badge-${t.status === 'Done' ? 'done' : isOverdue ? 'overdue' : 'active'}`}>
                                        {t.status === 'Done' ? 'Hoàn thành' : t.status === 'Active' ? 'Đang chạy' : 'Mới'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="animate-fade-in">
            <h2>Hệ thống Báo cáo tuần</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Nộp báo cáo cá nhân hàng tuần và xem tổng hợp báo cáo dành cho Quản trị viên.</p>

            <div className="dashboard-grid" style={{ marginTop: '32px' }}>
              
              {/* Employee report submit form */}
              <div className="glass-card" style={{ padding: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3>Báo cáo tuần của tôi</h3>
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={autoPopulateReport}>
                    <Sliders size={14} />
                    Tự động điền từ Goals
                  </button>
                </div>

                <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="input-label">Ngày bắt đầu tuần (Thứ Hai)</label>
                    <input
                      type="date"
                      className="input-field"
                      value={newReport.weekStartDate}
                      onChange={e => setNewReport(prev => ({ ...prev, weekStartDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="input-label">Công việc đã hoàn thành (Trong tuần này)</label>
                    <textarea
                      className="input-field"
                      rows="4"
                      placeholder="Ghi rõ các task đã hoàn thành hoặc tiến độ đạt được..."
                      value={newReport.doneContent}
                      onChange={e => setNewReport(prev => ({ ...prev, doneContent: e.target.value }))}
                      required
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                  <div>
                    <label className="input-label">Kế hoạch tuần tiếp theo</label>
                    <textarea
                      className="input-field"
                      rows="3"
                      placeholder="Nêu chi tiết các đầu việc dự kiến triển khai trong tuần tới..."
                      value={newReport.plannedContent}
                      onChange={e => setNewReport(prev => ({ ...prev, plannedContent: e.target.value }))}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                  <div>
                    <label className="input-label">Khó khăn / Vướng mắc (nếu có)</label>
                    <textarea
                      className="input-field"
                      rows="2"
                      placeholder="Các cản trở về linh kiện, thiết kế, code chưa chạy..."
                      value={newReport.blockers}
                      onChange={e => setNewReport(prev => ({ ...prev, blockers: e.target.value }))}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Gửi báo cáo tuần</button>
                </form>
              </div>

              {/* Admin/Leader Weekly Synthesis Panel */}
              <div className="glass-card" style={{ padding: '28px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={22} style={{ color: 'var(--accent-secondary)' }} />
                  Tổng hợp báo cáo cho Admin/Leader
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '20px' }}>
                  Gom nhóm báo cáo của nhân viên theo phòng ban và tóm tắt ý chính.
                </p>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                  <input
                    type="date"
                    className="input-field"
                    value={summaryWeek}
                    onChange={e => setSummaryWeek(e.target.value)}
                    style={{ flexGrow: 1 }}
                  />
                  <button className="btn btn-secondary" onClick={() => fetchWeeklySummary(summaryWeek)}>Xem tổng hợp</button>
                  {weeklySummary && (
                    <button className="btn btn-primary" onClick={handleExportDoc} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                      Xuất File Word (.doc)
                    </button>
                  )}
                </div>

                {weeklySummary ? (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ padding: '16px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '12px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertCircle size={16} style={{ color: 'var(--accent-primary)' }} />
                        TỔNG HỢPÝ CHÍNH
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#d1d5db', whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                        {weeklySummary.synthesizedOverview}
                      </p>
                    </div>

                    {/* Blockers highlighting */}
                    {weeklySummary.allBlockers.length > 0 && (
                      <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fca5a5', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <AlertTriangle size={16} style={{ color: 'var(--status-overdue)' }} />
                          KHÓ KHĂN / VƯỚNG MẮC ĐƯỢC BÁO CÁO
                        </div>
                        <ul style={{ fontSize: '0.85rem', color: '#fca5a5', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {weeklySummary.allBlockers.map((blk, idx) => (
                            <li key={idx}>{blk}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Department summaries */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
                      {Object.entries(weeklySummary.departmentsSummary).map(([deptName, deptData]) => {
                        if (deptData.submittedUsers.length === 0) return null;
                        return (
                          <div key={deptName} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span className="dept-tag">{deptName}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Đã nộp: {deptData.submittedUsers.join(', ')}
                              </span>
                            </div>
                            
                            <div style={{ marginTop: '8px' }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--status-done)', marginBottom: '4px' }}>Đã hoàn thành:</div>
                              <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {deptData.donePoints.map((pt, idx) => <li key={idx}>{pt}</li>)}
                              </ul>
                            </div>

                            <div style={{ marginTop: '8px' }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '4px' }}>Kế hoạch tuần tới:</div>
                              <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {deptData.plannedPoints.map((pt, idx) => <li key={idx}>{pt}</li>)}
                              </ul>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Chưa có dữ liệu tổng hợp cho tuần này. Chọn tuần và bấm "Xem tổng hợp".
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* 4. ADMIN TAB */}
        {activeTab === 'admin' && user.role === 'admin' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2>Quản trị Thành viên & Phân quyền</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Quản lý danh sách nhân sự của công ty và cấp tài khoản mới.</p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowMemberModal(true)}>
                <UserPlus size={16} />
                Thêm Thành viên
              </button>
            </div>

            {pendingUsers.length > 0 && (
              <div className="glass-card animate-fade-in" style={{ padding: '24px', marginBottom: '32px', border: '1px solid rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.02)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-active)', marginBottom: '16px' }}>
                  <AlertCircle size={22} />
                  Tài khoản đang chờ phê duyệt ({pendingUsers.length})
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        <th style={{ padding: '12px' }}>Họ và tên</th>
                        <th style={{ padding: '12px' }}>Username</th>
                        <th style={{ padding: '12px' }}>Chọn Phòng ban</th>
                        <th style={{ padding: '12px' }}>Chọn Vai trò</th>
                        <th style={{ padding: '12px' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingUsers.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{u.fullName}</td>
                          <td style={{ padding: '12px' }}>@{u.username}</td>
                          <td style={{ padding: '12px' }}>
                            <select
                              className="input-field"
                              style={{ padding: '6px 12px', fontSize: '0.85rem', width: 'auto' }}
                              value={approvalDepts[u.id] || '1'}
                              onChange={e => setApprovalDepts({ ...approvalDepts, [u.id]: e.target.value })}
                            >
                              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <select
                              className="input-field"
                              style={{ padding: '6px 12px', fontSize: '0.85rem', width: 'auto' }}
                              value={approvalRoles[u.id] || 'employee'}
                              onChange={e => setApprovalRoles({ ...approvalRoles, [u.id]: e.target.value })}
                            >
                              <option value="employee">Nhân viên (Employee)</option>
                              <option value="leader">Trưởng nhóm (Leader)</option>
                              <option value="admin">Quản trị viên (Admin)</option>
                            </select>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                              onClick={() => handleApproveUser(u.id)}
                            >
                              Phê duyệt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="glass-card" style={{ padding: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <th style={{ padding: '12px' }}>Họ và tên</th>
                    <th style={{ padding: '12px' }}>Username</th>
                    <th style={{ padding: '12px' }}>Vai trò</th>
                    <th style={{ padding: '12px' }}>Phòng ban</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '14px 12px', fontWeight: 600 }}>{u.fullName}</td>
                      <td style={{ padding: '14px 12px' }}>@{u.username}</td>
                      <td style={{ padding: '14px 12px' }}>
                        <span className={`badge ${u.role === 'admin' ? 'badge-high' : u.role === 'leader' ? 'badge-medium' : 'badge-low'}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <span className="dept-tag">
                          {departments.find(d => d.id === u.departmentId)?.name || 'Chưa phân phòng'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* --- MODALS --- */}

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="modal-body animate-fade-in" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={22} style={{ color: 'var(--accent-primary)' }} />
              Đặt các mục tiêu công việc mới
            </h3>
            <form onSubmit={handleCreateGoal} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="input-label">Loại mục tiêu</label>
                  <select
                    className="input-field"
                    value={newGoalType}
                    onChange={e => setNewGoalType(e.target.value)}
                  >
                    <option value="day">Mục tiêu Ngày</option>
                    <option value="week">Mục tiêu Tuần</option>
                    <option value="month">Mục tiêu Tháng</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Thời hạn / Ngày hoàn thành</label>
                  <input
                    type="date"
                    className="input-field"
                    value={newGoalDate}
                    onChange={e => setNewGoalDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Danh sách nội dung mục tiêu</span>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    onClick={() => setGoalInputs([...goalInputs, ''])}
                  >
                    + Thêm dòng
                  </button>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {goalInputs.map((val, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{idx + 1}.</span>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Ví dụ: Hoàn thành thiết kế mạch Altium v1.0..."
                        value={val}
                        onChange={e => {
                          const newInputs = [...goalInputs];
                          newInputs[idx] = e.target.value;
                          setGoalInputs(newInputs);
                        }}
                        required
                      />
                      {goalInputs.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger"
                          style={{ padding: '10px' }}
                          onClick={() => {
                            const newInputs = goalInputs.filter((_, i) => i !== idx);
                            setGoalInputs(newInputs);
                          }}
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowGoalModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu mục tiêu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <div className="modal-overlay" onClick={() => setShowProjectModal(false)}>
          <div className="modal-body animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>Tạo Dự án mới</h3>
            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="input-label">Tên dự án</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ví dụ: Robot dò đường, Thiết bị bay IoT..."
                  value={newProject.name}
                  onChange={e => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="input-label">Mô tả dự án</label>
                <textarea
                  className="input-field"
                  rows="3"
                  placeholder="Nhập thông tin mô tả chi tiết dự án..."
                  value={newProject.description}
                  onChange={e => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowProjectModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Tạo dự án</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-body animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>Tạo Công việc & Giao việc</h3>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="input-label">Thuộc Dự án</label>
                <select
                  className="input-field"
                  value={newTask.projectId}
                  onChange={e => setNewTask(prev => ({ ...prev, projectId: e.target.value }))}
                  required
                >
                  <option value="">-- Chọn dự án --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Tên công việc</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ví dụ: Thiết kế mạch PCB v1.0"
                  value={newTask.title}
                  onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="input-label">Mô tả chi tiết</label>
                <textarea
                  className="input-field"
                  rows="3"
                  placeholder="Nhiệm vụ cần đạt, yêu cầu kỹ thuật..."
                  value={newTask.description}
                  onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="input-label">Giao cho nhân viên</label>
                <select
                  className="input-field"
                  value={newTask.assigneeId}
                  onChange={e => setNewTask(prev => ({ ...prev, assigneeId: e.target.value }))}
                  required
                >
                  <option value="">-- Chọn nhân sự --</option>
                  {usersList.map(u => <option key={u.id} value={u.id}>{u.fullName} (@{u.username})</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="input-label">Hạn hoàn thành</label>
                  <input
                    type="date"
                    className="input-field"
                    value={newTask.deadline}
                    onChange={e => setNewTask(prev => ({ ...prev, deadline: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Độ ưu tiên</label>
                  <select
                    className="input-field"
                    value={newTask.priority}
                    onChange={e => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="Low">Thấp (Low)</option>
                    <option value="Medium">Trung bình (Medium)</option>
                    <option value="High">Cao (High)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Giao việc</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal-body animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>Thêm Thành viên mới</h3>
            <form onSubmit={handleCreateMember} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="input-label">Tên đăng nhập (Username)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="nhanvien_hardware"
                  value={newMember.username}
                  onChange={e => setNewMember(prev => ({ ...prev, username: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="input-label">Mật khẩu</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={newMember.password}
                  onChange={e => setNewMember(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="input-label">Họ và tên</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Nguyễn Văn A"
                  value={newMember.fullName}
                  onChange={e => setNewMember(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="input-label">Vai trò</label>
                  <select
                    className="input-field"
                    value={newMember.role}
                    onChange={e => setNewMember(prev => ({ ...prev, role: e.target.value }))}
                  >
                    <option value="employee">Nhân viên (Employee)</option>
                    <option value="leader">Trưởng nhóm (Leader)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Phòng ban</label>
                  <select
                    className="input-field"
                    value={newMember.departmentId}
                    onChange={e => setNewMember(prev => ({ ...prev, departmentId: e.target.value }))}
                  >
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Thêm</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
