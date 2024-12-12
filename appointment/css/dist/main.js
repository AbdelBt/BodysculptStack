const nav = document.querySelector("#header nav");
const toggle = document.querySelectorAll("nav .toggle");
const links = document.querySelectorAll("nav ul li a");

function toggleDropdown() {
  nav.classList.toggle("show");
}

function closeDropdown() {
  nav.classList.remove("show");
}

for (const element of toggle) {
  element.addEventListener("click", toggleDropdown);
}

if (window.innerWidth < 1200) {
  for (const link of links) {
    link.addEventListener("click", toggleDropdown);
    event.preventDefault();
  }
} else {
  for (const link of links) {
    link.addEventListener("click", closeDropdown);
  }
}

// Slider Swiper (Carrousel)
const swiper = new Swiper(".swiper-container", {
  slidesPerView: 1,
  pagination: {
    el: ".swiper-pagination",
  },
  mousewhell: true,
  keyboard: true,
  breakpoints: {
    767: {
      slidesPerView: 1,
      setWrapperSize: true,
    },
  },
});

// Scroll Reveal
const scrollReveal = ScrollReveal({
  origin: "top",
  distance: "30px",
  duration: 700,
  reset: true,
});
// Setando os IDs e classes da página
scrollReveal.reveal(
  `#home .image, #home .text,
  #about .image, #about .text,
  #services header, #services .card,
  #testimonials header, #testimonials .testimonials,
  #contact .text, #contact .links,
  footer .brand, footer .social
  `,
  {
    interval: 100,
  }
);

const header = document.querySelector("#header");
const navHeight = header.offsetHeight;
function changeHeaderWhenScroll() {
  if (window.scrollY >= navHeight) {
    header.classList.add("scroll");
  } else {
    header.classList.remove("scroll");
  }
}

const backToTopButton = document.querySelector(".back-to-top");
function backtoTop() {
  if (window.scrollY >= 560) {
    backToTopButton.classList.add("show");
  } else {
    backToTopButton.classList.remove("show");
  }
}

window.addEventListener("scroll", function () {
  changeHeaderWhenScroll();
  backtoTop();
  activateMenuAtCurrentSection();
});

const sections = document.querySelectorAll("main section[id]");

function activateMenuAtCurrentSection() {
  const checkpoint = window.pageYOffset + (window.innerHeight / 8) * 4;

  for (const section of sections) {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute("id");

    const checkpointStart = checkpoint >= sectionTop;
    const checkpointEnd = checkpoint <= sectionTop + sectionHeight;

  }
}



