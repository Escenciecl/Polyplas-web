function polyToggleLlamamos(panelId, btn) {
    var panel = document.getElementById(panelId);
    if (panel.style.display === 'none' || panel.style.display === '') {
        panel.style.display = 'block';
        btn.setAttribute('aria-expanded', 'true');
    } else {
        panel.style.display = 'none';
        btn.setAttribute('aria-expanded', 'false');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    var nextInputs = document.querySelectorAll('.llNextUrl');
    nextInputs.forEach(function(input) {
        input.value = window.location.href;
    });
});
