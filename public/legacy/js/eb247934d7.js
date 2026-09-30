function openReceptaculo2Modal() {
        document.getElementById('receptaculo2Modal').style.display = 'flex';
    }
    function closeReceptaculo2Modal() {
        document.getElementById('receptaculo2Modal').style.display = 'none';
    }
    document.getElementById('receptaculo2Form').addEventListener('submit', function(e) {
        e.preventDefault();
        fetch(this.action, {
            method: 'POST',
            body: new FormData(this),
            headers: { 'Accept': 'application/json' }
        }).then(res => {
            if (res.ok) {
                alert('¡Gracias! Te contactaremos a la brevedad.');
                this.reset();
                closeReceptaculo2Modal();
            } else {
                alert('Hubo un error al enviar. Por favor intenta de nuevo.');
            }
        }).catch(() => {
            alert('Hubo un error al enviar. Por favor intenta de nuevo.');
        });
    });
