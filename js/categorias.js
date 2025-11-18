
// js/categorias.js - Manejo de categorías y organización de productos

class ManejadorCategorias {
  constructor() {
    this.categorias = new Set();
    this.productos = [];
    this.categoriaActual = 'todas';
    
  }

  // Extraer categorías únicas de los productos
  extraerCategorias(productos) {
    this.productos = productos;
    this.categorias = new Set(productos.map(p => p.categoria).filter(Boolean));
    // Renderizar en ambos lugares
    this.renderizarCategorias();
    this.renderizarCategoriasDropdown();  // <- AGREGAR ESTA LÍNEA

    return this.categorias;
  }

  // Renderizar navegación de categorías
  renderizarCategorias() {
    const contenedor = document.getElementById('categoriasNav');
    if (!contenedor) return;

    const categoriasArray = ['todas', ...Array.from(this.categorias)].sort();
    
    contenedor.innerHTML = categoriasArray.map(categoria => `
      <button class="btn btn-outline-primary btn-categoria ${categoria === this.categoriaActual ? 'active' : ''}" 
              data-categoria="${categoria}">
        ${this.formatearNombreCategoria(categoria)}
      </button>
    `).join('');

    // Agregar event listeners
    document.querySelectorAll('.btn-categoria').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.filtrarPorCategoria(e.target.dataset.categoria);
      });
    });
  }

    // Renderizar categorías en el dropdown de la navbar
  renderizarCategoriasDropdown() {
    const contenedor = document.getElementById('categoriasDropdown');
    if (!contenedor) return;

    const categoriasArray = ['todas', ...Array.from(this.categorias)].sort();
    
    contenedor.innerHTML = categoriasArray.map(categoria => `
      <li>
        <a class="dropdown-item btn-categoria-dropdown" href="#" data-categoria="${categoria}">
          ${this.formatearNombreCategoria(categoria)}
        </a>
      </li>
    `).join('');

    // Agregar event listeners para el dropdown
    document.querySelectorAll('.btn-categoria-dropdown').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.filtrarPorCategoria(e.target.dataset.categoria);
        
        // Cerrar el dropdown después de seleccionar
        const dropdown = document.getElementById('navbarNav');
        if (window.innerWidth < 992) { // Solo en móvil
          const bsCollapse = new bootstrap.Collapse(dropdown);
          bsCollapse.hide();
        }
      });
    });
  }

  // Formatear nombre de categoría para mostrar
  formatearNombreCategoria(categoria) {
    if (categoria === 'todas') return '📦 Todos los productos';
    
    const nombres = {
    'bebidas': '🥤 Bebidas',
    'condimentos': '🧂 Condimentos',
'botanas': '🍿 Botanas',
'utensilios': '🍽️ Utensilios',
'bebidas_alcoholicas': '🍺 Bebidas Alcohólicas',
'huevos': '🥚 Huevos',
'cuidado_personal': '🧴 Cuidado Personal',
'cuidado_bebe': '👶 Cuidado del Bebé',
'limpieza': '🧼 Limpieza',
'abarrotes': '🛒 Abarrotes',
'lacteos': '🥛 Lácteos',
'verduras': '🌾 Verduras',
'frutas': '🍎 Frutas',
'panaderia': '🥖 Panadería',
'carnes': '🥩 Carnes',
'congelados': '🧊 Congelados',
'enlatados': '🥫 Enlatados',
'cereales': '🌾 Cereales',
'dulces': '🍬 Dulces',
'mascotas': '🐾 Mascotas',
'electronica': '🔌 Electrodomésticos',
'ropa': '👕 Ropa',
'juguetes': '🧸 Juguetes',
'deportes': '⚽ Deportes',
'libros': '📚 Libros',
'jardin': '🌻 Jardín',
'ferreteria': '🛠️ Ferretería',
'farmacia': '💊 Farmacia',
'automotriz': '🚗 Automotriz',
'conservas': '🥫 Conservas',
'especias': '🌶️ Especias',
'granos': '🫘 Granos',
'harinas': '🌾 Harinas',
'hogar': '🏠 Hogar',
'pastas': '🍝 Pastas',
'postres': '🍰 Postres',
'sopas': '🍜 Sopas',
'tabaco': '🚬 Tabaco'
    };

    return nombres[categoria] || `📁 ${categoria.charAt(0).toUpperCase() + categoria.slice(1)}`;
  }

    // Filtrar productos por categoría
  filtrarPorCategoria(categoria) {
    this.categoriaActual = categoria;
    
    // Actualizar UI de categorías (botones)
    document.querySelectorAll('.btn-categoria').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.categoria === categoria);
    });

    // Actualizar UI del dropdown  // <- AGREGAR ESTE BLOQUE NUEVO
    document.querySelectorAll('.btn-categoria-dropdown').forEach(link => {
      const isActive = link.dataset.categoria === categoria;
      link.classList.toggle('active', isActive);
      link.classList.toggle('text-white', isActive);
      link.classList.toggle('bg-primary', isActive);
    });

    // Mostrar/ocultar filtro activo
    const filtroActivo = document.getElementById('filtroActivo');
    const categoriaActual = document.getElementById('categoriaActual');
    
    if (categoria === 'todas') {
      filtroActivo.style.display = 'none';
    } else {
      filtroActivo.style.display = 'flex';
      categoriaActual.textContent = this.formatearNombreCategoria(categoria);
    }

    // Renderizar productos filtrados
    this.renderizarProductos();
    
    // Scroll suave a los productos  // <- AGREGAR ESTAS 3 LÍNEAS
    document.querySelector('.productos').scrollIntoView({ 
      behavior: 'smooth' 
    });
  }

  // Renderizar productos organizados
  renderizarProductos() {
    const contenedor = document.getElementById('productosPorCategoria');
    if (!contenedor) return;

    let productosFiltrados = this.productos;
    
    if (this.categoriaActual !== 'todas') {
      productosFiltrados = this.productos.filter(p => p.categoria === this.categoriaActual);
    }

    if (productosFiltrados.length === 0) {
      contenedor.innerHTML = `
        <div class="col-12 text-center">
          <div class="alert alert-warning">
            <h4>No hay productos en esta categoría</h4>
            <p>Prueba con otra categoría o vuelve más tarde</p>
          </div>
        </div>
      `;
      return;
    }

    // Agrupar por categoría si se muestran todos
    if (this.categoriaActual === 'todas') {
      this.renderizarPorCategorias(contenedor);
    } else {
      this.renderizarListaSimple(contenedor, productosFiltrados);
    }
  }

  // Renderizar organizado por categorías
  renderizarPorCategorias(contenedor) {
    const productosPorCategoria = this.agruparPorCategoria();
    
    contenedor.innerHTML = Array.from(this.categorias).map(categoria => {
      const productosCategoria = productosPorCategoria[categoria] || [];
      
      if (productosCategoria.length === 0) return '';

      return `
        <div class="categoria-section mb-5">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h3 class="categoria-titulo">${this.formatearNombreCategoria(categoria)}</h3>
            <span class="badge bg-primary">${productosCategoria.length} productos</span>
          </div>
          <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
            ${productosCategoria.map(producto => this.crearCardProducto(producto)).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  // Renderizar lista simple (cuando se filtra por una categoría)
  renderizarListaSimple(contenedor, productos) {
    contenedor.innerHTML = `
      <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
        ${productos.map(producto => this.crearCardProducto(producto)).join('')}
      </div>
    `;
  }

  // Agrupar productos por categoría
  agruparPorCategoria() {
    return this.productos.reduce((grupos, producto) => {
      const categoria = producto.categoria || 'sin-categoria';
      if (!grupos[categoria]) grupos[categoria] = [];
      grupos[categoria].push(producto);
      return grupos;
    }, {});
  }

  // Crear card de producto (reutilizable)
  // Crear card de producto (reutilizable)
crearCardProducto(producto) {
  // Determinar si el producto necesita cantidad personalizada
  const categoriasCantidadPersonalizada = ['verduras', 'huevos', 'frutas', 'carnes'];
  const necesitaCantidadPersonalizada = categoriasCantidadPersonalizada.includes(producto.categoria);
  
  const precioPorUnidad = producto.precio; // Precio base por kg/lb/pieza
  
  return `
    <div class="col">
      <div class="card h-100 tarjeta">
        <img src="img/${producto.imagen || 'placeholder.jpg'}" class="card-img-top" alt="${producto.nombre}" 
             onerror="this.src='img/placeholder.jpg'">
        <div class="card-body">
          <h3 class="card-title h5">${producto.nombre}</h3>
          <p class="card-text">${producto.descripcion || 'Sin descripción'}</p>
          <p class="price">$${precioPorUnidad.toFixed(2)} ${necesitaCantidadPersonalizada ? 'por kg' : ''}</p>
          ${producto.stock < 5 ? '<span class="badge bg-warning">Poco stock</span>' : ''}
          ${producto.destacado ? '<span class="badge bg-success">Destacado</span>' : ''}
          
          ${necesitaCantidadPersonalizada ? `
            <div class="cantidad-personalizada mt-3">
              <label class="form-label small">Cantidad deseada:</label>
              <div class="input-group input-group-sm">
                <input type="number" class="form-control cantidad-input" data-id="${producto.id}" placeholder="Ej: 0.5"step="0.1"min="0.1"value="1">
                <span class="input-group-text">kg</span>
              </div>
              <div class="precio-calculado mt-2">
                <small class="text-muted">Total: <strong class="text-success">$${precioPorUnidad.toFixed(2)}</strong></small>
              </div>
            </div>
          ` : ''}
        </div>
        <div class="card-footer bg-transparent">
          <button class="btn agregar w-100" 
                  data-id="${producto.id}" 
                  data-nombre="${producto.nombre}" 
                  data-precio="${precioPorUnidad}"
                  data-cantidad-personalizada="${necesitaCantidadPersonalizada ? 'true' : 'false'}"
                  ${producto.stock === 0 ? 'disabled' : ''}>
            <i class="fas fa-cart-plus me-2"></i>
            ${producto.stock === 0 ? 'Sin stock' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  `;
}
}

// Instancia global
const manejadorCategorias = new ManejadorCategorias();

// Event listener para el botón "Mostrar todos"
document.addEventListener('DOMContentLoaded', function() {
  const mostrarTodosBtn = document.getElementById('mostrarTodos');
  if (mostrarTodosBtn) {
    mostrarTodosBtn.addEventListener('click', () => {
      manejadorCategorias.filtrarPorCategoria('todas');
    });
  }
});