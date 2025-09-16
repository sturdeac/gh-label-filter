// GitHub PR Label Filter - Interactive Functionality
class LabelFilterBuilder {
    constructor() {
        this.groups = [];
        this.groupIdCounter = 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTheme();
        this.updateQuery();
        
        // Add initial empty group
        this.addGroup();
    }

    setupEventListeners() {
        // Dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        darkModeToggle.addEventListener('click', () => this.toggleDarkMode());

        // Add group button
        const addGroupBtn = document.getElementById('addGroup');
        addGroupBtn.addEventListener('click', () => this.addGroup());

        // Copy query button
        const copyQueryBtn = document.getElementById('copyQuery');
        copyQueryBtn.addEventListener('click', () => this.copyQuery());

        // Apply query button
        const applyQueryBtn = document.getElementById('applyQuery');
        applyQueryBtn.addEventListener('click', () => this.applyQuery());

        // Clear all button
        const clearAllBtn = document.getElementById('clearAll');
        clearAllBtn.addEventListener('click', () => this.clearAll());

        // Parse existing URL parameters
        this.parseUrlParameters();
    }

    toggleDarkMode() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update icon
        const icon = document.querySelector('#darkModeToggle i');
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Update icon
        const icon = document.querySelector('#darkModeToggle i');
        icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    addGroup() {
        const groupId = `group-${this.groupIdCounter++}`;
        const group = {
            id: groupId,
            operator: 'OR',
            labels: []
        };

        this.groups.push(group);
        this.renderGroup(group);
        this.updateQuery();
    }

    renderGroup(group) {
        const labelGroupsContainer = document.getElementById('labelGroups');
        
        const groupElement = document.createElement('div');
        groupElement.className = 'label-group';
        groupElement.setAttribute('data-group-id', group.id);
        
        groupElement.innerHTML = `
            <div class="group-title">
                <h4>Group ${this.groups.length}</h4>
                <div class="group-controls">
                    <button class="toggle-operator ${group.operator === 'OR' ? 'active' : ''}" data-operator="OR">OR</button>
                    <button class="toggle-operator ${group.operator === 'AND' ? 'active' : ''}" data-operator="AND">AND</button>
                    <button class="remove-group">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="labels-container" data-group-id="${group.id}">
                ${this.renderLabels(group.labels)}
            </div>
            <div class="add-label-container">
                <input type="text" class="label-input" placeholder="Enter label name..." maxlength="50">
                <button class="toggle-negative" title="Toggle negative search">
                    <i class="fas fa-minus"></i>
                </button>
                <button class="add-label-btn">
                    <i class="fas fa-plus"></i> Add
                </button>
            </div>
        `;

        labelGroupsContainer.appendChild(groupElement);
        this.setupGroupEventListeners(groupElement, group);
    }

