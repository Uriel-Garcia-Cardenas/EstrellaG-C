// js/admin.js - Versión corregida con carga por categorías
class AdminManager {
    constructor() {
        this.pedidos = [];
        this.productos = [];
        this.productosFiltrados = [];
        this.filtroEstado = 'todos';
        this.filtroCategoria = 'todas';
        this.categorias = [];
        this.isLoading = false;
        this.currentProductoId = null;
        
        this.init();
    }

    async init() {
        try {
            this.setupEventListeners();
            await this.cargarDatosIniciales();
        } catch (error) {
            console.error('Error inicializando admin:', error);
            this.mostrarError('Error al inicializar el panel de administración');
        }
    }

    setupEventListeners() {
        // Event delegation para mejor performance
        document.addEventListener('click', (e) => {
            if (e.target.closest('.estado-pedido')) {
                const select = e.target.closest('.estado-pedido');
                this.actualizarEstadoPedido(select.dataset.pedidoId, select.value);
            }
            
            if (e.target.closest('.editar-producto')) {
                const btn = e.target.closest('.editar-producto');
                this.editarProducto(btn.dataset.productoId);
            }
            
            if (e.target.closest('.eliminar-producto')) {
                const btn = e.target.closest('.eliminar-producto');
                this.eliminarProducto(btn.dataset.productoId);
            }

            if (e.target.closest('.ver-pagos')) {
                const btn = e.target.closest('.ver-pagos');
                this.verPagosPedido(btn.dataset.pedidoId);
    }
        });

        // Filtro de estado de pedidos
        document.getElementById('filtroEstado').addEventListener('change', (e) => {
            this.filtroEstado = e.target.value;
            this.renderizarPedidos();
        });

        // Filtro de categoría de productos - AHORA CARGA DESDE FIREBASE
        document.getElementById('filtroCategoria').addEventListener('change', async (e) => {
            this.filtroCategoria = e.target.value;
            await this.cargarProductosPorCategoria(); // Cambiar esto
        });

        // Guardar producto
        document.getElementById('guardarProducto').addEventListener('click', () => {
            this.guardarProducto();
        });

        // Limpiar formulario al abrir modal para nuevo producto
        document.getElementById('modalProducto').addEventListener('show.bs.modal', () => {
            if (!this.currentProductoId) {
                this.limpiarFormularioProducto();
            }
        });

        // Limpiar ID al cerrar modal
        document.getElementById('modalProducto').addEventListener('hidden.bs.modal', () => {
            this.currentProductoId = null;
            this.limpiarFormularioProducto();
        });
    }
      
        
// ✅ NUEVA FUNCIÓN: Ver pagos del pedido (AGREGA ESTA FUNCIÓN COMPLETA)
async verPagosPedido(pedidoId) {
  try {
    const pagos = await fb.obtenerPagosPorPedido(pedidoId);
    
    let contenidoPagos = '';
    if (pagos.length === 0) {
      contenidoPagos = '<p class="text-muted">No hay información de pagos para este pedido.</p>';
    } else {
      contenidoPagos = pagos.map(pago => `
        <div class="border rounded p-3 mb-2">
          <div class="d-flex justify-content-between">
            <div>
              <strong>Método:</strong> ${pago.metodoPago}<br>
              <strong>Monto:</strong> $${pago.monto?.toFixed(2) || '0.00'}<br>
              <strong>Estado:</strong> <span class="badge bg-${pago.estado === 'approved' ? 'success' : 'warning'}">${pago.estado || 'pendiente'}</span>
            </div>
            <div class="text-end">
              <small class="text-muted">${this.formatearFecha(pago.fechaCreacion)}</small>
              ${pago.paymentId ? `<br><small><strong>ID Pago:</strong> ${pago.paymentId.substring(0, 8)}</small>` : ''}
            </div>
          </div>
        </div>
      `).join('');
    }
    
    // Mostrar modal con información de pagos
    const modalHTML = `
      <div class="modal fade" id="modalPagos" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Pagos - Pedido #${pedidoId.substring(0, 8)}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              ${contenidoPagos}
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Remover modal anterior si existe
    const modalAnterior = document.getElementById('modalPagos');
    if (modalAnterior) {
      modalAnterior.remove();
    }
    
    // Agregar nuevo modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalPagos'));
    modal.show();
    
  } catch (error) {
    console.error('Error cargando pagos:', error);
    this.mostrarMensaje('Error al cargar la información de pagos', 'danger');
  }
}


    async cargarDatosIniciales() {
        await Promise.all([
            this.cargarPedidos(),
            this.cargarCategorias(), // Cambiar esto - cargar categorías primero
            this.cargarProductosPorCategoria() // Cambiar esto - cargar productos después
        ]);
    }

    async cargarPedidos() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.mostrarCargaPedidos();
        
        try {
            this.pedidos = await fb.obtenerPedidos();
            this.renderizarPedidos();
        } catch (error) {
            console.error('Error cargando pedidos:', error);
            this.mostrarErrorPedidos('Error al cargar los pedidos');
        } finally {
            this.isLoading = false;
        }
    }

    // NUEVO MÉTODO: Cargar categorías desde Firebase
    async cargarCategorias() {
        try {
            this.categorias = await fb.obtenerCategorias();
            this.crearFiltroCategorias();
        } catch (error) {
            console.error('Error cargando categorías:', error);
            this.mostrarMensaje('Error al cargar las categorías', 'warning');
        }
    }

    // MÉTODO MODIFICADO: Ahora carga solo los productos de la categoría seleccionada
    async cargarProductosPorCategoria() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.mostrarCargaProductos();
        
        try {
            // SOLO CARGAR PRODUCTOS DE LA CATEGORÍA SELECCIONADA
            this.productos = await fb.obtenerProductosPorCategoria(this.filtroCategoria);
            this.productosFiltrados = [...this.productos]; // Para consistencia
            this.renderizarProductos();
        } catch (error) {
            console.error('Error cargando productos:', error);
            this.mostrarErrorProductos('Error al cargar los productos');
        } finally {
            this.isLoading = false;
        }
    }

    crearFiltroCategorias() {
        const filtroCategoria = document.getElementById('filtroCategoria');
        if (!filtroCategoria) return;

        // Limpiar opciones existentes (excepto la primera)
        while (filtroCategoria.children.length > 1) {
            filtroCategoria.removeChild(filtroCategoria.lastChild);
        }

        // Agregar categorías desde Firebase
        this.categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = this.formatearCategoria(categoria);
            filtroCategoria.appendChild(option);
        });
    }

    formatearCategoria(categoria) {
        return categoria.charAt(0).toUpperCase() + categoria.slice(1);
    }

    // ELIMINAR ESTE MÉTODO - ya no se necesita filtrar localmente
    // filtrarProductos() {
    //     // Este método ya no es necesario porque cargamos directamente desde Firebase
    // }

    renderizarPedidos() {
        const container = document.getElementById('listaPedidos');
        if (!container) return;

        const pedidosFiltrados = this.filtroEstado === 'todos' 
            ? this.pedidos 
            : this.pedidos.filter(p => p.estado === this.filtroEstado);

        if (pedidosFiltrados.length === 0) {
            container.innerHTML = `
                <div class="alert alert-warning">
                    No hay pedidos ${this.filtroEstado !== 'todos' ? `con estado "${this.filtroEstado}"` : ''}
                </div>
            `;
            return;
        }

        const fragment = document.createDocumentFragment();
        
        pedidosFiltrados.forEach(pedido => {
            const pedidoElement = this.crearElementoPedido(pedido);
            fragment.appendChild(pedidoElement);
        });

        container.innerHTML = '';
        container.appendChild(fragment);
    }

    crearElementoPedido(pedido) {
        const div = document.createElement('div');
        div.className = `card mb-3 pedido-card ${pedido.estado || 'pendiente'}`;
        
        const fecha = pedido.fecha ? this.formatearFecha(pedido.fecha) : 'Fecha no disponible';
        const cliente = pedido.cliente || {};
        const estadoPago = pedido.estadoPago || 'pendiente';
        const badgePagoColor = estadoPago === 'pagado' ? 'success' : estadoPago === 'pendiente' ? 'warning' : 'secondary';
        
        div.innerHTML = `
    <div class="card-body">
    <div class="d-flex justify-content-between align-items-start">
    <div class="flex-grow-1">
        <h5 class="card-title">Pedido #${pedido.id.substring(0, 8)}</h5>
        <p class="card-text mb-1"><strong>Cliente:</strong> ${cliente.nombre || 'N/A'}</p>
        <p class="card-text mb-1"><strong>Teléfono:</strong> ${cliente.telefono || 'N/A'}</p>
        <p class="card-text mb-1"><strong>Fecha:</strong> ${fecha}</p>
        <p class="card-text mb-1"><strong>Total:</strong> $${pedido.total?.toFixed(2) || '0.00'}</p>
        <!-- ✅ NUEVA LÍNEA: Método de pago -->
        <p class="card-text mb-1"><strong>Método pago:</strong> ${pedido.metodoPago || 'N/A'}</p>
    </div>
    <div class="text-end ms-3">
        <!-- ✅ MANTÉN tu badge de estado existente -->
        <span class="badge bg-${this.getBadgeColor(pedido.estado)} mb-2">${pedido.estado || 'pendiente'}</span>
        
        <!-- ✅ NUEVO: Badge de estado de pago (AGREGA ESTA LÍNEA) -->
        <span class="badge bg-${badgePagoColor} mb-2">Pago: ${estadoPago}</span>
        
        <!-- ✅ MANTÉN tu select de estado existente -->
        <select class="form-select form-select-sm estado-pedido" data-pedido-id="${pedido.id}">
            <option value="pendiente" ${pedido.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
            <option value="confirmado" ${pedido.estado === 'confirmado' ? 'selected' : ''}>Confirmado</option>
            <option value="enviado" ${pedido.estado === 'enviado' ? 'selected' : ''}>Enviado</option>
            <option value="entregado" ${pedido.estado === 'entregado' ? 'selected' : ''}>Entregado</option>
        </select>
        
        <!-- ✅ NUEVO: Botón para ver pagos (AGREGA ESTE BOTÓN) -->
        <button class="btn btn-sm btn-outline-info mt-2 ver-pagos" data-pedido-id="${pedido.id}">
            <i class="fas fa-money-bill me-1"></i>Ver Pagos
        </button>
    </div>
    </div>
    
    <!-- ✅ MANTÉN el resto de tu HTML existente para productos -->
    <div class="mt-3">
      <h6>Productos:</h6>
      <div class="table-responsive">
        <table class="table table-sm table-bordered">
          <thead class="table-light">
            <tr>
              <th>Producto</th>
              <th width="80">Cantidad</th>
              <th width="100">Precio</th>
              <th width="100">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${this.renderizarProductosPedido(pedido.productos)}
          </tbody>
        </table>
      </div>
    </div>
  </div>
`;

        return div;
    }

    renderizarProductosPedido(productos) {
        if (!productos || !Array.isArray(productos)) {
            return '<tr><td colspan="4" class="text-center">No hay información de productos</td></tr>';
        }

        return productos.map(p => `
            <tr>
                <td>${p.nombre || 'Producto'}</td>
                <td class="text-center">${p.cantidad || 0}</td>
                <td class="text-end">$${(p.precio || 0).toFixed(2)}</td>
                <td class="text-end">$${((p.precio || 0) * (p.cantidad || 0)).toFixed(2)}</td>
            </tr>
        `).join('');
    }

    formatearFecha(fechaFirestore) {
        try {
            if (fechaFirestore?.toDate) {
                return fechaFirestore.toDate().toLocaleDateString('es-MX');
            }
            return 'Fecha inválida';
        } catch (error) {
            return 'Fecha no disponible';
        }
    }

    getBadgeColor(estado) {
        const colores = {
            pendiente: 'warning',
            confirmado: 'info',
            enviado: 'primary',
            entregado: 'success'
        };
        return colores[estado] || 'secondary';
    }

    async actualizarEstadoPedido(pedidoId, nuevoEstado) {
        try {
            await fb.actualizarEstadoPedido(pedidoId, nuevoEstado);
            
            const pedido = this.pedidos.find(p => p.id === pedidoId);
            if (pedido) {
                pedido.estado = nuevoEstado;
                const badge = document.querySelector(`[data-pedido-id="${pedidoId}"]`).closest('.card').querySelector('.badge');
                if (badge) {
                    badge.className = `badge bg-${this.getBadgeColor(nuevoEstado)} mb-2 d-block`;
                    badge.textContent = nuevoEstado;
                }
            }
            
            this.mostrarMensaje('Estado actualizado correctamente', 'success');
        } catch (error) {
            console.error('Error actualizando estado:', error);
            this.mostrarMensaje('Error al actualizar el estado', 'danger');
        }
    }

    renderizarProductos() {
        const container = document.getElementById('listaProductos');
        if (!container) return;

        // Mostrar información del filtro
        this.mostrarInfoFiltro();

        if (this.productos.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-warning text-center">
                        <i class="fas fa-box-open me-2"></i>
                        No hay productos ${this.filtroCategoria !== 'todas' ? `en la categoría "${this.formatearCategoria(this.filtroCategoria)}"` : 'disponibles'}
                    </div>
                </div>
            `;
            return;
        }

        const fragment = document.createDocumentFragment();
        
        this.productos.forEach(producto => {
            const productoElement = this.crearElementoProducto(producto);
            fragment.appendChild(productoElement);
        });

        container.innerHTML = '';
        container.appendChild(fragment);
    }

    mostrarInfoFiltro() {
        const infoFiltro = document.getElementById('infoFiltroProductos');
        if (!infoFiltro) return;

        const totalProductos = this.productos.length;
        
        let infoText = `Mostrando ${totalProductos} productos`;
        if (this.filtroCategoria !== 'todas') {
            infoText += ` en <strong>${this.formatearCategoria(this.filtroCategoria)}</strong>`;
        } else {
            infoText += ` en <strong>todas las categorías</strong>`;
        }

        infoFiltro.innerHTML = infoText;
    }

    crearElementoProducto(producto) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 mb-4';
        
        col.innerHTML = `
            <div class="card h-100 tarjeta">
                <div class="tarjeta-img-container">
                    <img src="img/${producto.imagen}" class="card-img-top" alt="${producto.nombre}" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg=='">
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${this.escapeHtml(producto.nombre)}</h5>
                    <p class="card-text flex-grow-1">${this.escapeHtml(producto.descripcion) || 'Sin descripción'}</p>
                    <div class="mt-auto">
                        <p class="price">$${producto.precio?.toFixed(2) || '0.00'}</p>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="badge bg-${producto.stock > 0 ? 'success' : 'danger'}">
                                Stock: ${producto.stock || 0}
                            </span>
                            <span class="badge bg-secondary">${producto.categoria || 'Sin categoría'}</span>
                        </div>
                        ${producto.destacado ? '<span class="badge bg-warning mb-2">Destacado</span>' : ''}
                        
                        <div class="btn-group w-100">
                            <button class="btn btn-outline-primary btn-sm editar-producto" data-producto-id="${producto.id}">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn btn-outline-danger btn-sm eliminar-producto" data-producto-id="${producto.id}">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return col;
    }

    async editarProducto(productoId) {
        try {
            const producto = this.productos.find(p => p.id === productoId);
            if (!producto) {
                this.mostrarMensaje('Producto no encontrado', 'warning');
                return;
            }

            this.currentProductoId = productoId;
            
            document.getElementById('productoId').value = producto.id;
            document.getElementById('productoNombre').value = producto.nombre || '';
            document.getElementById('productoPrecio').value = producto.precio || '';
            document.getElementById('productoCategoria').value = producto.categoria || '';
            document.getElementById('productoStock').value = producto.stock || 0;
            document.getElementById('productoImagen').value = producto.imagen || '';
            document.getElementById('productoDescripcion').value = producto.descripcion || '';
            document.getElementById('productoDestacado').checked = producto.destacado || false;

            document.getElementById('modalProductoTitulo').textContent = 'Editar Producto';

            const modal = new bootstrap.Modal(document.getElementById('modalProducto'));
            modal.show();
        } catch (error) {
            console.error('Error preparando edición:', error);
            this.mostrarMensaje('Error al cargar el producto para editar', 'danger');
        }
    }

    async eliminarProducto(productoId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            return;
        }

        try {
            await fb.eliminarProducto(productoId);
            
            // Recargar los productos de la categoría actual después de eliminar
            await this.cargarProductosPorCategoria();
            
            this.mostrarMensaje('Producto eliminado correctamente', 'success');
        } catch (error) {
            console.error('Error eliminando producto:', error);
            this.mostrarMensaje('Error al eliminar el producto', 'danger');
        }
    }

   async guardarProducto() {
    const form = document.getElementById('formProducto');
    
    // Validar formulario
    if (!form.checkValidity()) {
        form.reportValidity();
        this.mostrarMensaje('Por favor, completa todos los campos requeridos', 'warning');
        return;
    }

    // Obtener datos del formulario
    const productoId = document.getElementById('productoId').value;
    const productoData = {
        nombre: document.getElementById('productoNombre').value.trim(),
        precio: parseFloat(document.getElementById('productoPrecio').value),
        categoria: document.getElementById('productoCategoria').value,
        stock: parseInt(document.getElementById('productoStock').value),
        imagen: document.getElementById('productoImagen').value.trim(),
        descripcion: document.getElementById('productoDescripcion').value.trim(),
        destacado: document.getElementById('productoDestacado').checked,
        fechaActualizacion: new Date() // Agregar timestamp
    };

    // Validaciones adicionales
    if (productoData.precio <= 0) {
        this.mostrarMensaje('El precio debe ser mayor a 0', 'warning');
        document.getElementById('productoPrecio').focus();
        return;
    }

    if (productoData.stock < 0) {
        this.mostrarMensaje('El stock no puede ser negativo', 'warning');
        document.getElementById('productoStock').focus();
        return;
    }

    if (!productoData.imagen) {
        this.mostrarMensaje('Debes proporcionar una imagen', 'warning');
        document.getElementById('productoImagen').focus();
        return;
    }

    // Mostrar indicador de carga
    const guardarBtn = document.getElementById('guardarProducto');
    const originalText = guardarBtn.innerHTML;
    guardarBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Guardando...';
    guardarBtn.disabled = true;

    try {
        let resultado;
        if (productoId) {
            // Actualizar producto existente
            resultado = await fb.actualizarProducto(productoId, productoData);
            this.mostrarMensaje('✅ Producto actualizado correctamente', 'success');
        } else {
            // Agregar nuevo producto
            resultado = await fb.agregarProducto(productoData);
            this.mostrarMensaje('✅ Producto agregado correctamente', 'success');
        }

        // Recargar datos después de guardar
        await Promise.all([
            this.cargarCategorias(),
            this.cargarProductosPorCategoria()
        ]);

        // Cerrar modal después de un breve delay
        setTimeout(() => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalProducto'));
            if (modal) {
                modal.hide();
            }
        }, 1000);

    } catch (error) {
        console.error('Error guardando producto:', error);
        this.mostrarMensaje(`❌ Error al guardar el producto: ${error.message}`, 'danger');
    } finally {
        // Restaurar botón
        guardarBtn.innerHTML = originalText;
        guardarBtn.disabled = false;
    }
}

    limpiarFormularioProducto() {
        document.getElementById('formProducto').reset();
        document.getElementById('productoId').value = '';
        document.getElementById('modalProductoTitulo').textContent = 'Agregar Producto';
    }

    // Métodos de utilidad para mostrar estados
    mostrarCargaPedidos() {
        const container = document.getElementById('listaPedidos');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando pedidos...</span>
                    </div>
                    <p class="mt-2 text-muted">Cargando pedidos...</p>
                </div>
            `;
        }
    }

    mostrarErrorPedidos(mensaje) {
        const container = document.getElementById('listaPedidos');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>${mensaje}
                </div>
            `;
        }
    }

    mostrarCargaProductos() {
        const container = document.getElementById('listaProductos');
        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando productos...</span>
                    </div>
                    <p class="mt-2 text-muted">Cargando productos...</p>
                </div>
            `;
        }
    }

    mostrarErrorProductos(mensaje) {
        const container = document.getElementById('listaProductos');
        if (container) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>${mensaje}
                    </div>
                </div>
            `;
        }
    }

    mostrarMensaje(mensaje, tipo = 'info') {
    // Crear contenedor de toasts si no existe
    const toastContainer = document.getElementById('toastContainer') || this.crearToastContainer();
    
    const toastId = 'toast-' + Date.now();
    const toastEl = document.createElement('div');
    toastEl.id = toastId;
    toastEl.className = `toast align-items-center text-bg-${tipo} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas ${this.getToastIcon(tipo)} me-2"></i>
                ${mensaje}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl, {
        autohide: true,
        delay: 3000
    });
    
    toast.show();
    
    // Remover el toast del DOM cuando se oculte
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}

getToastIcon(tipo) {
    const icons = {
        'success': 'fa-check-circle',
        'danger': 'fa-exclamation-triangle',
        'warning': 'fa-exclamation-circle',
        'info': 'fa-info-circle'
    };
    return icons[tipo] || 'fa-info-circle';
}

    crearToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(container);
        return container;
    }

    mostrarError(mensaje) {
        this.mostrarMensaje(mensaje, 'danger');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}



// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    fb.auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = "login.html";
        } else {
            window.adminManager = new AdminManager();
        }
    });
});

