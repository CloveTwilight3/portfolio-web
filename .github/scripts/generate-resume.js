const fs = require('fs');
const path = require('path');

// Your GitHub username
const username = 'clovetwilight3';

async function generateResume() {
  try {
    // Import Octokit using dynamic import
    const { Octokit } = await import('@octokit/rest');
    
    // Initialize Octokit with GitHub token from environment
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
    
    // Fetch repositories (excluding forks)
    const { data: repos } = await octokit.repos.listForUser({
      username: username,
      type: 'owner',
      sort: 'updated',
      direction: 'desc'
    });
    
    // Filter out forks and specific repositories to ignore
    const reposToIgnore = ['clovetwilight3', 'clovetwilight3.github.io'];
    const filteredRepos = repos.filter(repo => !repo.fork && !reposToIgnore.includes(repo.name));
    
    // Get user data
    const { data: userData } = await octokit.users.getByUsername({
      username: username
    });
    
    // Generate a simple HTML resume that can be converted to PDF
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Clove Twilight - Resume</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #6c5ce7;
                padding-bottom: 20px;
            }
            h1, h2, h3 {
                color: #6c5ce7;
            }
            .contact-info {
                display: flex;
                justify-content: center;
                flex-wrap: wrap;
                gap: 20px;
                margin: 20px 0;
            }
            section {
                margin-bottom: 40px;
            }
            .project {
                margin-bottom: 15px;
                border-left: 3px solid #6c5ce7;
                padding-left: 15px;
            }
            .project h3 {
                margin-bottom: 5px;
            }
            .skills {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-top: 10px;
            }
            .skill {
                background-color: #f0f0f0;
                padding: 5px 10px;
                border-radius: 3px;
                font-size: 14px;
            }
            .github-stats {
                display: flex;
                gap: 20px;
                justify-content: space-between;
                flex-wrap: wrap;
            }
            .stat-box {
                background-color: #f5f5f5;
                padding: 15px;
                border-radius: 5px;
                flex: 1;
                min-width: 150px;
                text-align: center;
            }
            .stat-number {
                font-size: 24px;
                font-weight: bold;
                color: #6c5ce7;
            }
        </style>
    </head>
    <body>
        <header>
            <h1>Clove Twilight</h1>
            <p>Developer • Linux Enthusiast • Minecraft Modder</p>
            <div class="contact-info">
                <span>📧 admin@clovetwilight3.co.uk</span>
                <span>🌐 clovetwilight3.co.uk</span>
                <span>💻 github.com/clovetwilight3</span>
                <span>💬 Discord: CloveTwilight3</span>
            </div>
        </header>
        
        <section>
            <h2>About Me</h2>
            <p>I am a passionate developer focusing on building creative solutions with code, from Discord bots to Minecraft plugins. 
            I have experience with multiple programming languages and frameworks, with a particular 
            interest in gaming-related development and automation.</p>
            </section>
        
        <section>
            <h2>Technical Skills</h2>
            <div class="skills">
                <div class="skill">JavaScript</div>
                <div class="skill">TypeScript</div>
                <div class="skill">Java</div>
                <div class="skill">Python</div>
                <div class="skill">Kotlin</div>
                <div class="skill">Rust</div>
                <div class="skill">Node.js</div>
                <div class="skill">Express</div>
                <div class="skill">Flask</div>
                <div class="skill">MongoDB</div>
                <div class="skill">SQL</div>
                <div class="skill">HTML5</div>
                <div class="skill">CSS3</div>
                <div class="skill">React</div>
                <div class="skill">Vue.js</div>
                <div class="skill">Discord.js</div>
                <div class="skill">Spigot/Bukkit</div>
                <div class="skill">Forge Modding</div>
                <div class="skill">Git/GitHub</div>
                <div class="skill">GitHub Actions</div>
                <div class="skill">Docker</div>
                <div class="skill">Linux</div>
                <div class="skill">CI/CD</div>
            </div>
        </section>
        
        <section>
            <h2>Featured Projects</h2>
            ${filteredRepos.slice(0, 5).map(repo => `
                <div class="project">
                    <h3>${repo.name}</h3>
                    <p>${repo.description || 'No description provided.'}</p>
                    <p><strong>Technologies:</strong> ${repo.language || 'Not specified'}</p>
                    <p><strong>GitHub:</strong> <a href="${repo.html_url}">${repo.html_url}</a></p>
                </div>
            `).join('')}
        </section>
        
        <section>
            <h2>GitHub Stats</h2>
            <div class="github-stats">
                <div class="stat-box">
                    <div class="stat-number">${filteredRepos.length}</div>
                    <div>Projects</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">${filteredRepos.reduce((sum, repo) => sum + repo.stargazers_count, 0)}</div>
                    <div>Stars</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">${filteredRepos.reduce((sum, repo) => sum + repo.forks_count, 0)}</div>
                    <div>Forks</div>
                </div>
            </div>
        </section>
        
        <section>
            <h2>Additional Information</h2>
            <p>This resume was automatically generated from my GitHub profile. For the most up-to-date information, 
            please visit my portfolio at <a href="https://clovetwilight3.co.uk">clovetwilight3.co.uk</a>.</p>
        </section>
    </body>
    </html>
    `;
    
    // Write to resume.html file
    fs.writeFileSync(path.join(process.cwd(), 'resume.html'), html);
    console.log('Resume HTML generated successfully!');
    
    // Since GitHub Pages can serve HTML directly, we don't necessarily need a PDF
    // We'll create a simple redirect file that will allow /resume.pdf to work
    const pdfRedirect = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="refresh" content="0; url=resume.html">
        <title>Redirecting to Resume</title>
    </head>
    <body>
        <p>If you are not redirected automatically, <a href="resume.html">click here</a>.</p>
    </body>
    </html>
    `;
    
    fs.writeFileSync(path.join(process.cwd(), 'resume.pdf'), pdfRedirect);
    console.log('Resume PDF redirect created successfully!');
    
  } catch (error) {
    console.error('Error generating resume:', error);
  }
}

// Run the function
generateResume();
