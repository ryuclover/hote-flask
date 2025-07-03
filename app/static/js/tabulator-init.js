// Configuração e inicialização do Tabulator para as tabelas do dashboard

// Configurações globais do Tabulator
const tabulatorConfig = {
    layout: "fitColumns",
    responsiveLayout: "collapse",
    responsiveLayoutCollapseStartOpen: false,
    responsiveLayoutCollapseUseFormatters: false,
    pagination: "local",
    paginationSize: 10,
    paginationSizeSelector: [5, 10, 15, 20, 50],
    movableColumns: true,
    resizableRows: true,
    placeholder: "Nenhum dado disponível",
    locale: "pt-br",
    height: "auto",
    maxHeight: "70vh",
    tooltips: true,
    tooltipsHeader: true,
    tabEndNewRow: false,
    langs: {
        "pt-br": {
            "pagination": {
                "page_size": "Tamanho da página",
                "first": "Primeira",
                "first_title": "Primeira página",
                "last": "Última",
                "last_title": "Última página",
                "prev": "Anterior",
                "prev_title": "Página anterior",
                "next": "Próxima",
                "next_title": "Próxima página"
            },
            "headerFilters": {
                "default": "Filtrar...",
                "columns": {}
            }
        }
    }
};

// Função para inicializar tabela de usuários (admin dashboard)
function initUsersTable(data) {
    if (!document.getElementById("users-table")) return;
    
    const table = new Tabulator("#users-table", {
        ...tabulatorConfig,
        data: data,
        columns: [
            {title: "ID", field: "id", width: 80, sorter: "number", responsive: 4},
            {title: "Nome", field: "name", sorter: "string", headerFilter: "input", responsive: 0, minWidth: 150},
            {title: "Email", field: "email", sorter: "string", headerFilter: "input", responsive: 1, minWidth: 200},
            {
                title: "Admin", 
                field: "is_admin", 
                width: 100,
                responsive: 2,
                formatter: function(cell, formatterParams) {
                    const value = cell.getValue();
                    if (value) {
                        return '<span style="color:#c14c3c; font-weight: bold;">Sim</span>';
                    }
                    return 'Não';
                },
                headerFilter: "select",
                headerFilterParams: {values: {"": "Todos", "true": "Admin", "false": "Usuário"}}
            },
            {title: "Data de Cadastro", field: "created_at", sorter: "date", width: 150, responsive: 3},
            {
                title: "Ações", 
                field: "actions", 
                width: 250,
                responsive: 0, // Sempre visível
                formatter: function(cell, formatterParams) {
                    const row = cell.getRow().getData();
                    return `
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-primary" title="Ver Perfil Completo" onclick="viewUserProfile(${row.id})">�</button>
                            <button class="btn btn-sm btn-info" title="Ver Eventos do Usuário" onclick="viewUserEvents(${row.id})">📅</button>
                            <button class="btn btn-sm btn-success" title="Enviar Mensagem" onclick="sendMessageToUser(${row.id})">💬</button>
                            <button class="btn btn-sm btn-warning" title="Alternar Status Admin" onclick="toggleAdminStatus(${row.id})">${row.is_admin ? '👑' : '⬆️'}</button>
                            <button class="btn btn-sm btn-secondary" title="Editar Usuário" onclick="editUser(${row.id})">✏️</button>
                            <button class="btn btn-sm btn-dark" title="Suspender/Reativar" onclick="toggleUserSuspension(${row.id})">🚫</button>
                            <button class="btn btn-sm btn-danger" title="Excluir Usuário" onclick="confirmDeleteUser(${row.id})">🗑️</button>
                        </div>
                    `;
                },
                headerSort: false
            }
        ]
    });
    
    addGlobalSearch("users-table", table);
}

