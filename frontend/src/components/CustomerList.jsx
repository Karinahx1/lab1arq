import { useEffect, useState } from 'react';
import { getCustomers } from '../api.js';
import { formatCOP } from '../format.js';

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadCustomers() {
    setLoading(true);
    setError('');
    try {
      const data = await getCustomers();
      setCustomers(data ?? []);
    } catch (err) {
      setError(err.message || 'No se pudo cargar la lista de clientes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  return (
    <>
      <div className="view-header">
        <div>
          <h2>Clientes</h2>
          <p>Todos los clientes registrados en Aurelia Banco y su saldo actual.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={loadCustomers} disabled={loading}>
          {loading && <span className="spinner spinner-muted" aria-hidden="true" />}
          {loading ? 'Actualizando…' : 'Recargar'}
        </button>
      </div>

      <section className="card">
        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading-line">
            <span className="spinner spinner-muted" aria-hidden="true" />
            Cargando clientes…
          </div>
        ) : customers.length === 0 ? (
          <div className="empty-state">
            Todavía no hay clientes registrados. Crea uno desde la pestaña «Nueva cuenta».
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Número de cuenta</th>
                  <th>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id ?? c.accountNumber}>
                    <td>{c.firstName} {c.lastName}</td>
                    <td className="mono">{c.accountNumber}</td>
                    <td className="amount">{formatCOP(c.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
