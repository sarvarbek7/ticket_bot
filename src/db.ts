import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { DbCredential, DbBranch, DbManager, DbClient, CredentialType, ClientStatus } from "./types";

const db = new Database("data.db");
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('admin', 'branch')),
    is_active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS branches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    credential_id INTEGER NOT NULL,
    FOREIGN KEY (credential_id) REFERENCES credentials(id)
  );

  CREATE TABLE IF NOT EXISTS managers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    branch_id INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (branch_id) REFERENCES branches(id)
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    direction_name TEXT NOT NULL,
    buying_status TEXT NOT NULL DEFAULT 'in_progress',
    branch_id INTEGER NOT NULL,
    manager_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (manager_id) REFERENCES managers(id)
  );
`);

// Migration: add created_at to clients if missing
try { db.exec("ALTER TABLE clients ADD COLUMN created_at DATETIME DEFAULT (datetime('now'))"); } catch { /* already exists */ }

// Seed default admin if none exists
const adminCount = (
  db.prepare("SELECT COUNT(*) as count FROM credentials WHERE type = 'admin'").get() as { count: number }
).count;
if (adminCount === 0) {
  const hash = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO credentials (login, password, type) VALUES (?, ?, 'admin')").run("admin", hash);
  console.log("Default admin created — login: admin / password: admin123");
}

// ── Credentials ────────────────────────────────────────────────────────────

export function findCredentialByLogin(login: string): DbCredential | undefined {
  return db.prepare("SELECT * FROM credentials WHERE login = ?").get(login) as DbCredential | undefined;
}

export function findCredentialById(id: number): DbCredential | undefined {
  return db.prepare("SELECT * FROM credentials WHERE id = ?").get(id) as DbCredential | undefined;
}

export function createCredential(login: string, password: string, type: CredentialType): number {
  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare("INSERT INTO credentials (login, password, type) VALUES (?, ?, ?)")
    .run(login, hash, type);
  return result.lastInsertRowid as number;
}

export function updateCredentialLoginPassword(id: number, login: string, password: string): void {
  const hash = bcrypt.hashSync(password, 10);
  db.prepare("UPDATE credentials SET login = ?, password = ? WHERE id = ?").run(login, hash, id);
}

export function updateCredentialLogin(id: number, login: string): void {
  db.prepare("UPDATE credentials SET login = ? WHERE id = ?").run(login, id);
}

export function deactivateCredential(credentialId: number): void {
  db.prepare("UPDATE credentials SET is_active = 0 WHERE id = ?").run(credentialId);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function getAllAdminCredentials(): DbCredential[] {
  return db
    .prepare("SELECT * FROM credentials WHERE type = 'admin' ORDER BY login")
    .all() as DbCredential[];
}

// ── Branches ───────────────────────────────────────────────────────────────

export function createBranch(
  name: string,
  latitude: number,
  longitude: number,
  credentialId: number
): number {
  const result = db
    .prepare("INSERT INTO branches (name, latitude, longitude, credential_id) VALUES (?, ?, ?, ?)")
    .run(name, latitude, longitude, credentialId);
  return result.lastInsertRowid as number;
}

export function getAllBranches(): DbBranch[] {
  return db
    .prepare(
      `SELECT b.*, c.login, c.is_active
       FROM branches b
       LEFT JOIN credentials c ON b.credential_id = c.id
       ORDER BY b.name`
    )
    .all() as DbBranch[];
}

export function getBranchById(id: number): DbBranch | undefined {
  return db
    .prepare(
      `SELECT b.*, c.login, c.is_active
       FROM branches b
       LEFT JOIN credentials c ON b.credential_id = c.id
       WHERE b.id = ?`
    )
    .get(id) as DbBranch | undefined;
}

export function getBranchByCredentialId(credentialId: number): DbBranch | undefined {
  return db
    .prepare("SELECT * FROM branches WHERE credential_id = ?")
    .get(credentialId) as DbBranch | undefined;
}

export function updateBranch(id: number, name: string, latitude: number, longitude: number): void {
  db.prepare("UPDATE branches SET name = ?, latitude = ?, longitude = ? WHERE id = ?").run(
    name,
    latitude,
    longitude,
    id
  );
}

// ── Managers ───────────────────────────────────────────────────────────────

export function createManager(name: string, branchId: number): number {
  const result = db
    .prepare("INSERT INTO managers (name, branch_id) VALUES (?, ?)")
    .run(name, branchId);
  return result.lastInsertRowid as number;
}

export function getAllManagers(): DbManager[] {
  return db
    .prepare(
      `SELECT m.*, b.name as branch_name
       FROM managers m
       LEFT JOIN branches b ON m.branch_id = b.id
       ORDER BY b.name, m.name`
    )
    .all() as DbManager[];
}

export function getManagersByBranch(branchId: number): DbManager[] {
  return db
    .prepare(
      "SELECT * FROM managers WHERE branch_id = ? AND is_active = 1 ORDER BY name"
    )
    .all(branchId) as DbManager[];
}

export function getManagerById(id: number): DbManager | undefined {
  return db
    .prepare(
      `SELECT m.*, b.name as branch_name
       FROM managers m
       LEFT JOIN branches b ON m.branch_id = b.id
       WHERE m.id = ?`
    )
    .get(id) as DbManager | undefined;
}

export function updateManager(id: number, name: string, branchId: number): void {
  db.prepare("UPDATE managers SET name = ?, branch_id = ? WHERE id = ?").run(name, branchId, id);
}

export function deactivateManager(id: number): void {
  db.prepare("UPDATE managers SET is_active = 0 WHERE id = ?").run(id);
}

// ── Clients ─────────────────────────────────────────────────────────────────

export function createClient(
  name: string,
  phone: string,
  directionName: string,
  branchId: number,
  managerId: number,
  status: string = "in_progress"
): number {
  const result = db
    .prepare(
      "INSERT INTO clients (name, phone, direction_name, buying_status, branch_id, manager_id) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(name, phone, directionName, status, branchId, managerId);
  return result.lastInsertRowid as number;
}

export function getClientById(id: number): DbClient | undefined {
  return db
    .prepare(
      `SELECT c.*, b.name as branch_name, m.name as manager_name
       FROM clients c
       LEFT JOIN branches b ON c.branch_id = b.id
       LEFT JOIN managers m ON c.manager_id = m.id
       WHERE c.id = ?`
    )
    .get(id) as DbClient | undefined;
}

export function getClientsByBranch(branchId: number): DbClient[] {
  return db
    .prepare(
      `SELECT c.*, b.name as branch_name, m.name as manager_name
       FROM clients c
       LEFT JOIN branches b ON c.branch_id = b.id
       LEFT JOIN managers m ON c.manager_id = m.id
       WHERE c.branch_id = ?
       ORDER BY c.id DESC`
    )
    .all(branchId) as DbClient[];
}

export function getAllClients(): DbClient[] {
  return db
    .prepare(
      `SELECT c.*, b.name as branch_name, m.name as manager_name
       FROM clients c
       LEFT JOIN branches b ON c.branch_id = b.id
       LEFT JOIN managers m ON c.manager_id = m.id
       ORDER BY b.name, c.id DESC`
    )
    .all() as DbClient[];
}

export function getInProgressClientsByBranch(branchId: number): DbClient[] {
  return db
    .prepare(
      `SELECT c.*, b.name as branch_name, m.name as manager_name
       FROM clients c
       LEFT JOIN branches b ON c.branch_id = b.id
       LEFT JOIN managers m ON c.manager_id = m.id
       WHERE c.branch_id = ? AND c.buying_status = 'in_progress'
       ORDER BY c.id DESC`
    )
    .all(branchId) as DbClient[];
}

export function getClientsByBranchManagerStatus(
  branchId: number,
  managerId: number | null,
  status: string | null
): DbClient[] {
  const conditions = ["c.branch_id = ?"];
  const params: (number | string)[] = [branchId];
  if (managerId !== null) { conditions.push("c.manager_id = ?"); params.push(managerId); }
  if (status !== null) { conditions.push("c.buying_status = ?"); params.push(status); }
  return db
    .prepare(
      `SELECT c.*, b.name as branch_name, m.name as manager_name
       FROM clients c
       LEFT JOIN branches b ON c.branch_id = b.id
       LEFT JOIN managers m ON c.manager_id = m.id
       WHERE ${conditions.join(" AND ")}
       ORDER BY c.id DESC`
    )
    .all(...params) as DbClient[];
}

export function updateClientStatus(id: number, status: ClientStatus): boolean {
  const result = db
    .prepare("UPDATE clients SET buying_status = ? WHERE id = ?")
    .run(status, id);
  return result.changes > 0;
}

export function getStatistics(
  branchId: number | null,
  startDate: string,
  endDate: string
) {
  const conditions: string[] = ["date(c.created_at) BETWEEN ? AND ?"];
  const params: (number | string)[] = [startDate, endDate];
  if (branchId !== null) {
    conditions.push("c.branch_id = ?");
    params.push(branchId);
  }
  const where = "WHERE " + conditions.join(" AND ");

  const total = (
    db
      .prepare(`SELECT COUNT(*) as count FROM clients c ${where}`)
      .get(...params) as { count: number }
  ).count;

  const byStatus = db
    .prepare(
      `SELECT buying_status as status, COUNT(*) as count FROM clients c ${where} GROUP BY buying_status`
    )
    .all(...params) as { status: string; count: number }[];

  const byManager = db
    .prepare(
      `SELECT m.name as manager_name, b.name as branch_name,
         SUM(CASE WHEN c.buying_status = 'sale'        THEN 1 ELSE 0 END) as sale,
         SUM(CASE WHEN c.buying_status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
         SUM(CASE WHEN c.buying_status = 'cancelled'   THEN 1 ELSE 0 END) as cancelled
       FROM clients c
       JOIN managers m ON c.manager_id = m.id
       JOIN branches b ON c.branch_id = b.id
       ${where}
       GROUP BY c.manager_id
       ORDER BY b.name, m.name`
    )
    .all(...params) as {
      manager_name: string;
      branch_name: string;
      sale: number;
      in_progress: number;
      cancelled: number;
    }[];

  return { total, byStatus, byManager };
}

export function getClientsForExport(
  branchId: number | null,
  startDate: string,
  endDate: string
): DbClient[] {
  const conditions: string[] = ["date(c.created_at) BETWEEN ? AND ?"];
  const params: (number | string)[] = [startDate, endDate];
  if (branchId !== null) {
    conditions.push("c.branch_id = ?");
    params.push(branchId);
  }
  const where = "WHERE " + conditions.join(" AND ");

  return db
    .prepare(
      `SELECT c.*, b.name as branch_name, m.name as manager_name
       FROM clients c
       LEFT JOIN branches b ON c.branch_id = b.id
       LEFT JOIN managers m ON c.manager_id = m.id
       ${where}
       ORDER BY b.name, c.id`
    )
    .all(...params) as DbClient[];
}
