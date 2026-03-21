---
description: Everything must be testable - prefer Humble Object pattern
alwaysApply: true
---

# Testability First - Humble Object Pattern

Todo código deve ser facilmente testável. Use o padrão Humble Object para separar lógica testável de código difícil de testar.

## Princípio Humble Object

Separe a lógica de negócio (testável) dos componentes difíceis de testar (UI, frameworks, I/O, banco de dados).

**Regra de Ouro**: O "humble object" deve ser tão simples que não precisa de testes. Toda a lógica fica em objetos testáveis.

---

## Controllers (NestJS/Express)

### ❌ MAU - Lógica no controller

```typescript
@Controller('orders')
export class OrdersController {
 constructor(
 private ordersRepository: OrdersRepository,
 private emailService: EmailService,
 private logger: Logger
 ) {}

 @Post()
 async create(@Body() data: CreateOrderDto, @Req() req: Request) {
 if (!data.items || data.items.length === 0) {
 throw new BadRequestException('Order must have items');
 }
 
 let total = 0;
 for (const item of data.items) {
 if (item.quantity <= 0) {
 throw new BadRequestException('Invalid quantity');
 }
 total += item.price * item.quantity;
 }
 
 if (req.user.isPremium) {
 total = total * 0.9;
 }
 
 const order = await this.ordersRepository.create({
 userId: req.user.id,
 items: data.items,
 total,
 status: 'pending'
 });
 
 try {
 await this.emailService.sendOrderConfirmation(req.user.email, order);
 } catch (error) {
 this.logger.error('Failed to send email', error);
 }
 
 return order;
 }
}
```

### ✅ BOM - Humble Controller

```typescript
@Controller('orders')
export class OrdersController {
 constructor(private ordersService: OrdersService) {}

 @Post()
 async create(@Body() data: CreateOrderDto, @User() user: UserDto) {
 return this.ordersService.createOrder(data, user);
 }
}

export class OrdersService {
 constructor(
 private ordersRepository: OrdersRepository,
 private emailService: EmailService,
 private orderValidator: OrderValidator,
 private priceCalculator: PriceCalculator,
 private logger: Logger
 ) {}

 async createOrder(data: CreateOrderDto, user: UserDto): Promise<Order> {
 this.orderValidator.validate(data);
 
 const total = this.priceCalculator.calculate(data.items, user);
 
 const order = await this.ordersRepository.create({
 userId: user.id,
 items: data.items,
 total,
 status: 'pending'
 });
 
 await this.sendConfirmationEmail(user.email, order);
 
 return order;
 }

 private async sendConfirmationEmail(email: string, order: Order): Promise<void> {
 try {
 await this.emailService.sendOrderConfirmation(email, order);
 } catch (error) {
 this.logger.error('Failed to send email', error);
 }
 }
}

export class OrderValidator {
 validate(data: CreateOrderDto): void {
 if (!data.items?.length) {
 throw new InvalidOrderError('Order must have items');
 }
 
 const hasInvalidQuantity = data.items.some(item => item.quantity <= 0);
 
 if (hasInvalidQuantity) {
 throw new InvalidOrderError('All items must have positive quantity');
 }
 }
}

export class PriceCalculator {
 private readonly PREMIUM_DISCOUNT = 0.9;

 calculate(items: OrderItem[], user: UserDto): number {
 const subtotal = items.reduce(
 (sum, item) => sum + item.price * item.quantity,
 0
 );
 
 if (user.isPremium) return subtotal * this.PREMIUM_DISCOUNT;
 return subtotal;
 }
}
```

---

## React Components

### ❌ MAU - Lógica no componente

