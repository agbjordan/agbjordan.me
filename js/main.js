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

// Keyboard Shortcuts for Navigation
// Alt+A = About, Alt+E = Experience, Alt+S = Skills, Alt+C = Contact
const keyboardShortcuts = {
    'a': 'about',
    'e': 'experience',
    's': 'skills',
    'c': 'contact'
};

document.addEventListener('keydown', (e) => {
    // Check if Alt key (Option on Mac) is pressed
    if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const key = e.key.toLowerCase();

        if (keyboardShortcuts[key]) {
            e.preventDefault();

            const section = document.getElementById(keyboardShortcuts[key]);
            if (section) {
                // Smooth scroll to section
                const headerOffset = 80;
                const elementPosition = section.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // Focus on the section heading for accessibility
                const heading = section.querySelector('h2');
                if (heading) {
                    heading.setAttribute('tabindex', '-1');
                    heading.focus();

                    // Visual feedback - briefly highlight the section
                    section.style.outline = '3px solid var(--primary-color)';
                    section.style.outlineOffset = '-3px';
                    setTimeout(() => {
                        section.style.outline = '';
                        section.style.outlineOffset = '';
                    }, 2000);
                }

                // Announce to screen readers
                const announcement = document.createElement('div');
                announcement.setAttribute('role', 'status');
                announcement.setAttribute('aria-live', 'polite');
                announcement.className = 'sr-only';
                announcement.textContent = `Navigated to ${keyboardShortcuts[key]} section`;
                document.body.appendChild(announcement);

                setTimeout(() => {
                    document.body.removeChild(announcement);
                }, 1000);
            }
        }
    }
});

// Show keyboard shortcuts help on ? key
document.addEventListener('keydown', (e) => {
    if (e.key === '?' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        showKeyboardShortcutsHelp();
    }
});

// Keyboard help button click handler
const keyboardHelpBtn = document.querySelector('.keyboard-help-btn');
if (keyboardHelpBtn) {
    keyboardHelpBtn.addEventListener('click', () => {
        showKeyboardShortcutsHelp();
    });
}

function showKeyboardShortcutsHelp() {
    // Check if help already exists
    let helpDialog = document.getElementById('keyboard-shortcuts-help');

    if (helpDialog) {
        helpDialog.removeAttribute('hidden');
        helpDialog.focus();
        return;
    }

    // Create help dialog
    helpDialog = document.createElement('div');
    helpDialog.id = 'keyboard-shortcuts-help';
    helpDialog.className = 'keyboard-shortcuts-help';
    helpDialog.setAttribute('role', 'dialog');
    helpDialog.setAttribute('aria-labelledby', 'shortcuts-title');
    helpDialog.setAttribute('tabindex', '-1');

    helpDialog.innerHTML = `
        <div class="shortcuts-overlay" aria-hidden="true"></div>
        <div class="shortcuts-content">
            <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
            <button class="shortcuts-close" aria-label="Close keyboard shortcuts help">&times;</button>
            <div class="shortcuts-grid">
                <div class="shortcut-item">
                    <kbd>Alt</kbd> + <kbd>A</kbd>
                    <span>Jump to About section</span>
                </div>
                <div class="shortcut-item">
                    <kbd>Alt</kbd> + <kbd>E</kbd>
                    <span>Jump to Experience section</span>
                </div>
                <div class="shortcut-item">
                    <kbd>Alt</kbd> + <kbd>S</kbd>
                    <span>Jump to Skills section</span>
                </div>
                <div class="shortcut-item">
                    <kbd>Alt</kbd> + <kbd>C</kbd>
                    <span>Jump to Contact section</span>
                </div>
                <div class="shortcut-item">
                    <kbd>?</kbd>
                    <span>Show this help</span>
                </div>
                <div class="shortcut-item">
                    <kbd>Esc</kbd>
                    <span>Close dialogs / mobile menu</span>
                </div>
            </div>
            <p class="shortcuts-note"><small>On Mac, use Option key instead of Alt</small></p>
        </div>
    `;

    document.body.appendChild(helpDialog);
    helpDialog.focus();

    // Close handlers
    const closeBtn = helpDialog.querySelector('.shortcuts-close');
    const overlay = helpDialog.querySelector('.shortcuts-overlay');

    const closeHelp = () => {
        helpDialog.setAttribute('hidden', '');
    };

    closeBtn.addEventListener('click', closeHelp);
    overlay.addEventListener('click', closeHelp);

    helpDialog.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeHelp();
        }
    });
}
