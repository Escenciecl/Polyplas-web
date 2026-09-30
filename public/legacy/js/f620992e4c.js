if (typeof togglePolyFaq !== 'function') {
        window.togglePolyFaq = function(element) {
            const item = element.parentElement;
            const isActive = item.classList.contains('active');
            
            if (!isActive) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        }
    }
