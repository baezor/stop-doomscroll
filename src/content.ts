import './content.css';

interface SessionData {
  timeLimit: number;
  reason: string;
  startTime: number;
  isActive: boolean;
}

class SocialMediaInterceptor {
  private overlay: HTMLElement | null = null;
  private sessionData: SessionData | null = null;
  private timer: number | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    // Check if we already have an active session for this site
    const storageKey = `session_${window.location.hostname}`;
    const result = await chrome.storage.local.get(storageKey);
    
    if (result[storageKey] && result[storageKey].isActive) {
      this.sessionData = result[storageKey];
      this.startTimer();
    } else {
      this.showInterceptModal();
    }
  }

  private showInterceptModal() {
    // Create a backdrop element to blur the original content
    const backdrop = document.createElement('div');
    backdrop.id = 'doomscroll-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
      background: rgba(255, 255, 255, 0.1);
      z-index: 999998;
    `;
    document.body.appendChild(backdrop);
    
    // Fallback for browsers that don't support backdrop-filter
    if (!CSS.supports('backdrop-filter', 'blur(5px)') && !CSS.supports('-webkit-backdrop-filter', 'blur(5px)')) {
      // Apply blur to all direct children of body except our elements
      const bodyChildren = Array.from(document.body.children);
      bodyChildren.forEach(child => {
        if (child.id !== 'doomscroll-backdrop' && child.id !== 'doomscroll-overlay') {
          (child as HTMLElement).style.filter = 'blur(5px)';
          (child as HTMLElement).setAttribute('data-doomscroll-blurred', 'true');
        }
      });
    }
    
    // Prevent scrolling on the background
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    
    this.overlay = document.createElement('div');
    this.overlay.id = 'doomscroll-overlay';
    this.overlay.innerHTML = `
      <div class="doomscroll-modal">
        <div class="doomscroll-header">
          <h2>🛑 Stop Doomscroll</h2>
          <p>Before you continue, let's be mindful about your social media use.</p>
        </div>
        
        <form id="doomscroll-form">
          <div class="form-group">
            <label for="time-limit">How many minutes do you plan to spend here?</label>
            <input type="number" id="time-limit" min="1" max="120" value="15" required>
            <span class="helper-text">Be realistic with your time</span>
          </div>
          
          <div class="form-group">
            <label for="reason">What's your reason for visiting?</label>
            <textarea id="reason" placeholder="e.g., Check messages from friends, Research for work project, etc." required></textarea>
            <span class="helper-text">Be specific about your purpose</span>
          </div>
          
          <div class="form-actions">
            <button type="submit" id="continue-btn">Continue to Site</button>
            <button type="button" id="cancel-btn">Maybe Later</button>
          </div>
        </form>
        
        <div id="evaluation-result" class="evaluation-result" style="display: none;"></div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.attachEventListeners();
  }

  private attachEventListeners() {
    const form = document.getElementById('doomscroll-form') as HTMLFormElement;
    const cancelBtn = document.getElementById('cancel-btn') as HTMLButtonElement;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });

    cancelBtn.addEventListener('click', () => {
      window.history.back();
    });
  }

  private async handleFormSubmit() {
    const timeLimit = parseInt((document.getElementById('time-limit') as HTMLInputElement).value);
    const reason = (document.getElementById('reason') as HTMLTextAreaElement).value.trim();

    if (!reason) {
      alert('Please provide a reason for your visit.');
      return;
    }

    // Evaluate the reason using a simple heuristic (in real implementation, this would use an LLM)
    const evaluation = await this.evaluateReason(reason);
    
    this.showEvaluationResult(evaluation, timeLimit, reason);
  }

  private async evaluateReason(reason: string): Promise<{score: number, feedback: string}> {
    // Simple heuristic evaluation (replace with actual LLM integration)
    const purposefulKeywords = [
      'work', 'project', 'research', 'learn', 'study', 'message', 'contact',
      'event', 'news', 'update', 'important', 'urgent', 'meeting', 'business'
    ];
    
    const mindlessKeywords = [
      'bored', 'nothing', 'scroll', 'browse', 'kill time', 'pass time',
      'see what', 'check out', 'look at', 'waste', 'procrastinate'
    ];

    const reasonLower = reason.toLowerCase();
    const purposefulCount = purposefulKeywords.filter(keyword => reasonLower.includes(keyword)).length;
    const mindlessCount = mindlessKeywords.filter(keyword => reasonLower.includes(keyword)).length;

    let score = 50; // Base score
    score += purposefulCount * 15;
    score -= mindlessCount * 20;
    score = Math.max(0, Math.min(100, score));

    let feedback = '';
    if (score >= 70) {
      feedback = '✅ This seems like a productive use of your time!';
    } else if (score >= 40) {
      feedback = '⚠️ Consider if this is the best use of your time right now.';
    } else {
      feedback = '🚨 This might lead to mindless scrolling. Are you sure?';
    }

    return { score, feedback };
  }

  private showEvaluationResult(evaluation: {score: number, feedback: string}, timeLimit: number, reason: string) {
    const resultDiv = document.getElementById('evaluation-result')!;
    resultDiv.innerHTML = `
      <div class="evaluation-content">
        <h3>Reason Evaluation</h3>
        <p class="feedback">${evaluation.feedback}</p>
        <div class="score-bar">
          <div class="score-fill" style="width: ${evaluation.score}%"></div>
        </div>
        <p class="score-text">Purposefulness Score: ${evaluation.score}/100</p>
        
        <div class="final-actions">
          <button id="proceed-btn" class="proceed-btn">Proceed (${timeLimit} min timer)</button>
          <button id="reconsider-btn" class="reconsider-btn">Reconsider</button>
        </div>
      </div>
    `;
    
    resultDiv.style.display = 'block';
    document.getElementById('doomscroll-form')!.style.display = 'none';

    // Add event listeners for final actions
    document.getElementById('proceed-btn')!.addEventListener('click', () => {
      this.startSession(timeLimit, reason);
    });

    document.getElementById('reconsider-btn')!.addEventListener('click', () => {
      window.history.back();
    });
  }

  private async startSession(timeLimit: number, reason: string) {
    this.sessionData = {
      timeLimit,
      reason,
      startTime: Date.now(),
      isActive: true
    };

    // Store session data
    const storageKey = `session_${window.location.hostname}`;
    await chrome.storage.local.set({ [storageKey]: this.sessionData });

    // Remove overlay and backdrop, restore page
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    const backdrop = document.getElementById('doomscroll-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
    
    // Remove fallback blur from elements
    const blurredElements = document.querySelectorAll('[data-doomscroll-blurred="true"]');
    blurredElements.forEach(element => {
      (element as HTMLElement).style.filter = '';
      element.removeAttribute('data-doomscroll-blurred');
    });
    
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';

    // Start the timer
    this.startTimer();
  }

  private startTimer() {
    if (!this.sessionData) return;

    const timeRemaining = Math.max(0, this.sessionData.timeLimit * 60 * 1000 - (Date.now() - this.sessionData.startTime));
    
    if (timeRemaining <= 0) {
      this.showTimeUpNotification();
      return;
    }

    this.showTimerIndicator();
    
    this.timer = setTimeout(() => {
      this.showTimeUpNotification();
    }, timeRemaining);
  }

  private showTimerIndicator() {
    if (!this.sessionData) return;

    const indicator = document.createElement('div');
    indicator.id = 'doomscroll-timer';
    indicator.innerHTML = `
      <div class="timer-content">
        <span class="timer-text">Time remaining: <span id="timer-countdown"></span></span>
        <button id="extend-time">+5 min</button>
      </div>
    `;
    
    document.body.appendChild(indicator);

    // Update countdown
    this.updateCountdown();
    setInterval(() => this.updateCountdown(), 1000);

    // Extend time functionality
    document.getElementById('extend-time')!.addEventListener('click', () => {
      this.extendTime(5);
    });
  }

  private updateCountdown() {
    if (!this.sessionData) return;

    const timeRemaining = Math.max(0, this.sessionData.timeLimit * 60 * 1000 - (Date.now() - this.sessionData.startTime));
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    
    const countdownEl = document.getElementById('timer-countdown');
    if (countdownEl) {
      countdownEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  private async extendTime(additionalMinutes: number) {
    if (!this.sessionData) return;

    this.sessionData.timeLimit += additionalMinutes;
    
    const storageKey = `session_${window.location.hostname}`;
    await chrome.storage.local.set({ [storageKey]: this.sessionData });

    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.startTimer();
  }

  private async showTimeUpNotification() {
    const notification = document.createElement('div');
    notification.id = 'doomscroll-timeup';
    notification.innerHTML = `
      <div class="timeup-modal">
        <h2>⏰ Time's Up!</h2>
        <p>You've reached your planned time limit for this site.</p>
        <div class="timeup-actions">
          <button id="leave-now">Leave Now</button>
          <button id="extend-5min">+5 Minutes</button>
          <button id="extend-10min">+10 Minutes</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);

    // Add event listeners
    document.getElementById('leave-now')!.addEventListener('click', () => {
      window.close();
    });

    document.getElementById('extend-5min')!.addEventListener('click', () => {
      this.extendTime(5);
      notification.remove();
    });

    document.getElementById('extend-10min')!.addEventListener('click', () => {
      this.extendTime(10);
      notification.remove();
    });

    // Clear session after 24 hours
    setTimeout(async () => {
      const storageKey = `session_${window.location.hostname}`;
      await chrome.storage.local.remove(storageKey);
    }, 24 * 60 * 60 * 1000);
  }
}

// Initialize the interceptor
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new SocialMediaInterceptor());
} else {
  new SocialMediaInterceptor();
}