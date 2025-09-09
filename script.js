// Launch Banner JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    const banner = document.getElementById('launchBanner');
    
    // Check if banner was previously closed
    if (localStorage.getItem('launchBannerClosed') === 'true') {
        banner.classList.add('banner-hidden');
    }
    
    // Initialize banner visibility logging
    logBannerVisibility();
    
    // Add resize listener to handle orientation changes on mobile
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
});

function closeBanner() {
    const banner = document.getElementById('launchBanner');
    banner.classList.add('banner-hidden');
    
    // Remember that user closed the banner
    localStorage.setItem('launchBannerClosed', 'true');
    
    console.log('Launch banner closed by user');
}

function showBanner() {
    const banner = document.getElementById('launchBanner');
    banner.classList.remove('banner-hidden');
    
    // Clear the closed state
    localStorage.removeItem('launchBannerClosed');
    
    console.log('Launch banner shown');
}

function handleResize() {
    // Log when resize happens to help debug mobile issues
    console.log('Window resized to:', window.innerWidth, 'x', window.innerHeight);
    logBannerVisibility();
}

function handleOrientationChange() {
    // Handle mobile orientation changes
    setTimeout(() => {
        console.log('Orientation changed, new dimensions:', window.innerWidth, 'x', window.innerHeight);
        logBannerVisibility();
    }, 100);
}

function logBannerVisibility() {
    const banner = document.getElementById('launchBanner');
    const isVisible = !banner.classList.contains('banner-hidden');
    const rect = banner.getBoundingClientRect();
    
    console.log('Banner visibility check:', {
        isVisible: isVisible,
        displayStyle: window.getComputedStyle(banner).display,
        dimensions: {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left
        },
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight
        },
        isMobile: window.innerWidth <= 768
    });
}

// Debug function to force show banner (for testing)
function debugShowBanner() {
    showBanner();
    logBannerVisibility();
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        closeBanner,
        showBanner,
        logBannerVisibility
    };
}