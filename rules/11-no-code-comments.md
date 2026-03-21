---
description: Avoid adding comments in code - prefer self-documenting code
alwaysApply: true
---

# No Code Comments

Não adicione comentários no código. O código deve ser autoexplicativo através de nomes claros e estrutura simples.

## Princípio

**O código deve explicar-se por si só.** Se você precisa de um comentário para explicar o que o código faz, refatore o código.

---

## O que NUNCA fazer

### ❌ Comentários explicando o que o código faz

```typescript
// Loop through all users
for (const user of users) {
 // Check if user is active
 if (user.isActive) {
 // Send email
 sendEmail(user);
 }
}

// Calculate the total price
const total = price * quantity;

// Return the result
return result;
```

### ❌ Comentários TODO, FIXME, HACK

```typescript
// TODO: Fix this later
// FIXME: This is broken
// HACK: Quick fix
function processData(data) {
 // ...
}
```

### ❌ Commented out code

```typescript
function calculate(x, y) {
 // const old = x + y;
 // return old * 2;
 return (x + y) * 2;
}
```

---

## O que fazer

### ✅ Use nomes descritivos

```typescript
// ❌ BAU
function calc(u) {
 // Check if user is premium
 if (u.p) {
 return u.price * 0.8;
 }
 return u.price;
}

// ✅ BOM
function calculatePriceWithDiscount(user: User): number {
 if (user.isPremium) {
 return user.price * PREMIUM_DISCOUNT_RATE;
 }
 return user.price;
}
```

### ✅ Extraia funções com nomes claros

```typescript
// ❌ MAU
function process(order) {
 // Validate order
 if (!order || !order.items || order.items.length === 0) {
 throw new Error('Invalid order');
 }
 
 // Calculate total
 let total = 0;
 for (const item of order.items) {
 total += item.price * item.quantity;
 }
 
 // Apply discount
 if (order.customer.isPremium) {
 total *= 0.9;
 }
 
 return total;
}

// ✅ BOM
function processOrder(order: Order): number {
 validateOrder(order);
 const subtotal = calculateSubtotal(order.items);
 return applyDiscount(subtotal, order.customer);
}

function validateOrder(order: Order): void {
 if (!order?.items?.length) {
 throw new OrderValidationError('Order must have items');
 }
}

function calculateSubtotal(items: OrderItem[]): number {
 return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function applyDiscount(amount: number, customer: Customer): number {
 if (customer.isPremium) return amount * PREMIUM_DISCOUNT_RATE;
 return amount;
}
```

### ✅ Use constantes nomeadas

```typescript
// ❌ MAU
function getDiscount(customer) {
 // Premium customers get 20% off
 if (customer.isPremium) {
 return 0.2;
 }
 return 0;
}

// ✅ BOM
const PREMIUM_DISCOUNT_RATE = 0.2;
const NO_DISCOUNT = 0;

function getDiscount(customer: Customer): number {
 if (customer.isPremium) return PREMIUM_DISCOUNT_RATE;
 return NO_DISCOUNT;
}
```

---

## Exceções (única situação aceitável)

### ✅ JSDoc para APIs públicas

Apenas para documentar APIs públicas, interfaces de bibliotecas ou contratos externos:

```typescript
/**
 * Processes payment for an order.
 * @throws {PaymentError} When payment gateway fails
 * @throws {InvalidOrderError} When order validation fails
 */
export async function processPayment(orderId: string): Promise<Payment> {
 const order = await validateAndGetOrder(orderId);
 return await chargePaymentGateway(order);
}
```

**Importante:** Mesmo JSDoc deve ser mínimo e focar em contratos/exceções, não em implementação.

---

## Como Refatorar

Quando você encontrar código com comentários:

1. **Extraia função** com nome que descreve o comentário
2. **Renomeie variáveis** para serem autoexplicativas 
3. **Use constantes** ao invés de magic numbers
4. **Simplifique lógica** com early returns e guards
5. **Delete o comentário** após refatorar

### Exemplo completo

```typescript
// ❌ ANTES
function calculate(u, p, q) {
 // Check if user exists and is valid
 if (!u || !u.id) {
 return null;
 }
 
 // Calculate base price
 const base = p * q;
 
 // Apply tax (15%)
 const withTax = base * 1.15;
 
 // Premium users get 10% discount
 if (u.premium) {
 return withTax * 0.9;
 }
 
 return withTax;
}

// ✅ DEPOIS
const TAX_RATE = 1.15;
const PREMIUM_DISCOUNT = 0.9;

function calculateOrderTotal(user: User, price: number, quantity: number): number | null {
 if (!isValidUser(user)) return null;
 
 const basePrice = price * quantity;
 const priceWithTax = basePrice * TAX_RATE;
 
 if (user.isPremium) return priceWithTax * PREMIUM_DISCOUNT;
 return priceWithTax;
}

function isValidUser(user: User): boolean {
 return Boolean(user?.id);
}
```

---

## Resumo

- ❌ Nunca adicione comentários explicando o que o código faz
- ❌ Nunca deixe código comentado
- ❌ Nunca use TODO, FIXME, HACK
- ✅ Use nomes de variáveis e funções descritivos
- ✅ Extraia funções pequenas com propósito único
- ✅ Use constantes nomeadas
- ✅ JSDoc apenas para APIs públicas (mínimo necessário)
