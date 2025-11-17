// Mobile Menu Toggle with ARIA
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
        const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';

        menuToggle.classList.toggle('active');
        navLinks.classList.toggle('active');

        // Update ARIA attribute
        menuToggle.setAttribute('aria-expanded', !isExpanded);

        // Trap focus when menu is open
        if (!isExpanded) {
            // Menu is being opened
            const firstLink = navLinks.querySelector('a');
            if (firstLink) firstLink.focus();
        }
    });

    // Close mobile menu when a link is clicked
    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
        });
    });

    // Close menu on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('active')) {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
            menuToggle.focus();
        }
    });
}

// Smooth scroll with offset for fixed header
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));

        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Add scroll effect to header
let lastScroll = 0;
const header = document.querySelector('header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll <= 0) {
        header.classList.remove('scroll-up');
        return;
    }

    if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
        // Scrolling down
        header.classList.remove('scroll-up');
        header.classList.add('scroll-down');
    } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
        // Scrolling up
        header.classList.remove('scroll-down');
        header.classList.add('scroll-up');
    }
    lastScroll = currentScroll;
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
        }
    });
}, observerOptions);

// Observe all sections
document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// Update year in footer
const currentYear = new Date().getFullYear();
const yearSpan = document.getElementById('current-year');
if (yearSpan) {
    yearSpan.textContent = currentYear;
}

// Accessibility Statement Toggle
const accessibilityLink = document.querySelector('a[href="#accessibility-statement"]');
const accessibilityStatement = document.getElementById('accessibility-statement');

if (accessibilityLink && accessibilityStatement) {
    accessibilityLink.addEventListener('click', (e) => {
        e.preventDefault();
        const isHidden = accessibilityStatement.hasAttribute('hidden');

        if (isHidden) {
            accessibilityStatement.removeAttribute('hidden');
            accessibilityLink.setAttribute('aria-expanded', 'true');
            // Scroll to statement
            accessibilityStatement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Focus on heading for screen readers
            const heading = accessibilityStatement.querySelector('h2');
            if (heading) {
                heading.setAttribute('tabindex', '-1');
                heading.focus();
            }
        } else {
            accessibilityStatement.setAttribute('hidden', '');
            accessibilityLink.setAttribute('aria-expanded', 'false');
        }
    });
}

// Announce page load to screen readers
window.addEventListener('load', () => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.setAttribute('aria-live', 'polite');
        // Remove after brief moment to avoid interfering with navigation
        setTimeout(() => {
            mainContent.removeAttribute('aria-live');
        }, 1000);
    }
});
