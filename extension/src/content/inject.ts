// Content script that injects into X Ads Console pages

console.log('BrandPulse Extension: Content script loaded');

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
  brandPulseItem.className = 'NavigationSidebar-item NavigationSidebar-item--hasChildItemGroup';
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
          <span aria-hidden="true" class="Icon Icon--caretDown NavigationSidebar-itemEndIcon" role="img"></span>
        </span>
      </button>
    </div>
    <div id="brandpulse-panel" style="display: none; padding: 16px;">
      <p style="font-size: 12px; color: #666;">BrandPulse extension loaded</p>
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

  // Add click handler to toggle panel
  const button = brandPulseItem.querySelector('#brandpulse-nav-button');
  const panel = brandPulseItem.querySelector('#brandpulse-panel') as HTMLElement;
  
  if (button && panel) {
    button.addEventListener('click', () => {
      const isExpanded = panel.style.display !== 'none';
      panel.style.display = isExpanded ? 'none' : 'block';
      button.setAttribute('aria-expanded', (!isExpanded).toString());
    });
  }

  console.log('BrandPulse: Successfully injected into sidebar!');
  return true;
}

