import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import {
  UserRole,
  ROLE_HIERARCHY,
  ResourceCategory,
  type User,
  type Resource,
  type StreamingAccount,
  type Announcement,
  type Poll,
  type ActivityLog,
  type VerificationCode,
  type Comment,
  type Giveaway,
  type CommunityEvent,
  type ChatMessage,
  type ResourceRequest,
  type DownloadLog,
  RequestStatus,
  type RequestComment,
  type PromoCode,
  type PromoCodeRedeem,
  type Donation
} from './src/types';

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON body parsing with large limit for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Paths
const DB_FILE = path.join(process.cwd(), 'lunatic_db.json');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads folder exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Ensure the uploaded files can be served
app.use('/uploads', express.static(UPLOADS_DIR));

// Initialize Database structure
interface DBStructure {
  users: (User & { passwordHash: string })[];
  resources: Resource[];
  streamingAccounts: StreamingAccount[];
  announcements: Announcement[];
  polls: Poll[];
  giveaways: Giveaway[];
  events: CommunityEvent[];
  activityLogs: ActivityLog[];
  verificationCodes: VerificationCode[];
  sessions: Record<string, string>; // token -> userId
  comments: Comment[];
  chatMessages: ChatMessage[];
  resourceRequests: ResourceRequest[];
  downloadLogs: DownloadLog[];
  reviews: any[];
  chatCooldown?: number;
  sessionSecret?: string;
  promoCodes?: PromoCode[];
  promoCodeRedeems?: PromoCodeRedeem[];
  donations?: Donation[];
}

const initialDb: DBStructure = {
  users: [],
  resources: [],
  streamingAccounts: [],
  announcements: [],
  polls: [],
  giveaways: [],
  events: [],
  activityLogs: [],
  verificationCodes: [],
  sessions: {},
  comments: [],
  chatMessages: [],
  resourceRequests: [],
  downloadLogs: [],
  reviews: [],
  chatCooldown: 3,
  sessionSecret: crypto.randomBytes(32).toString('hex'),
  promoCodes: [],
  promoCodeRedeems: [],
  donations: []
};

// Global DB in-memory cache
let db: DBStructure = { ...initialDb };

// Load database from file
function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(data);
      // Ensure all collections are initialized
      db.users = db.users || [];
      db.resources = db.resources || [];
      db.streamingAccounts = db.streamingAccounts || [];
      db.announcements = db.announcements || [];
      db.polls = db.polls || [];
      db.giveaways = db.giveaways || [];
      db.events = db.events || [];
      db.activityLogs = db.activityLogs || [];
      db.verificationCodes = db.verificationCodes || [];
      db.sessions = db.sessions || {};
      db.comments = db.comments || [];
      db.chatMessages = db.chatMessages || [];
      db.resourceRequests = db.resourceRequests || [];
      db.downloadLogs = db.downloadLogs || [];
      db.reviews = db.reviews || [];
      db.promoCodes = db.promoCodes || [];
      db.promoCodeRedeems = db.promoCodeRedeems || [];
      db.donations = db.donations || [];
      if (db.chatCooldown === undefined) {
        db.chatCooldown = 3;
      }
      if (!db.sessionSecret) {
        db.sessionSecret = crypto.randomBytes(32).toString('hex');
        saveDB();
      }
    } else {
      saveDB();
    }
  } catch (error) {
    console.error('Error loading database, initializing blank:', error);
    db = { ...initialDb };
    saveDB();
  }
}

// Save database to file
function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

loadDB();

// Hardcoded Owners check
const IMMUTABLE_OWNERS = ['matiascuenta71@gmail.com', 'arturocordo02@gmail.com', 'miluskacabrera02@gmail.com', 'feijoocabrera8@gmail.com'];

// Password hashing helper (PBKDF2)
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

function createSignedToken(payload: any): string {
  const secret = db.sessionSecret || 'default-fallback-secret-key-12345';
  const payloadStr = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadStr).toString('base64');
  const signature = crypto.createHmac('sha256', secret).update(payloadBase64).digest('base64url');
  return `${payloadBase64}.${signature}`;
}

function verifySignedToken(token: string): any | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadBase64, signature] = parts;
  const secret = db.sessionSecret || 'default-fallback-secret-key-12345';
  const expectedSignature = crypto.createHmac('sha256', secret).update(payloadBase64).digest('base64url');
  
  if (signature !== expectedSignature) {
    return null;
  }
  
  try {
    const payloadStr = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    return JSON.parse(payloadStr);
  } catch (e) {
    return null;
  }
}

// Activity Logging helper
function logActivity(userId: string | undefined, email: string | undefined, action: string, details: string, req?: express.Request) {
  const log: ActivityLog = {
    id: crypto.randomUUID(),
    userId,
    userEmail: email,
    action,
    details,
    ip: req?.ip || '127.0.0.1',
    createdAt: new Date().toISOString()
  };
  db.activityLogs.unshift(log);
  // Keep only last 500 logs to prevent file bloat
  if (db.activityLogs.length > 500) {
    db.activityLogs = db.activityLogs.slice(0, 500);
  }
  saveDB();
  console.log(`[ACTIVITY LOG] ${email || 'Anonymous'} - ${action}: ${details}`);
}

// Automatic check and drawing for expired giveaways
function checkAndAutoDrawGiveaways() {
  db.giveaways = db.giveaways || [];
  const now = new Date();
  let changed = false;

  for (const giveaway of db.giveaways) {
    if (giveaway.status === 'active') {
      const end = new Date(giveaway.endDate);
      if (!isNaN(end.getTime()) && end <= now) {
        // Active expired giveaway! Run drawing logic
        if (giveaway.participants && giveaway.participants.length > 0) {
          const randomIndex = Math.floor(Math.random() * giveaway.participants.length);
          const winner = giveaway.participants[randomIndex];
          giveaway.winner = winner;

          // Mention the winner in Global Chat!
          const systemMsg = {
            id: crypto.randomUUID(),
            userId: 'system',
            username: 'Sorteos Lunatic',
            avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=LunaticGiveaways',
            role: UserRole.Owner,
            content: `🎉 ¡El sorteo de **${giveaway.prize}** ha finalizado! Felicidades al ganador: @${winner.username} 🎁✨`,
            createdAt: new Date().toISOString()
          };
          db.chatMessages = db.chatMessages || [];
          db.chatMessages.push(systemMsg);
          if (db.chatMessages.length > 200) {
            db.chatMessages = db.chatMessages.slice(-200);
          }
          broadcastMessage({ type: 'msg', message: systemMsg });
        } else {
          giveaway.winner = null;

          // System message: no participants
          const systemMsg = {
            id: crypto.randomUUID(),
            userId: 'system',
            username: 'Sorteos Lunatic',
            avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=LunaticGiveaways',
            role: UserRole.Owner,
            content: `⚠️ El sorteo de **${giveaway.prize}** finalizó sin ganadores porque no hubo participantes. 😢`,
            createdAt: new Date().toISOString()
          };
          db.chatMessages = db.chatMessages || [];
          db.chatMessages.push(systemMsg);
          if (db.chatMessages.length > 200) {
            db.chatMessages = db.chatMessages.slice(-200);
          }
          broadcastMessage({ type: 'msg', message: systemMsg });
        }
        giveaway.status = 'closed';
        changed = true;

        logActivity(
          undefined,
          'system@lunatic.web',
          'AUTO_DRAW_SORTEO',
          `Sorteo "${giveaway.prize}" finalizado automáticamente por expiración de tiempo. Ganador: ${giveaway.winner ? giveaway.winner.username : 'Ninguno (sin participantes)'}`,
          undefined
        );
      }
    }
  }

  if (changed) {
    saveDB();
  }
}

// Automatic check and enforcement for expired roles
function checkAndEnforceRoleExpirations() {
  const now = new Date();
  let modified = false;
  
  db.users.forEach(user => {
    if (user.roleExpiresAt) {
      const expiresAt = new Date(user.roleExpiresAt);
      if (now >= expiresAt) {
        // Expired! Revert
        const oldRole = user.role;
        const newRole = user.originalRole || UserRole.Usuario;
        
        user.role = newRole;
        delete user.roleExpiresAt;
        delete user.originalRole;
        modified = true;
        
        // Log to Activity Logs
        const logId = crypto.randomUUID();
        const expirationLog: ActivityLog = {
          id: logId,
          userId: user.id,
          userEmail: user.email,
          action: 'EXPIRACION_ROL_AUTOMATICO',
          details: `El rol temporal "${oldRole}" de ${user.username} ha expirado. Restablecido a su rol anterior: "${newRole}".`,
          createdAt: now.toISOString()
        };
        db.activityLogs = db.activityLogs || [];
        db.activityLogs.unshift(expirationLog);
        
        console.log(`[ROLE EXPIRED] User ${user.username} reverted from ${oldRole} to ${newRole}`);
      }
    }
  });
  
  if (modified) {
    saveDB();
  }
}

