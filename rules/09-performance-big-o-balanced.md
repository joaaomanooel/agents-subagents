---
description: Balance Big O notation with performance, readability and maintainability
alwaysApply: true
---

# Performance Equilibrada - Big O, Legibilidade e Manutenibilidade

Busque o equilíbrio entre Big O notation, performance, legibilidade, manutenibilidade e complexidade. 

**Princípio**: Código eficiente que também é claro, simples de manter e fácil de entender.

---

## Hierarquia de Prioridades

1. **Correção** - O código deve funcionar corretamente
2. **Legibilidade** - Outros devem entender facilmente
3. **Simplicidade** - Evite complexidade desnecessária
4. **Manutenibilidade** - Fácil de modificar e estender
5. **Performance** - Otimize quando necessário

## Complexidades Comuns

**Do melhor para o pior:**
- O(1) - Constante
- O(log n) - Logarítmica
- O(n) - Linear
- O(n log n) - Linearítmica
- O(n²) - Quadrática
- O(n³) - Cúbica
- O(2ⁿ) - Exponencial
- O(n!) - Fatorial

---

## 1. Buscar em Arrays

### ❌ MAU - O(n²)

```typescript
function findDuplicates(items: string[]): string[] {
 const duplicates: string[] = [];
 
 for (let i = 0; i < items.length; i++) {
 for (let j = i + 1; j < items.length; j++) {
 if (items[i] === items[j] && !duplicates.includes(items[i])) {
 duplicates.push(items[i]);
 }
 }
 }
 
 return duplicates;
}
```

### ✅ BOM - O(n)

```typescript
function findDuplicates(items: string[]): string[] {
 const seen = new Set<string>();
 const duplicates = new Set<string>();
 
 for (const item of items) {
 if (seen.has(item)) {
 duplicates.add(item);
 continue;
 }
 seen.add(item);
 }
 
 return Array.from(duplicates);
}
```

---

## 2. Verificar Existência

### ❌ MAU - O(n)

```typescript
function hasUser(users: User[], userId: string): boolean {
 return users.some(user => user.id === userId);
}

function getUsersByIds(users: User[], ids: string[]): User[] {
 return ids.map(id => users.find(user => user.id === id)).filter(Boolean);
}
```

### ✅ BOM - O(1)

```typescript
function hasUser(userMap: Map<string, User>, userId: string): boolean {
 return userMap.has(userId);
}

function getUsersByIds(userMap: Map<string, User>, ids: string[]): User[] {
 return ids.map(id => userMap.get(id)).filter(Boolean);
}

function createUserMap(users: User[]): Map<string, User> {
 return new Map(users.map(user => [user.id, user]));
}
```

---

## 3. Remover Duplicatas

### ❌ MAU - O(n²)

```typescript
function removeDuplicates(items: number[]): number[] {
 const result: number[] = [];
 
 for (const item of items) {
 if (!result.includes(item)) {
 result.push(item);
 }
 }
 
 return result;
}
```

### ✅ BOM - O(n)

```typescript
function removeDuplicates(items: number[]): number[] {
 return Array.from(new Set(items));
}
```

---

## 4. Contar Ocorrências

### ❌ MAU - O(n²)

```typescript
function countOccurrences(items: string[]): Record<string, number> {
 const counts: Record<string, number> = {};
 
 for (const item of items) {
 counts[item] = items.filter(i => i === item).length;
 }
 
 return counts;
}
```

### ✅ BOM - O(n)

```typescript
function countOccurrences(items: string[]): Map<string, number> {
 const counts = new Map<string, number>();
 
 for (const item of items) {
 counts.set(item, (counts.get(item) || 0) + 1);
 }
 
 return counts;
}
```

---

## 5. Filtrar e Mapear

### ⚠️ ACEITÁVEL - Legível mas múltiplas iterações

```typescript
function processUsers(users: User[]): ProcessedUser[] {
 const active = users.filter(u => u.isActive);
 const verified = active.filter(u => u.isVerified);
 const mapped = verified.map(u => ({ id: u.id, name: u.name }));
 const sorted = mapped.sort((a, b) => a.name.localeCompare(b.name));
 
 return sorted;
}
```

### ✅ BOM - Equilibrado entre performance e legibilidade

```typescript
function processUsers(users: User[]): ProcessedUser[] {
 return users
 .filter(u => u.isActive && u.isVerified)
 .map(u => ({ id: u.id, name: u.name }))
 .sort((a, b) => a.name.localeCompare(b.name));
}
```

**Trade-off**: Perde alguns milissegundos mas ganha muito em clareza. Para arrays pequenos (< 10.000), a diferença é negligenciável.

---

## 6. Busca em Objetos Aninhados

### ❌ MAU - O(n * m)

```typescript
function getUserOrders(users: User[], orders: Order[]): UserWithOrders[] {
 return users.map(user => ({
 ...user,
 orders: orders.filter(order => order.userId === user.id)
 }));
}
```

### ✅ BOM - O(n + m)

