document.addEventListener('DOMContentLoaded', function() {
    // Load projects from the generated markdown file
    fetchProjects();
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
    const projectRegex = /### \[(.*?)\]\((.*?)\)\n\n([\s\S]*?)(?:\n\n\*\*Language:\*\* (.*?)\n\n)?⭐ (\d+) \| 🍴 (\d+)\n\n(?:Last updated: (.*?)\n\n)?---/g;
    
    let match;
    let projectCount = 0;
    
    while ((match = projectRegex.exec(markdown)) !== null) {
        const [, name, url, description, language, stars, forks, lastUpdated] = match;
        
        // Create project card
        const projectCard = createProjectCard({
            name,
            url,
            description: description.trim(),
            language,
            stars,
            forks,
            lastUpdated
        });
        
        projectGrid.appendChild(projectCard);
        projectCount++;
    }
    
    if (projectCount === 0) {
        displayNoProjectsMessage();
    }
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
            lastUpdated: new Date(repo.updated_at).toDateString()
        });
        
        projectGrid.appendChild(projectCard);
    });
}

function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    const content = document.createElement('div');
    content.className = 'project-content';
    
    // Project title with link
    const title = document.createElement('h3');
    title.className = 'project-title';
    const titleLink = document.createElement('a');
    titleLink.href = project.url;
    titleLink.target = '_blank';
    titleLink.textContent = project.name;
    title.appendChild(titleLink);
    
    // Project description
    const description = document.createElement('p');
    description.className = 'project-description';
    description.textContent = project.description;
    
    // Language tag if available
    let languageTag = '';
    if (project.language) {
        languageTag = document.createElement('span');
        languageTag.className = 'language-tag';
        languageTag.textContent = project.language;
    }
    
    // Project meta information
    const meta = document.createElement('div');
    meta.className = 'project-meta';
    
    const stats = document.createElement('div');
    stats.innerHTML = `<span><i class="fas fa-star"></i> ${project.stars}</span> <span><i class="fas fa-code-branch"></i> ${project.forks}</span>`;
    
    const updated = document.createElement('div');
    updated.textContent = project.lastUpdated ? `Updated: ${project.lastUpdated.split(' ').slice(1, 3).join(' ')}` : '';
    
    // Add a small Synthwave-style detail
    stats.classList.add('project-stats');
    
    meta.appendChild(stats);
    meta.appendChild(updated);
    
    // Add elements to card
    content.appendChild(title);
    content.appendChild(description);
    if (languageTag) {
        content.appendChild(languageTag);
    }
    content.appendChild(meta);
    card.appendChild(content);
    
    return card;
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
