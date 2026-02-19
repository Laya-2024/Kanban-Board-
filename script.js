let currentListId = null;
let listCounter = 0;
let cardCounter = 0;
let editingCardId = null;

// Load from localStorage
window.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('kanbanBoard');
    if (!saved) {
        // Create default lists only if no data exists
        createDefaultLists();
    } else {
        loadFromStorage();
    }
});

function createDefaultLists() {
    const board = document.getElementById('board');
    const defaultLists = [
        { id: '1', title: 'To Do' },
        { id: '2', title: 'In Progress' },
        { id: '3', title: 'Done' }
    ];
    
    defaultLists.forEach(listData => {
        createList(listData.id, listData.title);
    });
    
    listCounter = 3;
    saveToStorage();
}

function createList(id, title) {
    const board = document.getElementById('board');
    const list = document.createElement('div');
    list.className = 'list';
    list.dataset.listId = id;
    
    list.innerHTML = `
        <div class="list-header">
            <h3 class="list-title" contenteditable="true">${title}</h3>
            <button class="list-delete" onclick="deleteList(this)">×</button>
        </div>
        <div class="cards" data-list="${id}"></div>
        <button class="btn-add-card">+ Add Card</button>
    `;
    
    board.appendChild(list);
    
    list.querySelector('.btn-add-card').addEventListener('click', (e) => {
        const listEl = e.target.closest('.list');
        currentListId = listEl.dataset.listId;
        modal.classList.add('active');
    });
    
    addDropListeners(list.querySelector('.cards'));
}

// Modal handling
const modal = document.getElementById('cardModal');
const addListBtn = document.getElementById('addListBtn');
const modalClose = document.querySelector('.modal-close');
const saveCardBtn = document.getElementById('saveCard');
const searchInput = document.getElementById('searchCards');
const filterSelect = document.getElementById('filterPriority');
const clearBoardBtn = document.getElementById('clearBoard');

// Close modal
modalClose.addEventListener('click', () => {
    modal.classList.remove('active');
    clearModalInputs();
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
        clearModalInputs();
    }
});

// Save card
saveCardBtn.addEventListener('click', () => {
    const title = document.getElementById('cardTitle').value.trim();
    const description = document.getElementById('cardDescription').value.trim();
    const dueDate = document.getElementById('cardDueDate').value;
    const priority = document.getElementById('cardPriority').value;
    const assignee = document.getElementById('cardAssignee').value.trim();
    const labels = Array.from(document.querySelectorAll('.label-check:checked')).map(cb => cb.value);

    if (!title) {
        alert('Please enter a card title');
        return;
    }

    if (editingCardId) {
        updateCard(editingCardId, title, description, dueDate, priority, assignee, labels);
        editingCardId = null;
    } else {
        createCard(currentListId, title, description, dueDate, priority, assignee, labels);
    }
    
    modal.classList.remove('active');
    clearModalInputs();
    saveToStorage();
});

function createCard(listId, title, description, dueDate, priority, assignee, labels) {
    cardCounter++;
    const cardsContainer = document.querySelector(`.cards[data-list="${listId}"]`);
    
    const card = document.createElement('div');
    card.className = 'card';
    card.draggable = true;
    card.dataset.cardId = cardCounter;
    
    let cardHTML = `
        <button class="card-edit" onclick="editCard(this)">✎</button>
        <button class="card-delete" onclick="deleteCard(this)">×</button>
        <div class="card-title">${title}</div>
    `;
    
    if (labels && labels.length > 0) {
        cardHTML += `<div class="card-labels">`;
        labels.forEach(label => {
            const emoji = label === 'bug' ? '🐛' : label === 'feature' ? '✨' : '🔥';
            cardHTML += `<span class="card-label label-${label}">${emoji} ${label}</span>`;
        });
        cardHTML += `</div>`;
    }
    
    if (description) {
        cardHTML += `<div class="card-description">${description}</div>`;
    }
    
    cardHTML += `<div class="card-meta">`;
    
    if (dueDate) {
        cardHTML += `<span class="card-due">📅 ${dueDate}</span>`;
    }
    
    cardHTML += `<span class="card-priority priority-${priority}">${priority.toUpperCase()}</span>`;
    
    if (assignee) {
        cardHTML += `<span class="card-assignee">👤 ${assignee}</span>`;
    }
    
    cardHTML += `</div>`;
    
    card.innerHTML = cardHTML;
    card.dataset.title = title;
    card.dataset.description = description;
    card.dataset.dueDate = dueDate;
    card.dataset.priority = priority;
    card.dataset.assignee = assignee;
    card.dataset.labels = labels.join(',');
    
    cardsContainer.appendChild(card);
    addDragListeners(card);
}

function clearModalInputs() {
    document.getElementById('cardTitle').value = '';
    document.getElementById('cardDescription').value = '';
    document.getElementById('cardDueDate').value = '';
    document.getElementById('cardPriority').value = 'medium';
    document.getElementById('cardAssignee').value = '';
    document.querySelectorAll('.label-check').forEach(cb => cb.checked = false);
    document.getElementById('modalTitle').textContent = 'Add New Card';
}

function deleteCard(btn) {
    if (confirm('Delete this card?')) {
        btn.closest('.card').remove();
        saveToStorage();
    }
}

