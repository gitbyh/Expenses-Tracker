class ExpenseTracker {
    constructor() {
        this.expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        this.initializeElements();
        this.setupEventListeners();
        this.loadTheme();
        this.updateUI();
    }

    initializeElements() {
        this.form = document.getElementById('expenseForm');
        this.dateInput = document.getElementById('date');
        this.itemInput = document.getElementById('item');
        this.amountInput = document.getElementById('amount');
        this.expensesList = document.getElementById('expensesList');
        this.exportBtn = document.getElementById('exportBtn');
        this.filterExportBtn = document.getElementById('filterExportBtn');
        this.themeToggle = document.getElementById('themeToggle');
        this.startDate = document.getElementById('startDate');
        this.endDate = document.getElementById('endDate');

        // Set default date to today
        this.dateInput.valueAsDate = new Date();
    }

    setupEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.exportBtn.addEventListener('click', () => this.exportToCSV());
        this.filterExportBtn.addEventListener('click', () => this.exportFilteredData());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    handleSubmit(e) {
        e.preventDefault();
        const expense = {
            id: Date.now(),
            date: this.dateInput.value,
            item: this.itemInput.value,
            amount: parseFloat(this.amountInput.value)
        };

        this.expenses.push(expense);
        this.saveToLocalStorage();
        this.updateUI();
        this.form.reset();
        this.dateInput.valueAsDate = new Date();
    }

    saveToLocalStorage() {
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
    }

    updateUI() {
        this.updateSummary();
        this.renderExpensesList();
    }

    getMonthName(date) {
        return new Date(date).toLocaleString('default', { month: 'long' });
    }

    updateSummary() {
        const today = new Date().toISOString().split('T')[0];
        const todayTotal = this.calculateTotal(this.expenses.filter(exp => exp.date === today));
        
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekTotal = this.calculateTotal(this.expenses.filter(exp => 
            new Date(exp.date) >= weekStart));

        const monthStart = new Date();
        const currentMonth = this.getMonthName(monthStart);
        const monthTotal = this.calculateTotal(this.expenses.filter(exp => 
            new Date(exp.date).getMonth() === monthStart.getMonth() &&
            new Date(exp.date).getFullYear() === monthStart.getFullYear()));

        const overallTotal = this.calculateTotal(this.expenses);

        document.getElementById('todayTotal').textContent = `₹${todayTotal}`;
        document.getElementById('weekTotal').textContent = `₹${weekTotal}`;
        document.getElementById('monthTotal').textContent = `₹${monthTotal} (${currentMonth})`;
        document.getElementById('overallTotal').textContent = `₹${overallTotal}`;
    }

    calculateTotal(expenses) {
        return expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2);
    }

    groupExpensesByMonth(expenses) {
        const grouped = {};
        expenses.forEach(expense => {
            const date = new Date(expense.date);
            const monthYear = `${this.getMonthName(date)} ${date.getFullYear()}`;
            if (!grouped[monthYear]) {
                grouped[monthYear] = [];
            }
            grouped[monthYear].push(expense);
        });
        return grouped;
    }

    renderExpensesList() {
        this.expensesList.innerHTML = '';
        const sortedExpenses = [...this.expenses].sort((a, b) => 
            new Date(b.date) - new Date(a.date));
        
        const groupedExpenses = this.groupExpensesByMonth(sortedExpenses);

        Object.entries(groupedExpenses).forEach(([monthYear, expenses]) => {
            const monthSection = document.createElement('div');
            monthSection.className = 'month-section';
            
            const monthHeader = document.createElement('h3');
            monthHeader.className = 'month-header';
            monthHeader.textContent = monthYear;
            monthSection.appendChild(monthHeader);

            const monthTotal = this.calculateTotal(expenses);
            const totalElement = document.createElement('p');
            totalElement.className = 'month-total';
            totalElement.textContent = `Total: ₹${monthTotal}`;
            monthSection.appendChild(totalElement);

            expenses.forEach(expense => {
                const item = document.createElement('div');
                item.className = 'expense-item';
                item.innerHTML = `
                    <div class="expense-details">
                        <strong>${expense.date}</strong> - ${expense.item}: ₹${expense.amount}
                    </div>
                    <div class="expense-actions">
                        <button class="edit-btn" onclick="expenseTracker.editExpense(${expense.id})">Edit</button>
                        <button class="delete-btn" onclick="expenseTracker.deleteExpense(${expense.id})">Delete</button>
                    </div>
                `;
                monthSection.appendChild(item);
            });

            this.expensesList.appendChild(monthSection);
        });
    }

    editExpense(id) {
        const expense = this.expenses.find(exp => exp.id === id);
        if (expense) {
            this.dateInput.value = expense.date;
            this.itemInput.value = expense.item;
            this.amountInput.value = expense.amount;
            this.deleteExpense(id);
        }
    }

    deleteExpense(id) {
        this.expenses = this.expenses.filter(exp => exp.id !== id);
        this.saveToLocalStorage();
        this.updateUI();
    }

    exportToCSV() {
        this.downloadCSV(this.expenses);
    }

    exportFilteredData() {
        const start = new Date(this.startDate.value);
        const end = new Date(this.endDate.value);
        const filteredExpenses = this.expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= start && expDate <= end;
        });
        this.downloadCSV(filteredExpenses);
    }

    downloadCSV(expenses) {
        const headers = ['Date', 'Item Name', 'Amount'];
        const rows = expenses.map(exp => [exp.date, exp.item, exp.amount]);
        const csvContent = [headers, ...rows]
            .map(row => row.join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'expenses.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    loadTheme() {
        const isDark = localStorage.getItem('darkMode') === 'true';
        document.body.classList.toggle('dark-mode', isDark);
        this.themeToggle.textContent = isDark ? '☀️' : '🌙';
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark);
        this.themeToggle.textContent = isDark ? '☀️' : '🌙';
    }
}

const expenseTracker = new ExpenseTracker();