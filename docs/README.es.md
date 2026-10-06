# Catálogo de Placas - Geotrace

Este proyecto es un sistema de catalogación y gestión de placas micropaleontológicas desarrollado para el Servicio Geológico Colombiano (SGC). Construido con tecnologías modernas como React 18, TypeScript 5, Vite 7, y Supabase.

## Características Principales

- **Gestión de Roles**: Soporte para roles como Catalogador, Revisor, Curador y Administrador con permisos granulares.
- **Integración con Supabase**: Base de datos PostgreSQL con autenticación integrada.
- **Interfaz de Usuario**: Construida con Tailwind CSS y componentes Radix para una experiencia moderna.
- **Catálogos geológicos**: La interfaz de lectura muestra unidades litoestratigráficas, biozonas y edades mediante sus tablas normalizadas, en variantes reportada, normalizada y actualizada. Empresa, `dic_campo` y `dic_contrato` no tienen equivalente directo y permanecen no disponibles.
- **Despliegue**: En Cloudflare Pages con automatización via GitHub Actions.

## Notas para Colombia

- **Formatos de Fecha**: Utilice el formato dd/mm/yyyy para consistencia con estándares locales.
- **Zonas Horarias**: Considere la zona horaria UTC-5 (COT - Colombia Time) para timestamps y registros.
- **Normativas Locales**: Asegúrese de cumplir con las regulaciones del Servicio Geológico Colombiano para el manejo de muestras geológicas.

## Documentación Relacionada

- [Instalación Local](instalacion-local.es.md)
- [Despliegue en VM Ubuntu 24.04](despliegue-vm.es.md)
- [Despliegue en Cloudflare Pages](despliegue-cloudflare-pages.es.md)
- [Integración con Supabase](supabase-integracion.es.md)
- [Roles y Permisos](roles-y-permisos.es.md)
- [Base de Datos](base-de-datos.es.md)
- [Importación de Datos](importacion-datos.es.md)
- [Operación y Gotchas](operacion-y-gotchas.es.md)

## Inicio Rápido

Ver [Instalación Local](instalacion-local.es.md) para comenzar.