// Middleware: Authenticate User
function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
  checkAndEnforceRoleExpirations();
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autorizado. Se requiere token.' });
    return;
  }
  const token = authHeader.split(' ')[1];
  let userId = db.sessions[token];
  let user = userId ? db.users.find(u => u.id === userId) : null;

  // Fallback self-healing: If session or user is missing in memory/json (due to container restart),
  // parse the token which encodes the user's details and restore them on-the-fly.
  if (!userId || !user) {
    const parsed = verifySignedToken(token);
    if (parsed && parsed.id && parsed.email) {
      let existingUser = db.users.find(u => u.id === parsed.id || u.email.toLowerCase() === parsed.email.toLowerCase());
      if (!existingUser) {
        existingUser = {
          id: parsed.id,
          email: parsed.email.toLowerCase().trim(),
          username: parsed.username || 'Usuario',
          role: parsed.role || UserRole.Usuario,
          isVerified: parsed.isVerified !== undefined ? parsed.isVerified : true,
          createdAt: parsed.createdAt || new Date().toISOString(),
          isSuspended: parsed.isSuspended || false,
          avatarUrl: parsed.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(parsed.username || 'Usuario')}`,
          profileBackground: parsed.profileBackground || 'bg-slate-900',
          passwordHash: parsed.passwordHash || ''
        };
        db.users.push(existingUser);
        saveDB();
      }
      db.sessions[token] = existingUser.id;
      saveDB();
      userId = existingUser.id;
      user = existingUser;
    }
  }

  if (!userId) {
    res.status(401).json({ error: 'Sesión inválida o expirada.' });
    return;
  }
  if (!user) {
    res.status(401).json({ error: 'Usuario no encontrado.' });
    return;
  }
  
  // Automatically enforce Owner role for anyone in IMMUTABLE_OWNERS list to prevent caching/out-of-sync issues
  if (IMMUTABLE_OWNERS.includes(user.email.toLowerCase())) {
    if (user.role !== UserRole.Owner) {
      user.role = UserRole.Owner;
      saveDB();
    }
  }

  if (user.isSuspended) {
    res.status(403).json({ error: 'Tu cuenta se encuentra suspendida. Contacta a soporte.' });
    return;
  }
  (req as any).user = user;
  (req as any).token = token;
  next();
}

// Middleware: Role Authorization
function requireRole(minRole: UserRole) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user as User;
    if (!user) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }
    const userLevel = ROLE_HIERARCHY[user.role] || 1;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 1;
    if (userLevel < requiredLevel) {
      res.status(403).json({
        error: `Acceso denegado. Se requiere rango ${minRole} o superior. Tu rango actual es ${user.role}.`
      });
      return;
    }
    next();
  };
}

// Helper: Send Custom Elegant Email
function sendEmailSimulation(to: string, subject: string, title: string, content: string, code: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body {
            background-color: #0b0f19;
            color: #f3f4f6;
            font-family: 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 40px 20px;
          }
          .card {
            background-color: #111827;
            border: 1px solid #374151;
            border-top: 4px solid #8b5cf6;
            border-radius: 8px;
            max-width: 500px;
            margin: 0 auto;
            padding: 32px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          }
          .logo {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            color: #a78bfa;
            letter-spacing: 2px;
            margin-bottom: 24px;
          }
          h2 {
            font-size: 20px;
            margin-top: 0;
            color: #f3f4f6;
            text-align: center;
          }
          p {
            line-height: 1.6;
            color: #9ca3af;
            font-size: 15px;
          }
          .code-box {
            background-color: #1f2937;
            border: 1px dashed #4b5563;
            border-radius: 6px;
            padding: 16px;
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            letter-spacing: 6px;
            color: #60a5fa;
            margin: 24px 0;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #4b5563;
            margin-top: 32px;
            border-top: 1px solid #1f2937;
            padding-top: 16px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">LUNATIC COMMUNITY</div>
          <h2>${title}</h2>
          <p>${content}</p>
          <div class="code-box">${code}</div>
          <p style="text-align: center; font-size: 13px; color: #ef4444;">
            * Este código expirará en 10 minutos y puede utilizarse solo una vez.
          </p>
          <div class="footer">
            © ${new Date().getFullYear()} Lunatic Community. Todos los derechos reservados.
          </div>
        </div>
      </body>
    </html>
  `;

  // Log the simulated email to the server console instead of saving it to the database
  console.log(`[SIMULATED EMAIL SENT] To: ${to} | Subject: ${subject} | Code: ${code}`);
}

// -------------------------------------------------------------
// AUTH ENDPOINTS
// -------------------------------------------------------------

// REGISTER
app.post('/api/auth/register', (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password) {
    res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = db.users.find(u => u.email.toLowerCase() === normalizedEmail || u.username.toLowerCase() === username.toLowerCase().trim());
  if (existingUser) {
    res.status(400).json({ error: 'El correo electrónico o nombre de usuario ya está registrado.' });
    return;
  }

  const isImmutableOwner = IMMUTABLE_OWNERS.includes(normalizedEmail);
  const userRole = isImmutableOwner ? UserRole.Owner : UserRole.Usuario;
  const isVerified = true; // Auto-verify all users upon registration

  const newUser: User = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    username: username.trim(),
    role: userRole,
    isVerified,
    createdAt: new Date().toISOString(),
    isSuspended: false,
    avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(username)}`,
    profileBackground: 'bg-slate-900'
  };

  const passwordHash = hashPassword(password);
  db.users.push({ ...newUser, passwordHash });

  // Generate a self-healing active Session Token immediately containing full user metadata
  const tokenPayload = {
    id: newUser.id,
    email: newUser.email,
    username: newUser.username,
    role: newUser.role,
    isVerified: newUser.isVerified,
    createdAt: newUser.createdAt,
    avatarUrl: newUser.avatarUrl,
    profileBackground: newUser.profileBackground,
    isSuspended: newUser.isSuspended,
    passwordHash: passwordHash
  };
  const token = createSignedToken(tokenPayload);
  db.sessions[token] = newUser.id;
  
  saveDB();

  logActivity(newUser.id, newUser.email, 'REGISTRO', `Usuario registrado y verificado automáticamente como ${userRole}`, req);

  res.status(201).json({
    message: 'Registro completado exitosamente.',
    token,
    user: newUser
  });
});

// VERIFY EMAIL
app.post('/api/auth/verify-email', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    res.status(400).json({ error: 'Correo y código son requeridos.' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const codeRecordIndex = db.verificationCodes.findIndex(
    c => c.email === normalizedEmail && c.code === code && c.type === 'verify_email'
  );

  if (codeRecordIndex === -1) {
    res.status(400).json({ error: 'Código de verificación incorrecto.' });
    return;
  }

  const codeRecord = db.verificationCodes[codeRecordIndex];
  if (Date.now() > codeRecord.expiresAt) {
    // Delete expired code
    db.verificationCodes.splice(codeRecordIndex, 1);
    saveDB();
    res.status(400).json({ error: 'El código ha expirado. Por favor solicita uno nuevo.' });
    return;
  }

  // Code is valid. Update user.
  const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    res.status(400).json({ error: 'Usuario no encontrado.' });
    return;
  }

  user.isVerified = true;
  // Remove used verification code
  db.verificationCodes.splice(codeRecordIndex, 1);
  saveDB();

  logActivity(user.id, user.email, 'VERIFICACIÓN_CORREO', 'Correo verificado exitosamente. Cuenta activada.', req);

  res.json({ message: 'Cuenta activada exitosamente. Ya puedes iniciar sesión.' });
});

// RESEND CODE
app.post('/api/auth/resend-code', (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Correo requerido.' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    res.status(404).json({ error: 'No se encontró ningún usuario con ese correo.' });
    return;
  }

  if (user.isVerified) {
    res.status(400).json({ error: 'Esta cuenta ya está verificada.' });
    return;
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  db.verificationCodes = db.verificationCodes.filter(c => c.email !== normalizedEmail || c.type !== 'verify_email');
  db.verificationCodes.push({
    email: normalizedEmail,
    code,
    expiresAt,
    type: 'verify_email'
  });
  saveDB();

  sendEmailSimulation(
    normalizedEmail,
    'Nuevo código de verificación - Lunatic Community',
    'Activación de cuenta',
    'Has solicitado un nuevo código de verificación. Utiliza el siguiente código para activar tu cuenta:',
    code
  );

  logActivity(user.id, user.email, 'REENVIO_CODIGO', 'Se reenvió el código de verificación.', req);

  res.json({ message: 'Nuevo código enviado exitosamente.' });
});

// LOGIN
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Correo y contraseña son requeridos.' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const userRecord = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (!userRecord) {
    res.status(400).json({ error: 'Credenciales incorrectas.' });
    return;
  }

  // Check if suspended
  if (userRecord.isSuspended) {
    res.status(403).json({ error: 'Tu cuenta se encuentra suspendida. Contacta a soporte.' });
    return;
  }

  // Check if verified
  if (!userRecord.isVerified) {
    res.status(403).json({ error: 'Debes verificar tu correo antes de poder acceder.', isUnverified: true });
    return;
  }

  // Verify password
  if (!verifyPassword(password, userRecord.passwordHash)) {
    res.status(400).json({ error: 'Credenciales incorrectas.' });
    return;
  }

  // Automatically enforce Owner role for anyone in IMMUTABLE_OWNERS list to prevent caching/out-of-sync issues
  if (IMMUTABLE_OWNERS.includes(userRecord.email.toLowerCase())) {
    if (userRecord.role !== UserRole.Owner) {
      userRecord.role = UserRole.Owner;
      saveDB();
    }
  }

  // Generate a self-healing active Session Token containing full user metadata
  const tokenPayload = {
    id: userRecord.id,
    email: userRecord.email,
    username: userRecord.username,
    role: userRecord.role,
    isVerified: userRecord.isVerified,
    createdAt: userRecord.createdAt,
    avatarUrl: userRecord.avatarUrl,
    profileBackground: userRecord.profileBackground,
    isSuspended: userRecord.isSuspended,
    passwordHash: userRecord.passwordHash
  };
  const token = createSignedToken(tokenPayload);
  db.sessions[token] = userRecord.id;
  saveDB();

  // Create clean user model to return
  const cleanUser: User = {
    id: userRecord.id,
    email: userRecord.email,
    username: userRecord.username,
    role: userRecord.role,
    isVerified: userRecord.isVerified,
    createdAt: userRecord.createdAt,
    avatarUrl: userRecord.avatarUrl,
    profileBackground: userRecord.profileBackground,
    isSuspended: userRecord.isSuspended
  };

  logActivity(userRecord.id, userRecord.email, 'LOGIN', 'Inicio de sesión exitoso', req);

  res.json({
    token,
    user: cleanUser
  });
});

// LOGOUT
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const userId = db.sessions[token];
    if (userId) {
      const user = db.users.find(u => u.id === userId);
      logActivity(userId, user?.email, 'LOGOUT', 'Cierre de sesión', req);
    }
    delete db.sessions[token];
    saveDB();
  }
  res.json({ message: 'Sesión cerrada exitosamente.' });
});

// Note: Automated password recovery endpoints (/api/auth/recover-request and /api/auth/recover-verify) have been removed.
// Password resets are now handled manually by Owners through the admin panel.

// ME (GET USER SESSION)
app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: (req as any).user });
});

// -------------------------------------------------------------
// PROFILE ENDPOINTS
// -------------------------------------------------------------
app.put('/api/profile', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const { username, avatarUrl, profileBackground } = req.body;

  const userRecord = db.users.find(u => u.id === user.id);
  if (!userRecord) {
    res.status(404).json({ error: 'Usuario no encontrado.' });
    return;
  }

  if (username && username.trim()) {
    // Check if another user has this username
    const trimmedUsername = username.trim();
    const otherUser = db.users.find(u => u.id !== user.id && u.username.toLowerCase() === trimmedUsername.toLowerCase());
    if (otherUser) {
      res.status(400).json({ error: 'El nombre de usuario ya está en uso.' });
      return;
    }
    userRecord.username = trimmedUsername;
  }

  if (avatarUrl !== undefined) {
    userRecord.avatarUrl = avatarUrl;
  }

  if (profileBackground !== undefined) {
    userRecord.profileBackground = profileBackground;
  }

  saveDB();

  // Update request session user object too
  const updatedUser: User = {
    id: userRecord.id,
    email: userRecord.email,
    username: userRecord.username,
    role: userRecord.role,
    isVerified: userRecord.isVerified,
    createdAt: userRecord.createdAt,
    avatarUrl: userRecord.avatarUrl,
    profileBackground: userRecord.profileBackground,
    isSuspended: userRecord.isSuspended
  };

  logActivity(user.id, user.email, 'ACTUALIZAR_PERFIL', 'Perfil actualizado.', req);

  res.json({ user: updatedUser });
});

// Custom profile background image upload
app.post('/api/profile/background-upload', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const { fileName, fileData } = req.body; // base64 payload

  if (!fileName || !fileData) {
    res.status(400).json({ error: 'Archivo inválido.' });
    return;
  }

  try {
    const ext = path.extname(fileName).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      res.status(400).json({ error: 'Formato de imagen no permitido. Solo JPG, PNG, GIF y WEBP.' });
      return;
    }

    const uniqueName = `bg_${user.id}_${Date.now()}${ext}`;
    const filePath = path.join(UPLOADS_DIR, uniqueName);

    // Write file
    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    const publicUrl = `/uploads/${uniqueName}`;

    // Update user
    const userRecord = db.users.find(u => u.id === user.id);
    if (userRecord) {
      userRecord.profileBackground = publicUrl;
      saveDB();
    }

    logActivity(user.id, user.email, 'SUBIDA_FONDO_PERSONALIZADO', 'Fondo de perfil personalizado subido.', req);

    res.json({ backgroundUrl: publicUrl });
  } catch (err) {
    console.error('Error uploading background:', err);
    res.status(500).json({ error: 'Error al subir la imagen.' });
  }
});

// Custom profile avatar upload (Foto de Perfil)
app.post('/api/profile/avatar-upload', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const { fileName, fileData } = req.body; // base64 payload

  if (!fileName || !fileData) {
    res.status(400).json({ error: 'Archivo inválido.' });
    return;
  }

  try {
    const ext = path.extname(fileName).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
      res.status(400).json({ error: 'Tipo de archivo no soportado. Debe ser una imagen (.jpg, .png, .webp, .gif).' });
      return;
    }

    const uniqueName = `avatar_${user.id}_${Date.now()}${ext}`;
    const filePath = path.join(UPLOADS_DIR, uniqueName);

    // Write file
    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    const publicUrl = `/uploads/${uniqueName}`;

    // Update user
    const userRecord = db.users.find(u => u.id === user.id);
    if (userRecord) {
      userRecord.avatarUrl = publicUrl;
      saveDB();
    }

    logActivity(user.id, user.email, 'SUBIDA_AVATAR_PERSONALIZADO', 'Foto de perfil personalizada subida.', req);

    res.json({ avatarUrl: publicUrl });
  } catch (err) {
    console.error('Error uploading avatar:', err);
    res.status(500).json({ error: 'Error al subir la foto de perfil.' });
  }
});

// Generic resource image cover upload (Admin/Owner/Co-Owner/Recursos)
app.post('/api/admin/resources/image-upload', authenticate, requireRole(UserRole.Recursos), (req, res) => {
  const { fileName, fileData } = req.body; // base64 payload

  if (!fileName || !fileData) {
    res.status(400).json({ error: 'Archivo inválido.' });
    return;
  }

  try {
    const ext = path.extname(fileName).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
      res.status(400).json({ error: 'Tipo de archivo no soportado. Debe ser una imagen (.jpg, .png, .webp, .gif).' });
      return;
    }

    const uniqueName = `resource_img_${Date.now()}${ext}`;
    const filePath = path.join(UPLOADS_DIR, uniqueName);

    // Write file
    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    const publicUrl = `/uploads/${uniqueName}`;

    res.json({ imageUrl: publicUrl });
  } catch (err) {
    console.error('Error uploading resource cover image:', err);
    res.status(500).json({ error: 'Error al subir la imagen de portada.' });
  }
});

// -------------------------------------------------------------
// RESOURCES ENDPOINTS (With Role Checks)
// -------------------------------------------------------------

// Search resources & list
app.get('/api/resources', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const userLevel = ROLE_HIERARCHY[user.role] || 1;

  // Map resources and tag them as "unlocked" or "locked" based on level.
  // This fulfills: "Todos los recursos deberán indicar el rol mínimo necesario. Si un usuario intenta acceder sin permisos deberá mostrarse un mensaje indicando que necesita un rango superior."
  // Also only authorized users should see the download link.
  const mappedResources = db.resources.map(res => {
    const requiredLevel = ROLE_HIERARCHY[res.minRole] || 1;
    const hasAccess = userLevel >= requiredLevel;

    return {
      id: res.id,
      name: res.name,
      description: res.description,
      category: res.category,
      imageUrl: res.imageUrl,
      minRole: res.minRole,
      downloadMethod: res.downloadMethod,
      createdAt: res.createdAt,
      fileName: res.fileName,
      unlocked: hasAccess,
      // Hide URL if locked
      downloadUrl: hasAccess ? res.downloadUrl : null
    };
  });

  res.json({ resources: mappedResources });
});

// Log Resource Download
app.post('/api/resources/:id/download', authenticate, (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as User;
  const resource = db.resources.find(r => r.id === id);

  if (!resource) {
    res.status(404).json({ error: 'Recurso no encontrado.' });
    return;
  }

  const userLevel = ROLE_HIERARCHY[user.role] || 1;
  const requiredLevel = ROLE_HIERARCHY[resource.minRole] || 1;

  if (userLevel < requiredLevel) {
    // Record failed download attempt
    const failedLog: DownloadLog = {
      id: crypto.randomUUID(),
      userId: user.id,
      userEmail: user.email,
      username: user.username,
      resourceId: resource.id,
      resourceName: resource.name,
      category: resource.category,
      ip: req.ip || '127.0.0.1',
      device: req.headers['user-agent'] || 'Desconocido',
      status: 'Fallida',
      createdAt: new Date().toISOString()
    };
    db.downloadLogs = db.downloadLogs || [];
    db.downloadLogs.unshift(failedLog);
    saveDB();

    res.status(403).json({ error: 'Necesitas un rango superior para descargar este recurso.' });
    return;
  }

  // Record successful download
  const successLog: DownloadLog = {
    id: crypto.randomUUID(),
    userId: user.id,
    userEmail: user.email,
    username: user.username,
    resourceId: resource.id,
    resourceName: resource.name,
    category: resource.category,
    ip: req.ip || '127.0.0.1',
    device: req.headers['user-agent'] || 'Desconocido',
    status: 'Completada',
    createdAt: new Date().toISOString()
  };
  db.downloadLogs = db.downloadLogs || [];
  db.downloadLogs.unshift(successLog);
  saveDB();

  logActivity(user.id, user.email, 'DESCARGA_RECURSO', `Descargó el recurso: "${resource.name}"`, req);
  res.json({ success: true });
});

// Create Resource (Admin/Owner/Co-Owner/Recursos)
app.post('/api/admin/resources', authenticate, requireRole(UserRole.Recursos), (req, res) => {
  const { name, description, category, minRole, downloadMethod, downloadUrl, fileName, fileData } = req.body;

  if (!name || !description || !category || !minRole || !downloadMethod) {
    res.status(400).json({ error: 'Todos los campos obligatorios deben llenarse.' });
    return;
  }

  let finalDownloadUrl = downloadUrl || '';

  // Direct file upload handling
  if (downloadMethod === 'file' && fileData && fileName) {
    try {
      const ext = path.extname(fileName).toLowerCase();
      const cleanFileName = `resource_${Date.now()}_${path.basename(fileName).replace(/\s+/g, '_')}`;
      const filePath = path.join(UPLOADS_DIR, cleanFileName);

      const base64Data = fileData.replace(/^data:\w+\/\w+;base64,/, "");
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

      finalDownloadUrl = `/uploads/${cleanFileName}`;
    } catch (err) {
      console.error('Error saving direct resource file:', err);
      res.status(500).json({ error: 'Error al subir el archivo del recurso.' });
      return;
    }
  }

  const newResource: Resource = {
    id: crypto.randomUUID(),
    name,
    description,
    category: category as ResourceCategory,
    imageUrl: req.body.imageUrl || `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80`,
    minRole: minRole as UserRole,
    downloadMethod,
    downloadUrl: finalDownloadUrl,
    fileName: fileName || '',
    createdAt: new Date().toISOString()
  };

  db.resources.unshift(newResource);
  saveDB();

  logActivity(
    (req as any).user.id,
    (req as any).user.email,
    'CREAR_RECURSO',
    `Recurso creado: "${name}" (${category}), Rol mínimo: ${minRole}`,
    req
  );

  res.status(201).json({ resource: newResource });
});

// Edit Resource
app.put('/api/admin/resources/:id', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  const { id } = req.params;
  const { name, description, category, minRole, downloadMethod, downloadUrl, fileName, fileData, imageUrl } = req.body;

  const resource = db.resources.find(r => r.id === id);
  if (!resource) {
    res.status(404).json({ error: 'Recurso no encontrado.' });
    return;
  }

  let finalDownloadUrl = downloadUrl !== undefined ? downloadUrl : resource.downloadUrl;

  if (downloadMethod === 'file' && fileData && fileName) {
    try {
      const ext = path.extname(fileName).toLowerCase();
      const cleanFileName = `resource_${Date.now()}_${path.basename(fileName).replace(/\s+/g, '_')}`;
      const filePath = path.join(UPLOADS_DIR, cleanFileName);

      const base64Data = fileData.replace(/^data:\w+\/\w+;base64,/, "");
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

      finalDownloadUrl = `/uploads/${cleanFileName}`;
      resource.fileName = fileName;
    } catch (err) {
      console.error('Error saving edited resource file:', err);
      res.status(500).json({ error: 'Error al subir el nuevo archivo.' });
      return;
    }
  }

  resource.name = name || resource.name;
  resource.description = description || resource.description;
  resource.category = (category as ResourceCategory) || resource.category;
  resource.minRole = (minRole as UserRole) || resource.minRole;
  resource.downloadMethod = downloadMethod || resource.downloadMethod;
  resource.downloadUrl = finalDownloadUrl;
  if (imageUrl) {
    resource.imageUrl = imageUrl;
  }

  saveDB();

  logActivity(
    (req as any).user.id,
    (req as any).user.email,
    'EDITAR_RECURSO',
    `Recurso editado: "${resource.name}"`,
    req
  );

  res.json({ resource });
});

// Delete Resource
app.delete('/api/admin/resources/:id', authenticate, requireRole(UserRole.Owner), (req, res) => {
  const { id } = req.params;
  const index = db.resources.findIndex(r => r.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Recurso no encontrado.' });
    return;
  }

  const resourceName = db.resources[index].name;
  db.resources.splice(index, 1);
  saveDB();

  logActivity(
    (req as any).user.id,
    (req as any).user.email,
    'ELIMINAR_RECURSO',
    `Recurso eliminado: "${resourceName}"`,
    req
  );

  res.json({ success: true });
});

// -------------------------------------------------------------
// RESOURCE COMMENTS ENDPOINTS
// -------------------------------------------------------------

// Rate limiter helper (in-memory, per-user, non-persisted)
const userCommentTimestamps = new Map<string, number>();

// Get all comments for a resource
app.get('/api/resources/:resourceId/comments', authenticate, (req, res) => {
  const { resourceId } = req.params;
  const resource = db.resources.find(r => r.id === resourceId);
  if (!resource) {
    res.status(404).json({ error: 'Recurso no encontrado.' });
    return;
  }

  // Filter comments for this resource
  const resourceComments = db.comments.filter(c => c.resourceId === resourceId);
  res.json({ comments: resourceComments });
});

// Post a comment or reply to a comment
app.post('/api/resources/:resourceId/comments', authenticate, (req, res) => {
  const { resourceId } = req.params;
  const { content, parentId } = req.body;
  const user = (req as any).user as User;

  const resource = db.resources.find(r => r.id === resourceId);
  if (!resource) {
    res.status(404).json({ error: 'Recurso no encontrado.' });
    return;
  }

  // 1. Validate content
  if (!content || typeof content !== 'string') {
    res.status(400).json({ error: 'El contenido del comentario es requerido.' });
    return;
  }

  const trimmedContent = content.trim();
  if (trimmedContent.length < 2) {
    res.status(400).json({ error: 'El comentario debe tener al menos 2 caracteres.' });
    return;
  }

  if (trimmedContent.length > 500) {
    res.status(400).json({ error: 'El comentario no puede superar los 500 caracteres.' });
    return;
  }

  // 2. Anti-spam rate limiting: max 1 comment every 5 seconds per user
  const now = Date.now();
  const lastCommentTime = userCommentTimestamps.get(user.id) || 0;
  if (now - lastCommentTime < 5000) {
    res.status(429).json({ error: 'Por favor, espera unos segundos antes de volver a comentar.' });
    return;
  }

  // 3. Prevent exact duplicates (basic duplicate content spam protection)
  const isDuplicate = db.comments.some(
    c => c.resourceId === resourceId && c.userId === user.id && c.content.trim() === trimmedContent && (now - new Date(c.createdAt).getTime() < 300000) // 5 minutes duplicate protection
  );
  if (isDuplicate) {
    res.status(400).json({ error: 'Ya has publicado un comentario idéntico recientemente.' });
    return;
  }

  // 4. Validate parentId if replying
  if (parentId) {
    const parentComment = db.comments.find(c => c.id === parentId);
    if (!parentComment) {
      res.status(400).json({ error: 'El comentario al que intentas responder no existe.' });
      return;
    }
    if (parentComment.resourceId !== resourceId) {
      res.status(400).json({ error: 'El comentario padre no pertenece a este recurso.' });
      return;
    }
  }

  // Record timestamp for rate limit
  userCommentTimestamps.set(user.id, now);

  const newComment: Comment = {
    id: crypto.randomUUID(),
    resourceId,
    userId: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.username)}`,
    content: trimmedContent,
    parentId: parentId || undefined,
    createdAt: new Date().toISOString()
  };

  db.comments.push(newComment);
  saveDB();

  logActivity(
    user.id,
    user.email,
    parentId ? 'RESPONDER_COMENTARIO' : 'CREAR_COMENTARIO',
    `${parentId ? 'Respondió a un comentario' : 'Comentó'} en el recurso: "${resource.name}"`,
    req
  );

  res.status(201).json({ comment: newComment });
});

