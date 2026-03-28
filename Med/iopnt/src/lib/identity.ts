export const ADJECTIVES = [
  "Silent", "Hidden", "Shadow", "Neon", "Cyber", "Digital", "Ghost", "Zero", 
  "Flux", "Ion", "Echo", "Solar", "Lunar", "Void", "Hollow", "Rapid",
  "Misty", "Static", "Glitched", "Encrypted"
];

export const NOUNS = [
  "Fox", "Signal", "Node", "Protocol", "User", "Drifter", "Observer", "Echo",
  "System", "Glitch", "Byte", "Pixel", "Wave", "Link", "Proxy", "Daemon",
  "Specter", "Walker", "Runner", "Cipher"
];

export function generateRandomName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