    setupGroupEventListeners(groupElement, group) {
        // Operator toggle buttons
        const operatorButtons = groupElement.querySelectorAll('.toggle-operator');
        operatorButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const operator = btn.getAttribute('data-operator');
                group.operator = operator;
                
                // Update active state
                operatorButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.updateQuery();
            });
        });

        // Remove group button
        const removeGroupBtn = groupElement.querySelector('.remove-group');
        removeGroupBtn.addEventListener('click', () => {
            this.removeGroup(group.id);
        });

        // Label input
        const labelInput = groupElement.querySelector('.label-input');
        const addLabelBtn = groupElement.querySelector('.add-label-btn');
        const toggleNegativeBtn = groupElement.querySelector('.toggle-negative');

        // Add label on Enter key or button click
        const addLabel = () => {
            const labelName = labelInput.value.trim();
            if (labelName) {
                const isNegative = toggleNegativeBtn.classList.contains('active');
                this.addLabelToGroup(group.id, labelName, isNegative);
                labelInput.value = '';
                toggleNegativeBtn.classList.remove('active');
            }
        };

        labelInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addLabel();
            }
        });

        addLabelBtn.addEventListener('click', addLabel);

        // Toggle negative search
        toggleNegativeBtn.addEventListener('click', () => {
            toggleNegativeBtn.classList.toggle('active');
        });
    }

    renderLabels(labels) {
        return labels.map(label => `
            <div class="label-tag ${label.negative ? 'negative' : ''}">
                ${label.negative ? '-' : ''}${label.name}
                <button class="remove-label" data-label="${label.name}" data-negative="${label.negative}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    addLabelToGroup(groupId, labelName, isNegative = false) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        // Check if label already exists
        const existingLabel = group.labels.find(l => l.name === labelName && l.negative === isNegative);
        if (existingLabel) return;

        const label = {
            name: labelName,
            negative: isNegative
        };

        group.labels.push(label);
        this.updateGroupDisplay(group);
        this.updateQuery();
    }

    updateGroupDisplay(group) {
        const groupElement = document.querySelector(`[data-group-id="${group.id}"]`);
        const labelsContainer = groupElement.querySelector('.labels-container');
        
        labelsContainer.innerHTML = this.renderLabels(group.labels);
        
        // Re-attach event listeners for remove buttons
        const removeButtons = labelsContainer.querySelectorAll('.remove-label');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const labelName = btn.getAttribute('data-label');
                const isNegative = btn.getAttribute('data-negative') === 'true';
                this.removeLabelFromGroup(group.id, labelName, isNegative);
            });
        });
    }

    removeLabelFromGroup(groupId, labelName, isNegative) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        group.labels = group.labels.filter(l => !(l.name === labelName && l.negative === isNegative));
        this.updateGroupDisplay(group);
        this.updateQuery();
    }

    removeGroup(groupId) {
        this.groups = this.groups.filter(g => g.id !== groupId);
        
        const groupElement = document.querySelector(`[data-group-id="${groupId}"]`);
        if (groupElement) {
            groupElement.remove();
        }
        
        // Renumber remaining groups
        this.renumberGroups();
        this.updateQuery();
    }

    renumberGroups() {
        const groupElements = document.querySelectorAll('.label-group');
        groupElements.forEach((element, index) => {
            const title = element.querySelector('.group-title h4');
            title.textContent = `Group ${index + 1}`;
        });
    }

    updateQuery() {
        let query = 'is:pr is:open';
        
        if (this.groups.length === 0 || this.groups.every(g => g.labels.length === 0)) {
            document.getElementById('queryText').textContent = query;
            return;
        }

        const groupQueries = this.groups
            .filter(group => group.labels.length > 0)
            .map(group => {
                const labelQueries = group.labels.map(label => {
                    const prefix = label.negative ? '-' : '';
                    return `${prefix}label:"${label.name}"`;
                });
                
                if (labelQueries.length === 1) {
                    return labelQueries[0];
                } else if (group.operator === 'OR') {
                    return `(${labelQueries.join(' OR ')})`;
                } else {
                    return labelQueries.join(' ');
                }
            });

        if (groupQueries.length > 0) {
            query += ' ' + groupQueries.join(' ');
        }

        document.getElementById('queryText').textContent = query;
    }

    copyQuery() {
        const queryText = document.getElementById('queryText').textContent;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(queryText).then(() => {
                this.showCopySuccess();
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = queryText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showCopySuccess();
        }
    }

    showCopySuccess() {
        const copyBtn = document.getElementById('copyQuery');
        copyBtn.classList.add('copied');
        
        setTimeout(() => {
            copyBtn.classList.remove('copied');
        }, 2000);
    }

    applyQuery() {
        const queryText = document.getElementById('queryText').textContent;
        const encodedQuery = encodeURIComponent(queryText);
        const githubUrl = `https://github.com/pulls?q=${encodedQuery}`;
        
        window.open(githubUrl, '_blank');
    }

    clearAll() {
        this.groups = [];
        this.groupIdCounter = 0;
        
        const labelGroupsContainer = document.getElementById('labelGroups');
        const groups = labelGroupsContainer.querySelectorAll('.label-group');
        groups.forEach(group => group.remove());
        
        this.addGroup(); // Add one empty group
        this.updateQuery();
    }

    parseUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const repo = urlParams.get('repo');
        const labels = urlParams.get('labels');
        
        if (repo) {
            // If repo is specified, modify the query to include it
            this.baseQuery = `is:pr is:open repo:${repo}`;
        }
        
        if (labels) {
            // Parse existing labels and add them to the first group
            const labelArray = labels.split(',').map(l => l.trim()).filter(l => l.length > 0);
            if (labelArray.length > 0 && this.groups.length > 0) {
                const firstGroup = this.groups[0];
                labelArray.forEach(labelName => {
                    const isNegative = labelName.startsWith('-');
                    const cleanName = isNegative ? labelName.substring(1) : labelName;
                    this.addLabelToGroup(firstGroup.id, cleanName, isNegative);
                });
            }
        }
    }

    // Export/Import functionality for preserving state
    exportState() {
        return {
            groups: this.groups,
            theme: document.documentElement.getAttribute('data-theme')
        };
    }

    importState(state) {
        if (!state || !state.groups) return;
        
        this.clearAll();
        this.groups = [];
        
        state.groups.forEach(groupData => {
            const group = {
                id: `group-${this.groupIdCounter++}`,
                operator: groupData.operator || 'OR',
                labels: groupData.labels || []
            };
            
            this.groups.push(group);
            this.renderGroup(group);
        });
        
        if (state.theme) {
            document.documentElement.setAttribute('data-theme', state.theme);
            localStorage.setItem('theme', state.theme);
        }
        
        this.updateQuery();
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.labelFilterBuilder = new LabelFilterBuilder();
});

