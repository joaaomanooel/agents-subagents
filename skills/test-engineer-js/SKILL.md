---
name: test-engineer-js
description: JavaScript and TypeScript testing specialist focused on creating and executing trustworthy tests that prove behavior, avoid false positives, reject empty assertions, and stay resilient to refactors. Inspired by goldbergyoni/javascript-testing-best-practices. Use when writing new tests, fixing flaky tests, reviewing weak test suites, or validating whether tests actually protect against regressions.
license: CC-BY-4.0
metadata:
  author: viniciusPalmer
  version: 1.0.0
  source: https://github.com/goldbergyoni/javascript-testing-best-practices
---

# Reliable Test Engineer

Write tests that fail only for meaningful regressions.

This skill is for creating, executing, and reviewing JavaScript or TypeScript tests with one strict goal: avoid green tests that prove nothing.

## Use When

- Adding unit, component, integration, or E2E tests
- Fixing flaky or brittle tests
- Reviewing whether an existing test suite has false positives
- Replacing implementation-coupled tests with behavioral tests
- Hardening tests around bugs, error handling, or edge cases
- Choosing between unit, component, and broader behavioral tests

## Primary Goal

Every test must prove a requirement-level behavior through an observable outcome.

If a test can stay green after the real behavior is broken, the test is low value and should be rewritten or rejected.

## Core Rules

1. Test public behavior, not internals.
Assert exported behavior, rendered UI, API responses, state transitions, or visible side effects. Do not call private helpers just to increase coverage.

2. Every test needs a real assertion.
Reject weak checks like `toBeDefined()`, `toBeTruthy()`, or "mock was called" unless they directly prove the requirement.

3. Prefer black-box tests.
If a harmless refactor breaks the test, the test is probably asserting the wrong thing.

4. Use Arrange, Act, Assert.
Keep setup, action, and expectation clearly separated so the test intent is obvious.

5. Name tests in three parts.
Include: what is being tested, under which scenario, and what outcome is expected.

6. Prefer realistic data.
Avoid fake comfort from `foo`, `bar`, or toy objects. Use production-shaped values, malformed inputs, and domain-realistic edge cases.

7. Prefer stubs and spies over mocks.
Mocking internal collaboration is usually a smell. Stub external boundaries to drive scenarios. Spy only on side effects that matter to the requirement.

8. Reject oversized snapshots.
Prefer direct assertions. If snapshotting is justified, use short and focused inline snapshots only.

9. Assert specific errors.
Use `toThrow` or rejected promise assertions and check the error type, code, or meaningful message.

10. Keep tests independent.
Each test should create or declare its own meaningful setup. Avoid hidden global seed data and shared mutable fixtures.

11. Avoid sleeping.
Use deterministic waiting tools such as `waitFor`, fake timers, or explicit async completion points. Fixed delays hide race conditions and create flakes.

12. Execute the test before declaring success.
The work is not done when the test is written. Run the narrowest relevant test first, then adjacent affected tests if needed.

## Red Flags To Reject

Reject or rewrite tests with these patterns:

- Calling internal or private methods directly
- Asserting only that a mock was called
- No assertion, or only existence/truthiness assertions
- Large external snapshots of full trees or payloads
- Global seed data that explains the result off-screen
- Assertion logic that reimplements the production code
- Tests coupled to call order, helper names, or intermediate structures
- `try/catch` tests that only end with `expect(error).not.toBeNull()`
- Committed `.only` or `.skip` cases unless explicitly required

## Test Value Check

Before accepting a green test, ask all of these:

1. If I break the real behavior, will this test fail?
2. If I rename internals or refactor implementation without changing behavior, will this test stay green?
3. Does the failure message tell a product story, not just a low-level detail?
4. Is the assertion specific enough to distinguish the correct outcome from a nearby wrong one?

If any answer is "no", the test is not strong enough yet.

## Execution Workflow

1. Start from the requirement or bug.
Identify the public entry point and the observable outcome first.

2. Choose the smallest valuable test type.
- Pure business logic: unit test
- UI behavior with real rendering: component test
- Multi-layer flow inside the same app: integration or component-style test
- Cross-system contract or end-user flow: contract or E2E test

3. Build the smallest realistic scenario.
Create local fixtures or factories with inline overrides that make the important condition obvious inside the test body.

4. Write one clear AAA test.
Use requirement-level naming and declarative matchers.

5. Run the narrowest relevant test immediately.
Confirm the test fails for the intended reason before trusting it.

6. Make the behavior pass.
Do not stop at green if the assertion is weak.

7. Harden the test.
Add realistic invalid inputs, error cases, side-effect checks, or edge combinations when the logic is sensitive.

8. Re-run adjacent affected tests.
Finish only after confirming the change is stable and isolated.

## Frontend Guidance

For React and DOM tests:

- Prefer fully rendered behavior over shallow rendering
- Interact through the UI as a user would whenever practical
- Assert visible output, accessible roles, text, state changes, and requirement-level side effects
- Stub network or external services instead of hitting unstable environments
- Use `waitFor` or async queries instead of arbitrary delays
- Avoid snapshots of whole screens or large trees

## API And Service Guidance

- Test what the module or service exposes publicly
- Stub external HTTP, queues, or third-party systems at the boundary
- Prefer broader component-style tests over excessive internal mocking
- Cover happy path, validation failures, timeout behavior, and key edge cases
- Verify observable effects such as persisted state, returned payloads, emitted events, or user-facing errors

## Hardening Strategies

Use these when the logic is important or historically fragile:

- Parameterized tests for known edge combinations
- Property-based testing for input-sensitive logic
- Realistic randomized data to expose hidden assumptions
- Mutation testing with tools like Stryker when available
- Manual mutation spot-checks when mutation tooling is not available

Manual mutation spot-check means intentionally changing a key comparison, branch, or returned value and confirming the new test fails. Revert the change immediately after the check.

## Quality Gates

Do not consider the task complete if any of these are true:

- The new test was never executed
- The test passes even after a meaningful manual mutation
- The test only validates implementation details
- The test relies on brittle snapshot output
- The test hides its important setup outside the test body
- The test is flaky because of timing, shared state, or uncontrolled network calls

## Repo Notes For This Project

Current project defaults:

- Test runner: Jest
- UI testing: React Testing Library
- Preferred focused run: `yarn test --testPathPattern=<file-or-feature>`
- Watch mode: `yarn test --watch`

Prefer focused test execution while iterating, then expand only as needed.

## Output Expectations

When using this skill, the agent should finish with:

1. What behavior is now covered
2. Which tests were executed
3. Why the assertions are trustworthy
4. Any residual risk or test gap that still exists
