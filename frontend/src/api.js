const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error(
      `No se pudo conectar con el servidor (${API_BASE_URL}). Verifica que el backend esté ` +
        'corriendo y que tenga CORS habilitado para este origen.'
    );
  }

  const rawBody = await response.text();
  let parsedBody = null;
  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      parsedBody = rawBody;
    }
  }

  if (!response.ok) {
    const message =
      typeof parsedBody === 'string'
        ? parsedBody
        : parsedBody?.message || `Error ${response.status} al comunicarse con el servidor.`;
    throw new Error(message);
  }

  return parsedBody;
}

// LocalDateTime del backend no tiene zona horaria: se envía la hora local
// sin sufijo "Z" para que Jackson la deserialice tal cual, sin corrimientos.
export function nowAsLocalDateTime() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  );
}

export function getCustomers() {
  return request('/customers');
}

export function createCustomer(customer) {
  return request('/customers', {
    method: 'POST',
    body: JSON.stringify(customer),
  });
}

export function transferMoney(transfer) {
  return request('/transactions', {
    method: 'POST',
    body: JSON.stringify({ ...transfer, timestamp: nowAsLocalDateTime() }),
  });
}

export function getTransactionsByAccount(accountNumber) {
  return request(`/transactions/${encodeURIComponent(accountNumber)}`);
}
