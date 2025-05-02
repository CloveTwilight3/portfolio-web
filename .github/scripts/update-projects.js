const fs = require('fs');
const path = require('path');

// Your GitHub username - replace with your actual username
const username = 'clovetwilight3';

async function main() {
  try {
    // Import Octokit using dynamic import
    const { Octokit } = await import('@octokit/rest');
    
    // Initialize Octokit with GitHub token from environment
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
    
    // Fetch repositories (excluding forks)
    const repos = await fetchRepositories(octokit);
    
    // Check if we need to preserve timestamps
    const preserveTimestamps = process.env.PRESERVE_TIMESTAMPS === 'true';
    
    // Load existing projects content to check for changes and preserve timestamps if needed
    const existingContent = loadExistingContent(preserveTimestamps);
    
    // Generate markdown content for projects
    const projectsContent = generateProjectsMarkdown(repos, existingContent, preserveTimestamps);
    
    // Only update if there are actual content changes
    if (hasContentChanged(existingContent.projects, projectsContent)) {
      // Update README.md
      await updateReadme(projectsContent);
      
      // Create a dedicated projects page
      await updateProjectsPage(projectsContent);
      
      console.log('Projects updated with significant changes.');
    } else {
      console.log('No significant project changes detected. Skipping update.');
    }
    
  } catch (error) {
    console.error('Error in main function:', error);
    process.exit(1);
  }
}

// Function to check if content has meaningful changes (ignoring timestamps)
function hasContentChanged(oldContent, newContent) {
  if (!oldContent) return true; // No old content, definitely changed
  
  // Remove all timestamp lines for comparison
  const cleanOld = oldContent.replace(/Last updated:.*?\n/g, '');
  const cleanNew = newContent.replace(/Last updated:.*?\n/g, '');
  
  // Compare the clean versions
  return cleanOld !== cleanNew;
}

// Load existing content from files
function loadExistingContent(preserveTimestamps) {
  const result = {
    projects: '',
    timestamps: {}
  };
  
  if (preserveTimestamps) {
    try {
      // Try to read existing projects.md
      const projectsPath = path.join(process.cwd(), 'projects.md');
      if (fs.existsSync(projectsPath)) {
        const content = fs.readFileSync(projectsPath, 'utf8');
        result.projects = content;
        
        // Extract timestamps for each project
        const timestampRegex = /### \[(.*?)\].*?\n\n[\s\S]*?Last updated: (.*?)\n\n/g;
        let match;
        while ((match = timestampRegex.exec(content)) !== null) {
          result.timestamps[match[1]] = match[2];
        }
        
        console.log(`Loaded ${Object.keys(result.timestamps).length} existing timestamps`);
      }
    } catch (error) {
      console.warn('Warning: Could not load existing content:', error.message);
    }
  }
  
  return result;
}

async function fetchRepositories(octokit) {
  try {
    // Fetch all public repositories for the user
    const { data: repos } = await octokit.repos.listForUser({
      username: username,
      type: 'owner',
      sort: 'updated',
      direction: 'desc'
    });
    
    // Check if we should include all repositories
    const includeAllRepos = process.env.INCLUDE_ALL_REPOS === 'true';
    
    // Filter out forks and specific repositories to ignore (if not including all)
    let filteredRepos;
    if (includeAllRepos) {
      console.log('Including all non-fork repositories (including profile and portfolio)');
      filteredRepos = repos.filter(repo => !repo.fork);
    } else {
      const reposToIgnore = ['clovetwilight3', 'clovetwilight3.github.io'];
      filteredRepos = repos.filter(repo => !repo.fork && !reposToIgnore.includes(repo.name));
      console.log(`Filtering out [${reposToIgnore.join(', ')}] repositories`);
    }
    
    console.log(`Found ${filteredRepos.length} original repositories`);
    
    // For each repository, check if it's an archive
    for (const repo of filteredRepos) {
      // Check if repository is an archive based on description or name
      if (repo.name === 'TransGamers' || 
          (repo.description && repo.description.toLowerCase().includes('archive'))) {
        repo.isArchive = true;
      }
    }
    
    return filteredRepos;
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return [];
  }
}

function formatDateTime(dateString, existingTimestamps, repoName, preserveTimestamps) {
  // If we're preserving timestamps and have an existing one for this repo, use it
  if (preserveTimestamps && existingTimestamps && existingTimestamps[repoName]) {
    return existingTimestamps[repoName];
  }
  
  const date = new Date(dateString);
  
  // Format date as "Day Month Year"
  const day = date.getDate();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  
  // Format time as "HH:MM"
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  // Add time zone information (GitHub Actions runs in UTC)
  return `${hours}:${minutes} ${day} ${month}, ${year} (UTC)`;
}

