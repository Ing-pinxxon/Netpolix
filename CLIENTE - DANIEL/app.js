// ================= GLOBAL CONFIGURATION & STATE =================
const API_BASE_URL = 'http://127.0.0.1:5000';

const AppState = {
    activeTab: 'dashboard',
    backendOnline: false,
    apiLogs: [], // Historial de peticiones API
    selectedLogId: null,
    
    // Almacén de datos locales para búsquedas y conteos rápidos
    data: {
        roles: [],
        categorias: [],
        clasificaciones: [],
        clientes: [],
        series: []
    }
};

// Mapeo de títulos y subtítulos de secciones
const SectionMeta = {
    dashboard: { title: 'Dashboard', desc: 'Resumen general y estadísticas de la base de datos.' },
    roles: { title: 'Roles de Usuario', desc: 'Administra los roles de acceso en la plataforma.' },
    categorias: { title: 'Categorías de Contenido', desc: 'Gestiona los géneros y categorías de las series.' },
    clasificaciones: { title: 'Clasificaciones de Edad', desc: 'Controla las clasificaciones morales y de edad.' },
    clientes: { title: 'Clientes Registrados', desc: 'Administra las cuentas de usuario de la aplicación.' },
    series: { title: 'Series de TV', desc: 'Gestiona el catálogo de series, sinopsis y temporadas.' }
};

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initAPIDrawer();
    initModals();
    initSearchFilters();
    
    // Verificación inicial de la API
    checkBackendStatus().then(() => {
        // Cargar todos los datos si el backend está activo
        refreshAllData();
    });

    // Monitoreo periódico del backend (cada 8 segundos)
    setInterval(checkBackendStatus, 8000);
});

// ================= CUSTOM FETCH LAYER (POSTMAN LOGGER) =================
/**
 * Realiza un fetch e intercepta la llamada para registrarla en la consola de depuración en vivo.
 */
async function apiCall(endpoint, options = {}) {
    const method = options.method || 'GET';
    const url = `${API_BASE_URL}${endpoint}`;
    const timestamp = new Date();
    const logId = 'log_' + timestamp.getTime() + '_' + Math.floor(Math.random() * 1000);
    
    let requestBody = null;
    if (options.body) {
        try {
            requestBody = JSON.parse(options.body);
        } catch (e) {
            requestBody = options.body;
        }
    }

    // Registrar petición PENDIENTE
    const logEntry = {
        id: logId,
        timestamp: timestamp.toLocaleTimeString(),
        method: method,
        url: url,
        endpoint: endpoint,
        requestHeaders: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        requestBody: requestBody,
        status: 'PENDING',
        statusCode: null,
        responseBody: null,
        duration: null
    };

    AppState.apiLogs.unshift(logEntry); // Insertar al inicio
    renderApiLogsList();
    
    const startTime = performance.now();
    
    try {
        const response = await fetch(url, options);
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        logEntry.statusCode = response.status;
        logEntry.duration = `${duration}ms`;
        logEntry.status = response.ok ? 'SUCCESS' : 'ERROR';

        // Intentar parsear JSON de respuesta
        const text = await response.text();
        try {
            logEntry.responseBody = JSON.parse(text);
        } catch (e) {
            logEntry.responseBody = text;
        }

        // Actualizar UI
        updateApiConsolePulse();
        renderApiLogsList();
        
        // Si la petición actual es la seleccionada, actualizar la vista detallada
        if (AppState.selectedLogId === logId) {
            renderApiLogDetails(logId);
        } else if (!AppState.selectedLogId) {
            // Seleccionar automáticamente si es la primera
            AppState.selectedLogId = logId;
            renderApiLogDetails(logId);
        }

        if (!response.ok) {
            throw { status: response.status, data: logEntry.responseBody };
        }

        return logEntry.responseBody;

    } catch (error) {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        logEntry.status = 'ERROR';
        logEntry.duration = `${duration}ms`;
        
        if (!logEntry.statusCode) {
            logEntry.statusCode = 'FAIL';
            logEntry.responseBody = { error: 'Error de Red o CORS bloqueado', details: error.message };
        }

        updateApiConsolePulse();
        renderApiLogsList();
        
        if (AppState.selectedLogId === logId) {
            renderApiLogDetails(logId);
        }

        throw error;
    }
}

