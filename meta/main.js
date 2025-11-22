import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

let xScale;
let yScale;

let colors = d3.scaleOrdinal(d3.schemeTableau10);

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

// SORT commits by datetime as lab requires
function processCommits(data) {
  return d3.sort(
    d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        let ret = {
          id: commit,
          url: 'https://github.com/bscruzin/portfolio/commit/' + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
        };
        Object.defineProperty(ret, 'lines', {
          value: lines,
          enumerable: false,
          writable: false,
          configurable: false,
        });
        return ret;
      }),
    (d) => d.datetime
  );
}

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time-tooltip');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');
  if (Object.keys(commit).length === 0) return;
  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', { dateStyle: 'full' });
  time.textContent = commit.datetime?.toLocaleString('en', { timeStyle: 'short' });
  author.textContent = commit.author;
  lines.textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
  document.getElementById('commit-tooltip').hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  if (!tooltip) return;
  const tooltipWidth = tooltip.offsetWidth || 200;
  const tooltipHeight = tooltip.offsetHeight || 100;
  const padding = 12;
  let x = event.clientX + padding;
  let y = event.clientY + padding;

  if (x + tooltipWidth > window.innerWidth - padding)
    x = event.clientX - tooltipWidth - padding;
  if (y + tooltipHeight > window.innerHeight - padding)
    y = event.clientY - tooltipHeight - padding;

  tooltip.style.position = 'fixed';
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
  tooltip.style.pointerEvents = 'none';
}

function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 40 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  const extent = d3.extent(commits, (d) => d.datetime);
  const paddedExtent = [
    d3.timeDay.offset(extent[0], -1),
    d3.timeHour.offset(extent[1], 12),
  ];

  xScale = d3.scaleTime().domain(paddedExtent).range([usableArea.left, usableArea.right]).nice();
  yScale = d3.scaleLinear().domain([0, 24]).range([usableArea.bottom, usableArea.top]);

  svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left},0)`)
    .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${usableArea.bottom})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%b %d')));

  svg.append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${usableArea.left},0)`)
    .call(d3.axisLeft(yScale).tickFormat((d) => String(d % 24).padStart(2, '0') + ':00'));

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([3, 20]);

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  const dots = svg.append('g').attr('class', 'dots');

  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr("style", (d) => `--r:${rScale(d.totalLines)};`)
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', updateTooltipPosition)
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  svg.call(
    d3.brush().on('start brush end', (event) => {
      const selection = event.selection;
      svg.selectAll('circle').classed('selected', (d) => {
        if (!selection) return false;
        const [[x0, y0], [x1, y1]] = selection;
        const x = xScale(d.datetime);
        const y = yScale(d.hourFrac);
        return x >= x0 && x <= x1 && y >= y0 && y <= y1;
      });
    })
  );
}

function periodOfDay(h) {
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

function computeStats(data) {
  const numFiles = d3.groups(data, (d) => d.file).length;
  const fileLengths = d3.rollups(data, (v) => d3.max(v, (r) => r.line), (d) => d.file);

  const longestFilePair = d3.greatest(fileLengths, (d) => d[1]);
  const avgFileLen = d3.mean(fileLengths, (d) => d[1]);
  const linesByPeriod = d3.rollups(
    data,
    (v) => v.length,
    (d) => periodOfDay(d.datetime.getHours())
  );

  return {
    numFiles,
    longestFile: longestFilePair?.[0],
    maxFileLen: longestFilePair?.[1] ?? 0,
    avgFileLen,
    topPeriod: d3.greatest(linesByPeriod, (d) => d[1])?.[0],
  };
}

function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  const s = computeStats(data);

  dl.append('dt').text('Number of files');
  dl.append('dd').text(s.numFiles);

  dl.append('dt').text('Longest file');
  dl.append('dd').text(s.longestFile ?? '—');

  dl.append('dt').text('Avg file length (lines)');
  dl.append('dd').text(Math.round(s.avgFileLen ?? 0));

  dl.append('dt').text('Most work time');
  dl.append('dd').text(s.topPeriod ?? '—');
}

function updateCommitInfo(data, commits) {
  d3.select('#stats').html('');
  renderCommitInfo(data, commits);
}

let data = await loadData();
let commits = processCommits(data);
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);

let filteredCommits = commits;