```typescript
function getUserOrders(users: User[], orders: Order[]): UserWithOrders[] {
 const ordersByUser = new Map<string, Order[]>();
 
 for (const order of orders) {
 const userOrders = ordersByUser.get(order.userId) || [];
 userOrders.push(order);
 ordersByUser.set(order.userId, userOrders);
 }
 
 return users.map(user => ({
 ...user,
 orders: ordersByUser.get(user.id) || []
 }));
}
```

---

## 7. Inversão de String/Array

### ❌ MAU - O(n²)

```typescript
function reverseString(str: string): string {
 let result = '';
 
 for (let i = str.length - 1; i >= 0; i--) {
 result += str[i];
 }
 
 return result;
}
```

### ✅ BOM - O(n)

```typescript
function reverseString(str: string): string {
 return str.split('').reverse().join('');
}

function reverseArray<T>(arr: T[]): T[] {
 return arr.slice().reverse();
}
```

---

## 8. Encontrar Máximo/Mínimo

### ❌ MAU - O(n log n)

```typescript
function findMax(numbers: number[]): number {
 return numbers.sort((a, b) => b - a)[0];
}
```

### ✅ BOM - O(n)

```typescript
function findMax(numbers: number[]): number {
 if (!numbers.length) throw new Error('Empty array');
 return Math.max(...numbers);
}

function findMinMax(numbers: number[]): { min: number; max: number } {
 if (!numbers.length) throw new Error('Empty array');
 
 let min = numbers[0];
 let max = numbers[0];
 
 for (const num of numbers) {
 if (num < min) min = num;
 if (num > max) max = num;
 }
 
 return { min, max };
}
```

---

## 9. Merge de Arrays

### ❌ MAU - O(n * m)

```typescript
function mergeArrays(arr1: number[], arr2: number[]): number[] {
 const result = [...arr1];
 
 for (const item of arr2) {
 if (!result.includes(item)) {
 result.push(item);
 }
 }
 
 return result;
}
```

### ✅ BOM - O(n + m)

```typescript
function mergeArrays(arr1: number[], arr2: number[]): number[] {
 return Array.from(new Set([...arr1, ...arr2]));
}
```

---

## 10. Paginação

### ❌ MAU - Buscar todos e paginar

```typescript
async function getUsers(page: number, limit: number): Promise<User[]> {
 const allUsers = await db.query('SELECT * FROM users');
 
 const start = (page - 1) * limit;
 const end = start + limit;
 
 return allUsers.slice(start, end);
}
```

### ✅ BOM - Paginar no banco

```typescript
async function getUsers(page: number, limit: number): Promise<User[]> {
 const offset = (page - 1) * limit;
 
 return db.query(
 'SELECT * FROM users LIMIT $1 OFFSET $2',
 [limit, offset]
 );
}
```

---

## Estruturas de Dados

### Escolha baseada no contexto

```typescript
const smallArray = [1, 2, 3, 4, 5];
const largeArray = Array.from({ length: 10000 }, (_, i) => i);

smallArray.includes(2); // O(n) - OK para arrays pequenos ✅
largeArray.includes(5000); // O(n) - Problemático ⚠️

const largeSet = new Set(largeArray);
largeSet.has(5000); // O(1) - Melhor para grandes coleções ✅
```

### Comparação de operações

```typescript
const array = [1, 2, 3];
const set = new Set([1, 2, 3]);
const map = new Map([['a', 1], ['b', 2]]);

array.includes(2); // O(n) - Simples e legível para arrays pequenos
set.has(2); // O(1) - Necessário para grandes coleções

array.push(4); // O(1) - Adicionar no final ✅
array.unshift(0); // O(n) - Evite se possível

const [first, ...rest] = array; // O(n) mas expressivo e claro ✅
```

---

## Equilíbrio: Legibilidade vs Performance

### Caso 1: Arrays Pequenos

```typescript
const users = [user1, user2, user3];

const activeUser = users.find(u => u.isActive);
```

**Decisão**: O(n) é aceitável. Código simples e direto.

### Caso 2: Arrays Grandes

```typescript
const users = await getUsersFromDatabase();
const userMap = new Map(users.map(u => [u.id, u]));

function findUser(id: string): User | undefined {
 return userMap.get(id);
}
```

**Decisão**: Pre-processar em Map justifica a complexidade. Performance crítica.

### Caso 3: Código Executado Frequentemente

```typescript
function processRequest(userId: string) {
 const user = userMap.get(userId);
 
 if (!user) throw new NotFoundError('User not found');
 
 return user;
}
```

**Decisão**: Use estruturas O(1) em hot paths.

---

## Trade-offs Comuns

### 1. Tempo vs Espaço

#### ⚠️ Simples mas ineficiente

```typescript
function fibonacci(n: number): number {
 if (n <= 1) return n;
 return fibonacci(n - 1) + fibonacci(n - 2);
}
```

#### ✅ Mais complexo mas eficiente

```typescript
function fibonacci(n: number, memo = new Map<number, number>()): number {
 if (n <= 1) return n;
 
 if (memo.has(n)) return memo.get(n)!;
 
 const result = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);
 memo.set(n, result);
 
 return result;
}
```

