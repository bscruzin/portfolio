console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
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

select.addEventListener('input', function (event) {
  console.log('color scheme changed to', event.target.value);

  document.documentElement.style.setProperty('color-scheme', event.target.value);
});


// const navLinks = $$("nav a");

// let currentLink = navLinks.find(
//    (a) => a.host === location.host && a.pathname === location.pathname);

// // first option
// if (currentLink) {
//  currentLink.classList.add("current");}

// // second cleaner option
// currentLink?.classList.add("current");
