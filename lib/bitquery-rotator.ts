// Bitquery Token Rotation System
// Automatically switches between multiple tokens when quota is exhausted

class BitqueryTokenRotator {
  private tokens: string[] = [];
  private currentIndex: number = 0;
  private exhaustedTokens: Set<string> = new Set();
  private lastRotation: number = 0;

  constructor() {
    this.loadTokens();
  }

  private loadTokens() {
    // Load all configured Bitquery tokens from environment
    const tokens: string[] = [];

    // Primary token
    const primaryToken = process.env.NEXT_PUBLIC_BITQUERY_TOKEN;
    if (primaryToken) tokens.push(primaryToken);

    // Additional rotation tokens (BITQUERY_TOKEN_2, _3, _4, etc.)
    for (let i = 2; i <= 20; i++) {
      const token = process.env[`NEXT_PUBLIC_BITQUERY_TOKEN_${i}`];
      if (token) tokens.push(token);
    }

    this.tokens = tokens;
    console.log(`Loaded ${this.tokens.length} Bitquery tokens for rotation`);
  }

  /**
   * Get current active token
   */
  getCurrentToken(): string | null {
    if (this.tokens.length === 0) {
      console.error('No Bitquery tokens configured');
      return null;
    }

    // Find next non-exhausted token
    for (let i = 0; i < this.tokens.length; i++) {
      const index = (this.currentIndex + i) % this.tokens.length;
      const token = this.tokens[index];

      if (!this.exhaustedTokens.has(token)) {
        if (i > 0) {
          console.log(`Switched to token #${index + 1}`);
          this.currentIndex = index;
          this.lastRotation = Date.now();
        }
        return token;
      }
    }

    // All tokens exhausted - check if enough time passed to reset
    const hoursSinceRotation = (Date.now() - this.lastRotation) / (1000 * 60 * 60);
    if (hoursSinceRotation > 1) {
      console.log('Resetting all tokens (1 hour passed)');
      this.exhaustedTokens.clear();
      return this.tokens[0];
    }

    console.error('All Bitquery tokens exhausted. Wait 1 hour or add more tokens.');
    return null;
  }

  /**
   * Mark current token as exhausted (hit 402 quota limit)
   */
  markCurrentAsExhausted() {
    const current = this.tokens[this.currentIndex];
    if (current) {
      console.warn(`Token #${this.currentIndex + 1} exhausted, rotating...`);
      this.exhaustedTokens.add(current);
      
      // Move to next token
      this.currentIndex = (this.currentIndex + 1) % this.tokens.length;
    }
  }

  /**
   * Get rotation status
   */
  getStatus() {
    return {
      total: this.tokens.length,
      currentIndex: this.currentIndex + 1,
      exhausted: this.exhaustedTokens.size,
      available: this.tokens.length - this.exhaustedTokens.size,
    };
  }
}

// Singleton instance
let rotatorInstance: BitqueryTokenRotator | null = null;

export function getBitqueryRotator(): BitqueryTokenRotator {
  if (!rotatorInstance) {
    rotatorInstance = new BitqueryTokenRotator();
  }
  return rotatorInstance;
}

/**
 * Get current Bitquery token with automatic rotation
 */
export function getRotatingBitqueryToken(): string {
  const rotator = getBitqueryRotator();
  const token = rotator.getCurrentToken();
  
  if (!token) {
    throw new Error('No Bitquery tokens available');
  }
  
  return token;
}

/**
 * Handle 402 error by rotating to next token
 */
export function handleQuotaError() {
  const rotator = getBitqueryRotator();
  rotator.markCurrentAsExhausted();
  
  const status = rotator.getStatus();
  console.log(`Token status: ${status.available}/${status.total} available`);
  
  return rotator.getCurrentToken();
}

