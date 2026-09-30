if (typeof togglePolyFaq !== 'function') {
        window.togglePolyFaq = function(element) {
            const item = element.parentElement;
            item.classList.toggle('active');
        }
    }
