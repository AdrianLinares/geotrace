# Importación de Datos

Cómo importar datos al sistema.

## Métodos de Importación

- Via interfaz web (para admins).
- Scripts SQL directos.

## Formato Soportado

- Libro Excel (`.xlsx` o `.xls`) con una hoja por cada tabla seleccionada.
- CSV no está soportado porque una importación puede incluir varias hojas y se procesa en una única transacción.

## Validaciones

- Solo un usuario con rol `Administrador` puede importar.
- Las tablas destino están limitadas a `coleccion`, `pozo`, `placa` y `muestra`.
- El límite global es de 1000 filas y 1 MB por solicitud; si una tabla falla, se revierte toda la solicitud.
- Las filas vacías (sin ningún campo con valor) se rechazan antes de insertar.
- Esta primera importación solo incluye las columnas ofrecidas por la plantilla. `fecha_revision` y cualquier campo no incluido quedan fuera y deben gestionarse por el flujo correspondiente.

## Notas para Colombia

- Considere formatos locales para coordenadas (grados decimales vs grados/minutos/segundos).
- Valide contra bases de datos del SGC.
