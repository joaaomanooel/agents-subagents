/**
 * Pattern-based secret detection.
 * Pure regex; safe to run on any text. Each pattern is a single regex.
 */

const SECRET_PATTERNS = [
  { name: 'aws-access-key', regex: /AKIA[0-9A-Z]{16}/g },
  { name: 'aws-secret-key', regex: /aws_secret_access_key\s*=\s*['"][A-Za-z0-9/+=]{40}['"]/g },
  { name: 'github-token', regex: /gh[pousr]_[A-Za-z0-9]{32,}/g },
  { name: 'slack-token', regex: /xox[abprs]-[A-Za-z0-9-]{10,}/g },
  { name: 'private-key-block', regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/g },
  { name: 'generic-api-key', regex: /(?:api[_-]?key|apikey|secret[_-]?key)\s*[:=]\s*['"][A-Za-z0-9_\\-]{16,}['"]/gi },
  { name: 'bearer-token', regex: /Bearer\s+[A-Za-z0-9\\-_]{8,}\.[A-Za-z0-9\\-_]{8,}\.[A-Za-z0-9\\-_]{8,}/g },
];

/**
 * Scan a string for known secret patterns.
 * @param {string} source — text to scan
 * @param {string} file — path label for error messages
 * @returns {Array<{ pattern: string, file: string, line: number, snippet: string }>}
 */
export function scanForSecrets(source, file = '<inline>') {
  const findings = [];
  const lines = source.split(/\r?\n/);
  for (const { name, regex } of SECRET_PATTERNS) {
    regex.lastIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(regex);
      if (match) {
        findings.push({
          pattern: name,
          file,
          line: i + 1,
          snippet: redact(line.trim().slice(0, 80)),
        });
      }
    }
  }
  return findings;
}

function redact(s) {
  if (s.length <= 24) return s.slice(0, 4) + '***';
  return s.slice(0, 8) + '***' + s.slice(-4);
}
