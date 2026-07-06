import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axios';

const Dashboard = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [user, setUser] = useState(null);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [buyQuantities, setBuyQuantities] = useState({});
    const [cart, setCart] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newProduct, setNewProduct] = useState({ productCode: '', productName: '', unitPrice: '', unitsInStock: '', category: 'Beverages' });

    const [editingProductId, setEditingProductId] = useState(null);
    const [editForm, setEditForm] = useState({ productName: '', unitPrice: '', unitsInStock: '' });

    const [viewMode, setViewMode] = useState('catalog');
    const [orders, setOrders] = useState([]);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    const [activeOrderId, setActiveOrderId] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        try {
            const decoded = jwtDecode(token);
            setUser(decoded);
            fetchProducts();
        } catch (error) { handleLogout(); }
    }, [navigate]);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            setProducts(response.data);
        } catch (error) {
            if (error.response?.status === 401) {
                showMessage('El tiempo de uso de la aplicación ha finalizado, por favor inicie sesión nuevamente.', 'warning');
                setTimeout(() => handleLogout(), 3500);
            } else { showMessage('Error al cargar los productos.', 'danger'); }
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await api.get('/orders');
            setOrders(response.data);
            setViewMode('orders');
            setSelectedOrderDetails(null);
            setActiveOrderId(null);
        } catch (error) { showMessage('Error al cargar las órdenes.', 'danger'); }
    };

    const fetchOrderDetails = async (orderId) => {
        try {
            const response = await api.get(`/orders/${orderId}/details`);
            setSelectedOrderDetails(response.data);
            setActiveOrderId(orderId);
        } catch (error) { showMessage('Error al cargar los detalles de la orden.', 'danger'); }
    };

    const handleLogout = async () => {
        try { await api.post('/auth/logout'); } catch (e) { } finally {
            localStorage.removeItem('token'); navigate('/login');
        }
    };

    const showMessage = (text, type) => {
        setMessage(text); setMessageType(type);
        setTimeout(() => setMessage(''), 5000);
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        try {
            await api.post('/products', {
                productCode: newProduct.productCode,
                productName: newProduct.productName,
                unitPrice: parseFloat(newProduct.unitPrice),
                unitsInStock: parseInt(newProduct.unitsInStock),
                category: newProduct.category
            });
            showMessage(`Producto "${newProduct.productName}" creado exitosamente.`, 'success');
            setShowCreateForm(false);
            setNewProduct({ productCode: '', productName: '', unitPrice: '', unitsInStock: '', category: 'Beverages' });
            fetchProducts();
        } catch (error) { showMessage('No se pudo crear el producto.', 'danger'); }
    };

    const handleSaveUpdate = async (id) => {
        try {
            await api.put(`/products/${id}`, {
                productName: editForm.productName,
                unitPrice: parseFloat(editForm.unitPrice),
                unitsInStock: parseInt(editForm.unitsInStock)
            });
            showMessage('Información del producto actualizada correctamente.', 'success');
            setEditingProductId(null);
            fetchProducts();
        } catch (error) { showMessage('Error al actualizar el producto.', 'danger'); }
    };

    const handleAddToCart = (product) => {
        const qtyToAdd = Number(buyQuantities[product.id] || 1);
        if (qtyToAdd <= 0) {
            showMessage('La cantidad debe ser al menos 1.', 'warning');
            return;
        }
        setCart(prev => {
            const item = prev.find(i => i.id === product.id);
            if ((item ? item.quantity : 0) + qtyToAdd > product.unitsInStock) {
                showMessage('Stock insuficiente para agregar esa cantidad.', 'warning'); return prev;
            }
            showMessage(`${product.productName} agregado.`, 'success');
            return item ? prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + qtyToAdd } : i) : [...prev, { ...product, quantity: qtyToAdd }];
        });
    };

    const handleCheckout = async () => {
        try {
            showMessage('Procesando pago...', 'info');
            for (const item of cart) { await api.post('/products/buy', { productId: item.id, quantity: item.quantity }); }
            showMessage('¡Compra procesada con éxito!', 'success'); setCart([]); fetchProducts();
        } catch (e) { showMessage('Error al procesar la compra.', 'danger'); }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Segura que quieres dar de baja este producto?')) {
            try { await api.delete(`/products/${id}`); showMessage('Producto desactivado.', 'success'); fetchProducts(); } catch (e) { }
        }
    };

    const filteredProducts = products.filter(p =>
        p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.productCode && p.productCode.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const cartTotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

    if (!user) return <div className="min-vh-100 bg-dark d-flex justify-content-center align-items-center text-info"><div className="spinner-border"></div></div>;

    return (
        <div className="min-vh-100 text-light p-4" style={{ backgroundColor: '#0D1117', fontFamily: "'Inter', sans-serif" }}>
            <div className="container-fluid">
                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary pb-3">
                    <h2><i className="bi bi-rocket-takeoff text-info me-2"></i>Northwind <span className="text-info">Dashboard</span></h2>
                    <div className="d-flex align-items-center gap-2">
                        <button onClick={() => setViewMode('catalog')} className={`btn rounded-pill px-3 ${viewMode === 'catalog' ? 'btn-info text-dark' : 'btn-outline-light'}`}>
                            <i className="bi bi-grid me-2"></i>Catálogo
                        </button>

                        {/* BOTÓN DINÁMICO SEGÚN ROL */}
                        <button onClick={fetchOrders} className={`btn rounded-pill px-3 ${viewMode === 'orders' ? 'btn-info text-dark' : 'btn-outline-light'}`}>
                            <i className={user.role === 'Admin' ? "bi bi-receipt me-2" : "bi bi-bag-check me-2"}></i>
                            {user.role === 'Admin' ? 'Órdenes' : 'Mis Compras'}
                        </button>

                        <div className="d-none d-md-flex flex-column align-items-end ms-2">
                            <span className="fw-bold text-light lh-1">{user.name}</span>
                            <small className="text-info" style={{ fontSize: '0.75rem' }}>{user.email}</small>
                        </div>
                        <span className="badge p-2 px-3 shadow-sm ms-2" style={{ backgroundColor: '#161B22', border: '1px solid #30363D' }}>
                            <i className="bi bi-shield-lock-fill me-2 text-warning"></i>{user.role}
                        </span>

                        <button onClick={handleLogout} className="btn btn-outline-danger rounded-pill px-3 ms-2" title="Cerrar Sesión">
                            <i className="bi bi-box-arrow-right"></i>
                        </button>
                    </div>
                </div>

                {message && (
                    <div className={`alert alert-${messageType} shadow-sm d-flex align-items-center`} role="alert">
                        <i className="bi bi-info-circle-fill me-2"></i><div>{message}</div>
                    </div>
                )}

                {viewMode === 'catalog' && (
                    <div className="row g-4">
                        <div className={user.role === 'Admin' ? "col-12" : "col-lg-8"}>
                            <div className="d-flex gap-3 mb-4 flex-wrap align-items-center justify-content-between">
                                <div className="position-relative flex-grow-1" style={{ maxWidth: '400px' }}>
                                    <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                                    <input
                                        type="text"
                                        className="form-control bg-dark text-light border-secondary ps-5 rounded-pill"
                                        placeholder="Buscar por nombre o código..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                {user.role === 'Admin' && (
                                    <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn btn-info rounded-pill fw-bold text-dark">
                                        <i className="bi bi-plus-circle me-2"></i>Nuevo Producto
                                    </button>
                                )}
                            </div>

                            {/* FORMULARIO CON ETIQUETAS Y DISEÑO ARREGLADO */}
                            {showCreateForm && user.role === 'Admin' && (
                                <form onSubmit={handleCreateProduct} className="p-4 mb-4 rounded border shadow-sm" style={{ backgroundColor: '#161B22', borderColor: '#30363D' }}>
                                    <h5 className="text-info mb-4"><i className="bi bi-file-earmark-plus me-2"></i>Registrar Nuevo Producto</h5>
                                    <div className="row g-3 align-items-end">
                                        <div className="col-md-2">
                                            <label className="form-label small text-info fw-bold mb-1">Código</label>
                                            <input type="text" className="form-control bg-dark text-light border-secondary" placeholder="Ej: NW-99" required value={newProduct.productCode} onChange={(e) => setNewProduct({ ...newProduct, productCode: e.target.value })} />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label small text-info fw-bold mb-1">Nombre del Producto</label>
                                            <input type="text" className="form-control bg-dark text-light border-secondary" placeholder="Ej: Arroz" required value={newProduct.productName} onChange={(e) => setNewProduct({ ...newProduct, productName: e.target.value })} />
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label small text-info fw-bold mb-1">Precio ($)</label>
                                            <input type="number" step="0.01" min="0.01" className="form-control bg-dark text-light border-secondary" placeholder="0.00" required value={newProduct.unitPrice} onChange={(e) => setNewProduct({ ...newProduct, unitPrice: e.target.value })} />
                                        </div>
                                        <div className="col-md-2">
                                            <label className="form-label small text-info fw-bold mb-1">Stock Inicial</label>
                                            <input type="number" min="0" className="form-control bg-dark text-light border-secondary" placeholder="0" required value={newProduct.unitsInStock} onChange={(e) => setNewProduct({ ...newProduct, unitsInStock: e.target.value })} />
                                        </div>
                                        <div className="col-md-2">
                                            <button type="submit" className="btn btn-success w-100 fw-bold pb-2 pt-2"><i className="bi bi-check-lg me-1"></i>Guardar</button>
                                        </div>
                                    </div>
                                </form>
                            )}

                            <div className="row g-3">
                                {filteredProducts.map((product) => (
                                    <div className={user.role === 'Admin' ? "col-md-3" : "col-md-6 col-xl-4"} key={product.id}>
                                        <div className="card h-100 text-light shadow-sm" style={{ backgroundColor: '#161B22', border: '1px solid #30363D', borderRadius: '15px' }}>
                                            <div className="card-body d-flex flex-column">
                                                {editingProductId === product.id ? (
                                                    <div className="d-flex flex-column gap-2">
                                                        <label className="small text-muted">Nombre del Producto</label>
                                                        <input type="text" className="form-control form-control-sm bg-dark text-light border-secondary" value={editForm.productName} onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })} />
                                                        <label className="small text-muted">Precio de Venta ($)</label>
                                                        <input type="number" step="0.01" min="0.01" className="form-control form-control-sm bg-dark text-light border-secondary" value={editForm.unitPrice} onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })} />
                                                        <label className="small text-muted">Ajustar Inventario</label>
                                                        <input type="number" min="0" className="form-control form-control-sm bg-dark text-light border-secondary" value={editForm.unitsInStock} onChange={(e) => setEditForm({ ...editForm, unitsInStock: e.target.value })} />
                                                        <div className="d-flex gap-2 mt-2">
                                                            <button onClick={() => handleSaveUpdate(product.id)} className="btn btn-sm btn-success w-100 fw-bold">Guardar</button>
                                                            <button onClick={() => setEditingProductId(null)} className="btn btn-sm btn-secondary w-100">Cancelar</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="badge bg-dark border border-secondary align-self-start mb-2 text-info">{product.productCode}</span>
                                                        <h5 className="card-title fw-bold text-truncate">{product.productName}</h5>
                                                        <p className="card-text mb-1"><i className="bi bi-tag text-muted me-2"></i>Precio: ${Number(product.unitPrice).toFixed(2)}</p>
                                                        <p className="card-text mb-3"><i className="bi bi-box me-2 text-muted"></i>Stock: <span className={product.unitsInStock < 10 ? 'text-warning fw-bold' : ''}>{product.unitsInStock}</span></p>
                                                        <div className="mt-auto">
                                                            {user.role === 'Admin' ? (
                                                                <div className="d-flex gap-2">
                                                                    <button onClick={() => { setEditingProductId(product.id); setEditForm({ productName: product.productName, unitPrice: product.unitPrice, unitsInStock: product.unitsInStock }); }} className="btn btn-outline-warning w-100 rounded-pill"><i className="bi bi-pencil-square me-2"></i>Editar</button>
                                                                    <button onClick={() => handleDelete(product.id)} className="btn btn-outline-danger w-100 rounded-pill"><i className="bi bi-trash3-fill"></i></button>
                                                                </div>
                                                            ) : (
                                                                <div className="d-flex gap-2">
                                                                    <input type="number" className="form-control bg-dark text-light text-center border-secondary" value={buyQuantities[product.id] || 1} onChange={(e) => setBuyQuantities({ ...buyQuantities, [product.id]: e.target.value })} min="1" style={{ width: '65px' }} />
                                                                    <button onClick={() => handleAddToCart(product)} className="btn btn-outline-info w-100 fw-bold" disabled={product.unitsInStock === 0}><i className="bi bi-cart-plus me-2"></i>Agregar</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {user.role === 'Customer' && (
                            <div className="col-lg-4">
                                <div className="card text-light shadow-lg position-sticky" style={{ backgroundColor: '#161B22', border: '1px solid #30363D', top: '20px', borderRadius: '20px' }}>
                                    <div className="card-body p-4">
                                        <h4 className="border-bottom border-secondary pb-3 mb-4"><i className="bi bi-cart3 text-info me-2"></i>Mi Carrito</h4>
                                        {cart.length === 0 ? <p className="text-muted text-center my-4">Vacío</p> : (
                                            <>
                                                {cart.map(item => (
                                                    <div key={item.id} className="d-flex justify-content-between p-2 rounded mb-2" style={{ backgroundColor: '#0D1117', border: '1px solid #30363D' }}>
                                                        <div><h6>{item.productName}</h6><small className="text-muted">{item.quantity} x ${item.unitPrice}</small></div>
                                                        <span className="fw-bold align-self-center">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                                <div className="d-flex justify-content-between my-3 fs-4 border-top border-secondary pt-2"><span>Total:</span><span className="text-info">${cartTotal.toFixed(2)}</span></div>
                                                <button onClick={handleCheckout} className="btn btn-info w-100 rounded-pill py-2 fw-bold text-dark">Pagar Ahora</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* HISTORIAL CONDICIONAL CON MANEJO DE ESTADO VACÍO */}
                {viewMode === 'orders' && (
                    <div className="row g-4">
                        <div className="col-md-5">
                            <h4 className="mb-4">
                                <i className="bi bi-journal-text text-info me-2"></i>
                                {user.role === 'Admin' ? 'Órdenes Registradas' : 'Historial de Compras'}
                            </h4>

                            {orders.length === 0 ? (
                                <div className="alert bg-dark text-info border-secondary d-flex align-items-center shadow-sm">
                                    <i className="bi bi-info-circle-fill me-3 fs-3"></i>
                                    <div>{user.role === 'Admin' ? 'No hay órdenes registradas en el sistema.' : 'Aún no has realizado ninguna compra en la tienda.'}</div>
                                </div>
                            ) : (
                                <div className="list-group shadow-sm">
                                    {orders.map(order => (
                                        <button
                                            key={order.id}
                                            onClick={() => fetchOrderDetails(order.id)}
                                            className={`list-group-item list-group-item-action text-light border-secondary p-3 mb-2 rounded d-flex justify-content-between align-items-center ${activeOrderId === order.id ? 'bg-info text-dark border-info' : ''}`}
                                            style={{ backgroundColor: activeOrderId === order.id ? '' : '#161B22' }}
                                        >
                                            <div>
                                                <span className="fw-bold">Orden #{order.id}</span>
                                                <div className={activeOrderId === order.id ? 'text-dark' : 'text-muted'}>ID Cliente: {order.customerId}</div>
                                            </div>
                                            <small className="fw-semibold"><i className="bi bi-calendar-event me-1"></i>{new Date(order.orderDate).toLocaleDateString()}</small>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="col-md-7">
                            <h4 className="mb-4"><i className="bi bi-list-ul text-info me-2"></i>Detalles de la Orden</h4>
                            {selectedOrderDetails ? (
                                <div className="p-4 rounded shadow-sm" style={{ backgroundColor: '#161B22', border: '1px solid #30363D' }}>
                                    <h5 className="text-info border-bottom border-secondary pb-2 mb-3">Comprobante de Transacción #{activeOrderId}</h5>
                                    <div className="table-responsive">
                                        <table className="table table-dark table-hover border-secondary mb-0">
                                            <thead>
                                                <tr className="text-info">
                                                    <th>Producto</th>
                                                    <th className="text-center">Cantidad</th>
                                                    <th className="text-end">Precio Unitario</th>
                                                    <th className="text-end">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedOrderDetails.map(detail => (
                                                    <tr key={detail.id}>
                                                        <td>{detail.productName}</td>
                                                        <td className="text-center">{detail.quantity}</td>
                                                        <td className="text-end">${Number(detail.unitPrice).toFixed(2)}</td>
                                                        <td className="text-end fw-bold">${(detail.quantity * detail.unitPrice).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="d-flex justify-content-end mt-4 fs-4 fw-bold text-info border-top border-secondary pt-2">
                                        Total General: ${selectedOrderDetails.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-muted my-5 p-5 rounded border border-dashed border-secondary" style={{ backgroundColor: '#161B22' }}>
                                    <i className="bi bi-arrow-left-circle fs-1 mb-2 d-block text-secondary"></i>
                                    {orders.length === 0
                                        ? 'Tus comprobantes aparecerán aquí.'
                                        : 'Selecciona una orden de la lista de la izquierda para desplegar sus detalles y artículos correspondientes.'}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;