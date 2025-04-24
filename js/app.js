// App Configuration
const CONFIG = {
  STORAGE_KEYS: {
    PROFILE: "health_profile",
    BMI_HISTORY: "bmi_history",
    MEDICATIONS: "medications",
    NUTRITION: "nutrition",
    WATER_INTAKE: "water_intake",
    SYMPTOMS: "symptoms",
    THEME: "theme",
  },
  WATER_GOAL: 2000, // 2L in ml
  NOTIFICATION_DURATION: 5000,
};

// Utility Functions
const utils = {
  // Storage Operations
  saveToStorage: (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Storage error:", error);
      return false;
    }
  },

  getFromStorage: (key) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Storage error:", error);
      return null;
    }
  },

  // Date Formatting
  formatDate: (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  },

  formatTime: (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  // Notification System
  showNotification: (message, type = "info") => {
    const toastContainer =
      document.querySelector(".toast-container") ||
      (() => {
        const container = document.createElement("div");
        container.className = "toast-container";
        document.body.appendChild(container);
        return container;
      })();

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, CONFIG.NOTIFICATION_DURATION);
  },

  // Form Validation
  validateForm: (formData, rules) => {
    const errors = {};

    for (const [field, value] of Object.entries(formData)) {
      if (rules[field]) {
        const fieldRules = rules[field];

        if (fieldRules.required && !value) {
          errors[field] = `${field} is required`;
        }

        if (fieldRules.min && value < fieldRules.min) {
          errors[field] = `${field} must be at least ${fieldRules.min}`;
        }

        if (fieldRules.max && value > fieldRules.max) {
          errors[field] = `${field} must be at most ${fieldRules.max}`;
        }

        if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
          errors[field] = `${field} format is invalid`;
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  // Loading State Management
  setLoading: (element, isLoading) => {
    if (isLoading) {
      element.classList.add("loading");
      element.disabled = true;
    } else {
      element.classList.remove("loading");
      element.disabled = false;
    }
  },
};

// Navigation Handler
class Navigation {
  constructor() {
    this.sections = document.querySelectorAll(".section");
    this.navLinks = document.querySelectorAll(".nav-link");
    this.init();
  }

  init() {
    this.navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("href").substring(1);
        this.showSection(targetId);
      });
    });

    // Handle browser back/forward buttons
    window.addEventListener("popstate", (e) => {
      if (e.state && e.state.section) {
        this.showSection(e.state.section, false);
      }
    });
  }

  showSection(sectionId, updateHistory = true) {
    this.sections.forEach((section) => {
      section.classList.add("d-none");
      if (section.id === sectionId) {
        section.classList.remove("d-none");
      }
    });

    this.navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${sectionId}`) {
        link.classList.add("active");
      }
    });

    if (updateHistory) {
      history.pushState({ section: sectionId }, "", `#${sectionId}`);
    }
  }
}

// Theme Manager
class ThemeManager {
  constructor() {
    this.theme = utils.getFromStorage(CONFIG.STORAGE_KEYS.THEME) || "light";
    this.init();
  }

  init() {
    this.applyTheme();
    // Add theme toggle button if needed
  }

  applyTheme() {
    document.documentElement.setAttribute("data-theme", this.theme);
    utils.saveToStorage(CONFIG.STORAGE_KEYS.THEME, this.theme);
  }

  toggleTheme() {
    this.theme = this.theme === "light" ? "dark" : "light";
    this.applyTheme();
  }
}

// Browser Notification Manager
class NotificationManager {
  constructor() {
    this.hasPermission = false;
    this.init();
  }

  async init() {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === "granted";
    }
  }

  async sendNotification(title, options = {}) {
    if (!this.hasPermission) {
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: "/icon.png",
        badge: "/badge.png",
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error("Notification error:", error);
    }
  }
}

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  window.app = {
    navigation: new Navigation(),
    theme: new ThemeManager(),
    notifications: new NotificationManager(),
    utils: utils,
  };

  // Initialize other modules
  const moduleScripts = [
    "dashboard.js",
    "medications.js",
    "nutrition.js",
    "symptoms.js",
    "profile.js",
  ];

  moduleScripts.forEach((script) => {
    const scriptElement = document.createElement("script");
    scriptElement.src = `js/${script}`;
    document.body.appendChild(scriptElement);
  });
});
