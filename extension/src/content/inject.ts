// Content script that injects into X Ads Console pages

console.log('BrandPulse Extension: Content script loaded');

// Track BrandPulse view state
let isBrandPulseActive = false;
let mainContentObserver: MutationObserver | null = null;
let originalContent: HTMLElement | null = null;

// Wait for page to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  console.log('BrandPulse Extension: Initializing injection');
  
  // Check if we're on an ads console page
  if (isAdsConsolePage()) {
    waitForSidebar();
    setupMainContentObserver();
  }
}

function isAdsConsolePage(): boolean {
  const url = window.location.href;
  return url.includes('ads.twitter.com') || url.includes('ads.x.com');
}

function waitForSidebar() {
  console.log('BrandPulse: Waiting for sidebar to appear...');
  
  // Try immediate injection first
  if (tryInject()) {
    return;
  }

  // Use MutationObserver to watch for sidebar appearance
  const observer = new MutationObserver((mutations, obs) => {
    console.log('BrandPulse: DOM changed, checking for sidebar...');
    if (tryInject()) {
      obs.disconnect();
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
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
      console.error('BrandPulse: Failed to find sidebar after', maxAttempts, 'attempts');
      clearInterval(interval);
      observer.disconnect();
      
      // Debug: log what we can find
      console.log('BrandPulse: Debug - Available elements:');
      console.log('- NavigationSidebar-itemGroup:', document.querySelectorAll('.NavigationSidebar-itemGroup').length);
      console.log('- NavigationSidebar-item:', document.querySelectorAll('.NavigationSidebar-item').length);
      console.log('- All elements with NavigationSidebar:', document.querySelectorAll('[class*="NavigationSidebar"]').length);
    }
  }, 500);
}

function tryInject(): boolean {
  // Find the navigation sidebar list
  const navList = document.querySelector('.NavigationSidebar-itemGroup');
  
  if (!navList) {
    return false;
  }

  console.log('BrandPulse: Found NavigationSidebar-itemGroup!');

  // Check if we've already injected
  if (document.getElementById('brandpulse-nav-item')) {
    console.log('BrandPulse: Already injected, skipping');
    return true;
  }

  // Create a new navigation item matching the structure
  const brandPulseItem = document.createElement('li');
  brandPulseItem.id = 'brandpulse-nav-item';
  brandPulseItem.className = 'NavigationSidebar-item';
  brandPulseItem.setAttribute('role', 'presentation');

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
    child => child.tagName === 'LI' && child.classList.contains('NavigationSidebar-item')
  ) as HTMLElement | undefined;
  
  if (firstChild && navList.contains(firstChild)) {
    // firstChild is a direct child, safe to insert before
    navList.insertBefore(brandPulseItem, firstChild);
    console.log('BrandPulse: Inserted before first item');
  } else {
    // Use prepend to add at the beginning, or append if prepend not available
    if (navList.firstChild) {
      navList.insertBefore(brandPulseItem, navList.firstChild);
    } else {
      navList.appendChild(brandPulseItem);
    }
    console.log('BrandPulse: Inserted at beginning of nav list');
  }

  // Add click handler to show BrandPulse view
  const button = brandPulseItem.querySelector('#brandpulse-nav-button');
  
  if (button) {
    button.addEventListener('click', () => {
      // Remove is-selected from all other navigation items
      document.querySelectorAll('.NavigationSidebar-item.is-selected').forEach(item => {
        if (item !== brandPulseItem) {
          item.classList.remove('is-selected');
        }
      });
      
      // Add is-selected class to BrandPulse item
      brandPulseItem.classList.add('is-selected');
      
      showBrandPulseView();
      // Update button state
      button.setAttribute('aria-expanded', 'true');
    });
  }
  
  // Watch for clicks on other sidebar items to remove selection from BrandPulse
  const sidebar = document.querySelector('.NavigationSidebar');
  if (sidebar) {
    sidebar.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      // Check if clicked item is a navigation button (but not BrandPulse)
      const clickedItem = target.closest('.NavigationSidebar-item');
      if (clickedItem && clickedItem !== brandPulseItem) {
        brandPulseItem.classList.remove('is-selected');
        isBrandPulseActive = false;
      }
    });
  }

  console.log('BrandPulse: Successfully injected into sidebar!');
  return true;
}

