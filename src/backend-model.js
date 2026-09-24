export const CONFIG={MONEDA:"COP",IVA_PCT:0,ENVIO_GRATIS_DESDE:200000,COSTO_ENVIO:15000,RESERVA_MINUTOS:15,MAX_ITEM:10};

export const PRODUCTOS=[
  {producto_id:"P-001",franquicia:"Pokémon",set:"Base Set",nombre:"Alakazam",numero:"1/102",idioma:"EN",condicion:"NM",costo:100000,markup_pct:.35,precio_minimo:120000,activo:true},
  {producto_id:"P-002",franquicia:"Yu-Gi-Oh!",set:"LOB",nombre:"Blue-Eyes White Dragon",numero:"LOB-001",idioma:"EN",condicion:"NM",costo:150000,markup_pct:.30,precio_minimo:180000,activo:true}
];

export const MOVIMIENTOS=[
  {movimiento_id:"M-001",fecha:"2026-09-24",producto_id:"P-001",tipo:"ENTRADA",cantidad:5,referencia:"COMPRA-001",idempotency_key:"INV-001"},
  {movimiento_id:"M-002",fecha:"2026-09-24",producto_id:"P-002",tipo:"ENTRADA",cantidad:3,referencia:"COMPRA-001",idempotency_key:"INV-002"}
];

export const CLIENTE={cliente_id:"C-001",email:"cliente@example.com",nombre:"Cliente Demo",activo:true};