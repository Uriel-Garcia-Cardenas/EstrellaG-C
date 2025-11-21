
// Configuración de Firebase
// ¡REEMPLAZA ESTOS VALORES CON LOS DE TU PROYECTO FIREBASE!

const firebaseConfig = {
  apiKey: "AIzaSyBmecDvGI7jtqDEO2ajTiu7Jsy6J83Kb3o",
  authDomain: "estrella-gc-tienda.firebaseapp.com",
  projectId: "estrella-gc-tienda",
  storageBucket: "estrella-gc-tienda.firebasestorage.app",
  messagingSenderId: "36924682007",
  appId: "1:36924682007:web:65e5095621aa3777339152",
  measurementId: "G-LNKF6N4F77"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);


// Inicializar servicios
const db = firebase.firestore();
const auth = firebase.auth();
// Configuración de Mercado Pago
const MP_PUBLIC_KEY = ""; // Reemplaza con tu public key
const MP_ACCESS_TOKEN = ""; // Reemplaza con tu access token

// Función para obtener los productos desde Firebase
async function obtenerProductos() {
  try {
    const productosSnapshot = await db.collection("productos").get();
    const productos = [];
    
    productosSnapshot.forEach(doc => {
      productos.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return productos;
  } catch (error) {
    console.error("Error obteniendo productos:", error);
    throw error;
  }
}

// En firebase.js - agregar estas funciones
async function obtenerPedidosPaginados(limite = 10, ultimoDoc = null) {
    try {
        let query = db.collection("pedidos")
            .orderBy("fecha", "desc")
            .limit(limite);
            
        if (ultimoDoc) {
            query = query.startAfter(ultimoDoc);
        }
        
        const snapshot = await query.get();
        const pedidos = [];
        let ultimoDocumento = null;
        
        snapshot.forEach(doc => {
            pedidos.push({
                id: doc.id,
                ...doc.data()
            });
            ultimoDocumento = doc;
        });
        
        return { pedidos, ultimoDocumento };
    } catch (error) {
        console.error("Error obteniendo pedidos paginados:", error);
        throw error;
    }
}

// Función para guardar un pedido en Firebase
async function guardarPedido(pedido) {
  try {
    const docRef = await db.collection("pedidos").add(pedido);
    return docRef.id;
  } catch (error) {
    console.error("Error guardando pedido:", error);
    throw error;
  }
}

// Función para obtener todos los pedidos
async function obtenerPedidos() {
  try {
    const pedidosSnapshot = await db.collection("pedidos").orderBy("fecha", "desc").get();
    const pedidos = [];
    
    pedidosSnapshot.forEach(doc => {
      pedidos.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return pedidos;
  } catch (error) {
    console.error("Error obteniendo pedidos:", error);
    throw error;
  }
}

// Función para actualizar el estado de un pedido
async function actualizarEstadoPedido(pedidoId, nuevoEstado) {
  try {
    await db.collection("pedidos").doc(pedidoId).update({
      estado: nuevoEstado
    });
  } catch (error) {
    console.error("Error actualizando pedido:", error);
    throw error;
  }
}

// Función para agregar un nuevo producto
// Función para agregar un nuevo producto
async function agregarProducto(producto) {
  try {
    // Validar datos antes de guardar
    if (!producto.nombre || !producto.precio || !producto.categoria) {
      throw new Error('Datos del producto incompletos');
    }
    
    const docRef = await db.collection("productos").add({
      ...producto,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error agregando producto:", error);
    throw error;
  }
}

// Función para actualizar un producto
async function actualizarProducto(productoId, datosActualizados) {
  try {
    if (!productoId) {
      throw new Error('ID de producto no válido');
    }
    
    await db.collection("productos").doc(productoId).update({
      ...datosActualizados,
      fechaActualizacion: new Date()
    });
  } catch (error) {
    console.error("Error actualizando producto:", error);
    throw error;
  }
}

// Función para actualizar un producto
async function actualizarProducto(productoId, datosActualizados) {
  try {
    await db.collection("productos").doc(productoId).update(datosActualizados);
  } catch (error) {
    console.error("Error actualizando producto:", error);
    throw error;
  }
}

// Función para eliminar un producto
async function eliminarProducto(productoId) {
  try {
    await db.collection("productos").doc(productoId).delete();
  } catch (error) {
    console.error("Error eliminando producto:", error);
    throw error;
  }
}

// Agregar estas funciones al final de firebase.js, antes del export

// Función para obtener productos por categoría
async function obtenerProductosPorCategoria(categoria) {
  try {
    let query = db.collection("productos");
    
    if (categoria && categoria !== 'todas') {
      query = query.where("categoria", "==", categoria);
    }
    
    const productosSnapshot = await query.get();
    const productos = [];
    
    productosSnapshot.forEach(doc => {
      productos.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return productos;
  } catch (error) {
    console.error("Error obteniendo productos por categoría:", error);
    throw error;
  }
}

// Función para obtener todas las categorías disponibles
async function obtenerCategorias() {
  try {
    const productosSnapshot = await db.collection("productos").get();
    const categoriasSet = new Set();
    
    productosSnapshot.forEach(doc => {
      const categoria = doc.data().categoria;
      if (categoria) {
        categoriasSet.add(categoria);
      }
    });
    
    return Array.from(categoriasSet).sort();
  } catch (error) {
    console.error("Error obteniendo categorías:", error);
    throw error;
  }
}



// Función para crear preferencia de pago en Mercado Pago
async function crearPreferenciaMercadoPago(pedido) {
  try {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: pedido.productos.map(producto => ({
          title: producto.nombre,
          quantity: producto.cantidad,
          unit_price: producto.precio,
          currency_id: 'MXN'
        })),
        payer: {
          name: pedido.cliente.nombre,
          phone: {
            number: pedido.cliente.telefono
          }
        },
        payment_methods: {
          excluded_payment_types: [
            { id: 'atm' } // Excluir cajeros automáticos
          ],
          installments: 12 // Máximo de cuotas
        },
        external_reference: pedido.id, // ID de tu pedido
        notification_url: 'https://tudominio.com/notificaciones', // Opcional: para webhooks
        back_urls: {
          success: 'https://tudominio.com/pago-exitoso',
          failure: 'https://tudominio.com/pago-fallido',
          pending: 'https://tudominio.com/pago-pendiente'
        },
        auto_return: 'approved'
      })
    });

    if (!response.ok) {
      throw new Error('Error al crear preferencia de pago');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creando preferencia Mercado Pago:', error);
    throw error;
  }
}

// Función para verificar estado de pago
async function verificarEstadoPago(paymentId) {
  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al verificar pago');
    }

    const payment = await response.json();
    return payment;
  } catch (error) {
    console.error('Error verificando pago:', error);
    throw error;
  }
}

// Función para obtener pagos de un pedido
async function obtenerPagosPorPedido(pedidoId) {
  try {
    const pagosSnapshot = await db.collection("pagos")
      .where("pedidoId", "==", pedidoId)
      .orderBy("fechaCreacion", "desc")
      .get();
    
    const pagos = [];
    pagosSnapshot.forEach(doc => {
      pagos.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return pagos;
  } catch (error) {
    console.error("Error obteniendo pagos:", error);
    throw error;
  }
}

// Exportar funciones para usar en otros archivos
window.fb = {
  db,
  auth,
  obtenerProductos,
  obtenerProductosPorCategoria, // <- AGREGAR ESTA LÍNEA
  obtenerCategorias,           // <- AGREGAR ESTA LÍNEA
  guardarPedido,
  obtenerPedidos,
  actualizarEstadoPedido,
  agregarProducto,
  actualizarProducto,
  eliminarProducto,
  // Agregar estas nuevas funciones
  crearPreferenciaMercadoPago,
  verificarEstadoPago,
  obtenerPagosPorPedido,
  // Constantes de Mercado Pago
  MP_PUBLIC_KEY,
  MP_ACCESS_TOKEN
};