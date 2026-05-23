# Simulador TCO AI España

Aplicación web estática para simular el TCO de compra desde España para Claude Team Standard y Claude Team Premium.

## Qué calcula

- Usuarios independientes por producto.
- Tarifas mensuales en USD capturadas desde fuentes oficiales.
- Facturación de licencias anual o mensual, con precios diferenciados por fuente.
- Tipo de cambio USD/EUR editable.
- IVA España y contingencia como porcentajes.
- Periodo de cálculo editable, con 12 meses por defecto.
- TCO sin IVA, TCO con IVA y desglose por producto.
- Vista mensual, anual o ambas en el resumen y detalle.
- Gráfico de participación por producto.
- Total Claude Team separado de Claude Standard y Claude Premium.

Las tarifas viven en `src/priceSources.js` con URL de fuente y fecha de captura. La interfaz no permite editar precios de licencia; solo permite editar usuarios y supuestos financieros.

## Comandos

```bash
npm run test
npm run build
```

El build queda en `dist/` y está configurado para Vercel mediante `vercel.json`.
