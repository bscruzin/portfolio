console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
	  
	console.log(response)
	  
	if (!response.ok) {
		throw new Error(`Failed to fetch projects: ${response.statusText}`);
	}
	const data = await response.json();
	return data;
	  
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

let pages = [
  { url: "", title: "Home"},
  { url: "projects/", title: "Projects"},
  { url: "contact/", title: "Contact"},
  { url: "cv/", title: "CV"},
  { url: "https://github.com/bscruzin", title: "Profile"},
  ];

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                  // Local server
  : "/portfolio/";         // GitHub Pages repo name

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = !p.url.startsWith("http") ? BASE_PATH + p.url : p.url;
  let title = p.title;
  
  let a = document.createElement("a");
  a.href = url;
  a.textContent = p.title;

  a.classList.toggle(
    "current", 
    a.host === location.host && a.pathname === location.pathname
  );

  // Open external links (different host) in a new tab
  if (a.host !== location.host) {
    a.target = "_blank";
  }

  nav.append(a);
}

document.body.insertAdjacentHTML(
  'afterbegin',
  `
	<label class="color-scheme">
		Theme:
		<select>
			<option value="light dark" selected>Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
		</select>
	</label>`,
);

const select = document.querySelector('.color-scheme select');

if ("colorScheme" in localStorage) {
  const saved = localStorage.colorScheme;
  document.documentElement.style.setProperty("color-scheme", saved);
  select.value = saved; 
}

select.addEventListener('input', function (event) {
	const scheme = event.target.value;
	console.log('color scheme changed to', scheme);
	document.documentElement.style.setProperty('color-scheme', scheme);
	localStorage.colorScheme = scheme;
});

const form = document.querySelector("form");

form?.addEventListener("submit", function (event) {
  event.preventDefault(); 

  const data = new FormData(form);
  let params = [];

  for (let [name, value] of data) {
    params.push(`${name}=${encodeURIComponent(value)}`);
  }

  let url = form.action + "?" + params.join("&");
  console.log("Redirecting to:", url);
  location.href = url;
});

export function renderProjects(projects, containerElement, headingLevel = 'h2') {

  containerElement.innerHTML = '';

  for (let project of projects) {
    const article = document.createElement('article');
    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      <img src="${project.image}" alt="${project.title}">
      <p>${project.description}</p>
    `;
    containerElement.appendChild(article);
  }
}

// const navLinks = $$("nav a");

// let currentLink = navLinks.find(
//    (a) => a.host === location.host && a.pathname === location.pathname);

// // first option
// if (currentLink) {
//  currentLink.classList.add("current");}

// // second cleaner option
// currentLink?.classList.add("current");
