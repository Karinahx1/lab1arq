import { useState } from 'react';
import CustomerList from './components/CustomerList.jsx';
import CreateAccountForm from './components/CreateAccountForm.jsx';
import TransferFound from './components/TransferFound.jsx';
import TransactionHistory from './components/TransactionHistory.jsx';
import './css/App.css';

const VIEWS = [
  { id: 'customers', label: 'Clientes', Component: CustomerList },
  { id: 'new-account', label: 'Nueva cuenta', Component: CreateAccountForm },
  { id: 'transfer', label: 'Transferencia', Component: TransferFound },
  { id: 'history', label: 'Histórico', Component: TransactionHistory },
];

export default function App() {
  const [activeView, setActiveView] = useState(VIEWS[0].id);
  const { Component } = VIEWS.find((view) => view.id === activeView);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">U</span>
          <div className="brand-name">UdeA Bank</div>
        </div>
        <nav className="app-nav">
          {VIEWS.map((view) => (
            <button
              key={view.id}
              type="button"
              className={view.id === activeView ? 'active' : ''}
              onClick={() => setActiveView(view.id)}
            >
              {view.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        <Component />
      </main>
    </div>
  );
}
