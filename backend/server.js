import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, getAll, getById, insert, update, remove } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env configuration
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length > 1) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      process.env[key] = val;
    }
  });
}


const app = express();
const PORT = process.env.PORT || 30001;
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
    user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role, departmentId: user.departmentId, telegramChatId: user.telegramChatId || null }
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { username, password, fullName, departmentId } = req.body;
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
    departmentId: departmentId ? Number(departmentId) : 1,
    isApproved: false
  });

  const { passwordHash: _, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = getById('users', req.user.id);
  if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
  res.json({ id: user.id, username: user.username, fullName: user.fullName, role: user.role, departmentId: user.departmentId, telegramChatId: user.telegramChatId || null });
});

app.get('/api/telegram/config', authenticateToken, (req, res) => {
  res.json({
    botUsername: process.env.TELEGRAM_BOT_USERNAME || 'pm_system_alert_bot',
    isConfigured: !!process.env.TELEGRAM_BOT_TOKEN
  });
});

// --- DEPARTMENTS APIS ---
app.get('/api/departments', authenticateToken, (req, res) => {
  res.json(getAll('departments'));
});

// --- USERS MANAGEMENT APIS ---
app.get('/api/users', authenticateToken, (req, res) => {
  const users = getAll('users')
    .filter(u => req.user.role === 'admin' || u.departmentId === req.user.departmentId)
    .map(u => {
      const { passwordHash, ...safeUser } = u;
      return safeUser;
    });
  res.json(users);
});

app.post('/api/users', authenticateToken, requireLeaderOrAdmin, async (req, res) => {
  const { username, password, fullName, role, departmentId } = req.body;
  if (!username || !password || !fullName || !role || !departmentId) {
    return res.status(400).json({ message: 'Thiếu thông tin người dùng bắt buộc.' });
  }

  if (req.user.role === 'leader') {
    if (Number(departmentId) !== req.user.departmentId) {
      return res.status(403).json({ message: 'Trưởng nhóm chỉ được tạo tài khoản trong bộ phận của mình.' });
    }
    if (role === 'admin') {
      return res.status(403).json({ message: 'Trưởng nhóm không có quyền tạo tài khoản Admin.' });
    }
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
  // If leader, they can see pending users since they don't have department assigned yet, but can only approve to their own department
  const users = getAll('users').filter(u => u.isApproved === false);
  const safeUsers = users.map(u => {
    const { passwordHash, ...safeUser } = u;
    return safeUser;
  });
  res.json(safeUsers);
});

app.put('/api/users/:id/approve', authenticateToken, requireLeaderOrAdmin, (req, res) => {
  const { role, departmentId } = req.body;
  if (!role || !departmentId) {
    return res.status(400).json({ message: 'Thiếu thông tin phân quyền và phòng ban duyệt.' });
  }

  if (req.user.role === 'leader') {
    if (Number(departmentId) !== req.user.departmentId) {
      return res.status(403).json({ message: 'Trưởng nhóm chỉ được phê duyệt tài khoản vào bộ phận của mình.' });
    }
    if (role === 'admin') {
      return res.status(403).json({ message: 'Trưởng nhóm không có quyền phê duyệt tài khoản Admin.' });
    }
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

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  const targetUser = getById('users', req.params.id);
  if (!targetUser) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

  const isSelf = targetUser.id === req.user.id;
  const isAdmin = req.user.role === 'admin';
  const isLeaderOfSameDept = req.user.role === 'leader' && targetUser.role === 'employee' && targetUser.departmentId === req.user.departmentId;

  if (!isSelf && !isAdmin && !isLeaderOfSameDept) {
    return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa tài khoản này.' });
  }

  const { fullName, username, role, departmentId, password } = req.body;

  const updates = {};
  if (fullName !== undefined) updates.fullName = fullName;
  if (username !== undefined) updates.username = username;

  if (role !== undefined) {
    if (isAdmin) {
      updates.role = role;
    } else if (isLeaderOfSameDept) {
      if (role === 'admin') {
        return res.status(403).json({ message: 'Trưởng nhóm không có quyền nâng cấp tài khoản lên Admin.' });
      }
      updates.role = role;
    } else {
      if (role !== targetUser.role) {
        return res.status(403).json({ message: 'Bạn không có quyền tự thay đổi vai trò của mình.' });
      }
    }
  }

  if (departmentId !== undefined) {
    if (isAdmin) {
      updates.departmentId = Number(departmentId);
    } else {
      if (Number(departmentId) !== targetUser.departmentId) {
        return res.status(403).json({ message: 'Bạn không có quyền thay đổi phòng ban.' });
      }
    }
  }

  if (password) {
    const salt = await bcrypt.genSalt(10);
    updates.passwordHash = await bcrypt.hash(password, salt);
  }

  const updated = update('users', req.params.id, updates);
  const { passwordHash: _, ...safeUser } = updated;
  res.json(safeUser);
});

app.delete('/api/users/:id', authenticateToken, (req, res) => {
  const targetUser = getById('users', req.params.id);
  if (!targetUser) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

  const isAdmin = req.user.role === 'admin';
  const isLeaderOfSameDept = req.user.role === 'leader' && targetUser.role === 'employee' && targetUser.departmentId === req.user.departmentId;

  if (!isAdmin && !isLeaderOfSameDept) {
    return res.status(403).json({ message: 'Bạn không có quyền xóa tài khoản này.' });
  }

  if (targetUser.id === req.user.id) {
    return res.status(400).json({ message: 'Bạn không thể tự xóa tài khoản của chính mình.' });
  }

  const deleted = remove('users', req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Lỗi khi xóa người dùng.' });
  res.json({ message: 'Xóa tài khoản thành công.' });
});

app.post('/api/users/unlink-telegram', authenticateToken, (req, res) => {
  const updated = update('users', req.user.id, { telegramChatId: null });
  if (!updated) return res.status(500).json({ message: 'Không thể hủy liên kết Telegram.' });

  const { passwordHash, ...safeUser } = updated;
  res.json({ message: 'Đã hủy liên kết Telegram thành công.', user: safeUser });
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
  const existing = getById('projects', req.params.id);
  if (!existing) return res.status(404).json({ message: 'Không tìm thấy dự án.' });

  const { name, description, status } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;

  const updated = update('projects', req.params.id, updates);
  res.json(updated);
});

app.delete('/api/projects/:id', authenticateToken, requireLeaderOrAdmin, (req, res) => {
  const project = getById('projects', req.params.id);
  if (!project) return res.status(404).json({ message: 'Không tìm thấy dự án.' });

  if (project.creatorId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền xóa dự án này.' });
  }

  const deleted = remove('projects', req.params.id);
  if (!deleted) return res.status(500).json({ message: 'Lỗi khi xóa dự án.' });
  res.json({ message: 'Xóa dự án thành công.' });
});

// --- TASKS APIS ---
function escapeHtml(text) {
  if (!text) return '';
  return text
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function sendTelegramAlert(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.log(`[Telegram Alert (Not Configured)]: ${message}`);
    return;
  }
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`Telegram API global error: Status ${res.status} - ${errText}`);
    }
  } catch (err) {
    console.error(`Lỗi kết nối Telegram API:`, err);
  }
}