// ================= BACKEND STATUS SERVICE =================
async function checkBackendStatus() {
    const dot = document.getElementById('api-status-dot');
    const text = document.getElementById('api-status-text');
    
    try {
        // Consultar el endpoint raíz
        const response = await fetch(`${API_BASE_URL}/`);
        if (response.ok) {
            if (!AppState.backendOnline) {
                showToast('API Conectada', 'Servidor backend Flask en línea', 'success');
            }
            AppState.backendOnline = true;
            dot.className = 'status-dot status-online';
            text.textContent = 'Backend en línea (Port 5000)';
        } else {
            throw new Error();
        }
    } catch (e) {
        if (AppState.backendOnline) {
            showToast('API Desconectada', 'Se perdió la conexión con el servidor backend', 'error');
        }
        AppState.backendOnline = false;
        dot.className = 'status-dot status-offline';
        text.textContent = 'Backend desconectado';
    }
}

// ================= NAVIGATION LOGIC (SPA) =================
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = item.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Vinculación de tarjetas de estadísticas del Dashboard para ir directo a la sección
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('click', () => {
            const targetTab = card.getAttribute('data-target-tab');
            switchTab(targetTab);
        });
    });
}

function switchTab(tabName) {
    if (!tabName) return;
    
    // Desactivar tab anterior
    document.querySelector('.nav-item.active').classList.remove('active');
    document.querySelector('.tab-content.active').classList.remove('active');
    
    // Activar nueva tab
    const navItem = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
    const tabContent = document.getElementById(`section-${tabName}`);
    
    if (navItem && tabContent) {
        navItem.classList.add('active');
        tabContent.classList.add('active');
        AppState.activeTab = tabName;
        
        // Actualizar textos de la cabecera
        const meta = SectionMeta[tabName];
        document.getElementById('current-section-title').textContent = meta.title;
        document.getElementById('current-section-desc').textContent = meta.desc;
        
        // Ejecutar carga específica
        if (tabName !== 'dashboard') {
            loadEntityData(tabName);
        } else {
            refreshDashboardStats();
        }
    }
}

// ================= DYNAMIC DATA LOADING =================
async function loadEntityData(entity) {
    if (!AppState.backendOnline) {
        renderTableEmpty(entity, 'offline');
        return;
    }

    renderTableLoader(entity);
    
    let endpoint = '';
    switch(entity) {
        case 'roles': endpoint = '/Rol'; break;
        case 'categorias': endpoint = '/Categoria'; break;
        case 'clasificaciones': endpoint = '/Clasificacion'; break;
        case 'clientes': endpoint = '/Cliente'; break;
        case 'series': endpoint = '/Serie'; break;
    }

    try {
        const records = await apiCall(endpoint, { method: 'GET' });
        
        // Guardar en estado global
        AppState.data[entity] = records;
        
        // Renderizar tabla
        renderTable(entity, records);
        
    } catch (err) {
        renderTableEmpty(entity, 'error');
        showToast('Error de carga', `No se pudo obtener datos de ${entity}.`, 'error');
    }
}

async function refreshAllData() {
    if (!AppState.backendOnline) return;
    
    const entities = ['roles', 'categorias', 'clasificaciones', 'clientes', 'series'];
    
    for (const ent of entities) {
        let endpoint = '';
        switch(ent) {
            case 'roles': endpoint = '/Rol'; break;
            case 'categorias': endpoint = '/Categoria'; break;
            case 'clasificaciones': endpoint = '/Clasificacion'; break;
            case 'clientes': endpoint = '/Cliente'; break;
            case 'series': endpoint = '/Serie'; break;
        }

        try {
            const records = await apiCall(endpoint, { method: 'GET' });
            AppState.data[ent] = records;
        } catch (e) {
            console.error(`Fallo precarga ${ent}:`, e);
        }
    }
    
    refreshDashboardStats();
    
    // Si la tab activa es una tabla, recargarla
    if (AppState.activeTab !== 'dashboard') {
        renderTable(AppState.activeTab, AppState.data[AppState.activeTab]);
    }
}

function refreshDashboardStats() {
    const rolesCount = AppState.data.roles.length;
    const catCount = AppState.data.categorias.length;
    const clasCount = AppState.data.clasificaciones.length;
    const clientCount = AppState.data.clientes.length;
    const seriesCount = AppState.data.series.length;
    
    document.getElementById('stat-count-roles').textContent = AppState.backendOnline ? rolesCount : '...';
    document.getElementById('stat-count-categorias').textContent = AppState.backendOnline ? catCount : '...';
    document.getElementById('stat-count-clasificaciones').textContent = AppState.backendOnline ? clasCount : '...';
    document.getElementById('stat-count-clientes').textContent = AppState.backendOnline ? clientCount : '...';
    document.getElementById('stat-count-series').textContent = AppState.backendOnline ? seriesCount : '...';
}

