import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

let query = '';
let selectedIndex = -1;

(async function () {
  const projects = await fetchJSON('../lib/projects.json');

  if (!projects) {
    console.error("No projects loaded.");
    return;
  }

  const projectsContainer = document.querySelector('.projects');
  const searchInput = document.querySelector('.searchBar');
  const titleEl = document.querySelector('.projects-title');

  if (!projectsContainer || !searchInput) {
    console.error("Missing container or search bar.");
    return;
  }

  function getFilteredProjects() {
    return projects.filter((project) => {
      const matchesQuery = Object.values(project)
        .join('\n')
        .toLowerCase()
        .includes(query);
      const matchesYear =
        selectedIndex === -1 ||
        project.year === currentData[selectedIndex].label;

      return matchesQuery && matchesYear;
    });
  }

  let currentData = []; 

  function renderPieChart(projectsGiven) {
    const svg = d3.select('#projects-pie-plot');
    svg.selectAll('path').remove();

    const legend = d3.select('.legend');
    legend.selectAll('*').remove();

    let rolledData = d3.rollups(
      projectsGiven,
      (v) => v.length,
      (d) => d.year
    );

    rolledData.sort((a, b) => d3.ascending(a[0], b[0]));

    let data = rolledData.map(([year, count]) => ({
      label: year,
      value: count
    }));
    currentData = data; 

    const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    const sliceGenerator = d3.pie().value((d) => d.value);
    const arcData = sliceGenerator(data);
    const colors = d3.scaleOrdinal(d3.schemeTableau10);

    arcData.forEach((d, i) => {
      svg
        .append('path')
        .attr('d', arcGenerator(d))
        .attr('fill', colors(i))
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .attr('class', i === selectedIndex ? 'selected' : '')
        .on('click', () => {
          selectedIndex = selectedIndex === i ? -1 : i;

          svg.selectAll('path').attr('class', (_, idx) =>
            idx === selectedIndex ? 'selected' : ''
          );
          legend.selectAll('li').attr('class', (_, idx) =>
            idx === selectedIndex ? 'legend-item selected' : 'legend-item'
          );

          const filtered = getFilteredProjects();
          projectsContainer.innerHTML = '';
          renderProjects(filtered, projectsContainer, 'h2');
          if (titleEl) titleEl.textContent = `${filtered.length} Projects`;
        });
    });

    data.forEach((d, i) => {
      legend
        .append('li')
        .attr('style', `--color:${colors(i)}`)
        .attr('class', i === selectedIndex ? 'legend-item selected' : 'legend-item')
        .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
        .on('click', () => {
          selectedIndex = selectedIndex === i ? -1 : i;

          svg.selectAll('path').attr('class', (_, idx) =>
            idx === selectedIndex ? 'selected' : ''
          );
          legend.selectAll('li').attr('class', (_, idx) =>
            idx === selectedIndex ? 'legend-item selected' : 'legend-item'
          );

          const filtered = getFilteredProjects();
          projectsContainer.innerHTML = '';
          renderProjects(filtered, projectsContainer, 'h2');
          if (titleEl) titleEl.textContent = `${filtered.length} Projects`;
        });
    });
  }

  renderProjects(projects, projectsContainer, 'h2');
  renderPieChart(projects);
  if (titleEl) titleEl.textContent = `${projects.length} Projects`;

  searchInput.addEventListener('input', (event) => {
    query = event.target.value.toLowerCase();

    const filtered = getFilteredProjects();

    projectsContainer.innerHTML = '';
    renderProjects(filtered, projectsContainer, 'h2');
    renderPieChart(filtered);
    if (titleEl) titleEl.textContent = `${filtered.length} Projects`;
  });
})();