// Delete a comment (Author or Admin: Owner / Co-Owner)
app.delete('/api/comments/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as User;

  const commentIndex = db.comments.findIndex(c => c.id === id);
  if (commentIndex === -1) {
    res.status(404).json({ error: 'Comentario no encontrado.' });
    return;
  }

  const comment = db.comments[commentIndex];
  const isAuthor = comment.userId === user.id;
  const isAdmin = user.role === UserRole.Owner || user.role === UserRole.CoOwner;

  if (!isAuthor && !isAdmin) {
    res.status(403).json({ error: 'No tienes permisos para eliminar este comentario.' });
    return;
  }

  // Cascade delete: If this is a parent comment, delete its replies too
  const repliesDeletedCount = db.comments.filter(c => c.parentId === id).length;
  db.comments = db.comments.filter(c => c.id !== id && c.parentId !== id);
  saveDB();

  logActivity(
    user.id,
    user.email,
    'ELIMINAR_COMENTARIO',
    `Eliminó comentario (${isAuthor ? 'autor' : 'moderador'}). Respuestas eliminadas: ${repliesDeletedCount}`,
    req
  );

  res.json({ success: true, repliesDeletedCount });
});

// -------------------------------------------------------------
// STREAMING GRATIS ENDPOINTS
// -------------------------------------------------------------
app.get('/api/streaming', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const userLevel = ROLE_HIERARCHY[user.role] || 1;

  // Users can see other listings but accounts require verification.
  // "Solo los usuarios autorizados podrán visualizar cada publicación."
  // So if they have role minimum required, they see the email and password, otherwise details are blanked/hidden.
  const mappedStreaming = db.streamingAccounts.map(account => {
    const requiredLevel = ROLE_HIERARCHY[account.minRole] || 1;
    const hasAccess = userLevel >= requiredLevel;

    return {
      id: account.id,
      platform: account.platform,
      accountType: account.accountType,
      description: account.description,
      imageUrl: account.imageUrl,
      minRole: account.minRole,
      createdAt: account.createdAt,
      unlocked: hasAccess,
      // Only include secrets if user level is authorized
      email: hasAccess ? account.email : '••••••••••••',
      password: hasAccess ? account.password : '••••••••••••'
    };
  });

  res.json({ streaming: mappedStreaming });
});

