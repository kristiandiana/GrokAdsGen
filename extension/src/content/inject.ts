// Content script that injects into X Ads Console pages

import { Network, Data, Options, Node, Edge } from "vis-network";
import { DataSet } from "vis-data";
import "../styles/tailwind.css";
import { Topic, Post, Ad, Sentiment, Prominence, AdFormat } from "../types";
import { stateManager } from "../store/state";
import { createPostCardContainer } from "../components/PostCard";
import { createAdCardContainer } from "../components/AdCard";

console.log("BrandPulse Extension: Content script loaded");

// Sample topic data (will be replaced with API data later)
// Helper function to convert old format to new format
function createTopic(
  id: string,
  text: string,
  sentiment: Sentiment,
  prominence: Prominence,
  posts: Post[],
  ads: Ad[],
  actionableStep?: string
): Topic {
  return {
    id,
    text,
    sentiment,
    prominence,
    mentionCount: posts.length,
    posts,
    ads,
    actionableStep,
  };
}

const sampleTopics: Topic[] = [
  createTopic(
    "topic-1",
    "People are unhappy with shipping speeds",
    "negative",
    "high",
    [
      {
        id: "post-1",
        text: "Shipping took forever! Ordered 2 weeks ago and still waiting...",
        author: "username",
        username: "@username",
        timestamp: "2h ago",
        retweets: 45,
        sentiment: "negative",
      },
      {
        id: "post-2",
        text: "Why is shipping so slow? This is ridiculous...",
        author: "username2",
        username: "@username2",
        timestamp: "5h ago",
        retweets: 23,
        sentiment: "negative",
      },
    ],
    [
      {
        id: "ad-1",
        title: "Fast Shipping Promise",
        target: "Shipping concerns",
        format: "carousel",
        cta: "Free Express Shipping",
      },
      {
        id: "ad-2",
        title: "Delivery Time Transparency",
        target: "Shipping concerns",
        format: "single image",
        cta: "Track Your Order",
      },
    ],
    "Acknowledge the delays up front and show a concrete fix: new carriers, faster lanes, or guaranteed delivery windows. Pair creative with live delivery speed stats or customer screenshots of fast arrivals. Retarget anyone who asked about shipping with a clear CTA to track their order or choose express. Keep the tone empathetic and specific, not generic apologies."
  ),
  createTopic(
    "topic-2",
    "People love the new colorway of shoes",
    "positive",
    "medium",
    [
      {
        id: "post-3",
        text: "The new colorway is absolutely fire! 🔥",
        author: "username3",
        username: "@username3",
        timestamp: "1h ago",
        retweets: 120,
        sentiment: "positive",
      },
      {
        id: "post-4",
        text: "Just copped the new colorway, so clean!",
        author: "sneakerhead",
        username: "@sneakerhead",
        timestamp: "3h ago",
        retweets: 89,
        sentiment: "positive",
      },
    ],
    [
      {
        id: "ad-3",
        title: "Showcase New Colorway",
        target: "Positive sentiment",
        format: "video",
        cta: "Shop Now",
        videoUrl:
          "https://v3b.fal.media/files/b/0a855bc2/5VMBX7yh8nqqvEuos7_PR_tmp_tlx4uej.mp4",
      },
      {
        id: "ad-3b",
        title: "New Collection Preview",
        target: "Fashion enthusiasts",
        format: "single image",
        cta: "Explore Now",
        imageUrl:
          "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-f2863e62-f5d8-47d0-b0e5-729036fa92a6.png",
      },
      {
        id: "ad-4",
        title: "Colorway Collection Ad",
        target: "Fashion enthusiasts",
        format: "carousel",
        cta: "Explore Collection",
      },
    ],
    'Ride the hype: lead with the hero colorway in motion, then show quick styling combos. Use social proof from creators and early buyers, and invite UGC with a simple hashtag. Offer limited drops or early access for those who engage with colorway content. Keep CTAs playful - "Style your fit" instead of "Buy now".'
  ),
  createTopic(
    "topic-3",
    "Price point concerns",
    "negative",
    "high",
    [
      {
        id: "post-5",
        text: "These prices are getting out of hand...",
        author: "customer1",
        username: "@customer1",
        timestamp: "3h ago",
        retweets: 89,
        sentiment: "negative",
      },
      {
        id: "post-6",
        text: "Used to be affordable, now it's way too expensive",
        author: "customer2",
        username: "@customer2",
        timestamp: "6h ago",
        retweets: 67,
        sentiment: "negative",
      },
    ],
    [
      {
        id: "ad-5",
        title: "Value Proposition Campaign",
        target: "Price sensitivity",
        format: "single image",
        cta: "Limited Time Offer",
      },
      {
        id: "ad-6",
        title: "Affordability Message",
        target: "Budget-conscious shoppers",
        format: "image",
        cta: "See Value",
      },
    ],
    "Reframe price as value: highlight durability, perks, and cost-per-use in plain language. Create side-by-side comparisons that show why it's worth it, and add a time-bound incentive (trial, bonus, or limited discount) to nudge skeptics. Target carts and lapsed visitors with reassurance-focused creative. Tone should be respectful and transparent, not defensive."
  ),
  createTopic(
    "topic-4",
    "Product quality complaints",
    "negative",
    "medium",
    [
      {
        id: "post-7",
        text: "Quality has really gone downhill lately",
        author: "reviewer1",
        username: "@reviewer1",
        timestamp: "4h ago",
        retweets: 34,
        sentiment: "negative",
      },
      {
        id: "post-8",
        text: "Expected better quality for this price point",
        author: "disappointed",
        username: "@disappointed",
        timestamp: "7h ago",
        retweets: 28,
        sentiment: "negative",
      },
    ],
    [
      {
        id: "ad-7",
        title: "Quality Assurance Message",
        target: "Quality concerns",
        format: "video",
        cta: "See Our Standards",
      },
      {
        id: "ad-8",
        title: "Quality Guarantee Ad",
        target: "Quality-conscious buyers",
        format: "single image",
        cta: "Learn More",
      },
    ],
    "Lead with proof: materials, testing, and guarantees. Show behind-the-scenes clips of quality checks and real customer fixes. Offer a no-questions-asked warranty and feature support response times to build trust. Retarget complainers with a service-first CTA like “We’ll make it right” before asking for another purchase."
  ),
  createTopic(
    "topic-5",
    "New product launch excitement",
    "positive",
    "high",
    [
      {
        id: "post-9",
        text: "Can't wait for the new release! Pre-ordered immediately",
        author: "early_adopter",
        username: "@early_adopter",
        timestamp: "2h ago",
        retweets: 156,
        sentiment: "positive",
      },
      {
        id: "post-10",
        text: "The new product looks amazing! When does it drop?",
        author: "excited_customer",
        username: "@excited_customer",
        timestamp: "4h ago",
        retweets: 98,
        sentiment: "positive",
      },
    ],
    [
      {
        id: "ad-9",
        title: "Launch Campaign",
        target: "Early adopters",
        format: "single image",
        cta: "Pre-Order Now",
      },
      {
        id: "ad-10",
        title: "Product Reveal Video",
        target: "Interested customers",
        format: "video",
        cta: "Watch Trailer",
      },
    ],
    "Build a launch runway: tease the standout benefit in a single line, then drip short reveals (design, feature, price, drop date). Give early signups a tiny perk (exclusive color, early ship, or bonus accessory). Use countdowns and reminders for people who engaged with launch posts. Keep CTAs focused on saving a spot or getting early access."
  ),
];

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

  // Show the PageFooter again when dashboard is deactivated
  const footer = document.querySelector(".PageFooter") as HTMLElement;
  if (footer) {
    footer.style.display = "";
  }

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

  // Hide the PageFooter when dashboard is active
  const footer = document.querySelector(".PageFooter") as HTMLElement;
  if (footer) {
    footer.style.display = "none";
  }

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

    // Ensure footer is hidden (in case it appears dynamically)
    const footer = document.querySelector(".PageFooter") as HTMLElement;
    if (footer) {
      footer.style.display = "none";
    }

    // Create and append our dashboard
    const dashboardDiv = document.createElement("div");
    dashboardDiv.id = "brandpulse-dashboard";
    dashboardDiv.innerHTML = createBrandPulseUI();
    mainContainer.appendChild(dashboardDiv);

    // Initialize with sample data for immediate render, then hydrate from API
    stateManager.setTopics(sampleTopics);
    fetchInsightsAndHydrate();

    // Subscribe to state changes to update UI reactively
    stateManager.subscribe((state) => {
      // Re-populate views when state changes
      const dashboard = document.getElementById("brandpulse-dashboard");
      if (dashboard) {
        // Only update if the view is currently visible
        const activeView = dashboard.querySelector(
          ".view-content[style*='block']"
        );
        if (activeView) {
          const viewId = activeView.id;
          if (viewId === "view-posts") {
            populatePostsView(dashboard as HTMLElement);
          } else if (viewId === "view-ads") {
            populateAdsView(dashboard as HTMLElement);
          } else if (viewId === "view-topics") {
            populateTopicsView(dashboard as HTMLElement);
          }
        }
        // Re-initialize graph if graph view is active
        if (activeView?.id === "view-graph") {
          initializeGraphView(dashboard as HTMLElement);
        }
      }
    });

    // Initialize graph view
    initializeGraphView(dashboardDiv);

    // Attach event listeners for dropdowns (inline scripts don't work in extensions)
    setupDashboardInteractions(dashboardDiv);

    console.log("BrandPulse: Dashboard injected into main content area");
  }, 50);
}

