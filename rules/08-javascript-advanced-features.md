---
description: Advanced JavaScript features - generators, streams, lazy evaluation, parallel processing
alwaysApply: true
---

# JavaScript Avançado - Features para Especialistas

Identifique oportunidades para usar generator functions, streams, processamento sob demanda, processamento paralelo e estruturas de dados avançadas.

**Princípio**: Use as ferramentas certas para os problemas certos. Features avançadas devem trazer benefícios reais.

---

## 1. Generator Functions - Processamento Lazy

### ❌ Carrega tudo na memória

```typescript
function getUsers(): User[] {
 const users: User[] = [];
 
 for (let i = 0; i < 1000000; i++) {
 users.push({ id: i, name: `User ${i}` });
 }
 
 return users;
}

const users = getUsers();
const firstTen = users.slice(0, 10);
```

### ✅ Generator - Processamento sob demanda

```typescript
function* generateUsers(): Generator<User> {
 for (let i = 0; i < 1000000; i++) {
 yield { id: i, name: `User ${i}` };
 }
}

function* take<T>(iterable: Iterable<T>, n: number): Generator<T> {
 let count = 0;
 for (const item of iterable) {
 if (count >= n) return;
 yield item;
 count++;
 }
}

const users = take(generateUsers(), 10);
const firstTen = Array.from(users);
```

**Benefício**: Não carrega 1M registros na memória para usar apenas 10.

---

## 2. Async Generators - Streams de Dados

### ❌ Aguarda tudo antes de processar

```typescript
async function processLargeFile(filePath: string): Promise<void> {
 const content = await fs.readFile(filePath, 'utf-8');
 const lines = content.split('\n');
 
 for (const line of lines) {
 await processLine(line);
 }
}
```

### ✅ Async Generator - Stream processing

```typescript
async function* readLines(filePath: string): AsyncGenerator<string> {
 const stream = fs.createReadStream(filePath, { encoding: 'utf-8' });
 let buffer = '';
 
 for await (const chunk of stream) {
 buffer += chunk;
 const lines = buffer.split('\n');
 buffer = lines.pop() || '';
 
 for (const line of lines) {
 yield line;
 }
 }
 
 if (buffer) yield buffer;
}

async function processLargeFile(filePath: string): Promise<void> {
 for await (const line of readLines(filePath)) {
 await processLine(line);
 }
}
```

**Benefício**: Processa arquivos gigantes sem carregar tudo na memória.

---

## 3. Pipeline com Generators

### ❌ Múltiplas iterações e arrays intermediários

```typescript
function processData(data: number[]): number[] {
 const filtered = data.filter(x => x > 0);
 const doubled = filtered.map(x => x * 2);
 const limited = doubled.slice(0, 100);
 return limited;
}
```

### ✅ Generator Pipeline - Zero arrays intermediários

```typescript
function* filter<T>(
 iterable: Iterable<T>,
 predicate: (item: T) => boolean
): Generator<T> {
 for (const item of iterable) {
 if (predicate(item)) yield item;
 }
}

function* map<T, U>(
 iterable: Iterable<T>,
 mapper: (item: T) => U
): Generator<U> {
 for (const item of iterable) {
 yield mapper(item);
 }
}

function* take<T>(iterable: Iterable<T>, n: number): Generator<T> {
 let count = 0;
 for (const item of iterable) {
 if (count >= n) return;
 yield item;
 count++;
 }
}

function processData(data: Iterable<number>): number[] {
 return Array.from(
 take(
 map(
 filter(data, x => x > 0),
 x => x * 2
 ),
 100
 )
 );
}
```

**Benefício**: Lazy evaluation - para assim que encontrar 100 itens.

---

## 4. Processamento Paralelo

### ❌ Sequencial

```typescript
async function processUsers(users: User[]): Promise<Result[]> {
 const results: Result[] = [];
 
 for (const user of users) {
 const result = await processUser(user);
 results.push(result);
 }
 
 return results;
}
```

### ✅ Promise.all - Paralelo

```typescript
async function processUsers(users: User[]): Promise<Result[]> {
 return Promise.all(users.map(user => processUser(user)));
}
```

### ✅ Controle de concorrência

```typescript
async function* batchProcess<T, R>(
 items: T[],
 processor: (item: T) => Promise<R>,
 batchSize: number
): AsyncGenerator<R> {
 for (let i = 0; i < items.length; i += batchSize) {
 const batch = items.slice(i, i + batchSize);
 const results = await Promise.all(batch.map(processor));
 
 for (const result of results) {
 yield result;
 }
 }
}

async function processUsers(users: User[]): Promise<Result[]> {
 const results: Result[] = [];
 
 for await (const result of batchProcess(users, processUser, 10)) {
 results.push(result);
 }
 
 return results;
}
```

