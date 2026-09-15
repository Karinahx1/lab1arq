import { useEffect, useState } from 'react';
import { getCustomers, getTransactionsByAccount } from '../api.js';
import { formatCOP, formatDateTime } from '../format.js';

function ArrowIcon({ direction }) {
  const d = direction === 'in' ? 'M12 4v13m0 0l-5-5m5 5l5-5' : 'M12 20V7m0 0l-5 5m5-5l5 5';
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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

  function counterpartyName(accountNumber) {
    const match = customers.find((c) => c.accountNumber === accountNumber);
    return match ? `${match.firstName} ${match.lastName}` : accountNumber;
  }

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

  const totalIn = transactions
    .filter((t) => t.receiverAccountNumber === selectedAccount)
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalOut = transactions
    .filter((t) => t.senderAccountNumber === selectedAccount)
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

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
          <>
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-label">Movimientos</div>
                <div className="summary-value mono">{transactions.length}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Total recibido</div>
                <div className="summary-value mono summary-value-in">{formatCOP(totalIn)}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Total enviado</div>
                <div className="summary-value mono summary-value-out">{formatCOP(totalOut)}</div>
              </div>
            </div>

            <div className="tx-list">
              {transactions.map((t) => {
                const isIncoming = t.receiverAccountNumber === selectedAccount;
                const counterpartyAccount = isIncoming ? t.senderAccountNumber : t.receiverAccountNumber;
                const hasTimestamp = Boolean(t.timestamp);
                const iconTone = !hasTimestamp ? 'neutral' : isIncoming ? 'in' : 'out';
                const amountTone = isIncoming ? 'in' : 'out';

                return (
                  <div className="tx-row" key={t.id}>
                    <div className={`tx-icon tx-icon-${iconTone}`}>
                      <ArrowIcon direction={isIncoming ? 'in' : 'out'} />
                    </div>
                    <div className="tx-main">
                      <div className="tx-desc">
                        {isIncoming ? `Recibido de ${counterpartyName(counterpartyAccount)}` : `Enviado a ${counterpartyName(counterpartyAccount)}`}
                      </div>
                      <div className="tx-meta">
                        <span className="mono">{counterpartyAccount}</span>
                        {' · '}
                        {hasTimestamp ? formatDateTime(t.timestamp) : 'fecha no registrada'}
                      </div>
                    </div>
                    <div className={`amount tx-amount amount-${amountTone}`}>
                      {isIncoming ? '+' : '−'}
                      {formatCOP(t.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </>
  );
}
