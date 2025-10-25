import { fetchJSON, renderProjects } from '../global.js';

(async function () {
  const projects = await fetchJSON('../lib/projects.json');

  if (!projects) {
    console.error("No projects loaded.");
    return;
  }

  const projectsContainer = document.querySelector('.projects');

  if (!projectsContainer) {
    console.error("No .projects container found in the HTML.");
    return;
  }

  renderProjects(projects, projectsContainer, 'h2');

  const titleEl = document.querySelector('.projects-title');
  if (titleEl) {
    titleEl.textContent = `${projects.length} Projects`;
  }
})();
