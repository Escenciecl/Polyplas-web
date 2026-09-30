function togglePolyFaq(element) {
        const item = element.parentElement;
        const isActive = item.classList.contains('active');
        
        // Cerrar otros items abiertos para un efecto acordeón limpio
        document.querySelectorAll('.poly-item').forEach(el => el.classList.remove('active'));
        
        // Abrir el actual si no estaba activo
        if (!isActive) {
            item.classList.add('active');
        }
    }