function editCard(btn) {
    const card = btn.closest('.card');
    editingCardId = card.dataset.cardId;
    currentListId = card.closest('.list').dataset.listId;
    
    document.getElementById('cardTitle').value = card.dataset.title || '';
    document.getElementById('cardDescription').value = card.dataset.description || '';
    document.getElementById('cardDueDate').value = card.dataset.dueDate || '';
    document.getElementById('cardPriority').value = card.dataset.priority || 'medium';
    document.getElementById('cardAssignee').value = card.dataset.assignee || '';
    
    const labels = card.dataset.labels ? card.dataset.labels.split(',') : [];
    document.querySelectorAll('.label-check').forEach(cb => {
        cb.checked = labels.includes(cb.value);
    });
    
    document.getElementById('modalTitle').textContent = 'Edit Card';
    modal.classList.add('active');
}

function updateCard(cardId, title, description, dueDate, priority, assignee, labels) {
    const card = document.querySelector(`[data-card-id="${cardId}"]`);
    if (!card) return;
    
    let cardHTML = `
        <button class="card-edit" onclick="editCard(this)">✎</button>
        <button class="card-delete" onclick="deleteCard(this)">×</button>
        <div class="card-title">${title}</div>
    `;
    
    if (labels && labels.length > 0) {
        cardHTML += `<div class="card-labels">`;
        labels.forEach(label => {
            const emoji = label === 'bug' ? '🐛' : label === 'feature' ? '✨' : '🔥';
            cardHTML += `<span class="card-label label-${label}">${emoji} ${label}</span>`;
        });
        cardHTML += `</div>`;
    }
    
    if (description) {
        cardHTML += `<div class="card-description">${description}</div>`;
    }
    
    cardHTML += `<div class="card-meta">`;
    
    if (dueDate) {
        cardHTML += `<span class="card-due">📅 ${dueDate}</span>`;
    }
    
    cardHTML += `<span class="card-priority priority-${priority}">${priority.toUpperCase()}</span>`;
    
    if (assignee) {
        cardHTML += `<span class="card-assignee">👤 ${assignee}</span>`;
    }
    
    cardHTML += `</div>`;
    
    card.innerHTML = cardHTML;
    card.dataset.title = title;
    card.dataset.description = description;
    card.dataset.dueDate = dueDate;
    card.dataset.priority = priority;
    card.dataset.assignee = assignee;
    card.dataset.labels = labels.join(',');
}

// Add new list
addListBtn.addEventListener('click', () => {
    listCounter++;
    createList(listCounter.toString(), 'New List');
    saveToStorage();
});

function deleteList(btn) {
    if (confirm('Delete this list and all its cards?')) {
        btn.closest('.list').remove();
        saveToStorage();
    }
}

// Search functionality
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    document.querySelectorAll('.card').forEach(card => {
        const title = (card.dataset.title || '').toLowerCase();
        const description = (card.dataset.description || '').toLowerCase();
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
});

// Filter by priority
filterSelect.addEventListener('change', (e) => {
    const priority = e.target.value;
    document.querySelectorAll('.card').forEach(card => {
        if (priority === 'all' || card.dataset.priority === priority) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
});

// Clear board
clearBoardBtn.addEventListener('click', () => {
    if (confirm('Clear entire board? This cannot be undone!')) {
        document.querySelectorAll('.cards').forEach(container => {
            container.innerHTML = '';
        });
        saveToStorage();
    }
});

// Local Storage
function saveToStorage() {
    const boardData = {
        lists: [],
        cards: []
    };
    
    document.querySelectorAll('.list').forEach(list => {
        boardData.lists.push({
            id: list.dataset.listId,
            title: list.querySelector('.list-title').textContent
        });
        
        list.querySelectorAll('.card').forEach(card => {
            boardData.cards.push({
                listId: list.dataset.listId,
                cardId: card.dataset.cardId,
                title: card.dataset.title,
                description: card.dataset.description,
                dueDate: card.dataset.dueDate,
                priority: card.dataset.priority,
                assignee: card.dataset.assignee,
                labels: card.dataset.labels
            });
        });
    });
    
    localStorage.setItem('kanbanBoard', JSON.stringify(boardData));
}

function loadFromStorage() {
    const saved = localStorage.getItem('kanbanBoard');
    if (!saved) return;
    
    const boardData = JSON.parse(saved);
    
    // Load lists
    boardData.lists.forEach(listData => {
        createList(listData.id, listData.title);
        if (parseInt(listData.id) > listCounter) {
            listCounter = parseInt(listData.id);
        }
    });
    
    // Load cards
    boardData.cards.forEach(cardData => {
        const labels = cardData.labels ? cardData.labels.split(',').filter(l => l) : [];
        createCard(
            cardData.listId,
            cardData.title,
            cardData.description,
            cardData.dueDate,
            cardData.priority,
            cardData.assignee,
            labels
        );
        if (parseInt(cardData.cardId) > cardCounter) {
            cardCounter = parseInt(cardData.cardId);
        }
    });
}

// Drag and Drop functionality
function addDragListeners(card) {
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
}

function addDropListeners(cardsContainer) {
    cardsContainer.addEventListener('dragover', handleDragOver);
    cardsContainer.addEventListener('drop', handleDrop);
    cardsContainer.addEventListener('dragleave', handleDragLeave);
}

let draggedCard = null;

function handleDragStart(e) {
    draggedCard = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.cards').forEach(container => {
        container.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
    
    const afterElement = getDragAfterElement(this, e.clientY);
    if (afterElement == null) {
        this.appendChild(draggedCard);
    } else {
        this.insertBefore(draggedCard, afterElement);
    }
}

function handleDragLeave(e) {
    if (e.target.classList.contains('cards')) {
        this.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    saveToStorage();
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.card:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Initialize drag and drop for existing cards (removed - now handled dynamically)
