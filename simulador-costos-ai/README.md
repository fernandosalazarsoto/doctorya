# Simulador TCO AI España

Aplicación web estática para simular el TCO de compra desde España comparando ChatGPT Business, Claude Team Standard y Claude Team Premium.

## Qué calcula

- Usuarios independientes por producto.
- Precios mensuales editables en USD.
- Tipo de cambio USD/EUR editable.
- IVA España y contingencia como porcentajes.
- Periodo de cálculo editable, con 12 meses por defecto.
- TCO sin IVA, TCO con IVA y desglose por producto.
- Total Claude Team separado de Claude Standard y Claude Premium.

## Comandos

```bash
npm run test
npm run build
```

El build queda en `dist/` y está configurado para Vercel mediante `vercel.json`.
