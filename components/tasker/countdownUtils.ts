/**
 * Utility functions for countdown timer
 */

export interface CountdownResult {
  isExpired: boolean;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string; // "1h 30m" or "45m" or "30s"
  total: {
    ms: number;
    seconds: number;
    minutes: number;
  };
}

/**
 * Calculate countdown from expiresAt timestamp
 * @param expiresAt - ISO string or timestamp
 * @returns CountdownResult with formatted time
 */
export const calculateCountdown = (expiresAt: string | undefined): CountdownResult => {
  if (!expiresAt) {
    return {
      isExpired: true,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: "Hết hạn",
      total: { ms: 0, seconds: 0, minutes: 0 },
    };
  }

  const now = Date.now();
  const expiryTime = new Date(expiresAt).getTime();
  const diffMs = expiryTime - now;

  if (diffMs <= 0) {
    return {
      isExpired: true,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: "Hết hạn",
      total: { ms: 0, seconds: 0, minutes: 0 },
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let formatted = "";
  if (hours > 0) {
    formatted = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    formatted = `${minutes}m ${seconds}s`;
  } else {
    formatted = `${seconds}s`;
  }

  return {
    isExpired: false,
    hours,
    minutes,
    seconds,
    formatted,
    total: {
      ms: diffMs,
      seconds: totalSeconds,
      minutes: Math.floor(totalSeconds / 60),
    },
  };
};

/**
 * Format time for display (converts minutes to hours if > 60)
 * @param minutes - number of minutes
 * @returns formatted string like "1h 30m" or "45m"
 */
export const formatTimeRemaining = (minutes: number): string => {
  if (minutes <= 0) return "Hết hạn";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

/**
 * Get urgency level based on remaining time
 */
export const getUrgencyLevel = (remainingSeconds: number): "danger" | "warning" | "normal" => {
  if (remainingSeconds <= 60) return "danger"; // red
  if (remainingSeconds <= 300) return "warning"; // yellow/orange
  return "normal"; // normal
};
