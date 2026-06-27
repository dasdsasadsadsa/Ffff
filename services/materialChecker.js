/**
 * Material Safety Checker
 * Detects malicious instructions in pasted prompts/skills
 */

const DANGEROUS_PATTERNS = [
  // API key theft
  /send.*api.*key/i,
  /steal.*token/i,
  /exfiltrat.*secret/i,
  /extract.*credential/i,
  
  // External data sending
  /send.*to.*url/i,
  /post.*external/i,
  /fetch.*secret/i,
  /background.*request/i,
  
  // Malware/destruction
  /delete.*repo/i,
  /rm.*-rf/i,
  /destruct/i,
  /malware/i,
  /virus/i,
  
  // Phishing
  /phish/i,
  /fake.*login/i,
  /credential.*harvest/i,
  
  // Safety bypass
  /ignore.*safety/i,
  /bypass.*check/i,
  /disregard.*rule/i,
  /skip.*validation/i,
  
  // Obfuscation
  /obfuscat/i,
  /base64.*decode.*exec/i,
  /eval.*hidden/i,
  
  // Shell injection
  /\$\{.*\}/i,
  /`.*`/i,
  /exec.*shell/i,
  /spawn.*process/i,
];

const WARNING_PATTERNS = [
  /debug.*mode/i,
  /test.*endpoint/i,
  /mock.*data/i,
  /placeholder/i,
];

export function checkMaterial(text) {
  if (!text || text.trim().length === 0) {
    return { status: 'safe', reason: '' };
  }
  
  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(text)) {
      return {
        status: 'blocked',
        reason: '안전하지 않은 명령이 감지되었습니다.'
      };
    }
  }
  
  // Check for warning patterns
  for (const pattern of WARNING_PATTERNS) {
    if (pattern.test(text)) {
      return {
        status: 'warning',
        reason: '주의가 필요한 내용이 포함되어 있습니다.'
      };
    }
  }
  
  return { status: 'safe', reason: '' };
}

export function checkMaterials(prompt, skill) {
  const promptResult = checkMaterial(prompt);
  const skillResult = checkMaterial(skill);
  
  // If either is blocked, overall status is blocked
  if (promptResult.status === 'blocked' || skillResult.status === 'blocked') {
    return {
      status: 'blocked',
      reason: promptResult.reason || skillResult.reason
    };
  }
  
  // If either is warning, overall status is warning
  if (promptResult.status === 'warning' || skillResult.status === 'warning') {
    return {
      status: 'warning',
      reason: promptResult.reason || skillResult.reason
    };
  }
  
  return { status: 'safe', reason: '' };
}
