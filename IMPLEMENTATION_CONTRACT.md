# Contrato estricto de implementación

## Objetivo
Construir el frontend del sistema TCG usando **exactamente** el backend funcional definido en el Google Sheet maestro. El frontend no redefine el negocio.

## Prohibiciones
- No crear nuevas reglas de negocio.
- No cambiar fórmulas.
- No agregar estados no presentes en el Excel.
- No agregar campos de negocio no presentes en el Excel.
- No inferir comportamientos faltantes.
- No convertir decisiones de UI en lógica de negocio.
- No recalcular en frontend lo que ya calcula el Excel.
- No permitir despacho cuando `09_ENVIOS.puede_despachar = FALSE`.
- No permitir checkout cuando `05_CARRITO.listo_checkout = FALSE`.

## Fórmulas y reglas que deben mantenerse literalmente

### 02_PRODUCTOS
- `precio_venta = ROUND(MAX(costo*(1+markup_pct);precio_minimo);0)`
- `margen_cop = precio_venta - costo`
- `margen_pct = margen_cop / precio_venta`
- `integridad = producto_id no vacío AND precio_venta >= precio_minimo AND costo >= 0`

### 03_INVENTARIO
- `cantidad_firmada = cantidad` para `ENTRADA|DEVOLUCION|AJUSTE+`; en los demás tipos es `-cantidad`.
- `stock_acumulado = SUMIFS(cantidad_firmada por producto hasta la fila actual)`
- `stock_disponible = SUM(movimientos firmados del producto) - SUM(reservas activas del producto)`

### 05_CARRITO
- `precio_actual = XLOOKUP(producto_id, 02_PRODUCTOS.producto_id, 02_PRODUCTOS.precio_venta)`
- `stock_disponible = inventario firmado - reservas activas`
- `subtotal = cantidad * precio_actual`
- `cantidad_valida = cantidad > 0 AND cantidad <= stock_disponible AND cantidad <= CONFIG.MAX_ITEM`
- `fk_validas = cliente existe AND producto existe`
- `listo_checkout = estado=ABIERTO AND cantidad_valida AND fk_validas`

### 06_RESERVAS
- `expira_en = creada_en + RESERVA_MINUTOS/1440`
- `activa = estado=ACTIVA AND expira_en > NOW()`
- `stock_antes = SUMIFS(03_INVENTARIO.cantidad_firmada por producto)`
- `stock_despues = stock_antes - SUMIFS(reservas activas del producto)`
- `integridad = carrito existe AND producto existe AND cantidad>0 AND stock_despues>=0 AND idempotency_key única`

### 07_ORDENES
- `subtotal = SUMIF(05_CARRITO.carrito_id, carrito_id, 05_CARRITO.subtotal)`
- `envio = 0 si subtotal-descuento >= ENVIO_GRATIS_DESDE; en otro caso COSTO_ENVIO`
- `iva = ROUND((subtotal-descuento)*IVA_PCT;0)`
- `total = subtotal-descuento+envio+iva`
- `pagado = SUMIFS(08_PAGOS.monto, orden_id, estado=CAPTURADO)`
- `saldo = MAX(0; total-pagado)`
- `estado_pago = PAGADA si pagado>=total; PARCIAL si pagado>0; en otro caso PENDIENTE`

### 08_PAGOS
- moneda viene de `CONFIG.MONEDA`
- `saldo_antes = XLOOKUP(orden_id, 07_ORDENES.orden_id, 07_ORDENES.saldo)`
- `saldo_despues = MAX(0; saldo_antes - monto)` solo si estado=CAPTURADO
- `integridad = orden existe AND monto>0 AND idempotency_key única`

### 09_ENVIOS
- `estado_orden = XLOOKUP(orden_id, 07_ORDENES.orden_id, 07_ORDENES.estado_pago)`
- `costo = XLOOKUP(orden_id, 07_ORDENES.orden_id, 07_ORDENES.envio)`
- `puede_despachar = estado_orden = PAGADA`

### 10_EVENTOS
- RESERVAR: permitido si `05_CARRITO.listo_checkout = TRUE`
- PAGAR: permitido si `07_ORDENES.saldo > 0`
- DESPACHAR: permitido si `07_ORDENES.estado_pago = PAGADA`

### 11_TRAZABILIDAD
Toda dependencia debe conservar su origen y destino:
- 02_PRODUCTOS → 05_CARRITO
- 03_INVENTARIO + 06_RESERVAS → 05_CARRITO
- 05_CARRITO → 07_ORDENES
- 01_CONFIG → 07_ORDENES
- 08_PAGOS → 07_ORDENES
- 07_ORDENES → 09_ENVIOS
- 05_CARRITO → 10_EVENTOS

## Regla final
Si una función, estado, cálculo o comportamiento no aparece aquí ni en el Excel maestro, **no se implementa**.
