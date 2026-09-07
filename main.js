/**
 * 3er Round Fit - Brutalist JS Interactions
 */

document.addEventListener('DOMContentLoaded', () => {

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- Iconos (la CDN puede fallar; que no rompa el resto) ---
    const paintIcons = () => {
        if (window.feather) window.feather.replace();
    };
    if (window.feather) {
        paintIcons();
    } else {
        window.addEventListener('load', paintIcons, { once: true });
    }

    // --- Video del hero -------------------------------------------------
    // Sólo se descarga en pantallas grandes, con conexión buena y si el
    // usuario no pidió reducir movimiento. En el resto queda el póster.
    const heroVideo = document.getElementById('hero-video');
    if (heroVideo) {
        const conn = navigator.connection || {};
        const isSlow = conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType || '');
        const isBigScreen = window.matchMedia('(min-width: 769px)').matches;

        if (isBigScreen && !prefersReducedMotion && !isSlow) {
            const source = document.createElement('source');
            source.src = 'assets/hero.mp4';
            source.type = 'video/mp4';
            heroVideo.appendChild(source);
            heroVideo.load();

            const tryPlay = () => heroVideo.play().catch(() => {});
            heroVideo.addEventListener('canplay', tryPlay, { once: true });

            // No gastar batería/CPU con el video fuera de pantalla
            const heroObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) tryPlay();
                    else heroVideo.pause();
                });
            }, { threshold: 0.15 });
            heroObserver.observe(heroVideo);
        } else {
            heroVideo.remove();
        }
    }

    // --- Menú fullscreen -------------------------------------------------
    const menuToggle = document.getElementById('menu-toggle');
    const fullscreenMenu = document.getElementById('fullscreen-menu');
    const menuLinks = document.querySelectorAll('.menu-link');

    if (menuToggle && fullscreenMenu) {
        const setMenu = (open) => {
            menuToggle.classList.toggle('open', open);
            fullscreenMenu.classList.toggle('active', open);
            menuToggle.setAttribute('aria-expanded', String(open));
            menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
            document.body.style.overflow = open ? 'hidden' : '';

            // inert saca el menú cerrado del foco y de los lectores de pantalla
            if (open) {
                fullscreenMenu.removeAttribute('inert');
                const first = fullscreenMenu.querySelector('.menu-link');
                if (first) first.focus();
            } else {
                fullscreenMenu.setAttribute('inert', '');
            }
        };

        menuToggle.addEventListener('click', () => {
            setMenu(!fullscreenMenu.classList.contains('active'));
        });

        menuLinks.forEach(link => {
            link.addEventListener('click', () => setMenu(false));
        });

        // ESC cierra y devuelve el foco al botón
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && fullscreenMenu.classList.contains('active')) {
                setMenu(false);
                menuToggle.focus();
            }
        });

        // El foco no se escapa del menú abierto
        fullscreenMenu.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;
            const items = [...fullscreenMenu.querySelectorAll('.menu-link')];
            if (!items.length) return;
            const first = items[0];
            const last = items[items.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        });
    }

    // --- Fondo de la sección de entrenamientos ---------------------------
    const trainingItems = document.querySelectorAll('.training-item');
    const trainingBg = document.getElementById('training-bg');

    if (trainingBg && trainingItems.length) {
        const setBg = (item) => {
            const img = item.getAttribute('data-image');
            if (img) trainingBg.style.backgroundImage = 'url("' + img + '")';
        };
        setBg(trainingItems[0]);
        trainingItems.forEach(item => {
            item.addEventListener('mouseenter', () => setBg(item));
            item.addEventListener('focusin', () => setBg(item));
        });
    }

    // --- Próxima clase ----------------------------------------------------
    // Se calcula con la hora del visitante a partir del horario publicado.
    // Si algún día cambian las clases, hay que tocar HORARIO aquí y la
    // sección #horarios del HTML.
    const cajaProxima = document.getElementById('next-class');
    if (cajaProxima) {
        const DIAS = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
        // minutos desde medianoche
        const ENTRE_SEMANA = [450, 510, 570, 630, 900, 960, 1020, 1080, 1140];
        const SABADO = [510];
        const horarioDe = (dia) => (dia === 0 ? [] : dia === 6 ? SABADO : ENTRE_SEMANA);

        const comoHora = (min) => {
            const h24 = Math.floor(min / 60);
            const m = String(min % 60).padStart(2, '0');
            const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
            return h12 + ':' + m + ' ' + (h24 < 12 ? 'AM' : 'PM');
        };

        const buscarProxima = () => {
            const ahora = new Date();
            const minAhora = ahora.getHours() * 60 + ahora.getMinutes();
            for (let salto = 0; salto < 8; salto++) {
                const dia = (ahora.getDay() + salto) % 7;
                for (const slot of horarioDe(dia)) {
                    if (salto === 0 && slot <= minAhora) continue;
                    const cuando = salto === 0 ? 'HOY' : salto === 1 ? 'MAÑANA' : DIAS[dia];
                    return cuando + ' ' + comoHora(slot);
                }
            }
            return null;
        };

        const pintarProxima = () => {
            const texto = buscarProxima();
            if (!texto) { cajaProxima.hidden = true; return; }
            cajaProxima.textContent = 'PRÓXIMA CLASE: ' + texto;
            cajaProxima.hidden = false;
        };

        pintarProxima();
        window.setInterval(pintarProxima, 60000);
    }

    // --- Reveal on scroll -------------------------------------------------
    const scrollElements = document.querySelectorAll('[data-scroll]');

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        // Sin animación (o sin soporte): el contenido simplemente está visible.
        // Nunca dejamos una sección en opacity:0 sin forma de revelarla.
        scrollElements.forEach(el => { el.style.opacity = '1'; });
    } else {
        const scrollObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        scrollElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(40px)';
            el.style.transition = 'opacity 0.8s cubic-bezier(0.165,0.84,0.44,1), transform 0.8s cubic-bezier(0.165,0.84,0.44,1)';
            scrollObserver.observe(el);
        });
    }

    // --- Navbar al hacer scroll -------------------------------------------
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                navbar.classList.toggle('scrolled', window.scrollY > 50);
                ticking = false;
            });
        }, { passive: true });
    }

});
