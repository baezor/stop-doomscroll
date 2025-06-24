chrome.runtime.onInstalled.addListener(() => {
  console.log('Stop Doomscroll extension installed');
});

// Clean up expired sessions periodically
chrome.alarms.create('cleanupSessions', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanupSessions') {
    cleanupExpiredSessions();
  }
});

async function cleanupExpiredSessions() {
  const storage = await chrome.storage.local.get();
  const keysToRemove: string[] = [];
  
  Object.entries(storage).forEach(([key, value]) => {
    if (key.startsWith('session_') && value && typeof value === 'object') {
      const session = value as any;
      // Remove sessions older than 24 hours
      if (Date.now() - session.startTime > 24 * 60 * 60 * 1000) {
        keysToRemove.push(key);
      }
    }
  });
  
  if (keysToRemove.length > 0) {
    await chrome.storage.local.remove(keysToRemove);
    console.log(`Cleaned up ${keysToRemove.length} expired sessions`);
  }
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'evaluateReason') {
    // In a real implementation, this would make an API call to an LLM service
    // For now, we'll use the same heuristic as in the content script
    const evaluation = evaluateReasonHeuristic(message.reason);
    sendResponse(evaluation);
  }
});

function evaluateReasonHeuristic(reason: string): {score: number, feedback: string} {
  const purposefulKeywords = [
    'work', 'project', 'research', 'learn', 'study', 'message', 'contact',
    'event', 'news', 'update', 'important', 'urgent', 'meeting', 'business',
    'family', 'friend', 'help', 'support', 'emergency', 'health'
  ];
  
  const mindlessKeywords = [
    'bored', 'nothing', 'scroll', 'browse', 'kill time', 'pass time',
    'see what', 'check out', 'look at', 'waste', 'procrastinate',
    'entertainment', 'funny', 'memes', 'random'
  ];

  const reasonLower = reason.toLowerCase();
  const purposefulCount = purposefulKeywords.filter(keyword => reasonLower.includes(keyword)).length;
  const mindlessCount = mindlessKeywords.filter(keyword => reasonLower.includes(keyword)).length;

  let score = 50; // Base score
  score += purposefulCount * 12;
  score -= mindlessCount * 18;
  
  // Bonus for longer, more detailed reasons
  if (reason.length > 50) score += 10;
  if (reason.length > 100) score += 5;
  
  score = Math.max(0, Math.min(100, score));

  let feedback = '';
  if (score >= 80) {
    feedback = '✅ This looks like a productive and intentional use of your time!';
  } else if (score >= 60) {
    feedback = '✅ This seems like a reasonable use of your time.';
  } else if (score >= 40) {
    feedback = '⚠️ Consider if this is really the best use of your time right now.';
  } else if (score >= 20) {
    feedback = '🚨 This might lead to mindless scrolling. Are you sure this is what you want to do?';
  } else {
    feedback = '🛑 This sounds like it could easily turn into a time-wasting session. Maybe reconsider?';
  }

  return { score, feedback };
}