async function sendPersonalTelegramAlert(userId, message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  const userObj = getById('users', userId);
  if (!userObj || !userObj.telegramChatId) {
    // Fallback to global chat
    console.log(`[Telegram Personal (Not Linked for user ID ${userId})]: ${message}`);
    await sendTelegramAlert(message);
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: userObj.telegramChatId, text: message, parse_mode: 'HTML' })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`Telegram API personal error for user ${userId}: Status ${res.status} - ${errText}`);
    }
  } catch (err) {
    console.error(`Lỗi gửi Telegram cho user ${userId}:`, err);
  }
}

async function notifyTaskEvent(taskObj, titlePrefix, detailsText, actorId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  const proj = getById('projects', taskObj.projectId);
  
  const escapedTitlePrefix = escapeHtml(titlePrefix);
  const escapedProjName = escapeHtml(proj ? proj.name : 'N/A');
  const escapedTaskTitle = escapeHtml(taskObj.title);
  
  const message = `<b>${escapedTitlePrefix}</b>\nDự án: <b>${escapedProjName}</b>\nTask: <b>${escapedTaskTitle}</b>\n${detailsText}`;

  const userIdsToNotify = new Set();
  
  // 1. Assignee (if not the actor)
  if (taskObj.assigneeId && taskObj.assigneeId !== actorId) {
    userIdsToNotify.add(taskObj.assigneeId);
  }
  // 2. Creator (if not the actor)
  if (taskObj.createdBy && taskObj.createdBy !== actorId) {
    userIdsToNotify.add(taskObj.createdBy);
  }
  
  // 3. Managers/Admins
  const users = getAll('users');
  users.forEach(u => {
    if (u.id !== actorId) {
      if (u.role === 'admin' || (u.role === 'leader' && u.departmentId === taskObj.departmentId)) {
        userIdsToNotify.add(u.id);
      }
    }
  });

  // 4. Also notify the actor themselves for confirmation if they are admin/leader
  const actor = getById('users', actorId);
  if (actor && (actor.role === 'admin' || actor.role === 'leader')) {
    userIdsToNotify.add(actorId);
  }

  for (const uid of userIdsToNotify) {
    await sendPersonalTelegramAlert(uid, message);
  }

  await sendTelegramAlert(message);
}

async function notifyGoalEvent(goalObj, titlePrefix, detailsText, actorId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  const users = getAll('users');
  const owner = users.find(u => u.id === goalObj.userId);
  if (!owner) return;

  const escapedTitlePrefix = escapeHtml(titlePrefix);
  const escapedOwnerName = escapeHtml(owner.fullName);
  const escapedContent = escapeHtml(goalObj.content);
  
  let typeVietnamese = 'Ngày';
  if (goalObj.type === 'week') typeVietnamese = 'Tuần';
  else if (goalObj.type === 'month') typeVietnamese = 'Tháng';

  const message = `<b>${escapedTitlePrefix}</b>\nLoại mục tiêu: <b>Mục tiêu ${typeVietnamese}</b>\nNhân sự: <b>${escapedOwnerName}</b>\nNội dung: <b>${escapedContent}</b>\n${detailsText}`;

  const userIdsToNotify = new Set();

  if (goalObj.userId && goalObj.userId !== actorId) {
    userIdsToNotify.add(goalObj.userId);
  }

  users.forEach(u => {
    if (u.id !== actorId) {
      if (u.role === 'leader' && u.departmentId === owner.departmentId) {
        userIdsToNotify.add(u.id);
      }
      if (u.role === 'admin') {
        userIdsToNotify.add(u.id);
      }
    }
  });

  const actor = users.find(u => u.id === actorId);
  if (actor && (actor.role === 'admin' || actor.role === 'leader')) {
    userIdsToNotify.add(actorId);
  }

  for (const uid of userIdsToNotify) {
    await sendPersonalTelegramAlert(uid, message);
  }

  await sendTelegramAlert(message);
}

app.get('/api/tasks', authenticateToken, (req, res) => {
  const tasks = getAll('tasks');
  if (req.user.role === 'leader') {
    return res.json(tasks.filter(t => t.departmentId === req.user.departmentId));
  }
  res.json(tasks);
});

app.post('/api/tasks', authenticateToken, requireLeaderOrAdmin, (req, res) => {
  const { projectId, title, description, assigneeId, dueDate, priority, sprintId, departmentId, parentTaskId, estimate, status } = req.body;
  if (!projectId || !title || !assigneeId) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ các trường bắt buộc (Dự án, Tiêu đề, Người thực hiện).' });
  }

  const newTask = insert('tasks', {
    projectId: Number(projectId),
    sprintId: sprintId ? Number(sprintId) : null,
    departmentId: departmentId ? Number(departmentId) : 1,
    parentTaskId: parentTaskId ? Number(parentTaskId) : null,
    title,
    description: description || '',
    assigneeId: Number(assigneeId),
    dueDate: dueDate || '',
    estimate: estimate ? Number(estimate) : 0,
    progress: 0,
    priority: priority || 'Medium',
    status: status || 'To Do',
    createdBy: req.user.id
  });

  const assignee = getById('users', Number(assigneeId));
  notifyTaskEvent(newTask, "[Nhiệm vụ mới] Giao việc", `Người giao: <b>${req.user.fullName}</b>\nThực hiện: <b>${assignee ? assignee.fullName : 'Chưa rõ'}</b>\nHạn chót: <b>${dueDate || 'N/A'}</b>`, req.user.id);

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

  const { title, description, assigneeId, dueDate, progress, priority, status, sprintId, departmentId, parentTaskId, estimate } = req.body;

  const updates = {};
  if (isLeaderOrAdmin) {
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (assigneeId !== undefined) updates.assigneeId = Number(assigneeId);
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (priority !== undefined) updates.priority = priority;
    if (sprintId !== undefined) updates.sprintId = sprintId ? Number(sprintId) : null;
    if (departmentId !== undefined) updates.departmentId = Number(departmentId);
    if (parentTaskId !== undefined) updates.parentTaskId = parentTaskId ? Number(parentTaskId) : null;
    if (estimate !== undefined) updates.estimate = Number(estimate);
  }

  // Both assignee and leader/admin can update progress & status
  if (progress !== undefined) {
    const progVal = Number(progress);
    updates.progress = Math.min(100, Math.max(0, progVal));
    if (updates.progress === 100) {
      updates.status = 'Done';
    } else if (updates.progress > 0 && task.status === 'To Do') {
      updates.status = 'In Progress';
    }
  }
  if (status !== undefined) {
    updates.status = status;
    if (status === 'Done') {
      updates.progress = 100;
    }
  }

  const updated = update('tasks', req.params.id, updates);
  const proj = getById('projects', updated.projectId);
  const assignee = getById('users', updated.assigneeId);

  if (updates.status === 'Done' && task.status !== 'Done') {
    notifyTaskEvent(updated, "[Nhiệm vụ hoàn thành] ✔️", `Hoàn thành bởi: <b>${req.user.fullName}</b>\nNgười thực hiện: <b>${assignee ? assignee.fullName : 'Chưa rõ'}</b>`, req.user.id);
  } else {
    notifyTaskEvent(updated, "[Cập nhật Nhiệm vụ] 🔄", `Cập nhật bởi: <b>${req.user.fullName}</b>\nTrạng thái mới: <b>${updated.status}</b>\nTiến độ mới: <b>${updated.progress}%</b>`, req.user.id);
  }

  res.json(updated);
});

