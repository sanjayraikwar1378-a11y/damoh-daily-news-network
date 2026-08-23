import fs from "fs";
import path from "path";

export interface ContactMessageRecord {
  id: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  message: string;
  createdAt: string;
  status: "new" | "read" | "resolved";
}

const DATA_DIR = path.join(process.cwd(), "data");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.warn("Could not create data directory:", err);
}

// In-memory fallback cache
let cachedMessages: ContactMessageRecord[] = [];

// Load initial messages from file
try {
  if (fs.existsSync(MESSAGES_FILE)) {
    const raw = fs.readFileSync(MESSAGES_FILE, "utf-8");
    cachedMessages = JSON.parse(raw);
  }
} catch (err) {
  console.warn("Could not load existing messages:", err);
}

function saveToFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(cachedMessages, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not persist messages to disk:", err);
  }
}

export function addMessage(data: {
  fullName: string;
  mobileNumber: string;
  email: string;
  message: string;
}): ContactMessageRecord {
  const newRecord: ContactMessageRecord = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    fullName: String(data.fullName).trim(),
    mobileNumber: String(data.mobileNumber).trim(),
    email: String(data.email).trim(),
    message: String(data.message).trim(),
    createdAt: new Date().toISOString(),
    status: "new"
  };

  cachedMessages.unshift(newRecord);
  saveToFile();
  return newRecord;
}

export function getMessages(): ContactMessageRecord[] {
  return [...cachedMessages];
}

export function updateMessageStatus(id: string, status: "new" | "read" | "resolved"): boolean {
  const msg = cachedMessages.find(m => m.id === id);
  if (!msg) return false;
  msg.status = status;
  saveToFile();
  return true;
}

export function deleteMessage(id: string): boolean {
  const initialLen = cachedMessages.length;
  cachedMessages = cachedMessages.filter(m => m.id !== id);
  if (cachedMessages.length !== initialLen) {
    saveToFile();
    return true;
  }
  return false;
}