// ================= RENDER DE TABLAS =================
function renderTable(entity, records) {
    const tbody = document.querySelector(`#table-${entity} tbody`);
    const emptyDiv = document.getElementById(`empty-${entity}`);
    tbody.innerHTML = '';
    
    if (!records || records.length === 0) {
        emptyDiv.style.display = 'flex';
        return;
    }
    
    emptyDiv.style.display = 'none';
    
    records.forEach(row => {
        const tr = document.createElement('tr');
        
        if (entity === 'roles') {
            tr.innerHTML = `
                <td class="text-highlight">${escapeHtml(row.id_rol)}</td>
                <td>${escapeHtml(row.nombre)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" onclick="openEditRecord('roles', '${escapeJs(row.id_rol)}')">
                            <i data-lucide="pencil"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="openDeleteRecord('roles', '${escapeJs(row.id_rol)}')">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            `;
        } else if (entity === 'categorias') {
            tr.innerHTML = `
                <td class="text-highlight">${escapeHtml(row.id_categoria)}</td>
                <td>${escapeHtml(row.nombre)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" onclick="openEditRecord('categorias', '${escapeJs(row.id_categoria)}')">
                            <i data-lucide="pencil"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="openDeleteRecord('categorias', '${escapeJs(row.id_categoria)}')">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            `;
        } else if (entity === 'clasificaciones') {
            tr.innerHTML = `
                <td class="text-highlight">${escapeHtml(row.tipo)}</td>
                <td>${escapeHtml(row.descripcion)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" onclick="openEditRecord('clasificaciones', '${escapeJs(row.tipo)}')">
                            <i data-lucide="pencil"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="openDeleteRecord('clasificaciones', '${escapeJs(row.tipo)}')">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            `;
        } else if (entity === 'clientes') {
            tr.innerHTML = `
                <td class="text-highlight">${escapeHtml(row.id_cliente)}</td>
                <td>${escapeHtml(row.nombre)}</td>
                <td>${escapeHtml(row.apellido)}</td>
                <td class="text-muted">${escapeHtml(row.email)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" onclick="openEditRecord('clientes', '${escapeJs(row.id_cliente)}')">
                            <i data-lucide="pencil"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="openDeleteRecord('clientes', '${escapeJs(row.id_cliente)}')">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            `;
        } else if (entity === 'series') {
            tr.innerHTML = `
                <td class="text-highlight">${escapeHtml(row.id_serie)}</td>
                <td>${escapeHtml(row.titulo)}</td>
                <td class="text-muted" style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${escapeHtml(row.sinopsis)}
                </td>
                <td style="text-align: center"><span class="badge-status success">${row.temporada}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" onclick="openEditRecord('series', '${escapeJs(row.id_serie)}')">
                            <i data-lucide="pencil"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="openDeleteRecord('series', '${escapeJs(row.id_serie)}')">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            `;
        }
        
        tbody.appendChild(tr);
    });
    
    // Volver a enlazar los iconos inyectados
    lucide.createIcons();
}

function renderTableLoader(entity) {
    const tbody = document.querySelector(`#table-${entity} tbody`);
    tbody.innerHTML = `
        <tr>
            <td colspan="5" style="text-align: center; padding: 40px 0; color: var(--text-muted);">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                    <i data-lucide="loader-2" class="animate-spin text-primary" style="width: 28px; height: 28px;"></i>
                    <span>Consultando API Flask...</span>
                </div>
            </td>
        </tr>
    `;
    lucide.createIcons();
}

function renderTableEmpty(entity, status) {
    const tbody = document.querySelector(`#table-${entity} tbody`);
    const emptyDiv = document.getElementById(`empty-${entity}`);
    tbody.innerHTML = '';
    
    emptyDiv.style.display = 'flex';
    if (status === 'offline') {
        emptyDiv.innerHTML = `
            <i data-lucide="cloud-off" class="text-danger"></i>
            <p>Servidor desconectado. Por favor, asegúrate de que el backend Flask esté ejecutándose en ` + API_BASE_URL + `</p>
        `;
    } else if (status === 'error') {
        emptyDiv.innerHTML = `
            <i data-lucide="alert-triangle" class="text-warning"></i>
            <p>Error en la comunicación con la API. Consulta los detalles de la petición.</p>
        `;
    }
    lucide.createIcons();
}

// ================= API CONSOLE DRAWER LOGIC =================
function initAPIDrawer() {
    const drawer = document.getElementById('api-console-drawer');
    const btnOpen = document.getElementById('btn-open-api-console');
    const btnClose = document.getElementById('btn-close-api-console');
    const overlay = document.getElementById('api-drawer-overlay');
    const btnClear = document.getElementById('btn-clear-console');

    // Abrir drawer
    btnOpen.addEventListener('click', () => {
        drawer.classList.add('open');
        // Desactivar pulso del botón
        document.querySelector('.pulse-indicator').style.display = 'none';
    });

    // Cerrar drawer
    const closeDrawer = () => {
        drawer.classList.remove('open');
    };
    btnClose.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);

    // Limpiar logs
    btnClear.addEventListener('click', () => {
        AppState.apiLogs = [];
        AppState.selectedLogId = null;
        renderApiLogsList();
        renderApiLogDetails(null);
    });
}

