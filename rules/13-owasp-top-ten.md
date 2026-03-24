---
description: Follow OWASP Top Ten security best practices
alwaysApply: true
---

# OWASP Top Ten Security

Always follow OWASP Top Ten security best practices. All code must be developed with security in mind.

---

## 1. Broken Access Control

### ❌ MAU

```typescript
app.get('/api/users/:id', async (req, res) => {
 const user = await User.findById(req.params.id);
 return res.json(user);
});

function deleteOrder(orderId: string) {
 return Order.delete(orderId);
}
```

### ✅ BOM

```typescript
app.get('/api/users/:id', authenticateUser, async (req, res) => {
 const requestedUserId = req.params.id;
 const currentUserId = req.user.id;
 
 if (requestedUserId !== currentUserId && !req.user.isAdmin) {
 throw new ForbiddenError('Access denied');
 }
 
 const user = await User.findById(requestedUserId);
 return res.json(user);
});

function deleteOrder(orderId: string, userId: string) {
 const order = await Order.findById(orderId);
 
 if (order.userId !== userId) {
 throw new ForbiddenError('Cannot delete order from another user');
 }
 
 return Order.delete(orderId);
}
```

---

## 2. Cryptographic Failures

### ❌ MAU

```typescript
import * as crypto from 'crypto';

function hashPassword(password: string): string {
 return crypto.createHash('md5').update(password).digest('hex');
}

const apiKey = 'hardcoded-api-key-123';

function encryptData(data: string): string {
 const cipher = crypto.createCipher('aes192', 'weak-password');
 return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
}
```

### ✅ BOM

```typescript
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
 return bcrypt.hash(password, SALT_ROUNDS);
}

const apiKey = process.env.API_KEY;

function encryptData(data: string): string {
 const algorithm = 'aes-256-gcm';
 const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
 const iv = crypto.randomBytes(16);
 const cipher = crypto.createCipheriv(algorithm, key, iv);
 
 const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
 const tag = cipher.getAuthTag();
 
 return Buffer.concat([iv, tag, encrypted]).toString('base64');
}
```

---

## 3. Injection

### ❌ MAU

```typescript
app.get('/users', async (req, res) => {
 const name = req.query.name;
 const query = `SELECT * FROM users WHERE name = '${name}'`;
 const users = await db.query(query);
 return res.json(users);
});

function searchProducts(category: string) {
 return eval(`products.filter(p => p.category === '${category}')`);
}
```

### ✅ BOM

```typescript
app.get('/users', async (req, res) => {
 const name = req.query.name;
 const users = await db.query('SELECT * FROM users WHERE name = $1', [name]);
 return res.json(users);
});

function searchProducts(category: string) {
 return products.filter(p => p.category === category);
}

const allowedCommands = ['start', 'stop', 'restart'];

function executeCommand(command: string) {
 if (!allowedCommands.includes(command)) {
 throw new ValidationError('Invalid command');
 }
 
 return execFile('service', [command], { shell: false });
}
```

---

## 4. Insecure Design

### ❌ MAU

```typescript
function resetPassword(email: string, newPassword: string) {
 const user = await User.findByEmail(email);
 
 if (!user) {
 throw new NotFoundError('User not found');
 }
 
 user.password = await hashPassword(newPassword);
 await user.save();
}

function transferMoney(fromAccount: string, toAccount: string, amount: number) {
 const from = await Account.findById(fromAccount);
 from.balance -= amount;
 
 const to = await Account.findById(toAccount);
 to.balance += amount;
 
 await from.save();
 await to.save();
}
```

### ✅ BOM