**Trade-off**: Usa mais memória (espaço) mas ganha exponencialmente em tempo. Vale a pena para n > 20.

### 2. Legibilidade vs Micro-otimização

#### ✅ Claro e eficiente o suficiente

```typescript
function getActiveUsers(users: User[]): User[] {
 return users.filter(user => user.isActive && user.verified);
}
```

#### ❌ Micro-otimizado mas menos claro

```typescript
function getActiveUsers(users: User[]): User[] {
 const result: User[] = [];
 const len = users.length;
 
 for (let i = 0; i < len; i++) {
 const user = users[i];
 if (user.isActive && user.verified) {
 result[result.length] = user;
 }
 }
 
 return result;
}
```

**Decisão**: A primeira versão é preferível. Micro-otimizações raramente compensam a perda de legibilidade.

### 3. Abstração vs Performance

#### ⚠️ Sobre-abstraído

```typescript
class UserCollection {
 constructor(private users: User[]) {}
 
 filter(predicate: (u: User) => boolean): UserCollection {
 return new UserCollection(this.users.filter(predicate));
 }
 
 map<T>(fn: (u: User) => T): T[] {
 return this.users.map(fn);
 }
 
 toArray(): User[] {
 return [...this.users];
 }
}

const active = new UserCollection(users)
 .filter(u => u.isActive)
 .filter(u => u.verified)
 .toArray();
```

#### ✅ Equilibrado

```typescript
function filterActiveUsers(users: User[]): User[] {
 return users.filter(u => u.isActive && u.verified);
}
```

**Decisão**: Abstrações devem agregar valor real. Evite over-engineering.

---

## Quando Otimizar

### ✅ Otimize quando há impacto real:
- Arrays/coleções grandes (> 1000 itens)
- Código executado frequentemente (hot paths)
- Loops aninhados causando lentidão perceptível
- Operações em banco de dados
- APIs públicas com alto volume
- Feedback de usuários sobre lentidão
- Evidência de profiling mostrando gargalos

### ⚠️ Não otimize prematuramente:
- Código executado raramente
- Arrays pequenos (< 100 itens)
- Quando prejudica legibilidade significativamente
- Sem evidência de problema de performance
- Antes de medir e confirmar o gargalo
- Se adiciona complexidade desnecessária
- Em protótipos e MVPs

### 📊 Meça antes de otimizar

```typescript
console.time('operation');
const result = expensiveOperation();
console.timeEnd('operation');
```

**Regra de Ouro**: Faça funcionar primeiro, depois meça, depois otimize se necessário.

---

## Padrões de Decisão

### Tamanho do Dataset

| Tamanho | Abordagem | Exemplo |
|---------|-----------|---------|
| < 10 itens | Simplicidade primeiro | `array.find()` é OK |
| 10-100 itens | Algoritmos O(n) aceitáveis | `filter()`, `map()` |
| 100-1000 itens | Evite O(n²) | Use Map/Set quando necessário |
| > 1000 itens | Otimize Big O | Map/Set obrigatório, considere índices |
| > 10000 itens | Performance crítica | Estruturas otimizadas, lazy loading |

### Frequência de Execução

| Frequência | Abordagem |
|------------|-----------|
| Uma vez na inicialização | Simplicidade > Performance |
| Poucas vezes por sessão | O(n) geralmente aceitável |
| Múltiplas vezes por página | Evite O(n²) |
| Múltiplas vezes por segundo | Otimize para O(1) ou O(log n) |
| Loop interno | Código deve ser O(1) sempre que possível |

---

## Análise Rápida

```typescript
for (item of items) {} // O(n)
for (i of items) for (j of items) {} // O(n²) ⚠️
items.map().filter() // O(n)
items.sort() // O(n log n)
items.find() // O(n)
set.has() / map.get() // O(1) ✅
array.includes() // O(n)
```

---

## Checklist

### Antes de escrever código
- [ ] Entendi o tamanho típico dos dados?
- [ ] Este código será executado frequentemente?
- [ ] Há requisitos de performance específicos?

### Ao escrever código
- [ ] O código está correto e funciona?
- [ ] O código é legível e fácil de entender?
- [ ] Evitei complexidade desnecessária?
- [ ] Evitei loops aninhados O(n²) quando há alternativa clara?
- [ ] Usei estruturas de dados apropriadas para o contexto?

### Ao otimizar
- [ ] Medi a performance antes de otimizar?
- [ ] Identifiquei o gargalo real?
- [ ] A otimização vale a complexidade adicional?
- [ ] O código otimizado ainda é mantível?
- [ ] Adicionei testes para garantir correção?
- [ ] Documentei o motivo da otimização (se necessário)?

### Sinais de alerta
- [ ] 🚨 Loops aninhados com datasets grandes
- [ ] 🚨 `.find()` ou `.includes()` dentro de loops
- [ ] 🚨 Buscar todos os dados do banco para filtrar na aplicação
- [ ] 🚨 Múltiplas iterações sobre o mesmo array grande
- [ ] 🚨 Concatenação de strings em loop (`str += x`)
- [ ] 🚨 Algoritmos recursivos sem memoização
