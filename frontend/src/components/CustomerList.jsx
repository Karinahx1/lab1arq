import { useEffect, useState } from 'react';
import { deleteCustomer, getCustomers, updateCustomer } from '../api.js';
import { formatCOP } from '../format.js';

const EMPTY_EDIT_FORM = {
  firstName: '',
  lastName: '',
  accountNumber: '',
  balance: '',
};

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

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

  function startEdit(customer) {
    setConfirmingDeleteId(null);
    setDeleteError('');
    setEditingId(customer.id);
    setEditError('');
    setEditForm({
      firstName: customer.firstName ?? '',
      lastName: customer.lastName ?? '',
      accountNumber: customer.accountNumber ?? '',
      balance: customer.balance ?? '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(EMPTY_EDIT_FORM);
    setEditError('');
  }

  function handleEditChange(field) {
    return (event) => setEditForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleEditSubmit(event) {
    event.preventDefault();
    setEditError('');

    const { firstName, lastName, accountNumber, balance } = editForm;
    if (!firstName.trim() || !lastName.trim() || !accountNumber.trim()) {
      setEditError('Nombres, apellidos y número de cuenta son obligatorios.');
      return;
    }
    if (balance === '' || balance === null) {
      setEditError('El saldo es obligatorio.');
      return;
    }
    const parsedBalance = Number(balance);
    if (Number.isNaN(parsedBalance) || parsedBalance < 0) {
      setEditError('El saldo debe ser un número mayor o igual a 0.');
      return;
    }

    setEditSubmitting(true);
    try {
      await updateCustomer(editingId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        accountNumber: accountNumber.trim(),
        balance: parsedBalance,
      });
      cancelEdit();
      loadCustomers();
    } catch (err) {
      setEditError(err.message || 'No se pudo actualizar el cliente.');
    } finally {
      setEditSubmitting(false);
    }
  }

  function askDelete(customer) {
    cancelEdit();
    setDeleteError('');
    setConfirmingDeleteId(customer.id);
  }

  async function confirmDelete(customer) {
    setDeleteError('');
    setDeletingId(customer.id);
    try {
      await deleteCustomer(customer.id);
      setConfirmingDeleteId(null);
      loadCustomers();
    } catch (err) {
      setDeleteError(err.message || 'No se pudo eliminar el cliente.');
    } finally {
      setDeletingId(null);
    }
  }

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

      {editingId !== null && (
        <section className="card">
          <h3 className="card-title">Editar cliente</h3>
          {editError && <div className="alert alert-error">{editError}</div>}
          <form onSubmit={handleEditSubmit}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="edit-firstName">Nombres</label>
                <input
                  id="edit-firstName"
                  type="text"
                  value={editForm.firstName}
                  onChange={handleEditChange('firstName')}
                />
              </div>
              <div className="field">
                <label htmlFor="edit-lastName">Apellidos</label>
                <input
                  id="edit-lastName"
                  type="text"
                  value={editForm.lastName}
                  onChange={handleEditChange('lastName')}
                />
              </div>
              <div className="field">
                <label htmlFor="edit-accountNumber">Número de cuenta</label>
                <input
                  id="edit-accountNumber"
                  type="text"
                  className="mono"
                  value={editForm.accountNumber}
                  onChange={handleEditChange('accountNumber')}
                />
              </div>
              <div className="field">
                <label htmlFor="edit-balance">Saldo (COP)</label>
                <input
                  id="edit-balance"
                  type="number"
                  min="0"
                  step="1000"
                  className="mono"
                  value={editForm.balance}
                  onChange={handleEditChange('balance')}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={cancelEdit} disabled={editSubmitting}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={editSubmitting}>
                {editSubmitting && <span className="spinner" aria-hidden="true" />}
                {editSubmitting ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="card">
        {error && <div className="alert alert-error">{error}</div>}
        {deleteError && <div className="alert alert-error">{deleteError}</div>}

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
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id ?? c.accountNumber}>
                    <td>{c.firstName} {c.lastName}</td>
                    <td className="mono">{c.accountNumber}</td>
                    <td className="amount">{formatCOP(c.balance)}</td>
                    <td>
                      {confirmingDeleteId === c.id ? (
                        <div className="row-actions">
                          <span className="field-hint">¿Eliminar a {c.firstName}?</span>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => confirmDelete(c)}
                            disabled={deletingId === c.id}
                          >
                            {deletingId === c.id && <span className="spinner" aria-hidden="true" />}
                            {deletingId === c.id ? 'Eliminando…' : 'Sí, eliminar'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setConfirmingDeleteId(null)}
                            disabled={deletingId === c.id}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="row-actions">
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEdit(c)}>
                            Editar
                          </button>
                          <button type="button" className="btn btn-danger-outline btn-sm" onClick={() => askDelete(c)}>
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
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
