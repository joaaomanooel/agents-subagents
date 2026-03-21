---
description: Write Tests Using the AAA Pattern with Full Scenario Coverage
alwaysApply: true
---

# Rule: Write Tests Using the AAA Pattern with Full Scenario Coverage

## 🎯 Goal

When generating unit or integration tests, always follow the guidelines below.

## ✅ Use the AAA Pattern (Arrange-Act-Assert)

Structure each test into three clear sections:

1. **Arrange** – set up inputs, mocks, and context
2. **Act** – execute the function or behavior under test
3. **Assert** – verify the expected outcome with assertions

## 🔄 Scenario Coverage

Cover at least the following types of scenarios in test suites:

- **Optimistic case** – valid input, expected successful result 
- **Neutral case** – edge or default input, no major effect expected 
- **Pessimistic case** – invalid input or expected failure behavior 

Group related scenarios using `describe()` blocks with descriptive names.

## ✍️ Best Practices

- Tests should be small, focused, and isolated
- Use clear, intention-revealing test names
- Prefer pure functions or mocked dependencies
- Avoid testing with real external services (e.g., databases, APIs)

## 💡 Example (Jest)

```ts
describe('validateCPF', () => {
 it('should return true for a valid CPF', () => {
 // Arrange
 const cpf = '529.982.247-25';

 // Act
 const result = validateCPF(cpf);

 // Assert
 expect(result).toBe(true);
 });
});
```
