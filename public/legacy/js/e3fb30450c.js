function polyToggleFaq(btn) {
    const answer = btn.nextElementSibling;
    const isOpen = answer.classList.contains('open');
    document.querySelectorAll('.poly-faq-a').forEach(a => a.classList.remove('open'));
    document.querySelectorAll('.poly-faq-q').forEach(b => b.classList.remove('active'));
    if (!isOpen) {
        answer.classList.add('open');
        btn.classList.add('active');
    }
}