function updateApiConsolePulse() {
    const pulse = document.querySelector('.pulse-indicator');
    if (pulse) {
        pulse.style.display = 'block';
    }
}

function renderApiLogsList() {
    const historyList = document.getElementById('console-history-list');
    historyList.innerHTML = '';
    
    if (AppState.apiLogs.length === 0) {
        historyList.innerHTML = `
            <div class="console-empty-history">
                <i data-lucide="radio"></i>
                <p>Esperando solicitudes HTTP...</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    AppState.apiLogs.forEach(log => {
        const item = document.createElement('div');
        item.className = `console-item ${AppState.selectedLogId === log.id ? 'selected' : ''}`;
        item.setAttribute('data-id', log.id);
        
        let statusBadgeClass = 'success';
        if (log.statusCode === 'PENDING') statusBadgeClass = 'warning';
        else if (log.statusCode >= 400 || log.statusCode === 'FAIL') statusBadgeClass = 'error';

        item.innerHTML = `
            <div class="console-item-left">
                <span class="badge-method ${log.method}">${log.method}</span>
                <span class="console-endpoint">${log.endpoint}</span>
            </div>
            <div class="console-item-right">
                <span class="badge-status ${statusBadgeClass}">${log.statusCode}</span>
                <span class="console-time">${log.timestamp}</span>
            </div>
        `;
        
        item.addEventListener('click', () => {
            // Quitar seleccion anterior
            const currentSelected = historyList.querySelector('.console-item.selected');
            if (currentSelected) currentSelected.classList.remove('selected');
            
            item.classList.add('selected');
            AppState.selectedLogId = log.id;
            renderApiLogDetails(log.id);
        });

        historyList.appendChild(item);
    });
}

function renderApiLogDetails(logId) {
    const container = document.getElementById('console-details-content');
    
    if (!logId) {
        container.className = 'console-details-content empty';
        container.innerHTML = `
            <div class="console-empty-details">
                <i data-lucide="eye"></i>
                <p>Selecciona una petición del historial para ver el detalle de la solicitud y respuesta.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    const log = AppState.apiLogs.find(l => l.id === logId);
    if (!log) return;
    
    container.className = 'console-details-content';
    
    let reqBodyStr = 'N/A';
    if (log.requestBody) {
        reqBodyStr = typeof log.requestBody === 'object' 
            ? JSON.stringify(log.requestBody, null, 4) 
            : log.requestBody;
    }

    let resBodyStr = 'Cargando respuesta...';
    if (log.status !== 'PENDING') {
        if (log.responseBody) {
            resBodyStr = typeof log.responseBody === 'object'
                ? JSON.stringify(log.responseBody, null, 4)
                : log.responseBody;
        } else {
            resBodyStr = 'Cuerpo de respuesta vacío';
        }
    }
    
    let isErrorBody = log.status === 'ERROR';

    container.innerHTML = `
        <div class="api-detail-grid">
            <div class="api-meta-row">
                <span class="badge-method ${log.method}">${log.method}</span>
                <span class="api-meta-url">${log.url}</span>
            </div>
            
            <div style="display: flex; gap: 30px; border-bottom: 1px solid rgba(255, 255, 255, 0.03); padding-bottom: 10px;">
                <div class="api-data-section">
                    <label>Duración</label>
                    <span class="text-highlight">${log.duration || 'Pendiente'}</span>
                </div>
                <div class="api-data-section">
                    <label>Estado HTTP</label>
                    <span class="text-highlight ${log.status === 'ERROR' ? 'text-danger' : 'text-success'}">
                        ${log.statusCode} ${log.status === 'PENDING' ? '(Pendiente)' : ''}
                    </span>
                </div>
            </div>

            <div class="api-data-section">
                <label>Headers Enviados</label>
                <pre>${JSON.stringify(log.requestHeaders, null, 4)}</pre>
            </div>

            <div class="api-data-section">
                <label>Cuerpo de la Petición (Request Body)</label>
                <pre class="${reqBodyStr === 'N/A' ? 'empty-body' : ''}">${escapeHtml(reqBodyStr)}</pre>
            </div>

            <div class="api-data-section response-body">
                <label>Cuerpo de la Respuesta (Response Body)</label>
                <pre style="${isErrorBody ? 'color: #f87171;' : ''}">${escapeHtml(resBodyStr)}</pre>
            </div>
        </div>
    `;
}

// ================= CLIENT SIDE SEARCH FILTERS =================
function initSearchFilters() {
    const searchInputs = {
        roles: 'search-roles',
        categorias: 'search-categorias',
        clasificaciones: 'search-clasificaciones',
        clientes: 'search-clientes',
        series: 'search-series'
    };

    Object.entries(searchInputs).forEach(([entity, inputId]) => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                filterTableData(entity, query);
            });
        }
    });
}

