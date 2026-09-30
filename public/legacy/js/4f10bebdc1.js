function openAcrilicoPrincipalModal() {
        document.getElementById('acrilicoPrincipalModal').style.display = 'flex';
    }
    function closeAcrilicoPrincipalModal() {
        document.getElementById('acrilicoPrincipalModal').style.display = 'none';
    }
    document.getElementById('acrilicoPrincipalForm').addEventListener('submit', function(e) {
        e.preventDefault();
        fetch(this.action, {
            method: 'POST',
            body: new FormData(this),
            headers: { 'Accept': 'application/json' }
        }).then(res => {
            if (res.ok) {
                alert('¡Gracias! Te contactaremos a la brevedad.');
                this.reset();
                closeAcrilicoPrincipalModal();
            } else {
                alert('Hubo un error al enviar. Por favor intenta de nuevo.');
            }
        }).catch(() => {
            alert('Hubo un error al enviar. Por favor intenta de nuevo.');
        });
    });
