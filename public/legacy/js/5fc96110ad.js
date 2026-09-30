function openJacuzziModal() {
        document.getElementById('jacuzziModal').style.display = 'flex';
    }
    function closeJacuzziModal() {
        document.getElementById('jacuzziModal').style.display = 'none';
    }
    document.getElementById('jacuzziForm').addEventListener('submit', function(e) {
        e.preventDefault();
        fetch(this.action, {
            method: 'POST',
            body: new FormData(this),
            headers: { 'Accept': 'application/json' }
        }).then(res => {
            if (res.ok) {
                alert('¡Gracias! Te contactaremos a la brevedad.');
                this.reset();
                closeJacuzziModal();
            } else {
                alert('Hubo un error al enviar. Por favor intenta de nuevo.');
            }
        }).catch(() => {
            alert('Hubo un error al enviar. Por favor intenta de nuevo.');
        });
    });