```typescript
function initiatePasswordReset(email: string) {
 const user = await User.findByEmail(email);
 
 if (!user) {
 return { success: true };
 }
 
 const token = crypto.randomBytes(32).toString('hex');
 const expiresAt = new Date(Date.now() + 3600000);
 
 await PasswordResetToken.create({ userId: user.id, token, expiresAt });
 await sendPasswordResetEmail(email, token);
 
 return { success: true };
}

function resetPassword(token: string, newPassword: string) {
 const resetToken = await PasswordResetToken.findValidToken(token);
 
 if (!resetToken) {
 throw new UnauthorizedError('Invalid or expired token');
 }
 
 const user = await User.findById(resetToken.userId);
 user.password = await hashPassword(newPassword);
 
 await user.save();
 await resetToken.delete();
}

async function transferMoney(fromAccount: string, toAccount: string, amount: number) {
 return await db.transaction(async (trx) => {
 const from = await Account.findById(fromAccount).forUpdate();
 
 if (from.balance < amount) {
 throw new InsufficientFundsError('Insufficient balance');
 }
 
 from.balance -= amount;
 const to = await Account.findById(toAccount).forUpdate();
 to.balance += amount;
 
 await from.save(trx);
 await to.save(trx);
 });
}
```

---

## 5. Security Misconfiguration

### ❌ MAU

```typescript
const app = express();

app.use(cors({ origin: '*' }));

app.use((err, req, res, next) => {
 res.status(500).json({
 error: err.message,
 stack: err.stack,
 details: err
 });
});

const config = {
 debug: true,
 showErrors: true,
 verbose: true
};
```

### ✅ BOM

```typescript
const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

app.use(cors({
 origin: allowedOrigins,
 credentials: true,
 maxAge: 86400
}));

app.use(helmet());

app.use((err, req, res, next) => {
 logger.error('Error occurred', { error: err, path: req.path });
 
 const isProduction = process.env.NODE_ENV === 'production';
 
 res.status(err.statusCode || 500).json({
 error: isProduction ? 'Internal server error' : err.message
 });
});

const config = {
 debug: process.env.NODE_ENV !== 'production',
 showErrors: process.env.NODE_ENV !== 'production',
 logLevel: process.env.LOG_LEVEL || 'info'
};
```

---
## 6. Vulnerable and Outdated Components

### ✅ Practices

```bash
npm audit
npm audit fix

npm outdated
npm update

npm install --save-exact lodash@4.17.21
```

```json
{
 "scripts": {
 "audit": "npm audit",
 "audit:fix": "npm audit fix",
 "outdated": "npm outdated"
 }
}
```

---

## 7. Identification and Authentication Failures

### ❌ MAU

```typescript
function login(username: string, password: string) {
 const user = await User.findOne({ username, password });
 
 if (!user) {
 throw new UnauthorizedError('Invalid credentials');
 }
 
 const token = jwt.sign({ id: user.id }, 'secret');
 return { token };
}

function validateSession(sessionId: string) {
 return sessions[sessionId];
}
```

### ✅ BOM

```typescript
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 900000;

async function login(username: string, password: string, ip: string) {
 const user = await User.findByUsername(username);
 
 if (!user) {
 await sleep(randomInt(100, 300));
 throw new UnauthorizedError('Invalid credentials');
 }
 
 if (user.isLockedOut()) {
 throw new UnauthorizedError('Account locked. Try again later');
 }
 
 const isValid = await bcrypt.compare(password, user.passwordHash);
 
 if (!isValid) {
 await user.incrementFailedAttempts();
 
 if (user.failedAttempts >= MAX_LOGIN_ATTEMPTS) {
 await user.lockAccount(LOCKOUT_DURATION_MS);
 }
 
 await sleep(randomInt(100, 300));
 throw new UnauthorizedError('Invalid credentials');
 }
 
 await user.resetFailedAttempts();
 
 const token = jwt.sign(
 { id: user.id, role: user.role },
 process.env.JWT_SECRET,
 { expiresIn: '15m' }
 );
 
 const refreshToken = await createRefreshToken(user.id);
 
 await logSecurityEvent('login_success', { userId: user.id, ip });
 
 return { token, refreshToken };
}
```

---

## 8. Software and Data Integrity Failures

### ❌ MAU

