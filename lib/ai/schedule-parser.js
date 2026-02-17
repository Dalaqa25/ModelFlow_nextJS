import cronParser from 'cron-parser';
const { CronExpressionParser } = cronParser;

/**
 * Parse a natural language time expression into a schedule object
 * @param {string} expression - Natural language time expression
 * @returns {Object} Parsed schedule information
 * @throws {Error} If expression cannot be parsed
 */
export function parseTimeExpression(expression) {
  if (!expression || typeof expression !== 'string') {
    throw new Error(
      'Invalid expression. Please provide a time expression like: ' +
      "'every 6 hours', 'in 5 hours', 'daily at 3pm'"
    );
  }

  const normalized = expression.toLowerCase().trim();

  // Try recurring patterns first
  const recurringMatch = matchRecurringPattern(normalized);
  if (recurringMatch) {
    // Validate cron expression
    try {
      // Use standard cron format (5 fields) with UTC timezone
      const interval = CronExpressionParser.parse(recurringMatch.cron, {
        currentDate: new Date(),
        utc: false
      });
      const nextRun = interval.next().toDate();
      
      return {
        type: 'recurring',
        cron: recurringMatch.cron,
        humanReadable: recurringMatch.description,
        nextRun
      };
    } catch (error) {
      throw new Error(
        `Invalid cron expression generated: ${recurringMatch.cron}. ` +
        'Please try a different time expression.'
      );
    }
  }

  // Try one-time patterns
  const oneTimeMatch = matchOneTimePattern(normalized);
  if (oneTimeMatch) {
    // Validate delay bounds
    const MAX_DELAY = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    
    if (oneTimeMatch.delay < 0) {
      throw new Error(
        'Delay must be a positive number. Examples: ' +
        "'in 5 hours', 'after 30 minutes', 'in 2 days'"
      );
    }
    
    if (oneTimeMatch.delay > MAX_DELAY) {
      throw new Error(
        `Delay cannot exceed 30 days (${MAX_DELAY}ms). ` +
        'Please use a shorter delay or set up a recurring schedule.'
      );
    }
    
    return {
      type: 'one_time',
      delay: oneTimeMatch.delay,
      humanReadable: oneTimeMatch.description,
      nextRun: new Date(Date.now() + oneTimeMatch.delay)
    };
  }

  // No match found
  throw new Error(
    'Could not understand time expression. Examples: ' +
    "'every 6 hours', 'in 5 hours', 'daily at 3pm', 'every monday at 9am'"
  );
}

/**
 * Match recurring time patterns and generate cron expressions
 * @param {string} normalized - Normalized expression
 * @returns {Object|null} Match result with cron and description
 */
function matchRecurringPattern(normalized) {
  // Pattern: "every X minutes" (X must be 1-59)
  let match = normalized.match(/every\s+(\d+)\s+minutes?/);
  if (match) {
    const minutes = parseInt(match[1], 10);
    if (minutes >= 1 && minutes <= 59) {
      return {
        cron: `*/${minutes} * * * *`,
        description: `Every ${minutes} minute${minutes > 1 ? 's' : ''}`
      };
    }
  }

  // Pattern: "every X hours" (X must be 1-23)
  match = normalized.match(/every\s+(\d+)\s+hours?/);
  if (match) {
    const hours = parseInt(match[1], 10);
    if (hours >= 1 && hours <= 23) {
      return {
        cron: `0 */${hours} * * *`,
        description: `Every ${hours} hour${hours > 1 ? 's' : ''}`
      };
    }
  }

  // Pattern: "every X days" (X must be 1-30)
  match = normalized.match(/every\s+(\d+)\s+days?/);
  if (match) {
    const days = parseInt(match[1], 10);
    if (days >= 1 && days <= 30) {
      return {
        cron: `0 0 */${days} * *`,
        description: `Every ${days} day${days > 1 ? 's' : ''}`
      };
    }
  }

  // Pattern: "daily at HH:MM" or "daily at HHam/pm"
  match = normalized.match(/daily\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (match) {
    let hour = parseInt(match[1], 10);
    const minute = match[2] ? parseInt(match[2], 10) : 0;
    const meridiem = match[3];

    // Convert 12-hour to 24-hour format
    if (meridiem) {
      if (meridiem === 'pm' && hour !== 12) {
        hour += 12;
      } else if (meridiem === 'am' && hour === 12) {
        hour = 0;
      }
    }

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      const timeStr = meridiem 
        ? `${match[1]}${match[2] ? ':' + match[2] : ''}${meridiem}`
        : `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      return {
        cron: `${minute} ${hour} * * *`,
        description: `Daily at ${timeStr}`
      };
    }
  }

  // Pattern: "every WEEKDAY at HH:MM" or "every WEEKDAY at HHam/pm"
  const weekdays = {
    sunday: 0, sun: 0,
    monday: 1, mon: 1,
    tuesday: 2, tue: 2, tues: 2,
    wednesday: 3, wed: 3,
    thursday: 4, thu: 4, thur: 4, thurs: 4,
    friday: 5, fri: 5,
    saturday: 6, sat: 6
  };

  match = normalized.match(/every\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (match) {
    const weekday = weekdays[match[1]];
    let hour = parseInt(match[2], 10);
    const minute = match[3] ? parseInt(match[3], 10) : 0;
    const meridiem = match[4];

    // Convert 12-hour to 24-hour format
    if (meridiem) {
      if (meridiem === 'pm' && hour !== 12) {
        hour += 12;
      } else if (meridiem === 'am' && hour === 12) {
        hour = 0;
      }
    }

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      const weekdayName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
      const timeStr = meridiem 
        ? `${match[2]}${match[3] ? ':' + match[3] : ''}${meridiem}`
        : `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      return {
        cron: `${minute} ${hour} * * ${weekday}`,
        description: `Every ${weekdayName} at ${timeStr}`
      };
    }
  }

  return null;
}

/**
 * Match one-time delay patterns and calculate milliseconds
 * @param {string} normalized - Normalized expression
 * @returns {Object|null} Match result with delay and description
 */
function matchOneTimePattern(normalized) {
  // Pattern: "in X minutes" or "after X minutes"
  let match = normalized.match(/(?:in|after)\s+(\d+)\s+minutes?/);
  if (match) {
    const minutes = parseInt(match[1], 10);
    const delay = minutes * 60 * 1000;
    return {
      delay,
      description: `In ${minutes} minute${minutes > 1 ? 's' : ''}`
    };
  }

  // Pattern: "in X hours" or "after X hours"
  match = normalized.match(/(?:in|after)\s+(\d+)\s+hours?/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const delay = hours * 60 * 60 * 1000;
    return {
      delay,
      description: `In ${hours} hour${hours > 1 ? 's' : ''}`
    };
  }

  // Pattern: "in X days" or "after X days"
  match = normalized.match(/(?:in|after)\s+(\d+)\s+days?/);
  if (match) {
    const days = parseInt(match[1], 10);
    const delay = days * 24 * 60 * 60 * 1000;
    return {
      delay,
      description: `In ${days} day${days > 1 ? 's' : ''}`
    };
  }

  return null;
}
