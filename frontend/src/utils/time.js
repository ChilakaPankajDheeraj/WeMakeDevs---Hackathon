/**
 * Utility functions for Indian Standard Time (IST, UTC+5:30) formatting.
 * Ensures consistent IST timestamps across the AquaNex application.
 */

export function formatIST(dateInput, includeSeconds = false) {
  if (!dateInput) return 'Realtime Sync (IST)';
  
  // If string already contains IST, return as is
  if (typeof dateInput === 'string' && dateInput.includes('IST')) {
    return dateInput;
  }

  try {
    let input = dateInput;
    if (typeof input === 'string') {
      // Normalize 'YYYY-MM-DD HH:mm:ss UTC' to standard ISO UTC format
      if (input.endsWith(' UTC')) {
        input = input.replace(' UTC', 'Z').replace(' ', 'T');
      } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(input)) {
        // Raw ISO without timezone offset produced by legacy utcnow() -> treat as UTC
        input = input + 'Z';
      }
    }

    const d = new Date(input);
    if (isNaN(d.getTime())) {
      return `${dateInput} IST`;
    }

    const options = {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };

    if (includeSeconds) {
      options.second = '2-digit';
    }

    return `${new Intl.DateTimeFormat('en-IN', options).format(d)} IST`;
  } catch {
    return `${dateInput} IST`;
  }
}

export function formatISTTimeOnly(dateInput = new Date()) {
  try {
    const d = new Date(dateInput);
    return `${new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(d)} IST`;
  } catch {
    return 'Just now (IST)';
  }
}