// Função para inicializar tabela de eventos (admin dashboard)
function initEventsTable(data) {
    if (!document.getElementById("events-table")) return;
    
    const table = new Tabulator("#events-table", {
        ...tabulatorConfig,
        data: data,
        columns: [
            {title: "ID", field: "id", width: 80, sorter: "number", responsive: 4},
            {title: "Título", field: "title", sorter: "string", headerFilter: "input", responsive: 0, minWidth: 150},
            {title: "Criador", field: "creator", sorter: "string", headerFilter: "input", responsive: 2},
            {title: "Data", field: "date", sorter: "date", width: 150, responsive: 1},
            {title: "Local", field: "location", sorter: "string", headerFilter: "input", responsive: 3},
            {title: "Código", field: "invite_code", width: 120, responsive: 4},
            {title: "Participantes", field: "participants", width: 120, sorter: "number", responsive: 2},
            {
                title: "Ações", 
                field: "actions", 
                width: 280,
                responsive: 0, // Sempre visível
                formatter: function(cell, formatterParams) {
                    const row = cell.getRow().getData();
                    return `
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-primary" title="Ver Detalhes Completos" onclick="viewEventDetails(${row.id})">👁️</button>
                            <a href="/edit_event/${row.id}" class="btn btn-sm btn-secondary" title="Editar Evento">✏️</a>
                            <a href="/event/${row.id}/guest_messages" class="btn btn-sm btn-info" title="Ver Mensagens dos Convidados">💬</a>
                            <a href="/guest/${row.invite_code}" class="btn btn-sm btn-success" title="Área do Convidado" target="_blank">👥</a>
                            <button class="btn btn-sm btn-warning" title="Duplicar Evento" onclick="duplicateEvent(${row.id})">📋</button>
                            <button class="btn btn-sm btn-dark" title="Enviar Notificação" onclick="sendEventNotification(${row.id})">📢</button>
                            <button class="btn btn-sm btn-info" title="Exportar Lista de Participantes" onclick="exportParticipants(${row.id})">📄</button>
                            <button class="btn btn-sm btn-danger" title="Excluir Evento" onclick="confirmDeleteEvent(${row.id})">🗑️</button>
                        </div>
                    `;
                },
                headerSort: false
            }
        ]
    });
    
    addGlobalSearch("events-table", table);
}

