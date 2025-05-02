document.addEventListener('DOMContentLoaded', function() {
    // Load projects from the generated markdown file
    fetchProjects();
    
    // Set up project filtering once projects are loaded
    setupProjectFilters();
});

async function fetchProjects() {
    try {
        // First try to fetch the projects.md file
        const response = await fetch('projects.md');
        
        if (!response.ok) {
            // If projects.md doesn't exist yet, try to fetch directly from GitHub API
            await fetchProjectsFromGitHub();
            return;
        }
        
        const markdown = await response.text();
        parseAndDisplayProjects(markdown);
    } catch (error) {
        console.error('Error fetching projects:', error);
        displayErrorMessage();
    }
}

async function fetchProjectsFromGitHub() {
    // Your GitHub username - replace with your actual username
    const username = 'clovetwilight3';
    
    try {
        // Fetch repositories from GitHub API
        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&direction=desc`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch repositories from GitHub');
        }
        
        const repos = await response.json();
        
        // Filter out forks
        const originalRepos = repos.filter(repo => !repo.fork);
        
        // Display projects
        displayProjects(originalRepos);
    } catch (error) {
        console.error('Error fetching from GitHub API:', error);
        displayErrorMessage();
    }
}

function parseAndDisplayProjects(markdown) {
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
    
    while ((match = projectRegex.exec(markdown)) !== null) {
        const [, name, url, archiveMarker, description, language, stars, forks, lastUpdated] = match;
        
        // Create project card
        const projectCard = createProjectCard({
            name,
            url,
            description: description.trim(),
            language,
            stars,
            forks,
            lastUpdated,
            // Check if this project is an archive based on the marker or description or name
            isArchive: !!archiveMarker || isArchiveProject(name, description.trim())
        });
        
        projectGrid.appendChild(projectCard);
        projectCount++;
    }
    
    if (projectCount === 0) {
        displayNoProjectsMessage();
    }
    
    // Set up project filtering
    setupProjectFilters();
}

function displayProjects(repos) {
    // Remove the loading indicator
    const projectsContainer = document.getElementById('projects-container');
    projectsContainer.innerHTML = '';
    
    if (repos.length === 0) {
        displayNoProjectsMessage();
        return;
    }
    
    // Create a project grid
    const projectGrid = document.createElement('div');
    projectGrid.className = 'project-grid';
    projectsContainer.appendChild(projectGrid);
    
    // Add project cards
    repos.forEach(repo => {
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

// Format date and time in a more detailed way
function formatDateTime(isoString) {
    const date = new Date(isoString);
    
    // Get hours and minutes with leading zeros
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    // Get day and month
    const day = date.getDate();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames[date.getMonth()];
    
    return `${hours}:${minutes} ${day} ${month}`;
}

function createProjectCard(project) {
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
                project.description.toLowerCase().includes('plugin')) {
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
    const demoInfo = isWebProject(project);
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
        </div>
    `;
}

// Project filtering functionality
function setupProjectFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (!filterButtons.length) return;
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get the filter value
            const filterValue = this.getAttribute('data-filter');
            
            // Apply filtering
            filterProjects(filterValue);
        });
    });
}

function filterProjects(filter) {
    const projectGrid = document.querySelector('.project-grid');
    if (!projectGrid) return;
    
    // Add filtering class to trigger animation
    projectGrid.classList.add('filtering');
    
    // Get all project cards
    const projectCards = document.querySelectorAll('.project-card');
    
    setTimeout(() => {
        // Apply filtering logic
        projectCards.forEach(card => {
            if (filter === 'all') {
                card.style.display = 'flex';
            } else if (filter === 'archive') {
                // Show only archived projects
                if (card.querySelector('.archive-badge')) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            } else {
                // Check if card has matching tech-badge or language
                const techBadges = card.querySelectorAll('.tech-badge');
                const techTexts = Array.from(techBadges).map(badge => badge.textContent.toLowerCase());
                
                // Also check project title and description
                const title = card.querySelector('.project-title').textContent.toLowerCase();
                const description = card.querySelector('.project-description').textContent.toLowerCase();
                
                if (filter === 'minecraft' && 
                    (techTexts.includes('spigot/bukkit') || 
                     title.includes('minecraft') || 
                     description.includes('minecraft') ||
                     title.includes('plugin') || 
                     description.includes('plugin'))) {
                    card.style.display = 'flex';
                } else if (filter === 'discord' && 
                          (techTexts.includes('discord.js') || 
                           title.includes('discord') || 
                           description.includes('discord') ||
                           title.includes('bot') || 
                           description.includes('bot') ||
                           title.toLowerCase().includes('roommates-helper') || 
                           title.toLowerCase().includes('roommates-beta')) {
                    card.style.display = 'flex';
                } else if (techTexts.includes(filter.toLowerCase())) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            }
        });
        
        // Remove filtering class to finish animation
        projectGrid.classList.remove('filtering');
    }, 300); // Match this with the CSS transition time
}