// Add some demo functionality for showcasing
document.addEventListener('DOMContentLoaded', () => {
    // Add some example labels after a brief delay for demo purposes
    setTimeout(() => {
        const builder = window.labelFilterBuilder;
        if (builder && builder.groups.length > 0) {
            // Only add demo data if no URL parameters were provided
            const urlParams = new URLSearchParams(window.location.search);
            if (!urlParams.has('labels') && !urlParams.has('repo')) {
                // Add some example labels to show functionality
                builder.addLabelToGroup(builder.groups[0].id, 'bug', false);
                builder.addLabelToGroup(builder.groups[0].id, 'enhancement', false);
                
                // Add a second group
                builder.addGroup();
                if (builder.groups.length > 1) {
                    builder.groups[1].operator = 'AND';
                    builder.addLabelToGroup(builder.groups[1].id, 'needs-review', false);
                    builder.addLabelToGroup(builder.groups[1].id, 'wip', true); // negative
                    
                    // Update the operator button display
                    const secondGroupElement = document.querySelectorAll('.label-group')[1];
                    if (secondGroupElement) {
                        const operatorButtons = secondGroupElement.querySelectorAll('.toggle-operator');
                        operatorButtons.forEach(btn => {
                            btn.classList.remove('active');
                            if (btn.getAttribute('data-operator') === 'AND') {
                                btn.classList.add('active');
                            }
                        });
                    }
                }
                
                builder.updateQuery();
            }
        }
    }, 1000);
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+K or Cmd+K to focus on the first label input
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const firstInput = document.querySelector('.label-input');
        if (firstInput) {
            firstInput.focus();
        }
    }
    
    // Ctrl+Enter or Cmd+Enter to apply query
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        window.labelFilterBuilder?.applyQuery();
    }
    
    // Escape to clear all
    if (e.key === 'Escape' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        window.labelFilterBuilder?.clearAll();
    }
});

// Add some utility functions for external integration
window.GitHubLabelFilter = {
    // Allow external scripts to get/set the current filter state
    getState: () => window.labelFilterBuilder?.exportState(),
    setState: (state) => window.labelFilterBuilder?.importState(state),
    
    // Helper function to create a shareable URL
    getShareableUrl: () => {
        const state = window.labelFilterBuilder?.exportState();
        if (!state) return window.location.href;
        
        const params = new URLSearchParams();
        if (state.groups && state.groups.length > 0) {
            const allLabels = state.groups.flatMap(group => 
                group.labels.map(label => label.negative ? `-${label.name}` : label.name)
            );
            if (allLabels.length > 0) {
                params.set('labels', allLabels.join(','));
            }
        }
        
        return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    }
};