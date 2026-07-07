/**
 * 3er Round Fit - Brutalist JS Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Fullscreen Menu ---
    const menuToggle = document.getElementById('menu-toggle');
    const fullscreenMenu = document.getElementById('fullscreen-menu');
    const menuLinks = document.querySelectorAll('.menu-link');

    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('open');
        fullscreenMenu.classList.toggle('active');
        
        if (fullscreenMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    });

    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('open');
            fullscreenMenu.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });

    // --- Interactive Training Section (Change Background on Hover) ---
    const trainingItems = document.querySelectorAll('.training-item');
    const trainingBg = document.getElementById('training-bg');
    
    // Set default background
    if(trainingItems.length > 0) {
        trainingBg.style.backgroundImage = `url(${trainingItems[0].getAttribute('data-image')})`;
    }

    trainingItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            const bgImage = item.getAttribute('data-image');
            trainingBg.style.backgroundImage = `url(${bgImage})`;
        });
    });

    // --- Scroll Animations (Reveal on scroll) ---
    const scrollElements = document.querySelectorAll('[data-scroll]');

    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                // Optional: stop observing once revealed
                // scrollObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    scrollElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(40px)';
        el.style.transition = 'all 0.8s cubic-bezier(0.165, 0.84, 0.44, 1)';
        scrollObserver.observe(el);
    });

});
