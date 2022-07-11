//Carrousel
$('.carousel').carousel({
  interval: 3000
})

// parallax
let parallax = document.querySelector('.parallax');
let h1Tag = document.querySelector('.h1-tag');

function scrollParallax() {
  let scrollTop = document.documentElement.scrollTop;
  parallax.style.transform = 'translateY(' + scrollTop * -0.6 + 'px)';
  h1Tag.style.transform = 'translateY(' + scrollTop * 0.9 + 'px)';
}
window.addEventListener('scroll', scrollParallax);

//Animate Scroll up
let animateY = document.querySelectorAll(".animated-scroll-up");
function seeScrollY() {
  let scrollTop = document.documentElement.scrollTop;
  for (let i = 0; i < animateY.length; i++) {
    let heightAnimate = animateY[i].offsetTop;
    if (heightAnimate - 500 < scrollTop) {
      animateY[i].style.opacity = 1;
      animateY[i].classList.add("view-from-above");
    }
  }
}
window.addEventListener('scroll', seeScrollY);

// Animate Scroll right
let animateX = document.querySelectorAll(".animated-scroll-right");
function seeScrollX() {
  let scrollRight = document.documentElement.scrollTop;
  for (let i = 0; i < animateX.length; i++) {
    let rightAnimate = animateX[i].offsetTop;
    if (rightAnimate - 500 < scrollRight) {
      animateX[i].style.opacity = 1;
      animateX[i].classList.add("view-from-right");
    }
  }
}
window.addEventListener('scroll', seeScrollX);
