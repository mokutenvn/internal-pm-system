import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { initDb, getAll, getById, insert, update, remove } from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'secretkey_pm_system_123';

app.use(cors());
app.use(express.json());

// Initialize Database
await initDb();

// Request logger helper
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token không tồn tại.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
    req.user = user;
    next();
  });
}

// Role Check Middlewares
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Yêu cầu quyền Admin.' });
  }
  next();
};

const requireLeaderOrAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'leader') {
    return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Yêu cầu quyền Leader hoặc Admin.' });
  }
  next();
};

// --- AUTH APIS ---
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ tài khoản và mật khẩu.' });
  }

  const users = getAll('users');
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(401).json({ message: 'Tài khoản không tồn tại.' });
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ message: 'Mật khẩu không chính xác.' });
  }

  if (user.isApproved === false) {
    return res.status(403).json({ message: 'Tài khoản của bạn đang chờ Admin phê duyệt.' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, fullName: user.fullName, role: user.role, departmentId: user.departmentId },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role, departmentId: user.departmentId }
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { username, password, fullName } = req.body;
  if (!username || !password || !fullName) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin đăng ký.' });
  }

  const users = getAll('users');
  if (users.some(u => u.username === username)) {
    return res.status(400).json({ message: 'Tài khoản này đã tồn tại.' });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = insert('users', {
    username,
    passwordHash,
    fullName,
    role: 'employee',
    departmentId: null,
    isApproved: false
  });

  const { passwordHash: _, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = getById('users', req.user.id);
  if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
  res.json({ id: user.id, username: user.username, fullName: user.fullName, role: user.role, departmentId: user.departmentId });
});

// --- DEPARTMENTS APIS ---
app.get('/api/departments', authenticateToken, (req, res) => {
  res.json(getAll('departments'));
});

// --- USERS MANAGEMENT APIS ---
app.get('/api/users', authenticateToken, (req, res) => {
  const users = getAll('users').map(u => {
    const { passwordHash, ...safeUser } = u;
    return safeUser;
  });
  res.json(users);
});