app.delete('/api/tasks/:id', authenticateToken, requireLeaderOrAdmin, (req, res) => {
  const deleted = remove('tasks', req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Không tìm thấy công việc để xóa.' });
  res.json({ message: 'Xóa công việc thành công.' });
});

// --- SPRINTS APIS ---
app.get('/api/sprints', authenticateToken, (req, res) => {
  res.json(getAll('sprints'));
});

app.post('/api/sprints', authenticateToken, requireLeaderOrAdmin, (req, res) => {
  const { projectId, name, goal, startDate, endDate, status } = req.body;
  if (!projectId || !name) {
    return res.status(400).json({ message: 'Vui lòng cung cấp Dự án và Tên Sprint.' });
  }

  const newSprint = insert('sprints', {
    projectId: Number(projectId),
    name,
    goal: goal || '',
    startDate: startDate || '',
    endDate: endDate || '',
    status: status || 'Planned'
  });
  res.status(201).json(newSprint);
});

app.put('/api/sprints/:id', authenticateToken, requireLeaderOrAdmin, (req, res) => {
  const existing = getById('sprints', req.params.id);
  if (!existing) return res.status(404).json({ message: 'Không tìm thấy Sprint.' });

  const { name, goal, startDate, endDate, status, projectId } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (goal !== undefined) updates.goal = goal;
  if (startDate !== undefined) updates.startDate = startDate;
  if (endDate !== undefined) updates.endDate = endDate;
  if (status !== undefined) updates.status = status;
  if (projectId !== undefined) updates.projectId = Number(projectId);

  const updated = update('sprints', req.params.id, updates);
  res.json(updated);
});

app.delete('/api/sprints/:id', authenticateToken, requireLeaderOrAdmin, (req, res) => {
  const deleted = remove('sprints', req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Không tìm thấy Sprint để xóa.' });
  res.json({ message: 'Xóa Sprint thành công.' });
});

// --- STANDUPS APIS ---
app.get('/api/standups', authenticateToken, (req, res) => {
  const { projectId, date } = req.query;
  let standups = getAll('standups');
  if (projectId) {
    standups = standups.filter(s => s.projectId === Number(projectId));
  }
  if (date) {
    standups = standups.filter(s => s.date === date);
  }
  res.json(standups);
});

app.post('/api/standups', authenticateToken, (req, res) => {
  const { projectId, date, completedWork, planToday, blockers } = req.body;
  if (!projectId || !completedWork || !planToday) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin Standup.' });
  }

  const newStandup = insert('standups', {
    userId: req.user.id,
    projectId: Number(projectId),
    date: date || new Date().toISOString().split('T')[0],
    completedWork,
    planToday,
    blockers: blockers || 'Không có'
  });
  res.status(201).json(newStandup);
});

// --- GOALS APIS ---
app.get('/api/goals', authenticateToken, (req, res) => {
  const goals = getAll('goals');
  const users = getAll('users');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const updatedGoals = goals.map(g => {
    if (g.progress < 100 && g.targetDate < todayStr && g.status !== 'Overdue') {
      g.status = 'Overdue';
      update('goals', g.id, { status: 'Overdue' });
    } else if (g.progress === 100 && g.status !== 'Completed') {
      g.status = 'Completed';
      update('goals', g.id, { status: 'Completed' });
    } else if (g.progress < 100 && g.targetDate >= todayStr && g.status === 'Overdue') {
      g.status = 'Pending';
      update('goals', g.id, { status: 'Pending' });
    }
    return g;
  });

  if (req.user.role === 'admin') {
    res.json(updatedGoals);
  } else if (req.user.role === 'leader') {
    const myDept = req.user.departmentId;
    const filtered = updatedGoals.filter(g => {
      const owner = users.find(u => u.id === g.userId);
      return g.userId === req.user.id || (owner && owner.departmentId === myDept);
    });
    res.json(filtered);
  } else {
    res.json(updatedGoals.filter(g => g.userId === req.user.id));
  }
});

app.post('/api/goals', authenticateToken, (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];

  if (Array.isArray(req.body)) {
    const inserted = req.body.map(item => {
      if (!item.type || !item.content || !item.targetDate) return null;
      const prog = item.progress !== undefined ? Number(item.progress) : 0;
      let stat = 'Pending';
      if (prog === 100) stat = 'Completed';
      else if (item.targetDate < todayStr) stat = 'Overdue';

      const g = insert('goals', {
        userId: req.user.id,
        type: item.type,
        content: item.content,
        progress: prog,
        status: stat,
        targetDate: item.targetDate,
        createdAt: todayStr
      });

      notifyGoalEvent(g, "[Mục tiêu mới] 🎯", `Người tạo: <b>${req.user.fullName}</b>\nHạn chót: <b>${g.targetDate}</b>`, req.user.id);
      return g;
    }).filter(Boolean);
    return res.status(201).json(inserted);
  }

  const { type, content, progress, targetDate } = req.body;
  if (!type || !content || !targetDate) {
    return res.status(400).json({ message: 'Thiếu thông tin mục tiêu bắt buộc (Loại, Nội dung, Thời hạn).' });
  }

  const prog = progress !== undefined ? Number(progress) : 0;
  let stat = 'Pending';
  if (prog === 100) stat = 'Completed';
  else if (targetDate < todayStr) stat = 'Overdue';

  const newGoal = insert('goals', {
    userId: req.user.id,
    type,
    content,
    progress: prog,
    status: stat,
    targetDate,
    createdAt: todayStr
  });

  notifyGoalEvent(newGoal, "[Mục tiêu mới] 🎯", `Người tạo: <b>${req.user.fullName}</b>\nHạn chót: <b>${newGoal.targetDate}</b>`, req.user.id);
  res.status(201).json(newGoal);
});

