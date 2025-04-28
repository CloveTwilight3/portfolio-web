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
    
    // Generate markdown content for projects
    const projectsContent = generateProjectsMarkdown(repos);
    
    // Update README.md
    await updateReadme(projectsContent);
    
    // Create a dedicated projects page
    await updateProjectsPage(projectsContent);
    
  } catch (error) {
    console.error('Error in main function:', error);
    process.exit(1);
  }
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
    
    // Filter out forks
    const originalRepos = repos.filter(repo => !repo.fork);
    
    console.log(`Found ${originalRepos.length} original repositories`);
    
    return originalRepos;
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return [];
  }
}

function generateProjectsMarkdown(repos) {
  if (repos.length === 0) {
    return '## Projects\n\nNo original projects found.';
  }
  
  let markdown = '## Projects\n\n';
  
  repos.forEach(repo => {
    markdown += `### [${repo.name}](${repo.html_url})\n\n`;
    markdown += repo.description ? `${repo.description}\n\n` : 'No description provided.\n\n';
    
    // Add language info if available
    if (repo.language) {
      markdown += `**Language:** ${repo.language}\n\n`;
    }
    
    // Add stars and forks count
    markdown += `⭐ ${repo.stargazers_count} | 🍴 ${repo.forks_count}\n\n`;
    
    // Add last update date
    const lastUpdated = new Date(repo.updated_at).toDateString();
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