function filterTableData(entity, query) {
    if (!AppState.data[entity]) return;
    
    if (query === '') {
        renderTable(entity, AppState.data[entity]);
        return;
    }
    
    const filtered = AppState.data[entity].filter(row => {
        if (entity === 'roles') {
            return row.id_rol.toLowerCase().includes(query) || row.nombre.toLowerCase().includes(query);
        } else if (entity === 'categorias') {
            return row.id_categoria.toLowerCase().includes(query) || row.nombre.toLowerCase().includes(query);
        } else if (entity === 'clasificaciones') {
            return row.tipo.toLowerCase().includes(query) || row.descripcion.toLowerCase().includes(query);
        } else if (entity === 'clientes') {
            return row.id_cliente.toLowerCase().includes(query) || 
                   row.nombre.toLowerCase().includes(query) || 
                   row.apellido.toLowerCase().includes(query) || 
                   row.email.toLowerCase().includes(query);
        } else if (entity === 'series') {
            return row.id_serie.toLowerCase().includes(query) || 
                   row.titulo.toLowerCase().includes(query) || 
                   row.sinopsis.toLowerCase().includes(query) || 
                   row.temporada.toString().includes(query);
        }
        return false;
    });
    
    renderTable(entity, filtered);
}

// ================= MODALS & FORM LOGIC =================
let modalMode = 'add'; // 'add' o 'edit'
let activeRecordId = null; // El ID primario del registro actual editando/eliminando

function initModals() {
    const crudModal = document.getElementById('crud-modal');
    const deleteModal = document.getElementById('delete-modal');
    const form = document.getElementById('crud-form');
    
    // Configurar cierres de modal
    document.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
        btn.addEventListener('click', () => {
            crudModal.classList.remove('open');
            deleteModal.classList.remove('open');
        });
    });

    // Añadir eventos a botones de agregar
    document.querySelectorAll('.btn-add').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.getAttribute('data-action');
            if (action === 'add-rol') openAddRecord('roles');
            else if (action === 'add-categoria') openAddRecord('categorias');
            else if (action === 'add-clasificacion') openAddRecord('clasificaciones');
            else if (action === 'add-cliente') openAddRecord('clientes');
            else if (action === 'add-serie') openAddRecord('series');
        });
    });

    // Formulario Submit
    form.addEventListener('submit', handleFormSubmit);

    // Confirmación de Borrado
    document.getElementById('btn-confirm-delete').addEventListener('click', handleConfirmDelete);
}

// Abrir para crear nuevo
function openAddRecord(entity) {
    if (!AppState.backendOnline) {
        showToast('Servidor Desconectado', 'No puedes realizar cambios mientras el servidor esté desconectado.', 'warning');
        return;
    }
    
    modalMode = 'add';
    activeRecordId = null;
    
    const titleMap = {
        roles: 'Agregar Nuevo Rol',
        categorias: 'Agregar Nueva Categoría',
        clasificaciones: 'Agregar Nueva Clasificación',
        clientes: 'Agregar Nuevo Cliente',
        series: 'Agregar Nueva Serie'
    };
    
    document.getElementById('modal-title').textContent = titleMap[entity];
    
    // Inyectar campos de formulario según la entidad
    buildFormFields(entity, null);
    
    // Abrir
    document.getElementById('crud-modal').classList.add('open');
}

// Abrir para editar existente
function openEditRecord(entity, id) {
    if (!AppState.backendOnline) {
        showToast('Servidor Desconectado', 'No puedes realizar cambios mientras el servidor esté desconectado.', 'warning');
        return;
    }
    
    modalMode = 'edit';
    activeRecordId = id;
    
    // Obtener los datos del registro desde el almacenamiento local
    let record = null;
    if (entity === 'roles') record = AppState.data.roles.find(r => r.id_rol === id);
    else if (entity === 'categorias') record = AppState.data.categorias.find(c => c.id_categoria === id);
    else if (entity === 'clasificaciones') record = AppState.data.clasificaciones.find(c => c.tipo === id);
    else if (entity === 'clientes') record = AppState.data.clientes.find(c => c.id_cliente === id);
    else if (entity === 'series') record = AppState.data.series.find(s => s.id_serie === id);
    
    if (!record) {
        showToast('Error', 'No se pudo localizar el registro para edición.', 'error');
        return;
    }

    const titleMap = {
        roles: 'Editar Rol',
        categorias: 'Editar Categoría',
        clasificaciones: 'Editar Clasificación',
        clientes: 'Editar Cliente',
        series: 'Editar Serie'
    };
    
    document.getElementById('modal-title').textContent = titleMap[entity];
    
    // Inyectar y prellenar campos
    buildFormFields(entity, record);
    
    // Abrir
    document.getElementById('crud-modal').classList.add('open');
}