app.put('/api/goals/:id', authenticateToken, (req, res) => {
  const goal = getById('goals', req.params.id);
  if (!goal) return res.status(404).json({ message: 'Không tìm thấy mục tiêu.' });

  const users = getAll('users');
  const owner = users.find(u => u.id === goal.userId);
  const isOwner = goal.userId === req.user.id;
  const isAdmin = req.user.role === 'admin';
  const isLeaderOfSameDept = req.user.role === 'leader' && owner && owner.departmentId === req.user.departmentId;

  if (!isOwner && !isAdmin && !isLeaderOfSameDept) {
    return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa mục tiêu của người khác.' });
  }

  const { content, progress, targetDate, status } = req.body;
  const updates = {};
  if (content !== undefined) updates.content = content;
  if (targetDate !== undefined) updates.targetDate = targetDate;
  
  if (progress !== undefined) {
    const p = Math.min(100, Math.max(0, Number(progress)));
    updates.progress = p;
    if (p === 100) {
      updates.status = 'Completed';
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      const tDate = targetDate || goal.targetDate;
      updates.status = tDate < todayStr ? 'Overdue' : 'Pending';
    }
  }
  
  if (status !== undefined) {
    updates.status = status;
    if (status === 'Completed') {
      updates.progress = 100;
    }
  }

  const updated = update('goals', req.params.id, updates);
  notifyGoalEvent(updated, "[Cập nhật Mục tiêu] 🔄", `Cập nhật bởi: <b>${req.user.fullName}</b>\nTiến độ: <b>${updated.progress}%</b>\nTrạng thái: <b>${updated.status}</b>`, req.user.id);
  res.json(updated);
});

