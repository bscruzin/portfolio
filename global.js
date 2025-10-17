console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const navLinks = $$("nav a");

let currentLink = navLinks.find(
  (a) => a.host === location.host && a.pathname === location.pathname);

// first option
//if (currentLink) {
// currentLink.classList.add("current");}

// second cleaner option
currentLink?.classList.add("current");