// Create Streaming Post (Admin/Owner/Co-Owner)
app.post('/api/admin/streaming', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  const { platform, email, password, accountType, description, imageUrl, minRole } = req.body;

  if (!platform || !email || !password || !minRole) {
    res.status(400).json({ error: 'La plataforma, Gmail, contraseña y rango mínimo son obligatorios.' });
    return;
  }

  const newListing: StreamingAccount = {
    id: crypto.randomUUID(),
    platform,
    email,
    password,
    accountType: accountType || '-',
    description: description || 'Sin descripción.',
    imageUrl: imageUrl || `https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?w=500&q=80`,
    minRole: minRole as UserRole,
    createdAt: new Date().toISOString()
  };

  db.streamingAccounts.unshift(newListing);
  saveDB();

  logActivity(
    (req as any).user.id,
    (req as any).user.email,
    'CREAR_STREAMING',
    `Cuenta de Streaming creada: ${platform} (${accountType}), Rango min: ${minRole}`,
    req
  );

  res.status(201).json({ streaming: newListing });
});

// Edit Streaming
app.put('/api/admin/streaming/:id', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  const { id } = req.params;
  const { platform, email, password, accountType, description, imageUrl, minRole } = req.body;

  const account = db.streamingAccounts.find(s => s.id === id);
  if (!account) {
    res.status(404).json({ error: 'Publicación de streaming no encontrada.' });
    return;
  }

  account.platform = platform || account.platform;
  account.email = email || account.email;
  account.password = password || account.password;
  account.accountType = accountType || account.accountType;
  account.description = description || account.description;
  account.minRole = (minRole as UserRole) || account.minRole;
  if (imageUrl) {
    account.imageUrl = imageUrl;
  }

  saveDB();

  logActivity(
    (req as any).user.id,
    (req as any).user.email,
    'EDITAR_STREAMING',
    `Cuenta de Streaming editada: ${account.platform}`,
    req
  );

  res.json({ streaming: account });
});

// Delete Streaming
app.delete('/api/admin/streaming/:id', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  const { id } = req.params;
  const index = db.streamingAccounts.findIndex(s => s.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Publicación de streaming no encontrada.' });
    return;
  }

  const platform = db.streamingAccounts[index].platform;
  db.streamingAccounts.splice(index, 1);
  saveDB();

  logActivity(
    (req as any).user.id,
    (req as any).user.email,
    'ELIMINAR_STREAMING',
    `Cuenta de Streaming eliminada: ${platform}`,
    req
  );

  res.json({ success: true });
});

// -------------------------------------------------------------
// ANNOUNCEMENTS ENDPOINTS
// -------------------------------------------------------------
app.get('/api/announcements', authenticate, (req, res) => {
  res.json({ announcements: db.announcements });
});

// Create Announcement (Only Owner can publish)
app.post('/api/admin/announcements', authenticate, requireRole(UserRole.Owner), (req, res) => {
  const { title, content, imageUrl } = req.body;
  const user = (req as any).user as User;

  if (!title || !content) {
    res.status(400).json({ error: 'Título y contenido son obligatorios.' });
    return;
  }

  const newAnnouncement: Announcement = {
    id: crypto.randomUUID(),
    title,
    content,
    imageUrl: imageUrl || undefined,
    authorId: user.id,
    authorName: user.username,
    createdAt: new Date().toISOString()
  };

  db.announcements.unshift(newAnnouncement);
  saveDB();

  logActivity(
    user.id,
    user.email,
    'CREAR_ANUNCIO',
    `Anuncio publicado: "${title}"`,
    req
  );

  res.status(201).json({ announcement: newAnnouncement });
});

// Delete Announcement (Owner only)
app.delete('/api/admin/announcements/:id', authenticate, requireRole(UserRole.Owner), (req, res) => {
  const { id } = req.params;
  const index = db.announcements.findIndex(a => a.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Anuncio no encontrado.' });
    return;
  }

  const title = db.announcements[index].title;
  db.announcements.splice(index, 1);
  saveDB();

  logActivity(
    (req as any).user.id,
    (req as any).user.email,
    'ELIMINAR_ANUNCIO',
    `Anuncio eliminado: "${title}"`,
    req
  );

  res.json({ success: true });
});

// -------------------------------------------------------------
// VOTACIONES (POLLS) ENDPOINTS
// -------------------------------------------------------------
app.get('/api/polls', authenticate, (req, res) => {
  res.json({ polls: db.polls });
});

// Vote in poll
app.post('/api/polls/:id/vote', authenticate, (req, res) => {
  const { id } = req.params;
  const { optionId } = req.body;
  const user = (req as any).user as User;

  const poll = db.polls.find(p => p.id === id);
  if (!poll) {
    res.status(404).json({ error: 'Votación no encontrada.' });
    return;
  }

  if (poll.status === 'closed') {
    res.status(400).json({ error: 'Esta votación está cerrada.' });
    return;
  }

  // Check end date
  if (new Date() > new Date(poll.endDate)) {
    poll.status = 'closed';
    saveDB();
    res.status(400).json({ error: 'Esta votación ha finalizado por fecha de cierre.' });
    return;
  }

  // Check if voted
  if (poll.votedUserIds.includes(user.id)) {
    res.status(400).json({ error: 'Ya has votado en esta encuesta.' });
    return;
  }

  const option = poll.options.find(o => o.id === optionId);
  if (!option) {
    res.status(400).json({ error: 'Opción de votación inválida.' });
    return;
  }

  option.votes += 1;
  poll.votedUserIds.push(user.id);
  saveDB();

  logActivity(
    user.id,
    user.email,
    'VOTAR',
    `Votó en la encuesta "${poll.title}" por la opción: "${option.text}"`,
    req
  );

  res.json({ poll });
});

// Create Poll (Owner only)
app.post('/api/admin/polls', authenticate, requireRole(UserRole.Owner), (req, res) => {
  const { title, description, options, startDate, endDate } = req.body;

  if (!title || !description || !options || !Array.isArray(options) || options.length < 2) {
    res.status(400).json({ error: 'La encuesta requiere título, descripción y al menos dos opciones.' });
    return;
  }

  const formattedOptions = options.map((opt: string) => ({
    id: crypto.randomUUID(),
    text: opt,
    votes: 0
  }));

  const newPoll: Poll = {
    id: crypto.randomUUID(),
    title,
    description,
    options: formattedOptions,
    startDate: startDate || new Date().toISOString(),
    endDate: endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    createdAt: new Date().toISOString(),
    votedUserIds: []
  };

  db.polls.unshift(newPoll);
  saveDB();

  logActivity(
    (req as any).user.id,
    (req as any).user.email,
    'CREAR_VOTACION',
    `Votación creada: "${title}"`,
    req
  );

  res.status(201).json({ poll: newPoll });
});

// Edit Poll (Owner only)
app.put('/api/admin/polls/:id', authenticate, requireRole(UserRole.Owner), (req, res) => {
  const { id } = req.params;
  const { title, description, endDate, status } = req.body;

  const poll = db.polls.find(p => p.id === id);
  if (!poll) {
    res.status(404).json({ error: 'Votación no encontrada.' });
    return;
  }

  poll.title = title || poll.title;
  poll.description = description || poll.description;
  poll.endDate = endDate || poll.endDate;
  poll.status = status || poll.status;

  saveDB();

  logActivity(
    (req as any).user.id,
    (req as any).user.email,
    'EDITAR_VOTACION',
    `Votación editada: "${poll.title}"`,
    req
  );

  res.json({ poll });
});

// Close Poll (Owner only)
app.post('/api/admin/polls/:id/close', authenticate, requireRole(UserRole.Owner), (req, res) => {
  const { id } = req.params;
  const poll = db.polls.find(p => p.id === id);

  if (!poll) {
    res.status(404).json({ error: 'Votación no encontrada.' });
    return;
  }

  poll.status = 'closed';
  saveDB();

  logActivity(
    (req as any).user.id,
    (req as any).user.email,
    'CERRAR_VOTACION',
    `Votación cerrada: "${poll.title}"`,
    req
  );

  res.json({ poll });
});

// Delete Poll (Owner only)
app.delete('/api/admin/polls/:id', authenticate, requireRole(UserRole.Owner), (req, res) => {
  const { id } = req.params;
  const index = db.polls.findIndex(p => p.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Votación no encontrada.' });
    return;
  }

  const title = db.polls[index].title;
  db.polls.splice(index, 1);
  saveDB();

  logActivity(
    (req as any).user.id,
    (req as any).user.email,
    'ELIMINAR_VOTACION',
    `Votación eliminada: "${title}"`,
    req
  );

  res.json({ success: true });
});

// -------------------------------------------------------------
// SORTEOS (GIVEAWAYS) & EVENTOS ENDPOINTS
// -------------------------------------------------------------

// Get all giveaways
app.get('/api/giveaways', authenticate, (req, res) => {
  checkAndAutoDrawGiveaways();
  res.json({ giveaways: db.giveaways });
});

// Create a giveaway (Owner / Co-Owner Only)
app.post('/api/admin/giveaways', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  const { prize, requirements, endDate, minRole } = req.body;
  const user = (req as any).user as User;

  if (!prize || !endDate) {
    res.status(400).json({ error: 'Faltan campos obligatorios: Premio y Fecha de Finalización.' });
    return;
  }

  const newGiveaway: Giveaway = {
    id: crypto.randomUUID(),
    prize,
    requirements: requirements || 'Ninguno',
    endDate,
    status: 'active',
    createdAt: new Date().toISOString(),
    participants: [],
    creatorId: user.id,
    creatorName: user.username,
    minRole: minRole as UserRole || undefined
  };

  db.giveaways.unshift(newGiveaway);
  saveDB();

  logActivity(
    user.id,
    user.email,
    'CREAR_SORTEO',
    `Sorteo creado: "${prize}" por ${user.username}`,
    req
  );

  res.status(201).json({ giveaway: newGiveaway });
});

// Participate in giveaway
app.post('/api/giveaways/:id/enter', authenticate, (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as User;

  const giveaway = db.giveaways.find(g => g.id === id);
  if (!giveaway) {
    res.status(404).json({ error: 'Sorteo no encontrado.' });
    return;
  }

  if (giveaway.status === 'closed') {
    res.status(400).json({ error: 'Este sorteo ya ha finalizado.' });
    return;
  }

  if (new Date() > new Date(giveaway.endDate)) {
    giveaway.status = 'closed';
    saveDB();
    res.status(400).json({ error: 'Este sorteo ha finalizado por fecha de cierre.' });
    return;
  }

  // Check minimum role if specified
  if (giveaway.minRole) {
    const userRoleLevel = ROLE_HIERARCHY[user.role] || 1;
    const requiredRoleLevel = ROLE_HIERARCHY[giveaway.minRole] || 1;
    if (userRoleLevel < requiredRoleLevel) {
      res.status(403).json({ error: `No tienes el rango mínimo requerido para participar en este sorteo. Requiere al menos: ${giveaway.minRole}` });
      return;
    }
  }

  // Check if already participating
  if (giveaway.participants.some(p => p.userId === user.id)) {
    res.status(400).json({ error: 'Ya estás participando en este sorteo.' });
    return;
  }

  giveaway.participants.push({
    userId: user.id,
    username: user.username
  });
  saveDB();

  logActivity(
    user.id,
    user.email,
    'PARTICIPAR_SORTEO',
    `Usuario ${user.username} entró al sorteo de: "${giveaway.prize}"`,
    req
  );

  res.json({ giveaway });
});

// Draw giveaway winner (Owner / Co-Owner Only)
app.post('/api/admin/giveaways/:id/draw', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as User;

  const giveaway = db.giveaways.find(g => g.id === id);
  if (!giveaway) {
    res.status(404).json({ error: 'Sorteo no encontrado.' });
    return;
  }

  if (giveaway.status === 'closed' && giveaway.winner) {
    res.status(400).json({ error: 'Este sorteo ya tiene un ganador seleccionado.' });
    return;
  }

  if (giveaway.participants.length === 0) {
    giveaway.status = 'closed';
    saveDB();
    res.status(400).json({ error: 'No hay participantes en este sorteo para seleccionar un ganador.' });
    return;
  }

  const randomIndex = Math.floor(Math.random() * giveaway.participants.length);
  const winner = giveaway.participants[randomIndex];

  giveaway.winner = winner;
  giveaway.status = 'closed';

  // Mention the winner in Global Chat!
  const systemMsg = {
    id: crypto.randomUUID(),
    userId: 'system',
    username: 'Sorteos Lunatic',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=LunaticGiveaways',
    role: UserRole.Owner,
    content: `🎉 ¡El sorteo de **${giveaway.prize}** ha finalizado! Felicidades al ganador: @${winner.username} 🎁✨`,
    createdAt: new Date().toISOString()
  };
  db.chatMessages = db.chatMessages || [];
  db.chatMessages.push(systemMsg);
  if (db.chatMessages.length > 200) {
    db.chatMessages = db.chatMessages.slice(-200);
  }
  broadcastMessage({ type: 'msg', message: systemMsg });

  saveDB();

  logActivity(
    user.id,
    user.email,
    'DIBUJAR_GANADOR_SORTEO',
    `Sorteo "${giveaway.prize}" finalizado. Ganador: ${winner.username}`,
    req
  );

  res.json({ giveaway });
});

