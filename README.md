# UdeA Bank — Laboratorio 1 de Arquitectura de Software

Aplicación bancaria con backend en Spring Boot (API REST + MySQL) y frontend en React.
Permite consultar clientes, crear cuentas, actualizar y eliminar clientes, transferir dinero entre cuentas y consultar el histórico de movimientos.

---

## Levantar el backend

Desde la raíz del proyecto:

**Windows**

```bash
./mvnw.cmd spring-boot:run
```

**Linux / macOS**

```bash
./mvnw spring-boot:run
```

El backend queda en **http://localhost:8088**.


## Levantar el frontend

En **otra terminal**, desde la raíz del proyecto:

```bash
cd frontend
```

```bash
npm install
```

```bash
npm run dev
```

El frontend queda disponible en **http://localhost:5173**. Ábrelo en el navegador con el backend ya corriendo.


