import {CONFIG,PRODUCTOS,MOVIMIENTOS,CLIENTE} from "./backend-model.js";

const state={
  reservas:[],
  carrito:{carrito_id:"CAR-001",cliente_id:CLIENTE.cliente_id,estado:"ABIERTO",items:[]},
  orden:null,
  pagos:[],
  envio:null
};

export const precioVenta=p=>Math.round(Math.max(p.costo*(1+p.markup_pct),p.precio_minimo));

export const cantidadFirmada=m=>["ENTRADA","DEVOLUCION","AJUSTE+"].includes(m.tipo)?m.cantidad:-m.cantidad;

export const stockBruto=producto_id=>
  MOVIMIENTOS.filter(m=>m.producto_id===producto_id).reduce((a,m)=>a+cantidadFirmada(m),0);

export const reservaActiva=r=>r.estado==="ACTIVA"&&r.expira_en>Date.now();

export const stockDisponible=producto_id=>
  stockBruto(producto_id)-
  state.reservas
    .filter(r=>r.producto_id===producto_id&&reservaActiva(r))
    .reduce((a,r)=>a+r.cantidad,0);

export function agregarAlCarrito(producto_id,cantidad){
  const p=PRODUCTOS.find(x=>x.producto_id===producto_id);
  if(!p) throw new Error("FK_PRODUCTO");

  const stock=stockDisponible(producto_id);
  const cantidad_valida=cantidad>0&&cantidad<=stock&&cantidad<=CONFIG.MAX_ITEM;
  const fk_validas=CLIENTE.cliente_id===state.carrito.cliente_id&&!!p;
  const listo_checkout=state.carrito.estado==="ABIERTO"&&cantidad_valida&&fk_validas;

  if(!listo_checkout) throw new Error("CHECKOUT_BLOQUEADO");

  const precio_actual=precioVenta(p);
  const subtotal=cantidad*precio_actual;

  state.carrito.items=[{
    item_id:"CI-001",
    carrito_id:state.carrito.carrito_id,
    cliente_id:CLIENTE.cliente_id,
    estado:"ABIERTO",
    producto_id,
    cantidad,
    precio_actual,
    stock_disponible:stock,
    subtotal,
    cantidad_valida,
    fk_validas,
    listo_checkout
  }];

  const now=Date.now();
  state.reservas=[{
    reserva_id:"R-001",
    carrito_id:state.carrito.carrito_id,
    producto_id,
    cliente_id:CLIENTE.cliente_id,
    cantidad,
    creada_en:now,
    expira_en:now+CONFIG.RESERVA_MINUTOS*60000,
    estado:"ACTIVA",
    idempotency_key:"RES-001"
  }];

  return state.carrito.items[0];
}

export function crearOrden(){
  const item=state.carrito.items[0];
  if(!item?.listo_checkout) throw new Error("CHECKOUT_BLOQUEADO");

  const subtotal=state.carrito.items.reduce((a,i)=>a+i.subtotal,0);
  const descuento=0;
  const envio=subtotal-descuento>=CONFIG.ENVIO_GRATIS_DESDE?0:CONFIG.COSTO_ENVIO;
  const iva=Math.round((subtotal-descuento)*CONFIG.IVA_PCT);
  const total=subtotal-descuento+envio+iva;

  state.orden={
    orden_id:"O-001",
    cliente_id:CLIENTE.cliente_id,
    carrito_id:state.carrito.carrito_id,
    estado:"PENDIENTE_PAGO",
    creada_en:Date.now(),
    subtotal,
    descuento,
    envio,
    iva,
    total,
    pagado:0,
    saldo:total,
    estado_pago:"PENDIENTE",
    integridad:true
  };

  return state.orden;
}

export function registrarPagoPendiente(){
  if(!state.orden) throw new Error("ORDEN_INEXISTENTE");

  const pago={
    pago_id:"PAY-001",
    orden_id:state.orden.orden_id,
    proveedor:"DEMO",
    estado:"PENDIENTE",
    monto:state.orden.saldo,
    moneda:CONFIG.MONEDA,
    provider_ref:"",
    idempotency_key:"PAYKEY-001",
    saldo_antes:state.orden.saldo,
    saldo_despues:state.orden.saldo,
    integridad:true
  };

  state.pagos=[pago];
  return pago;
}

export function capturarPago(){
  if(!state.orden) throw new Error("ORDEN_INEXISTENTE");
  if(!state.pagos[0]) registrarPagoPendiente();

  const pago=state.pagos[0];
  pago.estado="CAPTURADO";
  pago.saldo_despues=Math.max(0,pago.saldo_antes-pago.monto);

  state.orden.pagado=state.pagos
    .filter(p=>p.orden_id===state.orden.orden_id&&p.estado==="CAPTURADO")
    .reduce((a,p)=>a+p.monto,0);

  state.orden.saldo=Math.max(0,state.orden.total-state.orden.pagado);
  state.orden.estado_pago=
    state.orden.pagado>=state.orden.total?"PAGADA":
    state.orden.pagado>0?"PARCIAL":"PENDIENTE";

  return pago;
}

export function crearEnvio(){
  if(!state.orden) throw new Error("ORDEN_INEXISTENTE");

  const puede_despachar=state.orden.estado_pago==="PAGADA";

  state.envio={
    envio_id:"ENV-001",
    orden_id:state.orden.orden_id,
    estado_orden:state.orden.estado_pago,
    estado_envio:"PENDIENTE",
    transportadora:"",
    guia:"",
    costo:state.orden.envio,
    puede_despachar,
    integridad:true
  };

  return state.envio;
}

export function snapshot(){
  return structuredClone(state);
}

export function eventos(){
  return [
    {
      evento_id:"E-001",
      entidad:"CARRITO",
      entidad_id:state.carrito.carrito_id,
      evento:"RESERVAR",
      origen:"05_CARRITO",
      destino:"06_RESERVAS",
      condicion:"05_CARRITO.listo_checkout=TRUE",
      resultado:state.carrito.items[0]?.listo_checkout?"PERMITIDO":"BLOQUEADO"
    },
    {
      evento_id:"E-002",
      entidad:"ORDEN",
      entidad_id:state.orden?.orden_id??"",
      evento:"PAGAR",
      origen:"07_ORDENES",
      destino:"08_PAGOS",
      condicion:"saldo>0",
      resultado:state.orden&&state.orden.saldo>0?"PERMITIDO":"BLOQUEADO"
    },
    {
      evento_id:"E-003",
      entidad:"ORDEN",
      entidad_id:state.orden?.orden_id??"",
      evento:"DESPACHAR",
      origen:"07_ORDENES",
      destino:"09_ENVIOS",
      condicion:"estado_pago=PAGADA",
      resultado:state.orden?.estado_pago==="PAGADA"?"PERMITIDO":"BLOQUEADO"
    }
  ];
}