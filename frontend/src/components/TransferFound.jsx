import { useEffect, useState } from 'react';
import { getCustomers, transferMoney } from '../api.js';
import { formatCOP } from '../format.js';

const EMPTY_FORM = {
  senderAccountNumber: '',
  receiverAccountNumber: '',
  amount: '',
};

export default function TransferFound() {
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  async function loadCustomers() {
    setLoadingCustomers(true);
    try {
      const data = await getCustomers();
      setCustomers(data ?? []);
      return data ?? [];
    } catch {
      // El selector simplemente queda vacío; el usuario puede reintentar más tarde.
      return null;
    } finally {
      setLoadingCustomers(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess(null);

    const { senderAccountNumber, receiverAccountNumber, amount } = form;
    if (!senderAccountNumber || !receiverAccountNumber || amount === '') {
      setError('Selecciona la cuenta origen, la cuenta destino y el monto a transferir.');
      return;
    }
    if (senderAccountNumber === receiverAccountNumber) {
      setError('La cuenta origen y la cuenta destino no pueden ser la misma.');
      return;
    }
    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('El monto debe ser un número mayor que 0.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await transferMoney({
        senderAccountNumber,
        receiverAccountNumber,
        amount: parsedAmount,
      });
      const refreshed = await loadCustomers();
      const updatedSender = refreshed?.find((c) => c.accountNumber === result.senderAccountNumber);
      const updatedReceiver = refreshed?.find((c) => c.accountNumber === result.receiverAccountNumber);
      setSuccess({ ...result, updatedSender, updatedReceiver });
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.message || 'No se pudo realizar la transferencia.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="view-header">
        <div>
          <h2>Transferencia</h2>
          <p>Envía dinero entre cuentas de Aurelia Banco de forma inmediata.</p>
        </div>
      </div>

      <section className="card">
        {error && <div className="alert alert-error">{error}</div>}
        {success && (
          <div className="alert alert-success">
            Transferencia exitosa de <span className="mono">{formatCOP(success.amount)}</span> desde{' '}
            <span className="mono">{success.senderAccountNumber}</span> hacia{' '}
            <span className="mono">{success.receiverAccountNumber}</span>.
            {success.updatedSender && (
              <>
                {' '}Nuevo saldo origen: <span className="mono">{formatCOP(success.updatedSender.balance)}</span>.
              </>
            )}
            {success.updatedReceiver && (
              <>
                {' '}Nuevo saldo destino: <span className="mono">{formatCOP(success.updatedReceiver.balance)}</span>.
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="sender">Cuenta origen</label>
              <select
                id="sender"
                value={form.senderAccountNumber}
                onChange={handleChange('senderAccountNumber')}
              >
                <option value="">Selecciona una cuenta</option>
                {customers.map((c) => (
                  <option key={c.id ?? c.accountNumber} value={c.accountNumber}>
                    {c.firstName} {c.lastName} · {c.accountNumber} · {formatCOP(c.balance)}
                  </option>
                ))}
              </select>
              {loadingCustomers && <span className="field-hint">Cargando cuentas…</span>}
            </div>

            <div className="field">
              <label htmlFor="receiver">Cuenta destino</label>
              <select
                id="receiver"
                value={form.receiverAccountNumber}
                onChange={handleChange('receiverAccountNumber')}
              >
                <option value="">Selecciona una cuenta</option>
                {customers.map((c) => (
                  <option key={c.id ?? c.accountNumber} value={c.accountNumber}>
                    {c.firstName} {c.lastName} · {c.accountNumber}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="amount">Monto (COP)</label>
              <input
                id="amount"
                type="number"
                min="0"
                step="1000"
                className="mono"
                value={form.amount}
                onChange={handleChange('amount')}
                placeholder="Ej. 150000"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting && <span className="spinner" aria-hidden="true" />}
              {submitting ? 'Transfiriendo…' : 'Transferir'}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
