import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

const defaultDb = {
  departments: [
    { id: 1, name: 'Hardware' },
    { id: 2, name: 'Firmware' },
    { id: 3, name: 'Software' },
    { id: 4, name: 'Industrial Design' }
  ],
  users: [],
  projects: [],
  sprints: [],
  tasks: [],
  task_dependencies: [],
  project_inheritance_logs: [],
  assets: [],
  asset_loans: [],
  procurements: [],
  lab_bookings: [],
  failure_logs: [],
  firmware_releases: [],
  project_links: [],
  wiki_pages: [],
  standups: [],
  goals: [],
  reports: []
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
    const devHash = await bcrypt.hash('dev123', salt);

    defaultDb.users = [
      { id: 1, username: 'admin', passwordHash: adminHash, fullName: 'Quản trị viên Hệ thống', role: 'admin', departmentId: 1, isApproved: true },
      { id: 2, username: 'leader', passwordHash: leaderHash, fullName: 'Trưởng phòng R&D', role: 'leader', departmentId: 2, isApproved: true },
      { id: 3, username: 'nhanvien', passwordHash: employeeHash, fullName: 'Nguyễn Văn Thiết Kế', role: 'employee', departmentId: 4, isApproved: true },
      { id: 4, username: 'hw_lead', passwordHash: devHash, fullName: 'Lê Văn Cứng', role: 'leader', departmentId: 1, isApproved: true },
      { id: 5, username: 'fw_dev', passwordHash: devHash, fullName: 'Trần Văn Nhúng', role: 'employee', departmentId: 2, isApproved: true },
      { id: 6, username: 'procure', passwordHash: devHash, fullName: 'Nguyễn Thị Mua Sắm', role: 'employee', departmentId: 4, isApproved: true }
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