// Abrir modal de confirmación de borrado
function openDeleteRecord(entity, id) {
    if (!AppState.backendOnline) {
        showToast('Servidor Desconectado', 'No puedes realizar cambios mientras el servidor esté desconectado.', 'warning');
        return;
    }
    
    activeRecordId = id;
    
    const preview = document.getElementById('delete-item-preview');
    preview.innerHTML = '';
    
    let record = null;
    let labelHTML = '';
    
    if (entity === 'roles') {
        record = AppState.data.roles.find(r => r.id_rol === id);
        labelHTML = `
            <div class="delete-preview-row"><span class="delete-preview-label">Entidad:</span><span class="delete-preview-val">Rol</span></div>
            <div class="delete-preview-row"><span class="delete-preview-label">ID de Rol:</span><span class="delete-preview-val">${escapeHtml(record.id_rol)}</span></div>
            <div class="delete-preview-row"><span class="delete-preview-label">Nombre:</span><span class="delete-preview-val">${escapeHtml(record.nombre)}</span></div>
        `;
    } else if (entity === 'categorias') {
        record = AppState.data.categorias.find(c => c.id_categoria === id);
        labelHTML = `
            <div class="delete-preview-row"><span class="delete-preview-label">Entidad:</span><span class="delete-preview-val">Categoría</span></div>
            <div class="delete-preview-row"><span class="delete-preview-label">ID Categoría:</span><span class="delete-preview-val">${escapeHtml(record.id_categoria)}</span></div>
            <div class="delete-preview-row"><span class="delete-preview-label">Nombre:</span><span class="delete-preview-val">${escapeHtml(record.nombre)}</span></div>
        `;
    } else if (entity === 'clasificaciones') {
        record = AppState.data.clasificaciones.find(c => c.tipo === id);
        labelHTML = `
            <div class="delete-preview-row"><span class="delete-preview-label">Entidad:</span><span class="delete-preview-val">Clasificación</span></div>
            <div class="delete-preview-row"><span class="delete-preview-label">Tipo:</span><span class="delete-preview-val">${escapeHtml(record.tipo)}</span></div>
            <div class="delete-preview-row"><span class="delete-preview-label">Descripción:</span><span class="delete-preview-val">${escapeHtml(record.descripcion)}</span></div>
        `;
    } else if (entity === 'clientes') {
        record = AppState.data.clientes.find(c => c.id_cliente === id);
        labelHTML = `
            <div class="delete-preview-row"><span class="delete-preview-label">Entidad:</span><span class="delete-preview-val">Cliente</span></div>
            <div class="delete-preview-row"><span class="delete-preview-label">ID Cliente:</span><span class="delete-preview-val">${escapeHtml(record.id_cliente)}</span></div>
            <div class="delete-preview-row"><span class="delete-preview-label">Nombre:</span><span class="delete-preview-val">${escapeHtml(record.nombre)} ${escapeHtml(record.apellido)}</span></div>
            <div class="delete-preview-row"><span class="delete-preview-label">Email:</span><span class="delete-preview-val">${escapeHtml(record.email)}</span></div>
        `;
    } else if (entity === 'series') {
        record = AppState.data.series.find(s => s.id_serie === id);
        labelHTML = `
            <div class="delete-preview-row"><span class="delete-preview-label">Entidad:</span><span class="delete-preview-val">Serie</span></div>
            <div class="delete-preview-row"><span class="delete-preview-label">ID Serie:</span><span class="delete-preview-val">${escapeHtml(record.id_serie)}</span></div>
            <div class="delete-preview-row"><span class="delete-preview-label">Título:</span><span class="delete-preview-val">${escapeHtml(record.titulo)}</span></div>
        `;
    }
    
    preview.innerHTML = labelHTML;
    document.getElementById('delete-modal').classList.add('open');
}

