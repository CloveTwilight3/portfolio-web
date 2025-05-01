// Spotify Player using Implicit Grant Flow - safe for GitHub Pages
// You only need to expose your Client ID (no secrets!)

// Configuration - Only needs your public Client ID
const CLIENT_ID = 'b04666be3db24771877f4c008fc248c7';

// Your GitHub Pages URL (e.g., 'https://yourusername.github.io/repo-name')
const REDIRECT_URI = window.location.origin + window.location.pathname;

// Scopes required for accessing user's currently playing track
const SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state'
];

// Main script
document.addEventListener('DOMContentLoaded', () => {
  // Check if we need to authenticate
  const accessToken = getAccessTokenFromURL() || localStorage.getItem('spotify_access_token');
  
  if (!accessToken) {
    // No token found, show login button
    setupLoginButton();
  } else {
    // Token found, check if it's still valid
    fetchCurrentlyPlaying(accessToken)
      .then(data => {
        if (data.error && data.error.status === 401) {
          // Token expired, clear it and show login button
          localStorage.removeItem('spotify_access_token');
          setupLoginButton();
        } else {
          // Token valid, set up player
          setupPlayer(accessToken);
        }
      })
      .catch(error => {
        console.error('Error checking token:', error);
        setupLoginButton();
      });
  }
});

// Parse the access token from URL hash after redirect from Spotify
function getAccessTokenFromURL() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  
  if (params.has('access_token')) {
    const token = params.get('access_token');
    const expiresIn = params.get('expires_in');
    
    // Save token to localStorage
    localStorage.setItem('spotify_access_token', token);
    
    // Clean up the URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    return token;
  }
  
  return null;
}

// Set up the "Login with Spotify" button
function setupLoginButton() {
  const container = document.getElementById('spotify-player') || createPlayerContainer();
  
  container.innerHTML = `
    <div class="spotify-trans-content">
      <h3>Connect to Spotify</h3>
      <p>Connect your Spotify account to see your currently playing track</p>
      <button id="spotify-login-button" class="spotify-login-button">
        Login with Spotify
      </button>
    </div>
  `;
  
  document.getElementById('spotify-login-button').addEventListener('click', () => {
    // Redirect to Spotify authorization page using Implicit Grant Flow
    // This doesn't require exposing a client secret
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.append('client_id', CLIENT_ID);
    authUrl.searchParams.append('response_type', 'token'); // 'token' for implicit flow
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('scope', SCOPES.join(' '));
    authUrl.searchParams.append('show_dialog', 'true'); // Always show the auth dialog
    
    window.location.href = authUrl.toString();
  });
}

// Set up the player with a valid access token
function setupPlayer(accessToken) {
  const container = document.getElementById('spotify-player') || createPlayerContainer();
  
  // Initial player HTML (will be updated with currently playing)
  container.innerHTML = `
    <div class="spotify-trans-content">
      <div class="spotify-trans-header">
        <div class="spotify-trans-logo">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          Now playing on
        </div>
      </div>

      <div class="spotify-trans-info">
        <div class="spotify-trans-title">Loading...</div>
        <div class="spotify-trans-artist">Please wait</div>
      </div>

      <div class="spotify-trans-equalizer">
        ${Array(20).fill().map(() => `
          <div class="spotify-trans-bar" style="--random-height: ${Math.floor(Math.random() * 30)}%"></div>
        `).join('')}
      </div>

      <div style="text-align: right;">
        <span class="spotify-trans-explicit" style="visibility: hidden;">EXPLICIT</span>
      </div>
    </div>
  `;
  
  // Start polling for currently playing track
  pollCurrentlyPlaying(accessToken);
}

// Poll the Spotify API for the currently playing track
function pollCurrentlyPlaying(accessToken) {
  // Check what's playing immediately
  updatePlayerWithCurrentTrack(accessToken);
  
  // Then poll every 3 seconds
  setInterval(() => {
    updatePlayerWithCurrentTrack(accessToken);
  }, 3000);
}

// Update the player with the currently playing track
async function updatePlayerWithCurrentTrack(accessToken) {
  try {
    const data = await fetchCurrentlyPlaying(accessToken);
    
    if (!data || !data.item) {
      // Nothing playing or error
      updatePlayerNotPlaying();
      return;
    }
    
    // Update the player with the track info
    const container = document.getElementById('spotify-player');
    const titleElement = container.querySelector('.spotify-trans-title');
    const artistElement = container.querySelector('.spotify-trans-artist');
    const explicitElement = container.querySelector('.spotify-trans-explicit');
    
    // Update track name and artist
    titleElement.textContent = data.item.name;
    artistElement.textContent = data.item.artists.map(artist => artist.name).join(', ');
    
    // Update explicit label
    if (data.item.explicit) {
      explicitElement.style.visibility = 'visible';
    } else {
      explicitElement.style.visibility = 'hidden';
    }
    
    // Update the equalizer bars to simulate playing music
    animateEqualizerBars(data.is_playing);
    
  } catch (error) {
    console.error('Error updating player:', error);
    
    // If there's an authentication error, prompt for login again
    if (error.status === 401) {
      localStorage.removeItem('spotify_access_token');
      setupLoginButton();
    }
  }
}

