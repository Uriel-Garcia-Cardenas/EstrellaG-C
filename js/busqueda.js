// js/busqueda.js - Funcionalidad de búsqueda en tiempo real

class ManejadorBusqueda {
  constructor() {
    this.productos = [];
    this.searchInput = document.getElementById('searchInput');
    this.searchBtn = document.getElementById('searchBtn');
    this.searchResults = document.getElementById('searchResults');
    
    this.init();
  }

  init() {
    // Cargar productos
    this.cargarProductos();
    
    // Event listeners
    this.searchInput.addEventListener('input', () => this.buscarProductos());
    this.searchBtn.addEventListener('click', () => this.buscarProductos());
    this.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.buscarProductos();
    });

    // Cerrar resultados al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!this.searchResults.contains(e.target) && e.target !== this.searchInput) {
        this.ocultarResultados();
      }
    });
  }

  cargarProductos() {
    // Escuchar cambios en la colección de productos de Firebase
    if (typeof db !== 'undefined') {
      db.collection("productos").onSnapshot((snapshot) => {
        this.productos = [];
        snapshot.forEach((doc) => {
          const producto = doc.data();
          producto.id = doc.id;
          this.productos.push(producto);
        });
      });
    }
  }

  buscarProductos() {
    const termino = this.searchInput.value.trim().toLowerCase();
    
    if (termino.length === 0) {
      this.ocultarResultados();
      return;
    }

    const resultados = this.productos.filter(producto => 
      producto.nombre.toLowerCase().includes(termino) ||
      (producto.descripcion && producto.descripcion.toLowerCase().includes(termino)) ||
      (producto.categoria && producto.categoria.toLowerCase().includes(termino))
    );

    this.mostrarResultados(resultados);
  }

  mostrarResultados(resultados) {
    if (resultados.length === 0) {
      this.searchResults.innerHTML = `
        <div class="p-3 text-center text-muted">
          <i class="fas fa-search me-2"></i>
          No se encontraron productos
        </div>
      `;
    } else {
      this.searchResults.innerHTML = resultados.map(producto => `
        <a href="#" class="producto-busqueda" data-id="${producto.id}">
          <img src="img/${producto.imagen || 'placeholder.jpg'}" 
               alt="${producto.nombre}"
               onerror="this.src='img/placeholder.jpg'">
          <div class="producto-info">
            <div class="producto-nombre">${producto.nombre}</div>
            <div class="producto-precio">$${producto.precio.toFixed(2)}</div>
            <small class="text-muted">${producto.categoria || 'Sin categoría'}</small>
          </div>
        </a>
      `).join('');

      // Agregar event listeners a los resultados
      this.searchResults.querySelectorAll('.producto-busqueda').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          this.seleccionarProducto(e.currentTarget.dataset.id);
        });
      });
    }

    this.searchResults.classList.remove('d-none');
  }

  ocultarResultados() {
    this.searchResults.classList.add('d-none');
  }

 seleccionarProducto(productoId) {
  const producto = this.productos.find(p => p.id === productoId);
  if (producto) {
    // Cerrar resultados de búsqueda
    this.ocultarResultados();
    this.searchInput.value = '';
    
    // Filtrar por la categoría del producto para mostrar todos los productos de esa categoría
    if (typeof manejadorCategorias !== 'undefined') {
      manejadorCategorias.filtrarPorCategoria(producto.categoria);
      
      // Esperar a que se rendericen los productos y luego hacer scroll al producto específico
      setTimeout(() => {
        this.scrollAProducto(productoId);
      }, 800);
    }
  }
}

scrollAProducto(productoId) {
  // Buscar el producto específico en el DOM
  const productoElement = document.querySelector(`.agregar[data-id="${productoId}"]`);
  
  if (productoElement) {
    const card = productoElement.closest('.card');
    const cardRect = card.getBoundingClientRect();
    const absoluteCardTop = cardRect.top + window.pageYOffset;
    const middle = absoluteCardTop - (window.innerHeight / 2) + (cardRect.height / 2);
    
    // Hacer scroll suave hasta el producto (centrado en la pantalla)
    window.scrollTo({
      top: middle,
      behavior: 'smooth'
    });
    
    // Destacar sutilmente el producto sin afectar la visualización de los demás
    card.style.transition = 'all 0.5s ease';
    card.style.boxShadow = '0 0 0 2px #28a745, 0 5px 15px rgba(0,0,0,0.2)';
    card.style.borderRadius = '8px';
    
    // Quitar el destaque después de 2 segundos
    setTimeout(() => {
      card.style.boxShadow = '';
    }, 2000);
    
  } else {
    // Si no se encuentra el producto, intentar nuevamente después de un tiempo
    console.log('Producto no encontrado, reintentando...');
    setTimeout(() => {
      this.scrollAProducto(productoId);
    }, 500);
  }
}
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  new ManejadorBusqueda();
});