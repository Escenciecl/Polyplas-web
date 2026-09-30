function openTerrazaModal() {
        document.getElementById('terrazaModal').style.display = 'flex';
    }
    function closeTerrazaModal() {
        document.getElementById('terrazaModal').style.display = 'none';
    }
    document.getElementById('terrazaForm').addEventListener('submit', function(e) {
        e.preventDefault();
        fetch(this.action, {
            method: 'POST',
            body: new FormData(this),
            headers: { 'Accept': 'application/json' }
        }).then(res => {
            if (res.ok) {
                alert('¡Gracias! Te contactaremos a la brevedad.');
                this.reset();
                closeTerrazaModal();
            } else {
                alert('Hubo un error al enviar. Por favor intenta de nuevo.');
            }
        }).catch(() => {
            alert('Hubo un error al enviar. Por favor intenta de nuevo.');
        });
    });
