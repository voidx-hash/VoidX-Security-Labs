// Terminal functionality for VoidX Security Labs
class Terminal {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.output = this.container.querySelector('.terminal-output');
    this.inputField = this.container.querySelector('.terminal-input-field');
    this.prompt = this.container.querySelector('.terminal-prompt');
    
    this.history = [];
    this.historyIndex = -1;
    
    this.commands = {
      help: this.help.bind(this),
      courses: this.courses.bind(this),
      labs: this.labs.bind(this),
      tools: this.tools.bind(this),
      upgrade: this.upgrade.bind(this),
      logout: this.logout.bind(this),
      clear: this.clear.bind(this),
      whoami: this.whoami.bind(this),
      date: this.date.bind(this)
    };
    
    this.setupEventListeners();
    this.printWelcomeMessage();
  }
  
  setupEventListeners() {
    this.inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.executeCommand();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.navigateHistory('up');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.navigateHistory('down');
      }
    });
  }
  
  printWelcomeMessage() {
    this.println('<span class="terminal-text">Welcome to VoidX Security Labs</span>');
    this.println('<span class="terminal-text">Type "help" to see available commands</span>');
    this.println('');
  }
  
  executeCommand() {
    const command = this.inputField.value.trim();
    
    if (command) {
      this.history.push(command);
      this.historyIndex = this.history.length;
      
      this.println(`<span class="terminal-text">$ ${command}</span>`);
      
      const [cmd, ...args] = command.split(' ');
      const cmdLower = cmd.toLowerCase();
      
      if (this.commands[cmdLower]) {
        this.commands[cmdLower](args);
      } else {
        this.println(`<span class="terminal-text">Command not found: ${cmd}</span>`);
        this.println('<span class="terminal-text">Type "help" for available commands</span>');
      }
    } else {
      this.println('');
    }
    
    this.inputField.value = '';
  }
  
  navigateHistory(direction) {
    if (direction === 'up' && this.historyIndex > 0) {
      this.historyIndex--;
      this.inputField.value = this.history[this.historyIndex] || '';
    } else if (direction === 'down' && this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.inputField.value = this.history[this.historyIndex] || '';
    } else if (direction === 'down' && this.historyIndex === this.history.length - 1) {
      this.historyIndex = this.history.length;
      this.inputField.value = '';
    }
  }
  
  println(text) {
    const line = document.createElement('div');
    line.innerHTML = text;
    this.output.appendChild(line);
    this.output.scrollTop = this.output.scrollHeight;
  }
  
  help(args) {
    this.println('<span class="terminal-text">Available commands:</span>');
    this.println('<span class="terminal-text">help - Show this help message</span>');
    this.println('<span class="terminal-text">courses - List available courses</span>');
    this.println('<span class="terminal-text">labs - Access security labs</span>');
    this.println('<span class="terminal-text">tools - Access security tools</span>');
    this.println('<span class="terminal-text">upgrade - Upgrade your subscription</span>');
    this.println('<span class="terminal-text">logout - Log out of your account</span>');
    this.println('<span class="terminal-text">clear - Clear the terminal</span>');
    this.println('<span class="terminal-text">whoami - Display current user info</span>');
    this.println('<span class="terminal-text">date - Show current date and time</span>');
  }
  
  courses(args) {
    // Redirect to courses page
    window.location.href = 'courses.html';
  }
  
  labs(args) {
    // Check if user has access to labs
    if (!currentUser || !hasAccess(USER_ROLES.FREE)) {
      this.println('<span class="terminal-text">Access denied. Please log in to access labs.</span>');
      return;
    }
    
    // Redirect to labs page
    window.location.href = 'labs.html';
  }
  
  tools(args) {
    // Check if user has access to tools
    if (!currentUser || !hasAccess(USER_ROLES.FREE)) {
      this.println('<span class="terminal-text">Access denied. Please log in to access tools.</span>');
      return;
    }
    
    // Redirect to tools page
    window.location.href = 'tools.html';
  }
  
  upgrade(args) {
    // Redirect to upgrade page
    window.location.href = 'upgrade.html';
  }
  
  logout(args) {
    // Call the logout function from auth.js
    if (typeof logout === 'function') {
      logout();
    } else {
      this.println('<span class="terminal-text">Logging out...</span>');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    }
  }
  
  clear(args) {
    this.output.innerHTML = '';
  }
  
  whoami(args) {
    if (currentUser) {
      this.println(`<span class="terminal-text">User: ${currentUser.email}</span>`);
      if (currentUser.profile) {
        this.println(`<span class="terminal-text">Role: ${currentUser.profile.role}</span>`);
      }
    } else {
      this.println('<span class="terminal-text">Guest user</span>');
    }
  }
  
  date(args) {
    this.println(`<span class="terminal-text">${new Date().toString()}</span>`);
  }
}

// Initialize terminal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('terminal')) {
    window.terminal = new Terminal('terminal');
  }
});