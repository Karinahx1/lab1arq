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
          <span className="brand-mark">A</span>
          <div>
            <div className="brand-name">Aurelia Banco</div>
            <div className="brand-subtitle">Arquitectura de Software · Laboratorio 1</div>
          </div>
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

      <footer className="app-footer">
        Aurelia Banco · Proyecto académico UdeA · Datos de prueba únicamente
      </footer>
    </div>
  );
}