```typescript
export function OrderForm() {
 const [items, setItems] = useState([]);
 const [total, setTotal] = useState(0);
 const [error, setError] = useState('');

 const handleSubmit = async (e) => {
 e.preventDefault();
 
 if (items.length === 0) {
 setError('Add at least one item');
 return;
 }
 
 let sum = 0;
 for (const item of items) {
 if (!item.name || item.price <= 0 || item.quantity <= 0) {
 setError('Invalid item data');
 return;
 }
 sum += item.price * item.quantity;
 }
 
 if (sum > 10000) {
 setError('Order exceeds maximum value');
 return;
 }
 
 try {
 await fetch('/api/orders', {
 method: 'POST',
 body: JSON.stringify({ items, total: sum })
 });
 } catch (err) {
 setError('Failed to create order');
 }
 };

 return (
 <form onSubmit={handleSubmit}>
 {error && <div className="error">{error}</div>}
 <button type="submit">Create Order</button>
 </form>
 );
}
```

### ✅ BOM - Humble Component

```typescript
export function OrderForm() {
 const { submit, error } = useOrderForm();

 return (
 <form onSubmit={submit}>
 {error && <div className="error">{error}</div>}
 <button type="submit">Create Order</button>
 </form>
 );
}

export function useOrderForm() {
 const [items, setItems] = useState([]);
 const [error, setError] = useState('');
 const orderService = useOrderService();

 const submit = async (e: FormEvent) => {
 e.preventDefault();
 
 const validation = validateOrder({ items });
 
 if (!validation.isValid) {
 setError(validation.error);
 return;
 }
 
 const result = await orderService.create({ items });
 
 if (!result.success) {
 setError(result.error);
 }
 };

 return { submit, error };
}

export function validateOrder(data: { items: OrderItem[] }) {
 if (!data.items.length) {
 return { isValid: false, error: 'Add at least one item' };
 }
 
 const hasInvalidItem = data.items.some(
 item => !item.name || item.price <= 0 || item.quantity <= 0
 );
 
 if (hasInvalidItem) {
 return { isValid: false, error: 'Invalid item data' };
 }
 
 const total = calculateTotal(data.items);
 
 if (total > MAX_ORDER_VALUE) {
 return { isValid: false, error: 'Order exceeds maximum value' };
 }
 
 return { isValid: true };
}

export function calculateTotal(items: OrderItem[]): number {
 return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
```

---

## Database/Repository

### ❌ MAU - Lógica no repository

```typescript
export class UsersRepository {
 async findActiveUsers(): Promise<User[]> {
 const users = await this.db.query('SELECT * FROM users');
 
 const activeUsers = [];
 
 for (const user of users) {
 if (user.status === 'active' && user.lastLoginAt) {
 const daysSinceLogin = Math.floor(
 (Date.now() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24)
 );
 
 if (daysSinceLogin <= 30) {
 activeUsers.push(user);
 }
 }
 }
 
 return activeUsers;
 }
}
```

### ✅ BOM - Humble Repository

```typescript
export class UsersRepository {
 async findAll(): Promise<User[]> {
 return this.db.query('SELECT * FROM users');
 }
 
 async findByStatus(status: string): Promise<User[]> {
 return this.db.query('SELECT * FROM users WHERE status = $1', [status]);
 }
}

export class UserFilter {
 private readonly ACTIVE_DAYS_THRESHOLD = 30;

 filterActiveUsers(users: User[]): User[] {
 return users.filter(user => this.isActiveUser(user));
 }

 private isActiveUser(user: User): boolean {
 if (user.status !== 'active') return false;
 if (!user.lastLoginAt) return false;
 
 return this.getDaysSinceLogin(user.lastLoginAt) <= this.ACTIVE_DAYS_THRESHOLD;
 }

 private getDaysSinceLogin(lastLogin: Date): number {
 const millisecondsPerDay = 1000 * 60 * 60 * 24;
 return Math.floor((Date.now() - lastLogin.getTime()) / millisecondsPerDay);
 }
}

export class UsersService {
 constructor(
 private repository: UsersRepository,
 private filter: UserFilter
 ) {}

 async getActiveUsers(): Promise<User[]> {
 const allUsers = await this.repository.findAll();
 return this.filter.filterActiveUsers(allUsers);
 }
}
```

