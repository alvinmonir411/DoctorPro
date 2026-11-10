// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export enum UserRole {
  ADMIN = "ADMIN",
  DOCTOR = "DOCTOR",
  DOCTOR_ASSISTANT = "DOCTOR_ASSISTANT",
  RECEPTIONIST = "RECEPTIONIST",
  PATIENT = "PATIENT",
}

export enum AppointmentStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export enum BloodGroup {
  A_POS = "A_POS",
  A_NEG = "A_NEG",
  B_POS = "B_POS",
  B_NEG = "B_NEG",
  AB_POS = "AB_POS",
  AB_NEG = "AB_NEG",
  O_POS = "O_POS",
  O_NEG = "O_NEG",
}

// ---------------------------------------------------------------------------
// Core Models
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole | string;
  avatar?: string;
  doctorId?: string;
  doctor?: any;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Doctor {
  id: string;
  userId?: string;
  user?: User;
  name: string;
  slug: string;
  title: string;
  specialization: string;
  departmentId?: string;
  department?: Department;
  qualification?: string;
  experience?: number;
  experienceYears?: number;
  bio?: string;
  photo?: string;
  image?: string;
  certificate?: string;
  slotDuration?: number;
  autoApprove?: boolean;
  consultationFee: number;
  followUpFee?: number;
  phone?: string;
  email?: string;
  chamberAddress?: string;
  bmdcNumber?: string;
  schedules?: Schedule[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  isActive: boolean;
  doctors?: Doctor[];
  _count?: { doctors: number };
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  price?: number;
  departmentId?: string;
  department?: Department;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  doctorId: string;
  doctor?: Doctor;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  slotDuration: number; // minutes
  maxPatients: number;
  isActive: boolean;
}

export interface Appointment {
  id: string;
  appointmentNumber: string;
  patientId: string;
  patient?: Patient;
  doctorId: string;
  doctor?: Doctor;
  date: string;
  time: string;
  endTime?: string;
  status: AppointmentStatus;
  type?: string;
  reason?: string;
  notes?: string;
  prescription?: string;
  fee?: number;
  isPaid: boolean;
  serialNumber?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  userId?: string;
  user?: User;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  gender?: Gender;
  bloodGroup?: BloodGroup;
  address?: string;
  emergencyContact?: string;
  medicalHistory?: string;
  allergies?: string;
  appointments?: Appointment[];
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  authorId: string;
  author?: User;
  tags?: string[];
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  category?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  type: string;
  group?: string;
  label?: string;
  description?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  designation?: string;
  photo?: string;
  content: string;
  rating: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// API Response Types
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ---------------------------------------------------------------------------
// Form / Create / Update Types
// ---------------------------------------------------------------------------

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface CreateDoctorInput {
  name: string;
  title: string;
  specialization: string;
  departmentId?: string;
  qualification: string;
  experience: number;
  bio?: string;
  photo?: string;
  consultationFee: number;
  followUpFee?: number;
  phone?: string;
  email?: string;
  bmdcNumber?: string;
}

export interface UpdateDoctorInput extends Partial<CreateDoctorInput> {
  isActive?: boolean;
}

export interface CreateDepartmentInput {
  name: string;
  description?: string;
  icon?: string;
  image?: string;
}

export interface UpdateDepartmentInput extends Partial<CreateDepartmentInput> {
  isActive?: boolean;
}

export interface CreateServiceInput {
  name: string;
  description?: string;
  icon?: string;
  image?: string;
  price?: number;
  departmentId?: string;
}

export interface UpdateServiceInput extends Partial<CreateServiceInput> {
  isActive?: boolean;
}

export interface BookAppointmentInput {
  patientId?: string;
  doctorId: string;
  date: string;
  time: string;
  type?: string;
  reason?: string;
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
}

export interface UpdateAppointmentInput {
  status?: AppointmentStatus;
  notes?: string;
  prescription?: string;
  fee?: number;
  isPaid?: boolean;
}

export interface CreatePatientInput {
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  gender?: Gender;
  bloodGroup?: BloodGroup;
  address?: string;
  emergencyContact?: string;
  medicalHistory?: string;
  allergies?: string;
}

export interface UpdatePatientInput extends Partial<CreatePatientInput> {}

export interface CreateBlogPostInput {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  isPublished?: boolean;
}

export interface UpdateBlogPostInput extends Partial<CreateBlogPostInput> {}

export interface CreateGalleryItemInput {
  title: string;
  description?: string;
  imageUrl: string;
  category?: string;
  sortOrder?: number;
}

export interface CreateTestimonialInput {
  name: string;
  designation?: string;
  photo?: string;
  content: string;
  rating: number;
}

export interface UpdateTestimonialInput
  extends Partial<CreateTestimonialInput> {
  isActive?: boolean;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardStats {
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  todayAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
  monthlyRevenue: number;
  recentAppointments: Appointment[];
  appointmentsByStatus: { status: string; count: number }[];
  appointmentsByMonth: { month: string; count: number }[];
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

export interface TimeSlot {
  time: string;
  available: boolean;
  serialNumber?: number;
}

export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
  badge?: string;
}
