// A visual AID for choosing a password - NOT a rule. The backend decides what
// is accepted; nothing here blocks or invents a requirement. Score 0-4:
//   0 very weak, 1 weak, 2 fair, 3 strong, 4 very strong
const LEVELS = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong']

const COMMON = ['password', 'passw0rd', '12345678', '123456789', 'qwerty', 'abc123', 'admin', 'letmein', 'iloveyou']

export function passwordStrength(password) {
  const value = String(password || '')

  if (!value) return { score: 0, level: LEVELS[0], percent: 0 }

  let points = 0

  if (value.length >= 8) points += 1
  if (value.length >= 12) points += 1
  if (value.length >= 16) points += 1

  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(re => re.test(value)).length
  if (classes >= 3) points += 1
  if (classes === 4) points += 1

  // penalties: a common word, or a single repeated character
  if (COMMON.some(word => value.toLowerCase().includes(word))) points -= 2
  if (/^(.)\1+$/.test(value)) points -= 3

  const score = Math.max(0, Math.min(4, Math.round(points * 4 / 5)))

  return { score, level: LEVELS[score], percent: (score + 1) * 20 }
}
