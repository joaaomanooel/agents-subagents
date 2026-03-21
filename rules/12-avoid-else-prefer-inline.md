---
description: Avoid else statements and prefer inline if expressions
alwaysApply: true
---

# Avoid Else - Prefer Inline If

Sempre evite usar `else` e prefira `if` inline (uma linha) ou retornos antecipados (early returns).

## Princípios

1. **Elimine else com early returns**: Retorne cedo para evitar aninhamento
2. **Use if inline**: Para atribuições simples, use operadores ternários ou if inline
3. **Extraia funções**: Para lógica complexa, extraia para funções auxiliares
4. **Mantenha flat**: Código sem else é mais fácil de ler

---

## TypeScript/JavaScript

### ❌ MAU - Usando else

```typescript
function getDiscount(customer: Customer): number {
 if (customer.isPremium) {
 return 0.2;
 } else {
 return 0.1;
 }
}

function processOrder(order: Order): string {
 if (order.status === 'pending') {
 return 'Processing...';
 } else if (order.status === 'paid') {
 return 'Shipped';
 } else {
 return 'Unknown';
 }
}
```

### ✅ BOM - Early return e if inline

```typescript
function getDiscount(customer: Customer): number {
 if (customer.isPremium) return 0.2;
 return 0.1;
}

function processOrder(order: Order): string {
 if (order.status === 'pending') return 'Processing...';
 if (order.status === 'paid') return 'Shipped';
 return 'Unknown';
}

// Para atribuições simples
const discount = customer.isPremium ? 0.2 : 0.1;
const message = isValid ? 'Success' : 'Error';
```

---

## Python

### ❌ MAU - Usando else

```python
def calculate_price(item: Item) -> float:
 if item.on_sale:
 return item.price * 0.8
 else:
 return item.price

def get_status(user: User) -> str:
 if user.is_active:
 return "active"
 else:
 if user.is_suspended:
 return "suspended"
 else:
 return "inactive"
```

### ✅ BOM - Early return e inline

```python
def calculate_price(item: Item) -> float:
 if item.on_sale:
 return item.price * 0.8
 return item.price

def get_status(user: User) -> str:
 if user.is_active:
 return "active"
 if user.is_suspended:
 return "suspended"
 return "inactive"

# Para expressões simples
price = item.price * 0.8 if item.on_sale else item.price
status = "active" if user.is_active else "inactive"
```

---

## Java/C#

### ❌ MAU - Usando else

```java
public double getPrice(Product product) {
 if (product.isOnSale()) {
 return product.getBasePrice() * 0.9;
 } else {
 return product.getBasePrice();
 }
}
```

### ✅ BOM - Early return

```java
public double getPrice(Product product) {
 if (product.isOnSale()) {
 return product.getBasePrice() * 0.9;
 }
 return product.getBasePrice();
}

// Ternário para atribuições
double price = product.isOnSale() 
 ? product.getBasePrice() * 0.9 
 : product.getBasePrice();
```

---

## Casos Especiais

### Guard Clauses (Validações)

```typescript
// ✅ Excelente - Guard clauses no início
function processPayment(order: Order): void {
 if (!order) throw new Error('Order is required');
 if (!order.isPaid) throw new Error('Order not paid');
 if (order.isProcessed) return;
 
 // Lógica principal aqui
 sendConfirmation(order);
 updateInventory(order);
}
```

### Mapeamento de Valores

```typescript
// ✅ Use objeto/map ao invés de múltiplos if-else
const statusMap = {
 pending: 'Processing...',
 paid: 'Shipped',
 cancelled: 'Refunded',
} as const;

function getOrderStatus(status: string): string {
 return statusMap[status] ?? 'Unknown';
}
```

---

## Exceções (quando else é aceitável)

Em alguns casos raros, `else` pode ser usado se:

1. **Template rendering** com lógica de apresentação complexa
2. **Linguagens que exigem** else explícito (ex: algumas configurações)
3. **Código legado** onde refatoração completa não é viável no momento

Mesmo nesses casos, considere refatorar quando possível.
