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
  Moon,
  Calendar,
  Trash2,
  Bug,
  Cpu,
  BookOpen,
  ShoppingCart,
  Boxes,
  Activity,
  Link,
  CalendarDays,
  Layers,
  Settings,
  Menu,
  X
} from 'lucide-react';

const API_BASE = `http://${window.location.hostname}:30001/api`;

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

  // New R&D Data States
  const [sprints, setSprints] = useState([]);
  const [standupsList, setStandupsList] = useState([]);
  const [assetsList, setAssetsList] = useState([]);
  const [assetLoansList, setAssetLoansList] = useState([]);
  const [procurementsList, setProcurementsList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [failureLogsList, setFailureLogsList] = useState([]);
  const [firmwareReleasesList, setFirmwareReleasesList] = useState([]);
  const [projectLinksList, setProjectLinksList] = useState([]);
  const [wikiPagesList, setWikiPagesList] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

  // Selections
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedSprintId, setSelectedSprintId] = useState('');
  const [activeDeptTab, setActiveDeptTab] = useState('1'); // Department ID filter in Sprint board

  // Filter and Form States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Form creation inputs
  const [newProject, setNewProject] = useState({ 
    name: 'Dự án Drone Khảo sát Rừng', 
    description: 'Thiết bị bay tự hành tích hợp camera quang học và cảm biến nhiệt để giám sát sớm cháy rừng v1.0', 
    status: 'Active' 
  });
  const [newTask, setNewTask] = useState({ 
    projectId: '', 
    title: 'Thiết kế sơ đồ nguyên lý khối vi điều khiển STM32', 
    description: 'Vẽ schematic cho chip STM32F4, tích hợp mạch lọc nguồn, SWD programming interface và thạch anh dao động.', 
    assigneeId: '', 
    dueDate: new Date().toISOString().split('T')[0], 
    priority: 'Medium', 
    sprintId: '', 
    departmentId: '1', 
    parentTaskId: '', 
    estimate: '8', 
    status: 'To Do' 
  });
  const [newGoalType, setNewGoalType] = useState('day');
  const [newGoalDate, setNewGoalDate] = useState(new Date().toISOString().split('T')[0]);
  const [goalInputs, setGoalInputs] = useState(['']); // Danh sách mục tiêu thêm cùng lúc
  const [newReport, setNewReport] = useState({ weekStartDate: getMonday(new Date()), recipientId: '', doneContent: '', plannedContent: '', blockers: '' });
  const [viewingReportModal, setViewingReportModal] = useState(null);
  const [reportRatingInput, setReportRatingInput] = useState(5);
  const [reportFeedbackInput, setReportFeedbackInput] = useState('');
  
  // Weekly summary filter for Admins
  const [summaryWeek, setSummaryWeek] = useState(getMonday(new Date()));
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [reportRemarks, setReportRemarks] = useState('');

  // Tab đăng nhập / đăng ký tự do
  const [isLoginTab, setIsLoginTab] = useState(true);
  
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    if (user && user.role === 'leader' && user.departmentId) {
      setActiveDeptTab(user.departmentId.toString());
    }
  }, [user]);

  const [editingUser, setEditingUser] = useState(null);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editUserPassword, setEditUserPassword] = useState('');

  const [registerFullName, setRegisterFullName] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerDepartmentId, setRegisterDepartmentId] = useState('1');
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

  // States for interactive dashboard details and project editing
  const [showProjectsDetailModal, setShowProjectsDetailModal] = useState(false);
  const [showTasksDetailModal, setShowTasksDetailModal] = useState(false);
  const [showFinishedTasksDetailModal, setShowFinishedTasksDetailModal] = useState(false);
  const [showTodayTasksDetailModal, setShowTodayTasksDetailModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  // Sprint 4: Dashboard Interactive Tasks states
  const [tempProgress, setTempProgress] = useState({});
  const [dashboardFilterProject, setDashboardFilterProject] = useState('');
  const [dashboardFilterPriority, setDashboardFilterPriority] = useState('');
  const [dashboardFilterAssignee, setDashboardFilterAssignee] = useState('');
  const [dashboardFilterStatus, setDashboardFilterStatus] = useState('');
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState('');
  const [dashboardTasksPage, setDashboardTasksPage] = useState(1);
  const [kanbanPages, setKanbanPages] = useState({ 'Backlog': 1, 'To Do': 1, 'In Progress': 1, 'Review': 1, 'Done': 1 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [telegramConfig, setTelegramConfig] = useState({ botUsername: 'pm_system_alert_bot', isConfigured: false });


  // New R&D Modals toggle
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [showEditSprintModal, setShowEditSprintModal] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [newSprint, setNewSprint] = useState({ 
    name: 'Sprint 1 - Thiết kế mạch & Nạp Bootloader', 
    goal: 'Hoàn thiện bản vẽ PCB nguyên lý và nạp thành công Bootloader qua cổng nạp SWD', 
    startDate: new Date().toISOString().split('T')[0], 
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
    status: 'Planned' 
  });
  const [editingTask, setEditingTask] = useState(null); // Task being edited
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [newAsset, setNewAsset] = useState({ 
    name: 'Máy đo dao động ký Keysight DSOX1204G', 
    serialNumber: 'MY59214782' 
  });
  const [showProcureModal, setShowProcureModal] = useState(false);
  const [newProcurement, setNewProcurement] = useState({ 
    projectId: '', 
    departmentId: '1', 
    itemName: 'IC vi điều khiển STM32F405RGT6 LQFP64', 
    url: 'https://www.mouser.vn/ProductDetail/STMicroelectronics/STM32F405RGT6', 
    quantity: '5', 
    estimatedPrice: '185000' 
  });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [newBooking, setNewBooking] = useState({ 
    equipmentName: 'Máy in 3D Bambu Lab X1C', 
    startTime: new Date().toISOString().substring(0, 16), 
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().substring(0, 16) 
  });
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [newFailure, setNewFailure] = useState({ 
    title: 'IC nguồn LM2596 bị cháy nổ khi cắm nguồn 24V đầu vào', 
    description: 'Nguyên nhân do diode Schottky ngược dòng D1 bị ngược cực tính hoặc tụ lọc ngõ vào có điện áp chịu đựng thấp (16V thay vì 35V).', 
    solution: 'Thay thế diode Schottky đúng cực, đổi tụ ngõ vào sang loại nhôm chịu áp 50V.', 
    projectId: '', 
    departmentId: '1' 
  });
  const [showFirmwareModal, setShowFirmwareModal] = useState(false);
  const [newFirmware, setNewFirmware] = useState({ 
    projectId: '', 
    version: 'v1.0.2-alpha', 
    pcbVersionCompatible: 'PCB-DRONE-V1.2', 
    changelog: 'Cập nhật bộ PID ổn định động cơ cánh quạt, sửa lỗi mất kết nối sóng RF thu phát.' 
  });
  const [showWikiModal, setShowWikiModal] = useState(false);
  const [newWiki, setNewWiki] = useState({ 
    title: 'Hướng dẫn cài đặt Keil C51 và nạp code cho vi điều khiển R&D', 
    contentMarkdown: '# Hướng dẫn cài đặt\n\n1. Tải Keil C51 từ trang chủ.\n2. Cài đặt driver CH340 cho mạch nạp USB-UART.\n3. Kết nối cổng nạp TX/RX chéo với MCU.' 
  });
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [newLink, setNewLink] = useState({ 
    projectId: '', 
    label: 'Bản vẽ CAD thiết kế vỏ Drone (Solidworks)', 
    url: 'https://github.com/mokutenvn/internal-pm-system', 
    description: 'File 3D STEP hoàn thiện của vỏ nhựa in 3D chống nước.' 
  });
  const [showInheritModal, setShowInheritModal] = useState(false);
  const [inheritForm, setInheritForm] = useState({ sourceProjectId: '', inheritBOM: true, inheritLinks: true });

  // Daily Standup Form
  const [myStandup, setMyStandup] = useState({ completedWork: '', planToday: '', blockers: '' });
  const [selectedStandupDate, setSelectedStandupDate] = useState(new Date().toISOString().split('T')[0]);

  // Auto-fetch data on load/token change
  useEffect(() => {
    if (token) {
      fetchCoreData();
    }
  }, [token]);

  useEffect(() => {
    setDashboardTasksPage(1);
  }, [dashboardFilterProject, dashboardFilterPriority, dashboardFilterAssignee, dashboardSearchQuery, dashboardFilterStatus]);

  // Fetch all necessary data based on role
  const fetchCoreData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch parallelly from 15 endpoints
      const [
        deptsRes, projRes, taskRes, goalsRes, sprintsRes,
        standupsRes, assetsRes, loansRes, procsRes, bookingsRes,
        failuresRes, releasesRes, linksRes, wikisRes, statsRes
      ] = await Promise.all([
        fetch(`${API_BASE}/departments`, { headers }),
        fetch(`${API_BASE}/projects`, { headers }),
        fetch(`${API_BASE}/tasks`, { headers }),
        fetch(`${API_BASE}/goals`, { headers }),
        fetch(`${API_BASE}/sprints`, { headers }),
        fetch(`${API_BASE}/standups`, { headers }),
        fetch(`${API_BASE}/assets`, { headers }),
        fetch(`${API_BASE}/asset-loans`, { headers }),
        fetch(`${API_BASE}/procurements`, { headers }),
        fetch(`${API_BASE}/lab-bookings`, { headers }),
        fetch(`${API_BASE}/failure-logs`, { headers }),
        fetch(`${API_BASE}/firmware-releases`, { headers }),
        fetch(`${API_BASE}/project-links`, { headers }),
        fetch(`${API_BASE}/wiki-pages`, { headers }),
        fetch(`${API_BASE}/dashboard/stats`, { headers })
      ]);

      if (deptsRes.ok) setDepartments(await deptsRes.json());
      if (projRes.ok) {
        const prjs = await projRes.json();
        setProjects(prjs);
        if (prjs.length > 0 && !selectedProjectId) {
          setSelectedProjectId(prjs[0].id.toString());
        }
      }
      if (taskRes.ok) setTasks(await taskRes.json());
      if (goalsRes.ok) setGoals(await goalsRes.json());
      if (sprintsRes.ok) setSprints(await sprintsRes.json());
      if (standupsRes.ok) setStandupsList(await standupsRes.json());
      if (assetsRes.ok) setAssetsList(await assetsRes.json());
      if (loansRes.ok) setAssetLoansList(await loansRes.json());
      if (procsRes.ok) setProcurementsList(await procsRes.json());
      if (bookingsRes.ok) setBookingsList(await bookingsRes.json());
      if (failuresRes.ok) setFailureLogsList(await failuresRes.json());
      if (releasesRes.ok) setFirmwareReleasesList(await releasesRes.json());
      if (linksRes.ok) setProjectLinksList(await linksRes.json());
      if (wikisRes.ok) setWikiPagesList(await wikisRes.json());
      if (statsRes.ok) setDashboardStats(await statsRes.json());

      // Fetch users for all logged in users (needed for display names, assignees, and task assignments)
      if (user) {
        const usersRes = await fetch(`${API_BASE}/users`, { headers });
        if (usersRes.ok) setUsersList(await usersRes.json());
      }

      // If Admin or Leader, fetch pending users and weekly summary
      if (user && (user.role === 'admin' || user.role === 'leader')) {
        const pendingRes = await fetch(`${API_BASE}/users/pending`, { headers });
        if (pendingRes.ok) setPendingUsers(await pendingRes.json());
        
        fetchWeeklySummary(summaryWeek);
      }

      // Fetch user's own reports
      const reportsRes = await fetch(`${API_BASE}/reports`, { headers });
      if (reportsRes.ok) setReports(await reportsRes.json());

      // Fetch Telegram Bot configuration
      const tgConfigRes = await fetch(`${API_BASE}/telegram/config`, { headers });
      if (tgConfigRes.ok) setTelegramConfig(await tgConfigRes.json());

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

  const handleUnlinkTelegram = async () => {
    if (!confirm("Bạn có chắc chắn muốn hủy liên kết Telegram? Bạn sẽ không nhận được thông báo cá riêng nữa.")) return;
    try {
      const res = await fetch(`${API_BASE}/users/unlink-telegram`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        alert(data.message || 'Đã hủy liên kết Telegram.');
        fetchCoreData();
      } else {
        const data = await res.json();
        alert(data.message || 'Lỗi khi hủy liên kết.');
      }
    } catch (err) {
      console.error(err);
    }
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
          fullName: registerFullName,
          departmentId: registerDepartmentId
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
      setRegisterDepartmentId('1');
      setIsLoginTab(true);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    const targetPending = pendingUsers.find(u => u.id === userId);
    const defaultDept = targetPending && targetPending.departmentId ? targetPending.departmentId.toString() : '1';
    const deptId = user.role === 'leader' ? user.departmentId.toString() : (approvalDepts[userId] || defaultDept);
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

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingProject.name,
          description: editingProject.description,
          status: editingProject.status
        })
      });
      if (res.ok) {
        setShowEditProjectModal(false);
        setEditingProject(null);
        fetchCoreData();
      } else {
        const data = await res.json();
        alert(data.message || 'Lỗi cập nhật dự án');
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
        body: JSON.stringify({
          ...newTask,
          projectId: Number(newTask.projectId || selectedProjectId),
          sprintId: newTask.sprintId ? Number(newTask.sprintId) : null,
          departmentId: Number(newTask.departmentId),
          parentTaskId: newTask.parentTaskId ? Number(newTask.parentTaskId) : null,
          estimate: Number(newTask.estimate)
        })
      });
      if (res.ok) {
        setNewTask({ projectId: '', title: '', description: '', assigneeId: '', dueDate: '', priority: 'Medium', sprintId: '', departmentId: '1', parentTaskId: '', estimate: '0', status: 'To Do' });
        setShowTaskModal(false);
        fetchCoreData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTaskFull = async (taskId, updates) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        setEditingTask(null);
        fetchCoreData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm("Bạn có chắc chắn muốn xóa task này?")) return;
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setEditingTask(null);
        fetchCoreData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!confirm("Bạn có chắc chắn muốn xóa dự án này?")) return;
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setShowProjectsDetailModal(false);
        fetchCoreData();
      } else {
        const data = await res.json();
        alert(data.message || 'Lỗi khi xóa dự án.');
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

  // Sprints
  const handleCreateSprint = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/sprints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newSprint,
          projectId: Number(selectedProjectId)
        })
      });
      if (res.ok) {
        setNewSprint({ name: '', goal: '', startDate: '', endDate: '', status: 'Planned' });
        setShowSprintModal(false);
        fetchCoreData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSprintStatus = async (sprintId, status) => {
    try {
      const res = await fetch(`${API_BASE}/sprints/${sprintId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchCoreData();
      } else {
        const data = await res.json();
        alert(data.message || 'Lỗi cập nhật trạng thái Sprint.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSprintFull = async (e) => {
    e.preventDefault();
    if (!editingSprint) return;
    try {
      const res = await fetch(`${API_BASE}/sprints/${editingSprint.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingSprint.name,
          goal: editingSprint.goal,
          startDate: editingSprint.startDate,
          endDate: editingSprint.endDate,
          status: editingSprint.status
        })
      });
      if (res.ok) {
        setShowEditSprintModal(false);
        setEditingSprint(null);
        fetchCoreData();
        alert("Cập nhật thông tin Sprint thành công!");
      } else {
        const data = await res.json();
        alert(data.message || 'Lỗi cập nhật thông tin Sprint.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSprint = async (sprintId) => {
    if (!confirm("Bạn có chắc chắn muốn xóa Sprint này?")) return;
    try {
      const res = await fetch(`${API_BASE}/sprints/${sprintId}`, {
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

  // Daily Standups
  const handleCreateStandup = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/standups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...myStandup,
          projectId: Number(selectedProjectId),
          date: new Date().toISOString().split('T')[0]
        })
      });
      if (res.ok) {
        setMyStandup({ completedWork: '', planToday: '', blockers: '' });
        fetchCoreData();
        alert("Check-in Standup hôm nay thành công!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Lab Assets
  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAsset)
      });
      if (res.ok) {
        setNewAsset({ name: '', serialNumber: '' });
        setShowAssetModal(false);
        fetchCoreData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoanAsset = async (assetId) => {
    try {
      const res = await fetch(`${API_BASE}/asset-loans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          assetId,
          loanDate: new Date().toISOString().split('T')[0]
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Đăng ký mượn thiết bị thành công! Chờ Trưởng nhóm duyệt.");
        fetchCoreData();
      } else {
        alert(data.message || "Lỗi mượn thiết bị.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveAssetLoan = async (loanId, status) => {
    try {
      const res = await fetch(`${API_BASE}/asset-loans/${loanId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchCoreData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Procurements (BOM)
  const handleCreateProcurement = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/procurements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newProcurement,
          projectId: Number(newProcurement.projectId || selectedProjectId),
          quantity: Number(newProcurement.quantity),
          estimatedPrice: Number(newProcurement.estimatedPrice)
        })
      });
      if (res.ok) {
        setNewProcurement({ projectId: '', departmentId: '1', itemName: '', url: '', quantity: '1', estimatedPrice: '0' });
        setShowProcureModal(false);
        fetchCoreData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveProcurement = async (procId, status) => {
    try {
      const res = await fetch(`${API_BASE}/procurements/${procId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchCoreData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProcurement = async (procId) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đề xuất mua sắm này?")) return;
    try {
      const res = await fetch(`${API_BASE}/procurements/${procId}`, {
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

  // Lab Bookings
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/lab-bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newBooking)
      });
      if (res.ok) {
        setNewBooking({ equipmentName: 'Máy in 3D Bambu Lab X1C', startTime: '', endTime: '' });
        setShowBookingModal(false);
        fetchCoreData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!confirm("Xóa lịch đặt chỗ này?")) return;
    try {
      const res = await fetch(`${API_BASE}/lab-bookings/${bookingId}`, {
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

  // Failure Logs (Nhật ký lỗi)
  const handleCreateFailure = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/failure-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newFailure,
          projectId: Number(newFailure.projectId || selectedProjectId),
          departmentId: Number(newFailure.departmentId)
        })
      });
      if (res.ok) {
        setNewFailure({ title: '', description: '', solution: '', projectId: '', departmentId: '1' });
        setShowFailureModal(false);
        fetchCoreData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFailure = async (failureId) => {
    if (!confirm("Xóa nhật ký lỗi này?")) return;
    try {
      const res = await fetch(`${API_BASE}/failure-logs/${failureId}`, {
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

  // Firmware Releases
  const handleCreateFirmware = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/firmware-releases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newFirmware,
          projectId: Number(newFirmware.projectId || selectedProjectId)
        })
      });
      if (res.ok) {
        setNewFirmware({ projectId: '', version: '', pcbVersionCompatible: '', changelog: '' });
        setShowFirmwareModal(false);
        fetchCoreData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Project Links
  const handleCreateLink = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/project-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newLink,
          projectId: Number(newLink.projectId || selectedProjectId)
        })
      });
      if (res.ok) {
        setNewLink({ projectId: '', label: '', url: '', description: '' });
        setShowLinkModal(false);
        fetchCoreData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLink = async (linkId) => {
    if (!confirm("Xóa liên kết tài nguyên này?")) return;
    try {
      const res = await fetch(`${API_BASE}/project-links/${linkId}`, {
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

  // Wiki Pages
  const handleCreateWiki = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/wiki-pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newWiki)
      });
      if (res.ok) {
        setNewWiki({ title: '', contentMarkdown: '' });
        setShowWikiModal(false);
        fetchCoreData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Project Inheritance
  const handleInheritProject = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/projects/${selectedProjectId}/inherit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...inheritForm,
          sourceProjectId: Number(inheritForm.sourceProjectId)
        })
      });
      if (res.ok) {
        alert("Kế thừa dữ liệu dự án thành công!");
        setShowInheritModal(false);
        fetchCoreData();
      } else {
        const data = await res.json();
        alert(data.message || "Lỗi kế thừa.");
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

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const payload = {
        fullName: editingUser.fullName,
        username: editingUser.username,
        role: editingUser.role,
        departmentId: Number(editingUser.departmentId)
      };
      if (editUserPassword) {
        payload.password = editUserPassword;
      }
      const res = await fetch(`${API_BASE}/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setEditingUser(null);
        setEditUserPassword('');
        setShowEditUserModal(false);
        fetchCoreData();
      } else {
        const data = await res.json();
        alert(data.message || 'Cập nhật tài khoản lỗi');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Bạn chắc chắn muốn xóa tài khoản này? Thao tác này không thể hoàn tác!")) return;
    try {
      const res = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchCoreData();
      } else {
        const data = await res.json();
        alert(data.message || 'Xóa tài khoản lỗi');
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
      const res = await fetch(`${API_BASE}/reports/export-doc?weekStartDate=${summaryWeek}&remarks=${encodeURIComponent(reportRemarks)}`, {
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
  const getReportRecipientOptions = () => {
    if (!usersList || usersList.length === 0) return [];
    if (user.role === 'employee') {
      return usersList.filter(u => u.role === 'leader' && u.departmentId === user.departmentId);
    }
    if (user.role === 'leader') {
      return usersList.filter(u => u.role === 'admin');
    }
    return usersList.filter(u => u.role === 'admin' || u.role === 'leader');
  };

  const handleSaveReportFeedback = async (e) => {
    e.preventDefault();
    if (!viewingReportModal) return;
    try {
      const res = await fetch(`${API_BASE}/reports/${viewingReportModal.id}/feedback`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: Number(reportRatingInput),
          feedback: reportFeedbackInput
        })
      });
      if (res.ok) {
        setViewingReportModal(null);
        fetchCoreData();
        alert("Lưu đánh giá và gửi phản hồi thành công!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const autoPopulateReport = () => {
    const monday = getMonday(new Date());
    const userDoneTasks = tasks.filter(t => t.assigneeId === user.id && (t.status === 'Done' || t.progress === 100));
    const doneText = userDoneTasks.length > 0
      ? userDoneTasks.map(t => `- [Hoàn thành] ${t.title} (${t.estimate || 0}h)`).join('\n')
      : '- Hoàn thành các nhiệm vụ nghiên cứu & phát triển chuyên môn.';

    const userUpcomingTasks = tasks.filter(t => t.assigneeId === user.id && t.status !== 'Done');
    const plannedText = userUpcomingTasks.length > 0
      ? userUpcomingTasks.map(t => `- [Triển khai] ${t.title} (Hạn: ${t.dueDate || 'Chưa đặt'})`).join('\n')
      : '';

    setNewReport(prev => ({
      ...prev,
      doneContent: doneText,
      plannedContent: plannedText
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
            <div className="login-logo">R&D Portal</div>
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
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontWeight: 800, letterSpacing: '0.05em' }} disabled={loading}>
                {loading ? 'ĐANG XÁC THỰC...' : 'ĐĂNG NHẬP'}
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
              <div style={{ marginBottom: '16px' }}>
                <label className="input-label">Nhiệm vụ / Bộ phận chuyên môn</label>
                <select
                  className="input-field"
                  value={registerDepartmentId}
                  onChange={e => setRegisterDepartmentId(e.target.value)}
                >
                  <option value="1">Hardware (Phần cứng)</option>
                  <option value="2">Firmware (Phần mềm nhúng)</option>
                  <option value="3">Sản xuất (Manufacturing)</option>
                  <option value="4">Industrial Design (Thiết kế dáng mẫu)</option>
                </select>
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
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontWeight: 800, letterSpacing: '0.05em' }} disabled={loading}>
                {loading ? 'ĐANG GỬI ĐĂNG KÝ...' : 'ĐĂNG KÝ TÀI KHOẢN'}
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
      background: var(--bg-secondary);
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
      background: var(--bg-gradient, radial-gradient(circle at 100% 0%, #1e1b4b 0%, #090d16 50%));
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
      color: var(--text-primary);
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
      align-items: flex-start;
      justify-content: center;
      z-index: 100;
      overflow-y: auto;
      padding: 20px 16px;
      -webkit-overflow-scrolling: touch;
    }
    .modal-body {
      background: var(--bg-secondary);
      border: 1px solid var(--border-glass);
      width: 100%;
      max-width: 500px;
      border-radius: var(--radius-lg);
      padding: 28px;
      box-shadow: var(--shadow-lg);
      margin: auto;
    }
    
    /* Responsive & Mobile Design */
    .mobile-header {
      display: none;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-glass);
      position: sticky;
      top: 0;
      z-index: 99;
    }
    .mobile-menu-btn {
      background: none;
      border: none;
      color: var(--text-primary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
    }
    .mobile-close-btn {
      display: none;
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 4px;
    }
    .sidebar-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      z-index: 998;
    }
    .goals-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 24px;
    }
    .dashboard-header-left h2 {
      font-size: 1.8rem;
    }
    .dashboard-header-right {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }

    @media (max-width: 1024px) {
      .app-layout {
        grid-template-columns: 1fr;
      }
      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        width: 280px;
        height: 100vh;
        z-index: 999;
        transform: translateX(-100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 10px 0 30px rgba(0, 0, 0, 0.5);
      }
      .sidebar.open {
        transform: translateX(0);
      }
      .mobile-close-btn {
        display: block;
      }
      .sidebar-overlay.show {
        display: block;
      }
      .mobile-header {
        display: flex;
      }
      .main-content {
        padding: 20px;
        max-height: none;
        overflow-y: visible;
      }
      .dashboard-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }
      .stat-card-row {
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }
    }

    @media (max-width: 768px) {
      .goals-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      .dashboard-header-left h2 {
        font-size: 1.4rem;
      }
      .dashboard-header-right {
        width: 100%;
      }
      .dashboard-header-right > * {
        flex-grow: 1;
        text-align: center;
        justify-content: center;
      }
    }

    @media (max-width: 640px) {
      .stat-card-row {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      .stat-card {
        padding: 16px;
      }
      .glass-card {
        padding: 16px !important;
      }
      .progress-bar-bg {
        width: 40px !important;
      }
    }
    
    /* Table responsive & scroll rules */
    .table-container {
      overflow-x: auto;
      width: 100%;
      margin-bottom: 16px;
      -webkit-overflow-scrolling: touch;
    }
    .table-responsive {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;
    }
    .table-projects {
      min-width: 750px;
    }
    .table-tasks {
      min-width: 850px;
    }
    .table-lab {
      min-width: 600px;
    }
    .table-procurements {
      min-width: 950px;
    }
    .table-users {
      min-width: 700px;
    }

    /* Kanban responsive scroll rules */
    .kanban-board-container {
      overflow-x: auto;
      width: 100%;
      padding-bottom: 12px;
      -webkit-overflow-scrolling: touch;
    }
    .kanban-board-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 16px;
      align-items: start;
      min-width: 1100px;
    }
    @media (max-width: 1024px) {
      .kanban-board-grid {
        min-width: 1000px;
      }
    }
  `;

  // Compute stats helper
  const getVisibleTasks = () => {
    if (!user) return [];
    if (user.role === 'admin') return tasks;
    if (user.role === 'leader') return tasks.filter(t => t.departmentId === user.departmentId);
    return tasks.filter(t => t.assigneeId === user.id);
  };
  
  const visibleTasks = getVisibleTasks();
  const activeTasks = visibleTasks.filter(t => t.status !== 'Done');
  const finishedTasks = visibleTasks.filter(t => t.status === 'Done');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = visibleTasks.filter(t => t.dueDate === todayStr);

  const getGoalsByPeriod = (period) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    return visibleTasks.filter(t => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      due.setHours(0, 0, 0, 0);
      const dueTime = due.getTime();

      const diffDays = Math.ceil((dueTime - todayTime) / (1000 * 60 * 60 * 24));
      
      if (period === 'day') {
        return diffDays === 0;
      }
      if (period === 'week') {
        return diffDays > 0 && diffDays <= 7;
      }
      if (period === 'month') {
        return diffDays > 7 && diffDays <= 30;
      }
      return false;
    });
  };

  const getRemainingDaysText = (dueDate) => {
    if (!dueDate) return { text: 'Không có hạn', class: 'badge-low' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const dueTime = due.getTime();

    const diffDays = Math.ceil((dueTime - todayTime) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { text: `Trễ ${Math.abs(diffDays)} ngày`, class: 'badge-high' };
    } else if (diffDays === 0) {
      return { text: 'Hôm nay', class: 'badge-medium' };
    } else if (diffDays <= 3) {
      return { text: `Còn ${diffDays} ngày`, class: 'badge-medium' };
    } else {
      return { text: `Còn ${diffDays} ngày`, class: 'badge-done' };
    }
  };

  const filteredDashboardTasks = visibleTasks.filter(t => {
    if (dashboardSearchQuery) {
      const q = dashboardSearchQuery.toLowerCase();
      const titleMatch = t.title && t.title.toLowerCase().includes(q);
      const descMatch = t.description && t.description.toLowerCase().includes(q);
      if (!titleMatch && !descMatch) return false;
    }
    if (dashboardFilterProject && t.projectId !== Number(dashboardFilterProject)) {
      return false;
    }
    if (dashboardFilterPriority && t.priority !== dashboardFilterPriority) {
      return false;
    }
    if (dashboardFilterAssignee && t.assigneeId !== Number(dashboardFilterAssignee)) {
      return false;
    }
    if (dashboardFilterStatus) {
      if (dashboardFilterStatus === 'Overdue') {
        const isOverdue = t.status !== 'Done' && t.dueDate && t.dueDate < todayStr;
        if (!isOverdue) return false;
      } else if (dashboardFilterStatus === 'DueSoon') {
        if (t.status === 'Done' || !t.dueDate) return false;
        const due = new Date(t.dueDate);
        due.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0 || diffDays > 3) return false;
      } else {
        if (t.status !== dashboardFilterStatus) return false;
      }
    }
    return true;
  });

  return (
    <div className="app-layout">
      <style>{layoutStyle}</style>

      {/* MOBILE HEADER */}
      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }} />
          <h3 style={{ fontSize: '1.05rem', margin: 0, letterSpacing: '0px' }}>R&D Portal</h3>
        </div>
        <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu size={24} />
        </button>
      </div>

      {/* SIDEBAR OVERLAY */}
      <div 
        className={`sidebar-overlay ${isMobileMenuOpen ? 'show' : ''}`} 
        onClick={() => setIsMobileMenuOpen(false)} 
      />

      {/* SIDEBAR NAVIGATION */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }} />
              <h3 style={{ fontSize: '1.2rem', letterSpacing: '0px', margin: 0 }}>R&D Portal</h3>
            </div>
            <button 
              className="mobile-close-btn"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <ul className="sidebar-menu">
            <li className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}>
              <LayoutDashboard size={20} />
              <span>Bảng điều khiển</span>
            </li>
            <li className={`sidebar-item ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => { setActiveTab('projects'); setIsMobileMenuOpen(false); }}>
              <FolderKanban size={20} />
              <span>Dự án & Sprints</span>
            </li>
            <li className={`sidebar-item ${activeTab === 'standup' ? 'active' : ''}`} onClick={() => { setActiveTab('standup'); setIsMobileMenuOpen(false); }}>
              <Activity size={20} />
              <span>Daily Standup</span>
            </li>
            <li className={`sidebar-item ${activeTab === 'lab' ? 'active' : ''}`} onClick={() => { setActiveTab('lab'); setIsMobileMenuOpen(false); }}>
              <Boxes size={20} />
              <span>Phòng Lab & Thiết bị</span>
            </li>
            <li className={`sidebar-item ${activeTab === 'procurements' ? 'active' : ''}`} onClick={() => { setActiveTab('procurements'); setIsMobileMenuOpen(false); }}>
              <ShoppingCart size={20} />
              <span>Yêu cầu Mua sắm</span>
            </li>
            <li className={`sidebar-item ${activeTab === 'wiki' ? 'active' : ''}`} onClick={() => { setActiveTab('wiki'); setIsMobileMenuOpen(false); }}>
              <BookOpen size={20} />
              <span>Wiki & Nhật ký lỗi</span>
            </li>
            <li className={`sidebar-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => { setActiveTab('reports'); setIsMobileMenuOpen(false); }}>
              <FileText size={20} />
              <span>Báo cáo tuần</span>
            </li>
            {(user.role === 'admin' || user.role === 'leader') && (
              <li className={`sidebar-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => { setActiveTab('admin'); setIsMobileMenuOpen(false); }}>
                <Users size={20} />
                <span>Quản trị thành viên</span>
              </li>
            )}
          </ul>
        </div>

        <div>
          <div className="user-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{user.fullName}</div>
              <button 
                onClick={toggleTheme}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'var(--text-secondary)', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  padding: '4px',
                  borderRadius: '50%',
                  transition: 'background var(--transition-fast)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
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
            <div className="dashboard-header">
              <div className="dashboard-header-left">
                <h2>Chào ngày mới, {user.fullName}!</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Hôm nay là {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="dashboard-header-right">
                <a 
                  href={telegramConfig.isConfigured ? `https://t.me/${telegramConfig.botUsername}?start=${user.id}` : '#'} 
                  target={telegramConfig.isConfigured ? "_blank" : "_self"} 
                  rel="noopener noreferrer" 
                  className="btn"
                  onClick={(e) => {
                    if (!telegramConfig.isConfigured) {
                      e.preventDefault();
                      alert("⚠️ TELEGRAM BOT CHƯA ĐƯỢC CẤU HÌNH TOKEN!\n\nHướng dẫn mở Bot Telegram:\n1. Mở app Telegram, tìm kiếm @BotFather và gõ /newbot để tạo Bot mới.\n2. Sao chép Bot Token và Username vừa tạo.\n3. Mở file 'backend/.env' và điền:\n   TELEGRAM_BOT_TOKEN=7xxx:xxx...\n   TELEGRAM_BOT_USERNAME=TênBotCủaBạn\n4. Khởi động lại backend server.");
                    }
                  }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    textDecoration: 'none', 
                    background: user.telegramChatId ? 'rgba(16, 185, 129, 0.12)' : telegramConfig.isConfigured ? 'rgba(59, 130, 246, 0.12)' : 'rgba(245, 158, 11, 0.12)', 
                    border: user.telegramChatId ? '1px solid rgba(16, 185, 129, 0.3)' : telegramConfig.isConfigured ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)', 
                    color: user.telegramChatId ? '#34d399' : telegramConfig.isConfigured ? '#60a5fa' : '#fbbf24',
                    padding: '8px 16px',
                    fontSize: '0.85rem'
                  }}
                  title={
                    user.telegramChatId 
                      ? `Đã liên kết Telegram ID: ${user.telegramChatId}` 
                      : telegramConfig.isConfigured 
                        ? `Nhấp để mở Telegram Bot (@${telegramConfig.botUsername}) và liên kết` 
                        : 'Chưa điền Token Telegram trong file backend/.env'
                  }
                >
                  <Activity size={16} />
                  <span>{user.telegramChatId ? 'Đã liên kết Telegram' : telegramConfig.isConfigured ? 'Liên kết Telegram' : 'Chưa cấu hình Token Telegram'}</span>
                </a>
                {user.telegramChatId && (
                  <button 
                    className="btn btn-danger"
                    style={{ 
                      padding: '8px 16px', 
                      fontSize: '0.85rem',
                      background: '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onClick={handleUnlinkTelegram}
                  >
                    Hủy liên kết
                  </button>
                )}
                <button className="btn btn-secondary" onClick={fetchCoreData} disabled={loading}>
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  <span>Làm mới</span>
                </button>
              </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="stat-card-row">
              <div className="glass-card stat-card" style={{ cursor: 'pointer' }} onClick={() => setShowProjectsDetailModal(true)}>
                <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '12px', borderRadius: '12px', color: 'var(--accent-primary)' }}>
                  <FolderKanban size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tổng dự án</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{projects.length}</div>
                </div>
              </div>
              <div className="glass-card stat-card" style={{ cursor: 'pointer' }} onClick={() => setShowTasksDetailModal(true)}>
                <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '12px', borderRadius: '12px', color: 'var(--status-active)' }}>
                  <Clock size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Task đang làm</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{activeTasks.length}</div>
                </div>
              </div>
              <div className="glass-card stat-card" style={{ cursor: 'pointer' }} onClick={() => setShowFinishedTasksDetailModal(true)}>
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '12px', borderRadius: '12px', color: 'var(--status-done)' }}>
                  <CheckCircle size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Task hoàn thành</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{finishedTasks.length}</div>
                </div>
              </div>
              <div className="glass-card stat-card" style={{ cursor: 'pointer' }} onClick={() => setShowTodayTasksDetailModal(true)}>
                <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '12px', borderRadius: '12px', color: 'var(--accent-secondary)' }}>
                  <Target size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mục tiêu Hôm nay</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{todayTasks.length}</div>
                </div>
              </div>
            </div>

            {/* Quick Approval Center for Managers */}
            {(user.role === 'admin' || user.role === 'leader') && (
              (() => {
                const pendingLoans = assetLoansList.filter(l => l.status === 'Pending');
                const pendingProcs = procurementsList.filter(p => p.status === 'Pending');
                const totalPendingCount = pendingUsers.length + pendingLoans.length + pendingProcs.length;

                if (totalPendingCount === 0) return null;

                return (
                  <div className="glass-card animate-fade-in" style={{ padding: '24px', marginTop: '24px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-active)', marginBottom: '16px' }}>
                      <AlertCircle size={22} />
                      Trung tâm Phê duyệt Nhanh ({totalPendingCount})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* 1. Pending User Registrations */}
                      {pendingUsers.map(u => (
                        <div key={`user-${u.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 18px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                           <div>
                             <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--accent-secondary)', fontWeight: 700 }}>Đăng ký tài khoản</span>
                             <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', marginTop: '2px' }}>{u.fullName} <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>@{u.username}</span></div>
                             <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                               {user.role === 'admin' ? (
                                 <select
                                   className="input-field"
                                   style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto', background: 'var(--bg-tertiary)' }}
                                   value={approvalDepts[u.id] || '1'}
                                   onChange={e => setApprovalDepts({ ...approvalDepts, [u.id]: e.target.value })}
                                 >
                                   {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                 </select>
                               ) : (
                                 <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginRight: '8px' }}>
                                   Bộ phận: <strong style={{ color: 'var(--text-primary)' }}>{departments.find(d => d.id === user.departmentId)?.name}</strong>
                                 </span>
                               )}
                               <select
                                 className="input-field"
                                 style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto', background: 'var(--bg-tertiary)' }}
                                 value={approvalRoles[u.id] || 'employee'}
                                 onChange={e => setApprovalRoles({ ...approvalRoles, [u.id]: e.target.value })}
                               >
                                 <option value="employee">Nhân viên</option>
                                 <option value="leader">Trưởng nhóm</option>
                                 {user.role === 'admin' && <option value="admin">Admin</option>}
                               </select>
                             </div>
                           </div>
                           <button className="btn btn-success-approve" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => handleApproveUser(u.id)}>Phê duyệt</button>
                        </div>
                      ))}

                      {/* 2. Pending Lab Asset Loans */}
                      {pendingLoans.map(loan => {
                        const ast = assetsList.find(a => a.id === loan.assetId);
                        const requester = usersList.find(u => u.id === loan.userId);
                        return (
                          <div key={`loan-${loan.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 18px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                            <div>
                              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--accent-primary)', fontWeight: 700 }}>Mượn thiết bị Lab</span>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', marginTop: '2px' }}>{requester ? requester.fullName : 'Thành viên'}</div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Thiết bị: <strong style={{ color: 'var(--text-primary)' }}>{ast ? ast.name : 'Thiết bị'}</strong> (S/N: {ast ? ast.serialNumber : 'N/A'})</div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button className="btn btn-success-approve" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => handleApproveAssetLoan(loan.id, 'Approved')}>Duyệt mượn</button>
                              <button className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => handleApproveAssetLoan(loan.id, 'Rejected')}>Từ chối</button>
                            </div>
                          </div>
                        );
                      })}

                      {/* 3. Pending Procurements */}
                      {pendingProcs.map(proc => {
                        const reqUser = usersList.find(u => u.id === proc.userId);
                        const proj = projects.find(p => p.id === proc.projectId);
                        const dept = departments.find(d => d.id === proc.departmentId);
                        return (
                          <div key={`proc-${proc.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 18px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                            <div>
                              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#10b981', fontWeight: 700 }}>Đề xuất linh kiện (BOM)</span>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', marginTop: '2px' }}>{proc.itemName}</div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                Dự án: <strong style={{ color: 'var(--text-primary)' }}>{proj ? proj.name : 'N/A'}</strong> | Phòng: <span className="dept-tag" style={{ fontSize: '0.7rem', padding: '1px 5px' }}>{dept ? dept.name : 'Chưa phân'}</span>
                              </div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Số lượng: <strong style={{ color: 'var(--text-primary)' }}>x{proc.quantity}</strong> | Tổng chi phí: <strong style={{ color: '#f59e0b' }}>{(proc.quantity * proc.estimatedPrice).toLocaleString()} đ</strong> | Yêu cầu bởi: {reqUser ? reqUser.fullName : '...'}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button className="btn btn-success-approve" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => handleApproveProcurement(proc.id, 'Approved')}>Duyệt mua</button>
                              <button className="btn btn-danger-decline" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => handleDeleteProcurement(proc.id)}>Từ chối</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            )}

            {/* Dashboard detail grid */}
            <div className="dashboard-grid">
              
              {/* Core Goals Board */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Target size={22} style={{ color: 'var(--accent-primary)' }} />
                    Mục tiêu công việc từ Hạn chót Task
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    (Tự động đồng bộ từ Lịch trình)
                  </span>
                </div>

                {visibleTasks.some(t => t.status !== 'Done' && t.dueDate && t.dueDate < todayStr) && (
                  <div style={{
                    padding: '12px 16px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '10px',
                    color: '#fca5a5',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.85rem'
                  }}>
                    <AlertTriangle size={18} style={{ color: 'var(--status-overdue)', flexShrink: 0 }} />
                    <div>
                      <strong>CẢNH BÁO TRỄ HẠN:</strong> Bạn có công việc quá hạn chưa hoàn thành! Vui lòng cập nhật hoặc xử lý gấp.
                    </div>
                  </div>
                )}

                <div className="goals-grid">
                  
                  {/* Daily Goals */}
                  <div className="goal-column">
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '2px solid rgba(99, 102, 241, 0.3)', paddingBottom: '6px', fontSize: '0.9rem', color: '#818cf8' }}>
                      <Sun size={16} />
                      MỤC TIÊU HÔM NAY ({getGoalsByPeriod('day').length})
                    </h4>
                    {getGoalsByPeriod('day').length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Không có task đến hạn hôm nay.</p>
                    ) : (
                      getGoalsByPeriod('day').map(t => {
                        const isOverdue = t.status !== 'Done' && t.dueDate && t.dueDate < todayStr;
                        const assignee = usersList.find(u => u.id === t.assigneeId);
                        return (
                          <div 
                            key={t.id} 
                            className="goal-item animate-fade-in" 
                            style={{ 
                              border: t.status === 'Done' ? '1px solid rgba(16, 185, 129, 0.4)' : isOverdue ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--border-glass)', 
                              background: t.status === 'Done' ? 'rgba(16, 185, 129, 0.04)' : isOverdue ? 'rgba(239, 68, 68, 0.06)' : 'rgba(17, 24, 39, 0.6)',
                              cursor: 'pointer' 
                            }}
                            onClick={() => setEditingTask(t)}
                          >
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>{t.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Hạn chót: {t.dueDate}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                              <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>
                                {assignee ? assignee.fullName : 'Chưa gán'}
                              </span>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: t.status === 'Done' ? 'var(--status-done)' : 'var(--accent-primary)' }}>{t.progress || 0}%</span>
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
                      MỤC TIÊU TUẦN NÀY ({getGoalsByPeriod('week').length})
                    </h4>
                    {getGoalsByPeriod('week').length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Không có task đến hạn tuần này.</p>
                    ) : (
                      getGoalsByPeriod('week').map(t => {
                        const isOverdue = t.status !== 'Done' && t.dueDate && t.dueDate < todayStr;
                        const assignee = usersList.find(u => u.id === t.assigneeId);
                        return (
                          <div 
                            key={t.id} 
                            className="goal-item animate-fade-in" 
                            style={{ 
                              border: t.status === 'Done' ? '1px solid rgba(16, 185, 129, 0.4)' : isOverdue ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--border-glass)', 
                              background: t.status === 'Done' ? 'rgba(16, 185, 129, 0.04)' : isOverdue ? 'rgba(239, 68, 68, 0.06)' : 'rgba(17, 24, 39, 0.6)',
                              cursor: 'pointer' 
                            }}
                            onClick={() => setEditingTask(t)}
                          >
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>{t.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Hạn chót: {t.dueDate}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                              <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>
                                {assignee ? assignee.fullName : 'Chưa gán'}
                              </span>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: t.status === 'Done' ? 'var(--status-done)' : 'var(--accent-primary)' }}>{t.progress || 0}%</span>
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
                      MỤC TIÊU THÁNG NÀY ({getGoalsByPeriod('month').length})
                    </h4>
                    {getGoalsByPeriod('month').length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Không có task đến hạn tháng này.</p>
                    ) : (
                      getGoalsByPeriod('month').map(t => {
                        const isOverdue = t.status !== 'Done' && t.dueDate && t.dueDate < todayStr;
                        const assignee = usersList.find(u => u.id === t.assigneeId);
                        return (
                          <div 
                            key={t.id} 
                            className="goal-item animate-fade-in" 
                            style={{ 
                              border: t.status === 'Done' ? '1px solid rgba(16, 185, 129, 0.4)' : isOverdue ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--border-glass)', 
                              background: t.status === 'Done' ? 'rgba(16, 185, 129, 0.04)' : isOverdue ? 'rgba(239, 68, 68, 0.06)' : 'rgba(17, 24, 39, 0.6)',
                              cursor: 'pointer' 
                            }}
                            onClick={() => setEditingTask(t)}
                          >
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>{t.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Hạn chót: {t.dueDate}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                              <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>
                                {assignee ? assignee.fullName : 'Chưa gán'}
                              </span>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: t.status === 'Done' ? 'var(--status-done)' : 'var(--accent-primary)' }}>{t.progress || 0}%</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              </div>

              {/* My Assigned Tasks Upgraded to Task Control Hub */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <Clock size={22} style={{ color: 'var(--status-active)' }} />
                    Trung tâm Quản lý Công việc & Hạn chót ({filteredDashboardTasks.length})
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Quyền hạn: <strong style={{ color: 'var(--accent-primary)' }}>{user.role.toUpperCase()}</strong>
                  </span>
                </div>

                {/* Filters Section */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                  marginBottom: '20px',
                  padding: '14px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-glass)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '150px', flexGrow: 2 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Tìm kiếm</label>
                    <input
                      type="text"
                      placeholder="Tìm tên hoặc mô tả..."
                      className="input-field"
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      value={dashboardSearchQuery}
                      onChange={e => setDashboardSearchQuery(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '120px', flexGrow: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Dự án</label>
                    <select
                      className="input-field"
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      value={dashboardFilterProject}
                      onChange={e => setDashboardFilterProject(e.target.value)}
                    >
                      <option value="">Tất cả Dự án</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '120px', flexGrow: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Độ ưu tiên</label>
                    <select
                      className="input-field"
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      value={dashboardFilterPriority}
                      onChange={e => setDashboardFilterPriority(e.target.value)}
                    >
                      <option value="">Tất cả</option>
                      <option value="High">Cao (High)</option>
                      <option value="Medium">Trung bình (Medium)</option>
                      <option value="Low">Thấp (Low)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '130px', flexGrow: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Trạng thái / Hạn</label>
                    <select
                      className="input-field"
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      value={dashboardFilterStatus}
                      onChange={e => setDashboardFilterStatus(e.target.value)}
                    >
                      <option value="">Tất cả</option>
                      <option value="Overdue">🚨 Trễ hạn</option>
                      <option value="DueSoon">⏳ Sắp đến hạn (≤ 3 ngày)</option>
                      <option value="Backlog">📋 Backlog</option>
                      <option value="To Do">📌 To Do</option>
                      <option value="In Progress">⚡ In Progress</option>
                      <option value="Review">🔍 Review</option>
                      <option value="Done">✅ Done</option>
                    </select>
                  </div>

                  {(user.role === 'admin' || user.role === 'leader') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '150px', flexGrow: 1 }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Người thực hiện</label>
                      <select
                        className="input-field"
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        value={dashboardFilterAssignee}
                        onChange={e => setDashboardFilterAssignee(e.target.value)}
                      >
                        <option value="">Tất cả Thành viên</option>
                        {usersList
                          .filter(u => user.role === 'admin' || u.departmentId === user.departmentId)
                          .map(u => (
                            <option key={u.id} value={u.id}>{u.fullName}</option>
                          ))
                        }
                      </select>
                    </div>
                  )}
                </div>

                {/* Tasks List with Scroll and Pagination */}
                <div>
                  {filteredDashboardTasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      Không tìm thấy công việc nào phù hợp với bộ lọc.
                    </div>
                  ) : (
                    (() => {
                      const dashboardTotalPages = Math.ceil(filteredDashboardTasks.length / 20);
                      const dashboardPageTasks = filteredDashboardTasks.slice((dashboardTasksPage - 1) * 20, dashboardTasksPage * 20);
                      return (
                        <>
                          <div style={{ maxHeight: '520px', overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {dashboardPageTasks.map(t => {
                              const proj = projects.find(p => p.id === t.projectId);
                              const assignee = usersList.find(u => u.id === t.assigneeId);
                              const dept = departments.find(d => d.id === t.departmentId);
                              const remDays = getRemainingDaysText(t.dueDate);
                              const isOverdue = t.status !== 'Done' && t.dueDate && t.dueDate < todayStr;
                              
                              const borderStyle = t.status === 'Done'
                                ? '1px solid rgba(16, 185, 129, 0.4)'
                                : isOverdue
                                  ? '1px solid rgba(239, 68, 68, 0.5)'
                                  : '1px solid var(--border-glass)';

                              const bgStyle = t.status === 'Done'
                                ? 'rgba(16, 185, 129, 0.04)'
                                : isOverdue
                                  ? 'rgba(239, 68, 68, 0.06)'
                                  : 'var(--bg-secondary)';

                              return (
                                <div key={t.id} className="goal-item animate-fade-in" style={{ border: borderStyle, background: bgStyle, padding: '18px' }}>
                                  
                                  {/* Header Line */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                      <span className="dept-tag" style={{ background: 'var(--dept-tag-bg)', color: 'var(--dept-tag-text)', fontSize: '0.75rem', padding: '3px 8px' }}>
                                        {proj ? proj.code : 'DỰ ÁN'}
                                      </span>
                                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t.title}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                      <span className={`badge badge-${t.priority.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>
                                        {t.priority}
                                      </span>
                                      <span className={`badge badge-${t.status === 'Done' ? 'done' : t.status === 'In Progress' ? 'active' : t.status === 'Review' ? 'medium' : 'low'}`} style={{ fontSize: '0.7rem' }}>
                                        {t.status}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Description */}
                                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: '12px', lineHeight: '1.4' }}>
                                    {t.description || 'Không có mô tả chi tiết.'}
                                  </p>

                                  {/* Task Metadata details */}
                                  <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                    gap: '12px',
                                    padding: '10px 0',
                                    borderTop: '1px solid var(--border-glass)',
                                    borderBottom: '1px solid var(--border-glass)',
                                    fontSize: '0.85rem'
                                  }}>
                                    {/* Assignee info */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ color: 'var(--text-secondary)' }}>Người làm:</span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{
                                          width: '24px',
                                          height: '24px',
                                          borderRadius: '50%',
                                          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '0.75rem',
                                          fontWeight: 'bold',
                                          color: '#fff'
                                        }}>
                                          {assignee ? assignee.fullName.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{assignee ? assignee.fullName : 'Chưa gán'}</span>
                                      </div>
                                    </div>

                                    {/* Deadline info */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ color: 'var(--text-secondary)' }}>Hạn chót:</span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.dueDate || 'Không hạn'}</span>
                                        <span className={`badge ${remDays.class}`} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                                          {remDays.text}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Department info */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ color: 'var(--text-secondary)' }}>Bộ phận:</span>
                                      <span className="dept-tag" style={{ fontSize: '0.75rem', padding: '2px 6px' }}>{dept ? dept.name : 'Chưa phân'}</span>
                                    </div>
                                  </div>

                                  {/* Progress Section */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: '100px' }}>Tiến độ: <strong>{(tempProgress[t.id] !== undefined ? tempProgress[t.id] : (t.progress || 0))}%</strong></span>
                                    <input
                                      type="range"
                                      min="0"
                                      max="100"
                                      value={tempProgress[t.id] !== undefined ? tempProgress[t.id] : (t.progress || 0)}
                                      onChange={e => setTempProgress({ ...tempProgress, [t.id]: Number(e.target.value) })}
                                      onMouseUp={() => handleUpdateTaskProgress(t.id, tempProgress[t.id])}
                                      onTouchEnd={() => handleUpdateTaskProgress(t.id, tempProgress[t.id])}
                                      style={{ flexGrow: 1, accentColor: 'var(--status-done)', cursor: 'pointer' }}
                                    />
                                  </div>

                                  {/* Action Buttons Line */}
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '8px', marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '10px' }}>
                                    {t.status !== 'Done' && (
                                      <button
                                        className="btn btn-success-approve"
                                        style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        onClick={() => handleUpdateTaskProgress(t.id, 100)}
                                      >
                                        <CheckCircle size={14} />
                                        <span>Hoàn thành nhanh</span>
                                      </button>
                                    )}
                                    {t.status === 'Done' && (
                                      <button
                                        className="btn btn-secondary"
                                        style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        onClick={() => handleUpdateTaskProgress(t.id, 0)}
                                      >
                                        <RefreshCw size={14} />
                                        <span>Thu hồi hoàn thành</span>
                                      </button>
                                    )}
                                    <button
                                      className="btn btn-secondary"
                                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                      onClick={() => setEditingTask(t)}
                                    >
                                      Sửa
                                    </button>
                                    {(user.role === 'admin' || user.role === 'leader' || t.createdBy === user.id) && (
                                      <button
                                        className="btn btn-danger"
                                        style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#ef4444' }}
                                        onClick={() => handleDeleteTask(t.id)}
                                      >
                                        Xóa
                                      </button>
                                    )}
                                  </div>

                                </div>
                              );
                            })}
                          </div>

                          {dashboardTotalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                disabled={dashboardTasksPage === 1}
                                onClick={() => setDashboardTasksPage(prev => Math.max(prev - 1, 1))}
                              >
                                Trước
                              </button>
                              {Array.from({ length: dashboardTotalPages }).map((_, idx) => (
                                <button
                                  key={idx}
                                  className={`btn ${dashboardTasksPage === idx + 1 ? 'btn-primary' : 'btn-secondary'}`}
                                  style={{ padding: '6px 12px', fontSize: '0.8rem', minWidth: '32px' }}
                                  onClick={() => setDashboardTasksPage(idx + 1)}
                                >
                                  {idx + 1}
                                </button>
                              ))}
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                disabled={dashboardTasksPage === dashboardTotalPages}
                                onClick={() => setDashboardTasksPage(prev => Math.min(prev + 1, dashboardTotalPages))}
                              >
                                Sau
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()
                  )}
                </div>
              </div>

            </div>

            {/* Team Goals Monitor for Admin/Leader */}
            {(user.role === 'admin' || user.role === 'leader') && (
              <div className="glass-card animate-fade-in" style={{ padding: '24px', marginTop: '24px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Users size={22} style={{ color: 'var(--accent-secondary)' }} />
                  Giám sát Mục tiêu Đội ngũ R&D
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  Xem và giám sát mục tiêu công việc của các kỹ sư cấp dưới. Hệ thống tự động cảnh báo các kỹ sư có mục tiêu trễ hạn.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {usersList.filter(u => u.id !== user.id && (user.role === 'admin' || u.departmentId === user.departmentId)).map(member => {
                    const memberGoals = goals.filter(g => g.userId === member.id);
                    const overdueGoals = memberGoals.filter(g => g.status === 'Overdue');
                    const deptName = departments.find(d => d.id === member.departmentId)?.name || 'Khác';
                    
                    return (
                      <div key={member.id} style={{
                        padding: '16px',
                        background: 'rgba(255,255,255,0.02)',
                        border: overdueGoals.length > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-glass)',
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {member.fullName} 
                            <span className="dept-tag">{deptName}</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>@{member.username}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Tổng mục tiêu: {memberGoals.length} | Hoàn thành: {memberGoals.filter(g => g.status === 'Completed').length} 
                            {overdueGoals.length > 0 && (
                              <span style={{ color: 'var(--status-overdue)', marginLeft: '8px', fontWeight: 'bold' }}>
                                ⚠️ {overdueGoals.length} Trễ hạn!
                              </span>
                            )}
                          </div>
                        </div>

                        {/* List mini goals */}
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', maxWidth: '60%' }}>
                          {memberGoals.map(g => (
                            <div key={g.id} style={{
                              padding: '6px 10px',
                              background: g.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : g.status === 'Overdue' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.04)',
                              border: g.status === 'Completed' ? '1px solid rgba(16, 185, 129, 0.2)' : g.status === 'Overdue' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(255,255,255,0.06)',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              whiteSpace: 'nowrap',
                              color: g.status === 'Completed' ? 'var(--status-done)' : g.status === 'Overdue' ? '#fca5a5' : 'var(--text-secondary)'
                            }}>
                              {g.content.length > 25 ? g.content.substring(0, 25) + '...' : g.content} ({g.progress}%)
                            </div>
                          ))}
                          {memberGoals.length === 0 && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Chưa đặt mục tiêu nào.</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* 2. PROJECTS & TASKS TAB */}
        {activeTab === 'projects' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2>Bảng công việc Kanban & Sprints</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Chọn dự án và quản lý quy trình phát triển sản phẩm Agile.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {(user.role === 'admin' || user.role === 'leader') && (
                  <button className="btn btn-secondary" onClick={() => setShowProjectModal(true)}>
                    <Plus size={16} />
                    Thêm Dự án
                  </button>
                )}
                <button className="btn btn-secondary" onClick={() => setShowSprintModal(true)}>
                  <Plus size={16} />
                  Thêm Sprint
                </button>
                <button className="btn btn-secondary" onClick={() => setShowInheritModal(true)}>
                  <Layers size={16} />
                  Kế thừa dự án
                </button>
                <button className="btn btn-primary" onClick={() => {
                  setNewTask(prev => ({
                    ...prev,
                    projectId: selectedProjectId || prev.projectId,
                    sprintId: selectedSprintId || '',
                    departmentId: user.departmentId ? user.departmentId.toString() : '1'
                  }));
                  setShowTaskModal(true);
                }}>
                  <Plus size={16} />
                  Thêm Task
                </button>
              </div>
            </div>

            {/* Project & Sprint Control Bar */}
            <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FolderKanban size={24} style={{ color: 'var(--accent-primary)' }} />
                  <div>
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>ĐANG CHỌN DỰ ÁN</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                      <select
                        className="input-field"
                        style={{ padding: '6px 14px', fontSize: '1rem', fontWeight: 700, minWidth: '260px' }}
                        value={selectedProjectId}
                        onChange={e => {
                          setSelectedProjectId(e.target.value);
                          setSelectedSprintId('');
                        }}
                      >
                        {projects.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                      </select>
                      {(user.role === 'admin' || user.role === 'leader') && selectedProjectId && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={() => {
                            const projToEdit = projects.find(p => p.id === Number(selectedProjectId));
                            if (projToEdit) {
                              setEditingProject(projToEdit);
                              setShowEditProjectModal(true);
                            }
                          }}
                        >
                          Sửa thông tin
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Project Stats Quick Badges */}
                {(() => {
                  const currentProj = projects.find(p => p.id === Number(selectedProjectId));
                  const projSprints = sprints.filter(s => s.projectId === Number(selectedProjectId));
                  const projTasks = tasks.filter(t => t.projectId === Number(selectedProjectId));
                  return (
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="badge badge-low" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                        Trạng thái: <strong>{currentProj ? currentProj.status : 'Active'}</strong>
                      </span>
                      <span className="badge badge-medium" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                        Sprints: <strong>{projSprints.length}</strong>
                      </span>
                      <span className="badge badge-done" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                        Tổng Tasks: <strong>{projTasks.length}</strong>
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Sprints Interactive Cards / Roadmap Strip */}
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-secondary)', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={16} />
                    DANH SÁCH SPRINTS THUỘC DỰ ÁN
                  </div>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '4px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }} 
                    onClick={() => setShowSprintModal(true)}
                  >
                    <Plus size={14} />
                    Tạo Sprint mới
                  </button>
                </div>

                {/* Sprints Cards list */}
                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', WebkitOverflowScrolling: 'touch' }}>
                  {/* Backlog / All option card */}
                  <div
                    onClick={() => setSelectedSprintId('')}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: selectedSprintId === '' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                      border: selectedSprintId === '' ? '2px solid var(--accent-primary)' : '1px solid var(--border-glass)',
                      cursor: 'pointer',
                      minWidth: '180px',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justify: 'space-between'
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: selectedSprintId === '' ? '#fff' : 'var(--text-secondary)' }}>
                      📂 Tất cả / Backlog
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      {tasks.filter(t => t.projectId === Number(selectedProjectId) && !t.sprintId).length} Tasks chưa gán Sprint
                    </div>
                  </div>

                  {/* Individual Sprint Cards */}
                  {sprints.filter(s => s.projectId === Number(selectedProjectId)).map(s => {
                    const isSelected = selectedSprintId === s.id.toString();
                    const sprintTasks = tasks.filter(t => t.projectId === Number(selectedProjectId) && t.sprintId === s.id);
                    const completedTasks = sprintTasks.filter(t => t.status === 'Done');
                    const progressPct = sprintTasks.length > 0 ? Math.round((completedTasks.length / sprintTasks.length) * 100) : 0;
                    
                    let statusBadgeClass = 'badge-low';
                    let statusLabel = '📋 Kế hoạch';
                    if (s.status === 'Active') {
                      statusBadgeClass = 'badge-done';
                      statusLabel = '🚀 Đang chạy';
                    } else if (s.status === 'Completed') {
                      statusBadgeClass = 'badge-medium';
                      statusLabel = '✔️ Hoàn thành';
                    }

                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelectedSprintId(s.id.toString())}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '12px',
                          background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                          border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-glass)',
                          cursor: 'pointer',
                          minWidth: '240px',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className={`badge ${statusBadgeClass}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{statusLabel}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{sprintTasks.length} Tasks ({progressPct}%)</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isSelected ? '#fff' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          📅 {s.startDate} ➔ {s.endDate}
                        </div>
                      </div>
                    );
                  })}

                  {sprints.filter(s => s.projectId === Number(selectedProjectId)).length === 0 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '10px', fontStyle: 'italic' }}>
                      Chưa có Sprint nào cho dự án này. Nhấp "+ Tạo Sprint mới" để bắt đầu.
                    </div>
                  )}
                </div>
              </div>

              {/* Active / Selected Sprint Banner Details */}
              {selectedSprintId && (() => {
                const activeSprint = sprints.find(s => s.id === Number(selectedSprintId));
                if (!activeSprint) return null;
                return (
                  <div style={{ marginTop: '16px', background: 'rgba(0,0,0,0.2)', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Target size={16} style={{ color: 'var(--accent-primary)' }} />
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Mục tiêu {activeSprint.name}:</strong>
                        <span className={`badge ${activeSprint.status === 'Active' ? 'badge-done' : activeSprint.status === 'Completed' ? 'badge-medium' : 'badge-low'}`} style={{ fontSize: '0.7rem' }}>
                          {activeSprint.status}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {activeSprint.goal || 'Chưa có thông tin mục tiêu.'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => {
                          setEditingSprint({ ...activeSprint });
                          setShowEditSprintModal(true);
                        }}
                      >
                        Sửa thông tin Sprint
                      </button>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Trạng thái:</span>
                        <select
                          className="input-field"
                          style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }}
                          value={activeSprint.status || 'Planned'}
                          onChange={e => handleUpdateSprintStatus(activeSprint.id, e.target.value)}
                        >
                          <option value="Planned">📋 Kế hoạch</option>
                          <option value="Active">🚀 Đang chạy</option>
                          <option value="Completed">✔️ Hoàn thành</option>
                        </select>
                      </div>

                      {(user.role === 'admin' || user.role === 'leader') && (
                        <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#ef4444' }} onClick={() => handleDeleteSprint(activeSprint.id)}>
                          Xóa Sprint
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Department filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
              {departments
                .filter(d => user.role === 'admin' || d.id === user.departmentId)
                .map(d => (
                  <button
                    key={d.id}
                    className={`btn ${activeDeptTab === d.id.toString() ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    onClick={() => setActiveDeptTab(d.id.toString())}
                  >
                    {d.name}
                  </button>
                ))}
            </div>

            {/* Kanban Board Grid */}
            <div className="kanban-board-container">
              <div className="kanban-board-grid">
              {['Backlog', 'To Do', 'In Progress', 'Review', 'Done'].map(colName => {
                // Filter tasks for this column
                const colTasks = tasks.filter(t => {
                  if (t.projectId !== Number(selectedProjectId)) return false;
                  if (t.departmentId !== Number(activeDeptTab)) return false;
                  
                  // Backlog column shows: tasks with status 'Backlog', OR tasks with no sprintId when 'Tất cả / Backlog' is selected
                  if (colName === 'Backlog') {
                    return t.status === 'Backlog' || (!t.sprintId && !selectedSprintId);
                  }
                  
                  // Filter by selected sprint (if any)
                  if (selectedSprintId && t.sprintId !== Number(selectedSprintId)) return false;
                  
                  return t.status === colName;
                });

                return (
                  <div key={colName} className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', minHeight: '500px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{colName.toUpperCase()}</h4>
                      <span className="badge badge-low" style={{ fontSize: '0.75rem' }}>{colTasks.length}</span>
                    </div>

                    {(() => {
                      const colPage = kanbanPages[colName] || 1;
                      const totalPages = Math.ceil(colTasks.length / 20);
                      const pageTasks = colTasks.slice((colPage - 1) * 20, colPage * 20);

                      return (
                        <>
                          <div style={{ maxHeight: '480px', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {pageTasks.map(t => {
                              const assignee = usersList.find(u => u.id === t.assigneeId);
                              return (
                                <div
                                  key={t.id}
                                  className="goal-item animate-fade-in"
                                  style={{
                                    background: 'var(--bg-secondary)',
                                    border: t.priority === 'High' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-glass)',
                                    padding: '12px',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => setEditingTask(t)}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                    <span className={`badge badge-${t.priority.toLowerCase()}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{t.priority}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.estimate || 0}h</span>
                                  </div>
                                  
                                  <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>{t.title}</div>
                                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', lineClamp: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                    {t.description}
                                  </p>

                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-glass)', paddingTop: '6px' }}>
                                    <span>@{assignee ? assignee.fullName : 'Chưa gán'}</span>
                                    <span>Hạn: {t.dueDate || 'Không'}</span>
                                  </div>

                                  {/* Dropdown status update */}
                                  <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                                    <select
                                      className="input-field"
                                      style={{ padding: '2px 4px', fontSize: '0.7rem', background: 'var(--bg-tertiary)', border: 'none' }}
                                      value={t.status}
                                      onChange={e => handleUpdateTaskFull(t.id, { status: e.target.value })}
                                    >
                                      <option value="Backlog">Backlog</option>
                                      <option value="To Do">To Do</option>
                                      <option value="In Progress">In Progress</option>
                                      <option value="Review">Review</option>
                                      <option value="Done">Done</option>
                                    </select>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-glass)', flexWrap: 'wrap' }}>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '3px 6px', fontSize: '0.7rem' }}
                                disabled={colPage === 1}
                                onClick={() => setKanbanPages({ ...kanbanPages, [colName]: Math.max(colPage - 1, 1) })}
                              >
                                &laquo;
                              </button>
                              {Array.from({ length: totalPages }).map((_, idx) => (
                                <button
                                  key={idx}
                                  className={`btn ${colPage === idx + 1 ? 'btn-primary' : 'btn-secondary'}`}
                                  style={{ padding: '3px 6px', fontSize: '0.7rem', minWidth: '22px' }}
                                  onClick={() => setKanbanPages({ ...kanbanPages, [colName]: idx + 1 })}
                                >
                                  {idx + 1}
                                </button>
                              ))}
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '3px 6px', fontSize: '0.7rem' }}
                                disabled={colPage === totalPages}
                                onClick={() => setKanbanPages({ ...kanbanPages, [colName]: Math.min(colPage + 1, totalPages) })}
                              >
                                &raquo;
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

        {/* 3. REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2>Hệ thống Báo cáo tuần & Quản lý Tiến độ</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Nộp báo cáo cá nhân, phân quyền người nhận và theo dõi tiến độ nhân sự R&D.</p>
              </div>
            </div>

            <div className="dashboard-grid">
              
              {/* Employee / Leader report submit form */}
              <div className="glass-card" style={{ padding: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                  <h3>📋 Nộp Báo cáo Tuần</h3>
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={autoPopulateReport}>
                    <Sliders size={14} />
                    Tự động lấy Tasks từ Kanban
                  </button>
                </div>

                <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                      <label className="input-label">Gửi báo cáo đến (Người nhận)</label>
                      <select
                        className="input-field"
                        value={newReport.recipientId}
                        onChange={e => setNewReport(prev => ({ ...prev, recipientId: e.target.value }))}
                        required
                      >
                        <option value="">-- Chọn Người nhận báo cáo --</option>
                        {getReportRecipientOptions().map(u => (
                          <option key={u.id} value={u.id}>
                            {u.fullName} ({u.role === 'admin' ? 'Ban Quản Trị' : departments.find(d => d.id === u.departmentId)?.name || 'Trưởng nhóm'})
                          </option>
                        ))}
                      </select>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {user.role === 'employee' ? '🔒 Nhân viên chỉ gửi cho Trưởng nhóm cùng bộ phận' : user.role === 'leader' ? '🔒 Trưởng nhóm gửi báo cáo lên Ban Quản Trị (Admin)' : 'Gửi tới Quản trị viên / Trưởng nhóm'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="input-label">Công việc đã hoàn thành (Trong tuần này) <span style={{ color: '#ef4444' }}>*</span></label>
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
                    <label className="input-label">
                      Dự kiến công việc sẽ triển khai trong tuần sau <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Không bắt buộc điền)</span>
                    </label>
                    <textarea
                      className="input-field"
                      rows="3"
                      placeholder="Nêu chi tiết các đầu việc dự kiến triển khai trong tuần tới (nếu có)..."
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

                  <button type="submit" className="btn btn-primary btn-important-pulse" style={{ alignSelf: 'flex-start', padding: '10px 24px' }}>
                    🚀 Gửi báo cáo tuần
                  </button>
                </form>
              </div>

              {/* Admin/Leader Weekly Reports & Quick Synthesis Panel */}
              {(user.role === 'admin' || user.role === 'leader') && (
                <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TrendingUp size={22} style={{ color: 'var(--accent-secondary)' }} />
                      Quản lý & Tổng hợp Báo cáo Nhân sự
                    </h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="date"
                        className="input-field"
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        value={summaryWeek}
                        onChange={e => setSummaryWeek(e.target.value)}
                      />
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => fetchWeeklySummary(summaryWeek)}>Xem tổng hợp AI</button>
                      {weeklySummary && (
                        <button className="btn btn-primary" onClick={handleExportDoc} style={{ padding: '6px 12px', fontSize: '0.85rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                          Xuất Word
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Task Status Overview for Selected Week */}
                  {(() => {
                    const monday = summaryWeek;
                    const sunday = new Date(new Date(monday).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    const weekTasks = tasks.filter(t => {
                      if (!t.dueDate) return true;
                      return t.dueDate >= monday && t.dueDate <= sunday;
                    });
                    const inProg = weekTasks.filter(t => t.status === 'In Progress');
                    const overdue = weekTasks.filter(t => t.status !== 'Done' && t.dueDate && t.dueDate < todayStr);
                    const done = weekTasks.filter(t => t.status === 'Done');

                    return (
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.2)' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle size={16} />
                          TỔNG HỢP NHANH CÔNG VIỆC TRONG TUẦN ({monday} ➔ {sunday})
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                          <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.75rem', color: '#93c5fd' }}>⚙️ Đang thực hiện</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#3b82f6' }}>{inProg.length} Tasks</div>
                          </div>
                          <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.75rem', color: '#fca5a5' }}>⚠️ Quá hạn / Trễ</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ef4444' }}>{overdue.length} Tasks</div>
                          </div>
                          <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.75rem', color: '#6ee7b7' }}>✅ Đã hoàn thành</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>{done.length} Tasks</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* List of Received Reports for Selected Week */}
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      DANH SÁCH BÁO CÁO CỦA NHÂN VIÊN GỬI ĐẾN ({(reports || []).filter(r => r.weekStartDate === summaryWeek).length})
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                      {(reports || []).filter(r => r.weekStartDate === summaryWeek).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                          Chưa có nhân viên nào gửi báo cáo cho tuần này ({summaryWeek}).
                        </div>
                      ) : (
                        (reports || []).filter(r => r.weekStartDate === summaryWeek).map(rep => (
                          <div
                            key={rep.id}
                            style={{
                              padding: '14px 16px',
                              borderRadius: '10px',
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid var(--border-glass)',
                              display: 'flex',
                              justify: 'space-between',
                              alignItems: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onClick={() => {
                              setViewingReportModal(rep);
                              setReportRatingInput(rep.rating || 5);
                              setReportFeedbackInput(rep.feedback || '');
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{rep.senderName}</strong>
                                <span className="dept-tag" style={{ fontSize: '0.65rem' }}>{rep.departmentName}</span>
                                {rep.rating && (
                                  <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700 }}>
                                    {'★'.repeat(rep.rating)} ({rep.rating}/5)
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {rep.doneContent}
                              </div>
                            </div>

                            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                              Xem & Đánh giá
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        )}

        {/* 2.1. STANDUP TAB */}
        {activeTab === 'standup' && (
          <div className="animate-fade-in">
            <h2>Daily Standup Check-in</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Báo cáo công việc nhanh hàng ngày và theo dõi tiến độ của cả nhóm R&D.</p>
            
            <div className="dashboard-grid" style={{ marginTop: '24px' }}>
              {/* Form checkin */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '20px' }}>Check-in hôm nay</h3>
                <form onSubmit={handleCreateStandup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="input-label">Dự án hiện tại</label>
                    <select className="input-field" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Việc đã hoàn thành hôm qua</label>
                    <textarea className="input-field" style={{ height: '80px', resize: 'vertical' }} placeholder="Layout xong nguồn, test mạch chạy ổn..." value={myStandup.completedWork} onChange={e => setMyStandup({ ...myStandup, completedWork: e.target.value })} required />
                  </div>
                  <div>
                    <label className="input-label">Kế hoạch công việc hôm nay</label>
                    <textarea className="input-field" style={{ height: '80px', resize: 'vertical' }} placeholder="Đi dây đường bus tín hiệu vi điều khiển..." value={myStandup.planToday} onChange={e => setMyStandup({ ...myStandup, planToday: e.target.value })} required />
                  </div>
                  <div>
                    <label className="input-label">Khó khăn / Vướng mắc (nếu có)</label>
                    <input type="text" className="input-field" placeholder="Mỏ hàn bị hỏng, linh kiện IC nguồn về chậm..." value={myStandup.blockers} onChange={e => setMyStandup({ ...myStandup, blockers: e.target.value })} />
                  </div>
                  <button type="submit" className="btn btn-primary btn-important-pulse" style={{ padding: '12px' }}>Gửi Check-in</button>
                </form>
              </div>

              {/* Dòng thời gian standup */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3>Tiến độ cả đội</h3>
                  <input type="date" className="input-field" style={{ width: '160px', padding: '6px 12px' }} value={selectedStandupDate} onChange={e => setSelectedStandupDate(e.target.value)} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '450px', overflowY: 'auto' }}>
                  {standupsList.filter(s => s.date === selectedStandupDate && s.projectId === Number(selectedProjectId)).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>Chưa có ai check-in cho ngày này.</div>
                  ) : (
                    standupsList.filter(s => s.date === selectedStandupDate && s.projectId === Number(selectedProjectId)).map(s => {
                      const member = usersList.find(u => u.id === s.userId);
                      const deptName = departments.find(d => d.id === member?.departmentId)?.name || 'Chưa phân phòng';
                      return (
                        <div key={s.id} style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 700 }}>{member ? member.fullName : 'Thành viên'} <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>({deptName})</span></span>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <div style={{ marginBottom: '4px' }}>📌 <strong>Đã làm:</strong> {s.completedWork}</div>
                            <div style={{ marginBottom: '4px' }}>🚀 <strong>Kế hoạch:</strong> {s.planToday}</div>
                            {s.blockers && s.blockers !== 'Không có' && (
                              <div style={{ color: 'var(--status-overdue)', fontWeight: 600 }}>⚠️ <strong>Nghẽn:</strong> {s.blockers}</div>
                            )}
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

        {/* 2.2. LAB ASSETS & BOOKING TAB */}
        {activeTab === 'lab' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2>Thiết bị Lab & Đặt lịch mượn</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Đăng ký mượn máy đo, mỏ nạp và đặt khung giờ in 3D / đo EMC.</p>
              </div>
              {(user.role === 'admin' || user.role === 'leader') && (
                <button className="btn btn-primary" onClick={() => setShowAssetModal(true)}>
                  <Plus size={16} />
                  Thêm thiết bị Lab
                </button>
              )}
            </div>

            <div className="dashboard-grid">
              {/* Assets list */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '16px' }}>Kho thiết bị Lab</h3>
                <div className="table-container">
                  <table className="table-responsive table-lab">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '10px' }}>Tên thiết bị</th>
                      <th style={{ padding: '10px' }}>Serial Number</th>
                      <th style={{ padding: '10px' }}>Trạng thái</th>
                      <th style={{ padding: '10px' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetsList.map(asset => {
                      const activeLoan = assetLoansList.find(al => al.assetId === asset.id && al.status !== 'Returned');
                      const borrower = activeLoan ? usersList.find(u => u.id === activeLoan.userId) : null;
                      return (
                        <tr key={asset.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '12px 10px', fontWeight: 600 }}>{asset.name}</td>
                          <td style={{ padding: '12px 10px' }}>{asset.serialNumber}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span className={`badge badge-${asset.status === 'Available' ? 'done' : 'active'}`}>
                              {asset.status === 'Available' ? 'Sẵn sàng' : `Bận (Mượn bởi ${borrower ? borrower.fullName : '...' })`}
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            {asset.status === 'Available' ? (
                              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleLoanAsset(asset.id)}>Mượn</button>
                            ) : (
                              activeLoan && (user.role === 'admin' || user.role === 'leader' || activeLoan.userId === user.id) && (
                                <button className="btn btn-success-approve" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleApproveAssetLoan(activeLoan.id, 'Returned')}>Trả thiết bị</button>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

                {/* Pending Loans (for Leader/Admin review) */}
                {(user.role === 'admin' || user.role === 'leader') && assetLoansList.filter(l => l.status === 'Pending').length > 0 && (
                  <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                    <h4 style={{ color: 'var(--status-active)', marginBottom: '12px' }}>Đơn mượn chờ duyệt ({assetLoansList.filter(l => l.status === 'Pending').length})</h4>
                    {assetLoansList.filter(l => l.status === 'Pending').map(loan => {
                      const ast = assetsList.find(a => a.id === loan.assetId);
                      const requester = usersList.find(u => u.id === loan.userId);
                      return (
                        <div key={loan.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', marginBottom: '10px' }}>
                          <div>
                            <strong>{requester ? requester.fullName : 'Thành viên'}</strong> yêu cầu mượn <strong>{ast ? ast.name : 'Thiết bị'}</strong>
                          </div>
                          <button className="btn btn-success-approve" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleApproveAssetLoan(loan.id, 'Approved')}>Duyệt mượn</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Lab Booking Timeline */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3>Lịch đặt chỗ thiết bị</h3>
                  <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setShowBookingModal(true)}>
                    <Plus size={14} />
                    Đặt chỗ
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                  {bookingsList.map(bk => {
                    const booker = usersList.find(u => u.id === bk.userId);
                    const isOwner = bk.userId === user.id || user.role === 'admin' || user.role === 'leader';
                    return (
                      <div key={bk.id} className="goal-item" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.9rem' }}>{bk.equipmentName}</strong>
                          {isOwner && (
                            <button className="btn" style={{ padding: '2px', background: 'transparent', color: 'var(--text-muted)' }} onClick={() => handleDeleteBooking(bk.id)}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          <div>👤 Người đặt: {booker ? booker.fullName : 'Thành viên'}</div>
                          <div>⏰ Bắt đầu: {new Date(bk.startTime).toLocaleString('vi-VN')}</div>
                          <div>⏰ Kết thúc: {new Date(bk.endTime).toLocaleString('vi-VN')}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2.3. PROCUREMENT TAB */}
        {activeTab === 'procurements' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2>Yêu cầu Mua sắm Linh kiện (BOM Procurement)</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Quản lý việc đề xuất linh kiện mẫu từ Digikey/Mouser phục vụ R&D.</p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowProcureModal(true)}>
                <Plus size={16} />
                Đề xuất Linh kiện
              </button>
            </div>

            <div className="glass-card" style={{ padding: '24px' }}>
              <div className="table-container">
                <table className="table-responsive table-procurements">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <th style={{ padding: '12px' }}>Tên linh kiện</th>
                    <th style={{ padding: '12px' }}>Dự án / Phòng</th>
                    <th style={{ padding: '12px' }}>Số lượng</th>
                    <th style={{ padding: '12px' }}>Đơn giá ước tính</th>
                    <th style={{ padding: '12px' }}>Tổng chi phí</th>
                    <th style={{ padding: '12px' }}>Người yêu cầu</th>
                    <th style={{ padding: '12px' }}>Trạng thái</th>
                    <th style={{ padding: '12px' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {procurementsList.map(proc => {
                    const reqUser = usersList.find(u => u.id === proc.userId);
                    const proj = projects.find(p => p.id === proc.projectId);
                    const dept = departments.find(d => d.id === proc.departmentId);
                    return (
                      <tr key={proc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '14px 12px' }}>
                          <div style={{ fontWeight: 600 }}>{proc.itemName}</div>
                          {proc.url && <a href={proc.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', textDecoration: 'underline' }}>Link linh kiện</a>}
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          <div>{proj ? proj.code : 'N/A'}</div>
                          <span className="dept-tag" style={{ fontSize: '0.7rem' }}>{dept ? dept.name : 'Chưa phân'}</span>
                        </td>
                        <td style={{ padding: '14px 12px' }}>x{proc.quantity}</td>
                        <td style={{ padding: '14px 12px' }}>{proc.estimatedPrice.toLocaleString()} đ</td>
                        <td style={{ padding: '14px 12px', fontWeight: 700 }}>{(proc.quantity * proc.estimatedPrice).toLocaleString()} đ</td>
                        <td style={{ padding: '14px 12px' }}>{reqUser ? reqUser.fullName : '...'}</td>
                        <td style={{ padding: '14px 12px' }}>
                          <span className={`badge badge-${proc.status === 'Approved' || proc.status === 'Received' ? 'done' : proc.status === 'Pending' ? 'active' : 'overdue'}`}>
                            {proc.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {proc.status === 'Pending' && (user.role === 'admin' || user.role === 'leader') && (
                              <>
                                <button className="btn btn-success-approve" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleApproveProcurement(proc.id, 'Approved')}>Duyệt</button>
                                <button className="btn btn-danger-decline" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleDeleteProcurement(proc.id)}>Từ chối</button>
                              </>
                            )}
                            {proc.status === 'Approved' && (user.role === 'admin' || user.role === 'leader') && (
                              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleApproveProcurement(proc.id, 'Ordered')}>Đã Đặt Hàng</button>
                            )}
                            {proc.status === 'Ordered' && (proc.userId === user.id || user.role === 'admin' || user.role === 'leader') && (
                              <button className="btn btn-success-approve" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleApproveProcurement(proc.id, 'Received')}>Đã Về Kho</button>
                            )}
                            {(proc.userId === user.id || user.role === 'admin') && (
                              <button className="btn" style={{ padding: '4px', background: 'transparent', color: 'var(--text-muted)' }} onClick={() => handleDeleteProcurement(proc.id)}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

        {/* 2.4. WIKI & KNOWLEDGE TAB */}
        {activeTab === 'wiki' && (
          <div className="animate-fade-in">
            <h2>Kho Tri Thức & Kiểm Soát Chất Lượng R&D</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Chia sẻ tài liệu kỹ thuật, lưu trữ lịch sử sửa lỗi và lưu phiên bản firmware build.</p>

            <div className="dashboard-grid" style={{ marginTop: '24px', gridTemplateColumns: '200px 1fr' }}>
              {/* Left navigation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', background: 'rgba(255,255,255,0.02)' }} onClick={() => setShowWikiModal(true)}>+ Thêm Wiki</button>
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', background: 'rgba(255,255,255,0.02)' }} onClick={() => setShowFailureModal(true)}>+ Thêm Nhật ký Lỗi</button>
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', background: 'rgba(255,255,255,0.02)' }} onClick={() => setShowFirmwareModal(true)}>+ Release Firmware</button>
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', background: 'rgba(255,255,255,0.02)' }} onClick={() => setShowLinkModal(true)}>+ Thêm Link Tài nguyên</button>
              </div>

              {/* Right page content */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {/* 1. Setup wiki list */}
                <div className="glass-card" style={{ padding: '24px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><BookOpen size={20} /> Hướng dẫn Setup & Onboarding</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {wikiPagesList.map(page => (
                      <div key={page.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '12px' }}>
                        <h4 style={{ fontWeight: 700, color: '#fff' }}>{page.title}</h4>
                        <pre style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', overflowX: 'auto', marginTop: '6px', fontFamily: 'monospace' }}>{page.contentMarkdown}</pre>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>Cập nhật lần cuối ngày {page.updatedAt}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Failure Logs */}
                <div className="glass-card" style={{ padding: '24px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><Bug size={20} style={{ color: 'var(--status-overdue)' }} /> Nhật ký Lỗi & Khắc phục</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {failureLogsList.map(log => {
                      const proj = projects.find(p => p.id === log.projectId);
                      return (
                        <div key={log.id} style={{ border: '1px solid rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.01)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ fontWeight: 700, color: '#fca5a5' }}>{log.title}</h4>
                            <button className="btn" style={{ padding: '2px', background: 'transparent', color: 'var(--text-muted)' }} onClick={() => handleDeleteFailure(log.id)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Dự án: {proj ? proj.name : 'Tất cả'}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                            <div style={{ marginBottom: '4px' }}>🔴 <strong>Mô tả lỗi:</strong> {log.description}</div>
                            <div style={{ color: '#a7f3d0' }}>🟢 <strong>Giải pháp xử lý:</strong> {log.solution}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Firmware Release */}
                <div className="glass-card" style={{ padding: '24px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><Cpu size={20} style={{ color: '#10b981' }} /> Kho Firmware Releases</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {firmwareReleasesList.map(release => {
                      const proj = projects.find(p => p.id === release.projectId);
                      return (
                        <div key={release.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '12px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ color: '#fff', fontSize: '1rem' }}>{release.version}</strong>
                              <span className="badge badge-done" style={{ fontSize: '0.7rem' }}>Tương thích: {release.pcbVersionCompatible}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Dự án: {proj ? proj.name : 'N/A'} | Release: {release.releaseDate}</div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>📝 {release.changelog}</p>
                          </div>
                          <a href="#" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={e => { e.preventDefault(); alert('Tải file build local: ' + release.filePath); }}>Tải file .BIN</a>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Project Resource Links */}
                <div className="glass-card" style={{ padding: '24px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><Link size={20} /> Liên kết Tài nguyên Thiết kế</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {projectLinksList.map(lnk => {
                      const proj = projects.find(p => p.id === lnk.projectId);
                      return (
                        <div key={lnk.id} style={{ padding: '14px', border: '1px solid var(--border-glass)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', textTransform: 'uppercase', fontWeight: 700 }}>{proj ? proj.code : 'LINK'}</div>
                            <a href={lnk.url} target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: '#fff', textDecoration: 'underline', fontSize: '0.9rem' }}>{lnk.label}</a>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{lnk.description}</p>
                          </div>
                          <button className="btn" style={{ padding: '4px', background: 'transparent', color: 'var(--text-muted)' }} onClick={() => handleDeleteLink(lnk.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. ADMIN TAB */}
        {activeTab === 'admin' && (user.role === 'admin' || user.role === 'leader') && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2>Quản trị Thành viên & Phân quyền</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Quản lý danh sách nhân sự của bộ phận và cấp tài khoản mới.</p>
              </div>
              <button className="btn btn-primary" onClick={() => {
                setNewMember({ username: '', password: '', fullName: '', role: 'employee', departmentId: user.departmentId ? user.departmentId.toString() : '1' });
                setShowMemberModal(true);
              }}>
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
                <div className="table-container">
                  <table className="table-responsive table-users">
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
                            {user.role === 'admin' ? (
                              <select
                                className="input-field"
                                style={{ padding: '6px 12px', fontSize: '0.85rem', width: 'auto' }}
                                value={approvalDepts[u.id] || (u.departmentId ? u.departmentId.toString() : '1')}
                                onChange={e => setApprovalDepts({ ...approvalDepts, [u.id]: e.target.value })}
                              >
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                              </select>
                            ) : (
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {departments.find(d => d.id === user.departmentId)?.name}
                              </span>
                            )}
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
                              {user.role === 'admin' && <option value="admin">Quản trị viên (Admin)</option>}
                            </select>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <button
                              type="button"
                              className="btn btn-success-approve"
                              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
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
              <div className="table-container">
                <table className="table-responsive table-users">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <th style={{ padding: '12px' }}>Họ và tên</th>
                    <th style={{ padding: '12px' }}>Username</th>
                    <th style={{ padding: '12px' }}>Vai trò</th>
                    <th style={{ padding: '12px' }}>Phòng ban</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Hành động</th>
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
                      <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          {(user.role === 'admin' || u.id === user.id || (user.role === 'leader' && u.role === 'employee' && u.departmentId === user.departmentId)) && (
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              onClick={() => {
                                setEditingUser({ ...u });
                                setEditUserPassword('');
                                setShowEditUserModal(true);
                              }}
                            >
                              Sửa
                            </button>
                          )}
                          {u.id !== user.id && (user.role === 'admin' || (user.role === 'leader' && u.role === 'employee' && u.departmentId === user.departmentId)) && (
                            <button 
                              className="btn btn-danger" 
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              onClick={() => handleDeleteUser(u.id)}
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  value={newTask.projectId || selectedProjectId}
                  onChange={e => setNewTask(prev => ({ ...prev, projectId: e.target.value }))}
                  required
                >
                  <option value="">-- Chọn dự án --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="input-label">Sprint</label>
                  <select
                    className="input-field"
                    value={newTask.sprintId}
                    onChange={e => setNewTask(prev => ({ ...prev, sprintId: e.target.value }))}
                  >
                    <option value="">-- Không thuộc Sprint (Backlog) --</option>
                    {sprints.filter(s => s.projectId === Number(newTask.projectId || selectedProjectId)).map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name || `Sprint #${s.id}`} ({s.status === 'Active' ? '🚀 Đang chạy' : s.status === 'Completed' ? '✔️ Hoàn thành' : '📋 Kế hoạch'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label">Phòng chuyên môn</label>
                  <select
                    className="input-field"
                    value={newTask.departmentId}
                    onChange={e => setNewTask(prev => ({ ...prev, departmentId: e.target.value }))}
                    required
                  >
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="input-label">Giao cho nhân viên</label>
                  <select
                    className="input-field"
                    value={newTask.assigneeId}
                    onChange={e => setNewTask(prev => ({ ...prev, assigneeId: e.target.value }))}
                    required
                  >
                    <option value="">-- Chọn nhân sự --</option>
                    {usersList.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Ước lượng thời gian (giờ)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={newTask.estimate}
                    onChange={e => setNewTask(prev => ({ ...prev, estimate: e.target.value }))}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="input-label">Hạn hoàn thành</label>
                  <input
                    type="date"
                    className="input-field"
                    value={newTask.dueDate}
                    onChange={e => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
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
              <div>
                <label className="input-label">Task cha (nếu là Sub-task)</label>
                <select
                  className="input-field"
                  value={newTask.parentTaskId}
                  onChange={e => setNewTask(prev => ({ ...prev, parentTaskId: e.target.value }))}
                >
                  <option value="">-- Không (Đây là Task chính) --</option>
                  {tasks.filter(t => t.projectId === Number(newTask.projectId || selectedProjectId) && !t.parentTaskId).map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Giao việc</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Editing Task Modal (Allows Edit & Delete) */}
      {editingTask && (
        <div className="modal-overlay" onClick={() => setEditingTask(null)}>
          <div className="modal-body animate-fade-in" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Chi tiết & Chỉnh sửa Task</h3>
              {(user.role === 'admin' || user.role === 'leader') && (
                <button className="btn btn-danger" style={{ background: '#ef4444', padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleDeleteTask(editingTask.id)}>Xóa Task</button>
              )}
            </div>
            <form onSubmit={e => {
              e.preventDefault();
              handleUpdateTaskFull(editingTask.id, editingTask);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {!(user.role === 'admin' || user.role === 'leader') && (
                <div style={{ padding: '8px 12px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '8px', fontSize: '0.8rem', color: '#a5b4fc' }}>
                  ℹ️ Bạn đang xem ở chế độ Nhân viên. Chỉ có thể cập nhật Tiến độ & Trạng thái của công việc.
                </div>
              )}

              <div>
                <label className="input-label">Tên công việc</label>
                <input
                  type="text"
                  className="input-field"
                  value={editingTask.title}
                  onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                  required
                  disabled={!(user.role === 'admin' || user.role === 'leader')}
                  style={!(user.role === 'admin' || user.role === 'leader') ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                />
              </div>
              <div>
                <label className="input-label">Mô tả chi tiết</label>
                <textarea
                  className="input-field"
                  rows="3"
                  value={editingTask.description}
                  onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
                  disabled={!(user.role === 'admin' || user.role === 'leader')}
                  style={!(user.role === 'admin' || user.role === 'leader') ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="input-label">Sprint</label>
                  <select
                    className="input-field"
                    value={editingTask.sprintId || ''}
                    onChange={e => setEditingTask({ ...editingTask, sprintId: e.target.value ? Number(e.target.value) : null })}
                    disabled={!(user.role === 'admin' || user.role === 'leader')}
                    style={!(user.role === 'admin' || user.role === 'leader') ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                  >
                    <option value="">-- Không thuộc Sprint (Backlog) --</option>
                    {sprints.filter(s => s.projectId === editingTask.projectId).map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name || `Sprint #${s.id}`} ({s.status === 'Active' ? '🚀 Đang chạy' : s.status === 'Completed' ? '✔️ Hoàn thành' : '📋 Kế hoạch'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label">Phòng chuyên môn</label>
                  <select
                    className="input-field"
                    value={editingTask.departmentId}
                    onChange={e => setEditingTask({ ...editingTask, departmentId: Number(e.target.value) })}
                    required
                    disabled={!(user.role === 'admin' || user.role === 'leader')}
                    style={!(user.role === 'admin' || user.role === 'leader') ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                  >
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="input-label">Giao cho</label>
                  <select
                    className="input-field"
                    value={editingTask.assigneeId}
                    onChange={e => setEditingTask({ ...editingTask, assigneeId: Number(e.target.value) })}
                    required
                    disabled={!(user.role === 'admin' || user.role === 'leader')}
                    style={!(user.role === 'admin' || user.role === 'leader') ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                  >
                    {usersList.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Ước lượng thời gian (giờ)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={editingTask.estimate || 0}
                    onChange={e => setEditingTask({ ...editingTask, estimate: Number(e.target.value) })}
                    disabled={!(user.role === 'admin' || user.role === 'leader')}
                    style={!(user.role === 'admin' || user.role === 'leader') ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="input-label">Hạn hoàn thành</label>
                  <input
                    type="date"
                    className="input-field"
                    value={editingTask.dueDate || ''}
                    onChange={e => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                    required
                    disabled={!(user.role === 'admin' || user.role === 'leader')}
                    style={!(user.role === 'admin' || user.role === 'leader') ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                  />
                </div>
                <div>
                  <label className="input-label">Độ ưu tiên</label>
                  <select
                    className="input-field"
                    value={editingTask.priority}
                    onChange={e => setEditingTask({ ...editingTask, priority: e.target.value })}
                    disabled={!(user.role === 'admin' || user.role === 'leader')}
                    style={!(user.role === 'admin' || user.role === 'leader') ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                <div>
                  <label className="input-label" style={{ color: 'var(--status-active)' }}>Trạng thái công việc</label>
                  <select
                    className="input-field"
                    value={editingTask.status}
                    onChange={e => {
                      const newStatus = e.target.value;
                      const updates = { status: newStatus };
                      if (newStatus === 'Done') updates.progress = 100;
                      setEditingTask({ ...editingTask, ...updates });
                    }}
                  >
                    <option value="Backlog">Backlog</option>
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="input-label" style={{ color: 'var(--status-done)' }}>Tiến độ ({editingTask.progress || 0}%)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={editingTask.progress || 0}
                      onChange={e => {
                        const newProg = Number(e.target.value);
                        const updates = { progress: newProg };
                        if (newProg === 100) updates.status = 'Done';
                        else if (newProg > 0 && editingTask.status === 'To Do') updates.status = 'In Progress';
                        setEditingTask({ ...editingTask, ...updates });
                      }}
                      style={{ flexGrow: 1, accentColor: 'var(--status-done)', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.95rem', fontWeight: 'bold', minWidth: '40px', textAlign: 'right' }}>{editingTask.progress || 0}%</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingTask(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Cập nhật Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sprint Modal */}
      {showSprintModal && (
        <div className="modal-overlay" onClick={() => setShowSprintModal(false)}>
          <div className="modal-body animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>Tạo Sprint mới</h3>
            <form onSubmit={handleCreateSprint} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="input-label">Tên Sprint</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ví dụ: Sprint 1 - Core hardware schematic"
                  value={newSprint.name}
                  onChange={e => setNewSprint({ ...newSprint, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="input-label">Mục tiêu Sprint</label>
                <textarea
                  className="input-field"
                  rows="2"
                  placeholder="Mục tiêu cốt lõi của sprint..."
                  value={newSprint.goal}
                  onChange={e => setNewSprint({ ...newSprint, goal: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="input-label">Ngày bắt đầu</label>
                  <input
                    type="date"
                    className="input-field"
                    value={newSprint.startDate}
                    onChange={e => setNewSprint({ ...newSprint, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Ngày kết thúc</label>
                  <input
                    type="date"
                    className="input-field"
                    value={newSprint.endDate}
                    onChange={e => setNewSprint({ ...newSprint, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSprintModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Tạo Sprint</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Sprint Modal */}
      {showEditSprintModal && editingSprint && (
        <div className="modal-overlay" onClick={() => setShowEditSprintModal(false)}>
          <div className="modal-body animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>Chỉnh sửa thông tin Sprint</h3>
            <form onSubmit={handleUpdateSprintFull} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="input-label">Tên Sprint</label>
                <input
                  type="text"
                  className="input-field"
                  value={editingSprint.name || ''}
                  onChange={e => setEditingSprint({ ...editingSprint, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="input-label">Mục tiêu Sprint (Sprint Goal)</label>
                <textarea
                  className="input-field"
                  rows="3"
                  value={editingSprint.goal || ''}
                  onChange={e => setEditingSprint({ ...editingSprint, goal: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="input-label">Ngày bắt đầu</label>
                  <input
                    type="date"
                    className="input-field"
                    value={editingSprint.startDate || ''}
                    onChange={e => setEditingSprint({ ...editingSprint, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="input-label">Ngày kết thúc</label>
                  <input
                    type="date"
                    className="input-field"
                    value={editingSprint.endDate || ''}
                    onChange={e => setEditingSprint({ ...editingSprint, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="input-label">Trạng thái Sprint</label>
                <select
                  className="input-field"
                  value={editingSprint.status || 'Planned'}
                  onChange={e => setEditingSprint({ ...editingSprint, status: e.target.value })}
                >
                  <option value="Planned">📋 Kế hoạch (Planned)</option>
                  <option value="Active">🚀 Đang chạy (Active)</option>
                  <option value="Completed">✔️ Hoàn thành (Completed)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditSprintModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Viewing Report & Feedback Modal */}
      {viewingReportModal && (
        <div className="modal-overlay" onClick={() => setViewingReportModal(null)}>
          <div className="modal-body animate-fade-in" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Báo cáo tuần: {viewingReportModal.senderName}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Phòng: <span className="dept-tag">{viewingReportModal.departmentName}</span> | Gửi đến: <strong>{viewingReportModal.recipientName}</strong>
                </div>
              </div>
              <span className="badge badge-low" style={{ fontSize: '0.75rem' }}>Tuần: {viewingReportModal.weekStartDate}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto', paddingRight: '6px' }}>
              <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>🛠️ Công việc đã hoàn thành trong tuần:</div>
                <div style={{ fontSize: '0.85rem', color: '#e5e7eb', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {viewingReportModal.doneContent}
                </div>
              </div>

              {viewingReportModal.plannedContent && (
                <div style={{ padding: '12px 16px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#60a5fa', marginBottom: '6px' }}>🚀 Dự kiến triển khai tuần sau:</div>
                  <div style={{ fontSize: '0.85rem', color: '#e5e7eb', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {viewingReportModal.plannedContent}
                  </div>
                </div>
              )}

              {viewingReportModal.blockers && (
                <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fca5a5', marginBottom: '6px' }}>⚠️ Khó khăn / Vướng mắc:</div>
                  <div style={{ fontSize: '0.85rem', color: '#fca5a5', whiteSpace: 'pre-wrap' }}>
                    {viewingReportModal.blockers}
                  </div>
                </div>
              )}

              {/* Review / Feedback Section for Leader / Admin */}
              {(user.role === 'admin' || user.role === 'leader') && (
                <form onSubmit={handleSaveReportFeedback} style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: '8px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '12px' }}>
                    ⭐ Đánh giá & Nhận xét của Trưởng nhóm / Admin
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label className="input-label">Chấm điểm chất lượng báo cáo (1 - 5 Sao)</label>
                    <select
                      className="input-field"
                      value={reportRatingInput}
                      onChange={e => setReportRatingInput(e.target.value)}
                    >
                      <option value="5">⭐⭐⭐⭐⭐ (5/5 - Xuất sắc)</option>
                      <option value="4">⭐⭐⭐⭐ (4/5 - Tốt)</option>
                      <option value="3">⭐⭐⭐ (3/5 - Đạt yêu cầu)</option>
                      <option value="2">⭐⭐ (2/5 - Cần cải thiện)</option>
                      <option value="1">⭐ (1/5 - Chưa đạt)</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label className="input-label">Ý kiến nhận xét / Phản hồi của Quản lý</label>
                    <textarea
                      className="input-field"
                      rows="2"
                      placeholder="Nhập lời khen, góp ý kỹ thuật hoặc phân công điều chỉnh..."
                      value={reportFeedbackInput}
                      onChange={e => setReportFeedbackInput(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setViewingReportModal(null)}>Đóng</button>
                    <button type="submit" className="btn btn-primary">Lưu Đánh Giá & Gửi Thông Báo</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Asset Modal */}
      {showAssetModal && (
        <div className="modal-overlay" onClick={() => setShowAssetModal(false)}>
          <div className="modal-body animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>Thêm Thiết bị Lab</h3>
            <form onSubmit={handleCreateAsset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="input-label">Tên thiết bị</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ví dụ: Máy hàn Weller WT1010..."
                  value={newAsset.name}
                  onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="input-label">Số Serial (S/N)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="SN-987654321..."
                  value={newAsset.serialNumber}
                  onChange={e => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAssetModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Thêm thiết bị</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Procurement Modal */}
      {showProcureModal && (
        <div className="modal-overlay" onClick={() => setShowProcureModal(false)}>
          <div className="modal-body animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>Đề xuất Linh kiện mẫu (BOM)</h3>
            <form onSubmit={handleCreateProcurement} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="input-label">Tên linh kiện & Mã (MPN)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="IC nguồn TI LM2596S-ADJ, Điện trở 0603..."
                  value={newProcurement.itemName}
                  onChange={e => setNewProcurement({ ...newProcurement, itemName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="input-label">Đường dẫn đặt hàng (Mouser/Digikey/Taobao)</label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://www.mouser.vn/ProductDetail/..."
                  value={newProcurement.url}
                  onChange={e => setNewProcurement({ ...newProcurement, url: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="input-label">Số lượng</label>
                  <input
                    type="number"
                    className="input-field"
                    value={newProcurement.quantity}
                    onChange={e => setNewProcurement({ ...newProcurement, quantity: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Đơn giá ước tính (đ)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={newProcurement.estimatedPrice}
                    onChange={e => setNewProcurement({ ...newProcurement, estimatedPrice: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="input-label">Dự án</label>
                  <select
                    className="input-field"
                    value={newProcurement.projectId}
                    onChange={e => setNewProcurement({ ...newProcurement, projectId: e.target.value })}
                    required
                  >
                    <option value="">-- Chọn dự án --</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Phòng ban đề xuất</label>
                  <select
                    className="input-field"
                    value={newProcurement.departmentId}
                    onChange={e => setNewProcurement({ ...newProcurement, departmentId: e.target.value })}
                    required
                  >
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowProcureModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Gửi Đề xuất</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal-body animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>Đặt chỗ Thiết bị Lab</h3>
            <form onSubmit={handleCreateBooking} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="input-label">Tên thiết bị / Phòng Lab</label>
                <select
                  className="input-field"
                  value={newBooking.equipmentName}
                  onChange={e => setNewBooking({ ...newBooking, equipmentName: e.target.value })}
                  required
                >
                  <option value="Máy in 3D Bambu Lab X1C">Máy in 3D Bambu Lab X1C</option>
                  <option value="Máy đo phổ nhiễu EMC">Máy đo phổ nhiễu EMC Rigol</option>
                  <option value="Buồng giả lập nhiệt độ ẩm">Buồng giả lập nhiệt độ ẩm</option>
                  <option value="Bể hàn sóng mini">Bể hàn sóng mini</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="input-label">Giờ bắt đầu</label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={newBooking.startTime}
                    onChange={e => setNewBooking({ ...newBooking, startTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Giờ kết thúc</label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={newBooking.endTime}
                    onChange={e => setNewBooking({ ...newBooking, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowBookingModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Đăng ký Đặt chỗ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Failure Modal */}
      {showFailureModal && (
        <div className="modal-overlay" onClick={() => setShowFailureModal(false)}>
          <div className="modal-body animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>Ghi nhận Nhật ký Lỗi kỹ thuật</h3>
            <form onSubmit={handleCreateFailure} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="input-label">Tiêu đề lỗi</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ví dụ: IC nguồn hạ áp bị cháy khi cấp nguồn 24V..."
                  value={newFailure.title}
                  onChange={e => setNewFailure({ ...newFailure, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="input-label">Mô tả chi tiết lỗi</label>
                <textarea
                  className="input-field"
                  rows="3"
                  placeholder="Hiện tượng, nguyên nhân xác định ban đầu..."
                  value={newFailure.description}
                  onChange={e => setNewFailure({ ...newFailure, description: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="input-label">Giải pháp khắc phục thành công</label>
                <textarea
                  className="input-field"
                  rows="3"
                  placeholder="Thay đổi tụ chống nhiễu, chỉnh thông số firmware..."
                  value={newFailure.solution}
                  onChange={e => setNewFailure({ ...newFailure, solution: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="input-label">Dự án</label>
                  <select
                    className="input-field"
                    value={newFailure.projectId}
                    onChange={e => setNewFailure({ ...newFailure, projectId: e.target.value })}
                    required
                  >
                    <option value="">-- Chọn dự án --</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Bộ phận phát sinh</label>
                  <select
                    className="input-field"
                    value={newFailure.departmentId}
                    onChange={e => setNewFailure({ ...newFailure, departmentId: e.target.value })}
                    required
                  >
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowFailureModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu Nhật ký</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Firmware Modal */}
      {showFirmwareModal && (
        <div className="modal-overlay" onClick={() => setShowFirmwareModal(false)}>
          <div className="modal-body animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>Release Phiên bản Firmware mới</h3>
            <form onSubmit={handleCreateFirmware} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="input-label">Dự án</label>
                  <select
                    className="input-field"
                    value={newFirmware.projectId}
                    onChange={e => setNewFirmware({ ...newFirmware, projectId: e.target.value })}
                    required
                  >
                    <option value="">-- Chọn dự án --</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Phiên bản (Tag)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="v1.0.3-alpha..."
                    value={newFirmware.version}
                    onChange={e => setNewFirmware({ ...newFirmware, version: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="input-label">Phiên bản PCB tương thích</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="PCB-THEMIS-V1.2..."
                  value={newFirmware.pcbVersionCompatible}
                  onChange={e => setNewFirmware({ ...newFirmware, pcbVersionCompatible: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="input-label">Nhật ký thay đổi (Changelog)</label>
                <textarea
                  className="input-field"
                  rows="3"
                  placeholder="Sửa lỗi tràn bộ nhớ stack, thêm driver cảm biến I2C..."
                  value={newFirmware.changelog}
                  onChange={e => setNewFirmware({ ...newFirmware, changelog: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowFirmwareModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Phát hành</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wiki Modal */}
      {showWikiModal && (
        <div className="modal-overlay" onClick={() => setShowWikiModal(false)}>
          <div className="modal-body animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>Tạo Hướng dẫn Onboarding mới</h3>
            <form onSubmit={handleCreateWiki} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="input-label">Tiêu đề bài viết</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ví dụ: Hướng dẫn cài đặt Keil C cho chip STM32..."
                  value={newWiki.title}
                  onChange={e => setNewWiki({ ...newWiki, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="input-label">Nội dung (Markdown)</label>
                <textarea
                  className="input-field"
                  rows="8"
                  placeholder="Sử dụng markdown để soạn thảo bài viết..."
                  value={newWiki.contentMarkdown}
                  onChange={e => setNewWiki({ ...newWiki, contentMarkdown: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowWikiModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu bài viết</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="modal-body animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>Thêm Liên kết Tài nguyên</h3>
            <form onSubmit={handleCreateLink} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="input-label">Dự án</label>
                  <select
                    className="input-field"
                    value={newLink.projectId}
                    onChange={e => setNewLink({ ...newLink, projectId: e.target.value })}
                    required
                  >
                    <option value="">-- Chọn dự án --</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Tên nhãn (Label)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ví dụ: Link mạch Altium EasyEDA..."
                    value={newLink.label}
                    onChange={e => setNewLink({ ...newLink, label: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="input-label">Đường dẫn URL</label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://github.com/... hoặc link Google Drive..."
                  value={newLink.url}
                  onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="input-label">Mô tả ngắn</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ví dụ: File Altium schematic v1.2 của khối nguồn..."
                  value={newLink.description}
                  onChange={e => setNewLink({ ...newLink, description: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowLinkModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu liên kết</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inherit Project Modal */}
      {showInheritModal && (
        <div className="modal-overlay" onClick={() => setShowInheritModal(false)}>
          <div className="modal-body animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>Kế thừa tri thức từ dự án cũ</h3>
            <form onSubmit={handleInheritProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="input-label">Chọn dự án nguồn (Dự án cũ)</label>
                <select
                  className="input-field"
                  value={inheritForm.sourceProjectId}
                  onChange={e => setInheritForm({ ...inheritForm, sourceProjectId: e.target.value })}
                  required
                >
                  <option value="">-- Chọn dự án cũ --</option>
                  {projects.filter(p => p.id !== Number(selectedProjectId)).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={inheritForm.inheritBOM}
                    onChange={e => setInheritForm({ ...inheritForm, inheritBOM: e.target.checked })}
                  />
                  <span>Kế thừa Danh sách linh kiện mẫu (BOM)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={inheritForm.inheritLinks}
                    onChange={e => setInheritForm({ ...inheritForm, inheritLinks: e.target.checked })}
                  />
                  <span>Kế thừa Các liên kết tài nguyên thiết kế</span>
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowInheritModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Tiến hành kế thừa</button>
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
                    {user.role === 'admin' && <option value="admin">Quản trị viên (Admin)</option>}
                  </select>
                </div>
                <div>
                  <label className="input-label">Phòng ban</label>
                  <select
                    className="input-field"
                    value={newMember.departmentId}
                    onChange={e => setNewMember(prev => ({ ...prev, departmentId: e.target.value }))}
                    disabled={user.role !== 'admin'}
                  >
                    {user.role === 'admin' ? (
                      departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)
                    ) : (
                      <option value={user.departmentId}>
                        {departments.find(d => d.id === user.departmentId)?.name}
                      </option>
                    )}
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

      {/* Edit Member Modal */}
      {showEditUserModal && editingUser && (
        <div className="modal-overlay" onClick={() => setShowEditUserModal(false)}>
          <div className="modal-body animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>Chỉnh sửa thông tin Thành viên</h3>
            <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="input-label">Họ và tên</label>
                <input
                  type="text"
                  className="input-field"
                  value={editingUser.fullName}
                  onChange={e => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="input-label">Tên đăng nhập (Username)</label>
                <input
                  type="text"
                  className="input-field"
                  value={editingUser.username}
                  onChange={e => setEditingUser({ ...editingUser, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="input-label">Mật khẩu mới (Bỏ trống nếu không đổi)</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Nhập mật khẩu mới..."
                  value={editUserPassword}
                  onChange={e => setEditUserPassword(e.target.value)}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="input-label">Vai trò</label>
                  <select
                    className="input-field"
                    value={editingUser.role}
                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                  >
                    <option value="employee">Nhân viên (Employee)</option>
                    <option value="leader">Trưởng nhóm (Leader)</option>
                    {user.role === 'admin' && <option value="admin">Quản trị viên (Admin)</option>}
                  </select>
                </div>
                <div>
                  <label className="input-label">Phòng ban</label>
                  <select
                    className="input-field"
                    value={editingUser.departmentId}
                    onChange={e => setEditingUser({ ...editingUser, departmentId: e.target.value })}
                    disabled={user.role !== 'admin'}
                  >
                    {user.role === 'admin' ? (
                      departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)
                    ) : (
                      <option value={user.departmentId}>
                        {departments.find(d => d.id === user.departmentId)?.name}
                      </option>
                    )}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditUserModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projects Detail Modal */}
      {showProjectsDetailModal && (
        <div className="modal-overlay" onClick={() => setShowProjectsDetailModal(false)}>
          <div className="modal-body animate-fade-in" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Chi tiết Danh sách Dự án</h3>
              <button className="btn btn-secondary" onClick={() => setShowProjectsDetailModal(false)}>Đóng</button>
            </div>
            <div className="table-container" style={{ maxHeight: '400px' }}>
              <table className="table-responsive table-projects">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '10px' }}>Mã dự án</th>
                    <th style={{ padding: '10px' }}>Tên dự án</th>
                    <th style={{ padding: '10px' }}>Mô tả</th>
                    <th style={{ padding: '10px' }}>Trạng thái</th>
                    {(user.role === 'admin' || user.role === 'leader') && <th style={{ padding: '10px' }}>Thao tác</th>}
                  </tr>
                </thead>
                <tbody>
                  {projects.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--accent-primary)' }}>{p.code}</td>
                      <td style={{ padding: '12px 10px', fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{p.description}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <span className={`badge badge-${p.status === 'Active' ? 'done' : 'low'}`}>
                          {p.status}
                        </span>
                      </td>
                      {(user.role === 'admin' || user.role === 'leader') && (
                        <td style={{ padding: '12px 10px', display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                            onClick={() => {
                              setEditingProject(p);
                              setShowEditProjectModal(true);
                            }}
                          >
                            Sửa
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '4px 10px', fontSize: '0.8rem', background: '#ef4444' }}
                            onClick={() => handleDeleteProject(p.id)}
                          >
                            Xóa
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Active Tasks Detail Modal */}
      {showTasksDetailModal && (
        <div className="modal-overlay" onClick={() => setShowTasksDetailModal(false)}>
          <div className="modal-body animate-fade-in" style={{ maxWidth: '950px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Chi tiết các Task Đang hoạt động ({activeTasks.length})</h3>
              <button className="btn btn-secondary" onClick={() => setShowTasksDetailModal(false)}>Đóng</button>
            </div>
            <div className="table-container" style={{ maxHeight: '450px' }}>
              <table className="table-responsive table-tasks">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '10px' }}>Dự án</th>
                    <th style={{ padding: '10px' }}>Tên Task</th>
                    <th style={{ padding: '10px' }}>Độ ưu tiên</th>
                    <th style={{ padding: '10px' }}>Người làm</th>
                    <th style={{ padding: '10px' }}>Bộ phận</th>
                    <th style={{ padding: '10px' }}>Trạng thái</th>
                    <th style={{ padding: '10px' }}>Tiến độ</th>
                    <th style={{ padding: '10px' }}>Hạn chót</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTasks.map(t => {
                    const proj = projects.find(p => p.id === t.projectId);
                    const assignee = usersList.find(u => u.id === t.assigneeId);
                    const dept = departments.find(d => d.id === t.departmentId);
                    return (
                      <tr
                        key={t.id}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}
                        onClick={() => {
                          setEditingTask(t);
                          setShowTasksDetailModal(false);
                        }}
                        title="Click để sửa chi tiết"
                      >
                        <td style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--accent-primary)' }}>{proj ? proj.code : 'N/A'}</td>
                        <td style={{ padding: '12px 10px', fontWeight: 600 }}>{t.title}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span className={`badge badge-${t.priority.toLowerCase()}`}>
                            {t.priority}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px' }}>{assignee ? assignee.fullName : 'Chưa gán'}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span className="dept-tag" style={{ fontSize: '0.7rem' }}>{dept ? dept.name : 'Chưa phân'}</span>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <span className={`badge badge-${t.status === 'In Progress' ? 'active' : t.status === 'Review' ? 'medium' : 'low'}`}>
                            {t.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '80px' }}>
                            <div className="progress-bar-bg" style={{ width: '50px', height: '6px' }}>
                              <div className="progress-bar-fill" style={{ width: `${t.progress || 0}%` }} />
                            </div>
                            <span>{t.progress || 0}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 10px', color: new Date(t.dueDate) < new Date() ? 'var(--status-overdue)' : 'var(--text-secondary)' }}>{t.dueDate}</td>
                      </tr>
                    );
                  })}
                  {activeTasks.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Không có task nào đang hoạt động.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Finished Tasks Detail Modal */}
      {showFinishedTasksDetailModal && (
        <div className="modal-overlay" onClick={() => setShowFinishedTasksDetailModal(false)}>
          <div className="modal-body animate-fade-in" style={{ maxWidth: '950px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Chi tiết các Task Đã hoàn thành ({finishedTasks.length})</h3>
              <button className="btn btn-secondary" onClick={() => setShowFinishedTasksDetailModal(false)}>Đóng</button>
            </div>
            <div className="table-container" style={{ maxHeight: '450px' }}>
              <table className="table-responsive table-tasks">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '10px' }}>Dự án</th>
                    <th style={{ padding: '10px' }}>Tên Task</th>
                    <th style={{ padding: '10px' }}>Độ ưu tiên</th>
                    <th style={{ padding: '10px' }}>Người làm</th>
                    <th style={{ padding: '10px' }}>Bộ phận</th>
                    <th style={{ padding: '10px' }}>Trạng thái</th>
                    <th style={{ padding: '10px' }}>Tiến độ</th>
                    <th style={{ padding: '10px' }}>Hạn chót</th>
                  </tr>
                </thead>
                <tbody>
                  {finishedTasks.map(t => {
                    const proj = projects.find(p => p.id === t.projectId);
                    const assignee = usersList.find(u => u.id === t.assigneeId);
                    const dept = departments.find(d => d.id === t.departmentId);
                    return (
                      <tr
                        key={t.id}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}
                        onClick={() => {
                          setEditingTask(t);
                          setShowFinishedTasksDetailModal(false);
                        }}
                        title="Click để sửa chi tiết"
                      >
                        <td style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--accent-primary)' }}>{proj ? proj.code : 'N/A'}</td>
                        <td style={{ padding: '12px 10px', fontWeight: 600 }}>{t.title}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span className={`badge badge-${t.priority.toLowerCase()}`}>
                            {t.priority}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px' }}>{assignee ? assignee.fullName : 'Chưa gán'}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span className="dept-tag" style={{ fontSize: '0.7rem' }}>{dept ? dept.name : 'Chưa phân'}</span>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <span className="badge badge-done">
                            {t.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '80px' }}>
                            <div className="progress-bar-bg" style={{ width: '50px', height: '6px' }}>
                              <div className="progress-bar-fill" style={{ width: `${t.progress || 0}%` }} />
                            </div>
                            <span>{t.progress || 0}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{t.dueDate}</td>
                      </tr>
                    );
                  })}
                  {finishedTasks.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Không có task nào hoàn thành.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Today Tasks Detail Modal */}
      {showTodayTasksDetailModal && (
        <div className="modal-overlay" onClick={() => setShowTodayTasksDetailModal(false)}>
          <div className="modal-body animate-fade-in" style={{ maxWidth: '950px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Mục tiêu Hôm nay - Các Task đến hạn ({todayTasks.length})</h3>
              <button className="btn btn-secondary" onClick={() => setShowTodayTasksDetailModal(false)}>Đóng</button>
            </div>
            <div className="table-container" style={{ maxHeight: '450px' }}>
              <table className="table-responsive table-tasks">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '10px' }}>Dự án</th>
                    <th style={{ padding: '10px' }}>Tên Task</th>
                    <th style={{ padding: '10px' }}>Độ ưu tiên</th>
                    <th style={{ padding: '10px' }}>Người làm</th>
                    <th style={{ padding: '10px' }}>Bộ phận</th>
                    <th style={{ padding: '10px' }}>Trạng thái</th>
                    <th style={{ padding: '10px' }}>Tiến độ</th>
                    <th style={{ padding: '10px' }}>Hạn chót</th>
                  </tr>
                </thead>
                <tbody>
                  {todayTasks.map(t => {
                    const proj = projects.find(p => p.id === t.projectId);
                    const assignee = usersList.find(u => u.id === t.assigneeId);
                    const dept = departments.find(d => d.id === t.departmentId);
                    return (
                      <tr
                        key={t.id}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}
                        onClick={() => {
                          setEditingTask(t);
                          setShowTodayTasksDetailModal(false);
                        }}
                        title="Click để sửa chi tiết"
                      >
                        <td style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--accent-primary)' }}>{proj ? proj.code : 'N/A'}</td>
                        <td style={{ padding: '12px 10px', fontWeight: 600 }}>{t.title}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span className={`badge badge-${t.priority.toLowerCase()}`}>
                            {t.priority}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px' }}>{assignee ? assignee.fullName : 'Chưa gán'}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span className="dept-tag" style={{ fontSize: '0.7rem' }}>{dept ? dept.name : 'Chưa phân'}</span>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <span className={`badge badge-${t.status === 'Done' ? 'done' : t.status === 'In Progress' ? 'active' : 'low'}`}>
                            {t.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '80px' }}>
                            <div className="progress-bar-bg" style={{ width: '50px', height: '6px' }}>
                              <div className="progress-bar-fill" style={{ width: `${t.progress || 0}%` }} />
                            </div>
                            <span>{t.progress || 0}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 10px', fontWeight: 'bold', color: 'var(--accent-secondary)' }}>{t.dueDate} (Hôm nay)</td>
                      </tr>
                    );
                  })}
                  {todayTasks.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Không có mục tiêu nào đến hạn hôm nay.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditProjectModal && editingProject && (
        <div className="modal-overlay" onClick={() => {
          setShowEditProjectModal(false);
          setEditingProject(null);
        }}>
          <div className="modal-body animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>Chỉnh sửa thông tin Dự án</h3>
            <form onSubmit={handleUpdateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="input-label">Mã dự án (Không thể sửa)</label>
                <input
                  type="text"
                  className="input-field"
                  value={editingProject.code}
                  disabled
                  style={{ opacity: 0.6 }}
                />
              </div>
              <div>
                <label className="input-label">Tên dự án</label>
                <input
                  type="text"
                  className="input-field"
                  value={editingProject.name}
                  onChange={e => setEditingProject({ ...editingProject, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="input-label">Mô tả dự án</label>
                <textarea
                  className="input-field"
                  rows="3"
                  value={editingProject.description || ''}
                  onChange={e => setEditingProject({ ...editingProject, description: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label">Trạng thái</label>
                <select
                  className="input-field"
                  value={editingProject.status}
                  onChange={e => setEditingProject({ ...editingProject, status: e.target.value })}
                >
                  <option value="Active">Đang chạy (Active)</option>
                  <option value="Completed">Hoàn thành (Completed)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowEditProjectModal(false);
                  setEditingProject(null);
                }}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