app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  const { username, password, fullName, role, departmentId } = req.body;
  if (!username || !password || !fullName || !role || !departmentId) {
    return res.status(400).json({ message: 'Thiếu thông tin người dùng bắt buộc.' });
  }

  const users = getAll('users');
  if (users.some(u => u.username === username)) {
    return res.status(400).json({ message: 'Tài khoản này đã tồn tại.' });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = insert('users', {
    username,
    passwordHash,
    fullName,
    role,
    departmentId: Number(departmentId),
    isApproved: true
  });

  const { passwordHash: _, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

app.get('/api/users/pending', authenticateToken, requireLeaderOrAdmin, (req, res) => {
  const users = getAll('users').filter(u => u.isApproved === false);
  const safeUsers = users.map(u => {
    const { passwordHash, ...safeUser } = u;
    return safeUser;
  });
  res.json(safeUsers);
});

app.put('/api/users/:id/approve', authenticateToken, requireAdmin, (req, res) => {
  const { role, departmentId } = req.body;
  if (!role || !departmentId) {
    return res.status(400).json({ message: 'Thiếu thông tin phân quyền và phòng ban duyệt.' });
  }

  const updated = update('users', req.params.id, {
    isApproved: true,
    role,
    departmentId: Number(departmentId)
  });

  if (!updated) return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
  const { passwordHash, ...safeUser } = updated;
  res.json(safeUser);
});

// --- PROJECTS APIS ---
app.get('/api/projects', authenticateToken, (req, res) => {
  const projects = getAll('projects');
  // For employees, we could optionally filter by assigned tasks, but showing all projects makes collaboration easier
  res.json(projects);
});

app.post('/api/projects', authenticateToken, requireLeaderOrAdmin, (req, res) => {
  const { name, description, status } = req.body;
  if (!name) return res.status(400).json({ message: 'Tên dự án là bắt buộc.' });

  const newProject = insert('projects', {
    name,
    description: description || '',
    status: status || 'Active',
    creatorId: req.user.id
  });
  res.status(201).json(newProject);
});

app.put('/api/projects/:id', authenticateToken, requireLeaderOrAdmin, (req, res) => {
  const { name, description, status } = req.body;
  const updated = update('projects', req.params.id, { name, description, status });
  if (!updated) return res.status(404).json({ message: 'Không tìm thấy dự án.' });
  res.json(updated);
});

// --- TASKS APIS ---
app.get('/api/tasks', authenticateToken, (req, res) => {
  const tasks = getAll('tasks');
  res.json(tasks);
});

app.post('/api/tasks', authenticateToken, requireLeaderOrAdmin, (req, res) => {
  const { projectId, title, description, assigneeId, deadline, priority } = req.body;
  if (!projectId || !title || !assigneeId || !deadline) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ các trường bắt buộc (Dự án, Tiêu đề, Người thực hiện, Deadline).' });
  }

  const newTask = insert('tasks', {
    projectId: Number(projectId),
    title,
    description: description || '',
    assigneeId: Number(assigneeId),
    deadline,
    progress: 0,
    priority: priority || 'Medium',
    status: 'Active'
  });
  res.status(201).json(newTask);
});

// Update progress (available to assignee, leader, admin)
app.put('/api/tasks/:id', authenticateToken, (req, res) => {
  const task = getById('tasks', req.params.id);
  if (!task) return res.status(404).json({ message: 'Không tìm thấy công việc.' });

  // Authorization check: Only assignee or leader/admin can edit
  const isAssignee = task.assigneeId === req.user.id;
  const isLeaderOrAdmin = req.user.role === 'admin' || req.user.role === 'leader';

  if (!isAssignee && !isLeaderOrAdmin) {
    return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa công việc này.' });
  }

  const { title, description, assigneeId, deadline, progress, priority, status } = req.body;

  const updates = {};
  if (isLeaderOrAdmin) {
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (assigneeId !== undefined) updates.assigneeId = Number(assigneeId);
    if (deadline !== undefined) updates.deadline = deadline;
    if (priority !== undefined) updates.priority = priority;
  }

  // Both assignee and leader/admin can update progress & status
  if (progress !== undefined) {
    const progVal = Number(progress);
    updates.progress = Math.min(100, Math.max(0, progVal));
    if (updates.progress === 100) {
      updates.status = 'Done';
    } else if (updates.progress > 0 && task.status === 'New') {
      updates.status = 'Active';
    }
  }
  if (status !== undefined) updates.status = status;

  const updated = update('tasks', req.params.id, updates);
  res.json(updated);
});

app.delete('/api/tasks/:id', authenticateToken, requireLeaderOrAdmin, (req, res) => {
  const deleted = remove('tasks', req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Không tìm thấy công việc để xóa.' });
  res.json({ message: 'Xóa công việc thành công.' });
});

// --- GOALS APIS ---
app.get('/api/goals', authenticateToken, (req, res) => {
  const goals = getAll('goals');
  // Return user's own goals or all if leader/admin
  if (req.user.role === 'admin' || req.user.role === 'leader') {
    res.json(goals);
  } else {
    res.json(goals.filter(g => g.userId === req.user.id));
  }
});

app.post('/api/goals', authenticateToken, (req, res) => {
  if (Array.isArray(req.body)) {
    const inserted = req.body.map(item => {
      if (!item.type || !item.content || !item.targetDate) return null;
      return insert('goals', {
        userId: req.user.id,
        type: item.type,
        content: item.content,
        progress: item.progress !== undefined ? Number(item.progress) : 0,
        targetDate: item.targetDate
      });
    }).filter(Boolean);
    return res.status(201).json(inserted);
  }

  const { type, content, progress, targetDate } = req.body;
  if (!type || !content || !targetDate) {
    return res.status(400).json({ message: 'Thiếu thông tin mục tiêu bắt buộc (Loại, Nội dung, Thời hạn).' });
  }

  const newGoal = insert('goals', {
    userId: req.user.id,
    type, // 'day', 'week', 'month'
    content,
    progress: progress !== undefined ? Number(progress) : 0,
    targetDate
  });
  res.status(201).json(newGoal);
});

app.put('/api/goals/:id', authenticateToken, (req, res) => {
  const goal = getById('goals', req.params.id);
  if (!goal) return res.status(404).json({ message: 'Không tìm thấy mục tiêu.' });

  if (goal.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa mục tiêu của người khác.' });
  }

  const { content, progress, targetDate } = req.body;
  const updates = {};
  if (content !== undefined) updates.content = content;
  if (progress !== undefined) updates.progress = Math.min(100, Math.max(0, Number(progress)));
  if (targetDate !== undefined) updates.targetDate = targetDate;

  const updated = update('goals', req.params.id, updates);
  res.json(updated);
});

app.delete('/api/goals/:id', authenticateToken, (req, res) => {
  const goal = getById('goals', req.params.id);
  if (!goal) return res.status(404).json({ message: 'Không tìm thấy mục tiêu.' });

  if (goal.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền xóa mục tiêu của người khác.' });
  }

  remove('goals', req.params.id);
  res.json({ message: 'Xóa mục tiêu thành công.' });
});

// --- WEEKLY REPORTS APIS ---
app.get('/api/reports', authenticateToken, (req, res) => {
  const reports = getAll('reports');
  if (req.user.role === 'admin') {
    res.json(reports);
  } else {
    res.json(reports.filter(r => r.userId === req.user.id));
  }
});

app.post('/api/reports', authenticateToken, (req, res) => {
  const { weekStartDate, doneContent, plannedContent, blockers } = req.body;
  if (!weekStartDate || !doneContent) {
    return res.status(400).json({ message: 'Thiếu thông tin báo cáo bắt buộc (Ngày bắt đầu tuần, Công việc đã làm).' });
  }

  // Check if user already submitted a report for this week
  const reports = getAll('reports');
  const existing = reports.find(r => r.userId === req.user.id && r.weekStartDate === weekStartDate);

  if (existing) {
    // Update existing report
    const updated = update('reports', existing.id, {
      doneContent,
      plannedContent: plannedContent || '',
      blockers: blockers || ''
    });
    return res.json(updated);
  }

  const newReport = insert('reports', {
    userId: req.user.id,
    weekStartDate,
    doneContent,
    plannedContent: plannedContent || '',
    blockers: blockers || ''
  });
  res.status(201).json(newReport);
});

// Trợ lý gọi API Gemini tóm tắt báo cáo tuần
async function summarizeWithGemini(weekStartDate, reportsData) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("Không phát hiện GEMINI_API_KEY. Sử dụng tóm tắt cục bộ.");
    return null;
  }

  let prompt = `Bạn là một AI hỗ trợ tổng hợp báo cáo R&D chuyên nghiệp cho quản trị viên. Dưới đây là dữ liệu báo cáo tuần bắt đầu từ ngày ${weekStartDate} của các kỹ sư. Hãy viết một báo cáo tóm tắt thật ngắn gọn, gọn gàng, súc tích và chuyên nghiệp (viết bằng tiếng Việt).
  Bản tóm tắt PHẢI gồm 3 mục rõ ràng:
  1. TIẾN ĐỘ CHUNG: Đánh giá tổng quan tiến độ của cả đội trong tuần này.
  2. THÀNH TỰU NỔI BẬT: Liệt kê các công việc đã làm xong quan trọng dạng gạch đầu dòng rút gọn.
  3. KHÓ KHĂN & VƯỚNG MẮC: Các blocker đang cản trở tiến độ và hướng xử lý/kiến nghị ngắn gọn.
  
  Báo cáo thô:\n`;

  reportsData.forEach(rep => {
    prompt += `- ${rep.userName} (${rep.departmentName}):\n`;
    prompt += `  + Đã làm: ${rep.doneContent}\n`;
    prompt += `  + Kế hoạch: ${rep.plannedContent}\n`;
    prompt += `  + Khó khăn: ${rep.blockers || 'Không có'}\n\n`;
  });

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    if (response.ok) {
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text.trim();
    }
  } catch (err) {
    console.error("Lỗi gọi Gemini API: ", err);
  }
  return null;
}