// CONSTRUCTOR DINÁMICO DE CAMPOS DEL FORMULARIO MODAL
function buildFormFields(entity, record) {
    const container = document.getElementById('modal-fields-container');
    container.innerHTML = '';
    
    const isEdit = (modalMode === 'edit');
    
    // Inyectar atributo identificador en el formulario
    document.getElementById('crud-form').setAttribute('data-current-entity', entity);
    
    if (entity === 'roles') {
        container.innerHTML = `
            <div class="form-group">
                <label for="f-id_rol">ID de Rol (Ej: R01, R02)</label>
                <input type="text" id="f-id_rol" name="id_rol" required maxlength="10" placeholder="R01" 
                    ${isEdit ? 'disabled' : ''} value="${record ? record.id_rol : ''}">
            </div>
            <div class="form-group">
                <label for="f-nombre">Nombre del Rol</label>
                <input type="text" id="f-nombre" name="nombre" required maxlength="255" placeholder="Administrador" 
                    value="${record ? record.nombre : ''}">
            </div>
        `;
    } else if (entity === 'categorias') {
        container.innerHTML = `
            <div class="form-group">
                <label for="f-id_categoria">ID de Categoría (Ej: CAT01)</label>
                <input type="text" id="f-id_categoria" name="id_categoria" required maxlength="10" placeholder="CAT01" 
                    ${isEdit ? 'disabled' : ''} value="${record ? record.id_categoria : ''}">
            </div>
            <div class="form-group">
                <label for="f-nombre">Nombre de Categoría</label>
                <input type="text" id="f-nombre" name="nombre" required maxlength="255" placeholder="Acción" 
                    value="${record ? record.nombre : ''}">
            </div>
        `;
    } else if (entity === 'clasificaciones') {
        container.innerHTML = `
            <div class="form-group">
                <label for="f-tipo">Tipo de Clasificación (Ej: A, 12, 18)</label>
                <input type="text" id="f-tipo" name="tipo" required maxlength="10" placeholder="18" 
                    ${isEdit ? 'disabled' : ''} value="${record ? record.tipo : ''}">
            </div>
            <div class="form-group">
                <label for="f-descripcion">Descripción detallada</label>
                <input type="text" id="f-descripcion" name="descripcion" required maxlength="255" placeholder="Mayores de 18 años" 
                    value="${record ? record.descripcion : ''}">
            </div>
        `;
    } else if (entity === 'clientes') {
        container.innerHTML = `
            <div class="form-group">
                <label for="f-id_cliente">ID de Cliente (Ej: CL01)</label>
                <input type="text" id="f-id_cliente" name="id_cliente" required maxlength="10" placeholder="CL01" 
                    ${isEdit ? 'disabled' : ''} value="${record ? record.id_cliente : ''}">
            </div>
            <div class="form-group">
                <label for="f-nombre">Nombre</label>
                <input type="text" id="f-nombre" name="nombre" required placeholder="Daniel" 
                    value="${record ? record.nombre : ''}">
            </div>
            <div class="form-group">
                <label for="f-apellido">Apellido</label>
                <input type="text" id="f-apellido" name="apellido" required placeholder="Gómez" 
                    value="${record ? record.apellido : ''}">
            </div>
            <div class="form-group">
                <label for="f-email">Correo Electrónico (Email)</label>
                <input type="email" id="f-email" name="email" required placeholder="daniel@netpolix.com" 
                    value="${record ? record.email : ''}">
            </div>
            <div class="form-group">
                <label for="f-password">Contraseña (Password)</label>
                <input type="password" id="f-password" name="password" required placeholder="••••••••" 
                    value="${record ? record.password : ''}">
            </div>
        `;
    } else if (entity === 'series') {
        container.innerHTML = `
            <div class="form-group">
                <label for="f-id_serie">ID de Serie (Ej: SE01)</label>
                <input type="text" id="f-id_serie" name="id_serie" required maxlength="10" placeholder="SE01" 
                    ${isEdit ? 'disabled' : ''} value="${record ? record.id_serie : ''}">
            </div>
            <div class="form-group">
                <label for="f-titulo">Título de la Serie</label>
                <input type="text" id="f-titulo" name="titulo" required placeholder="Breaking Bad" 
                    value="${record ? record.titulo : ''}">
            </div>
            <div class="form-group">
                <label for="f-sinopsis">Sinopsis / Resumen</label>
                <textarea id="f-sinopsis" name="sinopsis" required placeholder="Sinopsis de la serie..." 
                    >${record ? record.sinopsis : ''}</textarea>
            </div>
            <div class="form-group">
                <label for="f-temporada">Número de Temporadas</label>
                <input type="number" id="f-temporada" name="temporada" required min="1" max="100" placeholder="5" 
                    value="${record ? record.temporada : ''}">
            </div>
        `;
    }
}