// Função para inicializar tabela de eventos criados (dashboard usuário)
function initCreatedEventsTable(data) {
    if (!document.getElementById("created-events-table")) return;
    
    const table = new Tabulator("#created-events-table", {
        ...tabulatorConfig,
        data: data,
        columns: [
            {
                title: "Título", 
                field: "title", 
                sorter: "string", 
                headerFilter: "input", 
                minWidth: 200,
                responsive: 0, // Sempre visível
                formatter: function(cell, formatterParams) {
                    const row = cell.getRow().getData();
                    let html = `<strong>${cell.getValue()}</strong>`;
                    if (row.price && row.price > 0) {
                        html += `<br><small style="color: var(--cor-primaria);">R$ ${row.price.toFixed(2)}</small>`;
                    }
                    return html;
                }
            },
            {
                title: "Tipo", 
                field: "event_type", 
                width: 150,
                responsive: 3, // Esconder em telas pequenas
                formatter: function(cell, formatterParams) {
                    const value = cell.getValue();
                    const typeMap = {
                        'aniversario': '🎂 Aniversário',
                        'casamento': '💒 Casamento',
                        'corporativo': '💼 Corporativo',
                        'formatura': '🎓 Formatura',
                        'workshop': '📚 Workshop',
                        'festa': '🎉 Festa',
                        'reuniao': '👥 Reunião',
                        'conferencia': '🎤 Conferência',
                        'esportivo': '⚽ Esportivo',
                        'cultural': '🎭 Cultural',
                        'religioso': '⛪ Religioso',
                        'beneficente': '💝 Beneficente'
                    };
                    return typeMap[value] || '📋 Outro';
                },
                headerFilter: "select",
                headerFilterParams: {
                    values: {
                        "": "Todos",
                        "aniversario": "Aniversário",
                        "casamento": "Casamento",
                        "corporativo": "Corporativo",
                        "formatura": "Formatura",
                        "workshop": "Workshop",
                        "festa": "Festa",
                        "reuniao": "Reunião",
                        "conferencia": "Conferência",
                        "esportivo": "Esportivo",
                        "cultural": "Cultural",
                        "religioso": "Religioso",
                        "beneficente": "Beneficente"
                    }
                }
            },
            {
                title: "Data", 
                field: "date", 
                sorter: "date", 
                width: 150,
                responsive: 1, // Prioridade alta
                formatter: function(cell, formatterParams) {
                    const row = cell.getRow().getData();
                    let html = cell.getValue();
                    if (row.end_date) {
                        html += `<br><small>até ${row.end_date}</small>`;
                    }
                    return html;
                }
            },
            {title: "Local", field: "location", sorter: "string", headerFilter: "input", responsive: 4}, // Esconder primeiro
            {
                title: "Participantes", 
                field: "participants", 
                width: 120, 
                sorter: "number",
                responsive: 2, // Prioridade média
                formatter: function(cell, formatterParams) {
                    const row = cell.getRow().getData();
                    let text = row.participants;
                    if (row.capacity) {
                        text += ` / ${row.capacity}`;
                    }
                    return text;
                }
            },
            {
                title: "Status", 
                field: "status", 
                width: 120,
                responsive: 3, // Esconder em telas pequenas
                formatter: function(cell, formatterParams) {
                    const row = cell.getRow().getData();
                    let html = '';
                    if (row.is_public) {
                        html += '<span class="status-badge status-public">🌐 Público</span>';
                    } else {
                        html += '<span class="status-badge status-private">🔒 Privado</span>';
                    }
                    if (row.requires_approval) {
                        html += '<br><small>✋ Aprovação necessária</small>';
                    }
                    return html;
                },
                headerFilter: "select",
                headerFilterParams: {values: {"": "Todos", "public": "Público", "private": "Privado"}}
            },
            {
                title: "Ações", 
                field: "actions", 
                width: 150,
                responsive: 0, // Sempre visível
                formatter: function(cell, formatterParams) {
                    const row = cell.getRow().getData();
                    return `
                        <div class="action-buttons">
                            <a href="/edit_event/${row.id}" class="btn btn-sm btn-secondary" title="Editar Evento">✏️</a>
                            <a href="/event/${row.id}/guest_messages" class="btn btn-sm btn-info" title="Ver Mensagens">💬</a>
                            <a href="/guest/${row.invite_code}" class="btn btn-sm btn-success" title="Área do Convidado" target="_blank">👥</a>
                        </div>
                    `;
                },
                headerSort: false
            }
        ]
    });
    
    addGlobalSearch("created-events-table", table);
}

// Função para inicializar tabela de eventos participados (dashboard usuário)
function initParticipatingEventsTable(data) {
    if (!document.getElementById("participating-events-table")) return;
    
    const table = new Tabulator("#participating-events-table", {
        ...tabulatorConfig,
        data: data,
        columns: [
            {title: "Título", field: "title", sorter: "string", headerFilter: "input", responsive: 0, minWidth: 200},
            {title: "Data", field: "date", sorter: "date", width: 150, responsive: 1},
            {title: "Local", field: "location", sorter: "string", headerFilter: "input", responsive: 2}
        ]
    });
    
    addGlobalSearch("participating-events-table", table);
}

// Função para adicionar barra de busca global
function addGlobalSearch(tableId, table) {
    const container = document.getElementById(tableId).parentElement;
    const toolbar = document.createElement('div');
    toolbar.className = 'table-toolbar';
    toolbar.innerHTML = `
        <div>
            <input type="text" class="table-search" placeholder="Buscar em todos os campos..." id="${tableId}-search">
        </div>
        <div>
            <button class="btn btn-secondary" onclick="downloadCSV('${tableId}')" style="padding: 0.5rem 1rem; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">📥 Exportar CSV</button>
        </div>
    `;
    container.insertBefore(toolbar, document.getElementById(tableId));
    
    // Configurar busca global
    document.getElementById(`${tableId}-search`).addEventListener('input', function(e) {
        const searchTerm = e.target.value;
        if (searchTerm) {
            // Criar filtros para todos os campos de texto
            const filters = [];
            const columns = table.getColumnDefinitions();
            
            columns.forEach(col => {
                if (col.field && col.field !== 'actions' && col.field !== 'status') {
                    filters.push({field: col.field, type: "like", value: searchTerm});
                }
            });
            
            table.setFilter(filters, "OR");
        } else {
            table.clearFilter();
        }
    });
    
    // Guardar referência da tabela para download
    window[`table_${tableId}`] = table;
}