// --- ADMIN WEEKLY SUMMARY API ---
app.get('/api/reports/weekly-summary', authenticateToken, requireLeaderOrAdmin, async (req, res) => {
  const { weekStartDate } = req.query;
  if (!weekStartDate) {
    return res.status(400).json({ message: 'Vui lòng cung cấp tham số weekStartDate (YYYY-MM-DD).' });
  }

  const reports = getAll('reports').filter(r => r.weekStartDate === weekStartDate);
  const users = getAll('users');
  const departments = getAll('departments');
  const tasks = getAll('tasks');

  // Summary object
  const summary = {
    weekStartDate,
    totalSubmissions: reports.length,
    departmentsSummary: {},
    completedTasksCount: 0,
    activeTasksCount: 0,
    overdueTasksCount: 0,
    allBlockers: [],
    synthesizedOverview: ''
  };

  // Compile overall statistics for tasks
  const todayStr = new Date().toISOString().split('T')[0];
  tasks.forEach(t => {
    if (t.status === 'Done') {
      summary.completedTasksCount++;
    } else {
      summary.activeTasksCount++;
      if (t.deadline < todayStr) {
        summary.overdueTasksCount++;
      }
    }
  });

  // Group by department
  departments.forEach(dept => {
    summary.departmentsSummary[dept.name] = {
      submittedUsers: [],
      donePoints: [],
      plannedPoints: [],
      blockers: []
    };
  });

  const reportsDataForAI = [];

  reports.forEach(rep => {
    const user = users.find(u => u.id === rep.userId);
    if (!user) return;
    const dept = departments.find(d => d.id === user.departmentId);
    const deptName = dept ? dept.name : 'Khác';

    if (!summary.departmentsSummary[deptName]) {
      summary.departmentsSummary[deptName] = { submittedUsers: [], donePoints: [], plannedPoints: [], blockers: [] };
    }

    summary.departmentsSummary[deptName].submittedUsers.push(user.fullName);
    
    // Split text paragraphs into list points
    const splitPoints = (text) => text ? text.split('\n').map(p => p.trim()).filter(p => p.length > 0) : [];
    
    const done = splitPoints(rep.doneContent).map(p => `${user.fullName}: ${p}`);
    const planned = splitPoints(rep.plannedContent).map(p => `${user.fullName}: ${p}`);
    
    summary.departmentsSummary[deptName].donePoints.push(...done);
    summary.departmentsSummary[deptName].plannedPoints.push(...planned);

    if (rep.blockers && rep.blockers.trim().length > 0) {
      const blk = splitPoints(rep.blockers).map(p => `${user.fullName}: ${p}`);
      summary.departmentsSummary[deptName].blockers.push(...blk);
      summary.allBlockers.push(...blk);
    }

    reportsDataForAI.push({
      userName: user.fullName,
      departmentName: deptName,
      doneContent: rep.doneContent,
      plannedContent: rep.plannedContent,
      blockers: rep.blockers
    });
  });

  // Call Gemini for smart summary
  const geminiSummary = await summarizeWithGemini(weekStartDate, reportsDataForAI);

  if (geminiSummary) {
    summary.synthesizedOverview = geminiSummary;
  } else {
    // Fallback to local rule-based overview
    let overviewText = `Trong tuần từ ${weekStartDate}, có ${reports.length} thành viên nộp báo cáo tuần.\n`;
    overviewText += `Tổng số đầu việc đã hoàn thành: ${summary.completedTasksCount}. Công việc đang thực hiện: ${summary.activeTasksCount}.\n`;
    if (summary.allBlockers.length > 0) {
      overviewText += `CẢNH BÁO: Phát hiện ${summary.allBlockers.length} khó khăn/vướng mắc ảnh hưởng tới tiến độ.`;
    } else {
      overviewText += `Không có khó khăn lớn nào được ghi nhận từ nhân viên.`;
    }
    summary.synthesizedOverview = overviewText;
  }

  res.json(summary);
});

