function openPolyModal(productName) {
        document.getElementById('poly-modal-product').value = productName;
        document.getElementById('polyCallModal').style.display = 'flex';
    }

    function closePolyModal() {
        document.getElementById('polyCallModal').style.display = 'none';
    }

    function handlePolyFormSubmit(event) {
        event.preventDefault();
        const form = document.getElementById('polyContactForm');
        const data = new FormData(form);

        fetch(form.action, {
            method: 'POST',
            body: data,
            headers: { 'Accept': 'application/json' }
        }).then(res => {
            if (res.ok) {
                alert('¡Gracias! Te contactaremos a la brevedad.');
                form.reset();
                closePolyModal();
            } else {
                alert('Hubo un error al enviar. Por favor intenta de nuevo.');
            }
        }).catch(() => {
            alert('Hubo un error al enviar. Por favor intenta de nuevo.');
        });
    }