// Função para download CSV
function downloadCSV(tableId) {
    const table = window[`table_${tableId}`];
    if (table) {
        try {
            table.download("csv", `${tableId}-${new Date().toISOString().split('T')[0]}.csv`);
            showNotification('Arquivo CSV baixado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao baixar CSV:', error);
            showNotification('Erro ao baixar arquivo CSV', 'error');
        }
    } else {
        showNotification('Tabela não encontrada', 'error');
    }
}

// Função para extrair dados das tabelas HTML existentes
function extractTableData(tableId) {
    const table = document.querySelector(`#${tableId} table, .admin-table`);
    if (!table) return [];
    
    const rows = table.querySelectorAll('tbody tr');
    const data = [];
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData = {};
        
        // Mapear dados baseado no contexto da tabela
        if (tableId.includes('users')) {
            rowData.id = cells[0]?.textContent.trim();
            rowData.name = cells[1]?.textContent.trim();
            rowData.email = cells[2]?.textContent.trim();
            rowData.is_admin = cells[3]?.textContent.trim().toLowerCase().includes('sim');
            rowData.created_at = cells[4]?.textContent.trim();
        } else if (tableId.includes('events')) {
            rowData.id = cells[0]?.textContent.trim();
            rowData.title = cells[1]?.textContent.trim();
            rowData.creator = cells[2]?.textContent.trim();
            rowData.date = cells[3]?.textContent.trim();
            rowData.location = cells[4]?.textContent.trim();
            rowData.invite_code = cells[5]?.textContent.trim();
            rowData.participants = cells[6]?.textContent.trim();
        }
        
        if (Object.keys(rowData).length > 0) {
            data.push(rowData);
        }
    });
    
    return data;
}

// Função para mostrar loading nas tabelas
function showTableLoading(tableId) {
    const container = document.getElementById(tableId);
    if (container) {
        container.innerHTML = `
            <div class="tabulator-loading-container" style="display: flex; justify-content: center; align-items: center; height: 200px;">
                <div class="tabulator-loader"></div>
                <span style="margin-left: 1rem;">Carregando dados...</span>
            </div>
        `;
    }
}

// Função para mostrar erro nas tabelas
function showTableError(tableId, errorMessage) {
    const container = document.getElementById(tableId);
    if (container) {
        container.innerHTML = `
            <div class="tabulator-error-container" style="text-align: center; padding: 2rem; color: #c14c3c;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                <h3>Erro ao carregar dados</h3>
                <p>${errorMessage}</p>
                <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 1rem;">
                    Tentar Novamente
                </button>
            </div>
        `;
    }
}

// Função para verificar se Tabulator está disponível
function checkTabulatorAvailability() {
    if (typeof Tabulator === 'undefined') {
        console.error('Tabulator não está carregado. Verifique a conexão de internet.');
        return false;
    }
    return true;
}

// Função para aplicar tema escuro nas tabelas
function applyDarkThemeToTables() {
    const tables = document.querySelectorAll('.tabulator');
    tables.forEach(table => {
        if (document.body.classList.contains('dark-theme')) {
            table.classList.add('dark-theme');
        } else {
            table.classList.remove('dark-theme');
        }
    });
}

// Observer para mudanças de tema
const themeObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            applyDarkThemeToTables();
        }
    });
});

// Iniciar observação de mudanças no tema
if (document.body) {
    themeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
    });
}