// Update the player for when nothing is playing
function updatePlayerNotPlaying() {
  const container = document.getElementById('spotify-player');
  const titleElement = container.querySelector('.spotify-trans-title');
  const artistElement = container.querySelector('.spotify-trans-artist');
  
  titleElement.textContent = 'Nothing Playing';
  artistElement.textContent = 'Open Spotify to play music';
  
  // Stop the equalizer animation
  animateEqualizerBars(false);
}

// Animate the equalizer bars based on playback state
function animateEqualizerBars(isPlaying) {
  const bars = document.querySelectorAll('.spotify-trans-bar');
  
  if (isPlaying) {
    // If music is playing, make the bars "dance"
    bars.forEach(bar => {
      // Reset any previous animation
      bar.style.animation = 'none';
      bar.offsetHeight; // Trigger reflow
      
      // Apply random animation delay to each bar for natural effect
      const delay = Math.random() * 0.5;
      bar.style.animation = `equalize 1.5s ease-in-out ${delay}s infinite`;
    });
  } else {
    // If not playing, make the bars static and small
    bars.forEach(bar => {
      bar.style.animation = 'none';
      bar.style.height = '5px';
    });
  }
}

// Fetch the currently playing track from Spotify API
async function fetchCurrentlyPlaying(accessToken) {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    // If 204 No Content, nothing is playing
    if (response.status === 204) {
      return null;
    }
    
    // If 401 Unauthorized, token expired
    if (response.status === 401) {
      throw { status: 401, message: 'Token expired' };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching currently playing:', error);
    throw error;
  }
}

// Create the player container if it doesn't exist
function createPlayerContainer() {
  const container = document.createElement('div');
  container.id = 'spotify-player';
  container.className = 'spotify-trans-player';
  document.body.appendChild(container);
  return container;
}

// Define CSS styles for the player
document.head.insertAdjacentHTML('beforeend', `
<style>
@keyframes equalize {
  0%, 100% {
    height: calc(5px + var(--random-height, 10%));
  }
  50% {
    height: calc(30px + var(--random-height, 10%));
  }
}

/* Trans-themed Spotify Player Styles */
.spotify-trans-player {
  position: relative;
  max-width: 350px;
  border-radius: 10px;
  overflow: hidden;
  margin: 20px auto;
  padding: 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  /* Trans flag gradient background */
  background: linear-gradient(to bottom,
    #5BCEFA 0%, #5BCEFA 20%,
    #F5A9B8 20%, #F5A9B8 40%,
    #FFFFFF 40%, #FFFFFF 60%,
    #F5A9B8 60%, #F5A9B8 80%,
    #5BCEFA 80%, #5BCEFA 100%
  );
}

.spotify-trans-content {
  position: relative;
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 15px;
  z-index: 2;
}

.spotify-trans-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.spotify-trans-logo {
  display: flex;
  align-items: center;
  color: #5BCEFA; /* Trans flag light blue instead of Spotify green */
  font-size: 14px;
  font-weight: 500;
}

.spotify-trans-logo svg {
  height: 20px;
  width: 20px;
  margin-right: 8px;
  fill: #5BCEFA; /* Trans flag light blue */
}

.spotify-trans-info {
  text-align: center;
  margin: 10px 0 15px;
}

.spotify-trans-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 5px;
  word-break: break-word;
}

.spotify-trans-artist {
  font-size: 18px;
  color: #ccc;
  word-break: break-word;
}

.spotify-trans-equalizer {
  height: 40px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 2px;
  margin: 15px 0;
}

.spotify-trans-bar {
  width: 3px;
  background: #5BCEFA; /* Default to trans blue */
  border-radius: 1px;
  animation: equalize 1.5s ease-in-out infinite;
}

/* Make every third bar pink for variation */
.spotify-trans-bar:nth-child(3n) {
  background: #F5A9B8; /* Trans pink */
}

/* Make every third+1 bar white for variation */
.spotify-trans-bar:nth-child(3n+1) {
  background: #FFFFFF; /* White */
}

.spotify-trans-explicit {
  display: inline-block;
  padding: 3px 5px;
  background-color: #333;
  color: white;
  font-size: 10px;
  border-radius: 3px;
  margin-top: 10px;
}

.spotify-login-button {
  display: block;
  margin: 20px auto;
  padding: 10px 20px;
  background-color: #5BCEFA;
  color: #000;
  border: none;
  border-radius: 30px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.spotify-login-button:hover {
  background-color: #F5A9B8;
}
</style>
`);
