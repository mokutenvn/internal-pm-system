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
  Settings
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

  // New R&D Modals toggle
  const [showSprintModal, setShowSprintModal] = useState(false);
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
              <span>Dự án & Sprints</span>
            </li>
            <li className={`sidebar-item ${activeTab === 'standup' ? 'active' : ''}`} onClick={() => setActiveTab('standup')}>
              <Activity size={20} />
              <span>Daily Standup</span>
            </li>
            <li className={`sidebar-item ${activeTab === 'lab' ? 'active' : ''}`} onClick={() => setActiveTab('lab')}>
              <Boxes size={20} />
              <span>Phòng Lab & Thiết bị</span>
            </li>
            <li className={`sidebar-item ${activeTab === 'procurements' ? 'active' : ''}`} onClick={() => setActiveTab('procurements')}>
              <ShoppingCart size={20} />
              <span>Yêu cầu Mua sắm</span>
            </li>
            <li className={`sidebar-item ${activeTab === 'wiki' ? 'active' : ''}`} onClick={() => setActiveTab('wiki')}>
              <BookOpen size={20} />
              <span>Wiki & Nhật ký lỗi</span>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2>Bảng công việc Kanban & Sprints</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Chọn dự án và quản lý quy trình phát triển sản phẩm Agile.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {(user.role === 'admin' || user.role === 'leader') && (
                  <>
                    <button className="btn btn-secondary" onClick={() => setShowProjectModal(true)}>
                      <Plus size={16} />
                      Thêm Dự án
                    </button>
                    <button className="btn btn-secondary" onClick={() => setShowSprintModal(true)}>
                      <Plus size={16} />
                      Thêm Sprint
                    </button>
                    <button className="btn btn-secondary" onClick={() => setShowInheritModal(true)}>
                      <Layers size={16} />
                      Kế thừa dự án
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
                      <Plus size={16} />
                      Thêm Task
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Project & Sprint selection bar */}
            <div className="glass-card" style={{ padding: '16px 24px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Dự án:</span>
                <select
                  className="input-field"
                  style={{ width: '220px', padding: '6px 12px' }}
                  value={selectedProjectId}
                  onChange={e => {
                    setSelectedProjectId(e.target.value);
                    setSelectedSprintId(''); // Reset selected sprint
                  }}
                >
                  {projects.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Sprint:</span>
                <select
                  className="input-field"
                  style={{ width: '220px', padding: '6px 12px' }}
                  value={selectedSprintId}
                  onChange={e => setSelectedSprintId(e.target.value)}
                >
                  <option value="">Tất cả / Backlog</option>
                  {sprints.filter(s => s.projectId === Number(selectedProjectId)).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                  ))}
                </select>
              </div>

              {selectedSprintId && (user.role === 'admin' || user.role === 'leader') && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleUpdateSprintStatus(Number(selectedSprintId), 'Active')}>Chạy Sprint</button>
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleUpdateSprintStatus(Number(selectedSprintId), 'Completed')}>Hoàn thành</button>
                  <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#ef4444' }} onClick={() => handleDeleteSprint(Number(selectedSprintId))}>Xóa</button>
                </div>
              )}
            </div>

            {/* Department filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
              {departments.map(d => (
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', alignItems: 'start' }}>
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

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {colTasks.map(t => {
                        const assignee = usersList.find(u => u.id === t.assigneeId);
                        return (
                          <div
                            key={t.id}
                            className="goal-item animate-fade-in"
                            style={{
                              background: 'rgba(17, 24, 39, 0.7)',
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
                            
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: '#fff' }}>{t.title}</div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', lineClamp: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {t.description}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '6px' }}>
                              <span>@{assignee ? assignee.fullName : 'Chưa gán'}</span>
                              <span>Hạn: {t.dueDate || 'Không'}</span>
                            </div>

                            {/* Dropdown status update */}
                            <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                              <select
                                className="input-field"
                                style={{ padding: '2px 4px', fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', border: 'none' }}
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
                        TỔNG HỢP Ý CHÍNH
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
                  <button type="submit" className="btn btn-primary" style={{ padding: '12px' }}>Gửi Check-in</button>
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
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
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
                                <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.8rem', background: '#10b981' }} onClick={() => handleApproveAssetLoan(activeLoan.id, 'Returned')}>Trả thiết bị</button>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

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
                          <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.8rem', background: '#10b981' }} onClick={() => handleApproveAssetLoan(loan.id, 'Approved')}>Duyệt mượn</button>
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
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
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
                                <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#10b981' }} onClick={() => handleApproveProcurement(proc.id, 'Approved')}>Duyệt</button>
                                <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#ef4444' }} onClick={() => handleDeleteProcurement(proc.id)}>Từ chối</button>
                              </>
                            )}
                            {proc.status === 'Approved' && (user.role === 'admin' || user.role === 'leader') && (
                              <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleApproveProcurement(proc.id, 'Ordered')}>Đã Đặt Hàng</button>
                            )}
                            {proc.status === 'Ordered' && (proc.userId === user.id || user.role === 'admin' || user.role === 'leader') && (
                              <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#10b981' }} onClick={() => handleApproveProcurement(proc.id, 'Received')}>Đã Về Kho</button>
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
                    <option value="">-- Không thuộc Sprint --</option>
                    {sprints.filter(s => s.projectId === Number(newTask.projectId || selectedProjectId)).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
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
              <button className="btn btn-danger" style={{ background: '#ef4444', padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleDeleteTask(editingTask.id)}>Xóa Task</button>
            </div>
            <form onSubmit={e => {
              e.preventDefault();
              handleUpdateTaskFull(editingTask.id, editingTask);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="input-label">Tên công việc</label>
                <input
                  type="text"
                  className="input-field"
                  value={editingTask.title}
                  onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="input-label">Mô tả chi tiết</label>
                <textarea
                  className="input-field"
                  rows="3"
                  value={editingTask.description}
                  onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="input-label">Sprint</label>
                  <select
                    className="input-field"
                    value={editingTask.sprintId || ''}
                    onChange={e => setEditingTask({ ...editingTask, sprintId: e.target.value ? Number(e.target.value) : null })}
                  >
                    <option value="">-- Không thuộc Sprint --</option>
                    {sprints.filter(s => s.projectId === editingTask.projectId).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
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
                  />
                </div>
                <div>
                  <label className="input-label">Trạng thái</label>
                  <select
                    className="input-field"
                    value={editingTask.status}
                    onChange={e => setEditingTask({ ...editingTask, status: e.target.value })}
                  >
                    <option value="Backlog">Backlog</option>
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
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
