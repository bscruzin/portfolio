import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

(async function () {
  const projects = await fetchJSON('./lib/projects.json');

  if (!projects) {
    console.error("No projects loaded.");
    return;
  }

  const latestProjects = projects.slice(0, 3);

  const projectsContainer = document.querySelector('.projects');

  if (!projectsContainer) {
    console.error("No .projects container found in the HTML.");
    return;
  }
  
  renderProjects(latestProjects, projectsContainer, 'h2');

  const githubData = await fetchGitHubData('bscruzin');

  const profileStats = document.querySelector('#profile-stats');
})();
