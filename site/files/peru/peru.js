// PERU BUILDS: enlaces internos (#seccion) con el mismo desplazamiento suave del sitio.
// El JS original solo resolvía anclas al cargar la página; aquí se aplica también al hacer clic.
(function () {
    function offsetInContent(el) {
        var y = 0;
        while (el && el.id !== 'smooth-content') {
            y += el.offsetTop;
            el = el.offsetParent;
        }
        return y;
    }

    // ---------- visor 360 (Aledaños) ----------
    var viewer = null, box = null;
    function openPano(src, title) {
        if (!window.pannellum) { window.open(src, '_blank'); return; }
        if (!box) {
            box = document.createElement('div');
            box.className = 'pano-viewer';
            box.innerHTML = '<div class="pano-viewer__bar"><span class="pano-viewer__title"></span>' +
                '<span class="pano-viewer__hint">Arrastra para mirar alrededor</span>' +
                '<button class="pano-viewer__close" aria-label="Cerrar">&times;</button></div><div id="pano-stage"></div>';
            document.body.appendChild(box);
            box.querySelector('.pano-viewer__close').addEventListener('click', closePano);
        }
        box.querySelector('.pano-viewer__title').textContent = title || '';
        box.classList.add('visible');
        viewer = pannellum.viewer('pano-stage', {
            type: 'equirectangular', panorama: src, autoLoad: true,
            hfov: 100, autoRotate: -2, compass: false, showFullscreenCtrl: true,
            strings: { loadingLabel: 'Cargando 360°…' },
        });
    }
    function closePano() {
        if (!box) return;
        box.classList.remove('visible');
        if (viewer) { viewer.destroy(); viewer = null; }
    }
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePano(); });

    // al cargar más lugares la página crece: se avisa con un "resize" para que las animaciones
    // con scroll (ScrollTrigger) recalculen sus posiciones, igual que al cambiar el tamaño de ventana
    var list = document.querySelector('#aledanos [container="content"]');
    if (list && window.MutationObserver) {
        var t;
        new MutationObserver(function () {
            clearTimeout(t);
            t = setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 400);
        }).observe(list, { childList: true });
    }

    document.addEventListener('click', function (e) {
        var p = e.target.closest ? e.target.closest('[data-pano]') : null;
        if (p) {
            e.preventDefault();
            e.stopPropagation();
            openPano(p.getAttribute('data-pano'), p.getAttribute('data-title'));
            return;
        }
        var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
        if (!a || a.hasAttribute('popup')) return;
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var target = document.getElementById(id.slice(1));
        if (!target) return;
        e.preventDefault();

        // si el menú desplegable está abierto, se cierra igual que con su botón
        var nav = document.querySelector('[component="Navigation"]');
        if (nav && nav.contains(a) && nav.classList.contains('open')) {
            var btn = nav.querySelector('[component="NavButton"]');
            if (btn) btn.click();
        }

        window.scrollTo({ top: Math.max(0, offsetInContent(target) - 86), behavior: 'smooth' });
    }, true);
})();