// Re-elect winner (Co-Owner / Owner Only)
app.post('/api/admin/giveaways/:id/redraw', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  const { id } = req.params;
  const admin = (req as any).user as User;

  const giveaway = db.giveaways.find(g => g.id === id);
  if (!giveaway) {
    res.status(404).json({ error: 'Sorteo no encontrado.' });
    return;
  }

  const oldWinner = giveaway.winner;
  const oldWinnerId = oldWinner?.userId;

  // Exclude previous winner
  const eligibleParticipants = giveaway.participants.filter(p => p.userId !== oldWinnerId);

  if (eligibleParticipants.length === 0) {
    res.status(400).json({ error: 'No hay otros participantes elegibles para re-sortear.' });
    return;
  }

  const randomIndex = Math.floor(Math.random() * eligibleParticipants.length);
  const newWinner = eligibleParticipants[randomIndex];

  giveaway.winner = newWinner;
  giveaway.status = 'closed';

  // Mention the new winner in Global Chat!
  const systemMsg = {
    id: crypto.randomUUID(),
    userId: 'system',
    username: 'Sorteos Lunatic',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=LunaticGiveaways',
    role: UserRole.Owner,
    content: `🎉 ¡Se ha vuelto a sortear el premio de **${giveaway.prize}**! Felicidades al nuevo ganador seleccionado: @${newWinner.username} 🎁✨`,
    createdAt: new Date().toISOString()
  };
  db.chatMessages = db.chatMessages || [];
  db.chatMessages.push(systemMsg);
  if (db.chatMessages.length > 200) {
    db.chatMessages = db.chatMessages.slice(-200);
  }
  broadcastMessage({ type: 'msg', message: systemMsg });

  saveDB();

  logActivity(
    admin.id,
    admin.email,
    'RE_SORTEAR_GANADOR_SORTEO',
    `Sorteo "${giveaway.prize}" re-sorteado por ${admin.username}. Ganador anterior: ${oldWinner ? oldWinner.username : 'Ninguno'} -> Nuevo Ganador: ${newWinner.username}`,
    req
  );

  res.json({ giveaway });
});

// Delete giveaway (Owner / Co-Owner Only)
app.delete('/api/admin/giveaways/:id', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as User;

  const index = db.giveaways.findIndex(g => g.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Sorteo no encontrado.' });
    return;
  }

  const prize = db.giveaways[index].prize;
  db.giveaways.splice(index, 1);
  saveDB();

  logActivity(
    user.id,
    user.email,
    'ELIMINAR_SORTEO',
    `Sorteo eliminado: "${prize}"`,
    req
  );

  res.json({ success: true });
});

// Get all events
app.get('/api/events', authenticate, (req, res) => {
  res.json({ events: db.events });
});

// Create an event (Owner / Co-Owner Only)
app.post('/api/admin/events', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  const { title, description, startDate, endDate, location } = req.body;
  const user = (req as any).user as User;

  if (!title || !description || !startDate || !endDate) {
    res.status(400).json({ error: 'Faltan campos obligatorios: Título, descripción, fecha de inicio y fecha de finalización.' });
    return;
  }

  const newEvent: CommunityEvent = {
    id: crypto.randomUUID(),
    title,
    description,
    startDate,
    endDate,
    location: location || 'Discord Oficial',
    status: 'active',
    createdAt: new Date().toISOString(),
    creatorId: user.id,
    creatorName: user.username,
    rsvps: []
  };

  db.events.unshift(newEvent);
  saveDB();

  logActivity(
    user.id,
    user.email,
    'CREAR_EVENTO',
    `Evento creado: "${title}" (Inicio: ${startDate}, Fin: ${endDate})`,
    req
  );

  res.status(201).json({ event: newEvent });
});

// RSVP to event
app.post('/api/events/:id/rsvp', authenticate, (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'going' | 'maybe' | 'not_going'
  const user = (req as any).user as User;

  if (!status || !['going', 'maybe', 'not_going'].includes(status)) {
    res.status(400).json({ error: 'Estado de RSVP inválido.' });
    return;
  }

  const event = db.events.find(e => e.id === id);
  if (!event) {
    res.status(404).json({ error: 'Evento no encontrado.' });
    return;
  }

  // Remove existing RSVP if any
  event.rsvps = event.rsvps.filter(r => r.userId !== user.id);

  event.rsvps.push({
    userId: user.id,
    username: user.username,
    status
  });
  saveDB();

  logActivity(
    user.id,
    user.email,
    'RSVP_EVENTO',
    `Usuario ${user.username} marcó asistencia (${status}) al evento "${event.title}"`,
    req
  );

  res.json({ event });
});

// Delete event (Owner / Co-Owner Only)
app.delete('/api/admin/events/:id', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as User;

  const index = db.events.findIndex(e => e.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Evento no encontrado.' });
    return;
  }

  const title = db.events[index].title;
  db.events.splice(index, 1);
  saveDB();

  logActivity(
    user.id,
    user.email,
    'ELIMINAR_EVENTO',
    `Evento eliminado: "${title}"`,
    req
  );

  res.json({ success: true });
});

// -------------------------------------------------------------
// USER MANAGEMENT ENDPOINTS (Owner / Co-Owner Only)
// -------------------------------------------------------------

// List Users
app.get('/api/admin/users', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  const cleanUsers = db.users.map(u => ({
    id: u.id,
    email: u.email,
    username: u.username,
    role: u.role,
    isVerified: u.isVerified,
    createdAt: u.createdAt,
    avatarUrl: u.avatarUrl,
    profileBackground: u.profileBackground,
    isSuspended: u.isSuspended
  }));
  res.json({ users: cleanUsers });
});

// Manually change or reset password (Owner only)
app.post('/api/admin/users/reset-password', authenticate, requireRole(UserRole.Owner), (req, res) => {
  const { email, newPassword, action } = req.body;
  const admin = (req as any).user as User;

  if (!email) {
    res.status(400).json({ error: 'El correo electrónico es requerido.' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const userRecord = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!userRecord) {
    res.status(404).json({ error: 'No se encontró ningún usuario con ese correo.' });
    return;
  }

  // Immutable Owner protection against other admins, but we allow if same admin or general Owner
  if (IMMUTABLE_OWNERS.includes(userRecord.email.toLowerCase()) && admin.email.toLowerCase() !== userRecord.email.toLowerCase()) {
    res.status(403).json({ error: 'No tienes permiso para restablecer la contraseña de otra cuenta fundadora.' });
    return;
  }

  // Protect Owner and Co-Owner accounts from having their passwords reset
  if ((userRecord.role === UserRole.Owner || userRecord.role === UserRole.CoOwner) && admin.id !== userRecord.id) {
    res.status(403).json({ error: 'No puedes cambiar la contraseña de usuarios con este rol.' });
    return;
  }

  let finalPassword = '';
  if (action === 'reset') {
    // Generate a default/temporary readable password
    finalPassword = 'Lunatic' + Math.floor(1000 + Math.random() * 9000) + '!';
  } else {
    // action === 'change'
    if (!newPassword || newPassword.trim().length < 6) {
      res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    finalPassword = newPassword.trim();
  }

  userRecord.passwordHash = hashPassword(finalPassword);
  
  // Clear any existing session tokens for this user so they have to re-login
  Object.keys(db.sessions).forEach(token => {
    if (db.sessions[token] === userRecord.id) {
      delete db.sessions[token];
    }
  });

  saveDB();

  logActivity(
    admin.id,
    admin.email,
    'RESTABLECIMIENTO_MANUAL_CONTRASEÑA',
    `Estableció manualmente la contraseña de ${userRecord.email} (${action === 'reset' ? 'Reinicio' : 'Cambio'})`,
    req
  );

  res.json({
    success: true,
    message: `Contraseña actualizada correctamente para ${userRecord.username}.`,
    username: userRecord.username,
    newPassword: finalPassword
  });
});

function normalizeDuration(durationStr: string): string {
  if (!durationStr) return 'Permanente';
  let s = durationStr.toLowerCase().trim();
  if (s.includes('permanente') || s.includes('permanent')) return 'Permanente';
  
  // Replace words
  s = s.replace(/segundos?/, 's');
  s = s.replace(/minutos?/, 'm');
  s = s.replace(/horas?/, 'h');
  s = s.replace(/días?|dias?/, 'd');
  s = s.replace(/\s+/g, ''); // remove any spaces
  
  return s;
}

function getDurationMs(duration: string): number | null {
  if (!duration || duration === 'Permanente' || duration === 'permanent') return null;
  
  const clean = duration.trim();
  const match = clean.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

// Change User Role (Owner / Co-Owner only)
app.put('/api/admin/users/:id/role', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  const { id } = req.params;
  const { role, duration } = req.body;
  const admin = (req as any).user as User;

  if (!role || !Object.values(UserRole).includes(role)) {
    res.status(400).json({ error: 'Rol inválido.' });
    return;
  }

  const user = db.users.find(u => u.id === id);
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado.' });
    return;
  }

  // Immutable Owners protections
  if (IMMUTABLE_OWNERS.includes(user.email.toLowerCase())) {
    res.status(403).json({ error: 'Las cuentas fundadoras con rol Owner no pueden modificarse.' });
    return;
  }

  // Prevent Co-Owners from changing Owners' roles
  if (user.role === UserRole.Owner && admin.role !== UserRole.Owner) {
    res.status(403).json({ error: 'No tienes permisos para modificar el rol de un Owner.' });
    return;
  }

  // Prevent promoting someone to Owner unless you are an Owner
  if (role === UserRole.Owner && admin.role !== UserRole.Owner) {
    res.status(403).json({ error: 'Solo un Owner puede ascender a otros al rango de Owner.' });
    return;
  }

  const oldRole = user.role;
  user.role = role as UserRole;

  // Process duration
  const normDuration = normalizeDuration(duration);
  const durationMs = getDurationMs(normDuration);

  if (durationMs !== null) {
    user.roleExpiresAt = new Date(Date.now() + durationMs).toISOString();
    if (!user.originalRole) {
      user.originalRole = oldRole;
    }
  } else {
    delete user.roleExpiresAt;
    delete user.originalRole;
  }

  saveDB();

  logActivity(
    admin.id,
    admin.email,
    'CAMBIAR_ROL',
    `Cambió el rol de ${user.email} de "${oldRole}" a "${role}" (${durationMs ? 'temporal por ' + normDuration : 'Permanente'})`,
    req
  );

  res.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isVerified: user.isVerified,
      roleExpiresAt: user.roleExpiresAt,
      originalRole: user.originalRole
    }
  });
});

// -------------------------------------------------------------
// SISTEMA DE CÓDIGOS CANJEABLES ENDPOINTS
// -------------------------------------------------------------

// Get all promo codes and redemption history (Admin only)
app.get('/api/admin/codes', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  db.promoCodes = db.promoCodes || [];
  db.promoCodeRedeems = db.promoCodeRedeems || [];
  res.json({
    codes: db.promoCodes,
    redeems: db.promoCodeRedeems
  });
});

// Create a promo code (Admin only)
app.post('/api/admin/codes', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  db.promoCodes = db.promoCodes || [];
  const admin = (req as any).user as User;
  let { code, role, duration, maxUses, expiresAt } = req.body;

  if (!role || !Object.values(UserRole).includes(role)) {
    res.status(400).json({ error: 'Rol a asignar es inválido.' });
    return;
  }

  // Handle empty or auto-generated code
  if (!code || !code.trim()) {
    code = 'LUNATIC-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  } else {
    code = code.trim().toUpperCase();
  }

  // Check if code already exists
  if (db.promoCodes.some(c => c.code === code)) {
    res.status(400).json({ error: 'Este código de promoción ya existe.' });
    return;
  }

  const newCode: PromoCode = {
    id: crypto.randomUUID(),
    code,
    role: role as UserRole,
    duration: duration || 'Permanente',
    maxUses: maxUses ? Number(maxUses) : 1,
    useCount: 0,
    expiresAt: expiresAt || undefined,
    isActive: true,
    createdAt: new Date().toISOString()
  };

  db.promoCodes.unshift(newCode);
  saveDB();

  logActivity(
    admin.id,
    admin.email,
    'CREAR_CODIGO_PROMO',
    `Creado código canjeable: "${code}" para rol "${role}" (${duration})`,
    req
  );

  res.status(201).json({ success: true, code: newCode });
});