function generateProjectsMarkdown(repos, existingContent, preserveTimestamps) {
  if (repos.length === 0) {
    return '## Projects\n\nNo original projects found (excluding ignored repositories).';
  }
  
  let markdown = '## Projects\n\n';
  
  repos.forEach(repo => {
    let projectTitle = `### [${repo.name}](${repo.html_url})`;
    
    // Add archive marker if it's an archive
    if (repo.isArchive) {
      projectTitle += ' [ARCHIVE]';
    }
    
    markdown += `${projectTitle}\n\n`;
    
    // Special handling for specific repositories
    if (repo.name === 'TransGamers') {
      markdown += 'A public archive of a Discord Bot I have helped towards. This repository is maintained as an archive for reference purposes.\n\n';
    } else if (repo.name === 'clovetwilight3.github.io') {
      markdown += 'My personal portfolio website with automatic GitHub project synchronization. Built with JavaScript, HTML, and CSS.\n\n';
    } else if (repo.name === 'clovetwilight3') {
      markdown += 'My GitHub profile repository with custom README and configuration.\n\n';
    } else {
      markdown += repo.description ? `${repo.description}\n\n` : 'No description provided.\n\n';
    }
    
    // Add language info if available
    if (repo.language) {
      markdown += `**Language:** ${repo.language}\n\n`;
    } else if (repo.name === 'clovetwilight3') {
      markdown += `**Language:** Markdown\n\n`;
    } else if (repo.name === 'clovetwilight3.github.io') {
      markdown += `**Language:** JavaScript\n\n`;
    }
    
    // Add stars and forks count
    markdown += `⭐ ${repo.stargazers_count} | 🍴 ${repo.forks_count}\n\n`;
    
    // Add last update date WITH time and timezone, preserving existing timestamps if requested
    const lastUpdated = formatDateTime(
      repo.updated_at, 
      existingContent.timestamps, 
      repo.name, 
      preserveTimestamps
    );
    markdown += `Last updated: ${lastUpdated}\n\n`;
    
    markdown += '---\n\n';
  });
  
  return markdown;
}

async function updateReadme(projectsContent) {
  try {
    const readmePath = path.join(process.cwd(), 'README.md');
    let readmeContent = '';
    
    // Check if README.md exists
    if (fs.existsSync(readmePath)) {
      readmeContent = fs.readFileSync(readmePath, 'utf8');
      
      // Replace the projects section
      const projectsSectionRegex = /(## 🔗 Featured Projects\n\n)[\s\S]*?(## 📊 GitHub Stats)/m;
      
      if (projectsSectionRegex.test(readmeContent)) {
        readmeContent = readmeContent.replace(projectsSectionRegex, `$1${projectsContent}\n\n$2`);
      } else {
        console.log('Could not find the Featured Projects section in README.md. Section headers may have changed.');
        // Try simpler regex pattern as fallback
        const simplifiedRegex = /(## Featured Projects\n\n)[\s\S]*?(## )/m;
        if (simplifiedRegex.test(readmeContent)) {
          readmeContent = readmeContent.replace(simplifiedRegex, `$1${projectsContent}\n\n$2`);
        } else {
          console.log('Could not find any project section. Creating a new section.');
          // Just append the content before the last section
          readmeContent = readmeContent.replace(/(## .*?\n\n)$/, `${projectsContent}\n\n$1`);
        }
      }
    } else {
      // Create a new README if it doesn't exist
      readmeContent = `# ${username}'s Portfolio\n\n${projectsContent}\n\n## About Me\n\nAdd your personal information here.\n`;
    }
    
    // Write the updated content to README.md
    fs.writeFileSync(readmePath, readmeContent);
    console.log('README.md updated successfully!');
  } catch (error) {
    console.error('Error updating README.md:', error);
  }
}

async function updateProjectsPage(projectsContent) {
  try {
    // Create a dedicated projects page
    const projectsPath = path.join(process.cwd(), 'projects.md');
    fs.writeFileSync(projectsPath, `# My Projects\n\n${projectsContent}`);
    console.log('projects.md updated successfully!');
  } catch (error) {
    console.error('Error updating projects.md:', error);
  }
}

// Run the main function
main();