// ENVIAR FORMULARIO CRUD
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const entity = e.target.getAttribute('data-current-entity');
    const formData = new FormData(e.target);
    const payload = {};
    
    // Construir payload
    formData.forEach((value, key) => {
        if (key === 'temporada') {
            payload[key] = parseInt(value, 10);
        } else {
            payload[key] = value;
        }
    });

    // En edición, si el ID clave primaria está inhabilitado, se toma del activeRecordId
    if (modalMode === 'edit') {
        if (entity === 'roles') payload.id_rol = activeRecordId;
        else if (entity === 'categorias') payload.id_categoria = activeRecordId;
        else if (entity === 'clasificaciones') payload.tipo = activeRecordId;
        else if (entity === 'clientes') payload.id_cliente = activeRecordId;
        else if (entity === 'series') payload.id_serie = activeRecordId;
    }

    let endpoint = '';
    let method = 'POST';
    
    if (modalMode === 'add') {
        method = 'POST';
        switch(entity) {
            case 'roles': endpoint = '/Rol'; break;
            case 'categorias': endpoint = '/Categoria'; break;
            case 'clasificaciones': endpoint = '/Clasificacion'; break;
            case 'clientes': endpoint = '/Cliente'; break;
            case 'series': endpoint = '/Serie'; break;
        }
    } else { // EDIT / UPDATE
        method = 'PUT';
        switch(entity) {
            case 'roles': endpoint = `/Rol/${encodeURIComponent(activeRecordId)}`; break;
            case 'categorias': endpoint = `/Categoria/${encodeURIComponent(activeRecordId)}`; break;
            case 'clasificaciones': endpoint = `/Clasificacion/${encodeURIComponent(activeRecordId)}`; break;
            case 'clientes': endpoint = `/Cliente/${encodeURIComponent(activeRecordId)}`; break;
            case 'series': endpoint = `/Serie/${encodeURIComponent(activeRecordId)}`; break;
        }
    }

    try {
        await apiCall(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        // Exito
        showToast(
            modalMode === 'add' ? 'Registro Creado' : 'Registro Actualizado',
            `Los datos se guardaron correctamente en la base de datos.`,
            'success'
        );
        
        // Cerrar modal
        document.getElementById('crud-modal').classList.remove('open');
        
        // Recargar datos
        refreshAllData();

    } catch (err) {
        let msg = 'Ocurrió un error inesperado al procesar la solicitud.';
        if (err.data && err.data.error) msg = err.data.error;
        else if (err.message) msg = err.message;
        
        showToast('Fallo al Guardar', msg, 'error');
    }
}

// CONFIRMAR ELIMINACIÓN DE REGISTRO
async function handleConfirmDelete() {
    const entity = AppState.activeTab;
    let endpoint = '';
    
    switch(entity) {
        case 'roles': endpoint = `/Rol/${encodeURIComponent(activeRecordId)}`; break;
        case 'categorias': endpoint = `/Categoria/${encodeURIComponent(activeRecordId)}`; break;
        case 'clasificaciones': endpoint = `/Clasificacion/${encodeURIComponent(activeRecordId)}`; break;
        case 'clientes': endpoint = `/Cliente/${encodeURIComponent(activeRecordId)}`; break;
        case 'series': endpoint = `/Serie/${encodeURIComponent(activeRecordId)}`; break;
    }

    try {
        await apiCall(endpoint, { method: 'DELETE' });
        
        // Exito
        showToast(
            'Registro Eliminado',
            `El elemento con identificador ${activeRecordId} fue eliminado correctamente.`,
            'success'
        );
        
        // Cerrar modal
        document.getElementById('delete-modal').classList.remove('open');
        activeRecordId = null;
        
        // Recargar datos
        refreshAllData();

    } catch (err) {
        let msg = 'No se pudo eliminar el registro. Puede que esté relacionado con otras tablas.';
        if (err.data && err.data.error) msg = err.data.error;
        
        showToast('Fallo al Eliminar', msg, 'error');
        document.getElementById('delete-modal').classList.remove('open');
        activeRecordId = null;
    }
}

// ================= SISTEMA DE NOTIFICACIONES (TOASTS) =================
function showToast(title, message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    else if (type === 'error') iconName = 'alert-circle';
    else if (type === 'warning') iconName = 'alert-triangle';
    
    toast.innerHTML = `
        <i data-lucide="${iconName}" class="toast-icon"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    container.appendChild(toast);
    lucide.createIcons();
    
    // Auto-eliminar después de 4.5 segundos
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
        }, 350);
    }, 4500);
}

// ================= EXTRA UTILS =================
function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeJs(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}
