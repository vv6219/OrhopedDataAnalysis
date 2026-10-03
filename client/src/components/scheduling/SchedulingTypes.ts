export interface PatientSearchResult {
  id: number;
  mednum: number;
  full_name: string;
  brief_name?: string;
  sex_display?: string;
  bdate?: string;
  age?: number;
  sphone?: string;
  email?: string;
  dms_insurer?: string;
  total_visits?: number;
  last_visit_date?: string;
}

export interface Doctor {
  id: number;
  full_name: string;
  role: string;
  specialization?: string;
  contact_phone?: string;
  email?: string;
  roomNumber: string;
}

export interface OperationItem {
  id: number;
  name: string;
  price: number;
  duration_minutes?: number;
  joint_area?: string;
}

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'waiting'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type UrgencyLevel = 'routine' | 'urgent' | 'post_op';

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  operation_id?: number | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  room_number: string;
  joint_area?: string;
  urgency_level: UrgencyLevel;
  status: AppointmentStatus;
  arrival_time?: string | null;
  cancellation_reason?: string | null;
  notes?: string;
  visit_id?: number | null;
  transaction_id?: number | null;
  created_at?: string;
  // Joins
  patient_name?: string;
  patient_mednum?: number;
  patient_age?: number;
  patient_phone?: string;
  patient_dms?: string;
  doctor_name?: string;
  doctor_role?: string;
  operation_name?: string;
  operation_price?: number;
}

export interface TimeSlot {
  time: string;
  endTime: string;
  isAvailable: boolean;
  isBuffer: boolean;
  booking?: {
    status: AppointmentStatus;
    urgency: UrgencyLevel;
  } | null;
}

export interface NotificationItem {
  id: number;
  appointment_id: number;
  recipient_type: string;
  recipient_name: string;
  recipient_contact: string;
  channel: 'telegram' | 'max' | 'whatsapp' | 'sms' | 'email';
  chat_id?: string;
  template_type: string;
  message_text: string;
  has_inline_buttons: number;
  status: 'sent' | 'delivered' | 'read' | 'confirmed_by_user' | 'failed';
  sent_at: string;
  delivery_status_updated_at?: string | null;
  appointment_date?: string;
  start_time?: string;
  room_number?: string;
  doctor_name?: string;
  patient_name?: string;
  patient_mednum?: number;
}

export interface SchedulingSummary {
  total: number;
  scheduled: number;
  confirmed: number;
  waiting: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  occupancyRate: number;
}

export const SCHEDULING_TYPES = {};