// Melhorar a inicialização com fallback para tabelas HTML
function initializeTablesWithFallback() {
    if (!checkTabulatorAvailability()) {
        console.warn('Tabulator não disponível, usando tabelas HTML tradicionais');
        return;
    }

    // Esconder tabelas noscript se JS estiver funcionando
    const noscriptTables = document.querySelectorAll('noscript');
    noscriptTables.forEach(table => {
        table.style.display = 'none';
    });

    // Aguardar um momento para garantir que o Tabulator foi carregado
    setTimeout(() => {
        // Verificar se estamos na página do admin dashboard
        if (document.querySelector('.admin-dashboard')) {
            // Carregar dados de usuários
            const usersDataElement = document.getElementById('users-data');
            if (usersDataElement) {
                try {
                    showTableLoading('users-table');
                    const usersData = JSON.parse(usersDataElement.textContent);
                    initUsersTable(usersData);
                } catch (e) {
                    console.error('Erro ao carregar dados de usuários:', e);
                    showTableError('users-table', 'Não foi possível carregar a lista de usuários.');
                }
            }
            
            // Carregar dados de eventos
            const eventsDataElement = document.getElementById('events-data');
            if (eventsDataElement) {
                try {
                    showTableLoading('events-table');
                    const eventsData = JSON.parse(eventsDataElement.textContent);
                    initEventsTable(eventsData);
                } catch (e) {
                    console.error('Erro ao carregar dados de eventos:', e);
                    showTableError('events-table', 'Não foi possível carregar a lista de eventos.');
                }
            }
        }
        
        // Verificar se estamos na página do dashboard do usuário
        if (document.querySelector('.dashboard-container')) {
            // Carregar dados de eventos criados
            const createdEventsDataElement = document.getElementById('created-events-data');
            if (createdEventsDataElement) {
                try {
                    showTableLoading('created-events-table');
                    const createdEventsData = JSON.parse(createdEventsDataElement.textContent);
                    initCreatedEventsTable(createdEventsData);
                } catch (e) {
                    console.error('Erro ao carregar dados de eventos criados:', e);
                    showTableError('created-events-table', 'Não foi possível carregar seus eventos.');
                }
            }
            
            // Carregar dados de eventos participados
            const participatingEventsDataElement = document.getElementById('participating-events-data');
            if (participatingEventsDataElement) {
                try {
                    showTableLoading('participating-events-table');
                    const participatingEventsData = JSON.parse(participatingEventsDataElement.textContent);
                    initParticipatingEventsTable(participatingEventsData);
                } catch (e) {
                    console.error('Erro ao carregar dados de eventos participados:', e);
                    showTableError('participating-events-table', 'Não foi possível carregar os eventos que você participa.');
                }
            }
        }

        // Aplicar tema escuro se necessário
        applyDarkThemeToTables();
    }, 100);
}

// Adicionar atalhos de teclado para melhorar a experiência
function addKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + F para focar na busca global
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            const searchInput = document.querySelector('.table-search:visible, .table-search');
            if (searchInput) {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Escape para limpar filtros
        if (e.key === 'Escape') {
            const searchInputs = document.querySelectorAll('.table-search');
            searchInputs.forEach(input => {
                if (input === document.activeElement) {
                    input.value = '';
                    input.dispatchEvent(new Event('input'));
                }
            });
        }
    });
}

// Adicionar indicadores de acessibilidade
function addAccessibilityFeatures() {
    // Adicionar skip links para tabelas
    const tables = document.querySelectorAll('[id$="-table"]');
    tables.forEach(table => {
        const skipLink = document.createElement('a');
        skipLink.href = `#${table.id}`;
        skipLink.className = 'skip-to-table';
        skipLink.textContent = `Pular para tabela ${table.id.replace('-table', '')}`;
        table.parentElement.insertBefore(skipLink, table);
    });
    
    // Adicionar ARIA labels
    const searchInputs = document.querySelectorAll('.table-search');
    searchInputs.forEach(input => {
        input.setAttribute('aria-label', 'Buscar na tabela');
        input.setAttribute('role', 'searchbox');
    });
}

