---
description: TypeORM migrations must use timestamp prefix from Date.now()
alwaysApply: true
---

# TypeORM Migrations Naming Convention

Como migrations do TypeORM devem usar timestamps em milissegundos como prefixo/sufixo, gerado por `Date.now()`.

## Formato Correto

O timestamp deve ser equivalente ao resultado de:

```bash
node -e "console.log(Date.now())"
```

## Exemplos

### ✅ BOM - Timestamp correto (milissegundos)

```typescript
// 1738174800000-CreateUsersTable.ts
// 1738174800123-AddEmailToUsers.ts
// 1738175000456-CreateOrdersTable.ts
```

### ❌ MAU - Timestamp incorreto

```typescript
// 20240129120000-CreateUsersTable.ts // Formato de data legível
// 1738174800-CreateUsersTable.ts // Timestamp em segundos
// 2024-01-29-CreateUsersTable.ts // Formato de data
```

## Geração de Migrations

### Criar migration via CLI do TypeORM

```bash
npm run typeorm migration:create -- -n NomeDaMigration
```

O TypeORM automaticamente gera o timestamp correto usando `Date.now()`.

### Criar manualmente (se necessário)

```bash
# Gerar timestamp
TIMESTAMP=$(node -e "console.log(Date.now())")

# Criar arquivo
touch database/migrations/${TIMESTAMP}-NomeDaMigration.ts
```

## Estrutura do Arquivo

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1738174800000 implements MigrationInterface {
 name = 'CreateUsersTable1738174800000';

 async up(queryRunner: QueryRunner): Promise<void> {
 // Lógica de migração
 }

 async down(queryRunner: QueryRunner): Promise<void> {
 // Lógica de reversão
 }
}
```

## Por que Timestamp em Milissegundos?

1. **Ordenação Cronológica**: Garante que migrations sejam executadas na ordem correta
2. **Unicidade**: Evita conflitos de nomenclatura entre diferentes desenvolvedores
3. **Compatibilidade**: Padrão oficial do TypeORM
4. **Precisão**: Milissegundos permitem múltiplas migrations no mesmo segundo

## Verificação

Para verificar se uma migration tem o timestamp correto:

```bash
# O timestamp deve ter 13 dígitos
# Exemplo: 1738174800000 (13 dígitos)
```

## Localização Comum das Migrations

```
database/migrations/
src/migrations/
src/database/migrations/
```
