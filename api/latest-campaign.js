// Serverless Function: Fetches the latest sent Mailchimp campaign
// Deploy to Vercel or Netlify

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_SERVER = process.env.MAILCHIMP_SERVER; // e.g., 'us19'
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID; // Optional: filter by specific list

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      // Fetch the most recent sent campaign
      const latestCampaign = await getLatestCampaign();
      
      if (!latestCampaign) {
        return res.status(200).json({
          success: false,
          message: 'No campaigns found'
        });
      }

      // Get the campaign content to build the full archive URL
      const content = await getCampaignContent(latestCampaign.id);
      
      // Build the proper long-form archive URL
      // Format: https://us19.campaign-archive.com/?u=USER_ID&id=CAMPAIGN_WEB_ID
      const archiveUrl = latestCampaign.long_archive_url || latestCampaign.archive_url;
      
      return res.status(200).json({
        success: true,
        campaignId: latestCampaign.id,
        title: latestCampaign.settings?.title || 'Latest Campaign',
        subject: latestCampaign.settings?.subject_line || '',
        archiveUrl: archiveUrl,
        sendTime: latestCampaign.send_time,
        previewText: latestCampaign.settings?.preview_text || '',
        htmlContent: content?.html || null
      });

    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function getLatestCampaign() {
  try {
    // Fetch campaigns with status 'sent', sorted by send_time
    const url = `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0/campaigns?status=sent&sort_field=send_time&sort_dir=DESC&count=1`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MAILCHIMP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Mailchimp API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.campaigns && data.campaigns.length > 0) {
      return data.campaigns[0];
    }
    
    return null;

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
}

async function getCampaignContent(campaignId) {
  try {
    const url = `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0/campaigns/${campaignId}/content`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MAILCHIMP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Error fetching campaign content:', response.status);
      return null;
    }

    const data = await response.json();
    return {
      html: data.html,
      archive_html: data.archive_html
    };

  } catch (error) {
    console.error('Error fetching campaign content:', error);
    return null;
  }
}
