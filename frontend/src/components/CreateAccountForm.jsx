import { useState } from 'react';
import { createCustomer } from '../api.js';
import { useCurrencyInput } from '../useCurrencyInput.js';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  accountNumber: '',
  balance: '',
};

export default function CreateAccountForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  const balanceInput = useCurrencyInput(form.balance, (digits) =>
    setForm((prev) => ({ ...prev, balance: digits }))
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const { firstName, lastName, accountNumber, balance } = form;
    if (!firstName.trim() || !lastName.trim() || !accountNumber.trim()) {
      setError('Nombres, apellidos y número de cuenta son obligatorios.');
      return;
    }
    if (balance === '' || balance === null) {
      setError('El saldo inicial es obligatorio.');
      return;
    }
    const parsedBalance = Number(balance);
    if (Number.isNaN(parsedBalance) || parsedBalance < 0) {
      setError('El saldo inicial debe ser un número mayor o igual a 0.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await createCustomer({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        accountNumber: accountNumber.trim(),
        balance: parsedBalance,
      });
      setSuccess(`Cuenta creada para ${created.firstName} ${created.lastName} (${created.accountNumber}).`);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.message || 'No se pudo crear el cliente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="view-header">
        <div>
          <h2>Nueva cuenta</h2>
          <p>Registra un cliente nuevo con su saldo inicial.</p>
        </div>
      </div>

      <section className="card">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="firstName">Nombres</label>
              <input
                id="firstName"
                type="text"
                value={form.firstName}
                onChange={handleChange('firstName')}
                placeholder="Ej. Mariana"
              />
            </div>
            <div className="field">
              <label htmlFor="lastName">Apellidos</label>
              <input
                id="lastName"
                type="text"
                value={form.lastName}
                onChange={handleChange('lastName')}
                placeholder="Ej. Restrepo Gómez"
              />
            </div>
            <div className="field">
              <label htmlFor="accountNumber">Número de cuenta</label>
              <input
                id="accountNumber"
                type="text"
                className="mono"
                value={form.accountNumber}
                onChange={handleChange('accountNumber')}
                placeholder="Ej. 4021003345"
              />
            </div>
            <div className="field">
              <label htmlFor="balance">Saldo inicial (COP)</label>
              <div className="prefixed-input">
                <span className="prefixed-input-symbol">$</span>
                <input
                  id="balance"
                  ref={balanceInput.inputRef}
                  type="text"
                  inputMode="numeric"
                  className="mono"
                  value={balanceInput.displayValue}
                  onChange={balanceInput.handleChange}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting && <span className="spinner" aria-hidden="true" />}
              {submitting ? 'Creando…' : 'Crear cliente'}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
