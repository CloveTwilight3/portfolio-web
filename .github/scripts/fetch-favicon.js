const fs = require('fs');
const https = require('https');
const path = require('path');

// Your GitHub username
const username = 'clovetwilight3';

async function fetchGitHubAvatar() {
  try {
    // First, fetch user data from GitHub API
    const userDataPromise = new Promise((resolve, reject) => {
      https.get(`https://api.github.com/users/${username}`, {
        headers: {
          'User-Agent': 'Node.js'
        }
      }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`Failed to fetch user data: ${res.statusCode}`));
          }
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
    
    const userData = await userDataPromise;
    const avatarUrl = userData.avatar_url;
    
    if (!avatarUrl) {
      throw new Error('No avatar URL found in GitHub user data');
    }
    
    console.log(`Found avatar URL: ${avatarUrl}`);
    
    // Download the avatar image
    const downloadPromise = new Promise((resolve, reject) => {
      https.get(avatarUrl, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download avatar: ${res.statusCode}`));
          return;
        }
        
        const data = [];
        
        res.on('data', (chunk) => {
          data.push(chunk);
        });
        
        res.on('end', () => {
          resolve(Buffer.concat(data));
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
    
    const imageBuffer = await downloadPromise;
    
    // Save as favicon.ico in the root directory
    fs.writeFileSync(path.join(process.cwd(), 'favicon.ico'), imageBuffer);
    console.log('Favicon saved successfully!');
    
    // Also save as a PNG for modern browsers
    fs.writeFileSync(path.join(process.cwd(), 'favicon.png'), imageBuffer);
    console.log('Favicon PNG saved successfully!');
    
  } catch (error) {
    console.error('Error fetching GitHub avatar:', error);
  }
}

// Run the function
fetchGitHubAvatar();