**Benefício**: Processa 10 por vez, evita sobrecarregar recursos.

---

## 5. Map e Set - Estruturas Avançadas

### ❌ Objeto como mapa

```typescript
const cache: Record<string, any> = {};

function getCached(key: string): any {
 return cache[key];
}

function setCached(key: string, value: any): void {
 cache[key] = value;
}

const keys = Object.keys(cache);
const hasKey = key in cache;
```

### ✅ Map - Estrutura correta

```typescript
const cache = new Map<string, any>();

function getCached(key: string): any {
 return cache.get(key);
}

function setCached(key: string, value: any): void {
 cache.set(key, value);
}

const keys = Array.from(cache.keys());
const hasKey = cache.has(key);
cache.delete(key);
cache.clear();
```

**Vantagens do Map**:
- Qualquer tipo como key (não só strings)
- Mantém ordem de inserção
- `size` property
- Métodos dedicados
- Melhor performance para adicionar/remover

### ✅ WeakMap - Garbage collection friendly

```typescript
const userCache = new WeakMap<User, UserData>();

function cacheUserData(user: User, data: UserData): void {
 userCache.set(user, data);
}

function getUserData(user: User): UserData | undefined {
 return userCache.get(user);
}
```

**Benefício**: Objetos são coletados quando não há mais referências.

---

## 6. Set - Coleções Únicas

### ❌ Array com verificação manual

```typescript
const uniqueIds: string[] = [];

function addId(id: string): void {
 if (!uniqueIds.includes(id)) {
 uniqueIds.push(id);
 }
}

function hasId(id: string): boolean {
 return uniqueIds.includes(id);
}
```

### ✅ Set - O(1) operations

```typescript
const uniqueIds = new Set<string>();

function addId(id: string): void {
 uniqueIds.add(id);
}

function hasId(id: string): boolean {
 return uniqueIds.has(id);
}

const idsArray = Array.from(uniqueIds);

const intersection = new Set([...setA].filter(x => setB.has(x)));
const union = new Set([...setA, ...setB]);
const difference = new Set([...setA].filter(x => !setB.has(x)));
```

---

## 7. Iterators Customizados

### ✅ Iterator protocol

```typescript
class Range {
 constructor(
 private start: number,
 private end: number,
 private step: number = 1
 ) {}

 *[Symbol.iterator](): Generator<number> {
 for (let i = this.start; i < this.end; i += this.step) {
 yield i;
 }
 }
}

for (const num of new Range(0, 10, 2)) {
 console.log(num);
}

const numbers = [...new Range(1, 6)];
```

### ✅ Async iterator

```typescript
class DataStream {
 constructor(private endpoint: string) {}

 async *[Symbol.asyncIterator](): AsyncGenerator<Data> {
 let page = 1;
 let hasMore = true;
 
 while (hasMore) {
 const response = await fetch(`${this.endpoint}?page=${page}`);
 const data = await response.json();
 
 for (const item of data.items) {
 yield item;
 }
 
 hasMore = data.hasMore;
 page++;
 }
 }
}

for await (const item of new DataStream('/api/data')) {
 console.log(item);
}
```

---

## 8. Composição com Generators

### ✅ Biblioteca de utilidades

```typescript
function* chain<T>(...iterables: Iterable<T>[]): Generator<T> {
 for (const iterable of iterables) {
 yield* iterable;
 }
}

function* zip<T, U>(
 iter1: Iterable<T>,
 iter2: Iterable<U>
): Generator<[T, U]> {
 const it1 = iter1[Symbol.iterator]();
 const it2 = iter2[Symbol.iterator]();
 
 while (true) {
 const { value: v1, done: d1 } = it1.next();
 const { value: v2, done: d2 } = it2.next();
 
 if (d1 || d2) return;
 
 yield [v1, v2];
 }
}

function* enumerate<T>(iterable: Iterable<T>): Generator<[number, T]> {
 let index = 0;
 for (const item of iterable) {
 yield [index++, item];
 }
}

function* flat<T>(iterable: Iterable<T | Iterable<T>>): Generator<T> {
 for (const item of iterable) {
 if (typeof item[Symbol.iterator] === 'function') {
 yield* item as Iterable<T>;
 } else {
 yield item as T;
 }
 }
}

const combined = chain([1, 2], [3, 4], [5, 6]);
const zipped = zip(['a', 'b', 'c'], [1, 2, 3]);
const indexed = enumerate(['x', 'y', 'z']);
const flattened = flat([1, [2, 3], 4, [5, [6]]]);
```

---

## 9. Memoização com Map

### ❌ Cache simples