// Redeem a promo code
app.post('/api/codes/redeem', authenticate, (req, res) => {
  db.promoCodes = db.promoCodes || [];
  db.promoCodeRedeems = db.promoCodeRedeems || [];
  const user = (req as any).user as User;
  const ip = (req.ip || req.socket.remoteAddress || 'unknown').replace('::ffff:', '');
  const { code: codeInput } = req.body;

  if (!codeInput || !codeInput.trim()) {
    res.status(400).json({ error: 'Por favor introduce un código.' });
    return;
  }

  const targetCode = codeInput.trim().toUpperCase();
  const codeRecord = db.promoCodes.find(c => c.code === targetCode);

  if (!codeRecord) {
    const redeemLog: PromoCodeRedeem = {
      id: crypto.randomUUID(),
      codeId: 'unknown',
      code: targetCode,
      userId: user.id,
      username: user.username,
      userEmail: user.email,
      ip,
      redeemedAt: new Date().toISOString(),
      status: 'Fallido',
      details: 'El código no existe.'
    };
    db.promoCodeRedeems.unshift(redeemLog);
    saveDB();

    res.status(404).json({ error: 'El código de canje no es válido o no existe.' });
    return;
  }

  // Check if active
  if (!codeRecord.isActive) {
    const redeemLog: PromoCodeRedeem = {
      id: crypto.randomUUID(),
      codeId: codeRecord.id,
      code: codeRecord.code,
      userId: user.id,
      username: user.username,
      userEmail: user.email,
      ip,
      redeemedAt: new Date().toISOString(),
      status: 'Fallido',
      details: 'El código está pausado o inactivo.'
    };
    db.promoCodeRedeems.unshift(redeemLog);
    saveDB();

    res.status(400).json({ error: 'Este código de canje está inactivo o pausado.' });
    return;
  }

  // Check usages
  if (codeRecord.useCount >= codeRecord.maxUses) {
    const redeemLog: PromoCodeRedeem = {
      id: crypto.randomUUID(),
      codeId: codeRecord.id,
      code: codeRecord.code,
      userId: user.id,
      username: user.username,
      userEmail: user.email,
      ip,
      redeemedAt: new Date().toISOString(),
      status: 'Fallido',
      details: 'Código agotado.'
    };
    db.promoCodeRedeems.unshift(redeemLog);
    saveDB();

    res.status(400).json({ error: 'Este código ya ha alcanzado el límite máximo de usos.' });
    return;
  }

  // Check expiration
  if (codeRecord.expiresAt && new Date() > new Date(codeRecord.expiresAt)) {
    const redeemLog: PromoCodeRedeem = {
      id: crypto.randomUUID(),
      codeId: codeRecord.id,
      code: codeRecord.code,
      userId: user.id,
      username: user.username,
      userEmail: user.email,
      ip,
      redeemedAt: new Date().toISOString(),
      status: 'Fallido',
      details: 'Código expirado por fecha.'
    };
    db.promoCodeRedeems.unshift(redeemLog);
    saveDB();

    res.status(400).json({ error: 'Este código ya ha expirado por fecha.' });
    return;
  }

  // Check if user has already redeemed THIS specific code
  const alreadyRedeemed = db.promoCodeRedeems.some(r => r.codeId === codeRecord.id && r.userId === user.id && r.status === 'Exitoso');
  if (alreadyRedeemed) {
    const redeemLog: PromoCodeRedeem = {
      id: crypto.randomUUID(),
      codeId: codeRecord.id,
      code: codeRecord.code,
      userId: user.id,
      username: user.username,
      userEmail: user.email,
      ip,
      redeemedAt: new Date().toISOString(),
      status: 'Fallido',
      details: 'Usuario ya canjeó este código anteriormente.'
    };
    db.promoCodeRedeems.unshift(redeemLog);
    saveDB();

    res.status(400).json({ error: 'Ya has canjeado este código anteriormente.' });
    return;
  }

  // Immutable protection
  if (IMMUTABLE_OWNERS.includes(user.email.toLowerCase())) {
    res.status(400).json({ error: 'Las cuentas fundadoras no pueden alterar su rol.' });
    return;
  }

  // All checks passed! Apply reward
  const oldRole = user.role;
  const userRecord = db.users.find(u => u.id === user.id);
  if (!userRecord) {
    res.status(404).json({ error: 'Usuario de sesión no encontrado.' });
    return;
  }

  userRecord.role = codeRecord.role;

  const normDuration = normalizeDuration(codeRecord.duration);
  const durationMs = getDurationMs(normDuration);

  if (durationMs !== null) {
    userRecord.roleExpiresAt = new Date(Date.now() + durationMs).toISOString();
    if (!userRecord.originalRole) {
      userRecord.originalRole = oldRole;
    }
  } else {
    delete userRecord.roleExpiresAt;
    delete userRecord.originalRole;
  }

  // Increment usage count
  codeRecord.useCount++;

  // Log successful redemption
  const redeemLog: PromoCodeRedeem = {
    id: crypto.randomUUID(),
    codeId: codeRecord.id,
    code: codeRecord.code,
    userId: user.id,
    username: user.username,
    userEmail: user.email,
    ip,
    redeemedAt: new Date().toISOString(),
    status: 'Exitoso',
    details: `Rol "${codeRecord.role}" asignado correctamente (${codeRecord.duration}).`
  };
  db.promoCodeRedeems.unshift(redeemLog);

  saveDB();

  logActivity(
    user.id,
    user.email,
    'CANJEAR_CODIGO_PROMO',
    `Canjeó exitosamente el código "${codeRecord.code}" obteniendo el rol "${codeRecord.role}" por ${codeRecord.duration}`,
    req
  );

  res.json({
    success: true,
    message: `¡Código canjeado con éxito! Ahora tienes el rol: ${codeRecord.role}`,
    user: {
      id: userRecord.id,
      email: userRecord.email,
      username: userRecord.username,
      role: userRecord.role,
      isVerified: userRecord.isVerified,
      roleExpiresAt: userRecord.roleExpiresAt,
      originalRole: userRecord.originalRole
    }
  });
});

// Toggle promo code active/paused state (Admin only)
app.post('/api/admin/codes/:id/toggle', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  db.promoCodes = db.promoCodes || [];
  const { id } = req.params;
  const admin = (req as any).user as User;

  const codeRecord = db.promoCodes.find(c => c.id === id);
  if (!codeRecord) {
    res.status(404).json({ error: 'Código de promoción no encontrado.' });
    return;
  }

  codeRecord.isActive = !codeRecord.isActive;
  saveDB();

  logActivity(
    admin.id,
    admin.email,
    'MODIFICAR_CODIGO_PROMO',
    `${codeRecord.isActive ? 'Activó' : 'Pausó'} el código promocional: "${codeRecord.code}"`,
    req
  );

  res.json({ success: true, code: codeRecord });
});

// Delete promo code (Admin only)
app.delete('/api/admin/codes/:id', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  db.promoCodes = db.promoCodes || [];
  const { id } = req.params;
  const admin = (req as any).user as User;

  const index = db.promoCodes.findIndex(c => c.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Código de promoción no encontrado.' });
    return;
  }

  const codeStr = db.promoCodes[index].code;
  db.promoCodes.splice(index, 1);
  saveDB();

  logActivity(
    admin.id,
    admin.email,
    'ELIMINAR_CODIGO_PROMO',
    `Eliminó el código promocional: "${codeStr}"`,
    req
  );

  res.json({ success: true });
});

// Suspend/Unsuspend User
app.put('/api/admin/users/:id/suspend', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  const { id } = req.params;
  const { isSuspended } = req.body;
  const admin = (req as any).user as User;

  const user = db.users.find(u => u.id === id);
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado.' });
    return;
  }

  // Immutable protection
  if (IMMUTABLE_OWNERS.includes(user.email.toLowerCase())) {
    res.status(403).json({ error: 'Las cuentas fundadoras con rol Owner no pueden suspenderse.' });
    return;
  }

  if (user.role === UserRole.Owner && admin.role !== UserRole.Owner) {
    res.status(403).json({ error: 'No puedes suspender a un Owner.' });
    return;
  }

  user.isSuspended = !!isSuspended;

  // Clear active sessions if suspended
  if (user.isSuspended) {
    Object.keys(db.sessions).forEach(token => {
      if (db.sessions[token] === user.id) {
        delete db.sessions[token];
      }
    });
  }

  saveDB();

  logActivity(
    admin.id,
    admin.email,
    user.isSuspended ? 'SUSPENDER_USUARIO' : 'ACTIVAR_USUARIO',
    `${user.isSuspended ? 'Suspendió' : 'Activó'} al usuario ${user.email}`,
    req
  );

  res.json({
    success: true,
    isSuspended: user.isSuspended
  });
});

// Delete User
app.delete('/api/admin/users/:id', authenticate, requireRole(UserRole.Owner), (req, res) => {
  const { id } = req.params;
  const admin = (req as any).user as User;

  const index = db.users.findIndex(u => u.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Usuario no encontrado.' });
    return;
  }

  const user = db.users[index];

  // Immutable protection
  if (IMMUTABLE_OWNERS.includes(user.email.toLowerCase())) {
    res.status(403).json({ error: 'Las cuentas fundadoras con rol Owner no pueden eliminarse.' });
    return;
  }

  if (user.role === UserRole.Owner && admin.role !== UserRole.Owner) {
    res.status(403).json({ error: 'No puedes eliminar a un Owner.' });
    return;
  }

  const deletedEmail = user.email;
  db.users.splice(index, 1);

  // Clean active sessions
  Object.keys(db.sessions).forEach(token => {
    if (db.sessions[token] === id) {
      delete db.sessions[token];
    }
  });

  saveDB();

  logActivity(
    admin.id,
    admin.email,
    'ELIMINAR_USUARIO',
    `Eliminó definitivamente al usuario ${deletedEmail}`,
    req
  );

  res.json({ success: true });
});

// System Activity Logs (Owner / Co-Owner)
app.get('/api/admin/logs', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  res.json({ logs: db.activityLogs });
});

// Global Statistics Dashboard (Owner / Co-Owner)
app.get('/api/admin/stats', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  const stats = {
    userCount: db.users.length,
    resourceCount: db.resources.length,
    streamingCount: db.streamingAccounts.length,
    activePollCount: db.polls.filter(p => p.status === 'active').length,
    recentLogs: db.activityLogs.slice(0, 5)
  };
  res.json(stats);
});

// Public Homepage stats (unauthenticated stats)
app.get('/api/public/stats', (req, res) => {
  checkAndAutoDrawGiveaways();
  res.json({
    userCount: db.users.length,
    resourceCount: db.resources.length,
    streamingCount: db.streamingAccounts.length,
    activePollCount: db.polls.filter(p => p.status === 'active').length,
    // Latest 3 resources
    recentResources: db.resources.slice(0, 3).map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      imageUrl: r.imageUrl,
      minRole: r.minRole,
      createdAt: r.createdAt
    }))
  });
});

// -------------------------------------------------------------
// CHAT GLOBAL (WEBSOCKETS BROADCAST LIST)
// -------------------------------------------------------------
interface ActiveClient {
  ws: any;
  userId?: string;
  email?: string;
  role?: UserRole;
}
const activeClients = new Set<ActiveClient>();

function broadcastMessage(data: any) {
  const payload = JSON.stringify(data);
  for (const client of activeClients) {
    if (client.ws.readyState === 1) { // WebSocket.OPEN
      client.ws.send(payload);
    }
  }
}

// -------------------------------------------------------------
// CHAT GLOBAL ENDPOINTS & COOLDOWN TRACKING
// -------------------------------------------------------------
const lastMessageTimes: Record<string, number> = {};

app.get('/api/chat/history', authenticate, (req, res) => {
  db.chatMessages = db.chatMessages || [];
  res.json({ messages: db.chatMessages.slice(-100) });
});

// Get chat cooldown config
app.get('/api/chat/cooldown', authenticate, (req, res) => {
  res.json({ cooldown: db.chatCooldown !== undefined ? db.chatCooldown : 3 });
});