// Adicionar notificações de sucesso para ações
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Adicionar estilos inline se não existirem
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1000;
                animation: slideInRight 0.3s ease;
                max-width: 400px;
            }
            .notification-success { border-left: 4px solid #28a745; }
            .notification-error { border-left: 4px solid #dc3545; }
            .notification-info { border-left: 4px solid #17a2b8; }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 1rem;
            }
            .notification-message { flex: 1; }
            .notification-close {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                opacity: 0.6;
            }
            .notification-close:hover { opacity: 1; }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            body.dark-theme .notification {
                background: #3d2925;
                color: #f5f5f5;
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Auto remover após 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Função para aplicar melhorias gerais de UX
function enhanceUserExperience() {
    // Adicionar loading state nos botões de ação
    const actionButtons = document.querySelectorAll('.action-buttons .btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Adicionar estado de carregamento
            const originalText = this.innerHTML;
            this.innerHTML = '⏳';
            this.disabled = true;
            
            // Restaurar após um tempo (para casos onde não há redirecionamento)
            setTimeout(() => {
                this.innerHTML = originalText;
                this.disabled = false;
            }, 3000);
        });
    });
    
    // Melhorar feedback visual para filtros
    const filterInputs = document.querySelectorAll('.tabulator-header-filter input');
    filterInputs.forEach(input => {
        input.addEventListener('input', function() {
            clearTimeout(this.debounceTimer);
            this.classList.add('filtering');
            
            this.debounceTimer = setTimeout(() => {
                this.classList.remove('filtering');
            }, 500);
        });
    });
}

// Inicializar melhorias quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Usar a função melhorada de inicialização
    initializeTablesWithFallback();
    
    // Aguardar a inicialização das tabelas
    setTimeout(() => {
        addKeyboardShortcuts();
        addAccessibilityFeatures();
        enhanceUserExperience();
    }, 200);
});

// Funções para ações administrativas

// Função para visualizar detalhes do usuário
function viewUserDetails(userId) {
    // Por enquanto, mostrar um alert com informações básicas
    // Em uma implementação futura, isso poderia abrir um modal
    alert(`Visualizar detalhes do usuário ID: ${userId}\n\nEsta funcionalidade pode ser expandida para mostrar:\n- Histórico de eventos\n- Informações de perfil\n- Atividades recentes`);
}

// Função para editar permissões do usuário
function editUserPermissions(userId) {
    const confirmed = confirm(`Deseja tornar este usuário um administrador?\n\nISTO É UMA AÇÃO SENSÍVEL que dará ao usuário acesso administrativo completo.`);
    
    if (confirmed) {
        // Aqui seria feita a requisição para alterar as permissões
        // Por enquanto, mostrar mensagem de confirmação
        alert(`Funcionalidade de alteração de permissões para usuário ${userId} seria implementada aqui.\n\nEsta ação requereria:\n- Confirmação adicional\n- Log de auditoria\n- Notificação ao usuário`);
    }
}

// Função para excluir evento (admin)
function deleteEvent(eventId) {
    const confirmed = confirm(`⚠️ ATENÇÃO!\n\nDeseja realmente EXCLUIR este evento?\n\nEsta ação:\n- NÃO pode ser desfeita\n- Removerá todas as participações\n- Excluirá todas as mensagens relacionadas\n\nTem certeza que deseja continuar?`);
    
    if (confirmed) {
        const doubleConfirm = confirm(`CONFIRMAÇÃO FINAL\n\nDigite SIM para confirmar a exclusão do evento ${eventId}:`);
        
        if (doubleConfirm) {
            // Aqui seria feita a requisição DELETE para o servidor
            // Por enquanto, mostrar mensagem de que seria implementado
            showNotification(`Exclusão do evento ${eventId} seria processada aqui.\n\nImplementação requereria:\n- Endpoint DELETE no backend\n- Validações de segurança\n- Log de auditoria`, 'warning');
        }
    }
}

// ===== NOVAS FUNÇÕES ADMINISTRATIVAS EXPANDIDAS =====

// Funções para Usuários
function viewUserProfile(userId) {
    showNotification(`Redirecionando para perfil completo do usuário ${userId}`, 'info');
    // window.location.href = `/admin/user/${userId}/profile`;
}

