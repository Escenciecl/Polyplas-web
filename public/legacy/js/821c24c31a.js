function openAcrilacoModal() {
        document.getElementById('acrilicaModal').style.display = 'flex';
    }
    function closeAcrilicaModal() {
        document.getElementById('acrilicaModal').style.display = 'none';
    }
    document.getElementById('acrilicaForm').addEventListener('submit', function(e) {
        e.preventDefault();
        fetch(this.action, {
            method: 'POST',
            body: new FormData(this),
            headers: { 'Accept': 'application/json' }
        }).then(res => {
            if (res.ok) {
                alert('¡Gracias! Te contactaremos a la brevedad.');
                this.reset();
                closeAcrilicaModal();
            } else {
                alert('Hubo un error al enviar. Por favor intenta de nuevo.');
            }
        }).catch(() => {
            alert('Hubo un error al enviar. Por favor intenta de nuevo.');
        });
    });