// Configure chat cooldown (Owner Only)
app.post('/api/chat/cooldown', authenticate, requireRole(UserRole.Owner), (req, res) => {
  const { cooldown } = req.body;
  if (cooldown === undefined || isNaN(Number(cooldown)) || Number(cooldown) < 0) {
    res.status(400).json({ error: 'Cooldown inválido. Debe ser un número igual o mayor a 0.' });
    return;
  }
  db.chatCooldown = Number(cooldown);
  saveDB();

  logActivity(
    (req as any).user.id,
    (req as any).user.email,
    'CONFIGURAR_COOLDOWN',
    `Estableció el cooldown del chat en ${cooldown} segundos.`,
    req
  );

  res.json({ success: true, cooldown: db.chatCooldown });
});

// Clear entire chat history (Owner Only)
app.post('/api/chat/clear', authenticate, requireRole(UserRole.Owner), (req, res) => {
  db.chatMessages = [];
  saveDB();

  logActivity(
    (req as any).user.id,
    (req as any).user.email,
    'VACIAR_CHAT',
    'Vació el historial del chat global.',
    req
  );

  broadcastMessage({ type: 'clear_chat' });
  res.json({ success: true });
});

// Clear/optimize activity logs (Owner / Co-Owner)
app.post('/api/admin/logs/clear', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  db.activityLogs = [];
  db.downloadLogs = [];
  saveDB();
  
  // Add an initial log indicating logs were cleared
  logActivity(
    (req as any).user.id,
    (req as any).user.email,
    'LIMPIAR_LOGS',
    'Historial de logs limpiado y optimizado por el Administrador.',
    req
  );

  res.json({ success: true });
});

// Delete an individual activity log manually (Owner / Co-Owner)
app.delete('/api/admin/logs/activity/:id', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  const { id } = req.params;
  db.activityLogs = db.activityLogs || [];
  const index = db.activityLogs.findIndex(l => l.id === id);
  if (index !== -1) {
    db.activityLogs.splice(index, 1);
    saveDB();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Log de actividad no encontrado.' });
  }
});

// Delete an individual download log manually (Owner / Co-Owner)
app.delete('/api/admin/logs/download/:id', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  const { id } = req.params;
  db.downloadLogs = db.downloadLogs || [];
  const index = db.downloadLogs.findIndex(l => l.id === id);
  if (index !== -1) {
    db.downloadLogs.splice(index, 1);
    saveDB();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Log de descarga no encontrado.' });
  }
});

app.post('/api/chat/message', authenticate, (req, res) => {
  const user = (req as any).user as User;
  if (user.isSuspended) {
    res.status(403).json({ error: 'Tu cuenta está suspendida.' });
    return;
  }
  const { content } = req.body;
  if (!content || !content.trim()) {
    res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
    return;
  }

  // Enforce Cooldown for users who are not Owners, Co-Owners, or Immutable Owners
  const isExempt = user.role === UserRole.Owner || user.role === UserRole.CoOwner || IMMUTABLE_OWNERS.includes(user.email.toLowerCase());
  const userCooldownSeconds = db.chatCooldown !== undefined ? db.chatCooldown : 3;

  if (!isExempt && userCooldownSeconds > 0) {
    const now = Date.now();
    const lastTime = lastMessageTimes[user.id] || 0;
    const elapsed = (now - lastTime) / 1000;
    if (elapsed < userCooldownSeconds) {
      const remaining = Math.ceil(userCooldownSeconds - elapsed);
      res.status(429).json({ error: `Por favor espera ${remaining} segundos antes de enviar otro mensaje.` });
      return;
    }
    lastMessageTimes[user.id] = now;
  } else {
    lastMessageTimes[user.id] = Date.now();
  }

  const chatMsg: ChatMessage = {
    id: crypto.randomUUID(),
    userId: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.username)}`,
    role: user.role,
    content: String(content).substring(0, 500),
    createdAt: new Date().toISOString()
  };

  db.chatMessages = db.chatMessages || [];
  db.chatMessages.push(chatMsg);
  if (db.chatMessages.length > 200) {
    db.chatMessages = db.chatMessages.slice(-200);
  }
  saveDB();

  broadcastMessage({ type: 'msg', message: chatMsg });
  res.json({ success: true, message: chatMsg });
});

app.delete('/api/chat/:id', authenticate, requireRole(UserRole.Owner), (req, res) => {
  const { id } = req.params;
  db.chatMessages = db.chatMessages || [];
  const index = db.chatMessages.findIndex(m => m.id === id);
  if (index !== -1) {
    db.chatMessages.splice(index, 1);
    saveDB();
    broadcastMessage({ type: 'delete_msg', messageId: id });
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Mensaje no encontrado.' });
  }
});

// -------------------------------------------------------------
// RECURSOS REQUESTS (SOLICITUDES) ENDPOINTS
// -------------------------------------------------------------
app.post('/api/requests', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const { category, name, description, referenceLink } = req.body;

  if (!category || !name) {
    res.status(400).json({ error: 'La categoría y el nombre del recurso son obligatorios.' });
    return;
  }

  const newRequest: ResourceRequest = {
    id: crypto.randomUUID(),
    userId: user.id,
    userEmail: user.email,
    username: user.username,
    category: category as ResourceCategory,
    name: name,
    description: description || '',
    referenceLink: referenceLink || '',
    status: RequestStatus.Pendiente,
    internalComments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.resourceRequests = db.resourceRequests || [];
  db.resourceRequests.unshift(newRequest);
  saveDB();

  logActivity(user.id, user.email, 'CREAR_SOLICITUD', `Creó solicitud de recurso: "${name}" en "${category}"`, req);
  res.json({ success: true, request: newRequest });
});

app.get('/api/requests', authenticate, (req, res) => {
  const user = (req as any).user as User;
  db.resourceRequests = db.resourceRequests || [];

  const userLevel = ROLE_HIERARCHY[user.role] || 1;
  const staffLevel = ROLE_HIERARCHY[UserRole.Recursos];

  if (userLevel >= staffLevel) {
    // Staff can see all requests
    res.json({ requests: db.resourceRequests });
  } else {
    // Normal users can only see their own requests
    const filtered = db.resourceRequests.filter(r => r.userId === user.id);
    res.json({ requests: filtered });
  }
});

app.put('/api/requests/:id/status', authenticate, requireRole(UserRole.Recursos), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const user = (req as any).user as User;

  db.resourceRequests = db.resourceRequests || [];
  const request = db.resourceRequests.find(r => r.id === id);
  if (!request) {
    res.status(404).json({ error: 'Solicitud no encontrada.' });
    return;
  }

  if (!Object.values(RequestStatus).includes(status)) {
    res.status(400).json({ error: 'Estado de solicitud inválido.' });
    return;
  }

  const oldStatus = request.status;
  request.status = status as RequestStatus;
  request.updatedAt = new Date().toISOString();
  saveDB();

  logActivity(
    user.id,
    user.email,
    'ACTUALIZAR_SOLICITUD',
    `Cambió estado de solicitud "${request.name}" de "${oldStatus}" a "${status}"`,
    req
  );

  res.json({ success: true, request });
});

app.post('/api/requests/:id/comments', authenticate, requireRole(UserRole.Recursos), (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const user = (req as any).user as User;

  if (!content || !content.trim()) {
    res.status(400).json({ error: 'El comentario no puede estar vacío.' });
    return;
  }

  db.resourceRequests = db.resourceRequests || [];
  const request = db.resourceRequests.find(r => r.id === id);
  if (!request) {
    res.status(404).json({ error: 'Solicitud no encontrada.' });
    return;
  }

  const newComment: RequestComment = {
    id: crypto.randomUUID(),
    authorId: user.id,
    authorName: user.username,
    authorRole: user.role,
    content: content,
    createdAt: new Date().toISOString()
  };

  request.internalComments = request.internalComments || [];
  request.internalComments.push(newComment);
  request.updatedAt = new Date().toISOString();
  saveDB();

  logActivity(user.id, user.email, 'COMENTARIO_SOLICITUD', `Agregó comentario interno en solicitud "${request.name}"`, req);
  res.json({ success: true, comment: newComment });
});

// Delete an individual comment on a resource request (Owner / Co-Owner)
app.delete('/api/requests/:requestId/comments/:commentId', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  const { requestId, commentId } = req.params;
  const user = (req as any).user as User;

  db.resourceRequests = db.resourceRequests || [];
  const request = db.resourceRequests.find(r => r.id === requestId);
  if (!request) {
    res.status(404).json({ error: 'Solicitud no encontrada.' });
    return;
  }

  request.internalComments = request.internalComments || [];
  const commentIndex = request.internalComments.findIndex(c => c.id === commentId);
  if (commentIndex === -1) {
    res.status(404).json({ error: 'Comentario no encontrado.' });
    return;
  }

  const commentText = request.internalComments[commentIndex].content;
  request.internalComments.splice(commentIndex, 1);
  request.updatedAt = new Date().toISOString();
  saveDB();

  logActivity(user.id, user.email, 'ELIMINAR_COMENTARIO_SOLICITUD', `Eliminó comentario en solicitud "${request.name}": "${commentText}"`, req);
  res.json({ success: true, request });
});

// Delete a resource request (Owner / Co-Owner)
app.delete('/api/requests/:id', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as User;

  db.resourceRequests = db.resourceRequests || [];
  const requestIndex = db.resourceRequests.findIndex(r => r.id === id);
  if (requestIndex === -1) {
    res.status(404).json({ error: 'Solicitud no encontrada.' });
    return;
  }

  const requestName = db.resourceRequests[requestIndex].name;
  db.resourceRequests.splice(requestIndex, 1);
  saveDB();

  logActivity(user.id, user.email, 'ELIMINAR_SOLICITUD_RECURSO', `Eliminó la solicitud de recurso: "${requestName}"`, req);
  res.json({ success: true });
});

// -------------------------------------------------------------
// SISTEMA DE APORTES (DONATIONS) ENDPOINTS
// -------------------------------------------------------------

// Submit a donation/contribution
app.post('/api/donations', authenticate, (req, res) => {
  db.donations = db.donations || [];
  const user = (req as any).user as User;
  const { title, description, category, imageUrl, downloadMethod, downloadUrl, fileName, fileData } = req.body;

  if (!title || !description || !category || !downloadMethod) {
    res.status(400).json({ error: 'Faltan campos obligatorios para enviar el aporte.' });
    return;
  }

  let finalImageUrl = imageUrl || '';
  let finalDownloadUrl = downloadUrl || '';

  // Save donation image if uploaded as base64
  if (imageUrl && imageUrl.startsWith('data:image/')) {
    try {
      const ext = imageUrl.substring(imageUrl.indexOf('/') + 1, imageUrl.indexOf(';'));
      const filename = `donation_img_${Date.now()}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, filename);
      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
      finalImageUrl = `/uploads/${filename}`;
    } catch (err) {
      console.error('Error saving donation image:', err);
    }
  }

  // Direct file upload handling
  if (downloadMethod === 'file' && fileData && fileName) {
    try {
      const cleanFileName = `donation_file_${Date.now()}_${path.basename(fileName).replace(/\s+/g, '_')}`;
      const filePath = path.join(UPLOADS_DIR, cleanFileName);

      const base64Data = fileData.replace(/^data:\w+\/\w+;base64,/, "");
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

      finalDownloadUrl = `/uploads/${cleanFileName}`;
    } catch (err) {
      console.error('Error saving donation file:', err);
      res.status(500).json({ error: 'Error al subir el archivo de tu aporte.' });
      return;
    }
  }

  const newDonation: Donation = {
    id: crypto.randomUUID(),
    userId: user.id,
    userEmail: user.email,
    username: user.username,
    title,
    description,
    category: category as ResourceCategory,
    imageUrl: finalImageUrl || undefined,
    downloadMethod,
    downloadUrl: finalDownloadUrl || undefined,
    fileName: fileName || undefined,
    status: 'Pendiente',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.donations.unshift(newDonation);
  saveDB();

  logActivity(
    user.id,
    user.email,
    'ENVIAR_APORTE',
    `Aporte enviado: "${title}" en la categoría "${category}"`,
    req
  );

  res.status(201).json({ success: true, donation: newDonation });
});

// Retrieve donations (Admins see all, users see their own)
app.get('/api/donations', authenticate, (req, res) => {
  db.donations = db.donations || [];
  const user = (req as any).user as User;

  const userLevel = ROLE_HIERARCHY[user.role] || 1;
  const adminLevel = ROLE_HIERARCHY[UserRole.CoOwner];

  if (userLevel >= adminLevel) {
    res.json({ donations: db.donations });
  } else {
    const filtered = db.donations.filter(d => d.userId === user.id);
    res.json({ donations: filtered });
  }
});

