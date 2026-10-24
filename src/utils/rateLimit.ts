/**
 * Rate Limiting Utility for Contact Form Submissions
 * Prevents spam and abuse by enforcing a maximum of 3 submissions per hour per user.
 * Submissions are tracked with timestamp history in localStorage.
 */

export const CONTACT_RATE_LIMIT_KEY = 'imagetooltip_contact_rate_limit';
export const MAX_CONTACT_SUBMISSIONS_PER_HOUR = 5;
export const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour (3,600,000 ms)

export interface ContactRateLimitStatus {
  isRateLimited: boolean;
  submissionsCount: number;
  remainingSubmissions: number;
  maxSubmissions: number;
  minutesRemaining: number;
}

/**
 * Retrieves valid submission timestamps strictly within the 1-hour rolling window.
 * Automatically purges any expired timestamps from localStorage.
 */
export function getContactSubmissions(): number[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    const raw = localStorage.getItem(CONTACT_RATE_LIMIT_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const now = Date.now();
    // Keep only numeric timestamps that are within the past hour and not from the future
    const valid = parsed.filter(
      (ts): ts is number =>
        typeof ts === 'number' &&
        Number.isFinite(ts) &&
        ts <= now &&
        now - ts < RATE_LIMIT_WINDOW_MS
    );

    // Save cleaned list if expired items were pruned
    if (valid.length !== parsed.length) {
      localStorage.setItem(CONTACT_RATE_LIMIT_KEY, JSON.stringify(valid));
    }

    return valid;
  } catch {
    return [];
  }
}

/**
 * Calculates current rate limit status for contact form submissions.
 */
export function checkContactRateLimit(): ContactRateLimitStatus {
  const submissions = getContactSubmissions();
  const count = submissions.length;

  if (count >= MAX_CONTACT_SUBMISSIONS_PER_HOUR) {
    const oldest = Math.min(...submissions);
    const timeRemainingMs = oldest + RATE_LIMIT_WINDOW_MS - Date.now();
    const minutesRemaining = Math.max(1, Math.ceil(timeRemainingMs / 60000));

    return {
      isRateLimited: true,
      submissionsCount: count,
      remainingSubmissions: 0,
      maxSubmissions: MAX_CONTACT_SUBMISSIONS_PER_HOUR,
      minutesRemaining,
    };
  }

  return {
    isRateLimited: false,
    submissionsCount: count,
    remainingSubmissions: Math.max(0, MAX_CONTACT_SUBMISSIONS_PER_HOUR - count),
    maxSubmissions: MAX_CONTACT_SUBMISSIONS_PER_HOUR,
    minutesRemaining: 0,
  };
}

/**
 * Records a new submission timestamp in localStorage upon successful form submission.
 */
export function recordContactSubmission(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const submissions = getContactSubmissions();
    submissions.push(Date.now());
    localStorage.setItem(CONTACT_RATE_LIMIT_KEY, JSON.stringify(submissions));
  } catch {
    // Gracefully handle if localStorage is blocked or full
  }
}
