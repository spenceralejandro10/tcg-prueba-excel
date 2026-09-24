# TCG Frontend — espejo exacto del backend Excel

Este repositorio implementará únicamente el frontend del sistema TCG.

## Regla de implementación

El backend funcional ya está definido en Google Sheets. Este repositorio **no debe inventar lógica de negocio nueva**.

Fuente de verdad:

- `00_CONTROL`
- `01_CONFIG`
- `02_PRODUCTOS`
- `03_INVENTARIO`
- `04_CLIENTES`
- `05_CARRITO`
- `06_RESERVAS`
- `07_ORDENES`
- `08_PAGOS`
- `09_ENVIOS`
- `10_EVENTOS`
- `11_TRAZABILIDAD`

Flujo exacto:

`02_PRODUCTOS.precio_venta → 05_CARRITO.precio_actual → 05_CARRITO.subtotal + 03_INVENTARIO/06_RESERVAS.stock → listo_checkout → 07_ORDENES.total → 08_PAGOS CAPTURADO → 07_ORDENES.estado_pago → 09_ENVIOS.puede_despachar`

La interfaz debe limitarse a representar y ejecutar ese flujo. No se permiten estados, reglas, cálculos ni campos adicionales salvo los necesarios para representar directamente los ya definidos en el Excel.