function setupMainContentObserver() {
  // Watch for changes to main content container (React re-renders)
  mainContentObserver = new MutationObserver((mutations) => {
    if (isBrandPulseActive) {
      // Check if our BrandPulse UI was removed
      const dashboard = document.getElementById('brandpulse-dashboard');
      if (!dashboard) {
        console.log('BrandPulse: Dashboard was removed, re-injecting...');
        // Small delay to let React finish its update
        setTimeout(() => {
          showBrandPulseView();
        }, 100);
      }
    }
  });

  // Start observing when main content container appears
  const observeMainContent = () => {
    const mainContainer = document.querySelector('#mainContentContainer') || document.querySelector('main');
    if (mainContainer) {
      mainContentObserver?.observe(mainContainer, {
        childList: true,
        subtree: true
      });
      console.log('BrandPulse: Main content observer set up');
    } else {
      // Retry if not found
      setTimeout(observeMainContent, 500);
    }
  };

  observeMainContent();
}

function showBrandPulseView() {
  console.log('BrandPulse: Showing BrandPulse view');
  isBrandPulseActive = true;

  // Find main content container
  const mainContainer = document.querySelector('#mainContentContainer') as HTMLElement;
  
  if (!mainContainer) {
    console.error('BrandPulse: Could not find mainContentContainer');
    return;
  }

  // Save original content if not already saved
  if (!originalContent) {
    originalContent = mainContainer.cloneNode(true) as any as HTMLElement;
  }

  // Replace content with BrandPulse UI
  mainContainer.innerHTML = createBrandPulseUI();

  console.log('BrandPulse: Dashboard injected into main content area');
}

function createBrandPulseUI(): string {
  return `
    <div id="brandpulse-dashboard" style="
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #14171a;
      background: #ffffff;
      min-height: 100vh;
    ">
      <header style="margin-bottom: 32px; border-bottom: 1px solid #e1e8ed; padding-bottom: 16px;">
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
        ">Brand insights, sentiment analysis, and content generation</p>
      </header>

      <div class="brandpulse-panels" style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 24px;
      ">
        <!-- Top Tweets Panel -->
        <section id="top-tweets-panel" style="
          background: #ffffff;
          border: 1px solid #e1e8ed;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        ">
          <h2 style="
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 16px 0;
            color: #14171a;
          ">Top Tweets</h2>
          <div style="
            color: #657786;
            font-size: 14px;
            padding: 20px;
            text-align: center;
            background: #f7f9fa;
            border-radius: 4px;
          ">
            Tweet data will appear here
          </div>
        </section>

        <!-- Topic Sentiment Panel -->
        <section id="sentiment-panel" style="
          background: #ffffff;
          border: 1px solid #e1e8ed;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        ">
          <h2 style="
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 16px 0;
            color: #14171a;
          ">Topic Sentiment</h2>
          <div style="
            color: #657786;
            font-size: 14px;
            padding: 20px;
            text-align: center;
            background: #f7f9fa;
            border-radius: 4px;
          ">
            Sentiment analysis will appear here
          </div>
        </section>

        <!-- Suggestions Panel -->
        <section id="suggestions-panel" style="
          background: #ffffff;
          border: 1px solid #e1e8ed;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        ">
          <h2 style="
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 16px 0;
            color: #14171a;
          ">Actionable Suggestions</h2>
          <div style="
            color: #657786;
            font-size: 14px;
            padding: 20px;
            text-align: center;
            background: #f7f9fa;
            border-radius: 4px;
          ">
            Suggestions will appear here
          </div>
        </section>

        <!-- Content Generator Panel -->
        <section id="content-generator-panel" style="
          background: #ffffff;
          border: 1px solid #e1e8ed;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        ">
          <h2 style="
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 16px 0;
            color: #14171a;
          ">Content Generator</h2>
          <div style="
            color: #657786;
            font-size: 14px;
            padding: 20px;
            text-align: center;
            background: #f7f9fa;
            border-radius: 4px;
          ">
            Meme and ad generation will appear here
          </div>
        </section>
      </div>
    </div>
  `;
}

