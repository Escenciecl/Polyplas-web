function openCupulasModal() {
        document.getElementById('cupulasModal').style.display = 'flex';
    }
    function closeCupulasModal() {
        document.getElementById('cupulasModal').style.display = 'none';
    }
    document.getElementById('cupulasModalForm').addEventListener('submit', function(e) {
        e.preventDefault();
        fetch(this.action, {
            method: 'POST',
            body: new FormData(this),
            headers: { 'Accept': 'application/json' }
        }).then(res => {
            if (res.ok) {
                alert('¡Gracias! Te contactaremos a la brevedad.');
                this.reset();
                closeCupulasModal();
            } else {
                alert('Hubo un error al enviar. Por favor intenta de nuevo.');
            }
        }).catch(() => {
            alert('Hubo un error al enviar. Por favor intenta de nuevo.');
        });
    });
