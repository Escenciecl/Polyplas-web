/* Solo se activa si no existe previamente la función */
    if (typeof togglePolyFaq !== 'function') {
        window.togglePolyFaq = function(element) {
            const item = element.parentElement;
            item.classList.toggle('active');
        }
    }
