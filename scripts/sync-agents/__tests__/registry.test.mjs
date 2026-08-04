import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listPlatforms, registerPlatform, getPlatform, clearRegistry, ensurePlatformsInitialized } from '../lib/platform/registry.mjs';
import { Platform } from '../lib/platform/platform.mjs';

class FakePlatform extends Platform {
  get name() { return 'fake-test'; }
  get outputDir() { return '.fake-test/agents'; }
  emit() { return '---\nname: fake\n---\nbody'; }
  init() { this.initialized = true; }
}

test('registry starts empty after clear', () => {
  clearRegistry();
  assert.equal(listPlatforms().length, 0);
});

test('registerPlatform adds a new platform', () => {
  clearRegistry();
  const p = new FakePlatform();
  registerPlatform(p);
  assert.equal(listPlatforms().length, 1);
  assert.equal(listPlatforms()[0], p);
});

test('getPlatform returns by name', () => {
  clearRegistry();
  const p = new FakePlatform();
  registerPlatform(p);
  assert.equal(getPlatform('fake-test'), p);
  assert.equal(getPlatform('nonexistent'), undefined);
});

test('registerPlatform rejects duplicates', () => {
  clearRegistry();
  registerPlatform(new FakePlatform());
  assert.throws(() => registerPlatform(new FakePlatform()));
});

test('registerPlatform rejects platforms without name', () => {
  clearRegistry();
  assert.throws(() => registerPlatform(null));
  assert.throws(() => registerPlatform({}));
  assert.throws(() => registerPlatform({ name: 42 }));
});

test('ensurePlatformsInitialized calls init() on each', () => {
  clearRegistry();
  const p = new FakePlatform();
  registerPlatform(p);
  p.initialized = false;
  ensurePlatformsInitialized();
  assert.equal(p.initialized, true);
});
