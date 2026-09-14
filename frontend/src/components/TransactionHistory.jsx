import { useEffect, useState } from 'react';
import { getCustomers, getTransactionsByAccount } from '../api.js';
import { formatCOP, formatDateTime } from '../format.js';

export default function TransactionHistory() {
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState('');

  const [transactions, setTransactions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getCustomers();
        setCustomers(data ?? []);
      } catch {
        // El selector queda vacío; no bloquea la vista.
      } finally {
        setLoadingCustomers(false);
      }
    })();
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    if (!selectedAccount) {
      setError('Selecciona una cuenta para consultar su histórico.');
      return;
    }
    setError('');
    setLoadingHistory(true);
    setHasSearched(true);
    try {
      const data = await getTransactionsByAccount(selectedAccount);
      const sorted = [...(data ?? [])].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      setTransactions(sorted);
    } catch (err) {
      setError(err.message || 'No se pudo cargar el histórico de transacciones.');
      setTransactions([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  return (
    <>
      <div className="view-header">
        <div>
          <h2>Histórico</h2>
          <p>Elige una cuenta para ver sus movimientos, marcados como entrada o salida.</p>
        </div>
      </div>

      <section className="card">
        <form onSubmit={handleSearch}>
          <div className="toolbar">
            <div className="field">
              <label htmlFor="account">Cuenta</label>
              <select
                id="account"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
              >
                <option value="">Selecciona una cuenta</option>
                {customers.map((c) => (
                  <option key={c.id ?? c.accountNumber} value={c.accountNumber}>
                    {c.firstName} {c.lastName} · {c.accountNumber}
                  </option>
                ))}
              </select>
              {loadingCustomers && <span className="field-hint">Cargando cuentas…</span>}
            </div>
            <button type="submit" className="btn btn-primary" disabled={loadingHistory}>
              {loadingHistory && <span className="spinner" aria-hidden="true" />}
              {loadingHistory ? 'Consultando…' : 'Consultar'}
            </button>
          </div>
        </form>

        {error && <div className="alert alert-error">{error}</div>}

        {!hasSearched ? (
          <div className="empty-state">Selecciona una cuenta y presiona «Consultar» para ver su histórico.</div>
        ) : loadingHistory ? (
          <div className="loading-line">
            <span className="spinner spinner-muted" aria-hidden="true" />
            Cargando movimientos…
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">Esta cuenta todavía no tiene movimientos registrados.</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Contraparte</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => {
                  const isOutgoing = t.senderAccountNumber === selectedAccount;
                  const counterparty = isOutgoing ? t.receiverAccountNumber : t.senderAccountNumber;
                  return (
                    <tr key={t.id}>
                      <td>{formatDateTime(t.timestamp)}</td>
                      <td>
                        <span className={`badge ${isOutgoing ? 'badge-out' : 'badge-in'}`}>
                          {isOutgoing ? 'Salida' : 'Entrada'}
                        </span>
                      </td>
                      <td className="mono">{counterparty}</td>
                      <td className={`amount ${isOutgoing ? 'amount-out' : 'amount-in'}`}>
                        {isOutgoing ? '-' : '+'}
                        {formatCOP(t.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
