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
  projects: [
    { id: 1, name: 'Themis-30 R&D', code: 'TH30', description: 'Thiết bị giám sát môi trường phiên bản v3.0, đã thương mại hóa.', status: 'Completed', startDate: '2026-01-01', endDate: '2026-05-30', creatorId: 1, parentProjectId: null },
    { id: 2, name: 'Themis-50 Smart IoT', code: 'TH50', description: 'Hệ thống đo đạc thông minh thế hệ mới tích hợp pin mặt trời và kết nối NB-IoT.', status: 'Active', startDate: '2026-07-01', endDate: '2026-12-31', creatorId: 1, parentProjectId: 1 }
  ],
  sprints: [
    { id: 1, projectId: 2, name: 'Sprint 1 - Board Nguyên Lý & Layout', goal: 'Hoàn thiện schematic và layout PCB v1.0', startDate: '2026-07-06', endDate: '2026-07-19', status: 'Active' },
    { id: 2, projectId: 2, name: 'Sprint 2 - Firmware Core & Driver', goal: 'Đọc dữ liệu cảm biến I2C và đẩy lên MQTT', startDate: '2026-07-20', endDate: '2026-08-02', status: 'Planned' }
  ],
  tasks: [
    { id: 1, projectId: 2, sprintId: 1, departmentId: 1, parentTaskId: null, title: 'Layout mạch nguồn PCB v1.0', description: 'Layout đường mạch nguồn switching chuyển đổi từ pin mặt trời sang 3.3V.', assigneeId: 4, priority: 'High', status: 'In Progress', estimate: 8, dueDate: '2026-07-15', createdBy: 2 },
    { id: 2, projectId: 2, sprintId: 1, departmentId: 1, parentTaskId: null, title: 'Hàn mạch mẫu thử nghiệm', description: 'Hàn thủ công các linh kiện SMD 0603 lên board mạch mẫu v1.0.', assigneeId: 4, priority: 'Medium', status: 'To Do', estimate: 4, dueDate: '2026-07-18', createdBy: 2 },
    { id: 3, projectId: 2, sprintId: 1, departmentId: 2, parentTaskId: null, title: 'Viết driver I2C đọc SHT30', description: 'Lập trình driver đọc nhiệt độ độ ẩm bằng ESP-IDF.', assigneeId: 5, priority: 'High', status: 'In Progress', estimate: 12, dueDate: '2026-07-16', createdBy: 2 },
    { id: 4, projectId: 2, sprintId: 1, departmentId: 4, parentTaskId: null, title: 'Thiết kế 3D vỏ hộp thiết bị', description: 'Vẽ mô hình 3D vỏ ngoài chống nước tiêu chuẩn IP65 bằng Solidworks.', assigneeId: 3, priority: 'Medium', status: 'Done', estimate: 16, dueDate: '2026-07-08', createdBy: 2 }
  ],
  task_dependencies: [
    { id: 1, blockedTaskId: 2, blockerTaskId: 1 }
  ],
  project_inheritance_logs: [],
  assets: [
    { id: 1, name: 'Oscilloscope Rigol DS1054Z 100MHz', serialNumber: 'RGL-DS1054Z-01', status: 'Available' },
    { id: 2, name: 'Mạch nạp J-Link Pro V9', serialNumber: 'JLK-PRO-02', status: 'Loaned' }
  ],
  asset_loans: [
    { id: 1, assetId: 2, userId: 5, loanDate: '2026-07-08', returnDate: '2026-07-15', status: 'Approved' }
  ],
  procurements: [
    { id: 1, userId: 4, projectId: 2, departmentId: 1, itemName: 'IC nguồn TPS5430DDAR TI', url: 'https://mouser.com/ProductDetail/...', quantity: 20, estimatedPrice: 45000, status: 'Pending' },
    { id: 2, userId: 5, projectId: 2, departmentId: 2, itemName: 'Mạch nạp ESP-Prog chính hãng', url: 'https://digikey.com/ProductDetail/...', quantity: 2, estimatedPrice: 250000, status: 'Approved' }
  ],
  lab_bookings: [
    { id: 1, equipmentName: 'Máy in 3D Bambu Lab X1C', userId: 3, startTime: '2026-07-10T09:00:00', endTime: '2026-07-10T12:00:00' }
  ],
  failure_logs: [
    { id: 1, title: 'Lỗi treo IC reset khi cấp nguồn đột ngột', description: 'Dự án cũ Themis-30 gặp hiện tượng IC nguồn bị spike khiến MCU reset liên tục.', solution: 'Thêm diode Zener 3.6V bảo vệ ở chân Reset.', projectId: 1, departmentId: 1, userId: 4 }
  ],
  firmware_releases: [
    { id: 1, projectId: 1, version: 'v1.2.0-stable', pcbVersionCompatible: 'PCB v1.1', filePath: 'uploads/firmware/v1.2.0.bin', changelog: 'Sửa lỗi treo kết nối MQTT, tối ưu điện năng tiêu thụ.', releaseDate: '2026-05-15' }
  ],
  project_links: [
    { id: 1, projectId: 2, label: 'Altium 365 Schematic Workspace', url: 'https://altium.com/project/themis-50', description: 'Bản vẽ schematic trực tuyến' }
  ],
  wiki_pages: [
    { id: 1, title: 'Quy chuẩn thiết kế PCB chống nhiễu R&D', contentMarkdown: '# Hướng dẫn chống nhiễu đường tín hiệu cao tần\n1. Bo góc 45 độ cho đường mạch.\n2. Đi đường giáp đất bao quanh anten.\n3. Sử dụng via tiếp địa phân bố đều.', updatedBy: 4, updatedAt: '2026-07-09' }
  ],
  standups: [
    { id: 1, userId: 4, projectId: 2, date: '2026-07-09', completedWork: 'Layout xong mạch nguồn 5V.', planToday: 'Tiếp tục đi dây khối vi điều khiển.', blockers: 'Linh kiện IC nguồn đang đợi mua.' }
  ],
  goals: [
    { id: 1, userId: 4, type: 'day', content: 'Hoàn thành vẽ footprint cho ESP32 và cảm biến bụi.', progress: 100, status: 'Completed', targetDate: '2026-07-09', createdAt: '2026-07-09' },
    { id: 2, userId: 4, type: 'week', content: 'Hoàn thành sơ đồ nguyên lý và layout mạch PCB v1.0.', progress: 50, status: 'Pending', targetDate: '2026-07-12', createdAt: '2026-07-06' },
    { id: 3, userId: 4, type: 'month', content: 'Lắp ráp và chạy thử nghiệm thiết bị phần cứng v1.0.', progress: 30, status: 'Pending', targetDate: '2026-07-31', createdAt: '2026-07-01' },
    { id: 4, userId: 5, type: 'day', content: 'Viết firmware đọc cảm biến gia tốc MPU6050 qua I2C.', progress: 20, status: 'Overdue', targetDate: '2026-07-08', createdAt: '2026-07-08' },
    { id: 5, userId: 3, type: 'week', content: 'Thiết kế 3D hoàn chỉnh vỏ hộp chống nước cho Drone.', progress: 100, status: 'Completed', targetDate: '2026-07-05', createdAt: '2026-06-29' }
  ],
  reports: [
    { id: 1, userId: 4, weekStartDate: '2026-07-06', doneContent: 'Đã vẽ schematic ESP32 và cảm biến. Viết xong driver I2C đọc SHT30.', plannedContent: 'Layout mạch PCB nguồn và khối MCU. Hàn mạch mẫu.', blockers: 'Linh kiện IC nguồn đang đợi duyệt mua.' }
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
