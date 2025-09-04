(() => {
  // Prevent multiple widget instances
  if (window.PerceptiveAIWidget) {
    return;
  }

  // Get the script tag that loaded this file
  const currentScript =
    document.currentScript ||
    (() => {
      const scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();

  // Extract configuration from script attributes
  const config = {
    widgetId: currentScript.getAttribute("data-id") || "default",
    baseUrl: currentScript.src.replace("/widget.js", ""),
    theme: currentScript.getAttribute("data-theme") || "default",
    position: currentScript.getAttribute("data-position") || "bottom-right",
  };

  // Widget namespace
  window.PerceptiveAIWidget = {
    config: config,
    isLoaded: false,
    iframe: null,
    container: null,
    isOpen: false,

    // Initialize the widget
    init: function () {
      if (this.isLoaded) return;

      // Wait for DOM to be ready
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () =>
          this.createWidget()
        );
      } else {
        this.createWidget();
      }
    },

    // Create the widget container and iframe
    createWidget: function () {
      try {
        // Create container - positioned only in corner, not full screen
        this.container = document.createElement("div");
        this.container.id = "perceptive-ai-widget-container";
        this.container.style.cssText = this.getContainerStyles();

        // Create iframe
        this.iframe = document.createElement("iframe");
        this.iframe.id = "perceptive-ai-widget-iframe";
        this.iframe.src = `${config.baseUrl}/widget?id=${config.widgetId}&theme=${config.theme}`;
        this.iframe.style.cssText = this.getIframeStyles();

        // Security attributes
        this.iframe.setAttribute(
          "sandbox",
          "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        );
        this.iframe.setAttribute("allow", "clipboard-write; web-share");
        this.iframe.setAttribute("loading", "lazy");
        this.iframe.setAttribute("title", "Perceptive AI Chat Widget");

        // Add iframe to container
        this.container.appendChild(this.iframe);

        // Add container to page
        document.body.appendChild(this.container);

        // Set up message handling
        this.setupMessageHandling();

        this.isLoaded = true;

        // Track widget load
        this.trackEvent("widget_loaded", {
          widgetId: config.widgetId,
          url: window.location.href,
          userAgent: navigator.userAgent,
        });
      } catch (error) {
        console.error("Perceptive AI Widget: Failed to initialize", error);
      }
    },

    // Container styles - positioned in bottom-right corner only
    getContainerStyles: function () {
      const position = config.position || "bottom-right";
      console.log(this.isOpen);
      let positionStyles = "";
      switch (position) {
        case "bottom-left":
          positionStyles = "bottom: 24px !important; left: 24px !important;";
          break;
        case "bottom-right":
        default:
          positionStyles = "bottom: 24px !important; right: 24px !important;";
          break;
        case "top-left":
          positionStyles = "top: 24px !important; left: 24px !important;";
          break;
        case "top-right":
          positionStyles = "top: 24px !important; right: 24px !important;";
          break;
      }
      if (this.isOpen === "maximize") {
        return `width: 800px !important; height: 90vh !important;
         border: none !important;
        margin: 0 !important;
        padding: 6 !important;
        background: transparent !important;
        overflow: visible !important;
        pointer-events: none !important;
         position: fixed !important;
        z-index: 2147483647 !important;
        ${positionStyles}`;
      }
      return `
        position: fixed !important;
        z-index: 2147483647 !important;
        ${positionStyles}
        width: ${this.isOpen ? "400px" : "100px"} !important;
        height: ${this.isOpen ? "600px" : "80px"} !important;
        border: none !important;
        margin: 0 !important;
        padding: 6 !important;
        background: transparent !important;
        overflow: visible !important;
        pointer-events: none !important;
      `;
    },

    // Iframe styles - fills the container
    getIframeStyles: () => `
        width: 100% !important;
        height: 100% !important;
        border: none !important;
        background: transparent !important; 
        pointer-events: auto !important;
        border-radius: 12px !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
      `,

    // Handle messages from iframe
    setupMessageHandling: function () {
      const self = this;

      window.addEventListener("message", (event) => {
        const { type, data } = event.data || {};

        console.log("📨 Received message:", type);

        if (
          type === "WIDGET_OPEN" ||
          type === "WIDGET_RESIZE" ||
          type === "WIDGET_RESTORE"
        ) {
          self.isOpen = true;
          if (self.container) {
            self.container.style.cssText = self.getContainerStyles();
          }
        } else if (type === "WIDGET_MAXIMIZE") {
          self.isOpen = "maximize";
          self.container.style.cssText = self.getContainerStyles();
        } else {
          self.isOpen = false;
          self.container.style.cssText = self.getContainerStyles();
        }

        const allowedOrigin = self.config.baseUrl
          .replace(/^https?:\/\//, "")
          .replace(/^/, "https://");

        if (
          event.origin !== allowedOrigin &&
          event.origin !== "http://localhost:3000"
        ) {
          return;
        }

        switch (type) {
          case "WIDGET_READY":
            self.onWidgetReady(data);
            break;
          case "WIDGET_RESIZE":
            self.onWidgetResize(data);
            break;
          case "WIDGET_CLOSE":
            self.onWidgetClose();
            break;
          case "WIDGET_OPEN":
            self.onWidgetOpen();
            break;
          case "WIDGET_MINIMIZE":
            self.onWidgetMinimize();
            break;
          case "TRACK_EVENT":
            self.trackEvent(data.event, data.properties);
            break;
          default:
            console.warn("Unknown message type:", type);
        }
      });
    },
    // Widget ready callback
    onWidgetReady: (data) => {
      console.log("Perceptive AI Widget: Ready", data);
    },

    // Handle widget resize
    onWidgetResize: function (data) {
      if (this.container && data) {
        if (data.width) {
          this.container.style.width = `${data.width}px !important`;
        }
        if (data.height) {
          this.container.style.height = `${data.height}px !important`;
        }
      }
    },

    // Handle widget close
    onWidgetClose: function () {
      console.log("tested");
      this.trackEvent("widget_closed");
    },

    // Handle widget open
    onWidgetOpen: function () {
      this.trackEvent("widget_opened");
    },

    // Handle widget minimize (show only button)
    onWidgetMinimize: function () {
      if (this.container) {
        this.container.style.width = "64px !important";
        this.container.style.height = "64px !important";
      }
      this.trackEvent("widget_minimized");
    },

    // Track events (send to parent site's analytics)
    trackEvent: (eventName, properties = {}) => {
      try {
        // Try to send to parent site's analytics
        if (window.gtag) {
          window.gtag("event", eventName, {
            custom_parameter_widget_id: config.widgetId,
            ...properties,
          });
        }

        if (window.analytics && window.analytics.track) {
          window.analytics.track(eventName, {
            widgetId: config.widgetId,
            ...properties,
          });
        }

        // Also send to our own analytics endpoint
        fetch(`${config.baseUrl}/api/analytics`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event: eventName,
            properties: {
              widgetId: config.widgetId,
              url: window.location.href,
              timestamp: new Date().toISOString(),
              ...properties,
            },
          }),
        }).catch(() => {}); // Fail silently
      } catch (error) {
        // Fail silently - don't break parent site
      }
    },

    // Public API methods
    open: function () {
      if (this.iframe) {
        this.iframe.contentWindow.postMessage({ type: "OPEN_WIDGET" }, "*");
      }
    },

    close: function () {
      if (this.iframe) {
        this.iframe.contentWindow.postMessage({ type: "CLOSE_WIDGET" }, "*");
      }
    },

    minimize: function () {
      if (this.iframe) {
        this.iframe.contentWindow.postMessage({ type: "MINIMIZE_WIDGET" }, "*");
      }
    },

    destroy: function () {
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
      this.isLoaded = false;
      this.iframe = null;
      this.container = null;
    },
  };

  // Auto-initialize
  window.PerceptiveAIWidget.init();

  // Expose global methods for parent site
  window.PerceptiveAI = {
    open: () => window.PerceptiveAIWidget.open(),
    close: () => window.PerceptiveAIWidget.close(),
    minimize: () => window.PerceptiveAIWidget.minimize(),
    destroy: () => window.PerceptiveAIWidget.destroy(),
  };
})();