// --- EXPORT WEEKLY REPORT TO DOC ---
app.get('/api/reports/export-doc', authenticateToken, requireLeaderOrAdmin, (req, res) => {
  const { weekStartDate } = req.query;
  if (!weekStartDate) {
    return res.status(400).json({ message: 'Vui lòng cung cấp tham số weekStartDate (YYYY-MM-DD).' });
  }

  const reports = getAll('reports').filter(r => r.weekStartDate === weekStartDate);
  const users = getAll('users');
  const departments = getAll('departments');
  const tasks = getAll('tasks');

  // Gather stats
  const completedTasks = tasks.filter(t => t.status === 'Done');
  const activeBlockers = reports.filter(r => r.blockers && r.blockers.trim().length > 0);

  // Intelligent Simulated AI synthesis summary
  let aiOverview = `Báo cáo hoạt động nghiên cứu & phát triển (R&D) nội bộ tuần bắt đầu từ ngày ${weekStartDate}.\n`;
  aiOverview += `Hệ thống ghi nhận tổng số ${reports.length} báo cáo tuần từ các phòng ban. `;
  
  if (completedTasks.length > 0) {
    aiOverview += `Tiến độ chung đạt hiệu quả tốt với việc hoàn thành ${completedTasks.length} đầu mục công việc chính. `;
  }
  
  if (activeBlockers.length > 0) {
    aiOverview += `CẢNH BÁO: Đội ngũ đang gặp một số vướng mắc chính liên quan đến ${activeBlockers.length} vấn đề. Cần Trưởng nhóm (Leader) hỗ trợ giải quyết sớm để không ảnh hưởng deadline.`;
  } else {
    aiOverview += `Mọi luồng công việc đang vận hành trơn tru và không ghi nhận khó khăn hay vật cản (blockers) nào từ nhân viên.`;
  }

  let html = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <title>Bao cao tuan - R&D Team</title>
    <meta charset="utf-8">
    <style>
      body {
        font-family: 'Times New Roman', Times, serif;
        line-height: 1.6;
        color: #111827;
        margin: 40px;
      }
      .header-title {
        text-align: center;
        font-size: 18pt;
        font-weight: bold;
        color: #1e3a8a;
        margin-bottom: 5px;
        text-transform: uppercase;
      }
      .header-subtitle {
        text-align: center;
        font-size: 11pt;
        font-style: italic;
        color: #4b5563;
        margin-bottom: 25px;
      }
      .divider {
        border-bottom: 2px double #1e3a8a;
        margin-bottom: 25px;
      }
      .section-heading {
        font-size: 13pt;
        font-weight: bold;
        color: #1e3a8a;
        margin-top: 25px;
        margin-bottom: 10px;
        text-transform: uppercase;
      }
      .ai-box {
        background-color: #f3f4f6;
        border-left: 5px solid #6366f1;
        padding: 15px;
        margin-bottom: 20px;
        font-size: 11pt;
      }
      .blocker-box {
        background-color: #fef2f2;
        border-left: 5px solid #ef4444;
        padding: 15px;
        margin-bottom: 20px;
        color: #991b1b;
        font-size: 11pt;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
        margin-bottom: 25px;
      }
      th {
        background-color: #f3f4f6;
        color: #1e3a8a;
        border: 1px solid #9ca3af;
        padding: 10px;
        font-size: 11pt;
        font-weight: bold;
        text-align: left;
      }
      td {
        border: 1px solid #d1d5db;
        padding: 10px;
        font-size: 10.5pt;
        vertical-align: top;
      }
      ul {
        margin: 0;
        padding-left: 20px;
      }
      li {
        margin-bottom: 5px;
      }
      .signature-row {
        margin-top: 50px;
        display: table;
        width: 100%;
      }
      .signature-col {
        display: table-cell;
        width: 50%;
        text-align: center;
        font-size: 11pt;
      }
    </style>
  </head>
  <body>
    <div class="header-title">BÁO CÁO TỔNG HỢP TIẾN ĐỘ TUẦN</div>
    <div class="header-subtitle">Tuần bắt đầu từ ngày: ${weekStartDate} | Đơn vị: R&D Team</div>
    <div class="divider"></div>

    <div class="section-heading">I. TÓM TẮT TỔNG QUAN (AI SYNTHESIS OVERVIEW)</div>
    <div class="ai-box">
      <strong>[Đánh giá tự động]:</strong><br/>
      ${aiOverview.replace(/\n/g, '<br/>')}
    </div>

    ${activeBlockers.length > 0 ? `
    <div class="section-heading" style="color:#ef4444;">II. CÁC KHÓ KHĂN & VƯỚNG MẮC CHÍNH (BLOCKERS)</div>
    <div class="blocker-box">
      <ul>
        ${activeBlockers.map(r => {
          const u = users.find(user => user.id === r.userId);
          return `<li><strong>${u ? u.fullName : 'Thành viên'} (${departments.find(d => d.id === u.departmentId)?.name || 'R&D'}):</strong> ${r.blockers.replace(/\n/g, ' ')}</li>`;
        }).join('')}
      </ul>
    </div>
    ` : ''}

    <div class="section-heading">III. BÁO CÁO CHI TIẾT THEO PHÒNG BAN</div>
    <table>
      <thead>
        <tr>
          <th style="width: 25%">Phòng ban & Nhân sự</th>
          <th style="width: 40%">Công việc đã hoàn thành (Done)</th>
          <th style="width: 35%">Kế hoạch tuần tiếp theo (Planned)</th>
        </tr>
      </thead>
      <tbody>
        ${departments.map(dept => {
          const deptReports = reports.filter(r => {
            const u = users.find(user => user.id === r.userId);
            return u && u.departmentId === dept.id;
          });
          if (deptReports.length === 0) return '';
          
          return `
          <tr>
            <td>
              <strong>${dept.name}</strong><br/>
              <span style="font-size: 9pt; color: #6b7280; font-style: italic;">
                Thành viên: ${deptReports.map(r => users.find(u => u.id === r.userId)?.fullName).join(', ')}
              </span>
            </td>
            <td>
              <ul>
                ${deptReports.map(r => {
                  const u = users.find(user => user.id === r.userId);
                  return r.doneContent.split('\n').filter(p => p.trim().length > 0).map(p => `<li>[${u ? u.fullName : 'NV'}] ${p}</li>`).join('');
                }).join('')}
              </ul>
            </td>
            <td>
              <ul>
                ${deptReports.map(r => {
                  const u = users.find(user => user.id === r.userId);
                  return r.plannedContent.split('\n').filter(p => p.trim().length > 0).map(p => `<li>[${u ? u.fullName : 'NV'}] ${p}</li>`).join('');
                }).join('')}
              </ul>
            </td>
          </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="signature-row">
      <div class="signature-col">
        <strong>NGƯỜI LẬP BÁO CÁO</strong><br/>
        <span style="font-size:9pt; color:#6b7280; font-style:italic;">(Ký, ghi rõ họ tên)</span>
        <br/><br/><br/><br/>
        <strong>Hệ thống quản lý PM</strong>
      </div>
      <div class="signature-col">
        <strong>BAN GIÁM ĐỐC / ADMIN DUYỆT</strong><br/>
        <span style="font-size:9pt; color:#6b7280; font-style:italic;">(Ký, ghi rõ họ tên)</span>
        <br/><br/><br/><br/>
        <strong>Quản trị viên hệ thống</strong>
      </div>
    </div>
  </body>
  </html>
  `;

  res.setHeader('Content-Type', 'application/msword');
  res.setHeader('Content-Disposition', `attachment; filename="Bao_Cao_Tuan_${weekStartDate}.doc"`);
  res.send(html);
});

// Bind to 0.0.0.0 to allow access from local IP (Wifi / LAN)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`==================================================`);
  console.log(`Backend Server đang chạy thành công tại:`);
  console.log(`- Localhost:  http://localhost:${PORT}`);
  console.log(`- Mạng nội bộ: http://0.0.0.0:${PORT}`);
  console.log(`==================================================`);
});