let commitProgress = 100;

let timeScale = d3
  .scaleTime()
  .domain([
    d3.min(commits, (d) => d.datetime),
    d3.max(commits, (d) => d.datetime),
  ])
  .range([0, 100]);

let commitMaxTime = timeScale.invert(commitProgress);

const slider = document.querySelector("#commit-progress");
const timeLabel = document.querySelector("#commit-time");

function updateFileDisplay(filteredCommits) {
  let lines = filteredCommits.flatMap((d) => d.lines);
  let files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => ({ name, lines }))
    .sort((a, b) => b.lines.length - a.lines.length);

  let filesContainer = d3
    .select('#files')
    .selectAll('div')
    .data(files, (d) => d.name)
    .join(
      (enter) =>
        enter.append('div').call((div) => {
          div.append('dt').append('code');
          div.append('dd');
        })
    );

  filesContainer.select('dt > code').html((d) => d.name);

  filesContainer
    .select('dt')
    .selectAll('small')
    .data((d) => [d])
    .join('small')
    .html((d) => `${d.lines.length} lines`);

  filesContainer
    .select('dd')
    .selectAll('div')
    .data((d) => d.lines)
    .join('div')
    .attr('class', 'loc')
    .attr('style', (d) => `--color: ${colors(d.type)}`);
}

function onTimeSliderChange() {
  commitProgress = +slider.value;
  commitMaxTime = timeScale.invert(commitProgress);

  timeLabel.textContent = commitMaxTime.toLocaleString();

  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);

  updateScatterPlot(data, filteredCommits);
  updateFileDisplay(filteredCommits);
  updateCommitInfo(data, filteredCommits);
}

slider.addEventListener("input", onTimeSliderChange);
onTimeSliderChange();

function updateScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart').select('svg');

  xScale = xScale.domain(d3.extent(commits, (d) => d.datetime));

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const xAxis = d3.axisBottom(xScale);

  const xAxisGroup = svg.select('g.x-axis');
  xAxisGroup.selectAll('*').remove();
  xAxisGroup.call(xAxis);

  const dots = svg.select('g.dots');

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr("style", (d) => `--r:${rScale(d.totalLines)};`)
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}

// ------------------------------------
// SCROLLAMA STEPS
// ------------------------------------

d3.select('#scatter-story')
  .selectAll('.step')
  .data(commits)
  .join('div')
  .attr('class', 'step')
  .html(
    (d, i) => `
      <p>
        On ${d.datetime.toLocaleString('en', {
          dateStyle: 'full',
          timeStyle: 'short',
        })},
        I made <a href="${d.url}" target="_blank">${
          i > 0
            ? 'another glorious commit'
            : 'my first commit, and it was glorious'
        }</a>.
        I edited ${d.totalLines} lines across ${
          d3.rollups(
            d.lines,
            (D) => D.length,
            (d) => d.file,
          ).length
        } files.
        Then I looked over all I had made, and I saw that it was very good.
      </p>
    `,
  );

// Update scatter plot on scroll
function onStepEnter(response) {
  const commit = response.element.__data__;
  const t = commit.datetime;

  filteredCommits = commits.filter(d => d.datetime <= t);

  updateScatterPlot(data, filteredCommits);
  updateFileDisplay(filteredCommits);
  updateCommitInfo(data, filteredCommits);
}

// Scrollama for scatter plot
const scroller = scrollama();
scroller
  .setup({
    container: "#scrolly-1",
    step: "#scrolly-1 .step",
  })
  .onStepEnter(onStepEnter);


d3.select("#file-story")
  .selectAll(".step")
  .data(commits)
  .join("div")
  .attr("class", "step")
  .html(
    (d) => `
      <p>
        This commit edited <strong>${d.totalLines}</strong> lines
        across <strong>${
          d3.rollups(d.lines, D => D.length, r => r.file).length
        }</strong> files.
      </p>
    `
  );

function onFileStepEnter(response) {
  const commit = response.element.__data__;
  const t = commit.datetime;

  const filtered = commits.filter(d => d.datetime <= t);

  updateFileDisplay(filtered);
}

const scroller2 = scrollama();
scroller2
  .setup({
    container: "#scrolly-2",
    step: "#scrolly-2 .step",
  })
  .onStepEnter(onFileStepEnter);