// Approve or Reject a donation (Admin only)
app.put('/api/admin/donations/:id/status', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  db.donations = db.donations || [];
  const admin = (req as any).user as User;
  const { id } = req.params;
  const { status, observation, minRole } = req.body;

  if (!['Aprobada', 'Rechazada'].includes(status)) {
    res.status(400).json({ error: 'Estado inválido. Debe ser Aprobada o Rechazada.' });
    return;
  }

  const donation = db.donations.find(d => d.id === id);
  if (!donation) {
    res.status(404).json({ error: 'Aporte no encontrado.' });
    return;
  }

  const oldStatus = donation.status;
  donation.status = status;
  donation.observation = observation || '';
  donation.updatedAt = new Date().toISOString();

  let createdResource: Resource | null = null;

  if (status === 'Aprobada' && oldStatus !== 'Aprobada') {
    // Create resource automatically!
    db.resources = db.resources || [];
    
    const targetMinRole = minRole || UserRole.Usuario;

    createdResource = {
      id: crypto.randomUUID(),
      name: donation.title,
      description: donation.description,
      category: donation.category,
      imageUrl: donation.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80',
      minRole: targetMinRole as UserRole,
      downloadMethod: donation.downloadMethod,
      downloadUrl: donation.downloadUrl || '',
      fileName: donation.fileName || '',
      createdAt: new Date().toISOString()
    };

    db.resources.unshift(createdResource);

    logActivity(
      admin.id,
      admin.email,
      'APROBAR_APORTE_Y_PUBLICAR',
      `Aporte de ${donation.username} aprobado y publicado como recurso: "${donation.title}" (Rol: ${targetMinRole})`,
      req
    );
  } else if (status === 'Rechazada') {
    logActivity(
      admin.id,
      admin.email,
      'RECHAZAR_APORTE',
      `Aporte de ${donation.username} rechazado: "${donation.title}". Motivo: ${observation || 'Ninguno'}`,
      req
    );
  }

  saveDB();

  res.json({ success: true, donation, resource: createdResource });
});

// Delete donation record (Admin only)
app.delete('/api/admin/donations/:id', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  db.donations = db.donations || [];
  const admin = (req as any).user as User;
  const { id } = req.params;

  const index = db.donations.findIndex(d => d.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Aporte no encontrado.' });
    return;
  }

  const title = db.donations[index].title;
  db.donations.splice(index, 1);
  saveDB();

  logActivity(
    admin.id,
    admin.email,
    'ELIMINAR_APORTE',
    `Eliminó el aporte: "${title}"`,
    req
  );

  res.json({ success: true });
});

// -------------------------------------------------------------
// DOWNLOAD LOGS (ADMINS EXCLUSIVE)
// -------------------------------------------------------------
app.get('/api/admin/download-logs', authenticate, requireRole(UserRole.CoOwner), (req, res) => {
  db.downloadLogs = db.downloadLogs || [];
  const { search, category, status, user, sort } = req.query;

  let filtered = [...db.downloadLogs];

  if (search) {
    const s = String(search).toLowerCase();
    filtered = filtered.filter(l => 
      l.resourceName.toLowerCase().includes(s) ||
      l.userEmail.toLowerCase().includes(s) ||
      l.username.toLowerCase().includes(s)
    );
  }

  if (category) {
    filtered = filtered.filter(l => l.category === category);
  }

  if (status) {
    filtered = filtered.filter(l => l.status === status);
  }

  if (user) {
    const u = String(user).toLowerCase();
    filtered = filtered.filter(l => l.userId === u || l.userEmail.toLowerCase() === u);
  }

  if (sort === 'asc') {
    filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else {
    // Default desc
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json({ logs: filtered });
});

// -------------------------------------------------------------
// REVIEWS CHANNEL (CANAL DE RESEÑAS) ENDPOINTS
// -------------------------------------------------------------
app.get('/api/reviews', (req, res) => {
  db.reviews = db.reviews || [];
  // Sort reviews: newest first
  const sortedReviews = [...db.reviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ reviews: sortedReviews });
});

app.post('/api/reviews', authenticate, (req, res) => {
  const user = (req as any).user as User;
  if (user.isSuspended) {
    res.status(403).json({ error: 'Tu cuenta está suspendida.' });
    return;
  }

  const { rating, comment } = req.body;
  const ratingNum = Number(rating);

  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    res.status(400).json({ error: 'La calificación debe ser un número entero entre 1 y 5.' });
    return;
  }

  if (!comment || !comment.trim()) {
    res.status(400).json({ error: 'El comentario de la reseña no puede estar vacío.' });
    return;
  }

  const newReview = {
    id: crypto.randomUUID(),
    userId: user.id,
    username: user.username,
    userEmail: user.email,
    userRole: user.role,
    avatarUrl: user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.username)}`,
    rating: ratingNum,
    comment: comment.trim(),
    hearts: [],
    replies: [],
    createdAt: new Date().toISOString()
  };

  db.reviews = db.reviews || [];
  db.reviews.unshift(newReview);
  saveDB();

  logActivity(
    user.id,
    user.email,
    'CREAR_RESEÑA',
    `Dejó una reseña de ${ratingNum} estrellas: "${comment.trim().substring(0, 45)}..."`,
    req
  );

  res.json({ success: true, review: newReview });
});

app.post('/api/reviews/:id/heart', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const { id } = req.params;

  db.reviews = db.reviews || [];
  const review = db.reviews.find(r => r.id === id);
  if (!review) {
    res.status(404).json({ error: 'Reseña no encontrada.' });
    return;
  }

  review.hearts = review.hearts || [];
  const index = review.hearts.indexOf(user.id);
  if (index !== -1) {
    review.hearts.splice(index, 1);
  } else {
    review.hearts.push(user.id);
  }

  saveDB();
  res.json({ success: true, hearts: review.hearts });
});

app.post('/api/reviews/:id/reply', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const { id } = req.params;
  const { content } = req.body;

  const isOwnerOrCo =
    user.role === UserRole.Owner ||
    user.role === UserRole.CoOwner ||
    IMMUTABLE_OWNERS.includes(user.email.toLowerCase());

  if (!isOwnerOrCo) {
    res.status(403).json({ error: 'Solo los Owners o Co-Owners pueden responder a las reseñas.' });
    return;
  }

  if (!content || !content.trim()) {
    res.status(400).json({ error: 'La respuesta no puede estar vacía.' });
    return;
  }

  db.reviews = db.reviews || [];
  const review = db.reviews.find(r => r.id === id);
  if (!review) {
    res.status(404).json({ error: 'Reseña no encontrada.' });
    return;
  }

  const reply = {
    id: crypto.randomUUID(),
    authorId: user.id,
    authorName: user.username,
    authorEmail: user.email,
    authorRole: user.role,
    content: content.trim(),
    createdAt: new Date().toISOString()
  };

  review.replies = review.replies || [];
  review.replies.push(reply);
  saveDB();

  logActivity(
    user.id,
    user.email,
    'RESPONDER_RESEÑA',
    `Respondió a la reseña de ${review.username}`,
    req
  );

  res.json({ success: true, reply });
});

app.delete('/api/reviews/:id', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const { id } = req.params;

  db.reviews = db.reviews || [];
  const index = db.reviews.findIndex(r => r.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Reseña no encontrada.' });
    return;
  }

  const review = db.reviews[index];
  const isOwnerOrCo =
    user.role === UserRole.Owner ||
    user.role === UserRole.CoOwner ||
    IMMUTABLE_OWNERS.includes(user.email.toLowerCase());

  const isCreator = review.userId === user.id;

  if (!isOwnerOrCo && !isCreator) {
    res.status(403).json({ error: 'No tienes permiso para eliminar esta reseña.' });
    return;
  }

  db.reviews.splice(index, 1);
  saveDB();

  logActivity(
    user.id,
    user.email,
    'ELIMINAR_RESEÑA',
    `Eliminó la reseña creada por ${review.username}`,
    req
  );

  res.json({ success: true });
});

// -------------------------------------------------------------
// VITE AND ASSETS HANDLERS
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LUNATIC EXPRESS SERVER] Running on port ${PORT}`);
    // Start background interval to check for expired giveaways every 5 seconds
    setInterval(checkAndAutoDrawGiveaways, 5000);
    // Start background interval to check for expired roles every 10 seconds
    setInterval(checkAndEnforceRoleExpirations, 10000);
  });

  const { WebSocketServer } = await import('ws');
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const url = request.url || '';
    if (url.startsWith('/api/ws') || url === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws) => {
    const clientRecord: ActiveClient = { ws };
    activeClients.add(clientRecord);

    ws.on('message', (messageBuffer) => {
      try {
        const payload = JSON.parse(messageBuffer.toString('utf-8'));
        if (payload.type === 'auth') {
          const token = payload.token;
          let userId = db.sessions[token];
          let user = userId ? db.users.find(u => u.id === userId) : null;

          // Self-healing check
          if ((!userId || !user) && token) {
            const parsed = verifySignedToken(token);
            if (parsed && parsed.id && parsed.email) {
              let existingUser = db.users.find(u => u.id === parsed.id || u.email.toLowerCase() === parsed.email.toLowerCase());
              if (!existingUser) {
                existingUser = {
                  id: parsed.id,
                  email: parsed.email.toLowerCase().trim(),
                  username: parsed.username || 'Usuario',
                  role: parsed.role || UserRole.Usuario,
                  isVerified: parsed.isVerified !== undefined ? parsed.isVerified : true,
                  createdAt: parsed.createdAt || new Date().toISOString(),
                  isSuspended: parsed.isSuspended || false,
                  avatarUrl: parsed.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(parsed.username || 'Usuario')}`,
                  profileBackground: parsed.profileBackground || 'bg-slate-900',
                  passwordHash: parsed.passwordHash || ''
                };
                db.users.push(existingUser);
                saveDB();
              }
              db.sessions[token] = existingUser.id;
              saveDB();
              userId = existingUser.id;
              user = existingUser;
            }
          }

          if (user) {
            clientRecord.userId = user.id;
            clientRecord.email = user.email;
            clientRecord.role = user.role;
            ws.send(JSON.stringify({ type: 'authenticated', user: { id: user.id, username: user.username, role: user.role } }));
          } else {
            ws.send(JSON.stringify({ type: 'error', message: 'Token de autenticación inválido.' }));
          }
        } else if (payload.type === 'msg') {
          if (!clientRecord.userId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Debes estar autenticado para enviar mensajes.' }));
            return;
          }
          const user = db.users.find(u => u.id === clientRecord.userId);
          if (!user || user.isSuspended) {
            ws.send(JSON.stringify({ type: 'error', message: 'Tu cuenta está suspendida.' }));
            return;
          }

          // Enforce Cooldown for WebSocket messages too
          const isExempt = user.role === UserRole.Owner || user.role === UserRole.CoOwner || IMMUTABLE_OWNERS.includes(user.email.toLowerCase());
          const userCooldownSeconds = db.chatCooldown !== undefined ? db.chatCooldown : 3;

          if (!isExempt && userCooldownSeconds > 0) {
            const now = Date.now();
            const lastTime = lastMessageTimes[user.id] || 0;
            const elapsed = (now - lastTime) / 1000;
            if (elapsed < userCooldownSeconds) {
              const remaining = Math.ceil(userCooldownSeconds - elapsed);
              ws.send(JSON.stringify({ type: 'error', message: `Por favor espera ${remaining} segundos antes de enviar otro mensaje.` }));
              return;
            }
            lastMessageTimes[user.id] = now;
          } else {
            lastMessageTimes[user.id] = Date.now();
          }

          const chatMsg: ChatMessage = {
            id: crypto.randomUUID(),
            userId: user.id,
            username: user.username,
            avatarUrl: user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.username)}`,
            role: user.role,
            content: String(payload.content || '').substring(0, 500),
            createdAt: new Date().toISOString()
          };

          db.chatMessages = db.chatMessages || [];
          db.chatMessages.push(chatMsg);
          if (db.chatMessages.length > 200) {
            db.chatMessages = db.chatMessages.slice(-200);
          }
          saveDB();

          broadcastMessage({ type: 'msg', message: chatMsg });
        }
      } catch (err) {
        console.error('Error handling WS message:', err);
      }
    });

    ws.on('close', () => {
      activeClients.delete(clientRecord);
    });

    ws.on('error', () => {
      activeClients.delete(clientRecord);
    });
  });
}

startServer();
