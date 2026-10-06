export interface DoctorRecord {
  _id: string;
  doctorId: string;
  userId: { _id: string; name: string } | null;
  departmentId: { _id: string; departmentName: string } | null;
  specialization: string;
  qualification: string;
  experience: number;
  consultationFee: number;
  shiftStart: string;
  shiftEnd: string;
  avgConsultationTime: number;
  availability?: {
    date: string;
    available: boolean;
    reason: string | null;
    onLeave: boolean;
    bookedCount: number;
    capacity: number;
    remaining: number;
    nextWindow: { start: string; end: string } | null;
  };
}

export interface AppointmentRecord {
  _id: string;
  doctorId: DoctorRecord | null;
  patientId: { _id: string; userId: { name: string; phone?: string } | null } | null;
  clinicDate?: string;
  appointmentDate: string;
  appointmentType: "Normal" | "Emergency" | "Walkin";
  symptoms?: string;
  status: string;
  checkedIn: boolean;
  queuePosition?: number;
  estimatedWindowStart?: string;
  estimatedWindowEnd?: string;
}

export interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
}
export interface AppointmentList {
  appointments: AppointmentRecord[];
  page?: number;
  pageSize?: number;
  total?: number;
  updatedAt?: string;
}

export const activeStatuses = ["Pending", "Confirmed", "NoResponse", "CheckedIn"];
export const clinicToday = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
export const bookingLastDay = () =>
  new Date(Date.now() + 330 * 60000 + 30 * 86400000).toISOString().slice(0, 10);
export const appointmentDay = (appointment: AppointmentRecord) =>
  appointment.clinicDate ??
  new Date(new Date(appointment.appointmentDate).getTime() + 330 * 60000)
    .toISOString()
    .slice(0, 10);
export const formatClinicDay = (day: string) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${day}T12:00:00+05:30`));
export const formatClinicTime = (time: string) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(time));
export const formatWindow = (start?: string, end?: string) =>
  start && end ? `${formatClinicTime(start)} – ${formatClinicTime(end)}` : "Estimate unavailable";
export const statusLabel = (status: string) =>
  ({
    Pending: "Awaiting confirmation",
    Confirmed: "Confirmed",
    NoResponse: "Awaiting response",
    CheckedIn: "Checked in",
    CancelledByPatient: "Cancelled",
    Completed: "Completed",
  })[status as "Pending"] ?? status;
