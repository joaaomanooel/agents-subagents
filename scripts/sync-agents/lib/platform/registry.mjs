const platforms = new Map();
const initializeCallbacks = [];

export function registerPlatform(platform) {
  if (!platform || typeof platform.name !== 'string') {
    throw new Error('registerPlatform: platform must have a string name');
  }
  if (platforms.has(platform.name)) {
    throw new Error(`registerPlatform: ${platform.name} is already registered`);
  }
  platforms.set(platform.name, platform);
  initializeCallbacks.push(() => {
    try { platform.init?.(); } catch (err) {
      console.error(`[registry] init failed for ${platform.name}:`, err.message);
    }
  });
  return platform;
}

export function getPlatform(name) {
  return platforms.get(name);
}

export function listPlatforms() {
  return [...platforms.values()];
}

export function ensurePlatformsInitialized() {
  for (const cb of initializeCallbacks) cb();
}

export function clearRegistry() {
  platforms.clear();
  initializeCallbacks.length = 0;
}
