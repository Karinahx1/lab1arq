import { useEffect, useRef, useState } from 'react';
import { getCustomers, transferMoney } from '../api.js';
import { formatCOP, formatThousands } from '../format.js';

const EMPTY_FORM = {
  senderAccountNumber: '',
  receiverAccountNumber: '',
  amount: '',
};

const EMPTY_FIELD_ERRORS = {
  sender: '',
  receiver: '',
  amount: '',
};

function mapBackendErrorToField(message) {
  if (!message) return null;
  if (message.includes('remitente') && message.includes('no existe')) return 'sender';
  if (message.includes('receptor') && message.includes('no existe')) return 'receiver';
  if (message.includes('insuficiente')) return 'sender';
  return null;
}

export default function TransferFound() {
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState(EMPTY_FIELD_ERRORS);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(null);

  const amountInputRef = useRef(null);
  const pendingCaretDigits = useRef(null);

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

  function handleSelectChange(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    };
  }

  function handleAmountChange(event) {
    const input = event.target;
    const caretPos = input.selectionStart ?? input.value.length;
    const digitsBeforeCaret = input.value.slice(0, caretPos).replace(/\D/g, '').length;
    const digits = input.value.replace(/\D/g, '');

    pendingCaretDigits.current = digitsBeforeCaret;
    setForm((prev) => ({ ...prev, amount: digits }));
    setFieldErrors((prev) => ({ ...prev, amount: '' }));
  }

  // Tras reformatear el monto con separadores de miles, el cursor vuelve a
  // colocarse después de la misma cantidad de dígitos que tenía antes de
  // reformatear (los puntos de miles no cuentan), en vez de saltar al final.
  useEffect(() => {
    if (pendingCaretDigits.current === null || !amountInputRef.current) return;
    const formatted = formatThousands(form.amount);
    const targetDigits = pendingCaretDigits.current;
    let digitsSeen = 0;
    let caretPos = formatted.length;
    if (targetDigits === 0) {
      caretPos = 0;
    } else {
      for (let i = 0; i < formatted.length; i += 1) {
        if (/\d/.test(formatted[i])) digitsSeen += 1;
        if (digitsSeen === targetDigits) {
          caretPos = i + 1;
          break;
        }
      }
    }
    amountInputRef.current.setSelectionRange(caretPos, caretPos);
    pendingCaretDigits.current = null;
  }, [form.amount]);

  const selectedSender = customers.find((c) => c.accountNumber === form.senderAccountNumber);

  async function handleSubmit(event) {
    event.preventDefault();
    setApiError('');
    setSuccess(null);

    const { senderAccountNumber, receiverAccountNumber, amount } = form;
    const nextFieldErrors = { ...EMPTY_FIELD_ERRORS };

    if (!senderAccountNumber) {
      nextFieldErrors.sender = 'Selecciona la cuenta origen.';
    }
    if (!receiverAccountNumber) {
      nextFieldErrors.receiver = 'Selecciona la cuenta destino.';
    } else if (senderAccountNumber && receiverAccountNumber === senderAccountNumber) {
      nextFieldErrors.receiver = 'Debe ser diferente a la cuenta origen.';
    }
    const parsedAmount = Number(amount || 0);
    if (!amount) {
      nextFieldErrors.amount = 'Ingresa el monto a transferir.';
    } else if (parsedAmount <= 0) {
      nextFieldErrors.amount = 'El monto debe ser mayor que 0.';
    }

    if (nextFieldErrors.sender || nextFieldErrors.receiver || nextFieldErrors.amount) {
      setFieldErrors(nextFieldErrors);
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
      const message = err.message || 'No se pudo realizar la transferencia.';
      const field = mapBackendErrorToField(message);
      if (field) {
        setFieldErrors((prev) => ({ ...prev, [field]: message }));
      } else {
        setApiError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="view-header">
        <div>
          <h2>Transferencia</h2>
          <p>Envía dinero entre cuentas de UdeA Bank de forma inmediata.</p>
        </div>
      </div>

      <section className="card">
        {apiError && <div className="alert alert-error">{apiError}</div>}
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
                onChange={handleSelectChange('senderAccountNumber')}
              >
                <option value="">Selecciona una cuenta</option>
                {customers.map((c) => (
                  <option key={c.id ?? c.accountNumber} value={c.accountNumber}>
                    {c.firstName} {c.lastName} · {c.accountNumber}
                  </option>
                ))}
              </select>
              {loadingCustomers && <span className="field-hint">Cargando cuentas…</span>}
              {!loadingCustomers && selectedSender && (
                <span className="field-hint">
                  Saldo disponible: <span className="mono">{formatCOP(selectedSender.balance)}</span>
                </span>
              )}
              {fieldErrors.sender && <span className="field-error">{fieldErrors.sender}</span>}
            </div>

            <div className="field">
              <label htmlFor="receiver">Cuenta destino</label>
              <select
                id="receiver"
                value={form.receiverAccountNumber}
                onChange={handleSelectChange('receiverAccountNumber')}
              >
                <option value="">Selecciona una cuenta</option>
                {customers.map((c) => (
                  <option key={c.id ?? c.accountNumber} value={c.accountNumber}>
                    {c.firstName} {c.lastName} · {c.accountNumber}
                  </option>
                ))}
              </select>
              {fieldErrors.receiver && <span className="field-error">{fieldErrors.receiver}</span>}
            </div>

            <div className="field">
              <label htmlFor="amount">Monto (COP)</label>
              <div className="prefixed-input">
                <span className="prefixed-input-symbol">$</span>
                <input
                  id="amount"
                  ref={amountInputRef}
                  type="text"
                  inputMode="numeric"
                  className="mono"
                  value={formatThousands(form.amount)}
                  onChange={handleAmountChange}
                  placeholder="0"
                />
              </div>
              {fieldErrors.amount && <span className="field-error">{fieldErrors.amount}</span>}
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