app.delete('/api/goals/:id', authenticateToken, (req, res) => {
  const goal = getById('goals', req.params.id);
  if (!goal) return res.status(404).json({ message: 'Không tìm thấy mục tiêu.' });

  const users = getAll('users');
  const owner = users.find(u => u.id === goal.userId);
  const isOwner = goal.userId === req.user.id;
  const isAdmin = req.user.role === 'admin';
  const isLeaderOfSameDept = req.user.role === 'leader' && owner && owner.departmentId === req.user.departmentId;

  if (!isOwner && !isAdmin && !isLeaderOfSameDept) {
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

  const start = new Date(weekStartDate);
  const end = new Date(weekStartDate);
  end.setDate(end.getDate() + 6);
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  const reports = getAll('reports').filter(r => r.weekStartDate === weekStartDate);
  const standups = getAll('standups').filter(s => s.date >= startStr && s.date <= endStr);
  const users = getAll('users');
  const departments = getAll('departments');
  const tasks = getAll('tasks');
  const procurements = getAll('procurements');

  const summary = {
    weekStartDate,
    totalSubmissions: reports.length,
    departmentsSummary: {},
    completedTasksCount: 0,
    activeTasksCount: 0,
    overdueTasksCount: 0,
    allBlockers: [],
    synthesizedOverview: '',
    totalApprovedBOMCost: 0,
    totalPendingBOMCost: 0,
    totalOrderedBOMCost: 0
  };

  const todayStr = new Date().toISOString().split('T')[0];
  tasks.forEach(t => {
    if (t.status === 'Done') {
      summary.completedTasksCount++;
    } else {
      summary.activeTasksCount++;
      if (t.dueDate && t.dueDate < todayStr) {
        summary.overdueTasksCount++;
      }
    }
  });

  summary.totalApprovedBOMCost = procurements.filter(p => p.status === 'Approved').reduce((acc, p) => acc + Number(p.estimatedPrice) * Number(p.quantity), 0);
  summary.totalPendingBOMCost = procurements.filter(p => p.status === 'Pending').reduce((acc, p) => acc + Number(p.estimatedPrice) * Number(p.quantity), 0);
  summary.totalOrderedBOMCost = procurements.filter(p => p.status === 'Ordered').reduce((acc, p) => acc + Number(p.estimatedPrice) * Number(p.quantity), 0);

  departments.forEach(dept => {
    summary.departmentsSummary[dept.name] = {
      submittedUsers: [],
      donePoints: [],
      plannedPoints: [],
      blockers: []
    };
  });

  const reportsDataForAI = [];
  const splitPoints = (text) => text ? text.split('\n').map(p => p.trim()).filter(p => p.length > 0) : [];

  reports.forEach(rep => {
    const user = users.find(u => u.id === rep.userId);
    if (!user) return;
    const dept = departments.find(d => d.id === user.departmentId);
    const deptName = dept ? dept.name : 'Khác';

    if (!summary.departmentsSummary[deptName]) {
      summary.departmentsSummary[deptName] = { submittedUsers: [], donePoints: [], plannedPoints: [], blockers: [] };
    }

    if (!summary.departmentsSummary[deptName].submittedUsers.includes(user.fullName)) {
      summary.departmentsSummary[deptName].submittedUsers.push(user.fullName);
    }
    
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

  standups.forEach(std => {
    const user = users.find(u => u.id === std.userId);
    if (!user) return;
    const dept = departments.find(d => d.id === user.departmentId);
    const deptName = dept ? dept.name : 'Khác';

    if (!summary.departmentsSummary[deptName]) {
      summary.departmentsSummary[deptName] = { submittedUsers: [], donePoints: [], plannedPoints: [], blockers: [] };
    }

    if (!summary.departmentsSummary[deptName].submittedUsers.includes(user.fullName)) {
      summary.departmentsSummary[deptName].submittedUsers.push(user.fullName);
    }

    const done = splitPoints(std.completedWork).map(p => `${user.fullName} (Standup ${std.date}): ${p}`);
    const planned = splitPoints(std.planToday).map(p => `${user.fullName} (Standup ${std.date}): ${p}`);

    summary.departmentsSummary[deptName].donePoints.push(...done);
    summary.departmentsSummary[deptName].plannedPoints.push(...planned);

    if (std.blockers && std.blockers.trim().length > 0 && std.blockers !== 'Không có' && std.blockers !== 'Không') {
      const blk = splitPoints(std.blockers).map(p => `${user.fullName} (Standup ${std.date}): ${p}`);
      summary.departmentsSummary[deptName].blockers.push(...blk);
      summary.allBlockers.push(...blk);
    }
  });

  const geminiSummary = await summarizeWithGemini(weekStartDate, reportsDataForAI);

  if (geminiSummary) {
    summary.synthesizedOverview = geminiSummary;
  } else {
    let overviewText = `Trong tuần từ ${weekStartDate}, ghi nhận báo cáo và check-in R&D từ ${reports.length} thành viên.\n`;
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
  const { weekStartDate, remarks } = req.query;
  if (!weekStartDate) {
    return res.status(400).json({ message: 'Vui lòng cung cấp tham số weekStartDate (YYYY-MM-DD).' });
  }

  const start = new Date(weekStartDate);
  const end = new Date(weekStartDate);
  end.setDate(end.getDate() + 6);
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  const reports = getAll('reports').filter(r => r.weekStartDate === weekStartDate);
  const standups = getAll('standups').filter(s => s.date >= startStr && s.date <= endStr);
  const users = getAll('users');
  const departments = getAll('departments');
  const procurements = getAll('procurements');

  const activeBlockers = [];
  const splitPoints = (text) => text ? text.split('\n').map(p => p.trim()).filter(p => p.length > 0) : [];

  reports.forEach(r => {
    const u = users.find(user => user.id === r.userId);
    if (r.blockers && r.blockers.trim().length > 0) {
      activeBlockers.push({ userName: u ? u.fullName : 'NV', text: r.blockers });
    }
  });
  
  standups.forEach(s => {
    const u = users.find(user => user.id === s.userId);
    if (s.blockers && s.blockers.trim().length > 0 && s.blockers !== 'Không có' && s.blockers !== 'Không') {
      activeBlockers.push({ userName: u ? u.fullName : 'NV (Standup ' + s.date + ')', text: s.blockers });
    }
  });

  const totalApprovedBOMCost = procurements.filter(p => p.status === 'Approved').reduce((acc, p) => acc + Number(p.estimatedPrice) * Number(p.quantity), 0);
  const totalPendingBOMCost = procurements.filter(p => p.status === 'Pending').reduce((acc, p) => acc + Number(p.estimatedPrice) * Number(p.quantity), 0);

  const departmentsSummary = {};
  departments.forEach(dept => {
    departmentsSummary[dept.name] = {
      submittedUsers: [],
      donePoints: [],
      plannedPoints: []
    };
  });

  reports.forEach(rep => {
    const user = users.find(u => u.id === rep.userId);
    if (!user) return;
    const dept = departments.find(d => d.id === user.departmentId);
    const deptName = dept ? dept.name : 'Khác';

    if (!departmentsSummary[deptName].submittedUsers.includes(user.fullName)) {
      departmentsSummary[deptName].submittedUsers.push(user.fullName);
    }
    departmentsSummary[deptName].donePoints.push(...splitPoints(rep.doneContent).map(p => `${user.fullName}: ${p}`));
    departmentsSummary[deptName].plannedPoints.push(...splitPoints(rep.plannedContent).map(p => `${user.fullName}: ${p}`));
  });

  standups.forEach(std => {
    const user = users.find(u => u.id === std.userId);
    if (!user) return;
    const dept = departments.find(d => d.id === user.departmentId);
    const deptName = dept ? dept.name : 'Khác';

    if (!departmentsSummary[deptName].submittedUsers.includes(user.fullName)) {
      departmentsSummary[deptName].submittedUsers.push(user.fullName);
    }
    departmentsSummary[deptName].donePoints.push(...splitPoints(std.completedWork).map(p => `${user.fullName} (Daily ${std.date}): ${p}`));
    departmentsSummary[deptName].plannedPoints.push(...splitPoints(std.planToday).map(p => `${user.fullName} (Daily ${std.date}): ${p}`));
  });

  let html = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <title>Báo cáo tuần R&D</title>
    <meta charset="utf-8">
    <style>
      body {
        font-family: 'Times New Roman', Times, serif;
        line-height: 1.6;
        color: #000;
        margin: 40px;
      }
      .header-table {
        width: 100%;
        border: none;
        margin-bottom: 20px;
      }
      .header-table td {
        border: none;
        padding: 0;
        font-size: 11pt;
      }
      .title-box {
        text-align: center;
        margin-top: 30px;
        margin-bottom: 30px;
      }
      .main-title {
        font-size: 15pt;
        font-weight: bold;
        text-transform: uppercase;
      }
      .sub-title {
        font-size: 12pt;
        font-style: italic;
        margin-top: 5px;
      }
      .section-title {
        font-size: 12pt;
        font-weight: bold;
        text-transform: uppercase;
        margin-top: 25px;
        margin-bottom: 10px;
      }
      .content-box {
        font-size: 11pt;
        margin-left: 20px;
        margin-bottom: 15px;
      }
      table.data-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
        margin-bottom: 20px;
      }
      table.data-table th {
        border: 1px solid #000;
        padding: 8px;
        font-size: 11pt;
        font-weight: bold;
        background-color: #f2f2f2;
        text-align: left;
      }
      table.data-table td {
        border: 1px solid #000;
        padding: 8px;
        font-size: 11pt;
        vertical-align: top;
      }
      ul {
        margin: 0;
        padding-left: 20px;
      }
      li {
        margin-bottom: 4px;
      }
      .signature-table {
        width: 100%;
        border: none;
        margin-top: 50px;
      }
      .signature-table td {
        border: none;
        text-align: center;
        width: 50%;
        font-size: 11pt;
      }
    </style>
  </head>
  <body>
    <table class="header-table">
      <tr>
        <td style="text-align: center; width: 45%;">
          <strong>TRUNG TÂM CÔNG NGHỆ & R&D</strong><br/>
          <strong>TỔ DỰ ÁN SMART IOT</strong><br/>
          <span>Số: ....../BC-RD</span>
        </td>
        <td style="text-align: center; width: 55%;">
          <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
          <strong>Độc lập - Tự do - Hạnh phúc</strong><br/>
          <span>----------------------------------</span><br/>
          <span style="font-style: italic;">Hà Nội, ngày ${new Date().getDate().toString().padStart(2, '0')} tháng ${(new Date().getMonth() + 1).toString().padStart(2, '0')} năm ${new Date().getFullYear()}</span>
        </td>
      </tr>
    </table>

    <div class="title-box">
      <div class="main-title">BÁO CÁO TIẾN ĐỘ PHÁT TRIỂN SẢN PHẨM R&D HẰNG TUẦN</div>
      <div class="sub-title">(Tuần bắt đầu từ ngày: ${weekStartDate} | Đơn vị: R&D Team)</div>
    </div>

    <div class="section-title">I. ĐÁNH GIÁ TỔNG QUAN TIẾN ĐỘ CỦA BAN QUẢN LÝ / ADMIN</div>
    <div class="content-box" style="white-space: pre-wrap; background-color: #f9f9f9; padding: 10px; border-left: 3px solid #000;">
      ${remarks || 'Chưa có đánh giá/chỉ đạo cụ thể từ quản trị viên cho tuần này.'}
    </div>

    <div class="section-title">II. CẢNH BÁO ĐIỂM NGHẼN & KHÓ KHĂN KỸ THUẬT (BLOCKERS)</div>
    <div class="content-box">
      ${activeBlockers.length > 0 ? `
        <ul>
          ${activeBlockers.map(b => `<li><strong>${b.userName}:</strong> ${b.text}</li>`).join('')}
        </ul>
      ` : 'Không ghi nhận vướng mắc kỹ thuật lớn nào từ đội ngũ.'}
    </div>

    <div class="section-title">III. KẾT QUẢ ĐẠT ĐƯỢC VÀ KẾ HOẠCH CHI TIẾT THEO KHỐI</div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 25%">Khối chuyên môn</th>
          <th style="width: 40%">Công việc đã hoàn thành (Done)</th>
          <th style="width: 35%">Kế hoạch tuần tiếp theo (Planned)</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(departmentsSummary).map(([deptName, data]) => {
          if (data.submittedUsers.length === 0) return '';
          return `
            <tr>
              <td>
                <strong>${deptName}</strong><br/>
                <span style="font-size: 9pt; color: #555; font-style: italic;">
                  Nhân sự: ${data.submittedUsers.join(', ')}
                </span>
              </td>
              <td>
                <ul>
                  ${data.donePoints.map(p => `<li>${p}</li>`).join('')}
                </ul>
              </td>
              <td>
                <ul>
                  ${data.plannedPoints.map(p => `<li>${p}</li>`).join('')}
                </ul>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="section-title">IV. TÌNH HÌNH PHÁT SINH KINH PHÍ & VẬN HÀNH PHÒNG LAB</div>
    <div class="content-box">
      <ul>
        <li><strong>Tổng ngân sách linh kiện đã phê duyệt mua:</strong> ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalApprovedBOMCost)}</li>
        <li><strong>Tổng ngân sách linh kiện đang chờ phê duyệt:</strong> ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPendingBOMCost)}</li>
        <li><strong>Số lượng thiết bị đang mượn hoạt động tại Lab:</strong> ${getAll('asset_loans').filter(l => l.status === 'Approved').length} thiết bị</li>
        <li><strong>Số lượt đăng ký sử dụng phòng/thiết bị đo EMC, in 3D trong tuần:</strong> ${getAll('lab_bookings').length} lượt</li>
      </ul>
    </div>

    <table class="signature-table">
      <tr>
        <td>
          <strong>NGƯỜI LẬP BÁO CÁO</strong><br/>
          <span style="font-style: italic; font-size: 9pt;">(Ký, ghi rõ họ tên)</span>
          <br/><br/><br/><br/><br/>
          <strong>Quản trị viên R&D</strong>
        </td>
        <td>
          <strong>BAN GIÁM ĐỐC TRUNG TÂM DUYỆT</strong><br/>
          <span style="font-style: italic; font-size: 9pt;">(Ký, phê duyệt chỉ đạo)</span>
          <br/><br/><br/><br/><br/>
          <strong>Giám đốc Trung tâm</strong>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  res.setHeader('Content-Type', 'application/msword');
  res.setHeader('Content-Disposition', `attachment; filename="Bao_Cao_Tuan_${weekStartDate}.doc"`);
  res.send(html);
});

// --- MODULE VẬN HÀNH LAB & LINH KIỆN APIS ---

// Lab Assets
app.get('/api/assets', authenticateToken, (req, res) => {
  res.json(getAll('assets'));
});

app.post('/api/assets', authenticateToken, requireLeaderOrAdmin, (req, res) => {
  const { name, serialNumber, status } = req.body;
  if (!name || !serialNumber) {
    return res.status(400).json({ message: 'Vui lòng cung cấp Tên và Số Serial thiết bị.' });
  }
  const newAsset = insert('assets', { name, serialNumber, status: status || 'Available' });
  res.status(201).json(newAsset);
});

app.put('/api/assets/:id', authenticateToken, requireLeaderOrAdmin, (req, res) => {
  const updated = update('assets', req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: 'Không tìm thấy thiết bị.' });
  res.json(updated);
});

app.delete('/api/assets/:id', authenticateToken, requireLeaderOrAdmin, (req, res) => {
  const deleted = remove('assets', req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Không tìm thấy thiết bị để xóa.' });
  res.json({ message: 'Xóa thiết bị thành công.' });
});

// Asset Loans
app.get('/api/asset-loans', authenticateToken, (req, res) => {
  res.json(getAll('asset_loans'));
});

app.post('/api/asset-loans', authenticateToken, (req, res) => {
  const { assetId, loanDate, returnDate } = req.body;
  if (!assetId || !loanDate) {
    return res.status(400).json({ message: 'Vui lòng điền Thiết bị và Ngày mượn.' });
  }

  const asset = getById('assets', assetId);
  if (!asset || asset.status !== 'Available') {
    return res.status(400).json({ message: 'Thiết bị hiện không sẵn sàng để mượn.' });
  }

  const newLoan = insert('asset_loans', {
    assetId: Number(assetId),
    userId: req.user.id,
    loanDate,
    returnDate: returnDate || '',
    status: 'Pending'
  });
  res.status(201).json(newLoan);
});

app.put('/api/asset-loans/:id', authenticateToken, requireLeaderOrAdmin, (req, res) => {
  const { status } = req.body; // Approved | Returned
  const loan = getById('asset_loans', req.params.id);
  if (!loan) return res.status(404).json({ message: 'Không tìm thấy đơn mượn.' });

  const updatedLoan = update('asset_loans', req.params.id, { status });
  if (status === 'Approved') {
    update('assets', loan.assetId, { status: 'Loaned' });
  } else if (status === 'Returned') {
    update('assets', loan.assetId, { status: 'Available' });
  }

  res.json(updatedLoan);
});

// Procurements (Đề xuất linh kiện BOM)
app.get('/api/procurements', authenticateToken, (req, res) => {
  res.json(getAll('procurements'));
});

app.post('/api/procurements', authenticateToken, (req, res) => {
  const { projectId, departmentId, itemName, url, quantity, estimatedPrice } = req.body;
  if (!projectId || !itemName || !quantity || !estimatedPrice) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ các thông tin bắt buộc.' });
  }

  const newProc = insert('procurements', {
    userId: req.user.id,
    projectId: Number(projectId),
    departmentId: Number(departmentId || 1),
    itemName,
    url: url || '',
    quantity: Number(quantity),
    estimatedPrice: Number(estimatedPrice),
    status: 'Pending'
  });
  res.status(201).json(newProc);
});

app.put('/api/procurements/:id', authenticateToken, (req, res) => {
  const proc = getById('procurements', req.params.id);
  if (!proc) return res.status(404).json({ message: 'Không tìm thấy đề xuất mua sắm.' });

  const isOwner = proc.userId === req.user.id;
  const isLeaderOrAdmin = req.user.role === 'admin' || req.user.role === 'leader';

  if (!isOwner && !isLeaderOrAdmin) {
    return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa đề xuất này.' });
  }

  const { itemName, url, quantity, estimatedPrice, status } = req.body;
  const updates = {};
  if (isLeaderOrAdmin && status !== undefined) {
    updates.status = status; // Pending | Approved | Ordered | Received
  }
  if (isOwner || isLeaderOrAdmin) {
    if (itemName !== undefined) updates.itemName = itemName;
    if (url !== undefined) updates.url = url;
    if (quantity !== undefined) updates.quantity = Number(quantity);
    if (estimatedPrice !== undefined) updates.estimatedPrice = Number(estimatedPrice);
  }

  const updated = update('procurements', req.params.id, updates);
  res.json(updated);
});

app.delete('/api/procurements/:id', authenticateToken, (req, res) => {
  const proc = getById('procurements', req.params.id);
  if (!proc) return res.status(404).json({ message: 'Không tìm thấy đề xuất.' });

  if (proc.userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'leader') {
    return res.status(403).json({ message: 'Bạn không có quyền xóa đề xuất này.' });
  }

  remove('procurements', req.params.id);
  res.json({ message: 'Xóa đề xuất mua sắm thành công.' });
});

// Lab Bookings
app.get('/api/lab-bookings', authenticateToken, (req, res) => {
  res.json(getAll('lab_bookings'));
});

app.post('/api/lab-bookings', authenticateToken, (req, res) => {
  const { equipmentName, startTime, endTime } = req.body;
  if (!equipmentName || !startTime || !endTime) {
    return res.status(400).json({ message: 'Vui lòng cung cấp Thiết bị và Thời gian đặt chỗ.' });
  }

  const newBooking = insert('lab_bookings', {
    equipmentName,
    userId: req.user.id,
    startTime,
    endTime
  });
  res.status(201).json(newBooking);
});

app.delete('/api/lab-bookings/:id', authenticateToken, (req, res) => {
  const booking = getById('lab_bookings', req.params.id);
  if (!booking) return res.status(404).json({ message: 'Không tìm thấy lịch đặt.' });

  if (booking.userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'leader') {
    return res.status(403).json({ message: 'Bạn không có quyền xóa lịch đặt này.' });
  }

  remove('lab_bookings', req.params.id);
  res.json({ message: 'Xóa lịch đặt chỗ thành công.' });
});


// --- MODULE TRI THỨC & CHẤT LƯỢNG APIS ---

// Failure Logs (Nhật ký lỗi)
app.get('/api/failure-logs', authenticateToken, (req, res) => {
  res.json(getAll('failure_logs'));
});

app.post('/api/failure-logs', authenticateToken, (req, res) => {
  const { title, description, solution, projectId, departmentId } = req.body;
  if (!title || !description || !solution) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ Tiêu đề, Mô tả và Giải pháp khắc phục.' });
  }

  const newLog = insert('failure_logs', {
    title,
    description,
    solution,
    projectId: projectId ? Number(projectId) : null,
    departmentId: departmentId ? Number(departmentId) : null,
    userId: req.user.id
  });
  res.status(201).json(newLog);
});

app.put('/api/failure-logs/:id', authenticateToken, (req, res) => {
  const log = getById('failure_logs', req.params.id);
  if (!log) return res.status(404).json({ message: 'Không tìm thấy nhật ký lỗi.' });

  if (log.userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'leader') {
    return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa nhật ký lỗi này.' });
  }

  const updated = update('failure_logs', req.params.id, req.body);
  res.json(updated);
});

app.delete('/api/failure-logs/:id', authenticateToken, (req, res) => {
  const log = getById('failure_logs', req.params.id);
  if (!log) return res.status(404).json({ message: 'Không tìm thấy nhật ký lỗi.' });

  if (log.userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'leader') {
    return res.status(403).json({ message: 'Bạn không có quyền xóa nhật ký lỗi này.' });
  }

  remove('failure_logs', req.params.id);
  res.json({ message: 'Xóa nhật ký lỗi thành công.' });
});

// Firmware Releases
app.get('/api/firmware-releases', authenticateToken, (req, res) => {
  res.json(getAll('firmware_releases'));
});

app.post('/api/firmware-releases', authenticateToken, requireLeaderOrAdmin, (req, res) => {
  const { projectId, version, pcbVersionCompatible, changelog } = req.body;
  if (!projectId || !version || !pcbVersionCompatible) {
    return res.status(400).json({ message: 'Vui lòng cung cấp Dự án, Phiên bản firmware và Mạch tương thích.' });
  }

  // Giả lập lưu file build local
  const newRelease = insert('firmware_releases', {
    projectId: Number(projectId),
    version,
    pcbVersionCompatible,
    changelog: changelog || '',
    filePath: 'uploads/firmware/' + version + '.bin',
    releaseDate: new Date().toISOString().split('T')[0]
  });
  res.status(201).json(newRelease);
});

// Project Links (Altium, Solidworks,...)
app.get('/api/project-links', authenticateToken, (req, res) => {
  res.json(getAll('project_links'));
});

app.post('/api/project-links', authenticateToken, (req, res) => {
  const { projectId, label, url, description } = req.body;
  if (!projectId || !label || !url) {
    return res.status(400).json({ message: 'Vui lòng cung cấp Dự án, Nhãn và Đường dẫn URL.' });
  }

  const newLink = insert('project_links', {
    projectId: Number(projectId),
    label,
    url,
    description: description || ''
  });
  res.status(201).json(newLink);
});

app.delete('/api/project-links/:id', authenticateToken, (req, res) => {
  remove('project_links', req.params.id);
  res.json({ message: 'Xóa liên kết thành công.' });
});

// Setup Wiki
app.get('/api/wiki-pages', authenticateToken, (req, res) => {
  res.json(getAll('wiki_pages'));
});

app.post('/api/wiki-pages', authenticateToken, (req, res) => {
  const { title, contentMarkdown } = req.body;
  if (!title || !contentMarkdown) {
    return res.status(400).json({ message: 'Vui lòng cung cấp Tiêu đề và Nội dung Wiki.' });
  }

  const newPage = insert('wiki_pages', {
    title,
    contentMarkdown,
    updatedBy: req.user.id,
    updatedAt: new Date().toISOString().split('T')[0]
  });
  res.status(201).json(newPage);
});

app.put('/api/wiki-pages/:id', authenticateToken, (req, res) => {
  const updated = update('wiki_pages', req.params.id, {
    ...req.body,
    updatedBy: req.user.id,
    updatedAt: new Date().toISOString().split('T')[0]
  });
  if (!updated) return res.status(404).json({ message: 'Không tìm thấy trang wiki.' });
  res.json(updated);
});


// --- INHERITANCE & DASHBOARD APIS ---

// Kế thừa dự án (BOM, Links)
app.post('/api/projects/:id/inherit', authenticateToken, requireLeaderOrAdmin, (req, res) => {
  const childProjectId = Number(req.params.id);
  const { sourceProjectId, inheritBOM, inheritLinks } = req.body;
  if (!sourceProjectId) {
    return res.status(400).json({ message: 'Vui lòng cung cấp Dự án nguồn để kế thừa.' });
  }

  const db = readDb();
  
  // Kế thừa BOM (procurements)
  if (inheritBOM) {
    const sourceBOM = (db.procurements || []).filter(p => p.projectId === Number(sourceProjectId));
    sourceBOM.forEach(item => {
      insert('procurements', {
        userId: req.user.id,
        projectId: childProjectId,
        departmentId: item.departmentId,
        itemName: item.itemName + ' (Kế thừa từ TH' + sourceProjectId + ')',
        url: item.url,
        quantity: item.quantity,
        estimatedPrice: item.estimatedPrice,
        status: 'Pending'
      });
    });
  }

  // Kế thừa Project Links
  if (inheritLinks) {
    const sourceLinks = (db.project_links || []).filter(l => l.projectId === Number(sourceProjectId));
    sourceLinks.forEach(link => {
      insert('project_links', {
        projectId: childProjectId,
        label: link.label,
        url: link.url,
        description: link.description
      });
    });
  }

  // Log inheritance
  insert('project_inheritance_logs', {
    childProjectId,
    sourceProjectId: Number(sourceProjectId),
    inheritBOM: !!inheritBOM,
    inheritLinks: !!inheritLinks,
    inheritedAt: new Date().toISOString().split('T')[0],
    inheritedBy: req.user.id
  });

  // Gán parentProjectId cho dự án con
  update('projects', childProjectId, { parentProjectId: Number(sourceProjectId) });

  res.json({ message: 'Kế thừa dự án thành công!' });
});

// Dashboard stats
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  const tasks = getAll('tasks');
  const procurements = getAll('procurements');
  const assets = getAll('assets');
  const bookings = getAll('lab_bookings');

  const stats = {
    totalTasks: tasks.length,
    activeTasks: tasks.filter(t => t.status !== 'Done').length,
    doneTasks: tasks.filter(t => t.status === 'Done').length,
    pendingProcurementsCount: procurements.filter(p => p.status === 'Pending').length,
    pendingProcurementsCost: procurements.filter(p => p.status === 'Pending').reduce((acc, curr) => acc + (curr.quantity * curr.estimatedPrice), 0),
    totalAssetsCount: assets.length,
    loanedAssetsCount: assets.filter(a => a.status === 'Loaned').length,
    activeBookingsCount: bookings.length
  };

  res.json(stats);
});

// Bind to 0.0.0.0 to allow access from local IP (Wifi / LAN)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`==================================================`);
  console.log(`Backend Server đang chạy thành công tại:`);
  console.log(`- Localhost:  http://localhost:${PORT}`);
  console.log(`- Mạng nội bộ: http://0.0.0.0:${PORT}`);
  console.log(`==================================================`);
});

let lastUpdateId = 0;
async function pollTelegramUpdates() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  try {
    const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=5`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[Telegram Poll Warning] HTTP ${res.status}: ${res.statusText}`);
      return;
    }

    const data = await res.json();
    if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
      for (const updateObj of data.result) {
        if (updateObj.update_id) {
          lastUpdateId = Math.max(lastUpdateId, updateObj.update_id);
        }
        const message = updateObj.message;
        if (!message || !message.text) continue;

        const text = message.text.trim();
        const chatId = message.chat.id;
        const telegramUser = message.from?.username || message.from?.first_name || 'User';

        if (text.startsWith('/start')) {
          try {
            const parts = text.split(' ');
            if (parts.length > 1) {
              const userId = Number(parts[1]);
              if (userId) {
                const u = getById('users', userId);
                if (u) {
                  update('users', userId, { telegramChatId: chatId });
                  
                  const responseText = `<b>[PM System]</b>\nXin chào <b>${escapeHtml(u.fullName)}</b> (@${escapeHtml(u.username)})!\nTài khoản của bạn đã được liên kết với Telegram của <b>${escapeHtml(telegramUser)}</b> thành công.\n\nTừ giờ, bạn sẽ nhận được thông báo trực tiếp khi được giao việc hoặc có cập nhật công việc quan trọng.`;
                  
                  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, text: responseText, parse_mode: 'HTML' })
                  });
                  
                  console.log(`[Telegram Link] Linked user ID ${userId} to chat ID ${chatId}`);
                }
              }
            } else {
              const responseText = `Chào mừng bạn đến với bot thông báo PM System!\nĐể liên kết tài khoản, vui lòng truy cập Dashboard trên website và nhấp vào nút "Liên kết Telegram".`;
              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text: responseText })
              });
            }
          } catch (sendErr) {
            console.error("Lỗi khi phản hồi tin nhắn Telegram:", sendErr);
          }
        }
      }
    }
  } catch (err) {
    console.error("Lỗi khi long-polling Telegram API:", err);
  }
}

if (process.env.TELEGRAM_BOT_TOKEN) {
  console.log("Telegram Bot Token phát hiện. Đang khởi chạy Telegram updates long polling...");
  setInterval(pollTelegramUpdates, 3000);
}