---
## Middleware/Guards

### ❌ MAU - Lógica no guard

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
 canActivate(context: ExecutionContext): boolean {
 const request = context.switchToHttp().getRequest();
 const token = request.headers['authorization']?.split(' ')[1];
 
 if (!token) return false;
 
 try {
 const decoded = jwt.verify(token, process.env.JWT_SECRET);
 
 if (decoded.exp < Date.now() / 1000) return false;
 
 if (decoded.role === 'admin') {
 request.user = decoded;
 return true;
 }
 
 if (decoded.role === 'user' && request.path.startsWith('/api/users')) {
 if (request.params.id === decoded.id) {
 request.user = decoded;
 return true;
 }
 }
 
 return false;
 } catch {
 return false;
 }
 }
}
```

### ✅ BOM - Humble Guard

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
 constructor(
 private tokenService: TokenService,
 private authorizationService: AuthorizationService
 ) {}

 canActivate(context: ExecutionContext): boolean {
 const request = context.switchToHttp().getRequest();
 const token = this.tokenService.extractToken(request);
 
 if (!token) return false;
 
 const user = this.tokenService.verifyToken(token);
 
 if (!user) return false;
 
 const isAuthorized = this.authorizationService.canAccess(
 user,
 request.path,
 request.params
 );
 
 if (isAuthorized) {
 request.user = user;
 }
 
 return isAuthorized;
 }
}

export class TokenService {
 extractToken(request: Request): string | null {
 return request.headers['authorization']?.split(' ')[1] || null;
 }

 verifyToken(token: string): UserPayload | null {
 try {
 const decoded = jwt.verify(token, process.env.JWT_SECRET);
 
 if (!this.isTokenValid(decoded)) return null;
 
 return decoded as UserPayload;
 } catch {
 return null;
 }
 }

 private isTokenValid(decoded: any): boolean {
 return decoded.exp >= Date.now() / 1000;
 }
}

export class AuthorizationService {
 canAccess(user: UserPayload, path: string, params: any): boolean {
 if (user.role === 'admin') return true;
 
 if (this.isUserRoute(path)) {
 return this.canAccessUserRoute(user, params);
 }
 
 return false;
 }

 private isUserRoute(path: string): boolean {
 return path.startsWith('/api/users');
 }

 private canAccessUserRoute(user: UserPayload, params: any): boolean {
 return user.role === 'user' && params.id === user.id;
 }
}
```

---

## Princípios de Design para Testabilidade

### 1. Injeção de Dependências

```typescript
export class OrderService {
 constructor(
 private repository: OrdersRepository,
 private emailService: EmailService,
 private logger: Logger
 ) {}
}
```

### 2. Funções Puras

```typescript
export function calculateDiscount(price: number, isPremium: boolean): number {
 if (isPremium) return price * 0.9;
 return price;
}
```

### 3. Separação de Concerns

```typescript
export class UserService {
 validate(data: CreateUserDto): ValidationResult {}
 transform(data: CreateUserDto): User {}
 async save(user: User): Promise<User> {}
}
```

### 4. Interfaces para Abstrações

```typescript
export interface IEmailService {
 send(to: string, subject: string, body: string): Promise<void>;
}

export class OrderService {
 constructor(private emailService: IEmailService) {}
}
```

---

## Checklist de Testabilidade

- [ ] Controllers/Components são "humble" (apenas coordenação)
- [ ] Lógica de negócio está em services/funções puras
- [ ] Dependências são injetadas (não instanciadas internamente)
- [ ] Funções têm responsabilidade única
- [ ] Código I/O está isolado da lógica
- [ ] Validações estão em classes/funções dedicadas
- [ ] Cálculos estão em funções puras
- [ ] Fácil de mockar dependências em testes
- [ ] Não há lógica condicional complexa em humble objects
- [ ] Cada classe/função tem um propósito claro e testável
