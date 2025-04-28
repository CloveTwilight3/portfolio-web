// Filter out forks
const originalRepos = repos.filter(repo => !repo.fork);

// For each original repository, it generates markdown with:
// - Project name and link
// - Description
// - Programming language
// - Star and fork counts
// - Last updated date

// Then it updates the README.md file by replacing 
// the section between "## Featured Projects" and "## About Me"
// It also creates a dedicated projects.md file
