import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
// Tự động chuẩn hóa nếu người dùng copy nhầm cả đuôi /rest/v1/
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-id')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 10 } }
    })
  : null;

// Helpers để chuẩn hóa tên cột giữa CamelCase (React) và SnakeCase (PostgreSQL)
export const mapItemFromDb = (row) => ({
  id: row.id,
  title: row.title,
  category: row.category,
  condition: row.condition,
  description: row.description,
  donorId: row.donor_id,
  donorName: row.donor_name,
  availableSlots: row.available_slots || [],
  inputMethod: row.input_method || 'website',
  status: row.status,
  requestStatus: row.request_status,
  image: row.image,
  qualityCheck: row.quality_check,
  storageSlot: row.storage_slot,
  rejectReason: row.reject_reason,
  updateNote: row.update_note,
  createdAt: row.created_at ? row.created_at.replace('T', ' ').substring(0, 16) : ''
});

export const mapItemToDb = (item) => ({
  id: item.id,
  title: item.title,
  category: item.category,
  condition: item.condition,
  description: item.description,
  donor_id: item.donorId,
  donor_name: item.donorName,
  available_slots: item.availableSlots,
  input_method: item.inputMethod,
  status: item.status,
  request_status: item.requestStatus,
  image: item.image,
  quality_check: item.qualityCheck,
  storage_slot: item.storageSlot,
  reject_reason: item.rejectReason,
  update_note: item.updateNote
});

export const mapRequestFromDb = (row) => ({
  id: row.id,
  itemId: row.item_id,
  requesterId: row.requester_id,
  requesterName: row.requester_name,
  requesterClass: row.requester_class,
  reason: row.reason,
  availableSlots: row.available_slots || [],
  inputMethod: row.input_method || 'website',
  status: row.status,
  lotteryRank: row.lottery_rank,
  createdAt: row.created_at ? row.created_at.replace('T', ' ').substring(0, 16) : ''
});

export const mapRequestToDb = (req) => ({
  id: req.id,
  item_id: req.itemId,
  requester_id: req.requesterId,
  requester_name: req.requesterName,
  requester_class: req.requesterClass,
  reason: req.reason,
  available_slots: req.availableSlots,
  input_method: req.inputMethod,
  status: req.status,
  lottery_rank: req.lotteryRank
});

export const mapAppointmentFromDb = (row) => ({
  id: row.id,
  itemId: row.item_id,
  requestId: row.request_id,
  donorId: row.donor_id,
  requesterId: row.requester_id,
  type: row.type,
  donorSlot: row.donor_slot,
  requesterSlot: row.requester_slot,
  storageSlot: row.storage_slot,
  pickupCode: row.pickup_code,
  status: row.status,
  donorArrivedAt: row.donor_arrived_at ? row.donor_arrived_at.replace('T', ' ').substring(0, 16) : null,
  pickedUpAt: row.picked_up_at ? row.picked_up_at.replace('T', ' ').substring(0, 16) : null,
  notes: row.notes,
  createdAt: row.created_at ? row.created_at.replace('T', ' ').substring(0, 16) : ''
});

export const mapAppointmentToDb = (apt) => ({
  id: apt.id,
  item_id: apt.itemId,
  request_id: apt.requestId,
  donor_id: apt.donorId,
  requester_id: apt.requesterId,
  type: apt.type,
  donor_slot: apt.donorSlot,
  requester_slot: apt.requesterSlot,
  storage_slot: apt.storageSlot,
  pickup_code: apt.pickupCode,
  status: apt.status,
  donor_arrived_at: apt.donorArrivedAt,
  picked_up_at: apt.pickedUpAt,
  notes: apt.notes
});

export const mapLogFromDb = (row) => ({
  id: row.id,
  timestamp: row.timestamp ? row.timestamp.replace('T', ' ').substring(0, 19) : '',
  role: row.role,
  action: row.action,
  details: row.details
});

export const mapLogToDb = (log) => ({
  id: log.id,
  role: log.role,
  action: log.action,
  details: log.details
});