function viewUserEvents(userId) {
    showNotification(`Carregando todos os eventos do usuário ${userId}`, 'info');
    // window.location.href = `/admin/user/${userId}/events`;
}

function sendMessageToUser(userId) {
    const message = prompt('Digite a mensagem que deseja enviar ao usuário:');
    if (message && message.trim()) {
        showNotification(`Mensagem "${message}" seria enviada ao usuário ${userId}`, 'success');
        // Implementar envio de mensagem
    }
}

function toggleAdminStatus(userId) {
    const confirmed = confirm(`⚠️ Deseja alterar o status de administrador do usuário ${userId}?\n\nEsta ação afetará as permissões do usuário.`);
    if (confirmed) {
        showNotification(`Status de admin do usuário ${userId} seria alterado`, 'warning');
        // Implementar toggle admin
    }
}

function editUser(userId) {
    showNotification(`Redirecionando para edição do usuário ${userId}`, 'info');
    // window.location.href = `/admin/user/${userId}/edit`;
}

function toggleUserSuspension(userId) {
    const confirmed = confirm(`Deseja suspender/reativar o usuário ${userId}?`);
    if (confirmed) {
        showNotification(`Status de suspensão do usuário ${userId} seria alterado`, 'warning');
        // Implementar suspensão
    }
}

function confirmDeleteUser(userId) {
    const confirmed = confirm(`⚠️ ATENÇÃO!\n\nDeseja realmente EXCLUIR o usuário ${userId}?\n\nEsta ação:\n- NÃO pode ser desfeita\n- Removerá todos os eventos do usuário\n- Excluirá todo histórico\n\nTem certeza?`);
    
    if (confirmed) {
        const finalConfirm = prompt('Digite "CONFIRMAR" para excluir permanentemente:');
        if (finalConfirm === 'CONFIRMAR') {
            showNotification(`Usuário ${userId} seria excluído permanentemente`, 'error');
            // Implementar exclusão
        }
    }
}

// Funções para Eventos
function viewEventDetails(eventId) {
    showNotification(`Carregando detalhes completos do evento ${eventId}`, 'info');
    // window.location.href = `/admin/event/${eventId}/details`;
}

function duplicateEvent(eventId) {
    const confirmed = confirm(`Deseja criar uma cópia do evento ${eventId}?`);
    if (confirmed) {
        showNotification(`Evento ${eventId} seria duplicado`, 'success');
        // Implementar duplicação
    }
}

function sendEventNotification(eventId) {
    const message = prompt('Digite a notificação que deseja enviar aos participantes:');
    if (message && message.trim()) {
        showNotification(`Notificação "${message}" seria enviada aos participantes do evento ${eventId}`, 'info');
        // Implementar notificação em massa
    }
}

function exportParticipants(eventId) {
    const format = confirm('Escolha o formato:\n\nOK = Excel (.xlsx)\nCancelar = CSV (.csv)');
    const formatType = format ? 'Excel' : 'CSV';
    showNotification(`Lista de participantes do evento ${eventId} seria exportada em formato ${formatType}`, 'success');
    // Implementar exportação
}

function confirmDeleteEvent(eventId) {
    const confirmed = confirm(`⚠️ ATENÇÃO!\n\nDeseja realmente EXCLUIR o evento ${eventId}?\n\nEsta ação:\n- NÃO pode ser desfeita\n- Removerá todas as participações\n- Excluirá todas as mensagens\n\nTem certeza?`);
    
    if (confirmed) {
        const finalConfirm = prompt('Digite "EXCLUIR" para confirmar:');
        if (finalConfirm === 'EXCLUIR') {
            showNotification(`Evento ${eventId} seria excluído permanentemente`, 'error');
            // Implementar exclusão
        }
    }
}

// Função utilitária para mostrar notificações
function showNotification(message, type = 'info') {
    const colors = {
        'info': '#17a2b8',
        'success': '#28a745', 
        'warning': '#ffc107',
        'error': '#dc3545'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 400px;
        font-weight: 500;
        white-space: pre-line;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}
