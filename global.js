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
  nav.insertAdjacentHTML("beforeend", `<a href="${url}">${title}</a>`);
}
const navLinks = $$("nav a");

let currentLink = navLinks.find(
   (a) => a.host === location.host && a.pathname === location.pathname);

// // first option
// if (currentLink) {
//  currentLink.classList.add("current");}

// // second cleaner option
currentLink?.classList.add("current");
