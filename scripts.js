document.addEventListener('DOMContentLoaded', function() {
    // Add debugging to console
    console.log("Document loaded, initializing portfolio scripts...");
    
    // Load projects from the generated markdown file
    fetchProjects();
    
    // Set up project filtering once projects are loaded
    setupProjectFilters();
});

async function fetchProjects() {
    try {
        console.log("Attempting to fetch projects.md...");
        // First try to fetch the projects.md file
        const response = await fetch('projects.md');
        
        if (!response.ok) {
            console.error("Failed to fetch projects.md with status:", response.status);
            console.log("Falling back to GitHub API fetch method...");
            // If projects.md doesn't exist yet, try to fetch directly from GitHub API
            await fetchProjectsFromGitHub();
            return;
        }
        
        console.log("Successfully fetched projects.md");
        const markdown = await response.text();
        console.log("Markdown content length:", markdown.length);
        parseAndDisplayProjects(markdown);
    } catch (error) {
        console.error('Error fetching projects:', error);
        console.log("Trying fallback to GitHub API...");
        try {
            await fetchProjectsFromGitHub();
        } catch (fallbackError) {
            console.error("GitHub API fallback also failed:", fallbackError);
            displayErrorMessage();
        }
    }
}

async function fetchProjectsFromGitHub() {
    // Your GitHub username
    const username = 'clovetwilight3';
    
    try {
        console.log(`Fetching repositories for ${username} from GitHub API...`);
        // Fetch repositories from GitHub API
        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&direction=desc`);
        
        if (!response.ok) {
            console.error("GitHub API request failed with status:", response.status);
            throw new Error(`Failed to fetch repositories from GitHub: ${response.statusText}`);
        }
        
        const repos = await response.json();
        console.log(`Successfully fetched ${repos.length} repositories from GitHub API`);
        
        // Filter out only forks
        const originalRepos = repos.filter(repo => !repo.fork);
        console.log(`Found ${originalRepos.length} original repositories (non-forks)`);
        
        // Display projects
        displayProjects(originalRepos);
    } catch (error) {
        console.error('Error fetching from GitHub API:', error);
        displayErrorMessage();
    }
}

function parseAndDisplayProjects(markdown) {
    console.log("Parsing markdown to display projects...");
    // Remove the loading indicator
    const projectsContainer = document.getElementById('projects-container');
    projectsContainer.innerHTML = '';
    
    // Create a project grid
    const projectGrid = document.createElement('div');
    projectGrid.className = 'project-grid';
    projectsContainer.appendChild(projectGrid);
    
    // Regular expression to extract project information from markdown
    // Updated regex to match the new datetime format and look for [ARCHIVE] marker
    const projectRegex = /### \[(.*?)\]\((.*?)\)(\s*\[ARCHIVE\])?\n\n([\s\S]*?)(?:\n\n\*\*Language:\*\* (.*?)\n\n)?⭐ (\d+) \| 🍴 (\d+)\n\n(?:Last updated: (.*?)\n\n)?---/g;
    
    let match;
    let projectCount = 0;
    
    try {
        while ((match = projectRegex.exec(markdown)) !== null) {
            const [, name, url, archiveMarker, description, language, stars, forks, lastUpdated] = match;
            console.log(`Found project: ${name}, Language: ${language || "Not specified"}`);
            
            // Create project card
            const projectCard = createProjectCard({
                name,
                url,
                description: description.trim(),
                language,
                stars,
                forks,
                lastUpdated,
                // Check if this project is an archive based on the marker or name/description
                isArchive: !!archiveMarker || isArchiveProject(name, description.trim())
            });
            
            projectGrid.appendChild(projectCard);
            projectCount++;
        }
        
        console.log(`Parsed and displayed ${projectCount} projects from markdown`);
        
        if (projectCount === 0) {
            console.warn("No projects found in the markdown file.");
            displayNoProjectsMessage();
        }
    } catch (error) {
        console.error("Error parsing markdown:", error);
        displayErrorMessage();
    }
    
    // Set up project filtering
    setupProjectFilters();
}

function displayProjects(repos) {
    console.log("Displaying projects from GitHub API data...");
    // Remove the loading indicator
    const projectsContainer = document.getElementById('projects-container');
    projectsContainer.innerHTML = '';
    
    if (repos.length === 0) {
        console.warn("No repositories found in GitHub API data.");
        displayNoProjectsMessage();
        return;
    }
    
    // Create a project grid
    const projectGrid = document.createElement('div');
    projectGrid.className = 'project-grid';
    projectsContainer.appendChild(projectGrid);
    
    // Add project cards
    repos.forEach(repo => {
        console.log(`Creating card for: ${repo.name}, Language: ${repo.language || "Not specified"}`);
        const projectCard = createProjectCard({
            name: repo.name,
            url: repo.html_url,
            description: repo.description || 'No description provided.',
            language: repo.language,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            lastUpdated: formatDateTime(repo.updated_at),
            // Check if this project is an archive based on name or description
            isArchive: isArchiveProject(repo.name, repo.description || '')
        });
        
        projectGrid.appendChild(projectCard);
    });
    
    console.log(`Displayed ${repos.length} projects from GitHub API`);
    
    // Set up project filtering
    setupProjectFilters();
}

// Function to check if a project is an archive
function isArchiveProject(name, description) {
    // Check if the project name is "TransGamers" or contains archive-related keywords
    if (name === 'TransGamers') {
        return true;
    }
    
    // Check if the description contains archive-related keywords
    const archiveKeywords = ['public archive', 'archived', 'archive of'];
    return archiveKeywords.some(keyword => 
        description.toLowerCase().includes(keyword)
    );
}

// Format date and time in a more readable way
function formatDateTime(isoString) {
    try {
        const date = new Date(isoString);
        
        // Check for invalid date
        if (isNaN(date.getTime())) {
            console.warn(`Invalid date: ${isoString}`);
            return 'Unknown date';
        }
        
        // Get hours and minutes with leading zeros
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        // Get day and month
        const day = date.getDate();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                            'July', 'August', 'September', 'October', 'November', 'December'];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        
        return `${hours}:${minutes} ${day} ${month}, ${year}`;
    } catch (error) {
        console.error("Error formatting date:", error);
        return 'Date error';
    }
}

function createProjectCard(project) {
    try {
        const card = document.createElement('div');
        card.className = 'project-card';
        
        const content = document.createElement('div');
        content.className = 'project-content';
        
        // Project title with link
        const title = document.createElement('h3');
        title.className = 'project-title';
        
        // Create title container to hold the title and archive badge if needed
        const titleContainer = document.createElement('div');
        titleContainer.className = 'title-container';
        
        const titleLink = document.createElement('a');
        titleLink.href = project.url;
        titleLink.target = '_blank';
        titleLink.textContent = project.name;
        titleContainer.appendChild(titleLink);
        
        // Add archive badge if the project is an archive
        if (project.isArchive) {
            const archiveBadge = document.createElement('span');
            archiveBadge.className = 'archive-badge';
            archiveBadge.textContent = 'Archive';
            titleContainer.appendChild(archiveBadge);
        }
        
        title.appendChild(titleContainer);
        
        // Project description
        const description = document.createElement('p');
        description.className = 'project-description';
        description.textContent = project.description;
        
        // Technical stack badges
        const techStack = document.createElement('div');
        techStack.className = 'tech-stack';
        
        // Add tech badges based on language and other cues in the project name/description
        if (project.language) {
            addTechBadge(techStack, project.language);
            
            // Add related tech badges based on language
            if (project.language === 'JavaScript') {
                if (project.name.toLowerCase().includes('react') || 
                    project.description.toLowerCase().includes('react')) {
                    addTechBadge(techStack, 'React');
                }
                if (project.name.toLowerCase().includes('node') || 
                    project.description.toLowerCase().includes('node')) {
                    addTechBadge(techStack, 'Node.js');
                }
                if (project.name.toLowerCase().includes('discord') || 
                    project.description.toLowerCase().includes('discord')) {
                    addTechBadge(techStack, 'Discord.js');
                }
            } else if (project.language === 'TypeScript') {
                // TypeScript badge already added above, so we don't add it twice
                if (project.name.toLowerCase().includes('discord') || 
                    project.description.toLowerCase().includes('discord') ||
                    project.name.toLowerCase() === 'roommates-helper' ||
                    project.name.toLowerCase() === 'roommates-beta') {
                    addTechBadge(techStack, 'Discord.js');
                }
            } else if (project.language === 'Java') {
                if (project.name.toLowerCase().includes('minecraft') || 
                    project.description.toLowerCase().includes('minecraft') ||
                    project.name.toLowerCase().includes('plugin') || 
                    project.description.toLowerCase().includes('plugin') ||
                    project.name.toLowerCase().includes('spigot') ||
                    project.name.toLowerCase().includes('bukkit')) {
                    addTechBadge(techStack, 'Spigot/Bukkit');
                }
            } else if (project.language === 'Python') {
                if (project.name.toLowerCase().includes('flask') || 
                    project.description.toLowerCase().includes('flask')) {
                    addTechBadge(techStack, 'Flask');
                }
                if (project.name.toLowerCase().includes('web') || 
                    project.description.toLowerCase().includes('web')) {
                    addTechBadge(techStack, 'Web');
                }
            }
        }
        
        // Add special badges for portfolio website
        if (project.name === 'clovetwilight3.github.io') {
            if (!project.language || project.language !== 'JavaScript') {
                addTechBadge(techStack, 'JavaScript');
            }
            addTechBadge(techStack, 'HTML5');
            addTechBadge(techStack, 'CSS3');
            addTechBadge(techStack, 'GitHub Pages');
        }
        
        // Project meta information
        const meta = document.createElement('div');
        meta.className = 'project-meta';
        
        const stats = document.createElement('div');
        stats.className = 'project-stats';
        stats.innerHTML = `<span><i class="fas fa-star"></i> ${project.stars}</span> <span><i class="fas fa-code-branch"></i> ${project.forks}</span>`;
        
        const updated = document.createElement('div');
        updated.className = 'project-updated';
        updated.innerHTML = project.lastUpdated ? `<i class="fas fa-clock"></i> ${project.lastUpdated}` : '';
        
        // Add action buttons
        const actions = document.createElement('div');
        actions.className = 'project-actions';
        
        // Live demo button (for certain projects)
        let demoInfo = isWebProject(project);
        
        // Special case for the portfolio itself
        if (project.name === 'clovetwilight3.github.io') {
            demoInfo = {
                url: 'https://clovetwilight3.co.uk',
                label: 'View Live Site'
            };
        }
        
        if (demoInfo) {
            const demoButton = document.createElement('a');
            demoButton.href = demoInfo.url;
            demoButton.target = '_blank';
            demoButton.className = 'project-btn demo-btn';
            demoButton.innerHTML = `<i class="fas fa-external-link-alt"></i> ${demoInfo.label}`;
            actions.appendChild(demoButton);
        }
        
        // GitHub repo button
        const githubButton = document.createElement('a');
        githubButton.href = project.url;
        githubButton.target = '_blank';
        githubButton.className = 'project-btn github-btn';
        githubButton.innerHTML = '<i class="fab fa-github"></i> View Code';
        actions.appendChild(githubButton);
        
        // Add elements to card
        content.appendChild(title);
        content.appendChild(description);
        content.appendChild(techStack);
        content.appendChild(meta);
        meta.appendChild(stats);
        meta.appendChild(updated);
        content.appendChild(actions);
        card.appendChild(content);
        
        return card;
    } catch (error) {
        console.error("Error creating project card:", error, project);
        // Return a simple error card
        const errorCard = document.createElement('div');
        errorCard.className = 'project-card error-card';
        errorCard.innerHTML = `<div class="project-content"><h3>Error displaying project</h3><p>Could not load: ${project.name || 'Unknown project'}</p></div>`;
        return errorCard;
    }
}

function addTechBadge(container, tech) {
    const badge = document.createElement('span');
    badge.className = 'tech-badge';
    badge.textContent = tech;
    
    // Add custom colors based on technology
    if (tech === 'JavaScript') {
        badge.classList.add('javascript');
    } else if (tech === 'React') {
        badge.classList.add('react');
    } else if (tech === 'TypeScript') {
        badge.classList.add('typescript');
    } else if (tech === 'Node.js') {
        badge.classList.add('nodejs');
    } else if (tech === 'Python') {
        badge.classList.add('python');
    } else if (tech === 'Java') {
        badge.classList.add('java');
    } else if (tech === 'Spigot/Bukkit') {
        badge.classList.add('minecraft');
    } else if (tech === 'Flask') {
        badge.classList.add('flask');
    } else if (tech === 'Web') {
        badge.classList.add('web');
    } else if (tech === 'Discord.js') {
        badge.classList.add('discord');
    } else if (tech === 'HTML5') {
        badge.classList.add('html');
    } else if (tech === 'CSS3') {
        badge.classList.add('css');
    } else if (tech === 'GitHub Pages') {
        badge.classList.add('github');
    } else if (tech === 'Markdown') {
        badge.classList.add('markdown');
    }
    
    container.appendChild(badge);
}

function isWebProject(project) {
    // Check for plural-web and spotify-player repos
    if (project.name.toLowerCase() === 'plural-web') {
        return {
            url: 'https://friends.clovetwilight3.co.uk',
            label: 'Live Demo'
        };
    } else if (project.name.toLowerCase() === 'spotify-player') {
        return {
            url: 'http://demo.clovetwilight3.co.uk:8080/',
            label: 'Try Demo'
        };
    } else if (project.name.toLowerCase() === 'clovetwilight3.github.io') {
        return {
            url: 'https://clovetwilight3.co.uk',
            label: 'View Live Site'
        };
    }
    
    // For all other projects, return false
    return false;
}

function displayNoProjectsMessage() {
    const projectsContainer = document.getElementById('projects-container');
    projectsContainer.innerHTML = `
        <div class="no-projects">
            <p>No original projects found. Any new non-forked repositories will appear here automatically.</p>
        </div>
    `;
}

function displayErrorMessage() {
    const projectsContainer = document.getElementById('projects-container');
    projectsContainer.innerHTML = `
        <div class="error-message">
            <p>Unable to load projects. Please try again later.</p>
            <button onclick="window.retryLoadProjects()" class="retry-btn">
                <i class="fas fa-sync-alt"></i> Retry
            </button>
        </div>
    `;
}

// Project filtering functionality
function setupProjectFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (!filterButtons.length) {
        console.log("No filter buttons found. Skipping filter setup.");
        return;
    }
    
    console.log(`Setting up ${filterButtons.length} filter buttons`);
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get the filter value
            const filterValue = this.getAttribute('data-filter');
            console.log(`Filter selected: ${filterValue}`);
            
            // Apply filtering
            filterProjects(filterValue);
        });
    });
}

function filterProjects(filter) {
    console.log(`Filtering projects by: ${filter}`);
    const projectGrid = document.querySelector('.project-grid');
    if (!projectGrid) {
        console.warn("Project grid not found. Cannot filter projects.");
        return;
    }
    
    // Add filtering class to trigger animation
    projectGrid.classList.add('filtering');
    
    // Get all project cards
    const projectCards = document.querySelectorAll('.project-card');
    console.log(`Found ${projectCards.length} project cards to filter`);
    
    setTimeout(() => {
        let visibleCount = 0;
        
        // Apply filtering logic
        projectCards.forEach(card => {
            let shouldShow = false;
            
            if (filter === 'all') {
                shouldShow = true;
            } else if (filter === 'archive') {
                // Show only archived projects
                shouldShow = !!card.querySelector('.archive-badge');
            } else {
                // Check if card has matching tech-badge or language
                const techBadges = card.querySelectorAll('.tech-badge');
                const techTexts = Array.from(techBadges).map(badge => badge.textContent.toLowerCase());
                
                // Also check project title and description
                const title = (card.querySelector('.project-title') || {textContent: ''}).textContent.toLowerCase();
                const description = (card.querySelector('.project-description') || {textContent: ''}).textContent.toLowerCase();
                
                if (filter === 'minecraft' && 
                    (techTexts.includes('spigot/bukkit') || 
                     title.includes('minecraft') || 
                     description.includes('minecraft') ||
                     title.includes('plugin') || 
                     description.includes('plugin'))) {
                    shouldShow = true;
                } else if (filter === 'discord' && 
                          (techTexts.includes('discord.js') || 
                           title.includes('discord') || 
                           description.includes('discord') ||
                           title.includes('bot') || 
                           description.includes('bot') ||
                           title.toLowerCase().includes('roommates-helper') || 
                           title.toLowerCase().includes('roommates-beta'))) {
                    shouldShow = true;
                } else if (techTexts.includes(filter.toLowerCase())) {
                    shouldShow = true;
                }
            }
            
            // Apply visibility
            card.style.display = shouldShow ? 'flex' : 'none';
            if (shouldShow) visibleCount++;
        });
        
        console.log(`Filter results: ${visibleCount} projects visible`);
        
        // Remove filtering class to finish animation
        projectGrid.classList.remove('filtering');
        
        // Show message if no projects match the filter
        if (visibleCount === 0) {
            const noMatchMessage = document.createElement('div');
            noMatchMessage.className = 'no-matches-message';
            noMatchMessage.innerHTML = `<p>No projects match the "${filter}" filter.</p>`;
            
            // Check if message already exists
            const existingMessage = projectGrid.querySelector('.no-matches-message');
            if (existingMessage) {
                projectGrid.removeChild(existingMessage);
            }
            
            projectGrid.appendChild(noMatchMessage);
        } else {
            // Remove any no matches message if it exists
            const existingMessage = projectGrid.querySelector('.no-matches-message');
            if (existingMessage) {
                projectGrid.removeChild(existingMessage);
            }
        }
    }, 300); // Match this with the CSS transition time
}

// Add a global function that can be called from the HTML to retry loading
window.retryLoadProjects = function() {
    console.log("Manual retry initiated");
    const projectsContainer = document.getElementById('projects-container');
    projectsContainer.innerHTML = '<div class="loading">Loading projects...</div>';
    fetchProjects();
};

// Add CSS for missing tech badge colors (if not already in styles.css)
function addMissingStyles() {
    // Check if styles already exist
    const styleId = 'additional-tech-badge-styles';
    if (document.getElementById(styleId)) {
        return;
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
        .tech-badge.html {
            background-color: rgba(227, 76, 38, 0.2);
            color: #e34c26;
            border-color: #e34c26;
        }
        
        .tech-badge.css {
            background-color: rgba(21, 114, 182, 0.2);
            color: #1572b6;
            border-color: #1572b6;
        }
        
        .tech-badge.github {
            background-color: rgba(110, 84, 148, 0.2);
            color: #6e5494;
            border-color: #6e5494;
        }
        
        .tech-badge.markdown {
            background-color: rgba(0, 0, 0, 0.2);
            color: #ffffff;
            border-color: #000000;
        }
        
        .no-matches-message {
            grid-column: 1 / -1;
            text-align: center;
            padding: 40px;
            color: var(--light-text);
            font-style: italic;
        }
        
        .retry-btn {
            background-color: var(--primary-color);
            color: var(--text-color);
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            margin-top: 15px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s ease;
        }
        
        .retry-btn:hover {
            background-color: var(--accent-color);
            transform: translateY(-2px);
        }
        
        .error-card {
            background-color: rgba(255, 0, 0, 0.1);
            border-color: #ff0000;
        }
    `;
    
    document.head.appendChild(styleElement);
}

// Call the function to add missing styles
addMissingStyles();
