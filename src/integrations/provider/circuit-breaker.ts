export class SimpleCircuitBreaker {
  private failureCount = 0;
  private openUntilMs = 0;

  constructor(
    private readonly failureThreshold = 5,
    private readonly cooldownMs = 60_000
  ) {}

  canExecute(nowMs = Date.now()): boolean {
    if (this.openUntilMs > nowMs) return false;
    return true;
  }

  recordSuccess(): void {
    this.failureCount = 0;
    this.openUntilMs = 0;
  }

  recordFailure(nowMs = Date.now(), retryAfterSec?: number): void {
    this.failureCount += 1;
    if (retryAfterSec && retryAfterSec > 0) {
      this.openUntilMs = Math.max(this.openUntilMs, nowMs + retryAfterSec * 1000);
    } else if (this.failureCount >= this.failureThreshold) {
      this.openUntilMs = nowMs + this.cooldownMs;
    }
  }
}
