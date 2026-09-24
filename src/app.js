import {PRODUCTOS,CONFIG} from "./backend-model.js";
import {precioVenta,stockDisponible,agregarAlCarrito,crearOrden,registrarPagoPendiente,capturarPago,crearEnvio,snapshot,eventos} from "./engine.js";

const money=n=>new Intl.NumberFormat("es-CO",{style:"currency",currency:CONFIG.MONEDA,maximumFractionDigits:0}).format(n);
const el=id=>document.getElementById(id);

function renderProductos(){
  el("product-grid").innerHTML=PRODUCTOS.map(p=>`
    <article class="card">
      <h3>${p.nombre}</h3>
      <p>${p.franquicia} · ${p.set} · ${p.numero}</p>
      <p>Condición: ${p.condicion} · Idioma: ${p.idioma}</p>
      <p><strong>${money(precioVenta(p))}</strong></p>
      <p>Stock disponible: ${stockDisponible(p.producto_id)}</p>
      <button data-producto="${p.producto_id}">Agregar 1</button>
    </article>`).join("");

  document.querySelectorAll("[data-producto]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      try{agregarAlCarrito(btn.dataset.producto,1);renderTodo();}
      catch(e){alert(e.message);}
    });
  });
}

function renderTodo(){
  const s=snapshot();
  const item=s.carrito.items[0];

  el("cart-state").innerHTML=item
    ? `<p>Producto: ${item.producto_id}</p>
       <p>Cantidad: ${item.cantidad}</p>
       <p>Precio actual: ${money(item.precio_actual)}</p>
       <p>Stock disponible: ${item.stock_disponible}</p>
       <p>Subtotal: ${money(item.subtotal)}</p>
       <p class="${item.listo_checkout?"ok":"blocked"}">listo_checkout = ${item.listo_checkout}</p>`
    : "<p>Carrito vacío.</p>";

  el("checkout-btn").disabled=!item?.listo_checkout;

  el("order-state").innerHTML=s.orden
    ? `<p>Orden: ${s.orden.orden_id}</p>
       <p>Subtotal: ${money(s.orden.subtotal)}</p>
       <p>Descuento: ${money(s.orden.descuento)}</p>
       <p>Envío: ${money(s.orden.envio)}</p>
       <p>IVA: ${money(s.orden.iva)}</p>
       <p><strong>Total: ${money(s.orden.total)}</strong></p>
       <p>Pagado: ${money(s.orden.pagado)}</p>
       <p>Saldo: ${money(s.orden.saldo)}</p>
       <p>Estado pago: ${s.orden.estado_pago}</p>`
    : "<p>Sin orden.</p>";

  const pago=s.pagos[0];
  el("payment-state").innerHTML=pago
    ? `<p>Pago: ${pago.pago_id}</p><p>Estado: ${pago.estado}</p><p>Monto: ${money(pago.monto)}</p><p>Saldo después: ${money(pago.saldo_despues)}</p>`
    : "<p>Sin pago.</p>";

  el("capture-payment-btn").disabled=!s.orden||s.orden.estado_pago==="PAGADA";

  const envio=s.envio;
  el("shipping-state").innerHTML=envio
    ? `<p>Envío: ${envio.envio_id}</p><p>Estado orden: ${envio.estado_orden}</p><p>Estado envío: ${envio.estado_envio}</p><p class="${envio.puede_despachar?"ok":"blocked"}">puede_despachar = ${envio.puede_despachar}</p>`
    : "<p>Sin envío.</p>";

  el("events-state").innerHTML=eventos().map(e=>`
    <div class="event"><strong>${e.evento}</strong><span>${e.origen} → ${e.destino}</span><span>${e.condicion}</span><span class="${e.resultado==="PERMITIDO"?"ok":"blocked"}">${e.resultado}</span></div>`).join("");
}

el("checkout-btn").addEventListener("click",()=>{
  try{
    crearOrden();
    registrarPagoPendiente();
    crearEnvio();
    renderTodo();
  }catch(e){alert(e.message);}
});

el("capture-payment-btn").addEventListener("click",()=>{
  try{
    capturarPago();
    crearEnvio();
    renderTodo();
  }catch(e){alert(e.message);}
});

renderProductos();
renderTodo();