```typescript
const cache: Record<string, number> = {};

function fibonacci(n: number): number {
 const key = String(n);
 
 if (key in cache) return cache[key];
 
 if (n <= 1) return n;
 
 const result = fibonacci(n - 1) + fibonacci(n - 2);
 cache[key] = result;
 
 return result;
}
```

### ✅ Memoização genérica com Map

```typescript
function memoize<T extends (...args: any[]) => any>(fn: T): T {
 const cache = new Map<string, ReturnType<T>>();
 
 return ((...args: Parameters<T>) => {
 const key = JSON.stringify(args);
 
 if (cache.has(key)) return cache.get(key)!;
 
 const result = fn(...args);
 cache.set(key, result);
 
 return result;
 }) as T;
}

const fibonacci = memoize((n: number): number => {
 if (n <= 1) return n;
 return fibonacci(n - 1) + fibonacci(n - 2);
});

const expensiveOperation = memoize((a: number, b: string) => {
 return complexCalculation(a, b);
});
```

---

## 10. Promise.allSettled, race, any

### ✅ Promise.allSettled - Aguarda todas mesmo com falhas

```typescript
async function fetchAllData(urls: string[]): Promise<Results> {
 const promises = urls.map(url => fetch(url));
 const results = await Promise.allSettled(promises);
 
 const successful = results
 .filter(r => r.status === 'fulfilled')
 .map(r => (r as PromiseFulfilledResult<Response>).value);
 
 const failed = results
 .filter(r => r.status === 'rejected')
 .map(r => (r as PromiseRejectedResult).reason);
 
 return { successful, failed };
}
```

### ✅ Promise.race - Primeiro a resolver

```typescript
async function fetchWithTimeout<T>(
 promise: Promise<T>,
 timeoutMs: number
): Promise<T> {
 const timeout = new Promise<never>((_, reject) =>
 setTimeout(() => reject(new Error('Timeout')), timeoutMs)
 );
 
 return Promise.race([promise, timeout]);
}

const data = await fetchWithTimeout(
 fetch('/api/data'),
 5000
);
```

### ✅ Promise.any - Primeiro sucesso

```typescript
async function fetchFromMultipleSources(urls: string[]): Promise<Response> {
 const promises = urls.map(url => fetch(url));
 return Promise.any(promises);
}
```

---

## 11. Proxy - Metaprogramação

### ✅ Validação automática

```typescript
function createValidatedObject<T extends object>(
 obj: T,
 validator: (key: keyof T, value: any) => boolean
): T {
 return new Proxy(obj, {
 set(target, prop, value) {
 if (!validator(prop as keyof T, value)) {
 throw new Error(`Invalid value for ${String(prop)}`);
 }
 
 target[prop as keyof T] = value;
 return true;
 }
 });
}

const user = createValidatedObject(
 { name: '', age: 0 },
 (key, value) => {
 if (key === 'age') return typeof value === 'number' && value >= 0;
 if (key === 'name') return typeof value === 'string' && value.length > 0;
 return true;
 }
);
```

### ✅ Lazy loading de propriedades

```typescript
function createLazyObject<T extends Record<string, () => any>>(
 factories: T
): { [K in keyof T]: ReturnType<T[K]> } {
 const cache = new Map<keyof T, any>();
 
 return new Proxy({} as any, {
 get(_, prop: keyof T) {
 if (cache.has(prop)) return cache.get(prop);
 
 if (!(prop in factories)) return undefined;
 
 const value = factories[prop]();
 cache.set(prop, value);
 
 return value;
 }
 });
}

const config = createLazyObject({
 database: () => connectToDatabase(),
 cache: () => createRedisClient(),
 logger: () => createLogger()
});
```

---

## Quando Usar Features Avançadas

### ✅ Use quando:
- Processamento de grandes volumes de dados
- Necessidade de lazy evaluation
- Streaming de dados
- Controle fino de concorrência
- Coleções com requisitos específicos (unicidade, weak references)
- Validação ou transformação automática de objetos
- Performance crítica com memoização

### ⚠️ Evite quando:
- Solução simples resolve o problema
- Time não está familiarizado com a feature
- Adiciona complexidade sem benefício claro
- Dados pequenos onde benefício é negligível
- Debugging seria muito mais difícil

---

## Checklist

- [ ] Posso usar generator para evitar carregar tudo na memória?
- [ ] Stream processing seria mais eficiente?
- [ ] Processamento paralelo traria benefício real?
- [ ] Map/Set são mais apropriados que Object/Array?
- [ ] WeakMap/WeakSet resolveriam problema de memória?
- [ ] Iterator customizado tornaria o código mais expressivo?
- [ ] Proxy simplificaria validação ou transformação?
- [ ] Memoização eliminaria cálculos repetidos?
- [ ] Promise.allSettled/race/any são mais adequados que Promise.all?
- [ ] A complexidade adicional se justifica?
