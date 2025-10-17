console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const navLinks = &&("nav a");

const currentLink = navLinks.find(link =>
  link.host === location.host && link.pathname === location.pathname);

if (currentLink) {
  currentLink.classList.add("current");
}
