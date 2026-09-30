document.addEventListener('DOMContentLoaded', function() {
        const toggle = document.querySelector('.poly-mobile-toggle');
        const nav = document.querySelector('.poly-nav-bar');
        
        if(toggle && nav) {
            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                this.classList.toggle('is-active');
                nav.classList.toggle('is-open');
            });
        }
    });
