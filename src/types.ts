export enum UserRole {
  Owner = 'Owner',
  CoOwner = 'Co-Owner',
  Recursos = 'Recursos',
  MegaVIP = 'Mega VIP',
  SuperVIP = 'Super VIP',
  VIP = 'VIP',
  Usuario = 'Usuario'
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.Owner]: 7,
  [UserRole.CoOwner]: 6,
  [UserRole.Recursos]: 5,
  [UserRole.MegaVIP]: 4,
  [UserRole.SuperVIP]: 3,
  [UserRole.VIP]: 2,
  [UserRole.Usuario]: 1,
};

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
  avatarUrl?: string;
  profileBackground?: string; // Predefined key or custom URL
  isSuspended: boolean;
  roleExpiresAt?: string; // ISO string when temporary role expires
  originalRole?: UserRole; // Role to restore when temp role expires
  googleId?: string; // Google identity provider ID
}

export enum ResourceCategory {
  Plugins = 'Plugins',
  Modelos = 'Modelos',
  Configuraciones = 'Configuraciones',
  Setups = 'Setups',
  ConfiguracionesDiscord = 'Configuraciones de Discord',
  Otros = 'Otros'
}

export interface Resource {
  id: string;
  name: string;
  description: string;
  category: ResourceCategory;
  imageUrl?: string;
  minRole: UserRole;
  downloadMethod: 'file' | 'link';
  downloadUrl?: string; // Can be a link or local relative upload path
  fileName?: string;
  createdAt: string;
}

export interface StreamingAccount {
  id: string;
  platform: string;
  email: string;
  password?: string; // Visible only to authorized users
  accountType: string;
  description: string;
  imageUrl?: string;
  minRole: UserRole;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  startDate: string;
  endDate: string;
  status: 'active' | 'closed';
  createdAt: string;
  votedUserIds: string[]; // Track which users have voted
}

export interface ActivityLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  details: string;
  ip?: string;
  createdAt: string;
}

export interface VerificationCode {
  email: string;
  code: string;
  expiresAt: number; // timestamp
  type: 'verify_email' | 'recover_password';
}

export interface Comment {
  id: string;
  resourceId: string;
  userId: string;
  username: string;
  avatarUrl: string;
  content: string;
  parentId?: string;
  createdAt: string;
}

export interface Giveaway {
  id: string;
  prize: string;
  requirements: string;
  endDate: string; // ISO string when it ends
  status: 'active' | 'closed';
  createdAt: string;
  participants: { userId: string; username: string }[];
  winner?: { userId: string; username: string };
  creatorId: string;
  creatorName: string;
  minRole?: UserRole;
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  startDate: string; // Event start date and time (ISO)
  endDate: string; // Event end date and time (ISO)
  location: string; // e.g. "Discord #general"
  status: 'active' | 'closed';
  createdAt: string;
  creatorId: string;
  creatorName: string;
  rsvps: {
    userId: string;
    username: string;
    status: 'going' | 'maybe' | 'not_going';
  }[];
}

export interface SystemStats {
  userCount: number;
  resourceCount: number;
  streamingCount: number;
  activePollCount: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string;
  role: UserRole;
  content: string;
  createdAt: string;
}

export enum RequestStatus {
  Pendiente = 'Pendiente',
  EnRevision = 'En revisión',
  Aprobada = 'Aprobada',
  Rechazada = 'Rechazada',
  Completada = 'Completada'
}

export interface RequestComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
}

export interface ResourceRequest {
  id: string;
  userId: string;
  userEmail: string;
  username: string;
  category: ResourceCategory;
  name: string;
  description?: string;
  referenceLink?: string;
  status: RequestStatus;
  internalComments: RequestComment[];
  createdAt: string;
  updatedAt: string;
}

export interface DownloadLog {
  id: string;
  userId: string;
  userEmail: string;
  username: string;
  resourceId: string;
  resourceName: string;
  category: ResourceCategory;
  ip: string;
  device: string;
  status: 'Completada' | 'Fallida';
  createdAt: string;
}

export interface ReviewReply {
  id: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  username: string;
  userEmail: string;
  userRole: UserRole;
  avatarUrl?: string;
  rating: number;
  comment: string;
  hearts: string[]; // Array of userIds
  replies: ReviewReply[];
  createdAt: string;
}

export interface PromoCode {
  id: string;
  code: string;
  role: UserRole;
  duration: string; // e.g., "30s", "10m", "24h", "7d", "30d", "90d" or "Permanente"
  maxUses: number;
  useCount: number;
  expiresAt?: string; // Optional expiration ISO string
  isActive: boolean;
  createdAt: string;
}

export interface PromoCodeRedeem {
  id: string;
  codeId: string;
  code: string;
  userId: string;
  username: string;
  userEmail: string;
  ip: string;
  redeemedAt: string;
  status: 'Exitoso' | 'Fallido';
  details?: string;
}

export interface Donation {
  id: string;
  userId: string;
  userEmail: string;
  username: string;
  title: string;
  description: string;
  category: ResourceCategory;
  imageUrl?: string;
  downloadMethod: 'file' | 'link';
  downloadUrl?: string; // URL or relative local path
  fileName?: string;
  version?: string;
  tags?: string[];
  status: 'Pendiente' | 'Aprobada' | 'Rechazada';
  observation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'model';
  content: string;
  createdAt: string;
}



