import { ok, err } from '../core/result.mjs';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

function stripBom(s) {
  return s.startsWith('\uFEFF') ? s.slice(1) : s;
}

function parseYamlScalar(line) {
  const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)$/);
  if (!match) return null;
  const key = match[1];
  let value = match[2].trim();
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  }
  if (value.startsWith("'") && value.endsWith("'")) {
    value = value.slice(1, -1);
  }
  return [key, value];
}

const BLOCK_SCALAR_INDICATORS = new Set(['>', '>-', '|', '|-', '|+']);

function isBlockScalarIndicator(value) {
  return BLOCK_SCALAR_INDICATORS.has(value);
}

function parseYamlBlock(raw) {
  const lines = raw.split('\n');
  const data = {};
  let currentArrayKey = null;
  let currentArray = null;
  let currentBlockKey = null;
  let currentBlockLines = null;
  let currentBlockType = null;

  const flushArray = () => {
    if (currentArrayKey) {
      data[currentArrayKey] = currentArray;
      currentArrayKey = null;
      currentArray = null;
    }
  };

  const flushBlock = () => {
    if (currentBlockKey) {
      if (currentBlockType.startsWith('>')) {
        data[currentBlockKey] = currentBlockLines.join(' ').trim();
      } else {
        data[currentBlockKey] = currentBlockLines.join('\n');
      }
      currentBlockKey = null;
      currentBlockLines = null;
      currentBlockType = null;
    }
  };

  const flush = () => { flushArray(); flushBlock(); };

  for (const line of lines) {
    if (line.trim() === '') continue;

    const isIndented = line.startsWith(' ') || line.startsWith('\t');

    if (currentBlockKey) {
      if (isIndented) {
        currentBlockLines.push(line.trim());
        continue;
      }
      flushBlock();
    }

    if (currentArrayKey && isIndented) {
      const item = line.trim().replace(/^-\s*/, '');
      if (item) currentArray.push(item);
      continue;
    }

    flush();

    const scalar = parseYamlScalar(line);
    if (!scalar) continue;
    const [key, value] = scalar;

    if (isBlockScalarIndicator(value)) {
      currentBlockKey = key;
      currentBlockLines = [];
      currentBlockType = value;
      continue;
    }

    if (value === '') {
      currentArrayKey = key;
      currentArray = [];
      continue;
    }

    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim();
      data[key] = inner === '' ? [] : inner.split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''));
      continue;
    }

    if (key === 'description' && value.startsWith('"') && !value.endsWith('"')) {
      currentBlockKey = key;
      currentBlockLines = [value.slice(1)];
      currentBlockType = '"';
      continue;
    }

    data[key] = value;
  }

  flush();
  return data;
}

export function parseFrontmatter(raw) {
  if (typeof raw !== 'string') return err(new Error('raw must be a string'));
  const cleaned = stripBom(raw);
  const match = cleaned.match(FRONTMATTER_RE);
  if (!match) return err(new Error('frontmatter not found or unclosed'));
  const [, rawFrontmatter, body] = match;
  if (rawFrontmatter.trim() === '') {
    return err(new Error('frontmatter is empty'));
  }
  const data = parseYamlBlock(rawFrontmatter);
  return ok({ data, body, raw: rawFrontmatter });
}
