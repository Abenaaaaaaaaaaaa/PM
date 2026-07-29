/**
 * 项目管理系统
 * 四层嵌套：客户 -> 项目 -> 环节 -> 任务
 * 数据持久化：localStorage（本地）+ GitHub Gist（跨设备同步）
 */

const STORAGE_KEY = 'projectManagerData';
const GIST_TOKEN_KEY = 'pmGistToken';
const GIST_ID_KEY = 'pmGistId';
const GIST_FILENAME = 'project-manager-data.json';

class ProjectManager {
    constructor() {
        this.view = 'table'; // 'table' | 'calendar' | 'archive'
        this.calendarType = 'month'; // 'month' | 'week'
        this.currentDate = new Date();
        this.selectedProjectId = 'all'; // 'all' | projectId
        this.expandedNodes = new Set();
        this.selectedNodeId = null;
        this.editingProject = null;
        this.inputModalCallback = null;
        this.sidebarCollapsed = false;
        this.sidebarWidth = 300;
        this.isResizing = false;

        // 颜色池，用于日历事件
        this.colors = [
            { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
            { bg: '#dcfce7', text: '#166534', border: '#86efac' },
            { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
            { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },
            { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
            { bg: '#ccfbf1', text: '#115e59', border: '#5eead4' },
            { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' },
            { bg: '#f3e8ff', text: '#6b21a8', border: '#d8b4fe' },
        ];

        this.initData();
        this.init();
        this.initResize();
    }

    initData() {
        // 优先从 localStorage 加载本地数据
        const local = this.loadFromLocal();
        if (local) {
            this.data = local;
        } else {
            this.data = this.getDefaultData();
        }

        // 默认展开所有节点
        this.traverse(node => this.expandedNodes.add(node.id));
    }

    getDefaultData() {
        // 初始化示例数据
        return [
            {
                id: 'c1',
                type: 'customer',
                name: '阿里巴巴',
                children: [
                    {
                        id: 'p1',
                type: 'project',
                name: '天猫商城改版',
                startDate: '2026-07-01',
                endDate: '2026-09-15',
                description: '对天猫商城首页及核心链路进行全面改版升级，提升用户体验和转化率。',
                children: [
                    {
                        id: 's1',
                        type: 'stage',
                        name: '产品环节',
                        color: '#3b82f6',
                        children: [
                            { id: 't1', type: 'task', name: '需求调研', startDate: '2026-07-01', endDate: '2026-07-10', archived: false, children: [] },
                            { id: 't2', type: 'task', name: 'PRD撰写', startDate: '2026-07-11', endDate: '2026-07-20', archived: false, children: [] }
                        ]
                    },
                    {
                        id: 's2',
                        type: 'stage',
                        name: '设计环节',
                        color: '#8b5cf6',
                        children: [
                            { id: 't3', type: 'task', name: '交互设计', startDate: '2026-07-21', endDate: '2026-08-05', archived: false, children: [] },
                            { id: 't4', type: 'task', name: '视觉设计', startDate: '2026-08-06', endDate: '2026-08-20', archived: false, children: [] }
                        ]
                    },
                    {
                        id: 's3',
                        type: 'stage',
                        name: '开发环节',
                        color: '#10b981',
                        children: [
                            { id: 't5', type: 'task', name: '前端开发', startDate: '2026-08-21', endDate: '2026-09-10', archived: false, children: [] },
                            { id: 't6', type: 'task', name: '后端接口', startDate: '2026-08-21', endDate: '2026-09-05', archived: false, children: [] }
                        ]
                    },
                    {
                        id: 's4',
                        type: 'stage',
                        name: 'UAT环节',
                        color: '#f59e0b',
                        children: [
                            { id: 't7', type: 'task', name: '功能测试', startDate: '2026-09-06', endDate: '2026-09-12', archived: false, children: [] },
                            { id: 't8', type: 'task', name: '用户验收', startDate: '2026-09-13', endDate: '2026-09-15', archived: false, children: [] }
                        ]
                    }
                ]
            },
            {
                id: 'p2',
                type: 'project',
                name: '钉钉小程序',
                startDate: '2026-08-01',
                endDate: '2026-10-30',
                description: '开发钉钉端的企业管理小程序，集成考勤、审批、日报功能。',
                children: [
                    {
                        id: 's5',
                        type: 'stage',
                        name: '产品环节',
                        color: '#3b82f6',
                        children: [
                            { id: 't9', type: 'task', name: '竞品分析', startDate: '2026-08-01', endDate: '2026-08-10', archived: false, children: [] }
                        ]
                    },
                    {
                        id: 's6',
                        type: 'stage',
                        name: '开发环节',
                        color: '#10b981',
                        children: [
                            { id: 't10', type: 'task', name: '小程序开发', startDate: '2026-09-01', endDate: '2026-10-20', archived: false, children: [] }
                        ]
                    }
                ]
            }
                ]
            },
            {
                id: 'c2',
                type: 'customer',
                name: '腾讯科技',
                children: [
                    {
                        id: 'p3',
                type: 'project',
                name: '微信小程序商城',
                startDate: '2026-07-15',
                endDate: '2026-11-20',
                description: '为腾讯内部员工打造专属福利商城小程序。',
                children: [
                    {
                        id: 's7',
                        type: 'stage',
                        name: '产品环节',
                        color: '#3b82f6',
                        children: [
                            { id: 't11', type: 'task', name: '功能规划', startDate: '2026-07-15', endDate: '2026-07-25', archived: false, children: [] }
                        ]
                    },
                    {
                        id: 's8',
                        type: 'stage',
                        name: '设计环节',
                        color: '#8b5cf6',
                        children: [
                            { id: 't12', type: 'task', name: 'UI设计', startDate: '2026-07-26', endDate: '2026-08-15', archived: false, children: [] }
                        ]
                    },
                    {
                        id: 's9',
                        type: 'stage',
                        name: '开发环节',
                        color: '#10b981',
                        children: [
                            { id: 't13', type: 'task', name: '商城开发', startDate: '2026-08-16', endDate: '2026-10-30', archived: false, children: [] }
                        ]
                    },
                    {
                        id: 's10',
                        type: 'stage',
                        name: 'UAT环节',
                        color: '#f59e0b',
                        children: [
                            { id: 't14', type: 'task', name: '上线测试', startDate: '2026-11-01', endDate: '2026-11-20', archived: false, children: [] }
                        ]
                    }
                        ]
                    }
                ]
            }
        ];
    }

    init() {
        this.renderTree();
        this.renderMain();
    }

    // ---------- 工具方法 ----------

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    traverse(callback) {
        const walk = nodes => {
            nodes.forEach(node => {
                callback(node);
                if (node.children) walk(node.children);
            });
        };
        walk(this.data);
    }

    findNode(id, nodes = this.data) {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children?.length) {
                const found = this.findNode(id, node.children);
                if (found) return found;
            }
        }
        return null;
    }

    findParent(id, nodes = this.data, parent = null) {
        for (const node of nodes) {
            if (node.id === id) return parent;
            if (node.children?.length) {
                const found = this.findParent(id, node.children, node);
                if (found) return found;
            }
        }
        return null;
    }

    deleteNode(id) {
        const parent = this.findParent(id);
        if (parent) {
            parent.children = parent.children.filter(c => c.id !== id);
        } else {
            this.data = this.data.filter(c => c.id !== id);
        }
        this.renderAll();
    }

    toggleTaskArchived(taskId) {
        const task = this.findNode(taskId);
        if (task && task.type === 'task') {
            task.archived = !task.archived;
            this.renderAll();
        }
    }

    getNodeColor(nodeId) {
        let hash = 0;
        for (let i = 0; i < nodeId.length; i++) {
            hash = nodeId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return this.colors[Math.abs(hash) % this.colors.length];
    }

    formatDate(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    isSameDay(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    }

    // 中国法定节假日（简化版）
    getHolidayName(d) {
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const day = d.getDate();
        const key = `${m}-${day}`;
        const holidays = {
            '1-1': '元旦',
            '2-14': '情人节',
            '3-8': '妇女节',
            '3-12': '植树节',
            '5-1': '劳动节',
            '5-4': '青年节',
            '6-1': '儿童节',
            '7-1': '建党节',
            '8-1': '建军节',
            '9-10': '教师节',
            '10-1': '国庆节',
            '12-25': '圣诞节'
        };
        if (holidays[key]) return holidays[key];
        // 母亲节 (5月第二个周日)
        if (m === 5) {
            const secondSunday = 8 - new Date(y, 4, 1).getDay();
            if (day === secondSunday) return '母亲节';
        }
        // 父亲节 (6月第三个周日)
        if (m === 6) {
            const thirdSunday = 15 - new Date(y, 5, 1).getDay();
            if (day === thirdSunday) return '父亲节';
        }
        return null;
    }

    isHoliday(d) {
        return this.getHolidayName(d) !== null;
    }

    parseDate(dateStr) {
        if (!dateStr) return null;
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    }

    // ---------- 视图切换 ----------

    setView(view) {
        this.view = view;
        document.getElementById('btnTable').className = view === 'table'
            ? 'px-3 py-1.5 text-sm rounded-md transition-all bg-white shadow-sm text-gray-800 font-medium flex items-center gap-1.5'
            : 'px-3 py-1.5 text-sm rounded-md transition-all text-gray-500 hover:text-gray-700 flex items-center gap-1.5';
        document.getElementById('btnCalendar').className = view === 'calendar'
            ? 'px-3 py-1.5 text-sm rounded-md transition-all bg-white shadow-sm text-gray-800 font-medium flex items-center gap-1.5'
            : 'px-3 py-1.5 text-sm rounded-md transition-all text-gray-500 hover:text-gray-700 flex items-center gap-1.5';
        document.getElementById('btnArchive').className = view === 'archive'
            ? 'px-3 py-1.5 text-sm rounded-md transition-all bg-white shadow-sm text-gray-800 font-medium flex items-center gap-1.5'
            : 'px-3 py-1.5 text-sm rounded-md transition-all text-gray-500 hover:text-gray-700 flex items-center gap-1.5';

        const calToggle = document.getElementById('calendarToggle');
        calToggle.classList.toggle('hidden', view !== 'calendar');
        calToggle.classList.toggle('flex', view === 'calendar');

        this.renderMain();
    }

    setCalendarType(type) {
        this.calendarType = type;
        document.getElementById('btnMonth').className = type === 'month'
            ? 'px-3 py-1.5 text-sm rounded-md transition-all bg-white shadow-sm text-gray-800 font-medium'
            : 'px-3 py-1.5 text-sm rounded-md transition-all text-gray-500 hover:text-gray-700';
        document.getElementById('btnWeek').className = type === 'week'
            ? 'px-3 py-1.5 text-sm rounded-md transition-all bg-white shadow-sm text-gray-800 font-medium'
            : 'px-3 py-1.5 text-sm rounded-md transition-all text-gray-500 hover:text-gray-700';
        this.renderMain();
    }

    // ---------- 树形渲染 ----------

    renderTree() {
        const container = document.getElementById('treeContainer');
        container.innerHTML = this.buildTreeHtml(this.data);
    }

    buildTreeHtml(nodes, level = 0) {
        if (!nodes?.length) return '';
        return nodes.map(node => {
            const isExpanded = this.expandedNodes.has(node.id);
            const hasChildren = node.children?.length > 0;
            const isActive = this.selectedNodeId === node.id;

            const icons = {
                customer: `<svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>`,
                project: `<svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>`,
                stage: `<svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>`,
                task: `<svg class="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
            };

            const addActions = {
                customer: `<button onclick="event.stopPropagation();app.showInputModal('新建项目', name => app.addChild('${node.id}', 'project', name))" class="tree-action-btn" title="添加项目"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg></button>`,
                project: `<button onclick="event.stopPropagation();app.showInputModal('新建环节', name => app.addChild('${node.id}', 'stage', name))" class="tree-action-btn" title="添加环节"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg></button>` +
                         `<button onclick="event.stopPropagation();app.editProject('${node.id}')" class="tree-action-btn" title="编辑项目"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button>`,
                stage: `<button onclick="event.stopPropagation();app.showInputModal('新建任务', name => app.addChild('${node.id}', 'task', name))" class="tree-action-btn" title="添加任务"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg></button>`,
                task: '',
            };

            return `
                <div class="tree-item ${isActive ? 'active' : ''}" data-id="${node.id}">
                    <div class="tree-content" onclick="app.selectNode('${node.id}')">
                        ${hasChildren ? `
                            <span class="tree-toggle ${isExpanded ? '' : 'collapsed'}" onclick="event.stopPropagation();app.toggleNode('${node.id}')">
                                <svg class="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                            </span>
                        ` : '<span class="w-4"></span>'}
                        <span class="tree-icon">${icons[node.type]}</span>
                        <span class="text-sm text-gray-700 truncate flex-1">${node.name}</span>
                        <span class="tree-actions">
                            ${addActions[node.type] || ''}
                            <button onclick="event.stopPropagation();app.deleteNode('${node.id}')" class="tree-action-btn" title="删除">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </span>
                    </div>
                    ${hasChildren ? `
                        <div class="tree-children ${isExpanded ? '' : 'collapsed'}">
                            ${this.buildTreeHtml(node.children, level + 1)}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    toggleNode(id) {
        if (this.expandedNodes.has(id)) {
            this.expandedNodes.delete(id);
        } else {
            this.expandedNodes.add(id);
        }
        this.renderTree();
    }

    selectNode(id) {
        this.selectedNodeId = id;
        this.renderTree();
        // 可选：根据选中节点筛选主视图
    }

    addCustomer() {
        this.showInputModal('新建客户', name => {
            this.data.push({
                id: this.generateId(),
                type: 'customer',
                name,
                children: []
            });
            this.renderAll();
        });
    }

    addChild(parentId, type, name) {
        const parent = this.findNode(parentId);
        if (!parent) return;

        const newNode = {
            id: this.generateId(),
            type,
            name,
            children: type === 'task' ? undefined : []
        };

        if (type === 'project') {
            newNode.startDate = '';
            newNode.endDate = '';
            newNode.description = '';
        } else if (type === 'task') {
            newNode.startDate = '';
            newNode.endDate = '';
            newNode.archived = false;
        }

        parent.children = parent.children || [];
        parent.children.push(newNode);
        this.expandedNodes.add(parentId);
        this.renderAll();
    }

    // ---------- 主视图渲染 ----------

    renderMain() {
        const container = document.getElementById('mainContent');
        if (this.view === 'table') {
            container.innerHTML = this.renderTableView();
            this.initTableInteractions();
        } else if (this.view === 'archive') {
            container.innerHTML = this.renderArchiveView();
        } else {
            container.innerHTML = this.renderCalendarView();
            this.initCalendarInteractions();
        }
    }

    renderAll() {
        this.saveToLocal();
        this.renderTree();
        this.renderMain();
    }

    // ---------- 数据持久化 ----------

    loadFromLocal() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            return null;
        } catch (e) {
            console.error('读取本地数据失败：', e);
            return null;
        }
    }

    saveToLocal() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.error('保存本地数据失败：', e);
        }
    }

    getGistConfig() {
        return {
            token: localStorage.getItem(GIST_TOKEN_KEY) || '',
            id: localStorage.getItem(GIST_ID_KEY) || ''
        };
    }

    saveGistConfig(token, id) {
        if (token) localStorage.setItem(GIST_TOKEN_KEY, token);
        else localStorage.removeItem(GIST_TOKEN_KEY);
        if (id) localStorage.setItem(GIST_ID_KEY, id);
        else localStorage.removeItem(GIST_ID_KEY);
    }

    async syncToGist() {
        const { token, id } = this.getGistConfig();
        if (!token) {
            alert('请先在同步面板中填写 GitHub Token');
            this.openSyncModal();
            return;
        }

        const content = JSON.stringify({
            updatedAt: new Date().toISOString(),
            data: this.data
        }, null, 2);

        try {
            let res;
            if (id) {
                // 更新现有 Gist
                res = await fetch(`https://api.github.com/gists/${id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        files: { [GIST_FILENAME]: { content } }
                    })
                });
            } else {
                // 创建新 Gist
                res = await fetch('https://api.github.com/gists', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        description: '项目管理系统数据',
                        public: false,
                        files: { [GIST_FILENAME]: { content } }
                    })
                });
            }

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || `HTTP ${res.status}`);
            }

            const gist = await res.json();
            if (!id) {
                this.saveGistConfig(token, gist.id);
            }
            this.updateSyncStatus(`同步成功 · ${new Date().toLocaleTimeString()}`);
            return gist;
        } catch (e) {
            alert('同步失败：' + e.message);
            console.error(e);
        }
    }

    async loadFromGist(silent = false) {
        const { token, id } = this.getGistConfig();
        if (!token || !id) {
            if (!silent) {
                alert('请先在同步面板中填写 Token 并完成一次同步（同步后会自动保存 Gist ID）');
                this.openSyncModal();
            }
            return null;
        }

        try {
            const res = await fetch(`https://api.github.com/gists/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github+json'
                }
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || `HTTP ${res.status}`);
            }

            const gist = await res.json();
            const file = gist.files[GIST_FILENAME];
            if (!file) {
                if (!silent) alert('未在该 Gist 中找到数据文件');
                return null;
            }

            const parsed = JSON.parse(file.content);
            if (!parsed.data || !Array.isArray(parsed.data)) {
                if (!silent) alert('Gist 数据格式错误');
                return null;
            }

            if (!silent) {
                const confirmMsg = `检测到云端数据（更新时间：${parsed.updatedAt ? new Date(parsed.updatedAt).toLocaleString() : '未知'}）。\n\n是否覆盖本地数据？\n\n点"确定"使用云端数据，点"取消"保留本地数据。`;
                if (!confirm(confirmMsg)) return null;
            }

            this.data = parsed.data;
            this.saveToLocal();
            this.renderAll();
            this.updateSyncStatus(`已从云端拉取 · ${new Date().toLocaleTimeString()}`);
            return parsed;
        } catch (e) {
            if (!silent) {
                alert('拉取失败：' + e.message + '\n\n如果是 404 错误，可能是 Gist ID 已失效，请重新同步一次。');
            }
            console.error(e);
            return null;
        }
    }

    updateSyncStatus(text) {
        const el = document.getElementById('syncStatus');
        if (el) el.textContent = text;
    }

    openSyncModal() {
        const { token, id } = this.getGistConfig();
        document.getElementById('gistToken').value = token;
        document.getElementById('gistId').value = id;
        document.getElementById('syncModal').classList.remove('hidden');
        document.getElementById('syncModal').classList.add('flex');
    }

    closeSyncModal() {
        document.getElementById('syncModal').classList.add('hidden');
        document.getElementById('syncModal').classList.remove('flex');
    }

    saveSyncConfig() {
        const token = document.getElementById('gistToken').value.trim();
        const id = document.getElementById('gistId').value.trim();
        this.saveGistConfig(token, id);
        this.closeSyncModal();
        this.updateSyncStatus(id ? '已配置 · ' + new Date().toLocaleTimeString() : '配置已清除');
    }

    // ---------- 表格视图 ----------

    renderTableView() {
        const rows = [];
        const walk = (nodes, path = []) => {
            nodes.forEach(node => {
                const newPath = [...path, node];
                if (node.type === 'task') {
                    const customer = newPath.find(n => n.type === 'customer');
                    const project = newPath.find(n => n.type === 'project');
                    const stage = newPath.find(n => n.type === 'stage');
                    rows.push({
                        customerId: customer?.id || '',
                        customer: customer?.name || '-',
                        projectId: project?.id || '',
                        project: project?.name || '-',
                        stageId: stage?.id || '',
                        stage: stage?.name || '-',
                        stageColor: stage?.color || '#94a3b8',
                        stageName: stage?.name || '-',
                        taskId: node.id,
                        task: node.name,
                        startDate: node.startDate || '-',
                        endDate: node.endDate || '-',
                        description: project?.description || '-',
                        archived: node.archived || false
                    });
                }
                if (node.children?.length) {
                    walk(node.children, newPath);
                }
            });
        };
        walk(this.data);

        // 计算合并的 rowspan
        let customerRowspan = {};
        let projectRowspan = {};
        let stageRowspan = {};
        let i = 0;
        while (i < rows.length) {
            const cId = rows[i].customerId;
            let cEnd = i;
            while (cEnd < rows.length && rows[cEnd].customerId === cId) cEnd++;
            customerRowspan[i] = cEnd - i;

            let j = i;
            while (j < cEnd) {
                const pId = rows[j].projectId;
                let pEnd = j;
                while (pEnd < cEnd && rows[pEnd].projectId === pId) pEnd++;
                projectRowspan[j] = pEnd - j;

                let k = j;
                while (k < pEnd) {
                    const sId = rows[k].stageId;
                    let sEnd = k;
                    while (sEnd < pEnd && rows[sEnd].stageId === sId) sEnd++;
                    stageRowspan[k] = sEnd - k;
                    k = sEnd;
                }
                j = pEnd;
            }
            i = cEnd;
        }

        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 class="text-lg font-semibold text-gray-800">项目列表</h2>
                        <p class="text-sm text-gray-500 mt-1">共 ${rows.length} 条记录</p>
                    </div>
                    <div class="text-xs text-gray-400">点击单元格可直接编辑 · 拖拽列宽调整大小 · 点击环节色点可改颜色</div>
                </div>
                <div class="overflow-x-auto">
                    <table class="data-table" id="dataTable">
                        <colgroup>
                            <col style="width:100px"><col style="width:140px"><col style="width:140px"><col style="width:140px"><col style="width:120px"><col style="width:120px"><col style="width:90px"><col style="width:200px"><col style="width:80px">
                        </colgroup>
                        <thead>
                            <tr>
                                <th>品牌<div class="col-resizer"></div></th>
                                <th>项目<div class="col-resizer"></div></th>
                                <th>环节<div class="col-resizer"></div></th>
                                <th>任务<div class="col-resizer"></div></th>
                                <th>开始时间<div class="col-resizer"></div></th>
                                <th>结束时间<div class="col-resizer"></div></th>
                                <th>状态<div class="col-resizer"></div></th>
                                <th>简介<div class="col-resizer"></div></th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.map((row, idx) => {
                                let customerCell = '';
                                if (customerRowspan[idx]) {
                                    customerCell = `<td rowspan="${customerRowspan[idx]}" class="merged-cell text-blue-700 align-middle">${row.customer}</td>`;
                                }
                                let projectCell = '';
                                if (projectRowspan[idx]) {
                                    projectCell = `<td rowspan="${projectRowspan[idx]}" class="merged-cell text-green-700 align-middle">
                                        <div class="font-medium">${row.project}</div>
                                    </td>`;
                                }
                                let stageCell = '';
                                if (stageRowspan[idx]) {
                                    stageCell = `<td rowspan="${stageRowspan[idx]}" class="merged-cell align-middle" style="background:${row.stageColor}11;border-left:4px solid ${row.stageColor}">
                                        <div class="flex items-center gap-2">
                                            <div class="stage-color-dot-table" style="background:${row.stageColor};width:14px;height:14px;border-radius:50%;cursor:pointer;flex-shrink:0;border:2px solid white;box-shadow:0 0 0 1px ${row.stageColor}" onclick="app.openColorPicker('${row.stageName.replace(/'/g, "\\'")}', event)" title="点击修改颜色"></div>
                                            <span class="editable-cell inline-block" data-type="text" data-id="${row.stageId}" data-field="name" style="color:${row.stageColor};font-weight:600">
                                                ${row.stage}
                                            </span>
                                        </div>
                                    </td>`;
                                }
                                let descriptionCell = '';
                                let actionCell = '';
                                if (projectRowspan[idx]) {
                                    descriptionCell = `<td rowspan="${projectRowspan[idx]}" class="max-w-xs text-sm text-gray-500 align-top editable-cell" data-type="textarea" data-id="${row.projectId}" data-field="description">${row.description}</td>`;
                                    actionCell = `<td rowspan="${projectRowspan[idx]}" class="align-middle">
                                        ${row.projectId ? `
                                            <button onclick="app.editProject('${row.projectId}')" class="text-blue-600 hover:text-blue-700 text-sm font-medium">编辑项目</button>
                                        ` : '-'}
                                    </td>`;
                                }

                                const statusCell = `<td class="align-middle">
                                    <button onclick="app.toggleTaskArchived('${row.taskId}')" class="task-status-badge ${row.archived ? 'archived' : 'active'}">
                                        ${row.archived ? '已归档' : '进行中'}
                                    </button>
                                </td>`;

                                return `
                                    <tr>
                                        ${customerCell}
                                        ${projectCell}
                                        ${stageCell}
                                        <td class="font-medium text-pink-700 editable-cell" data-type="text" data-id="${row.taskId}" data-field="name">${row.task}</td>
                                        <td class="editable-cell" data-type="date" data-id="${row.taskId}" data-field="startDate">${row.startDate}</td>
                                        <td class="editable-cell" data-type="date" data-id="${row.taskId}" data-field="endDate">${row.endDate}</td>
                                        ${statusCell}
                                        ${descriptionCell}
                                        ${actionCell}
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // ---------- 日历视图（传统网格 + 跨天横条）----------

    renderCalendarView() {
        if (this.calendarType === 'month') {
            return this.renderMonthCalendar();
        }
        return this.renderWeekCalendar();
    }

    // 获取周一为起始的日期数组
    getMonthDates() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        // 转换为周一为起始：getDay() 0=周日, 1=周一, ... 6=周六
        // 转为周一起始：(day + 6) % 7  结果: 0=周一, 1=周二, ... 6=周日
        const dayOfWeekMonFirst = (firstDay.getDay() + 6) % 7;
        const startPadding = dayOfWeekMonFirst;

        const prevLastDay = new Date(year, month, 0).getDate();
        const lastDay = new Date(year, month + 1, 0).getDate();

        const dates = [];
        for (let i = startPadding - 1; i >= 0; i--) {
            dates.push(new Date(year, month - 1, prevLastDay - i));
        }
        for (let i = 1; i <= lastDay; i++) {
            dates.push(new Date(year, month, i));
        }
        const remaining = 42 - dates.length;
        for (let i = 1; i <= remaining; i++) {
            dates.push(new Date(year, month + 1, i));
        }
        return dates;
    }

    getWeekDates() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const date = this.currentDate.getDate();
        const dayOfWeek = this.currentDate.getDay();
        // 转为周一起始
        const monFirst = (dayOfWeek + 6) % 7;
        const weekStart = new Date(year, month, date - monFirst);
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            dates.push(d);
        }
        return dates;
    }

    // 收集任务数据
    collectTasks() {
        const tasks = [];
        const walk = (nodes, customer = null, project = null) => {
            nodes.forEach(node => {
                if (node.type === 'customer') {
                    walk(node.children || [], node, project);
                } else if (node.type === 'project') {
                    walk(node.children || [], customer, node);
                } else if (node.type === 'stage') {
                    const color = node.color || '#64748b';
                    (node.children || []).forEach(task => {
                        if (task.type === 'task' && task.startDate) {
                            if (this.selectedProjectId !== 'all' && project?.id !== this.selectedProjectId) return;
                            tasks.push({
                                task,
                                customerName: customer?.name || '-',
                                projectName: project?.name || '-',
                                projectId: project?.id || '',
                                stageName: node.name,
                                stageColor: color
                            });
                        }
                    });
                }
            });
        };
        walk(this.data);
        return tasks;
    }

    // 获取所有项目列表（用于过滤Tab）
    getProjectsList() {
        const projects = [];
        const walk = (nodes) => {
            nodes.forEach(node => {
                if (node.type === 'project') {
                    projects.push({ id: node.id, name: node.name });
                }
                if (node.children) walk(node.children);
            });
        };
        walk(this.data);
        return projects;
    }

    // 任务泳道布局（避免重叠）
    layoutTaskLanes(weekTasks, weekStartMidnight) {
        // 过滤在当前周内的任务
        const tasks = weekTasks.map(t => {
            const taskStart = this.parseDate(t.task.startDate);
            const taskEnd = this.parseDate(t.task.endDate || t.task.startDate);
            const startOffset = Math.max(0, Math.round((taskStart - weekStartMidnight) / 86400000));
            const endOffset = Math.min(6, Math.round((taskEnd - weekStartMidnight) / 86400000));
            return { ...t, startOffset, endOffset };
        }).filter(t => t.endOffset >= 0 && t.startOffset <= 6);

        // 排序：开始早的在前，时长长的在前
        tasks.sort((a, b) => {
            if (a.startOffset !== b.startOffset) return a.startOffset - b.startOffset;
            return (b.endOffset - b.startOffset) - (a.endOffset - a.startOffset);
        });

        // 贪心分配泳道
        const lanes = []; // 每条泳道记录最后任务的 endOffset
        const BAR_HEIGHT = 42;
        const BAR_GAP = 4;

        for (const t of tasks) {
            let laneIdx = lanes.findIndex(end => end < t.startOffset);
            if (laneIdx === -1) {
                laneIdx = lanes.length;
                lanes.push(t.endOffset);
            } else {
                lanes[laneIdx] = t.endOffset;
            }
            t.lane = laneIdx;
        }

        return { tasks, laneCount: lanes.length, BAR_HEIGHT, BAR_GAP };
    }

    setProjectFilter(projectId) {
        this.selectedProjectId = projectId;
        this.renderAll();
    }

    renderMonthCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const dates = this.getMonthDates();
        const weeks = [];
        for (let i = 0; i < 6; i++) {
            weeks.push(dates.slice(i * 7, i * 7 + 7));
        }

        const weekDayNames = ['一', '二', '三', '四', '五', '六', '日'];
        const today = new Date();
        const allTasks = this.collectTasks();
        const projects = this.getProjectsList();

        // 项目筛选 Tab
        const filterTabs = `<div class="project-filter-tabs">
            <div class="project-filter-tab ${this.selectedProjectId === 'all' ? 'active' : ''}" onclick="app.setProjectFilter('all')">全部项目</div>
            ${projects.map(p => `<div class="project-filter-tab ${this.selectedProjectId === p.id ? 'active' : ''}" onclick="app.setProjectFilter('${p.id}')">${p.name}</div>`).join('')}
        </div>`;

        const header = weekDayNames.map(d =>
            `<div class="calendar-header-cell">${d}</div>`
        ).join('');

        const rows = weeks.map((week) => {
            const weekStart = week[0];
            const weekStartMidnight = new Date(weekStart);
            weekStartMidnight.setHours(0, 0, 0, 0);

            const weekTasks = allTasks.filter(t => {
                const tStart = this.parseDate(t.task.startDate);
                const tEnd = this.parseDate(t.task.endDate || t.task.startDate);
                const weekEnd = new Date(week[6]);
                weekEnd.setHours(23, 59, 59, 999);
                return tStart <= weekEnd && tEnd >= weekStartMidnight;
            });

            const { tasks: layoutTasks, laneCount, BAR_HEIGHT, BAR_GAP } = this.layoutTaskLanes(weekTasks, weekStartMidnight);
            const weekHeight = Math.max(110, 40 + laneCount * (BAR_HEIGHT + BAR_GAP));

            const dayCells = week.map((d) => {
                const isToday = this.isSameDay(d, today);
                const isOtherMonth = d.getMonth() !== month;
                const dayOfWeek = d.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const holidayName = this.getHolidayName(d);
                const isHoliday = !!holidayName;
                return `<div class="calendar-day ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''} ${isHoliday ? 'holiday' : ''}">
                    <div class="calendar-day-header">
                        <div class="calendar-day-number" ${isHoliday ? `title="${holidayName}"` : ''}>${d.getDate()}</div>
                        ${isHoliday ? `<span class="calendar-holiday-tag">${holidayName}</span>` : ''}
                    </div>
                </div>`;
            }).join('');

            const taskBars = layoutTasks.map(t => {
                const left = (t.startOffset / 7) * 100;
                const width = ((t.endOffset - t.startOffset + 1) / 7) * 100;
                const top = t.lane * (BAR_HEIGHT + BAR_GAP);
                const c = t.stageColor;
                const isArchived = t.task.archived;

                return `<div class="day-bar-item ${isArchived ? 'archived-bar' : ''}" data-event-id="${t.task.id}"
                    style="left:${left}%;width:${width}%;top:${top}px;background:${isArchived ? '#e2e8f0' : c + '22'};color:${isArchived ? '#94a3b8' : c};border:1px solid ${isArchived ? '#cbd5e1' : c}">
                    <div class="bar-title">${t.task.name}</div>
                    <div class="bar-meta">${t.projectName} · ${t.stageName}</div>
                    <div class="bar-resize-handle" data-event-id="${t.task.id}"></div>
                </div>`;
            }).join('');

            return `
                <div class="calendar-week-row" style="min-height:${weekHeight}px">
                    ${dayCells}
                    <div class="day-bar-layer">
                        ${taskBars}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div class="calendar-nav">
                    <button onclick="app.prevMonth()" class="calendar-nav-btn">上月</button>
                    <button onclick="app.goToday()" class="calendar-nav-btn">今天</button>
                    <button onclick="app.nextMonth()" class="calendar-nav-btn">下月</button>
                    <h2 class="calendar-title">${year}年 ${month + 1}月</h2>
                    <div class="ml-auto flex items-center gap-3">
                        <span class="text-xs text-gray-400">拖拽任务条移动 · 拖拽右边缘改时长 · 双击编辑</span>
                        <button onclick="app.addNewTask()" class="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                            新增任务
                        </button>
                    </div>
                </div>
                ${filterTabs}
                <div class="calendar-scroll-area">
                    <div class="calendar-header">${header}</div>
                    <div class="calendar-grid" id="calendarGrid">
                        ${rows}
                    </div>
                </div>
            </div>
        `;
    }

    renderWeekCalendar() {
        const dates = this.getWeekDates();
        const today = new Date();
        const weekDayNames = ['一', '二', '三', '四', '五', '六', '日'];
        const allTasks = this.collectTasks();
        const projects = this.getProjectsList();

        const weekStartMidnight = new Date(dates[0]);
        weekStartMidnight.setHours(0, 0, 0, 0);

        const weekTasks = allTasks.filter(t => {
            const tStart = this.parseDate(t.task.startDate);
            const tEnd = this.parseDate(t.task.endDate || t.task.startDate);
            const weekEnd = new Date(dates[6]);
            weekEnd.setHours(23, 59, 59, 999);
            return tStart <= weekEnd && tEnd >= weekStartMidnight;
        });

        const { tasks: layoutTasks, laneCount, BAR_HEIGHT, BAR_GAP } = this.layoutTaskLanes(weekTasks, weekStartMidnight);
        const weekHeight = Math.max(220, 40 + laneCount * (BAR_HEIGHT + BAR_GAP));

        const filterTabs = `<div class="project-filter-tabs">
            <div class="project-filter-tab ${this.selectedProjectId === 'all' ? 'active' : ''}" onclick="app.setProjectFilter('all')">全部项目</div>
            ${projects.map(p => `<div class="project-filter-tab ${this.selectedProjectId === p.id ? 'active' : ''}" onclick="app.setProjectFilter('${p.id}')">${p.name}</div>`).join('')}
        </div>`;

        const header = weekDayNames.map((d, i) => {
            const isToday = this.isSameDay(dates[i], today);
            const dateNum = dates[i].getDate();
            const isWeekend = dates[i].getDay() === 0 || dates[i].getDay() === 6;
            return `<div class="week-day-header ${isToday ? 'text-blue-600' : ''} ${isWeekend ? 'text-gray-400' : ''}">
                ${d}<br><span class="text-xs">${dates[i].getMonth() + 1}/${dateNum}</span>
            </div>`;
        }).join('');

        const dayCells = dates.map((d) => {
            const isToday = this.isSameDay(d, today);
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            const holidayName = this.getHolidayName(d);
            const isHoliday = !!holidayName;
            return `<div class="week-day-cell ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''} ${isHoliday ? 'holiday' : ''}">
                ${isHoliday ? `<div class="calendar-holiday-tag" style="margin-top:2px">${holidayName}</div>` : ''}
            </div>`;
        }).join('');

        const taskBars = layoutTasks.map(t => {
            const left = (t.startOffset / 7) * 100;
            const width = ((t.endOffset - t.startOffset + 1) / 7) * 100;
            const top = t.lane * (BAR_HEIGHT + BAR_GAP);
            const c = t.stageColor;
            const isArchived = t.task.archived;

            return `<div class="day-bar-item ${isArchived ? 'archived-bar' : ''}" data-event-id="${t.task.id}"
                style="left:${left}%;width:${width}%;top:${top}px;background:${isArchived ? '#e2e8f0' : c + '22'};color:${isArchived ? '#94a3b8' : c};border:1px solid ${isArchived ? '#cbd5e1' : c}">
                <div class="bar-title">${t.task.name}</div>
                <div class="bar-meta">${t.projectName} · ${t.stageName}</div>
                <div class="bar-resize-handle" data-event-id="${t.task.id}"></div>
            </div>`;
        }).join('');

        const title = `${dates[0].getFullYear()}年 ${dates[0].getMonth() + 1}月${dates[0].getDate()}日 - ${dates[6].getMonth() + 1}月${dates[6].getDate()}日`;

        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div class="calendar-nav">
                    <button onclick="app.prevWeek()" class="calendar-nav-btn">上周</button>
                    <button onclick="app.goToday()" class="calendar-nav-btn">本周</button>
                    <button onclick="app.nextWeek()" class="calendar-nav-btn">下周</button>
                    <h2 class="calendar-title">${title}</h2>
                    <div class="ml-auto flex items-center gap-3">
                        <span class="text-xs text-gray-400">拖拽任务条移动 · 拖拽右边缘改时长 · 双击编辑</span>
                        <button onclick="app.addNewTask()" class="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                            新增任务
                        </button>
                    </div>
                </div>
                ${filterTabs}
                <div class="calendar-scroll-area">
                    <div class="week-view">
                        <div class="week-header-grid">${header}</div>
                        <div class="week-content-grid" id="weekGrid" style="min-height:${weekHeight}px">
                            ${dayCells}
                            <div class="day-bar-layer" style="top:8px">
                                ${taskBars}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderArchiveView() {
        const archivedTasks = [];
        const walk = (nodes, path = []) => {
            nodes.forEach(node => {
                const newPath = [...path, node];
                if (node.type === 'task' && node.archived) {
                    const customer = newPath.find(n => n.type === 'customer');
                    const project = newPath.find(n => n.type === 'project');
                    const stage = newPath.find(n => n.type === 'stage');
                    archivedTasks.push({
                        taskId: node.id,
                        task: node.name,
                        customer: customer?.name || '-',
                        project: project?.name || '-',
                        stage: stage?.name || '-',
                        stageColor: stage?.color || '#94a3b8',
                        startDate: node.startDate || '-',
                        endDate: node.endDate || '-'
                    });
                }
                if (node.children?.length) {
                    walk(node.children, newPath);
                }
            });
        };
        walk(this.data);

        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center mb-4">
                    <div>
                        <h2 class="text-lg font-semibold text-gray-800">归档任务</h2>
                        <p class="text-sm text-gray-500 mt-1">共 ${archivedTasks.length} 条已归档记录</p>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="data-table" id="archiveTable">
                        <colgroup>
                            <col style="width:140px"><col style="width:140px"><col style="width:120px"><col style="width:200px"><col style="width:120px"><col style="width:120px"><col style="width:100px">
                        </colgroup>
                        <thead>
                            <tr>
                                <th>品牌</th>
                                <th>项目</th>
                                <th>环节</th>
                                <th>任务</th>
                                <th>开始时间</th>
                                <th>结束时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${archivedTasks.length === 0 ? `
                                <tr>
                                    <td colspan="7" class="text-center text-gray-400 py-12">暂无已归档任务</td>
                                </tr>
                            ` : archivedTasks.map(row => `
                                <tr>
                                    <td class="text-blue-700 font-medium">${row.customer}</td>
                                    <td class="text-green-700 font-medium">${row.project}</td>
                                    <td>
                                        <div class="flex items-center gap-2">
                                            <div class="stage-color-dot-table" style="background:${row.stageColor};width:14px;height:14px;border-radius:50%;flex-shrink:0;border:2px solid white;box-shadow:0 0 0 1px ${row.stageColor}"></div>
                                            <span style="color:${row.stageColor};font-weight:600">${row.stage}</span>
                                        </div>
                                    </td>
                                    <td class="font-medium text-pink-700">${row.task}</td>
                                    <td>${row.startDate}</td>
                                    <td>${row.endDate}</td>
                                    <td>
                                        <button onclick="app.toggleTaskArchived('${row.taskId}')" class="text-blue-600 hover:text-blue-700 text-sm font-medium">恢复</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    addNewTask() {
        const today = new Date();
        const startDate = this.formatDateISO(today);
        this.openTaskModal(startDate, startDate);
    }

    // ---------- 日历导航 ----------

    prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderMain();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderMain();
    }

    prevWeek() {
        this.currentDate.setDate(this.currentDate.getDate() - 7);
        this.renderMain();
    }

    nextWeek() {
        this.currentDate.setDate(this.currentDate.getDate() + 7);
        this.renderMain();
    }

    goToday() {
        this.currentDate = new Date();
        this.renderMain();
    }

    // ---------- 模态框 ----------

    editProject(id) {
        const node = this.findNode(id);
        if (!node || node.type !== 'project') return;
        this.editingProject = node;
        document.getElementById('projectName').value = node.name;
        document.getElementById('projectStart').value = node.startDate || '';
        document.getElementById('projectEnd').value = node.endDate || '';
        document.getElementById('projectDesc').value = node.description || '';
        document.getElementById('modalTitle').textContent = '编辑项目';
        document.getElementById('projectModal').classList.remove('hidden');
        document.getElementById('projectModal').classList.add('flex');
    }

    closeModal() {
        document.getElementById('projectModal').classList.add('hidden');
        document.getElementById('projectModal').classList.remove('flex');
        this.editingProject = null;
    }

    saveProject() {
        if (!this.editingProject) return;
        this.editingProject.name = document.getElementById('projectName').value;
        this.editingProject.startDate = document.getElementById('projectStart').value;
        this.editingProject.endDate = document.getElementById('projectEnd').value;
        this.editingProject.description = document.getElementById('projectDesc').value;
        this.closeModal();
        this.renderAll();
    }

    showInputModal(title, callback) {
        this.inputModalCallback = callback;
        document.getElementById('inputModalTitle').textContent = title;
        document.getElementById('inputModalField').value = '';
        document.getElementById('inputModal').classList.remove('hidden');
        document.getElementById('inputModal').classList.add('flex');
        setTimeout(() => document.getElementById('inputModalField').focus(), 100);
    }

    closeInputModal() {
        document.getElementById('inputModal').classList.add('hidden');
        document.getElementById('inputModal').classList.remove('flex');
        this.inputModalCallback = null;
    }

    saveInputModal() {
        const value = document.getElementById('inputModalField').value.trim();
        if (value && this.inputModalCallback) {
            this.inputModalCallback(value);
        }
        this.closeInputModal();
    }

    // ---------- 侧栏折叠/展开 ----------

    toggleSidebar() {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        const sidebar = document.getElementById('sidebar');
        const handle = document.getElementById('resizeHandle');
        const expandBtn = document.getElementById('sidebarExpandBtn');

        if (this.sidebarCollapsed) {
            sidebar.classList.add('collapsed');
            handle.classList.add('collapsed');
            expandBtn.classList.remove('hidden');
        } else {
            sidebar.classList.remove('collapsed');
            sidebar.style.width = this.sidebarWidth + 'px';
            handle.classList.remove('collapsed');
            expandBtn.classList.add('hidden');
        }
    }

    // ---------- 侧栏拖拽调节宽度 ----------

    initResize() {
        const handle = document.getElementById('resizeHandle');
        const sidebar = document.getElementById('sidebar');

        const onMouseDown = (e) => {
            this.isResizing = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        };

        const onMouseMove = (e) => {
            if (!this.isResizing) return;
            const newWidth = Math.max(180, Math.min(600, e.clientX));
            this.sidebarWidth = newWidth;
            sidebar.style.width = newWidth + 'px';
        };

        const onMouseUp = () => {
            if (!this.isResizing) return;
            this.isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        handle.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        
        this.initTableInteractions();
        this.initCalendarInteractions();
    }

    // ---------- 表格交互（列宽拖拽、单元格编辑）----------

    initTableInteractions() {
        const table = document.getElementById('dataTable');
        if (!table) return;

        // 列宽拖拽
        const resizers = table.querySelectorAll('.col-resizer');
        resizers.forEach(resizer => {
            let startX, startWidth, th;
            resizer.addEventListener('mousedown', (e) => {
                startX = e.clientX;
                th = resizer.parentElement;
                const colIndex = Array.from(th.parentElement.children).indexOf(th);
                const colgroup = table.querySelector('colgroup');
                startWidth = colgroup.children[colIndex].offsetWidth;
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
                e.preventDefault();
                e.stopPropagation();

                const onMove = (ev) => {
                    const diff = ev.clientX - startX;
                    const newWidth = Math.max(50, startWidth + diff);
                    colgroup.children[colIndex].style.width = newWidth + 'px';
                };
                const onUp = () => {
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                };
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
        });

        // 单元格编辑
        const editableCells = table.querySelectorAll('.editable-cell');
        editableCells.forEach(cell => {
            cell.addEventListener('click', (e) => {
                if (cell.classList.contains('editing')) return;
                e.stopPropagation();

                const type = cell.dataset.type;
                const id = cell.dataset.id;
                const field = cell.dataset.field;
                const node = this.findNode(id);
                if (!node) return;

                cell.classList.add('editing');
                const originalText = cell.textContent.trim();

                let input;
                if (type === 'textarea') {
                    input = document.createElement('textarea');
                    input.value = originalText === '-' ? '' : originalText;
                    input.rows = 2;
                } else if (type === 'date') {
                    input = document.createElement('input');
                    input.type = 'date';
                    input.value = originalText === '-' ? '' : originalText;
                } else {
                    input = document.createElement('input');
                    input.type = 'text';
                    input.value = originalText === '-' ? '' : originalText;
                }

                cell.textContent = '';
                cell.appendChild(input);
                input.focus();
                if (input.select) input.select();

                const commit = () => {
                    const newVal = input.value.trim();
                    if (type === 'date') {
                        node[field] = newVal;
                    } else {
                        node[field] = newVal;
                    }
                    this.renderAll();
                };

                input.addEventListener('blur', commit);
                input.addEventListener('keydown', (ev) => {
                    if (ev.key === 'Enter' && type !== 'textarea') {
                        ev.preventDefault();
                        input.blur();
                    } else if (ev.key === 'Escape') {
                        cell.textContent = originalText;
                        cell.classList.remove('editing');
                    }
                });
            });
        });
    }

    // ---------- 日历交互（传统网格拖拽）----------

    initCalendarInteractions() {
        const gridId = this.calendarType === 'month' ? 'calendarGrid' : 'weekGrid';
        const grid = document.getElementById(gridId);
        if (!grid) return;

        // 绑定任务条拖拽和点击
        grid.querySelectorAll('.day-bar-item').forEach(bar => {
            bar.onmousedown = (e) => {
                e.stopPropagation();
                const eventId = bar.dataset.eventId;
                const resizeHandle = e.target.closest('.bar-resize-handle');
                const node = this.findNode(eventId);
                if (!node) return;

                if (resizeHandle) {
                    this._resizingEvent = { id: eventId, startX: e.clientX, origEndDate: node.endDate || node.startDate };
                    document.body.classList.add('dragging-resize');
                } else {
                    this._movingEvent = { id: eventId, startX: e.clientX, origStartDate: node.startDate, origEndDate: node.endDate || node.startDate };
                    document.body.classList.add('dragging-move');
                }
                e.preventDefault();
            };
            bar.ondblclick = (e) => {
                e.stopPropagation();
                const eventId = bar.dataset.eventId;
                const node = this.findNode(eventId);
                if (node && node.type === 'task') {
                    this.openTaskModal(node.startDate, node.endDate || node.startDate, eventId);
                }
            };
        });

        // document 级监听只绑定一次
        if (!this._calendarDocListenersAdded) {
            this._calendarDocListenersAdded = true;

            document.addEventListener('mousemove', (e) => {
                if (!this._movingEvent && !this._resizingEvent) return;

                const container = this.calendarType === 'month'
                    ? e.target.closest('.calendar-week-row')
                    : e.target.closest('.week-content-grid');
                if (!container) {
                    this.hideDragColHighlight();
                    return;
                }

                const rect = container.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const dayIdx = Math.max(0, Math.min(6, Math.floor((x / rect.width) * 7)));
                const colLeft = (dayIdx / 7) * 100;

                let baseDate;
                if (this.calendarType === 'month') {
                    const weekRows = document.querySelectorAll('.calendar-week-row');
                    const rowEl = e.target.closest('.calendar-week-row');
                    if (!rowEl) return;
                    const rowIdx = Array.from(weekRows).indexOf(rowEl);
                    const dates = this.getMonthDates();
                    baseDate = dates[rowIdx * 7];
                } else {
                    baseDate = this.getWeekDates()[0];
                }
                if (!baseDate) return;

                const newDate = new Date(baseDate);
                newDate.setDate(baseDate.getDate() + dayIdx);

                if (this._movingEvent) {
                    const node = this.findNode(this._movingEvent.id);
                    if (node && node.startDate) {
                        const newStartDate = this.formatDateISO(newDate);
                        const diffDays = Math.round((this.parseDate(newStartDate) - this.parseDate(node.startDate)) / 86400000);
                        node.startDate = newStartDate;
                        if (node.endDate) {
                            const end = this.parseDate(node.endDate);
                            end.setDate(end.getDate() + diffDays);
                            node.endDate = this.formatDateISO(end);
                        }
                        // 显示列高亮（整列覆盖）
                        this.showDragColHighlight(container, colLeft, 100 / 7);
                        this._needsRerender = true;
                    }
                } else if (this._resizingEvent) {
                    const node = this.findNode(this._resizingEvent.id);
                    if (node && node.startDate) {
                        const newEndDate = this.formatDateISO(newDate);
                        if (this.parseDate(newEndDate) >= this.parseDate(node.startDate)) {
                            node.endDate = newEndDate;
                            // 显示竖线指示
                            this.showDragColLine(container, colLeft + 100 / 7);
                            this._needsRerender = true;
                        }
                    }
                }
            });

            document.addEventListener('mouseup', () => {
                document.body.classList.remove('dragging-move', 'dragging-resize');
                this.hideDragColHighlight();
                this._movingEvent = null;
                this._resizingEvent = null;
                if (this._needsRerender) {
                    this._needsRerender = false;
                    this.renderAll();
                }
            });
        }
    }

    showDragColHighlight(container, left, width) {
        let el = document.getElementById('dragColHighlight');
        if (!el) {
            el = document.createElement('div');
            el.id = 'dragColHighlight';
            el.className = 'drag-col-highlight';
        }
        container.appendChild(el);
        el.style.left = left + '%';
        el.style.width = width + '%';
        el.style.display = 'block';
    }

    showDragColLine(container, left) {
        let el = document.getElementById('dragColHighlight');
        if (!el) {
            el = document.createElement('div');
            el.id = 'dragColHighlight';
        }
        el.className = 'drag-col-line';
        container.appendChild(el);
        el.style.left = left + '%';
        el.style.width = '2px';
        el.style.display = 'block';
    }

    hideDragColHighlight() {
        const el = document.getElementById('dragColHighlight');
        if (el) el.style.display = 'none';
    }

    // ---------- 环节颜色选择器 ----------

    openColorPicker(stageName, event) {
        event.stopPropagation();
        // 关闭已有的
        this.closeColorPicker();

        const colorPool = [
            '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
            '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
            '#14b8a6', '#a855f7', '#eab308', '#475569', '#0891b2'
        ];

        const picker = document.createElement('div');
        picker.className = 'stage-color-picker';
        picker.id = 'colorPicker';

        // 获取当前颜色
        let currentColor = null;
        this.traverse(node => {
            if (node.type === 'stage' && node.name === stageName && node.color) {
                currentColor = node.color;
            }
        });

        colorPool.forEach(c => {
            const opt = document.createElement('div');
            opt.className = 'stage-color-option' + (c === currentColor ? ' selected' : '');
            opt.style.background = c;
            opt.onclick = (e) => {
                e.stopPropagation();
                this.setStageColor(stageName, c);
                this.closeColorPicker();
            };
            picker.appendChild(opt);
        });

        document.body.appendChild(picker);
        const rect = event.target.getBoundingClientRect();
        picker.style.left = rect.left + 'px';
        picker.style.top = (rect.bottom + 4) + 'px';

        // 点击外部关闭
        setTimeout(() => {
            document.addEventListener('click', this._colorPickerCloseHandler = () => this.closeColorPicker());
        }, 0);
    }

    closeColorPicker() {
        const picker = document.getElementById('colorPicker');
        if (picker) picker.remove();
        if (this._colorPickerCloseHandler) {
            document.removeEventListener('click', this._colorPickerCloseHandler);
            this._colorPickerCloseHandler = null;
        }
    }

    setStageColor(stageName, color) {
        // 更新所有同名环节的颜色
        this.traverse(node => {
            if (node.type === 'stage' && node.name === stageName) {
                node.color = color;
            }
        });
        this.renderAll();
    }

    formatDateISO(d) {
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    // ---------- 任务模态框 ----------

    openTaskModal(startDate, endDate, taskId = null) {
        this._taskModalData = {
            taskId,
            startDate,
            endDate
        };

        document.getElementById('taskName').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskStart').value = startDate;
        document.getElementById('taskEnd').value = endDate;
        document.getElementById('taskArchived').checked = false;

        this.populateCustomerOptions();
        document.getElementById('taskProject').innerHTML = '<option value="">请选择</option>';
        document.getElementById('taskStage').innerHTML = '<option value="">请选择</option>';

        if (taskId) {
            const node = this.findNode(taskId);
            if (node) {
                document.getElementById('taskName').value = node.name;
                document.getElementById('taskDescription').value = node.description || '';
                document.getElementById('taskArchived').checked = node.archived || false;
                // 找到所属的 customer 和 project
                const path = [];
                const findPath = (nodes) => {
                    for (const n of nodes) {
                        if (n.id === taskId) return path;
                        path.push(n);
                        if (n.children) {
                            const res = findPath(n.children);
                            if (res) return res;
                        }
                        path.pop();
                    }
                    return null;
                };
                const p = findPath(this.data);
                if (p) {
                    const customer = p.find(n => n.type === 'customer');
                    const project = p.find(n => n.type === 'project');
                    const stage = p.find(n => n.type === 'stage');
                    if (customer) {
                        document.getElementById('taskCustomer').value = customer.id;
                        this.onCustomerChange();
                        if (project) {
                            document.getElementById('taskProject').value = project.id;
                            this.onProjectChange();
                            if (stage) {
                                document.getElementById('taskStage').value = stage.id;
                            }
                        }
                    }
                }
            }
        }

        document.getElementById('taskModal').classList.remove('hidden');
        document.getElementById('taskModal').classList.add('flex');
        setTimeout(() => document.getElementById('taskName').focus(), 100);
    }

    closeTaskModal() {
        document.getElementById('taskModal').classList.add('hidden');
        document.getElementById('taskModal').classList.remove('flex');
        this._taskModalData = null;
    }

    saveTaskModal() {
        const name = document.getElementById('taskName').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const customerId = document.getElementById('taskCustomer').value;
        const projectId = document.getElementById('taskProject').value;
        const stageId = document.getElementById('taskStage').value;
        const startDate = document.getElementById('taskStart').value;
        const endDate = document.getElementById('taskEnd').value;
        const archived = document.getElementById('taskArchived').checked;

        if (!name) { alert('请输入任务名称'); return; }
        if (!customerId) { alert('请选择品牌'); return; }
        if (!projectId) { alert('请选择项目'); return; }
        if (!stageId) { alert('请选择环节'); return; }

        if (this._taskModalData.taskId) {
            // 编辑现有任务
            const task = this.findNode(this._taskModalData.taskId);
            if (task) {
                task.name = name;
                task.description = description;
                task.startDate = startDate;
                task.endDate = endDate;
                task.archived = archived;

                // 如果关联的环节改变了，需要移动节点
                const oldStage = this.findParent(task.id);
                if (oldStage && oldStage.id !== stageId) {
                    // 从旧环节移除
                    oldStage.children = oldStage.children.filter(c => c.id !== task.id);
                    // 添加到新环节
                    const newStage = this.findNode(stageId);
                    if (newStage) {
                        newStage.children = newStage.children || [];
                        newStage.children.push(task);
                    }
                }
            }
        } else {
            // 创建新任务
            const newTask = {
                id: this.generateId(),
                type: 'task',
                name,
                description,
                startDate,
                endDate,
                archived: archived || false,
                children: []
            };
            const stage = this.findNode(stageId);
            if (stage) {
                stage.children = stage.children || [];
                stage.children.push(newTask);
            }
        }

        this.closeTaskModal();
        this.renderAll();
    }

    populateCustomerOptions() {
        const select = document.getElementById('taskCustomer');
        select.innerHTML = '<option value="">请选择</option>';
        this.data.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            select.appendChild(opt);
        });
    }

    onCustomerChange() {
        const customerId = document.getElementById('taskCustomer').value;
        const select = document.getElementById('taskProject');
        select.innerHTML = '<option value="">请选择</option>';
        if (customerId) {
            const customer = this.findNode(customerId);
            if (customer) {
                (customer.children || []).forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.id;
                    opt.textContent = p.name;
                    select.appendChild(opt);
                });
            }
        }
        document.getElementById('taskStage').innerHTML = '<option value="">请选择</option>';
    }

    onProjectChange() {
        const projectId = document.getElementById('taskProject').value;
        const select = document.getElementById('taskStage');
        select.innerHTML = '<option value="">请选择</option>';
        if (projectId) {
            const project = this.findNode(projectId);
            if (project) {
                (project.children || []).forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.id;
                    opt.textContent = s.name;
                    select.appendChild(opt);
                });
            }
        }
    }
}

// 全局实例
const app = new ProjectManager();

// 键盘事件
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        app.closeModal();
        app.closeInputModal();
    }
    if (e.key === 'Enter' && !document.getElementById('inputModal').classList.contains('hidden')) {
        app.saveInputModal();
    }
});
