const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-btn');
const mobileNav = document.querySelector('.mobile-nav');
const modal = document.getElementById('appointmentModal');
const form = document.getElementById('appointmentForm');

// Mobile navigation
menuButton.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', open);
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mobileNav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

// Add a compact sticky navigation after scrolling past the utility bar.
window.addEventListener('scroll', () => header.classList.toggle('stuck', window.scrollY > 36), { passive: true });

// Reveal content progressively as it enters the viewport.
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(item => revealObserver.observe(item));

// Keep the active navigation item in sync with the current section.
const sections = document.querySelectorAll('main section[id], header[id]');
const navLinks = document.querySelectorAll('.desktop-nav a');
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
    }
  });
}, { rootMargin: '-35% 0px -55%', threshold: 0 });
sections.forEach(section => sectionObserver.observe(section));

// Appointment modal
function openModal() {
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
  setTimeout(() => modal.querySelector('input')?.focus(), 100);
}
function closeModal() {
  modal.classList.remove('open', 'success');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('no-scroll');
  form.reset();
}
document.querySelectorAll('.open-modal').forEach(button => button.addEventListener('click', openModal));
modal.querySelector('.modal-close').addEventListener('click', closeModal);
modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
modal.querySelector('.modal-done').addEventListener('click', closeModal);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
form.addEventListener('submit', event => {
  event.preventDefault();
  modal.classList.add('success');
});

// Patient story carousel
const reviews = [
  { text: "Well equipped modern eye hospital. They did my father's cataract surgery with regular follow-up—no complications and the best result.", name: 'Aamir Momin', initials: 'AM', detail: 'Patient family · Cataract care' },
  { text: 'A very kind and knowledgeable ophthalmologist. Every step was explained clearly and the entire team made us feel comfortable.', name: 'Deepak Vishwakarma', initials: 'DV', detail: 'Patient · Eye consultation' },
  { text: 'Advanced equipment, polite staff and excellent care. Dr. Kazi is humble, reassuring and truly attentive to every concern.', name: 'Sandeep Jaiswar', initials: 'SJ', detail: 'Patient · Retina care' }
];
let reviewIndex = 0;
const reviewText = document.getElementById('reviewText');
const reviewName = document.getElementById('reviewName');
const reviewInitials = document.getElementById('reviewInitials');
const reviewDetail = reviewName.nextElementSibling;
function showReview(direction) {
  reviewIndex = (reviewIndex + direction + reviews.length) % reviews.length;
  const review = reviews[reviewIndex];
  const card = document.querySelector('.review-card');
  card.animate([{ opacity: .25, transform: 'translateX(8px)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: 280 });
  reviewText.textContent = review.text;
  reviewName.textContent = review.name;
  reviewInitials.textContent = review.initials;
  reviewDetail.textContent = review.detail;
}
document.getElementById('nextReview').addEventListener('click', () => showReview(1));
document.getElementById('prevReview').addEventListener('click', () => showReview(-1));