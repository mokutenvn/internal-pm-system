import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

const defaultDb = {
  departments: [
    { id: 1, name: 'Phần cứng' },
    { id: 2, name: 'Phần mềm/Nhúng' },
    { id: 3, name: 'Thiết kế kiểu dáng' },
    { id: 4, name: 'Sản xuất' }
  ],
  users: [],
  projects: [
    { id: 1, name: 'Hệ thống IoT Đo Chất Lượng Không Khí', description: 'Thiết kế và chế tạo thiết bị đo bụi mịn PM2.5 và CO2 gửi dữ liệu lên server.', status: 'Active', creatorId: 1 }
  ],
  tasks: [
    { id: 1, projectId: 1, title: 'Thiết kế sơ đồ nguyên lý mạch điện (Altium)', description: 'Vẽ mạch nguyên lý gồm module ESP32, cảm biến bụi mịn và cảm biến CO2.', assigneeId: 3, deadline: '2026-07-15', progress: 50, priority: 'High', status: 'Active' },
    { id: 2, projectId: 1, title: 'Lập trình Firmware kết nối Wi-Fi & MQTT', description: 'Lập trình firmware gửi dữ liệu cảm biến định kỳ lên AWS IoT Core.', assigneeId: 3, deadline: '2026-07-20', progress: 20, priority: 'Medium', status: 'Active' }
  ],
  goals: [
    { id: 1, userId: 3, type: 'day', content: 'Hoàn thành vẽ footprint cho ESP32 và cảm biến bụi.', progress: 100, targetDate: '2026-07-09' },
    { id: 2, userId: 3, type: 'week', content: 'Hoàn thành sơ đồ nguyên lý và layout mạch PCB v1.0.', progress: 50, targetDate: '2026-07-12' },
    { id: 3, userId: 3, type: 'month', content: 'Lắp ráp và chạy thử nghiệm thiết bị phần cứng v1.0.', progress: 30, targetDate: '2026-07-31' }
  ],
  reports: [
    { id: 1, userId: 3, weekStartDate: '2026-07-06', doneContent: 'Đã hoàn thành vẽ schematic ESP32 và cảm biến. Viết xong code test đọc cảm biến.', plannedContent: 'Tiến hành layout mạch PCB. Viết code MQTT.', blockers: 'Linh kiện cảm biến CO2 đang bị giao chậm.' }
  ]
};

// Initialize DB file if not exists
export async function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    console.log('Database file not found, seeding default data...');
    // Hash default passwords
    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('admin123', salt);
    const leaderHash = await bcrypt.hash('leader123', salt);
    const employeeHash = await bcrypt.hash('nhanvien123', salt);

    defaultDb.users = [
      { id: 1, username: 'admin', passwordHash: adminHash, fullName: 'Quản trị viên Hệ thống', role: 'admin', departmentId: 1, isApproved: true },
      { id: 2, username: 'leader', passwordHash: leaderHash, fullName: 'Trưởng nhóm R&D', role: 'leader', departmentId: 2, isApproved: true },
      { id: 3, username: 'nhanvien', passwordHash: employeeHash, fullName: 'Nguyễn Văn Nhân Viên', role: 'employee', departmentId: 2, isApproved: true }
    ];

    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), 'utf-8');
  }
}

export function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    return defaultDb;
  }
  const content = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(content);
}

export function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// DB Helpers
export function getAll(table) {
  const db = readDb();
  return db[table] || [];
}

export function getById(table, id) {
  const db = readDb();
  return (db[table] || []).find(item => item.id === Number(id));
}

export function insert(table, data) {
  const db = readDb();
  if (!db[table]) db[table] = [];
  
  const nextId = db[table].length > 0 ? Math.max(...db[table].map(item => item.id || 0)) + 1 : 1;
  const newRow = { id: nextId, ...data };
  db[table].push(newRow);
  writeDb(db);
  return newRow;
}

export function update(table, id, updates) {
  const db = readDb();
  if (!db[table]) return null;

  const index = db[table].findIndex(item => item.id === Number(id));
  if (index === -1) return null;

  db[table][index] = { ...db[table][index], ...updates };
  writeDb(db);
  return db[table][index];
}

export function remove(table, id) {
  const db = readDb();
  if (!db[table]) return false;

  const originalLength = db[table].length;
  db[table] = db[table].filter(item => item.id !== Number(id));
  writeDb(db);
  return db[table].length < originalLength;
}
