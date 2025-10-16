<div id="mailchimp-embed-container">
  <div class="loading-state">
    <p>Loading latest newsletter...</p>
  </div>
</div>

<style>
  #mailchimp-embed-container {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    position: relative;
  }

  .loading-state {
    text-align: center;
    padding: 60px 20px;
    color: #666;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .error-state {
    background: #fee;
    border: 1px solid #fcc;
    padding: 20px;
    border-radius: 8px;
    color: #c33;
    text-align: center;
  }

  .campaign-header {
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #f0f0f0;
  }

  .campaign-title {
    margin: 0 0 8px 0;
    font-size: 1.5em;
    color: #333;
  }

  .campaign-date {
    font-size: 0.9em;
    color: #999;
  }

  .campaign-content {
    width: 100%;
    background: #fff;
  }

  /* Responsive */
  @media (max-width: 768px) {
    #mailchimp-embed-container {
      max-width: 100%;
      padding: 0 15px;
    }
  }
</style>

<script>
  // Configuration - UPDATE THIS URL WITH YOUR VERCEL URL!
  const CONFIG = {
    apiUrl: 'https://mailchimp-embed.vercel.app/api/latest-campaign',
    
    // Auto-refresh interval (optional) - set to 0 to disable
    refreshInterval: 3600000, // 1 hour in milliseconds
    
    // Cache duration - prevents too many API calls
    cacheMinutes: 30
  };

  let lastFetchTime = null;
  let cachedData = null;

  // Main function to load and display the latest campaign
  async function loadLatestCampaign() {
    const container = document.getElementById('mailchimp-embed-container');
    
    // Check cache first
    if (cachedData && lastFetchTime) {
      const minutesSinceFetch = (Date.now() - lastFetchTime) / 1000 / 60;
      if (minutesSinceFetch < CONFIG.cacheMinutes) {
        displayCampaign(cachedData);
        return;
      }
    }

    try {
      const response = await fetch(CONFIG.apiUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch campaign: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'No campaign available');
      }

      // Cache the data
      cachedData = data;
      lastFetchTime = Date.now();

      // Display the campaign
      displayCampaign(data);

    } catch (error) {
      console.error('Error loading campaign:', error);
      showError(error.message);
    }
  }

  // Display the campaign HTML directly
  function displayCampaign(data) {
    const container = document.getElementById('mailchimp-embed-container');
    
    // Format the send date
    const sendDate = data.sendTime 
      ? new Date(data.sendTime).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : '';

    // If we have HTML content, display it directly
    if (data.htmlContent) {
      container.innerHTML = `
        <div class="campaign-header">
          <h2 class="campaign-title">${data.subject || data.title}</h2>
          ${sendDate ? `<div class="campaign-date">Sent ${sendDate}</div>` : ''}
        </div>
        <div class="campaign-content">
          ${data.htmlContent}
        </div>
      `;
    } else {
      // Fallback: link to archive
      container.innerHTML = `
        <div class="campaign-header">
          <h2 class="campaign-title">${data.subject || data.title}</h2>
          ${sendDate ? `<div class="campaign-date">Sent ${sendDate}</div>` : ''}
        </div>
        <div style="text-align: center; padding: 40px;">
          <a href="${data.archiveUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; background: #007C89; color: white; text-decoration: none; border-radius: 4px;">
            View Latest Newsletter
          </a>
        </div>
      `;
    }
  }

  // Show error message
  function showError(message) {
    const container = document.getElementById('mailchimp-embed-container');
    container.innerHTML = `
      <div class="error-state">
        <strong>Unable to load newsletter</strong>
        <p>${message}</p>
        <button onclick="loadLatestCampaign()" style="margin-top: 15px; padding: 8px 16px; cursor: pointer;">
          Try Again
        </button>
      </div>
    `;
  }

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', function() {
    loadLatestCampaign();

    // Set up auto-refresh if configured
    if (CONFIG.refreshInterval > 0) {
      setInterval(loadLatestCampaign, CONFIG.refreshInterval);
    }
  });

  // Optional: Reload when page becomes visible again
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden && cachedData) {
      const minutesSinceFetch = (Date.now() - lastFetchTime) / 1000 / 60;
      if (minutesSinceFetch > CONFIG.cacheMinutes) {
        loadLatestCampaign();
      }
    }
  });
</script>