```typescript
app.post('/webhook', async (req, res) => {
 const data = req.body;
 await processWebhook(data);
 res.sendStatus(200);
});

function installPackage(packageName: string) {
 exec(`npm install ${packageName}`);
}
```

### ✅ BOM

```typescript
app.post('/webhook', async (req, res) => {
 const signature = req.headers['x-signature'];
 const payload = JSON.stringify(req.body);
 
 const expectedSignature = crypto
 .createHmac('sha256', process.env.WEBHOOK_SECRET)
 .update(payload)
 .digest('hex');
 
 if (signature !== expectedSignature) {
 throw new UnauthorizedError('Invalid signature');
 }
 
 await processWebhook(req.body);
 res.sendStatus(200);
});

const ALLOWED_PACKAGES = ['lodash', 'axios', 'express'];

function installPackage(packageName: string) {
 if (!ALLOWED_PACKAGES.includes(packageName)) {
 throw new ValidationError('Package not allowed');
 }
 
 return execFile('npm', ['install', '--save-exact', packageName], {
 shell: false,
 timeout: 30000
 });
}
```

---

## 9. Security Logging and Monitoring Failures

### ❌ MAU

```typescript
function deleteUser(userId: string) {
 return User.delete(userId);
}

app.post('/login', async (req, res) => {
 const user = await authenticateUser(req.body);
 return res.json({ token: user.token });
});
```

### ✅ BOM

```typescript
function deleteUser(userId: string, performedBy: string) {
 logger.security('user_deletion', {
 userId,
 performedBy,
 timestamp: new Date(),
 ip: req.ip
 });
 
 return User.delete(userId);
}

app.post('/login', async (req, res) => {
 try {
 const user = await authenticateUser(req.body);
 
 logger.security('login_success', {
 userId: user.id,
 ip: req.ip,
 userAgent: req.headers['user-agent'],
 timestamp: new Date()
 });
 
 return res.json({ token: user.token });
 } catch (error) {
 logger.security('login_failed', {
 username: req.body.username,
 ip: req.ip,
 reason: error.message,
 timestamp: new Date()
 });
 
 throw error;
 }
});
```

---

## 10. Server-Side Request Forgery (SSRF)

### ❌ MAU

```typescript
app.post('/fetch-url', async (req, res) => {
 const url = req.body.url;
 const response = await fetch(url);
 const data = await response.text();
 return res.send(data);
});

function downloadImage(imageUrl: string) {
 return axios.get(imageUrl);
}
```

### ✅ BOM

```typescript
const ALLOWED_DOMAINS = ['api.example.com', 'cdn.example.com'];
const BLOCKED_IPS = ['127.0.0.1', '0.0.0.0', 'localhost'];

function isUrlSafe(url: string): boolean {
 const parsed = new URL(url);
 
 if (parsed.protocol !== 'https:') return false;
 
 if (!ALLOWED_DOMAINS.includes(parsed.hostname)) return false;
 
 if (BLOCKED_IPS.some(ip => parsed.hostname.includes(ip))) return false;
 
 return true;
}

app.post('/fetch-url', async (req, res) => {
 const url = req.body.url;
 
 if (!isUrlSafe(url)) {
 throw new ValidationError('Invalid or unsafe URL');
 }
 
 const response = await fetch(url, {
 redirect: 'manual',
 timeout: 5000
 });
 
 const data = await response.text();
 return res.send(data);
});
```

---

## General Checklist

- [ ] Always validate and sanitize inputs
- [ ] Use prepared statements for queries
- [ ] Implement adequate authentication and authorization
- [ ] Use HTTPS in production
- [ ] Store passwords with bcrypt/argon2
- [ ] Never expose sensitive information in logs or errors
- [ ] Implement rate limiting
- [ ] Use environment variables for secrets
- [ ] Keep dependencies updated
- [ ] Implement security event logging
- [ ] Validate redirects and forwards
- [ ] Use tokens with expiration
- [ ] Implement CSRF protection
- [ ] Configure security headers (helmet.js)