async function fetchInsightsAndHydrate(brand?: string) {
  try {
    await stateManager.fetchInsightsFromAPI(brand);
  } catch (err) {
    console.error(
      "BrandPulse: Failed to fetch insights, using sample data",
      err
    );
  }
}

function setupDashboardInteractions(dashboard: HTMLElement) {
  // Setup back to topic button
  const backToTopicBtn = dashboard.querySelector("#back-to-topic-btn");
  if (backToTopicBtn) {
    backToTopicBtn.addEventListener("click", () => {
      const graphView = dashboard.querySelector("#view-graph") as HTMLElement;
      const contentView = dashboard.querySelector(
        "#content-view"
      ) as HTMLElement;
      if (graphView && contentView) {
        contentView.style.display = "none";
        graphView.style.display = "block";
      }
    });
  }

  // Setup view tab switching (Graph, Posts, Ads, Topics)
  const viewTabButtons = dashboard.querySelectorAll(".view-tab-button");
  viewTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const viewName = button.getAttribute("data-view");
      if (!viewName) return;

      // Remove active class from all tabs
      viewTabButtons.forEach((btn) => {
        btn.classList.remove("active");
        (btn as HTMLElement).style.background = "transparent";
        (btn as HTMLElement).style.color = "#657786";
        (btn as HTMLElement).style.boxShadow = "none";
      });

      // Add active class to clicked tab
      button.classList.add("active");
      (button as HTMLElement).style.background = "#ffffff";
      (button as HTMLElement).style.color = "#667eea";
      (button as HTMLElement).style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.05)";

      // Hide all view contents
      const viewContents = dashboard.querySelectorAll(".view-content");
      viewContents.forEach((content) => {
        (content as HTMLElement).style.display = "none";
      });

      // Reset graph view if it was open (hide content view, show graph view)
      const graphView = dashboard.querySelector("#view-graph") as HTMLElement;
      const contentView = dashboard.querySelector(
        "#content-view"
      ) as HTMLElement;
      if (graphView && contentView) {
        // If content view is visible, reset to graph view
        if (contentView.style.display === "block") {
          contentView.style.display = "none";
          graphView.style.display = "block";
        }
      }

      // Show selected view content
      const selectedView = dashboard.querySelector(`#view-${viewName}`);
      if (selectedView) {
        (selectedView as HTMLElement).style.display = "block";
      }

      // Populate views with data if needed
      if (viewName === "posts") {
        populatePostsView(dashboard);
      } else if (viewName === "ads") {
        populateAdsView(dashboard);
      } else if (viewName === "topics") {
        populateTopicsView(dashboard);
      }
    });
  });

  // Setup click handlers for view items
  setupTabViewItemHandlers(dashboard);

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

  // Setup tweets toggle handlers
  const tweetsHeaders = dashboard.querySelectorAll(".tweets-header");
  tweetsHeaders.forEach((button) => {
    button.addEventListener("click", () => {
      const content = button.nextElementSibling as HTMLElement;
      const arrow = button.querySelector(".tweets-arrow") as HTMLElement;
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
      <!-- Main Dashboard Header with Tabs -->
      <header style="margin-bottom: 24px; background: #ffffff; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
        <div style="margin-bottom: 20px;">
          <h1 style="
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 8px 0;
            color: #14171a;
          ">BrandPulse Dashboard</h1>
        </div>
        
        <!-- Tab Selectors -->
        <div style="
          display: flex;
          gap: 0;
          border-bottom: 2px solid #e1e8ed;
          background: #f7f9fa;
          border-radius: 6px;
          padding: 4px;
        ">
          <button class="view-tab-button active" data-view="graph" style="
            flex: 1;
            padding: 12px 16px;
            background: #ffffff;
            border: none;
            border-radius: 4px;
            color: #667eea;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            outline: none;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          ">Graph</button>
          <button class="view-tab-button" data-view="posts" style="
            flex: 1;
            padding: 12px 16px;
            background: transparent;
            border: none;
            border-radius: 4px;
            color: #657786;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            outline: none;
          ">Posts</button>
          <button class="view-tab-button" data-view="ads" style="
            flex: 1;
            padding: 12px 16px;
            background: transparent;
            border: none;
            border-radius: 4px;
            color: #657786;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            outline: none;
          ">Ads</button>
          <button class="view-tab-button" data-view="topics" style="
            flex: 1;
            padding: 12px 16px;
            background: transparent;
            border: none;
            border-radius: 4px;
            color: #657786;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            outline: none;
          ">Topics</button>
        </div>
      </header>
      
      <!-- Main View Container -->
      <div id="main-view-container">
        <!-- Graph View -->
        <div id="view-graph" class="view-content" style="display: block;">
          <div style="position: relative; margin-bottom: 24px;">
            <button id="zoom-out-btn" style="
              position: absolute;
              top: 12px;
              right: 12px;
              background: #667eea;
              color: white;
              border: none;
              border-radius: 6px;
              padding: 12px 20px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              outline: none;
              display: none;
              box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
              z-index: 10;
            " onmouseover="this.style.opacity='0.9'; this.style.boxShadow='0 4px 8px rgba(102, 126, 234, 0.3)'" onmouseout="this.style.opacity='1'; this.style.boxShadow='0 2px 4px rgba(102, 126, 234, 0.2)'">← Back</button>
          </div>
          <div id="cy" style="
            width: 100%;
            height: 600px;
            background: #ffffff;
            border: 1px solid #e1e8ed;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          "></div>
        </div>
        
        <!-- Posts View -->
        <div id="view-posts" class="view-content" style="display: none;">
          <div style="
            background: #ffffff;
            border-radius: 0;
            max-height: 600px;
            overflow-y: auto;
          ">
            <!-- Posts list items will be populated here -->
          </div>
        </div>
        
        <!-- Ads View -->
        <div id="view-ads" class="view-content" style="display: none;">
          <div style="
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            padding: 24px;
            max-height: 600px;
            overflow-y: auto;
          ">
            <!-- Ads list items will be populated here -->
          </div>
        </div>
        
        <!-- Topics View -->
        <div id="view-topics" class="view-content" style="display: none;">
          <div style="
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            padding: 24px;
            max-height: 600px;
            overflow-y: auto;
          ">
            <!-- Topics list items will be populated here -->
          </div>
        </div>
      </div>

      <!-- Content View (hidden by default) -->
      <div id="content-view" style="display: none;">
        <header style="margin-bottom: 24px; border-bottom: 1px solid #e1e8ed; padding-bottom: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="display: flex; align-items: center; gap: 16px;">
            <button id="back-to-topic-btn" style="
              background: rgba(255, 255, 255, 0.2);
              color: white;
              border: 1px solid rgba(255, 255, 255, 0.3);
              border-radius: 6px;
              padding: 8px 16px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              outline: none;
              backdrop-filter: blur(10px);
            " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">← Back to Topic</button>
            <div>
              <h1 id="content-title" style="
                font-size: 24px;
                font-weight: 700;
                margin: 0 0 4px 0;
                color: #ffffff;
              "></h1>
              <p style="
                font-size: 14px;
                color: rgba(255, 255, 255, 0.9);
                margin: 0;
              ">Detailed insights and recommendations</p>
            </div>
          </div>
        </header>
        <div id="content-body" style="
          padding: 24px;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          min-height: 500px;
        "></div>
      </div>

      <!-- Detail View (hidden by default) -->
      <div id="detail-view" style="display: none;">
        <header style="margin-bottom: 24px; border-bottom: 1px solid #e1e8ed; padding-bottom: 16px; background: #ffffff; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
          <div style="display: flex; align-items: center; gap: 16px;">
            <button id="back-to-graph-btn" style="
              background: #1DA1F2;
              color: white;
              border: none;
              border-radius: 6px;
              padding: 8px 16px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              outline: none;
            " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">← Back to Graph</button>
            <div>
              <h1 id="detail-topic-title" style="
                font-size: 24px;
                font-weight: 700;
                margin: 0 0 4px 0;
                color: #14171a;
              "></h1>
              <p style="
                font-size: 14px;
                color: #657786;
                margin: 0;
              ">Topic details and actionable suggestions</p>
            </div>
          </div>
        </header>
        <div id="detail-content" style="
          display: flex;
          flex-direction: column;
          gap: 16px;
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
              <button class="tweets-header" style="
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
                <span>Relevant Tweets</span>
                <span class="tweets-arrow" style="transition: transform 0.2s; color: #657786;">▼</span>
              </button>
              <div class="tweets-content" style="
                display: none;
              ">
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
      </div>
    </div>
  `;
}

function initializeGraphView(dashboard: HTMLElement) {
  const cyContainer = dashboard.querySelector("#view-graph #cy") as HTMLElement;
  if (!cyContainer) return;

  // Get topics from state manager
  const topics = stateManager.getTopics();

  // Calculate center position
  const centerX = cyContainer.offsetWidth / 2;
  const centerY = cyContainer.offsetHeight / 2;

  // Dynamic radius based on number of topics to prevent overlap
  // Base radius of 200, scales up with more topics
  // For 4 topics: ~200px, for 8 topics: ~280px, for 12 topics: ~340px
  const minRadius = 200;
  const maxRadius =
    Math.min(cyContainer.offsetWidth, cyContainer.offsetHeight) * 0.35;
  const radius = Math.min(minRadius + (topics.length - 4) * 20, maxRadius);

  // Create nodes array
  const nodes: Node[] = [
    // BrandPulse center node
    {
      id: "brandpulse",
      label: "BrandPulse",
      shape: "circle",
      color: {
        background: "#000000",
        border: "#ffffff",
        highlight: { background: "#000000", border: "#ffffff" },
      },
      font: {
        color: "#ffffff",
        size: 20,
        face: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        bold: "bold",
      },
      size: 50,
      borderWidth: 4,
      fixed: { x: true, y: true },
      x: centerX,
      y: centerY,
    },
    // Topic nodes - evenly spaced around the center
    ...topics.map((topic, index) => {
      const prominence = topic.prominence;
      const width =
        prominence === "high" ? 160 : prominence === "medium" ? 140 : 120;
      const height =
        prominence === "high" ? 70 : prominence === "medium" ? 60 : 50;
      const borderWidth = prominence === "high" ? 3 : 2;

      // Calculate angle for even spacing around the circle
      // Automatically adjusts based on topics.length
      const angle = (index * 2 * Math.PI) / topics.length;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      return {
        id: topic.id,
        label: topic.text,
        shape: "box",
        color: {
          background: "#ffffff",
          border: "#000000",
          highlight: { background: "#ffffff", border: "#000000" },
        },
        font: {
          color: "#000000",
          size: 13,
          face: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          bold: "bold",
        },
        widthConstraint: { maximum: width },
        borderWidth: borderWidth,
        topicData: topic,
        type: "topic",
        x: x,
        y: y,
        fixed: { x: true, y: true },
      } as Node;
    }),
  ];

  // Create edges array
  const edges: Edge[] = topics.map((topic) => ({
    id: `edge-${topic.id}`,
    from: "brandpulse",
    to: topic.id,
    color: { color: "#000000", opacity: 0.3 },
    width: 2,
    arrows: { to: { enabled: false } },
  }));

  // Configure options
  const options: Options = {
    nodes: {
      shapeProperties: {
        borderRadius: 8,
      },
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
      font: {
        multi: "html",
        size: 13,
      },
      chosen: false, // Disable highlight effect to prevent bold outline on click
    },
    edges: {
      // Disable smoothing to avoid invalid "straight" type and keep edges crisp
      smooth: false,
    },
    physics: {
      enabled: false, // Disable physics since we're using fixed positions
    },
    interaction: {
      zoomView: true,
      dragView: true,
    },
    layout: {
      improvedLayout: true,
    },
  };

  // Initialize vis-network with DataSet
  const nodesDataSet = new DataSet(nodes);
  const edgesDataSet = new DataSet(edges);
  const data: Data = { nodes: nodesDataSet, edges: edgesDataSet };
  const network = new Network(cyContainer, data, options);

  // Store network instance and data sets
  (dashboard as any).networkInstance = network;
  (dashboard as any).nodesDataSet = nodesDataSet;
  (dashboard as any).edgesDataSet = edgesDataSet;
  (dashboard as any).initialNodes = JSON.parse(JSON.stringify(nodes));
  (dashboard as any).initialEdges = JSON.parse(JSON.stringify(edges));
  (dashboard as any).expandedTopicId = null;

  // Add click handler for nodes
  network.on("click", function (params: any) {
    if (params.nodes.length > 0) {
      const nodeId = params.nodes[0];
      const node = nodesDataSet.get(nodeId);

      if (node && (node as any).type === "topic") {
        const topicData = (node as any).topicData as Topic;
        if (topicData) {
          expandTopic(network, dashboard, nodeId, topicData);
        }
      } else if (
        node &&
        ((node as any).type === "actionable-steps" ||
          (node as any).type === "analysis")
      ) {
        const nodeType = (node as any).type;
        const topicData = (node as any).topicData as Topic;
        if (topicData) {
          showContentView(dashboard, nodeType, topicData);
        }
      }
    }
  });

  // Setup zoom out button
  const zoomOutBtn = dashboard.querySelector("#zoom-out-btn");
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener("click", () => {
      resetGraphView(network, dashboard);
    });
  }

  // Stabilize the network after initialization
  network.once("stabilizationEnd" as any, () => {
    // Center the view on the brandpulse node
    const position = network.getPosition("brandpulse");
    if (position) {
      network.moveTo({
        position: position,
        scale: 1,
        animation: {
          duration: 500,
          easingFunction: "easeInOutQuad",
        },
      });
    }
  });
}

function expandTopic(
  network: Network,
  dashboard: HTMLElement,
  topicId: string,
  topicData: Topic
) {
  const expandedTopicId = (dashboard as any).expandedTopicId;

  // If clicking the same topic, reset
  if (expandedTopicId === topicId) {
    resetGraphView(network, dashboard);
    return;
  }

  // Remove previous child nodes and edges if any
  const nodesDataSet = (dashboard as any).nodesDataSet;
  const edgesDataSet = (dashboard as any).edgesDataSet;
  if (expandedTopicId && nodesDataSet) {
    const prevActionableId = `${expandedTopicId}-actionable`;
    const prevAnalysisId = `${expandedTopicId}-analysis`;
    nodesDataSet.remove([prevActionableId, prevAnalysisId]);

    // Remove edges to previous child nodes
    if (edgesDataSet) {
      const prevActionableEdgeId = `${expandedTopicId}-edge-actionable`;
      const prevAnalysisEdgeId = `${expandedTopicId}-edge-analysis`;
      edgesDataSet.remove([prevActionableEdgeId, prevAnalysisEdgeId]);
    }

    // Clear any running fade intervals
    const fadeInterval = (dashboard as any).fadeInterval;
    if (fadeInterval) {
      clearInterval(fadeInterval);
      (dashboard as any).fadeInterval = null;
    }
  }

  // Get the topic node position
  const topicPosition = network.getPosition(topicId);
  if (!topicPosition) return;

  // Add child nodes
  const actionableStepsId = `${topicId}-actionable`;
  const analysisId = `${topicId}-analysis`;

  const actionableNode: any = {
    id: actionableStepsId,
    label: "Actionable Steps",
    shape: "box",
    color: {
      background: "rgba(0, 0, 0, 0)", // Start with opacity 0 for fade in
      border: "rgba(255, 255, 255, 0)",
      highlight: { background: "#000000", border: "#ffffff" },
    },
    font: {
      color: "rgba(255, 255, 255, 0)",
      size: 14,
      face: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      bold: "bold",
    },
    widthConstraint: { maximum: 160 },
    borderWidth: 2,
    topicData: topicData,
    type: "actionable-steps",
    x: topicPosition.x - 220,
    y: topicPosition.y, // Align vertically with topic
    fixed: { x: true, y: true },
  };

  const analysisNode: any = {
    id: analysisId,
    label: "Analysis",
    shape: "box",
    color: {
      background: "rgba(255, 255, 255, 0)", // Start with opacity 0 for fade in
      border: "rgba(0, 0, 0, 0)",
      highlight: { background: "#ffffff", border: "#000000" },
    },
    font: {
      color: "rgba(0, 0, 0, 0)",
      size: 14,
      face: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      bold: "bold",
    },
    widthConstraint: { maximum: 160 },
    borderWidth: 3,
    topicData: topicData,
    type: "analysis",
    x: topicPosition.x + 220,
    y: topicPosition.y, // Align vertically with topic
    fixed: { x: true, y: true },
  };

  if (nodesDataSet) {
    nodesDataSet.add([actionableNode, analysisNode]);
  }

  // Add edges from topic to child nodes (start with opacity 0 for fade in)
  const edgesDataSetForChildren = (dashboard as any).edgesDataSet;
  if (edgesDataSetForChildren) {
    const actionableEdge: Edge = {
      id: `${topicId}-edge-actionable`,
      from: topicId,
      to: actionableStepsId,
      color: { color: "#000000", opacity: 0 }, // Start with opacity 0
      width: 2,
      arrows: { to: { enabled: false } },
    };

    const analysisEdge: Edge = {
      id: `${topicId}-edge-analysis`,
      from: topicId,
      to: analysisId,
      color: { color: "#000000", opacity: 0 }, // Start with opacity 0
      width: 2,
      arrows: { to: { enabled: false } },
    };

    edgesDataSetForChildren.add([actionableEdge, analysisEdge]);
  }

  // Fade out and hide all other nodes (other topics and BrandPulse center node)
  const allNodes = nodesDataSet.get();
  const nodesToHide: string[] = [];

  allNodes.forEach((node: any) => {
    const nodeId = node.id;
    // Keep visible: only the current topic and its child nodes
    // Hide: all other topic nodes and the BrandPulse center node
    if (
      nodeId !== topicId &&
      nodeId !== actionableStepsId &&
      nodeId !== analysisId
    ) {
      // Hide other topic nodes and BrandPulse
      if (node.type === "topic" || nodeId === "brandpulse") {
        nodesToHide.push(nodeId);
      }
    }
  });

  // Fade out nodes before hiding them
  nodesToHide.forEach((nodeId) => {
    const node = nodesDataSet.get(nodeId);
    if (node) {
      // Store original colors to avoid flickering
      const originalColors = {
        background:
          node.color?.background ||
          (nodeId === "brandpulse" ? "#000000" : "#ffffff"),
        border:
          node.color?.border ||
          (nodeId === "brandpulse" ? "#ffffff" : "#000000"),
        fontColor:
          node.font?.color || (nodeId === "brandpulse" ? "#ffffff" : "#000000"),
      };

      // Helper to convert hex to rgb
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
            }
          : null;
      };

      // Gradually reduce opacity for fade out effect
      const fadeSteps = 10;
      const fadeDuration = 300; // 300ms fade out
      const stepDelay = fadeDuration / fadeSteps;

      let currentStep = 0;
      const fadeInterval = setInterval(() => {
        // Store interval so we can clear it if needed
        (dashboard as any).fadeInterval = fadeInterval;
        currentStep++;
        const opacity = 1 - currentStep / fadeSteps;

        // Get current node to ensure we have latest state
        const currentNode = nodesDataSet.get(nodeId);
        if (!currentNode) {
          clearInterval(fadeInterval);
          return;
        }

        if (node.type === "topic") {
          // For topic nodes, fade the background and border
          const bgRgb = hexToRgb(originalColors.background);
          const borderRgb = hexToRgb(originalColors.border);
          const fontRgb = hexToRgb(originalColors.fontColor);

          nodesDataSet.update({
            id: nodeId,
            color: {
              background: bgRgb
                ? `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, ${opacity})`
                : `rgba(255, 255, 255, ${opacity})`,
              border: borderRgb
                ? `rgba(${borderRgb.r}, ${borderRgb.g}, ${borderRgb.b}, ${opacity})`
                : `rgba(0, 0, 0, ${opacity})`,
              highlight: currentNode.color?.highlight,
            },
            font: {
              ...currentNode.font,
              color: fontRgb
                ? `rgba(${fontRgb.r}, ${fontRgb.g}, ${fontRgb.b}, ${opacity})`
                : `rgba(0, 0, 0, ${opacity})`,
            },
          });
        } else if (nodeId === "brandpulse") {
          // For BrandPulse node, fade the background and border
          nodesDataSet.update({
            id: nodeId,
            color: {
              background: `rgba(0, 0, 0, ${opacity})`,
              border: `rgba(255, 255, 255, ${opacity})`,
              highlight: currentNode.color?.highlight,
            },
            font: {
              ...currentNode.font,
              color: `rgba(255, 255, 255, ${opacity})`,
            },
          });
        }

        if (currentStep >= fadeSteps) {
          clearInterval(fadeInterval);
          // Hide the node after fade out completes
          const finalNode = nodesDataSet.get(nodeId);
          if (finalNode) {
            nodesDataSet.update({ id: nodeId, hidden: true });
          }
        }
      }, stepDelay);
    }
  });

  // Hide all edges connected to hidden nodes (including BrandPulse edges)
  const edgesDataSetForHiding = (dashboard as any).edgesDataSet;
  if (edgesDataSetForHiding) {
    const allEdges = edgesDataSetForHiding.get();
    allEdges.forEach((edge: any) => {
      // Hide edges from BrandPulse (since BrandPulse is hidden)
      // and edges to other topic nodes (since they're hidden)
      if (
        edge.from === "brandpulse" ||
        (nodesToHide.includes(edge.to) && edge.to !== topicId)
      ) {
        edgesDataSetForHiding.update({ ...edge, hidden: true });
      }
    });
  }

  // Store which nodes were hidden for restoration
  (dashboard as any).hiddenNodeIds = nodesToHide;

  // Calculate center position for all nodes (topic in center, children on left/right)
  const centerX = topicPosition.x;
  const centerY = topicPosition.y;

  // Disable physics to keep nodes in place
  network.setOptions({
    physics: { enabled: false },
    interaction: { zoomView: false, dragView: false },
  });

  // Zoom and pan to center the topic with its children
  network.moveTo({
    position: { x: centerX, y: centerY },
    scale: 1.5,
    animation: {
      duration: 600,
      easingFunction: "easeOutQuad",
    },
  });

  // Fade in child nodes after zoom animation completes
  setTimeout(() => {
    const fadeSteps = 15;
    const fadeDuration = 400; // 400ms fade in
    const stepDelay = fadeDuration / fadeSteps;

    let currentStep = 0;
    const fadeInterval = setInterval(() => {
      currentStep++;
      const opacity = currentStep / fadeSteps;

      // Fade in actionable steps node
      const actionableNode = nodesDataSet.get(actionableStepsId);
      if (actionableNode) {
        nodesDataSet.update({
          ...actionableNode,
          color: {
            background: `rgba(0, 0, 0, ${opacity})`,
            border: `rgba(255, 255, 255, ${opacity})`,
            highlight: { background: "#000000", border: "#ffffff" },
          },
          font: {
            ...actionableNode.font,
            color: `rgba(255, 255, 255, ${opacity})`,
          },
        });
      }

      // Fade in analysis node
      const analysisNode = nodesDataSet.get(analysisId);
      if (analysisNode) {
        nodesDataSet.update({
          ...analysisNode,
          color: {
            background: `rgba(255, 255, 255, ${opacity})`,
            border: `rgba(0, 0, 0, ${opacity})`,
            highlight: { background: "#ffffff", border: "#000000" },
          },
          font: {
            ...analysisNode.font,
            color: `rgba(0, 0, 0, ${opacity})`,
          },
        });
      }

      // Fade in edges
      const edgesDataSetForFade = (dashboard as any).edgesDataSet;
      if (edgesDataSetForFade) {
        const actionableEdgeId = `${topicId}-edge-actionable`;
        const analysisEdgeId = `${topicId}-edge-analysis`;
        const edgeOpacity = opacity * 0.3; // Match the final opacity of 0.3

        const actionableEdge = edgesDataSetForFade.get(actionableEdgeId);
        if (actionableEdge) {
          edgesDataSetForFade.update({
            ...actionableEdge,
            color: { color: "#000000", opacity: edgeOpacity },
          });
        }

        const analysisEdge = edgesDataSetForFade.get(analysisEdgeId);
        if (analysisEdge) {
          edgesDataSetForFade.update({
            ...analysisEdge,
            color: { color: "#000000", opacity: edgeOpacity },
          });
        }
      }

      if (currentStep >= fadeSteps) {
        clearInterval(fadeInterval);
      }
    }, stepDelay);
  }, 600); // Start fade in after zoom animation completes

  // Show zoom out button
  const zoomOutBtn = dashboard.querySelector("#zoom-out-btn");
  if (zoomOutBtn) {
    (zoomOutBtn as HTMLElement).style.display = "block";
  }

  (dashboard as any).expandedTopicId = topicId;
}

function resetGraphView(network: Network, dashboard: HTMLElement) {
  const expandedTopicId = (dashboard as any).expandedTopicId;
  const nodesDataSet = (dashboard as any).nodesDataSet;
  const edgesDataSet = (dashboard as any).edgesDataSet;

  // Clear any running fade intervals
  const fadeInterval = (dashboard as any).fadeInterval;
  if (fadeInterval) {
    clearInterval(fadeInterval);
    (dashboard as any).fadeInterval = null;
  }

  if (expandedTopicId && nodesDataSet) {
    // Remove child nodes by their IDs
    const actionableId = `${expandedTopicId}-actionable`;
    const analysisId = `${expandedTopicId}-analysis`;
    nodesDataSet.remove([actionableId, analysisId]);

    // Remove edges to child nodes
    if (edgesDataSet) {
      const actionableEdgeId = `${expandedTopicId}-edge-actionable`;
      const analysisEdgeId = `${expandedTopicId}-edge-analysis`;
      edgesDataSet.remove([actionableEdgeId, analysisEdgeId]);
    }
  }

  // Restore all hidden nodes with fade in
  const hiddenNodeIds = (dashboard as any).hiddenNodeIds;
  if (hiddenNodeIds && nodesDataSet) {
    // First, unhide nodes with opacity 0 for fade in
    hiddenNodeIds.forEach((nodeId: string) => {
      const node = nodesDataSet.get(nodeId);
      if (node) {
        // Restore original structure but start with opacity 0
        if (node.type === "topic") {
          nodesDataSet.update({
            ...node,
            hidden: false,
            color: {
              background: "rgba(255, 255, 255, 0)",
              border: "rgba(0, 0, 0, 0)",
              highlight: node.color.highlight || {
                background: "#ffffff",
                border: "#000000",
              },
            },
            font: {
              ...node.font,
              color: "rgba(0, 0, 0, 0)",
            },
          });
        } else if (nodeId === "brandpulse") {
          // Restore BrandPulse with original colors (hex format)
          nodesDataSet.update({
            id: nodeId,
            hidden: false,
            color: {
              background: "#000000",
              border: "#ffffff",
              highlight: { background: "#000000", border: "#ffffff" },
            },
            font: {
              color: "#ffffff",
              size: 20,
              face: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
              bold: "bold",
            },
            size: 50,
            borderWidth: 4,
          });
        } else {
          nodesDataSet.update({ ...node, hidden: false });
        }
      }
    });

    // Fade in restored nodes (only topic nodes, BrandPulse is already restored with original colors)
    setTimeout(() => {
      const fadeSteps = 15;
      const fadeDuration = 400;
      const stepDelay = fadeDuration / fadeSteps;

      let currentStep = 0;
      const fadeInterval = setInterval(() => {
        // Store interval so we can clear it if needed
        (dashboard as any).fadeInterval = fadeInterval;
        currentStep++;
        const opacity = currentStep / fadeSteps;

        hiddenNodeIds.forEach((nodeId: string) => {
          const node = nodesDataSet.get(nodeId);
          if (node && node.type === "topic") {
            // Only fade in topic nodes, BrandPulse is already at full opacity with original colors
            nodesDataSet.update({
              id: nodeId,
              color: {
                background: `rgba(255, 255, 255, ${opacity})`,
                border: `rgba(0, 0, 0, ${opacity})`,
                highlight: node.color.highlight || {
                  background: "#ffffff",
                  border: "#000000",
                },
              },
              font: {
                ...node.font,
                color: `rgba(0, 0, 0, ${opacity})`,
              },
            });
          }
        });

        if (currentStep >= fadeSteps) {
          clearInterval(fadeInterval);
        }
      }, stepDelay);
    }, 100);

    (dashboard as any).hiddenNodeIds = null;
  }

  // Restore hidden edges
  if (edgesDataSet) {
    const allEdges = edgesDataSet.get();
    allEdges.forEach((edge: any) => {
      if (edge.hidden) {
        edgesDataSet.update({ ...edge, hidden: false });
      }
    });
  }

  // Clear expanded topic ID
  (dashboard as any).expandedTopicId = null;

  // Re-enable interaction (physics stays disabled since we use fixed positions)
  network.setOptions({
    interaction: { zoomView: true, dragView: true },
  });

  // Center on BrandPulse node immediately (no need to wait for physics)
  setTimeout(() => {
    const brandPulsePosition = network.getPosition("brandpulse");
    if (brandPulsePosition) {
      network.moveTo({
        position: brandPulsePosition,
        scale: 1,
        animation: {
          duration: 500,
          easingFunction: "easeInOutQuad",
        },
      });
    } else {
      // Fallback: fit the network to show all nodes
      network.fit({
        animation: {
          duration: 500,
          easingFunction: "easeInOutQuad",
        },
      });
    }
  }, 100);

  // Hide zoom out button
  const zoomOutBtn = dashboard.querySelector("#zoom-out-btn");
  if (zoomOutBtn) {
    (zoomOutBtn as HTMLElement).style.display = "none";
  }

  // Hide content view if open
  const contentView = dashboard.querySelector("#content-view");
  if (contentView) {
    (contentView as HTMLElement).style.display = "none";
  }

  (dashboard as any).expandedTopicId = null;
}

function showContentView(
  dashboard: HTMLElement,
  nodeType: string,
  topic: Topic
) {
  const graphView = dashboard.querySelector("#view-graph") as HTMLElement;
  const contentView = dashboard.querySelector("#content-view") as HTMLElement;
  const contentTitle = dashboard.querySelector("#content-title") as HTMLElement;
  const contentBody = dashboard.querySelector("#content-body") as HTMLElement;

  if (!graphView || !contentView || !contentTitle || !contentBody) return;

  // Hide graph view, show content view
  graphView.style.display = "none";
  contentView.style.display = "block";

  let contentHTML = "";

  if (nodeType === "actionable-steps") {
    // Set title
    contentTitle.textContent = "Actionable Steps & Ad Suggestions";

    // Get brand info from insights or use defaults
    const state = stateManager.getState();
    const brandName = state.insights?.brand || "Tesla";
    const brandHandle = state.insights?.brand
      ? `@${state.insights.brand.toLowerCase()}`
      : "@Tesla";
    const brandAvatarUrl =
      "https://pbs.twimg.com/profile_images/1337607516008501250/6Ggc4S5n_400x400.png";

    // Clear content body and use AdCard components
    contentBody.innerHTML = "";

    // Create ad cards for all ads in this topic
    const adCards = topic.ads.map((ad) => ({ ad, topic }));
    const adCardContainer = createAdCardContainer(adCards, {
      brandName,
      brandHandle,
      brandAvatarUrl,
    });

    contentBody.appendChild(adCardContainer);
    return;
  } else if (nodeType === "analysis") {
    // Set title
    contentTitle.textContent = "Sentiment Analysis";

    // Show analysis with tweets and sentiment
    const sentimentColor =
      topic.sentiment === "positive" ? "#10b981" : "#f59e0b";
    const sentimentLabel =
      topic.sentiment === "positive" ? "Positive" : "Negative";
    const sentimentBg =
      topic.sentiment === "positive"
        ? "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)"
        : "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)";

    contentHTML = `
      <div style="
        background: ${sentimentBg};
        border: 2px solid ${sentimentColor};
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 32px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      ">
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
          <div style="
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: ${sentimentColor};
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            color: white;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
          ">${topic.sentiment === "positive" ? "✓" : "⚠"}</div>
          <div>
            <div style="
              font-size: 20px;
              font-weight: 700;
              color: #1f2937;
              margin-bottom: 4px;
            ">Overall Sentiment: ${sentimentLabel}</div>
            <div style="
              font-size: 14px;
              color: #4b5563;
            ">
              Prominence: ${
                topic.prominence.charAt(0).toUpperCase() +
                topic.prominence.slice(1)
              } • ${topic.posts.length} Posts Analyzed
            </div>
          </div>
        </div>
      </div>
      <h3 style="
        font-size: 22px;
        font-weight: 700;
        margin: 0 0 20px 0;
        color: #1f2937;
      ">Relevant Tweets</h3>
      <div style="display: flex; flex-direction: column; gap: 16px;">
    `;

    topic.posts.forEach((post: Post) => {
      contentHTML += `
          <div class="tweet-item" style="
            padding: 20px;
            background: white;
            border-radius: 12px;
            position: relative;
            padding-left: 24px;
            border-left: 5px solid ${sentimentColor};
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            transition: transform 0.2s, box-shadow 0.2s;
          " onmouseover="this.style.transform='translateX(4px)'; this.style.boxShadow='0 4px 8px rgba(0, 0, 0, 0.1)'" onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='0 2px 4px rgba(0, 0, 0, 0.05)'">
            <div style="font-size: 15px; color: #1f2937; margin-bottom: 12px; line-height: 1.6;">
              "${post.text}"
            </div>
            <div style="font-size: 13px; color: #6b7280; display: flex; align-items: center; gap: 12px;">
              <span style="font-weight: 600; color: #3b82f6;">${post.username}</span>
              <span>•</span>
              <span>${post.timestamp}</span>
              <span>•</span>
              <span style="color: ${sentimentColor}; font-weight: 600;">${post.retweets} retweets</span>
            </div>
          </div>
        `;
    });

    contentHTML += `</div>`;
  }

  contentBody.innerHTML = contentHTML;
}

// Setup click handlers for tab view items to open content view
function setupTabViewItemHandlers(dashboard: HTMLElement) {
  // Get current state
  const state = stateManager.getState();

  // Find all topics that contain each post/ad
  const allPosts: { post: Post; topic: Topic }[] = [];
  const allAds: { ad: Ad; topic: Topic }[] = [];

  state.topics.forEach((topic) => {
    topic.posts.forEach((post) => {
      allPosts.push({ post, topic });
    });
    topic.ads.forEach((ad) => {
      allAds.push({ ad, topic });
    });
  });

  // Post item clicks are now handled by the PostCard component's onClick callback
  // No need to set up click handlers here since PostCard handles it internally

  // Setup ad item clicks
  const adItems = dashboard.querySelectorAll("#view-ads .list-item");
  adItems.forEach((item, index) => {
    if (index < allAds.length) {
      item.addEventListener("click", () => {
        const { topic } = allAds[index];
        showContentView(dashboard, "actionable-steps", topic);
      });
    }
  });

  // Setup topic item clicks
  const topicItems = dashboard.querySelectorAll("#view-topics .list-item");
  topicItems.forEach((item, index) => {
    const topics = stateManager.getTopics();
    if (index < topics.length) {
      item.addEventListener("click", () => {
        const topic = topics[index];
        showTopicDetail(dashboard, topic);
      });
    }
  });
}

function populatePostsView(dashboard: HTMLElement) {
  const postsView = dashboard.querySelector("#view-posts > div");
  if (!postsView) return;

  // Get posts from state manager
  const state = stateManager.getState();
  const allPosts: { post: Post; topic: Topic }[] = [];

  state.topics.forEach((topic) => {
    topic.posts.forEach((post) => {
      allPosts.push({ post, topic });
    });
  });

  // Sort by retweets (most popular first)
  allPosts.sort((a, b) => b.post.retweets - a.post.retweets);

  // Clear existing content
  postsView.innerHTML = "";

  // Create post cards using the PostCard component
  const postContainer = createPostCardContainer(allPosts, {
    showTopicContext: false,
    onClick: (post, topic) => {
      showContentView(dashboard, "analysis", topic);
    },
  });

  postsView.appendChild(postContainer);

  // Re-setup click handlers (for other views)
  setupTabViewItemHandlers(dashboard);
}

function populateAdsView(dashboard: HTMLElement) {
  const adsView = dashboard.querySelector("#view-ads > div");
  if (!adsView) return;

  // Get ads from state manager
  const state = stateManager.getState();
  const allAds: { ad: Ad; topic: Topic }[] = [];

  state.topics.forEach((topic) => {
    topic.ads.forEach((ad) => {
      allAds.push({ ad, topic });
    });
  });

  // Get brand info from insights or use defaults
  const brandName = state.insights?.brand || "Tesla";
  const brandHandle = state.insights?.brand
    ? `@${state.insights.brand.toLowerCase()}`
    : "@Tesla";
  const brandAvatarUrl =
    "https://pbs.twimg.com/profile_images/1337607516008501250/6Ggc4S5n_400x400.png";

  // Clear existing content
  adsView.innerHTML = "";

  // Create ad card container
  const adCardContainer = createAdCardContainer(allAds, {
    brandName,
    brandHandle,
    brandAvatarUrl,
    onClick: (ad, topic) => {
      showContentView(dashboard, "actionable-steps", topic);
    },
  });

  adsView.appendChild(adCardContainer);

  // Re-setup click handlers
  setupTabViewItemHandlers(dashboard);
}

function populateTopicsView(dashboard: HTMLElement) {
  const topicsView = dashboard.querySelector("#view-topics > div");
  if (!topicsView) return;

  // Get topics from state manager and sort by prominence and mention count
  const topics = stateManager.getTopics();
  const sortedTopics = [...topics].sort((a, b) => {
    const prominenceOrder = { high: 3, medium: 2, low: 1 };
    if (prominenceOrder[a.prominence] !== prominenceOrder[b.prominence]) {
      return prominenceOrder[b.prominence] - prominenceOrder[a.prominence];
    }
    return b.mentionCount - a.mentionCount;
  });

  let topicsHTML = "";
  sortedTopics.forEach((topic) => {
    const sentimentColor =
      topic.sentiment === "positive"
        ? "#17bf63"
        : topic.sentiment === "negative"
        ? "#e0245e"
        : "#f59e0b";

    topicsHTML += `
      <div class="list-item" style="
        padding: 16px;
        border-bottom: 1px solid #e1e8ed;
        cursor: pointer;
      " onmouseover="this.style.background='#f7f9fa'" onmouseout="this.style.background='#ffffff'">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
          <span style="
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: ${sentimentColor};
            display: inline-block;
          "></span>
          <span style="font-size: 14px; color: #14171a; font-weight: 500;">
            ${topic.text}
          </span>
        </div>
        <div style="font-size: 12px; color: #657786; display: flex; gap: 16px;">
          <span>${
            topic.prominence.charAt(0).toUpperCase() + topic.prominence.slice(1)
          } Prominence</span>
          <span>${topic.mentionCount} mentions</span>
          <span style="color: ${sentimentColor}; font-weight: 600;">${
      topic.sentiment.charAt(0).toUpperCase() + topic.sentiment.slice(1)
    }</span>
        </div>
      </div>
    `;
  });

  topicsView.innerHTML = topicsHTML;

  // Re-setup click handlers
  setupTabViewItemHandlers(dashboard);
}

function showTopicDetail(dashboard: HTMLElement, topic: Topic) {
  const graphView = dashboard.querySelector("#view-graph") as HTMLElement;
  const detailView = dashboard.querySelector("#detail-view") as HTMLElement;
  const detailTitle = dashboard.querySelector(
    "#detail-topic-title"
  ) as HTMLElement;
  const detailContent = dashboard.querySelector(
    "#detail-content"
  ) as HTMLElement;

  if (!graphView || !detailView || !detailTitle || !detailContent) return;

  // Hide graph, show detail
  graphView.style.display = "none";
  detailView.style.display = "block";

  // Set topic title
  const sentimentColor = topic.sentiment === "positive" ? "#17bf63" : "#e0245e";
  detailTitle.innerHTML = `
    <span style="
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${sentimentColor};
      margin-right: 8px;
      vertical-align: middle;
    "></span>
    ${topic.text}
    <span style="
      font-size: 12px;
      font-weight: 500;
      color: #657786;
      background: #f7f9fa;
      padding: 4px 8px;
      border-radius: 12px;
      margin-left: 8px;
    ">${
      topic.prominence.charAt(0).toUpperCase() + topic.prominence.slice(1)
    } Prominence</span>
  `;

  // Build detail content
  let contentHTML = "";

  // Tweets section
  contentHTML += `
    <div style="
      background: #ffffff;
      border: 1px solid #e1e8ed;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    ">
      <button class="tweets-header" style="
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
        <span>Relevant Posts (${topic.posts.length})</span>
        <span class="tweets-arrow" style="transition: transform 0.2s; color: #657786;">▼</span>
      </button>
      <div class="tweets-content" style="display: none;">
        <div class="tweets-list" style="
          display: flex;
          flex-direction: column;
          gap: 12px;
        ">
  `;

  topic.posts.forEach((post: Post) => {
    const postSentimentColor =
      post.sentiment === "positive"
        ? "#17bf63"
        : post.sentiment === "negative"
        ? "#e0245e"
        : "#f59e0b";
    contentHTML += `
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
          background: ${postSentimentColor};
          border-radius: 8px 0 0 8px;
        "></div>
        <div style="font-size: 14px; color: #14171a; margin-bottom: 4px;">
          "${post.text}"
        </div>
        <div style="font-size: 12px; color: #657786;">
          ${post.username} • ${post.timestamp} • ${post.retweets} retweets
        </div>
      </div>
    `;
  });

  contentHTML += `
        </div>
      </div>
    </div>
  `;

  // Actionable Steps section
  contentHTML += `
    <div style="
      background: #ffffff;
      border: 1px solid #e1e8ed;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    ">
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
        <span>Actionable Steps & Ad Suggestions (${topic.ads.length})</span>
        <span class="actionable-arrow" style="transition: transform 0.2s; color: #657786;">▼</span>
      </button>
      <div class="actionable-content" style="display: none;">
        <div style="
          background: #0f172a;
          color: #e2e8f0;
          border-radius: 8px;
          padding: 14px;
          margin-bottom: 12px;
          line-height: 1.5;
          box-shadow: 0 4px 10px rgba(15, 23, 42, 0.15);
        ">
          <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #a5b4fc; margin-bottom: 6px;">
            Playbook
          </div>
          <div style="font-size: 14px;">
            ${
              topic.actionableStep ||
              "We're preparing an actionable playbook for this topic."
            }
          </div>
        </div>
  `;

  topic.ads.forEach((ad: Ad) => {
    contentHTML += `
      <div class="ad-suggestion" style="
        background: #f7f9fa;
        border: 1px solid #e1e8ed;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
      ">
        <div style="display: flex; gap: 16px; margin-bottom: 12px;">
          <div style="
            width: 120px;
            height: 120px;
            background: #ffffff;
            border: 1px solid #e1e8ed;
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
            ">Ad Suggestion: ${ad.title}</h4>
            <div style="
              font-size: 12px;
              color: #657786;
              margin-bottom: 12px;
            ">
              <div>Target: ${ad.target}</div>
              <div>Format: ${ad.format}</div>
              <div>CTA: "${ad.cta}"</div>
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
    `;
  });

  contentHTML += `
      </div>
    </div>
  `;

  detailContent.innerHTML = contentHTML;

  // Setup back button
  const backBtn = dashboard.querySelector("#back-to-graph-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      graphView.style.display = "block";
      detailView.style.display = "none";
    });
  }

  // Re-setup interactions for the new content
  setupDashboardInteractions(dashboard);
}
