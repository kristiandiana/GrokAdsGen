// Content script that injects into X Ads Console pages

console.log("BrandPulse Extension: Content script loaded");

// Track BrandPulse view state
let isBrandPulseActive = false;
let mainContentObserver: MutationObserver | null = null;
let reInjectTimeout: number | null = null;
let hiddenReactElements: HTMLElement[] = [];

// Wait for page to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

function init() {
  console.log("BrandPulse Extension: Initializing injection");

  // Check if we're on an ads console page
  if (isAdsConsolePage()) {
    waitForSidebar();
    setupMainContentObserver();
  }
}

function isAdsConsolePage(): boolean {
  const url = window.location.href;
  return url.includes("ads.twitter.com") || url.includes("ads.x.com");
}

function waitForSidebar() {
  console.log("BrandPulse: Waiting for sidebar to appear...");

  // Try immediate injection first
  if (tryInject()) {
    return;
  }

  // Use MutationObserver to watch for sidebar appearance
  const observer = new MutationObserver((mutations, obs) => {
    console.log("BrandPulse: DOM changed, checking for sidebar...");
    if (tryInject()) {
      obs.disconnect();
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also try with increasing delays as fallback
  let attempts = 0;
  const maxAttempts = 10;
  const interval = setInterval(() => {
    attempts++;
    console.log(`BrandPulse: Retry attempt ${attempts}/${maxAttempts}`);

    if (tryInject()) {
      clearInterval(interval);
      observer.disconnect();
    } else if (attempts >= maxAttempts) {
      console.error(
        "BrandPulse: Failed to find sidebar after",
        maxAttempts,
        "attempts"
      );
      clearInterval(interval);
      observer.disconnect();

      // Debug: log what we can find
      console.log("BrandPulse: Debug - Available elements:");
      console.log(
        "- NavigationSidebar-itemGroup:",
        document.querySelectorAll(".NavigationSidebar-itemGroup").length
      );
      console.log(
        "- NavigationSidebar-item:",
        document.querySelectorAll(".NavigationSidebar-item").length
      );
      console.log(
        "- All elements with NavigationSidebar:",
        document.querySelectorAll('[class*="NavigationSidebar"]').length
      );
    }
  }, 500);
}

function tryInject(): boolean {
  // Find the navigation sidebar list
  const navList = document.querySelector(".NavigationSidebar-itemGroup");

  if (!navList) {
    return false;
  }

  console.log("BrandPulse: Found NavigationSidebar-itemGroup!");

  // Check if we've already injected
  if (document.getElementById("brandpulse-nav-item")) {
    console.log("BrandPulse: Already injected, skipping");
    return true;
  }

  // Create a new navigation item matching the structure
  const brandPulseItem = document.createElement("li");
  brandPulseItem.id = "brandpulse-nav-item";
  brandPulseItem.className = "NavigationSidebar-item";
  brandPulseItem.setAttribute("role", "presentation");

  brandPulseItem.innerHTML = `
    <div class="NavigationSidebar-itemTargetWrapper">
      <button 
        id="brandpulse-nav-button"
        aria-expanded="false" 
        role="treeitem"
        style="width: 100%; text-align: left;"
      >
        <span class="NavigationSidebar-itemTargetInnerWrapper">
          <span aria-hidden="true" class="Icon NavigationSidebar-itemStartIcon" role="img"></span>
          <span class="NavigationSidebar-itemTargetChildren">BrandPulse</span>
        </span>
      </button>
    </div>
  `;

  // Insert at the top of the navigation list
  // Find the first direct child <li> element
  const firstChild = Array.from(navList.children).find(
    (child) =>
      child.tagName === "LI" &&
      child.classList.contains("NavigationSidebar-item")
  ) as HTMLElement | undefined;

  if (firstChild && navList.contains(firstChild)) {
    // firstChild is a direct child, safe to insert before
    navList.insertBefore(brandPulseItem, firstChild);
    console.log("BrandPulse: Inserted before first item");
  } else {
    // Use prepend to add at the beginning, or append if prepend not available
    if (navList.firstChild) {
      navList.insertBefore(brandPulseItem, navList.firstChild);
    } else {
      navList.appendChild(brandPulseItem);
    }
    console.log("BrandPulse: Inserted at beginning of nav list");
  }

  // Add click handler to show BrandPulse view
  const button = brandPulseItem.querySelector("#brandpulse-nav-button");

  if (button) {
    button.addEventListener("click", () => {
      // Remove is-selected from all other navigation items
      document
        .querySelectorAll(".NavigationSidebar-item.is-selected")
        .forEach((item) => {
          if (item !== brandPulseItem) {
            item.classList.remove("is-selected");
          }
        });

      // Add is-selected class to BrandPulse item
      brandPulseItem.classList.add("is-selected");

      showBrandPulseView();
      // Update button state
      button.setAttribute("aria-expanded", "true");
    });
  }

  // Watch for clicks on other sidebar items to remove selection from BrandPulse
  const sidebar = document.querySelector(".NavigationSidebar");
  if (sidebar) {
    sidebar.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      // Check if clicked item is a navigation button (but not BrandPulse)
      const clickedItem = target.closest(".NavigationSidebar-item");
      if (clickedItem && clickedItem !== brandPulseItem) {
        // Remove selection from BrandPulse
        brandPulseItem.classList.remove("is-selected");
        // Restore original content
        restoreOriginalContent();
      }
    });
  }

  console.log("BrandPulse: Successfully injected into sidebar!");
  return true;
}

function setupMainContentObserver() {
  // Watch for changes to main content container (React re-renders)
  mainContentObserver = new MutationObserver((mutations) => {
    // CRITICAL: Check isBrandPulseActive FIRST, before any async operations
    if (!isBrandPulseActive) {
      return; // Exit immediately if BrandPulse is not active
    }

    const brandPulseItem = document.getElementById("brandpulse-nav-item");
    const isSelected = brandPulseItem?.classList.contains("is-selected");

    // Only proceed if BrandPulse is both active AND selected
    if (!isSelected) {
      // BrandPulse was deselected, clear any pending re-injection immediately
      if (reInjectTimeout) {
        clearTimeout(reInjectTimeout);
        reInjectTimeout = null;
      }
      return; // Exit - don't re-inject
    }

    // Check if our BrandPulse UI was removed
    const dashboard = document.getElementById("brandpulse-dashboard");
    if (!dashboard) {
      // Clear any pending re-injection
      if (reInjectTimeout) {
        clearTimeout(reInjectTimeout);
      }

      // Debounce re-injection to avoid conflicts with React
      reInjectTimeout = window.setTimeout(() => {
        // Triple-check before re-injecting
        if (!isBrandPulseActive) {
          reInjectTimeout = null;
          return;
        }

        const brandPulseItemCheck = document.getElementById(
          "brandpulse-nav-item"
        );
        const dashboardCheck = document.getElementById("brandpulse-dashboard");

        // Final check: BrandPulse must be active, selected, and dashboard missing
        if (
          isBrandPulseActive &&
          brandPulseItemCheck?.classList.contains("is-selected") &&
          !dashboardCheck
        ) {
          console.log("BrandPulse: Dashboard was removed, re-injecting...");
          showBrandPulseView();
        }
        reInjectTimeout = null;
      }, 300);
    }
  });

  // Start observing when main content container appears
  const observeMainContent = () => {
    const mainContainer =
      document.querySelector("#mainContentContainer") ||
      document.querySelector("main");
    if (mainContainer) {
      mainContentObserver?.observe(mainContainer, {
        childList: true,
        subtree: true,
      });
      console.log("BrandPulse: Main content observer set up");
    } else {
      // Retry if not found
      setTimeout(observeMainContent, 500);
    }
  };

  observeMainContent();
}

function restoreOriginalContent() {
  console.log("BrandPulse: Deactivating BrandPulse view");

  // Set flag IMMEDIATELY - this must happen before React starts rendering
  isBrandPulseActive = false;

  // Clear any pending re-injection IMMEDIATELY
  if (reInjectTimeout) {
    clearTimeout(reInjectTimeout);
    reInjectTimeout = null;
  }

  // Remove our dashboard
  const dashboard = document.getElementById("brandpulse-dashboard");
  if (dashboard) {
    dashboard.remove();
  }

  // Restore React's hidden content
  hiddenReactElements.forEach((element) => {
    const originalDisplay = element.getAttribute("data-original-display");
    if (originalDisplay !== null) {
      element.style.display = originalDisplay || "";
      element.removeAttribute("data-original-display");
    } else {
      element.style.display = "";
    }
  });
  hiddenReactElements = [];

  // Let React handle the navigation naturally
}

function showBrandPulseView() {
  console.log("BrandPulse: Showing BrandPulse view");
  isBrandPulseActive = true;

  // Find main content container
  const mainContainer = document.querySelector(
    "#mainContentContainer"
  ) as HTMLElement;

  if (!mainContainer) {
    console.error("BrandPulse: Could not find mainContentContainer");
    return;
  }

  // Clear any pending re-injection
  if (reInjectTimeout) {
    clearTimeout(reInjectTimeout);
    reInjectTimeout = null;
  }

  // Use a small delay to ensure React has finished any pending updates
  setTimeout(() => {
    const brandPulseItem = document.getElementById("brandpulse-nav-item");
    if (
      !isBrandPulseActive ||
      !brandPulseItem?.classList.contains("is-selected")
    ) {
      return;
    }

    // Check if dashboard already exists
    let dashboard = document.getElementById("brandpulse-dashboard");
    if (dashboard) {
      // Already injected, just make sure it's visible
      dashboard.style.display = "";
      return;
    }

    // Hide React's content instead of destroying it
    // Find all direct children that aren't our dashboard
    hiddenReactElements = [];
    Array.from(mainContainer.children).forEach((child) => {
      if (child.id !== "brandpulse-dashboard") {
        const element = child as HTMLElement;
        // Store original display style
        const originalDisplay = element.style.display;
        element.setAttribute("data-original-display", originalDisplay || "");
        element.style.display = "none";
        hiddenReactElements.push(element);
      }
    });

    // Create and append our dashboard
    const dashboardDiv = document.createElement("div");
    dashboardDiv.id = "brandpulse-dashboard";
    dashboardDiv.innerHTML = createBrandPulseUI();
    mainContainer.appendChild(dashboardDiv);

    // Attach event listeners for dropdowns (inline scripts don't work in extensions)
    setupDashboardInteractions(dashboardDiv);

    console.log("BrandPulse: Dashboard injected into main content area");
  }, 50);
}

function setupDashboardInteractions(dashboard: HTMLElement) {
  // Setup topic toggle handlers
  const topicHeaders = dashboard.querySelectorAll(".topic-header");
  topicHeaders.forEach((button) => {
    button.addEventListener("click", () => {
      const content = button.nextElementSibling as HTMLElement;
      const arrow = button.querySelector(".topic-arrow") as HTMLElement;
      const isExpanded = content.style.display !== "none";

      content.style.display = isExpanded ? "none" : "block";
      if (arrow) {
        arrow.style.transform = isExpanded ? "rotate(0deg)" : "rotate(180deg)";
      }
    });
  });

  // Setup actionable toggle handlers
  const actionableHeaders = dashboard.querySelectorAll(".actionable-header");
  actionableHeaders.forEach((button) => {
    button.addEventListener("click", () => {
      const content = button.nextElementSibling as HTMLElement;
      const arrow = button.querySelector(".actionable-arrow") as HTMLElement;
      const isExpanded = content.style.display !== "none";

      content.style.display = isExpanded ? "none" : "block";
      if (arrow) {
        arrow.style.transform = isExpanded ? "rotate(0deg)" : "rotate(180deg)";
      }
    });
  });
}

function createBrandPulseUI(): string {
  return `
    <div id="brandpulse-dashboard" style="
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #14171a;
      background: #f7f9fa;
      min-height: 100vh;
    ">
      <header style="margin-bottom: 32px; border-bottom: 1px solid #e1e8ed; padding-bottom: 16px; background: #ffffff; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
        <h1 style="
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #14171a;
        ">BrandPulse Dashboard</h1>
        <p style="
          font-size: 14px;
          color: #657786;
          margin: 0;
        ">Sentiment topics ranked by prominence with actionable ad suggestions</p>
      </header>

      <div id="sentiment-topics-container" style="
        display: flex;
        flex-direction: column;
        gap: 16px;
      ">
        <!-- Example Sentiment Topic 1 -->
        <div class="sentiment-topic" style="
          background: #ffffff;
          border: 1px solid #e1e8ed;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        ">
          <button class="topic-header" style="
            width: 100%;
            padding: 20px;
            text-align: left;
            background: #ffffff;
            border: none;
            outline: none;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 16px;
            font-weight: 600;
            color: #14171a;
            transition: background 0.2s;
          " onmouseover="this.style.background='#f7f9fa'" onmouseout="this.style.background='#ffffff'">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span class="topic-icon" style="
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #e0245e;
                display: inline-block;
              "></span>
              <span class="topic-text">People are unhappy with shipping speeds</span>
              <span style="
                font-size: 12px;
                font-weight: 500;
                color: #657786;
                background: #f7f9fa;
                padding: 4px 8px;
                border-radius: 12px;
              ">High Prominence</span>
            </div>
            <span class="topic-arrow" style="
              transition: transform 0.2s;
              color: #657786;
            ">▼</span>
          </button>
          <div class="topic-content" style="
            display: none;
            padding: 0 20px 20px 20px;
          ">
            <!-- Tweets Section -->
            <div style="margin-bottom: 20px;">
              <h3 style="
                font-size: 14px;
                font-weight: 600;
                color: #657786;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin: 0 0 12px 0;
              ">Relevant Tweets</h3>
              <div class="tweets-list" style="
                display: flex;
                flex-direction: column;
                gap: 12px;
              ">
                <div class="tweet-item" style="
                  padding: 12px;
                  background: #f7f9fa;
                  border-radius: 8px;
                  position: relative;
                  padding-left: 20px;
                ">
                  <div style="
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                    background: #e0245e;
                    border-radius: 8px 0 0 8px;
                  "></div>
                  <div style="font-size: 14px; color: #14171a; margin-bottom: 4px;">
                    "Shipping took forever! Ordered 2 weeks ago and still waiting..."
                  </div>
                  <div style="font-size: 12px; color: #657786;">
                    @username • 2h ago • 45 retweets
                  </div>
                </div>
                <div class="tweet-item" style="
                  padding: 12px;
                  background: #f7f9fa;
                  border-radius: 8px;
                  position: relative;
                  padding-left: 20px;
                ">
                  <div style="
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                    background: #e0245e;
                    border-radius: 8px 0 0 8px;
                  "></div>
                  <div style="font-size: 14px; color: #14171a; margin-bottom: 4px;">
                    "Why is shipping so slow? This is ridiculous..."
                  </div>
                  <div style="font-size: 12px; color: #657786;">
                    @username2 • 5h ago • 23 retweets
                  </div>
                </div>
              </div>
            </div>

            <!-- Actionable Steps Section -->
            <div>
              <button class="actionable-header" style="
                width: 100%;
                padding: 12px;
                text-align: left;
                background: #f7f9fa;
                border: none;
                outline: none;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 14px;
                font-weight: 600;
                color: #14171a;
                margin-bottom: 12px;
              " onmouseover="this.style.background='#e1e8ed'" onmouseout="this.style.background='#f7f9fa'">
                <span>Actionable Steps & Ad Suggestions</span>
                <span class="actionable-arrow" style="transition: transform 0.2s; color: #657786;">▼</span>
              </button>
              <div class="actionable-content" style="display: none;">
                <div class="ad-suggestion" style="
                  background: #ffffff;
                  border: 1px solid #e1e8ed;
                  border-radius: 8px;
                  padding: 16px;
                  margin-bottom: 12px;
                ">
                  <div style="display: flex; gap: 16px; margin-bottom: 12px;">
                    <div style="
                      width: 120px;
                      height: 120px;
                      background: #f7f9fa;
                      border-radius: 6px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      color: #657786;
                      font-size: 12px;
                      flex-shrink: 0;
                    ">Image/Video</div>
                    <div style="flex: 1;">
                      <h4 style="
                        font-size: 14px;
                        font-weight: 600;
                        margin: 0 0 8px 0;
                        color: #14171a;
                      ">Ad Suggestion: Fast Shipping Promise</h4>
                      <div style="
                        font-size: 12px;
                        color: #657786;
                        margin-bottom: 12px;
                      ">
                        <div>Target: Shipping concerns</div>
                        <div>Format: Image carousel</div>
                        <div>CTA: "Free Express Shipping"</div>
                      </div>
                      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <label style="
                          display: flex;
                          align-items: center;
                          gap: 6px;
                          font-size: 12px;
                          color: #14171a;
                          cursor: pointer;
                        ">
                          <input type="checkbox" style="cursor: pointer;">
                          Use in campaign
                        </label>
                        <label style="
                          display: flex;
                          align-items: center;
                          gap: 6px;
                          font-size: 12px;
                          color: #14171a;
                          cursor: pointer;
                        ">
                          <input type="checkbox" style="cursor: pointer;">
                          Generate variations
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Example Sentiment Topic 2 -->
        <div class="sentiment-topic" style="
          background: #ffffff;
          border: 1px solid #e1e8ed;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        ">
          <button class="topic-header" style="
            width: 100%;
            padding: 20px;
            text-align: left;
            background: #ffffff;
            border: none;
            outline: none;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 16px;
            font-weight: 600;
            color: #14171a;
            transition: background 0.2s;
          " onmouseover="this.style.background='#f7f9fa'" onmouseout="this.style.background='#ffffff'">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span class="topic-icon" style="
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #17bf63;
                display: inline-block;
              "></span>
              <span class="topic-text">People love the new colorway of shoes</span>
              <span style="
                font-size: 12px;
                font-weight: 500;
                color: #657786;
                background: #f7f9fa;
                padding: 4px 8px;
                border-radius: 12px;
              ">Medium Prominence</span>
            </div>
            <span class="topic-arrow" style="
              transition: transform 0.2s;
              color: #657786;
            ">▼</span>
          </button>
          <div class="topic-content" style="
            display: none;
            padding: 0 20px 20px 20px;
          ">
            <div style="margin-bottom: 20px;">
              <h3 style="
                font-size: 14px;
                font-weight: 600;
                color: #657786;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin: 0 0 12px 0;
              ">Relevant Tweets</h3>
              <div class="tweets-list" style="
                display: flex;
                flex-direction: column;
                gap: 12px;
              ">
                <div class="tweet-item" style="
                  padding: 12px;
                  background: #f7f9fa;
                  border-radius: 8px;
                  position: relative;
                  padding-left: 20px;
                ">
                  <div style="
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                    background: #17bf63;
                    border-radius: 8px 0 0 8px;
                  "></div>
                  <div style="font-size: 14px; color: #14171a; margin-bottom: 4px;">
                    "The new colorway is absolutely fire! 🔥"
                  </div>
                  <div style="font-size: 12px; color: #657786;">
                    @username3 • 1h ago • 120 retweets
                  </div>
                </div>
              </div>
            </div>
            <div>
              <button class="actionable-header" style="
                width: 100%;
                padding: 12px;
                text-align: left;
                background: #f7f9fa;
                border: none;
                outline: none;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 14px;
                font-weight: 600;
                color: #14171a;
                margin-bottom: 12px;
              " onmouseover="this.style.background='#e1e8ed'" onmouseout="this.style.background='#f7f9fa'">
                <span>Actionable Steps & Ad Suggestions</span>
                <span class="actionable-arrow" style="transition: transform 0.2s; color: #657786;">▼</span>
              </button>
              <div class="actionable-content" style="display: none;">
                <div class="ad-suggestion" style="
                  background: #ffffff;
                  border: 1px solid #e1e8ed;
                  border-radius: 8px;
                  padding: 16px;
                  margin-bottom: 12px;
                ">
                  <div style="display: flex; gap: 16px; margin-bottom: 12px;">
                    <div style="
                      width: 120px;
                      height: 120px;
                      background: #f7f9fa;
                      border-radius: 6px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      color: #657786;
                      font-size: 12px;
                      flex-shrink: 0;
                    ">Image/Video</div>
                    <div style="flex: 1;">
                      <h4 style="
                        font-size: 14px;
                        font-weight: 600;
                        margin: 0 0 8px 0;
                        color: #14171a;
                      ">Ad Suggestion: Showcase New Colorway</h4>
                      <div style="
                        font-size: 12px;
                        color: #657786;
                        margin-bottom: 12px;
                      ">
                        <div>Target: Positive sentiment</div>
                        <div>Format: Video showcase</div>
                        <div>CTA: "Shop Now"</div>
                      </div>
                      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <label style="
                          display: flex;
                          align-items: center;
                          gap: 6px;
                          font-size: 12px;
                          color: #14171a;
                          cursor: pointer;
                        ">
                          <input type="checkbox" style="cursor: pointer;">
                          Use in campaign
                        </label>
                        <label style="
                          display: flex;
                          align-items: center;
                          gap: 6px;
                          font-size: 12px;
                          color: #14171a;
                          cursor: pointer;
                        ">
                          <input type="checkbox" style="cursor: pointer;">
                          Generate variations
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;
}
