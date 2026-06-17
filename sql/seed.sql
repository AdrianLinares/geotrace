-- Geotrace — Datos de referencia (seed) extraídos del archivo DEV
-- Origen: docs/CatalogacionPlacas_DEV_10_06_2026.xlsx
-- Este archivo fue generado automáticamente a partir de las hojas con datos limpios.
-- Se omite la carga de tablas de datos operativos (PLACA, MUESTRA, POZO, etc.)
-- porque el Excel contiene referencias sin resolver (#REF!) o IDs textuales.
-- Úsese este script después de ejecutar sql/schema.sql y sql/helpers.sql.

BEGIN;

-- ============================================================
-- Tablas sembradas desde el archivo DEV
-- ============================================================

-- CAT_PRECISION_ESPACIAL
INSERT INTO public.CAT_PRECISION_ESPACIAL (precision_espacial_id, nombre_precision_espacial, interpretacion_aproximada)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Exacta', '< 5 m')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PRECISION_ESPACIAL (precision_espacial_id, nombre_precision_espacial, interpretacion_aproximada)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Alta', '5–25 m')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PRECISION_ESPACIAL (precision_espacial_id, nombre_precision_espacial, interpretacion_aproximada)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Buena', '25–100 m')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PRECISION_ESPACIAL (precision_espacial_id, nombre_precision_espacial, interpretacion_aproximada)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Aproximada', '100–500 m')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PRECISION_ESPACIAL (precision_espacial_id, nombre_precision_espacial, interpretacion_aproximada)
    OVERRIDING SYSTEM VALUE VALUES (5, 'Baja', '500 m – 1 km')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PRECISION_ESPACIAL (precision_espacial_id, nombre_precision_espacial, interpretacion_aproximada)
    OVERRIDING SYSTEM VALUE VALUES (6, 'Muy baja', '> 1 km')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PRECISION_ESPACIAL (precision_espacial_id, nombre_precision_espacial, interpretacion_aproximada)
    OVERRIDING SYSTEM VALUE VALUES (7, 'Regional', 'solo ubicación regional/general')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PRECISION_ESPACIAL (precision_espacial_id, nombre_precision_espacial, interpretacion_aproximada)
    OVERRIDING SYSTEM VALUE VALUES (8, 'Desconocida', 'sin estimación')
    ON CONFLICT DO NOTHING;

-- CAT_RANGO_LITO
INSERT INTO public.CAT_RANGO_LITO (rango_lito_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Supergrupo')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_RANGO_LITO (rango_lito_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Grupo')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_RANGO_LITO (rango_lito_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Formación')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_RANGO_LITO (rango_lito_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Miembro')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_RANGO_LITO (rango_lito_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (5, 'Capa')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_RANGO_LITO (rango_lito_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (6, 'Complejo')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_RANGO_LITO (rango_lito_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (7, 'Secuencia')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_RANGO_LITO (rango_lito_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (8, 'Unidad informal')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_RANGO_LITO (rango_lito_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (9, 'Otro')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_RANGO_LITO (rango_lito_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (10, 'Desconocido')
    ON CONFLICT DO NOTHING;

-- CAT_CUENCA
INSERT INTO public.CAT_CUENCA (cuenca_id, nombre_cuenca, cuenca_abrev)
    OVERRIDING SYSTEM VALUE VALUES (1, 'AMAGA', 'AMA')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CUENCA (cuenca_id, nombre_cuenca, cuenca_abrev)
    OVERRIDING SYSTEM VALUE VALUES (2, 'AREA NO PROSPECTIVA', 'ANP')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CUENCA (cuenca_id, nombre_cuenca, cuenca_abrev)
    OVERRIDING SYSTEM VALUE VALUES (3, 'CAGUAN-PUTUMAYO', 'CAG-PUT')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CUENCA (cuenca_id, nombre_cuenca, cuenca_abrev)
    OVERRIDING SYSTEM VALUE VALUES (4, 'CATATUMBO', 'CAT')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CUENCA (cuenca_id, nombre_cuenca, cuenca_abrev)
    OVERRIDING SYSTEM VALUE VALUES (5, 'CAUCA-PATIA', 'CAU-PAT')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CUENCA (cuenca_id, nombre_cuenca, cuenca_abrev)
    OVERRIDING SYSTEM VALUE VALUES (6, 'CESAR-RANCHERIA', 'CES-RAN')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CUENCA (cuenca_id, nombre_cuenca, cuenca_abrev)
    OVERRIDING SYSTEM VALUE VALUES (7, 'CHOCO', 'CHO')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CUENCA (cuenca_id, nombre_cuenca, cuenca_abrev)
    OVERRIDING SYSTEM VALUE VALUES (8, 'COLOMBIA', 'COL')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CUENCA (cuenca_id, nombre_cuenca, cuenca_abrev)
    OVERRIDING SYSTEM VALUE VALUES (9, 'CORDILLERA-ORIENTAL', 'COR')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CUENCA (cuenca_id, nombre_cuenca, cuenca_abrev)
    OVERRIDING SYSTEM VALUE VALUES (10, 'EXTRANJERO', 'EXTR')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CUENCA (cuenca_id, nombre_cuenca, cuenca_abrev)
    OVERRIDING SYSTEM VALUE VALUES (11, 'GUAJIRA', 'GUA')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CUENCA (cuenca_id, nombre_cuenca, cuenca_abrev)
    OVERRIDING SYSTEM VALUE VALUES (12, 'GUAJIRA-OFFSHORE', 'GUA-OFF')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CUENCA (cuenca_id, nombre_cuenca, cuenca_abrev)
    OVERRIDING SYSTEM VALUE VALUES (13, 'LLANOS ORIENTALES', 'LLA')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CUENCA (cuenca_id, nombre_cuenca, cuenca_abrev)
    OVERRIDING SYSTEM VALUE VALUES (14, 'LOS CAYOS', 'CAY')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CUENCA (cuenca_id, nombre_cuenca, cuenca_abrev)
    OVERRIDING SYSTEM VALUE VALUES (15, 'SINU-OFFSHORE', 'SIN-OFF')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CUENCA (cuenca_id, nombre_cuenca, cuenca_abrev)
    OVERRIDING SYSTEM VALUE VALUES (16, 'SINU-SAN JACINTO', 'SIN-SJ')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CUENCA (cuenca_id, nombre_cuenca, cuenca_abrev)
    OVERRIDING SYSTEM VALUE VALUES (17, 'TUMACO', 'TUM')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CUENCA (cuenca_id, nombre_cuenca, cuenca_abrev)
    OVERRIDING SYSTEM VALUE VALUES (18, 'TUMACO OFFSHORE', 'TUM-OFF')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CUENCA (cuenca_id, nombre_cuenca, cuenca_abrev)
    OVERRIDING SYSTEM VALUE VALUES (19, 'URABA', 'URA')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CUENCA (cuenca_id, nombre_cuenca, cuenca_abrev)
    OVERRIDING SYSTEM VALUE VALUES (20, 'VALLE INFERIOR DEL MAGDALENA', 'VIM')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CUENCA (cuenca_id, nombre_cuenca, cuenca_abrev)
    OVERRIDING SYSTEM VALUE VALUES (21, 'VALLE MEDIO DEL MAGDALENA', 'VMM')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CUENCA (cuenca_id, nombre_cuenca, cuenca_abrev)
    OVERRIDING SYSTEM VALUE VALUES (22, 'VALLE SUPERIOR DEL MAGDALENA', 'VSM')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CUENCA (cuenca_id, nombre_cuenca, cuenca_abrev)
    OVERRIDING SYSTEM VALUE VALUES (23, 'VAUPES-AMAZONAS', 'VAU-AMAZ')
    ON CONFLICT DO NOTHING;

-- CAT_ACETATO_ESTADO
INSERT INTO public.CAT_ACETATO_ESTADO (acetato_estado_id, acetato_estado, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Intacto', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ACETATO_ESTADO (acetato_estado_id, acetato_estado, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Corrido', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ACETATO_ESTADO (acetato_estado_id, acetato_estado, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Ausente', NULL)
    ON CONFLICT DO NOTHING;

-- CAT_MATERIAL_PLACA
INSERT INTO public.CAT_MATERIAL_PLACA (material_placa_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Cartón')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MATERIAL_PLACA (material_placa_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Plástico')
    ON CONFLICT DO NOTHING;

-- CAT_COLECCION
INSERT INTO public.CAT_COLECCION (coleccion_id, codigo_coleccion, nombre_coleccion, institucion, responsable_coleccion, descripcion, estado_coleccion)
    OVERRIDING SYSTEM VALUE VALUES (1, 'COL-HDC', 'Colección Personal Hermann Duque Caro', 'SGC', 'Grupo de Bioestratigrafía - Dirección de Geociencias Básicas', 'Placas donadas por la Sra. Bertha Nope Viuda de Duque al SGC, DGB en noviembre de 2018', 'Cerrada')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_COLECCION (coleccion_id, codigo_coleccion, nombre_coleccion, institucion, responsable_coleccion, descripcion, estado_coleccion)
    OVERRIDING SYSTEM VALUE VALUES (2, 'COL-MUSEO', 'Colección Museo Geológico José Royo y Gómez', 'SGC', 'Grupo de Bioestratigrafía - Dirección de Geociencias Básicas', 'Placas que se encontraban en el Museo Geológico Nacional José Royo y Gómez. Colección histórica del Servicio Geológico Nacional (=Ingeominas, =SGC). La colección pasó a la custodia del Grupo de Bioestratigrafía-DGB en marzo de 2022', 'Cerrada')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_COLECCION (coleccion_id, codigo_coleccion, nombre_coleccion, institucion, responsable_coleccion, descripcion, estado_coleccion)
    OVERRIDING SYSTEM VALUE VALUES (3, 'COL-LITOTECA', 'Colección Litoteca Nacional Guatiguará', 'SGC', 'Grupo de Bioestratigrafía - Dirección de Geociencias Básicas', 'Placas que se encontraban en la Litoteca Nacional-Guatiguará (SGC, sede Santander). El material corresponde principalmente a muestras de la industria petrolera. Pasó a la custodia del Grupo de Bioestratigrafía-DGB en diciembre de 2025', 'Activa')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_COLECCION (coleccion_id, codigo_coleccion, nombre_coleccion, institucion, responsable_coleccion, descripcion, estado_coleccion)
    OVERRIDING SYSTEM VALUE VALUES (4, 'COL-GRUPO_BIO', 'Colección Grupo Bioestratigrafía DGB', 'SGC', 'Grupo de Bioestratigrafía - Dirección de Geociencias Básicas', 'Placas que se generan a partir de los proyectos de investigación a partir del año 2024', 'Activa')
    ON CONFLICT DO NOTHING;

-- CAT_CLASE_PLACA
INSERT INTO public.CAT_CLASE_PLACA (clase_placa_id, codigo_clase, nombre, definicion)
    OVERRIDING SYSTEM VALUE VALUES (1, NULL, 'Asociación', 'Placa con asociación natural o multiespecífica de microfósiles')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CLASE_PLACA (clase_placa_id, codigo_clase, nombre, definicion)
    OVERRIDING SYSTEM VALUE VALUES (2, NULL, 'Tipo', 'Placa con ejemplares seleccionados de referencia taxonómica')
    ON CONFLICT DO NOTHING;

-- CAT_PRIORIDAD_INTERVENCION
INSERT INTO public.CAT_PRIORIDAD_INTERVENCION (prioridad_intervencion_id, nombre, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Baja', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PRIORIDAD_INTERVENCION (prioridad_intervencion_id, nombre, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Media', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PRIORIDAD_INTERVENCION (prioridad_intervencion_id, nombre, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Alta', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PRIORIDAD_INTERVENCION (prioridad_intervencion_id, nombre, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Crítica', NULL)
    ON CONFLICT DO NOTHING;

-- CAT_UNIDAD_MEDIDA
INSERT INTO public.CAT_UNIDAD_MEDIDA (unidad_medida_id, unidad)
    OVERRIDING SYSTEM VALUE VALUES (1, 'pies')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_UNIDAD_MEDIDA (unidad_medida_id, unidad)
    OVERRIDING SYSTEM VALUE VALUES (2, 'metro')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_UNIDAD_MEDIDA (unidad_medida_id, unidad)
    OVERRIDING SYSTEM VALUE VALUES (3, 'centimetro')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_UNIDAD_MEDIDA (unidad_medida_id, unidad)
    OVERRIDING SYSTEM VALUE VALUES (4, 'brazas')
    ON CONFLICT DO NOTHING;

-- CAT_VIDRIO_ESTADO
INSERT INTO public.CAT_VIDRIO_ESTADO (vidrio_estado_id, vidrio_estado, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Intacto', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_VIDRIO_ESTADO (vidrio_estado_id, vidrio_estado, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Roto', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_VIDRIO_ESTADO (vidrio_estado_id, vidrio_estado, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Ausente', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_VIDRIO_ESTADO (vidrio_estado_id, vidrio_estado, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Restos de caucho cristalizado', NULL)
    ON CONFLICT DO NOTHING;

-- CAT_RECOBRO_CUALITATIVO
INSERT INTO public.CAT_RECOBRO_CUALITATIVO (recobro_cualitativo_id, recobro_cualitativo, orden_visual)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Escaso (<10%)', 1)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_RECOBRO_CUALITATIVO (recobro_cualitativo_id, recobro_cualitativo, orden_visual)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Moderado (10-40%)', 2)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_RECOBRO_CUALITATIVO (recobro_cualitativo_id, recobro_cualitativo, orden_visual)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Abundante (40-75%)', 3)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_RECOBRO_CUALITATIVO (recobro_cualitativo_id, recobro_cualitativo, orden_visual)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Muy abundante (>75%)', 4)
    ON CONFLICT DO NOTHING;

-- CAT_TIPO_RELACION_DOCUMENTO
INSERT INTO public.CAT_TIPO_RELACION_DOCUMENTO (tipo_relacion_documento_id, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Anexo de', 'Documento complementario')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_RELACION_DOCUMENTO (tipo_relacion_documento_id, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Versión de', 'Otra versión del mismo documento')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_RELACION_DOCUMENTO (tipo_relacion_documento_id, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Digitalización de', 'Copia digital de documento físico')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_RELACION_DOCUMENTO (tipo_relacion_documento_id, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Derivado de', 'Producto generado desde otro')
    ON CONFLICT DO NOTHING;

-- CAT_VIA_NORM
INSERT INTO public.CAT_VIA_NORM (via_norm_id, nombre_normalizado, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (1, 'El Carmen - Zambrano', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_VIA_NORM (via_norm_id, nombre_normalizado, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (2, 'El Carmen - San Jacinto', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_VIA_NORM (via_norm_id, nombre_normalizado, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Chalán - Ovejas', NULL)
    ON CONFLICT DO NOTHING;

-- PERSONA
INSERT INTO public.PERSONA (persona_id, codigo_persona, nombre, apellidos, correo, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (1, 'DML', 'Danixa Maribel', 'López Cuevas', 'persona_1@seed.local', NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.PERSONA (persona_id, codigo_persona, nombre, apellidos, correo, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (2, 'GGO', 'Georgina', 'Guzmán Ospitia', 'persona_2@seed.local', NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.PERSONA (persona_id, codigo_persona, nombre, apellidos, correo, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (3, 'ASD', 'Marlon Alejandro', 'Suárez Díaz', 'persona_3@seed.local', NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.PERSONA (persona_id, codigo_persona, nombre, apellidos, correo, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (4, 'ADV', 'Brayan Alejandro', 'Díaz Vásquez', 'persona_4@seed.local', NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.PERSONA (persona_id, codigo_persona, nombre, apellidos, correo, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (5, 'JSD', 'Jefferson Steven', 'Díaz Villamizar', 'persona_5@seed.local', NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.PERSONA (persona_id, codigo_persona, nombre, apellidos, correo, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (6, 'ALM', 'Adrián', 'Linares Murcia', 'persona_6@seed.local', NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.PERSONA (persona_id, codigo_persona, nombre, apellidos, correo, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (7, 'DEV', 'Diana', 'Espitia Vanegas', 'persona_7@seed.local', NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.PERSONA (persona_id, codigo_persona, nombre, apellidos, correo, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (8, 'JDF', 'Jairo Alexander', 'Duarte Forero', 'persona_8@seed.local', NULL, NULL)
    ON CONFLICT DO NOTHING;

-- CAT_ROL
INSERT INTO public.CAT_ROL (rol_id, nombre, funcion, nivel_responsabilidad, actividades)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Catalogador científico', 'Registro sistemático, descripción detallada y transcripción estructurada de información histórica, física y científica asociada a las colecciones micropaleontológicas', 'Operativo', 'Descripción detallada de placas micropaleontológicas; Observación y registro sistemático de características físicas del material; Transcripción estructurada de anotaciones manuscritas; Registro de disposición y distribución del material en cavidades; Registro de estado de preservación y conservación observable; Registro de ubicación física dentro de colecciones; Registro de información asociada a muestras y procedencia; Identificación y registro de elementos taxonómicos reportados; Ingreso controlado de datos en tablas HIST_; Aplicación de protocolos de catalogación; Verificación básica de consistencia en el ingreso de datos')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ROL (rol_id, nombre, funcion, nivel_responsabilidad, actividades)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Revisor científico', 'Validación científica y control de calidad del diligenciamiento. Micropaleontólogo responsable de evaluar, corregir, homologar o actualizar la información según conocimiento experto.', 'Científico', 'Revisión taxonómica; Validación bioestratigráfica; Revisión de información geográfica; Revisión de consistencia estratigráfica; Normalización nomenclatural; Alimentación de tablas DIC_; Control de calidad científico; Validación de transcripciones históricas; Revisión de relaciones taxonómicas y estratigráficas')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ROL (rol_id, nombre, funcion, nivel_responsabilidad, actividades)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Diseñador de arquitectura de datos científicos', 'Diseño conceptual, estructural y funcional de la arquitectura de datos científicos y de conservación del sistema, incluyendo su implementación preliminar y validación operativa en Microsoft Access.', 'ArquitecturaDatos', 'Diseño de arquitectura relacional; Definición de módulos; Definición de tablas y campos; Definición de relaciones entre tablas; Diseño de estructuras taxonómicas y estratigráficas; Definición de estándares de nomenclatura; Diseño de protocolos de catalogación; Definición de secuencias de ingreso y validación de datos; Definición estructural de datos científicos; Atomización y estructuración de información científica; Transformación de texto libre en datos consultables; Diseño de listas desplegables y controles de validación; Estandarización de ingreso de datos; Prevención de errores de digitalización; Definición de criterios de trazabilidad; Definición de nomenclaturas documentales y estructuras de almacenamiento digital; Implementación preliminar de arquitectura relacional en Microsoft Access; Diseño funcional de formularios y controles de ingreso de datos; Implementación de listas desplegables y validaciones preliminares; Pruebas funcionales de experiencia de usuario científico (UX científico); Validación conceptual de relaciones entre tablas; Actualización de arquitectura del sistema')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ROL (rol_id, nombre, funcion, nivel_responsabilidad, actividades)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Desarrollador Plataforma GeoTrace', 'Implementación técnica, automatización y desarrollo funcional de la plataforma y herramientas asociadas', 'Técnico', 'Implementación de tablas y relaciones; Desarrollo en GeoTrace; Desarrollo de formularios; Desarrollo de consultas; Desarrollo de consultas complejas; Configuración de integridad referencial; Automatización de procesos; Implementación de controles de validación; Importación masiva de datos; Verificación de integridad de datos importados; Validación de correspondencia entre datos y campos; Desarrollo de campos calculados; Generación de métricas automáticas; Integración funcional entre módulos de la plataforma; Integración y configuración del geovisor; Integración de tablas espaciales; Desarrollo de visualizaciones geográficas; Generación de estadísticas automáticas; Optimización de rendimiento; Implementación de seguridad técnica; Mantenimiento técnico del sistema')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ROL (rol_id, nombre, funcion, nivel_responsabilidad, actividades)
    OVERRIDING SYSTEM VALUE VALUES (5, 'Administrador del sistema', 'Administración técnica, seguridad y control operativo del sistema', 'Administrativo', 'Administración de usuarios; Control de permisos; Gestión de respaldos; Control de versiones; Supervisión de seguridad; Mantenimiento de integridad operativa; Monitoreo del sistema; Gestión de recuperación de datos; Administración de accesos; Supervisión de almacenamiento y respaldo')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ROL (rol_id, nombre, funcion, nivel_responsabilidad, actividades)
    OVERRIDING SYSTEM VALUE VALUES (6, 'Revisor espacial', 'Validación y gestión de información geográfica y espacial', 'Geoespacial', 'Georreferenciación de localidades; Validación de coordenadas; Conversión de sistemas de coordenadas; Verificación de datum y proyecciones; Digitalización de mapas; Integración cartográfica; Control de precisión espacial; Apoyo cartográfico para geovisor')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ROL (rol_id, nombre, funcion, nivel_responsabilidad, actividades)
    OVERRIDING SYSTEM VALUE VALUES (7, 'Gestor Archivo Visual', 'Digitalización, organización y gestión técnica de archivos visuales históricos asociados a las colecciones micropaleontológicas.', 'Visual', 'Digitalización de diapositivas y fotografías históricas; Organización jerárquica de archivos visuales; Aplicación de nomenclatura normalizada para archivos digitales; Registro de información técnica de imágenes digitalizadas; Control de resolución y formatos de imagen; Registro de edición y procesamiento digital; Organización de carpetas visuales; Verificación básica de calidad de imágenes digitalizadas; Gestión de almacenamiento de archivos visuales; Vinculación inicial de archivos visuales con registros de la base de datos')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ROL (rol_id, nombre, funcion, nivel_responsabilidad, actividades)
    OVERRIDING SYSTEM VALUE VALUES (8, 'Gestor Documental', 'Digitalización, organización, conservación básica y gestión estructurada de documentación técnica, científica e histórica asociada a las colecciones', 'Documental', 'Digitalización de documentos técnicos e históricos; Organización jerárquica de archivos documentales; Aplicación de nomenclatura normalizada para archivos digitales; Organización de carpetas digitales por pozo y proyecto; Verificación básica de calidad de documentos digitalizados; Gestión de almacenamiento documental; Organización de mapas, informes y documentación administrativa digitalizada; Evaluación básica del estado físico de documentos; Conservación preventiva de documentación histórica; Restauración básica de documentos deteriorados; Estabilización de pliegues y rasgaduras antes de digitalización; Manejo cuidadoso de documentación frágil')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ROL (rol_id, nombre, funcion, nivel_responsabilidad, actividades)
    OVERRIDING SYSTEM VALUE VALUES (9, 'Revisor Técnico Documental', 'Revisión e interpretación de información geológica, geográfica y estratigráfica contenida en documentos para su integración y vinculación con las colecciones y registros de la base de datos.', 'Científico', 'Revisión de contenido geológico y estratigráfico de documentos; Identificación de información geográfica relevante; Vinculación documental con placas y muestras; Correlación entre documentos y registros históricos; Validación de referencias geológicas y espaciales; Identificación de pozos, localidades y unidades estratigráficas; Integración de información documental en la base de datos; Verificación de consistencia entre documentos y registros catalogados; Apoyo en reconstrucción histórica de información científica')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ROL (rol_id, nombre, funcion, nivel_responsabilidad, actividades)
    OVERRIDING SYSTEM VALUE VALUES (10, 'Curador de colección micropaleontológica', 'Conservación, preservación e intervención física del material micropaleontológico', 'Conservación', 'Evaluación de conservación física; Reemplazo de placas deterioradas; Cambio de portaobjetos; Limpieza y estabilización de material; Manejo de material frágil; Conservación preventiva; Intervención conservación; Transferencia de material micropaleontológico; Control de condiciones físicas de almacenamiento; Supervisión de manipulación de colecciones')
    ON CONFLICT DO NOTHING;

-- CAT_TRATAMIENTO_MUESTRA
INSERT INTO public.CAT_TRATAMIENTO_MUESTRA (tratamiento_muestra_id, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (1, 'H2O', 'Lavado con agua')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TRATAMIENTO_MUESTRA (tratamiento_muestra_id, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Top', 'Lavado con detergente suave Top')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TRATAMIENTO_MUESTRA (tratamiento_muestra_id, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (3, 'H2O + Top', 'Lavado con agua y detergente Top')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TRATAMIENTO_MUESTRA (tratamiento_muestra_id, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (4, 'HCl', 'Tratamiento ácido clorhídrico')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TRATAMIENTO_MUESTRA (tratamiento_muestra_id, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (5, 'HF', 'Tratamiento ácido fluorhídrico')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TRATAMIENTO_MUESTRA (tratamiento_muestra_id, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (6, 'Tamizado', 'Separación granulométrica')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TRATAMIENTO_MUESTRA (tratamiento_muestra_id, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (7, 'Otro', 'Otro procedimiento')
    ON CONFLICT DO NOTHING;

-- REL_PERSONA_ROL
INSERT INTO public.REL_PERSONA_ROL (rel_persona_rol_id, persona_id, codigo_persona, rol_id, fecha_inicio, fecha_fin, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (1, 1, 'DML', 1, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.REL_PERSONA_ROL (rel_persona_rol_id, persona_id, codigo_persona, rol_id, fecha_inicio, fecha_fin, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (2, 2, 'GGO', 1, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.REL_PERSONA_ROL (rel_persona_rol_id, persona_id, codigo_persona, rol_id, fecha_inicio, fecha_fin, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (3, 2, 'GGO', 9, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.REL_PERSONA_ROL (rel_persona_rol_id, persona_id, codigo_persona, rol_id, fecha_inicio, fecha_fin, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (4, 3, 'ASD', 1, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.REL_PERSONA_ROL (rel_persona_rol_id, persona_id, codigo_persona, rol_id, fecha_inicio, fecha_fin, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (5, 3, 'ASD', 7, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.REL_PERSONA_ROL (rel_persona_rol_id, persona_id, codigo_persona, rol_id, fecha_inicio, fecha_fin, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (6, 4, 'ADV', 1, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.REL_PERSONA_ROL (rel_persona_rol_id, persona_id, codigo_persona, rol_id, fecha_inicio, fecha_fin, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (7, 5, 'JSD', 1, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.REL_PERSONA_ROL (rel_persona_rol_id, persona_id, codigo_persona, rol_id, fecha_inicio, fecha_fin, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (8, 5, 'JSD', 6, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.REL_PERSONA_ROL (rel_persona_rol_id, persona_id, codigo_persona, rol_id, fecha_inicio, fecha_fin, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (9, 6, 'ALM', 4, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.REL_PERSONA_ROL (rel_persona_rol_id, persona_id, codigo_persona, rol_id, fecha_inicio, fecha_fin, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (10, 6, 'ALM', 5, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.REL_PERSONA_ROL (rel_persona_rol_id, persona_id, codigo_persona, rol_id, fecha_inicio, fecha_fin, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (11, 6, 'ALM', 6, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.REL_PERSONA_ROL (rel_persona_rol_id, persona_id, codigo_persona, rol_id, fecha_inicio, fecha_fin, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (12, 7, 'DEV', 2, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.REL_PERSONA_ROL (rel_persona_rol_id, persona_id, codigo_persona, rol_id, fecha_inicio, fecha_fin, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (13, 7, 'DEV', 3, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.REL_PERSONA_ROL (rel_persona_rol_id, persona_id, codigo_persona, rol_id, fecha_inicio, fecha_fin, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (14, 7, 'DEV', 9, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.REL_PERSONA_ROL (rel_persona_rol_id, persona_id, codigo_persona, rol_id, fecha_inicio, fecha_fin, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (15, 7, 'DEV', 10, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.REL_PERSONA_ROL (rel_persona_rol_id, persona_id, codigo_persona, rol_id, fecha_inicio, fecha_fin, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (16, 8, 'JDF', 2, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.REL_PERSONA_ROL (rel_persona_rol_id, persona_id, codigo_persona, rol_id, fecha_inicio, fecha_fin, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (17, 8, 'JDF', 9, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.REL_PERSONA_ROL (rel_persona_rol_id, persona_id, codigo_persona, rol_id, fecha_inicio, fecha_fin, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (18, 8, 'JDF', 10, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;

-- CAT_COLOR_PLACA
INSERT INTO public.CAT_COLOR_PLACA (color_placa_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Blanco')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_COLOR_PLACA (color_placa_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Negro')
    ON CONFLICT DO NOTHING;

-- CAT_FORMATO_DOCUMENTO
INSERT INTO public.CAT_FORMATO_DOCUMENTO (formato_documento_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Original')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_FORMATO_DOCUMENTO (formato_documento_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Fotocopia')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_FORMATO_DOCUMENTO (formato_documento_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (3, 'PDF')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_FORMATO_DOCUMENTO (formato_documento_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Manuscrito')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_FORMATO_DOCUMENTO (formato_documento_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (5, 'Escaneado')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_FORMATO_DOCUMENTO (formato_documento_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (6, 'Imagen')
    ON CONFLICT DO NOTHING;

-- CAT_ROL_AUTOR
INSERT INTO public.CAT_ROL_AUTOR (rol_autor_id, codigo_rol_autor, nombre, descripcion, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (1, 'AUT-IDENT', 'Identificador', 'Realizó identificación taxonómica o bioestratigráfica', true, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ROL_AUTOR (rol_autor_id, codigo_rol_autor, nombre, descripcion, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (2, 'AUT-TEC', 'Autor técnico', 'Autor del contenido científico del documento', false, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ROL_AUTOR (rol_autor_id, codigo_rol_autor, nombre, descripcion, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (3, 'AUT-INST', 'Autor institucional', 'Entidad responsable del documento', NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ROL_AUTOR (rol_autor_id, codigo_rol_autor, nombre, descripcion, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (4, 'COAUT', 'Coautor', 'Participante en la elaboración del documento', NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ROL_AUTOR (rol_autor_id, codigo_rol_autor, nombre, descripcion, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (5, 'REV', 'Revisor', 'Persona que revisó información científica', NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ROL_AUTOR (rol_autor_id, codigo_rol_autor, nombre, descripcion, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (6, 'COMP', 'Compilador', 'Persona que recopiló información existente', NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ROL_AUTOR (rol_autor_id, codigo_rol_autor, nombre, descripcion, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (7, 'DIG', 'Digitalizador', 'Persona que transformó información física a digital', NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ROL_AUTOR (rol_autor_id, codigo_rol_autor, nombre, descripcion, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (8, 'DESC', 'Desconocido', 'Autor no identificado en la fuente original', NULL, NULL)
    ON CONFLICT DO NOTHING;

-- CAT_TIPO_PUNTO_MUESTREO
INSERT INTO public.CAT_TIPO_PUNTO_MUESTREO (tipo_punto_muestreo_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Afloramiento')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_PUNTO_MUESTREO (tipo_punto_muestreo_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Pozo somero')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_PUNTO_MUESTREO (tipo_punto_muestreo_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Cantera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_PUNTO_MUESTREO (tipo_punto_muestreo_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Quebrada')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_PUNTO_MUESTREO (tipo_punto_muestreo_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (5, 'Carretera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_PUNTO_MUESTREO (tipo_punto_muestreo_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (6, 'Río')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_PUNTO_MUESTREO (tipo_punto_muestreo_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (7, 'Otro')
    ON CONFLICT DO NOTHING;

-- CAT_POLIGONAL
INSERT INTO public.CAT_POLIGONAL (poligonal_id, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (1, 'HD-5B', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_POLIGONAL (poligonal_id, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (2, 'HD-15', NULL)
    ON CONFLICT DO NOTHING;

-- CAT_FUENTE_ESPACIAL
INSERT INTO public.CAT_FUENTE_ESPACIAL (fuente_espacial_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Anotación placa')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_FUENTE_ESPACIAL (fuente_espacial_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Informe técnico')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_FUENTE_ESPACIAL (fuente_espacial_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Publicación')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_FUENTE_ESPACIAL (fuente_espacial_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Mapa geológico')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_FUENTE_ESPACIAL (fuente_espacial_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (5, 'SIG corporativo')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_FUENTE_ESPACIAL (fuente_espacial_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (6, 'Base ANH')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_FUENTE_ESPACIAL (fuente_espacial_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (7, 'Conversión automática')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_FUENTE_ESPACIAL (fuente_espacial_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (8, 'Libreta de campo')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_FUENTE_ESPACIAL (fuente_espacial_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (9, 'GPS')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_FUENTE_ESPACIAL (fuente_espacial_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (10, 'Comunicación personal')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_FUENTE_ESPACIAL (fuente_espacial_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (11, 'Desconocida')
    ON CONFLICT DO NOTHING;

-- CAT_PERMISO
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Crear placa', 'Permite registrar nuevas placas en el sistema', NULL, 'Catalogador')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Editar placa', 'Permite modificar información de placas existentes', NULL, 'Catalogador')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Crear muestra', 'Permite registrar nuevas muestras', NULL, 'Catalogador')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Editar muestra', 'Permite + accion de edición', NULL, 'Catalogador')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (5, 'Transcribir anotaciones', NULL, NULL, 'Catalogador')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (6, 'Revisar registros', NULL, NULL, 'Revisor cientifico')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (7, 'Aprobar catalogación', 'Permite validar y cerrar registros catalogados', NULL, 'Revisor cientifico')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (8, 'Editar taxonomía', 'Permite modificar información taxonómica', NULL, 'Revisor cientifico')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (9, 'Editar estratigrafía', NULL, NULL, 'Revisor cientifico')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (10, 'Editar bioestratigrafía', NULL, NULL, 'Revisor cientifico')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (11, 'Aprobar revisión científica', NULL, NULL, 'Revisor cientifico')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (12, 'Eliiminar placa', NULL, NULL, 'Revisor cientifico')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (13, 'Modificar catálogos', NULL, NULL, 'Diseñador arquitectura datos científicos')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (14, 'Modificar diccionarios', NULL, NULL, 'Diseñador arquitectura datos científicos')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (15, 'la ho', NULL, NULL, 'Diseñador arquitectura datos científicos')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (16, 'Definir validaciones', NULL, NULL, 'Diseñador arquitectura datos científicos')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (17, 'Control estructural sistema', NULL, NULL, 'Diseñador arquitectura datos científicos')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (18, 'Ejecutar carga masiva', NULL, NULL, 'Desarrollador plataforma GeoTrace')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (19, 'Administrar usuarios', NULL, NULL, 'Desarrollador plataforma GeoTrace')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (20, 'Configurar formularios', NULL, NULL, 'Desarrollador plataforma GeoTrace; Diseñador arquitectura datos científicos')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (21, 'Configurar relaciones', NULL, NULL, 'Desarrollador plataforma GeoTrace; Diseñador arquitectura datos científicos')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (22, 'Publicar geovisor', NULL, NULL, 'Desarrollador plataforma GeoTrace')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (23, 'Crear campos calculados', NULL, NULL, 'Desarrollador plataforma GeoTrace')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (24, 'Registrar conservación', NULL, NULL, 'Curador colección micropaleontológica')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (25, 'Actualizar estado físico', NULL, NULL, 'Curador colección micropaleontológica')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (26, 'Registrar restauración', NULL, NULL, 'Curador colección micropaleontológica')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (27, 'Transferir material', NULL, NULL, 'Curador colección micropaleontológica')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (28, 'Validar coordenadas', NULL, NULL, 'Revisor espacial')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (29, 'Editar coordenadas', NULL, NULL, 'Revisor espacial')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (30, 'Validar sistemas de referencia', NULL, NULL, 'Revisor espacial')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (31, 'Revisar georreferenciación', NULL, NULL, 'Revisor espacial')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (32, 'Corregir inconsistencias espaciales', NULL, NULL, 'Revisor espacial')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (33, 'Validar ubicación de muestras', NULL, NULL, 'Revisor espacial')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (34, 'Editar campos espaciales', NULL, NULL, 'Revisor espacial')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (35, 'Validar capas geográficas', NULL, NULL, 'Revisor espacial')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (36, 'Integrar cartografía base', NULL, NULL, 'Revisor espacial')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_PERMISO (permiso_id, nombre, descripcion, modulo, nivel_criticidad)
    OVERRIDING SYSTEM VALUE VALUES (37, 'Aprobar información espacial', NULL, NULL, 'Revisor espacial')
    ON CONFLICT DO NOTHING;

-- CAT_TIPO_AUTOR
INSERT INTO public.CAT_TIPO_AUTOR (tipo_autor_id, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Persona', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_AUTOR (tipo_autor_id, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Entidad', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_AUTOR (tipo_autor_id, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Grupo de trabajo', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_AUTOR (tipo_autor_id, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Desconocido', NULL)
    ON CONFLICT DO NOTHING;

-- CAT_MATERIAL_MUEBLE
INSERT INTO public.CAT_MATERIAL_MUEBLE (material_mueble_id, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Madera', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MATERIAL_MUEBLE (material_mueble_id, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Metálico', NULL)
    ON CONFLICT DO NOTHING;

-- CAT_TIPO_DOCUMENTO
INSERT INTO public.CAT_TIPO_DOCUMENTO (tipo_documento_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Artículo científico')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DOCUMENTO (tipo_documento_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Libro')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DOCUMENTO (tipo_documento_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Capítulo de libro')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DOCUMENTO (tipo_documento_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Tesis')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DOCUMENTO (tipo_documento_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (5, 'Informe técnico')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DOCUMENTO (tipo_documento_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (6, 'Mapa geológico')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DOCUMENTO (tipo_documento_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (7, 'Memoria de congreso')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DOCUMENTO (tipo_documento_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (8, 'Documento institucional')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DOCUMENTO (tipo_documento_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (9, 'Otro')
    ON CONFLICT DO NOTHING;

-- CAT_ENTIDAD
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (1, 'ENT-0001', 'Gran Tierra Energy', 'Empresa de petróleo y gas')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (2, 'ENT-0002', 'Drummond Company Inc.', 'Empresa minera/energética')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (3, 'ENT-0003', 'Conoco (Compañía Continental)', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (4, 'ENT-0004', 'Nexen', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (5, 'ENT-0005', 'Maurel y Prom', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (6, 'ENT-0006', 'Hocol S.A.', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (7, 'ENT-0007', 'Paleoflora Ltda.', 'Empresa de servicios')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (8, 'ENT-0008', 'Gulfsands Petroleum', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (9, 'ENT-0009', 'Occidental de Colombia', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (10, 'ENT-0010', 'Lasmo Oil (Colombia) Ltd.', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (11, 'ENT-0011', 'Deep Sea Drilling Project (DSDP)', 'Programas de investigación internacional')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (12, 'ENT-0012', 'Ocean Drilling Program (ODP)', 'Programas de investigación internacional')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (13, 'ENT-0013', 'Superior Oil Company', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (14, 'ENT-0014', 'Marathon Oil', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (15, 'ENT-0015', 'Pacific Rubiales', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (16, 'ENT-0016', 'Chevron Colombia', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (17, 'ENT-0017', 'Philips Petroleum', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (18, 'ENT-0018', 'Ecopetrol S.A.', 'Empresa petrolera estatal')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (19, 'ENT-0019', 'Equion Energía Limitada', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (20, 'ENT-0020', 'ANH', 'Organismo gubernamental')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (21, 'ENT-0021', 'Petrolífera', 'Empresa')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (22, 'ENT-0022', 'Pacific Stratus', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (23, 'ENT-0023', 'Elf Aquitaine', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (24, 'ENT-0024', 'Lewis Energy', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (25, 'ENT-0025', 'Sintana Energy', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (26, 'ENT-0026', 'GHK Colombia', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (27, 'ENT-0027', 'Harken de Colombia', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (28, 'ENT-0028', 'Interoil Colombia', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (29, 'ENT-0029', 'Perenco', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (30, 'ENT-0030', 'Holywell Resources', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (31, 'ENT-0031', 'Sipetrol S.A.', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (32, 'ENT-0032', 'Emerald Energy', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (33, 'ENT-0033', 'Texas Petroleum', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (34, 'ENT-0034', 'Gems', 'Empresa de servicios')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (35, 'ENT-0035', 'Petrocol', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (36, 'ENT-0036', 'Petrobras Colombia', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (37, 'ENT-0037', 'Repsol', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (38, 'ENT-0038', 'Maxus Energy', 'Empresa petrolera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (39, 'ENT-0039', 'Holywell', 'Empresa')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (40, 'ENT-0040', 'Paleosedes', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (41, 'ENT-0041', 'IEES', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (42, 'ENT-0042', 'Usal', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ENTIDAD (entidad_id, codigo_entidad, nombre_entidad, tipo_entidad)
    OVERRIDING SYSTEM VALUE VALUES (43, 'ENT-0043', 'Duque-Caro & Cía', NULL)
    ON CONFLICT DO NOTHING;

-- CAT_CONFIGURACION_REJILLA
INSERT INTO public.CAT_CONFIGURACION_REJILLA (configuracion_rejilla_id, nombre, numero_subdivisiones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Rejilla_0', 0, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CONFIGURACION_REJILLA (configuracion_rejilla_id, nombre, numero_subdivisiones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Rejilla_10', 10, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CONFIGURACION_REJILLA (configuracion_rejilla_id, nombre, numero_subdivisiones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Rejilla_12', 12, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CONFIGURACION_REJILLA (configuracion_rejilla_id, nombre, numero_subdivisiones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Rejilla_15', 15, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CONFIGURACION_REJILLA (configuracion_rejilla_id, nombre, numero_subdivisiones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (5, 'Rejilla_20', 20, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CONFIGURACION_REJILLA (configuracion_rejilla_id, nombre, numero_subdivisiones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (6, 'Rejilla_40', 40, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CONFIGURACION_REJILLA (configuracion_rejilla_id, nombre, numero_subdivisiones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (7, 'Rejilla_50', 50, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CONFIGURACION_REJILLA (configuracion_rejilla_id, nombre, numero_subdivisiones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (8, 'Rejilla_60', 60, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CONFIGURACION_REJILLA (configuracion_rejilla_id, nombre, numero_subdivisiones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (9, 'Rejilla_100', 100, NULL)
    ON CONFLICT DO NOTHING;

-- SECCION_ESTRATIGRAFICA
INSERT INTO public.SECCION_ESTRATIGRAFICA (nombre, localizacion_geografica_id, observaciones)
    VALUES ('Carmen - Zambrano', NULL, NULL)
    ON CONFLICT DO NOTHING;

-- CAT_ETAPA_USO_PLACA
INSERT INTO public.CAT_ETAPA_USO_PLACA (etapa_uso_placa_id, codigo_etapa_uso_placa, nombre, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Vacía-Marcada', 'Vacia y preparada para organización', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ETAPA_USO_PLACA (etapa_uso_placa_id, codigo_etapa_uso_placa, nombre, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Picking', 'En uso - material seleccionado', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ETAPA_USO_PLACA (etapa_uso_placa_id, codigo_etapa_uso_placa, nombre, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Sorting', 'En uso - material organizado', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ETAPA_USO_PLACA (etapa_uso_placa_id, codigo_etapa_uso_placa, nombre, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Vacía-Transf', 'Vacía por transferencia de material', NULL)
    ON CONFLICT DO NOTHING;

-- CAT_TIPO_RELACION_PLACA
INSERT INTO public.CAT_TIPO_RELACION_PLACA (tipo_relacion_placa_id, nombre, descripcion, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Derivación taxonómica', 'Placa creada seleccionando ejemplares desde una placa de asociación', true, 'Asociación a Tipo')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_RELACION_PLACA (tipo_relacion_placa_id, nombre, descripcion, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Duplicado', 'Copia física equivalente de una placa existente', true, 'Colecciones referencia')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_RELACION_PLACA (tipo_relacion_placa_id, nombre, descripcion, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Repreparación', 'Nueva preparación desde material original', true, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_RELACION_PLACA (tipo_relacion_placa_id, nombre, descripcion, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Transferencia de material', 'Movimiento de material entre placas durante preparación', true, 'Ej. placa vacía a picking')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_RELACION_PLACA (tipo_relacion_placa_id, nombre, descripcion, activo, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (5, 'Reorganización', 'Cambio de organización del material', true, 'Picking a sorting')
    ON CONFLICT DO NOTHING;

-- CAT_SISTEMA_ENSAMBLE
INSERT INTO public.CAT_SISTEMA_ENSAMBLE (sistema_ensamble_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Acetato deslizante en ranura')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_SISTEMA_ENSAMBLE (sistema_ensamble_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Ensamble de vidrio integrado a marco de cartón')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_SISTEMA_ENSAMBLE (sistema_ensamble_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Ensamble de vidrio movil independiente y marco de aluminio')
    ON CONFLICT DO NOTHING;

-- CAT_TIPO_MUESTRA_SUBSUELO
INSERT INTO public.CAT_TIPO_MUESTRA_SUBSUELO (tipo_muestra_subsuelo_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Ripios')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_MUESTRA_SUBSUELO (tipo_muestra_subsuelo_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Núcleo convencional')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_MUESTRA_SUBSUELO (tipo_muestra_subsuelo_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Núcleo de pared')
    ON CONFLICT DO NOTHING;

-- CAT_SISTEMA_COORD
INSERT INTO public.CAT_SISTEMA_COORD (sistema_coord_id, nombre, tipo, tipo_coordenada, epsg)
    OVERRIDING SYSTEM VALUE VALUES (1, 'WGS84 Geográficas', 'Geográfica', 'LatLong', 4326)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_SISTEMA_COORD (sistema_coord_id, nombre, tipo, tipo_coordenada, epsg)
    OVERRIDING SYSTEM VALUE VALUES (2, 'MAGNA-SIRGAS Geográficas', 'Geográfica', 'LatLong', 4686)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_SISTEMA_COORD (sistema_coord_id, nombre, tipo, tipo_coordenada, epsg)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Bogotá Oeste Oeste', 'Plana', 'EsteNorte', 21894)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_SISTEMA_COORD (sistema_coord_id, nombre, tipo, tipo_coordenada, epsg)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Bogotá Oeste', 'Plana', 'EsteNorte', 21896)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_SISTEMA_COORD (sistema_coord_id, nombre, tipo, tipo_coordenada, epsg)
    OVERRIDING SYSTEM VALUE VALUES (5, 'Bogotá Central', 'Plana', 'EsteNorte', 21897)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_SISTEMA_COORD (sistema_coord_id, nombre, tipo, tipo_coordenada, epsg)
    OVERRIDING SYSTEM VALUE VALUES (6, 'Bogotá Este', 'Plana', 'EsteNorte', 21898)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_SISTEMA_COORD (sistema_coord_id, nombre, tipo, tipo_coordenada, epsg)
    OVERRIDING SYSTEM VALUE VALUES (7, 'Bogotá Este Este', 'Plana', 'EsteNorte', 21900)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_SISTEMA_COORD (sistema_coord_id, nombre, tipo, tipo_coordenada, epsg)
    OVERRIDING SYSTEM VALUE VALUES (8, 'MAGNA-SIRGAS UTM 17N', 'Plana', 'EsteNorte', 3117)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_SISTEMA_COORD (sistema_coord_id, nombre, tipo, tipo_coordenada, epsg)
    OVERRIDING SYSTEM VALUE VALUES (9, 'MAGNA-SIRGAS UTM 18N', 'Plana', 'EsteNorte', 3118)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_SISTEMA_COORD (sistema_coord_id, nombre, tipo, tipo_coordenada, epsg)
    OVERRIDING SYSTEM VALUE VALUES (10, 'MAGNA-SIRGAS UTM 19N', 'Plana', 'EsteNorte', 3119)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_SISTEMA_COORD (sistema_coord_id, nombre, tipo, tipo_coordenada, epsg)
    OVERRIDING SYSTEM VALUE VALUES (11, 'Desconocido', 'Desconocido', NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_SISTEMA_COORD (sistema_coord_id, nombre, tipo, tipo_coordenada, epsg)
    OVERRIDING SYSTEM VALUE VALUES (12, 'Coordenadas históricas sin datum conocido', 'Geográfica', 'Geográfica', NULL)
    ON CONFLICT DO NOTHING;

-- CAT_TIPO_REF_ESTRATIGRAFICA
INSERT INTO public.CAT_TIPO_REF_ESTRATIGRAFICA (nombre)
    VALUES ('Sobre la base')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_REF_ESTRATIGRAFICA (nombre)
    VALUES ('Bajo la base')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_REF_ESTRATIGRAFICA (nombre)
    VALUES ('Bajo el techo')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_REF_ESTRATIGRAFICA (nombre)
    VALUES ('Sobre el techo')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_REF_ESTRATIGRAFICA (nombre)
    VALUES ('Parte basal')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_REF_ESTRATIGRAFICA (nombre)
    VALUES ('Parte media')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_REF_ESTRATIGRAFICA (nombre)
    VALUES ('Parte superior')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_REF_ESTRATIGRAFICA (nombre)
    VALUES ('Contacto inferior')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_REF_ESTRATIGRAFICA (nombre)
    VALUES ('Contacto superior')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_REF_ESTRATIGRAFICA (nombre)
    VALUES ('Otro')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_REF_ESTRATIGRAFICA (nombre)
    VALUES ('Dentro de la unidad')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_REF_ESTRATIGRAFICA (nombre)
    VALUES ('Posición desconocida')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_REF_ESTRATIGRAFICA (nombre)
    VALUES ('Base de la unidad')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_REF_ESTRATIGRAFICA (nombre)
    VALUES ('Techo de la unidad')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_REF_ESTRATIGRAFICA (nombre)
    VALUES ('Porción inferior')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_REF_ESTRATIGRAFICA (nombre)
    VALUES ('Porción superior')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_REF_ESTRATIGRAFICA (nombre)
    VALUES ('Parte más baja')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_REF_ESTRATIGRAFICA (nombre)
    VALUES ('Parte inferior')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_REF_ESTRATIGRAFICA (nombre)
    VALUES ('Base de unidad')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_REF_ESTRATIGRAFICA (nombre)
    VALUES ('Top de unidad')
    ON CONFLICT DO NOTHING;

-- CAT_ACCIDENTE_GEOGRAFICO_NORM
INSERT INTO public.CAT_ACCIDENTE_GEOGRAFICO_NORM (accidente_geografico_norm_id, tipo, nombre_normalizado, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Quebrada', 'La Honda', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ACCIDENTE_GEOGRAFICO_NORM (accidente_geografico_norm_id, tipo, nombre_normalizado, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Arroyo', 'Alférez', NULL)
    ON CONFLICT DO NOTHING;

-- CAT_TIPO_DUDA
INSERT INTO public.CAT_TIPO_DUDA (tipo_duda_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Nombre ilegible')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DUDA (tipo_duda_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Nombre parcialmente ilegible')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DUDA (tipo_duda_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Código ilegible')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DUDA (tipo_duda_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Código incompleto')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DUDA (tipo_duda_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (5, 'Abreviatura ambigua')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DUDA (tipo_duda_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (6, 'Posible error ortográfico')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DUDA (tipo_duda_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (7, 'Posible truncamiento')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DUDA (tipo_duda_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (8, 'Nombre incompleto')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DUDA (tipo_duda_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (9, 'Identificación dudosa')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DUDA (tipo_duda_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (10, 'Entidad no encontrada')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DUDA (tipo_duda_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (11, 'Autor ilegible')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DUDA (tipo_duda_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (12, 'Autor ausente')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DUDA (tipo_duda_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (13, 'Escritura manuscrita difícil')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DUDA (tipo_duda_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (14, 'Requiere revisión especializada')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DUDA (tipo_duda_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (15, 'Requiere actualización nomenclatural')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DUDA (tipo_duda_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (16, 'Otro')
    ON CONFLICT DO NOTHING;

-- CAT_CODIGO_CAVIDAD
INSERT INTO public.CAT_CODIGO_CAVIDAD (codigo_cavidad_id, codigo_cavidad, tipo_cavidad)
    OVERRIDING SYSTEM VALUE VALUES (1, 'C1', 'Circular')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CODIGO_CAVIDAD (codigo_cavidad_id, codigo_cavidad, tipo_cavidad)
    OVERRIDING SYSTEM VALUE VALUES (2, 'C2', 'Circular')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CODIGO_CAVIDAD (codigo_cavidad_id, codigo_cavidad, tipo_cavidad)
    OVERRIDING SYSTEM VALUE VALUES (3, 'C3', 'Circular')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CODIGO_CAVIDAD (codigo_cavidad_id, codigo_cavidad, tipo_cavidad)
    OVERRIDING SYSTEM VALUE VALUES (4, 'C4', 'Circular')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CODIGO_CAVIDAD (codigo_cavidad_id, codigo_cavidad, tipo_cavidad)
    OVERRIDING SYSTEM VALUE VALUES (5, 'R0', 'Rectangular')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CODIGO_CAVIDAD (codigo_cavidad_id, codigo_cavidad, tipo_cavidad)
    OVERRIDING SYSTEM VALUE VALUES (6, 'R10', 'Rectangular')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CODIGO_CAVIDAD (codigo_cavidad_id, codigo_cavidad, tipo_cavidad)
    OVERRIDING SYSTEM VALUE VALUES (7, 'R12', 'Rectangular')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CODIGO_CAVIDAD (codigo_cavidad_id, codigo_cavidad, tipo_cavidad)
    OVERRIDING SYSTEM VALUE VALUES (8, 'R15', 'Rectangular')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CODIGO_CAVIDAD (codigo_cavidad_id, codigo_cavidad, tipo_cavidad)
    OVERRIDING SYSTEM VALUE VALUES (9, 'R20', 'Rectangular')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CODIGO_CAVIDAD (codigo_cavidad_id, codigo_cavidad, tipo_cavidad)
    OVERRIDING SYSTEM VALUE VALUES (10, 'R40', 'Rectangular')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CODIGO_CAVIDAD (codigo_cavidad_id, codigo_cavidad, tipo_cavidad)
    OVERRIDING SYSTEM VALUE VALUES (11, 'R50', 'Rectangular')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CODIGO_CAVIDAD (codigo_cavidad_id, codigo_cavidad, tipo_cavidad)
    OVERRIDING SYSTEM VALUE VALUES (12, 'R60', 'Rectangular')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CODIGO_CAVIDAD (codigo_cavidad_id, codigo_cavidad, tipo_cavidad)
    OVERRIDING SYSTEM VALUE VALUES (13, 'R100', 'Rectangular')
    ON CONFLICT DO NOTHING;

-- CAT_ESTADO_NOMENCLATURA
INSERT INTO public.CAT_ESTADO_NOMENCLATURA (estado_nomenclatura_id, estado_nomenclatura, significado)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Vigente', 'término actualmente aceptado')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ESTADO_NOMENCLATURA (estado_nomenclatura_id, estado_nomenclatura, significado)
    OVERRIDING SYSTEM VALUE VALUES (2, 'En desuso', 'término antiguo no recomendado')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ESTADO_NOMENCLATURA (estado_nomenclatura_id, estado_nomenclatura, significado)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Sinónimo', 'equivalente nomenclatural')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ESTADO_NOMENCLATURA (estado_nomenclatura_id, estado_nomenclatura, significado)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Propuesto', 'unidad sugerida o introducida, pero aún no consolidada')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ESTADO_NOMENCLATURA (estado_nomenclatura_id, estado_nomenclatura, significado)
    OVERRIDING SYSTEM VALUE VALUES (5, 'Revisado', 'reinterpretado respecto original')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ESTADO_NOMENCLATURA (estado_nomenclatura_id, estado_nomenclatura, significado)
    OVERRIDING SYSTEM VALUE VALUES (6, 'Indeterminado', 'estado incierto')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ESTADO_NOMENCLATURA (estado_nomenclatura_id, estado_nomenclatura, significado)
    OVERRIDING SYSTEM VALUE VALUES (7, 'No evaluada', 'nadie ha revisado todavía el estado nomenclatural')
    ON CONFLICT DO NOTHING;

-- CAT_ZONA
INSERT INTO public.CAT_ZONA (zona_id, codigo_zona, nombre)
    OVERRIDING SYSTEM VALUE VALUES (1, NULL, 'Izquierda')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ZONA (zona_id, codigo_zona, nombre)
    OVERRIDING SYSTEM VALUE VALUES (2, NULL, 'Central')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ZONA (zona_id, codigo_zona, nombre)
    OVERRIDING SYSTEM VALUE VALUES (3, NULL, 'Derecha')
    ON CONFLICT DO NOTHING;

-- CAT_MATERIAL_BANDEJA
INSERT INTO public.CAT_MATERIAL_BANDEJA (material_bandeja_id, codigo_material_bandeja, nombre)
    OVERRIDING SYSTEM VALUE VALUES (1, NULL, 'Aluminio')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MATERIAL_BANDEJA (material_bandeja_id, codigo_material_bandeja, nombre)
    OVERRIDING SYSTEM VALUE VALUES (2, NULL, 'Madera')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MATERIAL_BANDEJA (material_bandeja_id, codigo_material_bandeja, nombre)
    OVERRIDING SYSTEM VALUE VALUES (3, NULL, 'Metálico negro')
    ON CONFLICT DO NOTHING;

-- CAT_ESTADO_MATERIAL
INSERT INTO public.CAT_ESTADO_MATERIAL (estado_material_id, estado_material)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Suelto')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ESTADO_MATERIAL (estado_material_id, estado_material)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Pegado')
    ON CONFLICT DO NOTHING;

-- CAT_METODO_ESPACIAL
INSERT INTO public.CAT_METODO_ESPACIAL (metodo_espacial_id, nombre_metodo_espacial)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Coordenada GPS')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_METODO_ESPACIAL (metodo_espacial_id, nombre_metodo_espacial)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Conversión de datum')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_METODO_ESPACIAL (metodo_espacial_id, nombre_metodo_espacial)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Georreferenciación de mapa')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_METODO_ESPACIAL (metodo_espacial_id, nombre_metodo_espacial)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Coordenada tomada de publicación')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_METODO_ESPACIAL (metodo_espacial_id, nombre_metodo_espacial)
    OVERRIDING SYSTEM VALUE VALUES (5, 'Coordenada estimada')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_METODO_ESPACIAL (metodo_espacial_id, nombre_metodo_espacial)
    OVERRIDING SYSTEM VALUE VALUES (6, 'Coordenada histórica')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_METODO_ESPACIAL (metodo_espacial_id, nombre_metodo_espacial)
    OVERRIDING SYSTEM VALUE VALUES (7, 'Interpretación')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_METODO_ESPACIAL (metodo_espacial_id, nombre_metodo_espacial)
    OVERRIDING SYSTEM VALUE VALUES (8, 'Coordenada aproximada')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_METODO_ESPACIAL (metodo_espacial_id, nombre_metodo_espacial)
    OVERRIDING SYSTEM VALUE VALUES (9, 'Coordenada convertida')
    ON CONFLICT DO NOTHING;

-- CAT_COLOR_MUEBLE
INSERT INTO public.CAT_COLOR_MUEBLE (color_mueble_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Natural')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_COLOR_MUEBLE (color_mueble_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Negro')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_COLOR_MUEBLE (color_mueble_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Caoba claro')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_COLOR_MUEBLE (color_mueble_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Caoba oscuro')
    ON CONFLICT DO NOTHING;

-- CAT_COLUMNA_BANDEJA
INSERT INTO public.CAT_COLUMNA_BANDEJA (columna_bandeja_id, codigo_columna, nombre)
    OVERRIDING SYSTEM VALUE VALUES (1, NULL, 'Izquierda')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_COLUMNA_BANDEJA (columna_bandeja_id, codigo_columna, nombre)
    OVERRIDING SYSTEM VALUE VALUES (2, NULL, 'Derecha')
    ON CONFLICT DO NOTHING;

-- CAT_TIPO_DOCUMENTO_ASOCIADO
INSERT INTO public.CAT_TIPO_DOCUMENTO_ASOCIADO (tipo_documento_asociado_id, codigo_documento, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (1, 'CARTA_DIST', 'Carta de distribución', 'Documento gráfico')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DOCUMENTO_ASOCIADO (tipo_documento_asociado_id, codigo_documento, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (2, 'RESL_ESTRA', 'Resumen estratigráfico', 'Síntesis')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DOCUMENTO_ASOCIADO (tipo_documento_asociado_id, codigo_documento, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (3, 'DESC_BIO_MUE', 'Descripción bioestratigráfica muestra a muestra', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DOCUMENTO_ASOCIADO (tipo_documento_asociado_id, codigo_documento, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (4, 'INF_BIO', 'Informe bioestratigráfico', 'Estudio técnico')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DOCUMENTO_ASOCIADO (tipo_documento_asociado_id, codigo_documento, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (5, 'FOTO', 'Fotografía', 'Imagen')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DOCUMENTO_ASOCIADO (tipo_documento_asociado_id, codigo_documento, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (6, 'LIST_TOP', 'Listado de topes', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DOCUMENTO_ASOCIADO (tipo_documento_asociado_id, codigo_documento, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (7, 'LIST_KEY', 'Listado de especies marcadoras', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DOCUMENTO_ASOCIADO (tipo_documento_asociado_id, codigo_documento, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (8, 'MAPA', 'Mapa', 'Documento cartográfico')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DOCUMENTO_ASOCIADO (tipo_documento_asociado_id, codigo_documento, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (9, 'REGIONAL', 'Documento regional', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DOCUMENTO_ASOCIADO (tipo_documento_asociado_id, codigo_documento, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (10, 'LIB_CAMPO', 'Libreta de campo', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DOCUMENTO_ASOCIADO (tipo_documento_asociado_id, codigo_documento, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (11, 'CORR', 'Correspondencia', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DOCUMENTO_ASOCIADO (tipo_documento_asociado_id, codigo_documento, nombre, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (12, 'OTRO', 'Otro', NULL)
    ON CONFLICT DO NOTHING;

-- CAT_DISENO_PLACA
INSERT INTO public.CAT_DISENO_PLACA (diseno_placa_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Circular')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_DISENO_PLACA (diseno_placa_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Rectangular')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_DISENO_PLACA (diseno_placa_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Mixta')
    ON CONFLICT DO NOTHING;

-- CAT_IDIOMA
INSERT INTO public.CAT_IDIOMA (idioma_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Español')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_IDIOMA (idioma_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Inglés')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_IDIOMA (idioma_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Francés')
    ON CONFLICT DO NOTHING;

-- CAT_TIPO_FECHA_HISTORICA
INSERT INTO public.CAT_TIPO_FECHA_HISTORICA (tipo_fecha_historica_id, nombre, descripcion, activo)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Colecta', 'cuando se tomó la muestra en campo', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_FECHA_HISTORICA (tipo_fecha_historica_id, nombre, descripcion, activo)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Preparación', 'preparación de muestra/placa', true)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_FECHA_HISTORICA (tipo_fecha_historica_id, nombre, descripcion, activo)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Análisis', 'estudio micropaleontológico', false)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_FECHA_HISTORICA (tipo_fecha_historica_id, nombre, descripcion, activo)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Montaje', 'elaboración de placa', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_FECHA_HISTORICA (tipo_fecha_historica_id, nombre, descripcion, activo)
    OVERRIDING SYSTEM VALUE VALUES (5, 'Revisión', NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_FECHA_HISTORICA (tipo_fecha_historica_id, nombre, descripcion, activo)
    OVERRIDING SYSTEM VALUE VALUES (6, 'Ingreso colección', 'entrada al repositorio', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_FECHA_HISTORICA (tipo_fecha_historica_id, nombre, descripcion, activo)
    OVERRIDING SYSTEM VALUE VALUES (7, 'Desconocida', NULL, NULL)
    ON CONFLICT DO NOTHING;

-- CAT_PLANCHA_TOPOGRAFICA
INSERT INTO public.CAT_PLANCHA_TOPOGRAFICA (codigo_plancha, nombre, observaciones)
    VALUES (38, 'Plancha 38', NULL)
    ON CONFLICT DO NOTHING;

-- CAT_TIPO_PROTECCION
INSERT INTO public.CAT_TIPO_PROTECCION (tipo_proteccion_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Acetato')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_PROTECCION (tipo_proteccion_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Vidrio')
    ON CONFLICT DO NOTHING;

-- CAT_CLASE_P_TIPO
INSERT INTO public.CAT_CLASE_P_TIPO (nombre, descripcion, activo, observaciones)
    VALUES ('Holotipo', 'Placa tipo que contiene ejemplar holotipo', true, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CLASE_P_TIPO (nombre, descripcion, activo, observaciones)
    VALUES ('Paratipo', 'Placa tipo que contiene ejemplar paratipo', true, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CLASE_P_TIPO (nombre, descripcion, activo, observaciones)
    VALUES ('Topotipo', 'Placa tipo con material topotipo', true, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CLASE_P_TIPO (nombre, descripcion, activo, observaciones)
    VALUES ('Homeotipo', NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CLASE_P_TIPO (nombre, descripcion, activo, observaciones)
    VALUES ('Sin definición', NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;

-- CAT_COLECTOR
INSERT INTO public.CAT_COLECTOR (colector_id, iniciales, nombre, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (1, 'HD', 'Hermann Duque Caro', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_COLECTOR (colector_id, iniciales, nombre, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (2, 'HB', 'Hans Bürgl', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_COLECTOR (colector_id, iniciales, nombre, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (3, 'GGO', 'Georgina Guzmán Ospitia', NULL)
    ON CONFLICT DO NOTHING;

-- CAT_ESPECIALIDAD
INSERT INTO public.CAT_ESPECIALIDAD (especialidad_id, nombre_especialidad, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Micropaleontología', 'Especialista en microfósiles')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ESPECIALIDAD (especialidad_id, nombre_especialidad, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Foraminíferos', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ESPECIALIDAD (especialidad_id, nombre_especialidad, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Palinología', 'Polen, esporas, palinomorfos')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ESPECIALIDAD (especialidad_id, nombre_especialidad, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Estratigrafía', 'Análisis estratigráfico')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ESPECIALIDAD (especialidad_id, nombre_especialidad, descripcion)
    OVERRIDING SYSTEM VALUE VALUES (5, 'Cartografía', NULL)
    ON CONFLICT DO NOTHING;

-- CAT_ESTADO_REVISION
INSERT INTO public.CAT_ESTADO_REVISION (estado_revision_id, nombre, significado)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Sin revisar', 'Registro capturado por el catalogador')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ESTADO_REVISION (estado_revision_id, nombre, significado)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Revisado', 'Registro  verificado por un especialista')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ESTADO_REVISION (estado_revision_id, nombre, significado)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Normalizado', 'Existe correspondencia con una forma estandarizada')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ESTADO_REVISION (estado_revision_id, nombre, significado)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Actualizado', 'Existe correspondencia con una denominación actualmente aceptada')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ESTADO_REVISION (estado_revision_id, nombre, significado)
    OVERRIDING SYSTEM VALUE VALUES (5, 'No encontrado', 'Sin equivalencia confirmada')
    ON CONFLICT DO NOTHING;

-- CAT_POSICION_ANOTACION
INSERT INTO public.CAT_POSICION_ANOTACION (posicion_anotacion_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Izquierda')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_POSICION_ANOTACION (posicion_anotacion_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Derecha')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_POSICION_ANOTACION (posicion_anotacion_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Arriba')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_POSICION_ANOTACION (posicion_anotacion_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Abajo')
    ON CONFLICT DO NOTHING;

-- CAT_MARCO_PLACA_ESTADO
INSERT INTO public.CAT_MARCO_PLACA_ESTADO (marco_placa_estado_id, marco_placa_estado, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Intacta', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MARCO_PLACA_ESTADO (marco_placa_estado_id, marco_placa_estado, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Con caucho cristalizado', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MARCO_PLACA_ESTADO (marco_placa_estado_id, marco_placa_estado, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Deformada', NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MARCO_PLACA_ESTADO (marco_placa_estado_id, marco_placa_estado, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Rota', NULL)
    ON CONFLICT DO NOTHING;

-- CAT_ORIGEN_MUESTRA
INSERT INTO public.CAT_ORIGEN_MUESTRA (origen_muestra_id, nombre, significado)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Superficie', 'Afloramiento')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ORIGEN_MUESTRA (origen_muestra_id, nombre, significado)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Subsuelo', 'Perforación')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ORIGEN_MUESTRA (origen_muestra_id, nombre, significado)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Lecho marino', 'Sedimento oceánico')
    ON CONFLICT DO NOTHING;

-- CAT_NIVEL_DETALLE_LOCALIDAD
INSERT INTO public.CAT_NIVEL_DETALLE_LOCALIDAD (nivel_detalle_localidad_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (1, 'País')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_NIVEL_DETALLE_LOCALIDAD (nivel_detalle_localidad_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Departamento/Estado')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_NIVEL_DETALLE_LOCALIDAD (nivel_detalle_localidad_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (3, 'Municipio')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_NIVEL_DETALLE_LOCALIDAD (nivel_detalle_localidad_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Corregimiento/Vereda')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_NIVEL_DETALLE_LOCALIDAD (nivel_detalle_localidad_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (5, 'Localidad')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_NIVEL_DETALLE_LOCALIDAD (nivel_detalle_localidad_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (6, 'Pozo')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_NIVEL_DETALLE_LOCALIDAD (nivel_detalle_localidad_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (7, 'Afloramiento')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_NIVEL_DETALLE_LOCALIDAD (nivel_detalle_localidad_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (8, 'Punto exacto')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_NIVEL_DETALLE_LOCALIDAD (nivel_detalle_localidad_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (9, 'Descripción textual aproximada')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_NIVEL_DETALLE_LOCALIDAD (nivel_detalle_localidad_id, nombre)
    OVERRIDING SYSTEM VALUE VALUES (10, 'Desconocido')
    ON CONFLICT DO NOTHING;

-- CAT_ESTADO_CATALOGACION
INSERT INTO public.CAT_ESTADO_CATALOGACION (estado_catalogacion_id, estado, significado, quien)
    OVERRIDING SYSTEM VALUE VALUES (1, 'En proceso', 'Captura activa', 'Catalogador')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ESTADO_CATALOGACION (estado_catalogacion_id, estado, significado, quien)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Incompleto', 'Faltan datos', 'Sistema/Catalogador')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ESTADO_CATALOGACION (estado_catalogacion_id, estado, significado, quien)
    OVERRIDING SYSTEM VALUE VALUES (3, 'En revisión', 'control de calidad', 'Revisor')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ESTADO_CATALOGACION (estado_catalogacion_id, estado, significado, quien)
    OVERRIDING SYSTEM VALUE VALUES (4, 'Validado', 'Revisión aprobada', 'Revisor')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ESTADO_CATALOGACION (estado_catalogacion_id, estado, significado, quien)
    OVERRIDING SYSTEM VALUE VALUES (5, 'Congelado', 'Registro congelado', 'Administrador')
    ON CONFLICT DO NOTHING;

-- CAT_TIPO_INTERVALO_MUESTRA
INSERT INTO public.CAT_TIPO_INTERVALO_MUESTRA (tipo_intervalo_muestra_id, tipo)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Puntual')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_INTERVALO_MUESTRA (tipo_intervalo_muestra_id, tipo)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Intervalo')
    ON CONFLICT DO NOTHING;

-- CAT_SECCION
INSERT INTO public.CAT_SECCION (seccion_id, codigo_seccion, nombre)
    OVERRIDING SYSTEM VALUE VALUES (1, NULL, 'Superior')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_SECCION (seccion_id, codigo_seccion, nombre)
    OVERRIDING SYSTEM VALUE VALUES (2, NULL, 'Inferior')
    ON CONFLICT DO NOTHING;

-- DIC_DESCRIPCION_LITO_NORM
INSERT INTO public.DIC_DESCRIPCION_LITO_NORM (litologia_principal, modificador, revisor_id, fecha_revision, observaciones)
    VALUES (NULL, NULL, NULL, NULL, 'Guijos interpretados como componente conglomerático')
    ON CONFLICT DO NOTHING;

-- CAT_REFERENCIA_BIBLIOGRAFICA
INSERT INTO public.CAT_REFERENCIA_BIBLIOGRAFICA (referencia_bibliografica_id, cita_corta, autores, titulo, fuente, doi_url, tipo_documento_id, observaciones)
    OVERRIDING SYSTEM VALUE VALUES ('REF-000001', 'Duque-Caro (1979)', 'Duque-Caro, H.', 'Major structural elements of the Colombian Caribbean', 'Geological Society of America Memoir', NULL, 1, 'Referencia utilizada para normalización litoestratigráfica')
    ON CONFLICT DO NOTHING;

-- CAT_PROYECTO
INSERT INTO public.CAT_PROYECTO (proyecto_id, nombre, entidad_id, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Evaluación Estratigráfica RC7', 12, 'Proyecto histórico de exploración')
    ON CONFLICT DO NOTHING;

-- CAT_MUEBLE
INSERT INTO public.CAT_MUEBLE (mueble_id, codigo_mueble, material_mueble_id, color_mueble_id, tiene_secciones, tiene_zonas, capacidad_bandejas, capacidad_posiciones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (1, 'HDC-1', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MUEBLE (mueble_id, codigo_mueble, material_mueble_id, color_mueble_id, tiene_secciones, tiene_zonas, capacidad_bandejas, capacidad_posiciones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (2, 'HDC-2', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MUEBLE (mueble_id, codigo_mueble, material_mueble_id, color_mueble_id, tiene_secciones, tiene_zonas, capacidad_bandejas, capacidad_posiciones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (3, 'HDC-3', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MUEBLE (mueble_id, codigo_mueble, material_mueble_id, color_mueble_id, tiene_secciones, tiene_zonas, capacidad_bandejas, capacidad_posiciones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (4, 'HDC-4', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MUEBLE (mueble_id, codigo_mueble, material_mueble_id, color_mueble_id, tiene_secciones, tiene_zonas, capacidad_bandejas, capacidad_posiciones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (5, 'A', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MUEBLE (mueble_id, codigo_mueble, material_mueble_id, color_mueble_id, tiene_secciones, tiene_zonas, capacidad_bandejas, capacidad_posiciones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (6, 'B', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MUEBLE (mueble_id, codigo_mueble, material_mueble_id, color_mueble_id, tiene_secciones, tiene_zonas, capacidad_bandejas, capacidad_posiciones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (7, 'C', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MUEBLE (mueble_id, codigo_mueble, material_mueble_id, color_mueble_id, tiene_secciones, tiene_zonas, capacidad_bandejas, capacidad_posiciones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (8, 'MA', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MUEBLE (mueble_id, codigo_mueble, material_mueble_id, color_mueble_id, tiene_secciones, tiene_zonas, capacidad_bandejas, capacidad_posiciones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (9, 'MB', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MUEBLE (mueble_id, codigo_mueble, material_mueble_id, color_mueble_id, tiene_secciones, tiene_zonas, capacidad_bandejas, capacidad_posiciones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (10, 'MC', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MUEBLE (mueble_id, codigo_mueble, material_mueble_id, color_mueble_id, tiene_secciones, tiene_zonas, capacidad_bandejas, capacidad_posiciones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (11, 'MD', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MUEBLE (mueble_id, codigo_mueble, material_mueble_id, color_mueble_id, tiene_secciones, tiene_zonas, capacidad_bandejas, capacidad_posiciones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (12, 'CG-M-1', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MUEBLE (mueble_id, codigo_mueble, material_mueble_id, color_mueble_id, tiene_secciones, tiene_zonas, capacidad_bandejas, capacidad_posiciones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (13, 'CG-M-2', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MUEBLE (mueble_id, codigo_mueble, material_mueble_id, color_mueble_id, tiene_secciones, tiene_zonas, capacidad_bandejas, capacidad_posiciones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (14, 'CG-M-3', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MUEBLE (mueble_id, codigo_mueble, material_mueble_id, color_mueble_id, tiene_secciones, tiene_zonas, capacidad_bandejas, capacidad_posiciones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (15, 'CG-M-5', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MUEBLE (mueble_id, codigo_mueble, material_mueble_id, color_mueble_id, tiene_secciones, tiene_zonas, capacidad_bandejas, capacidad_posiciones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (16, 'CG-M-7', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MUEBLE (mueble_id, codigo_mueble, material_mueble_id, color_mueble_id, tiene_secciones, tiene_zonas, capacidad_bandejas, capacidad_posiciones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (17, 'CG-M-8', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MUEBLE (mueble_id, codigo_mueble, material_mueble_id, color_mueble_id, tiene_secciones, tiene_zonas, capacidad_bandejas, capacidad_posiciones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (18, 'LNG-1', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MUEBLE (mueble_id, codigo_mueble, material_mueble_id, color_mueble_id, tiene_secciones, tiene_zonas, capacidad_bandejas, capacidad_posiciones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (19, 'LNG-2', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MUEBLE (mueble_id, codigo_mueble, material_mueble_id, color_mueble_id, tiene_secciones, tiene_zonas, capacidad_bandejas, capacidad_posiciones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (20, 'LNG-3', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MUEBLE (mueble_id, codigo_mueble, material_mueble_id, color_mueble_id, tiene_secciones, tiene_zonas, capacidad_bandejas, capacidad_posiciones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (21, 'LNG-4', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_MUEBLE (mueble_id, codigo_mueble, material_mueble_id, color_mueble_id, tiene_secciones, tiene_zonas, capacidad_bandejas, capacidad_posiciones, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (22, 'LNG-5', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;

-- CAT_DOCUMENTO_FAMILIA
INSERT INTO public.CAT_DOCUMENTO_FAMILIA (documento_familia_id, titulo_base, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Informe Bioestratigráfico Acae-12', 'Posee varias versiones')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_DOCUMENTO_FAMILIA (documento_familia_id, titulo_base, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Carta Distribución Colección HDC', 'Documento único')
    ON CONFLICT DO NOTHING;

-- CAT_CONFIGURACION_CAVIDADES
INSERT INTO public.CAT_CONFIGURACION_CAVIDADES (configuracion_cavidades_id, diseno_placa_id, total_cavidades)
    OVERRIDING SYSTEM VALUE VALUES (1, 1, 1)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CONFIGURACION_CAVIDADES (configuracion_cavidades_id, diseno_placa_id, total_cavidades)
    OVERRIDING SYSTEM VALUE VALUES (2, 1, 2)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CONFIGURACION_CAVIDADES (configuracion_cavidades_id, diseno_placa_id, total_cavidades)
    OVERRIDING SYSTEM VALUE VALUES (3, 1, 3)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CONFIGURACION_CAVIDADES (configuracion_cavidades_id, diseno_placa_id, total_cavidades)
    OVERRIDING SYSTEM VALUE VALUES (4, 1, 4)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CONFIGURACION_CAVIDADES (configuracion_cavidades_id, diseno_placa_id, total_cavidades)
    OVERRIDING SYSTEM VALUE VALUES (5, 2, 1)
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_CONFIGURACION_CAVIDADES (configuracion_cavidades_id, diseno_placa_id, total_cavidades)
    OVERRIDING SYSTEM VALUE VALUES (6, 3, 2)
    ON CONFLICT DO NOTHING;

-- CAT_FECHA_HISTORICA
INSERT INTO public.CAT_FECHA_HISTORICA (fecha_historica_id, fecha_texto_original, fecha_interpretada, tipo_fecha_historica_id, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (1, 'VIII/24/79', '1979-08-24', 6, 'Tipo aún no determinado')
    ON CONFLICT DO NOTHING;

-- DIC_EDAD_NORMALIZADA
INSERT INTO public.DIC_EDAD_NORMALIZADA (edad_normalizada_id, nombre_normalizado, estado_revision_id, revisor_id, fecha_revision, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Cretácico Superior', 1, NULL, NULL, 'Estandarización de término')
    ON CONFLICT DO NOTHING;
INSERT INTO public.DIC_EDAD_NORMALIZADA (edad_normalizada_id, nombre_normalizado, estado_revision_id, revisor_id, fecha_revision, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Maastrichtiano', 1, NULL, NULL, 'Edad normalizada')
    ON CONFLICT DO NOTHING;

-- DIC_EDAD_ACTUALIZADA
INSERT INTO public.DIC_EDAD_ACTUALIZADA (edad_actualizada_id, nombre_actualizado, escala_tiempo, fuente_actualizacion, revisor_id, fecha_revision, estado_revision_id, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Cretácico Superior', 'ICS 2025', 'International Chronostratigraphic Chart', NULL, NULL, NULL, 'Edad vigente')
    ON CONFLICT DO NOTHING;
INSERT INTO public.DIC_EDAD_ACTUALIZADA (edad_actualizada_id, nombre_actualizado, escala_tiempo, fuente_actualizacion, revisor_id, fecha_revision, estado_revision_id, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Maastrichtiano', 'ICS 2025', 'International Chronostratigraphic Chart', NULL, NULL, NULL, 'Sin cambio')
    ON CONFLICT DO NOTHING;

-- DIC_BIOZONA_REPORTADA
INSERT INTO public.DIC_BIOZONA_REPORTADA (nombre_reportado, autor_biozona_reportada, codigo_biozona, estado_revision_id, catalogador_id, fecha_ingreso, revisor_id, fecha_revision, observaciones)
    VALUES ('Gn. ciperoensis', 'Bolli', 'P22', NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.DIC_BIOZONA_REPORTADA (nombre_reportado, autor_biozona_reportada, codigo_biozona, estado_revision_id, catalogador_id, fecha_ingreso, revisor_id, fecha_revision, observaciones)
    VALUES ('Globorotalia kugleri', 'Bolli', 'N4', NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;

-- DIC_TAXON_ACTUALIZADO
INSERT INTO public.DIC_TAXON_ACTUALIZADO (taxon_actualizado_id, nombre_actualizado, autor_taxon_actualizado, fuente_actualizacion, fecha_actualizacion, revisor_id, fecha_revision, estado_revision_id, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Paragloborotalia ciperoensis', 'Bolli', 'WoRMS / literatura taxonómica', 2026, NULL, NULL, NULL, 'Cambio nomenclatural')
    ON CONFLICT DO NOTHING;
INSERT INTO public.DIC_TAXON_ACTUALIZADO (taxon_actualizado_id, nombre_actualizado, autor_taxon_actualizado, fuente_actualizacion, fecha_actualizacion, revisor_id, fecha_revision, estado_revision_id, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Morozovella velascoensis', 'Cushman', 'Revisión taxonómica actual', 2026, NULL, NULL, NULL, 'Nombre vigente')
    ON CONFLICT DO NOTHING;

-- DIC_BIOZONA_ACTUALIZADA
INSERT INTO public.DIC_BIOZONA_ACTUALIZADA (biozona_actualizada_id, nombre_actualizado, codigo_biozona_actual, fuente_actualizacion, fecha_actualizacion, revisor_id, fecha_revision, estado_revision_id, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Paragloborotalia ciperoensis Zone', 'P22', 'Escala bioestratigráfica actual', 2026, NULL, NULL, NULL, 'Cambio por actualización taxonómica')
    ON CONFLICT DO NOTHING;
INSERT INTO public.DIC_BIOZONA_ACTUALIZADA (biozona_actualizada_id, nombre_actualizado, codigo_biozona_actual, fuente_actualizacion, fecha_actualizacion, revisor_id, fecha_revision, estado_revision_id, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Morozovella velascoensis Zone', 'P5', 'Referencia vigente', 2026, NULL, NULL, NULL, 'Sin modificación')
    ON CONFLICT DO NOTHING;

-- DIC_TAXON_REPORTADO
INSERT INTO public.DIC_TAXON_REPORTADO (nombre_reportado, autor_taxon_reportado, estado_revision_id, catalogador_id, fecha_ingreso, revisor_id, fecha_revision, observaciones)
    VALUES ('Globigerina ciperoensis', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.DIC_TAXON_REPORTADO (nombre_reportado, autor_taxon_reportado, estado_revision_id, catalogador_id, fecha_ingreso, revisor_id, fecha_revision, observaciones)
    VALUES ('Globigerina angustiumbilicata', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.DIC_TAXON_REPORTADO (nombre_reportado, autor_taxon_reportado, estado_revision_id, catalogador_id, fecha_ingreso, revisor_id, fecha_revision, observaciones)
    VALUES ('G. bulloides', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
INSERT INTO public.DIC_TAXON_REPORTADO (nombre_reportado, autor_taxon_reportado, estado_revision_id, catalogador_id, fecha_ingreso, revisor_id, fecha_revision, observaciones)
    VALUES ('Globigerinoides spp.', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;

-- DIC_EDAD_REPORTADA
INSERT INTO public.DIC_EDAD_REPORTADA (nombre_reportado, estado_revision_id, catalogador_id, fecha_ingreso, revisor_id, fecha_revision, observaciones)
    VALUES ('Cretácico Superior', NULL, NULL, NULL, NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;

-- DIC_BIOZONA_NORMALIZADA
INSERT INTO public.DIC_BIOZONA_NORMALIZADA (biozona_normalizada_id, nombre_normalizado, codigo_biozona, autor_biozona_normalizada, estado_revision_id, revisor_id, fecha_revision, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Globigerina ciperoensis Zone', 'P22', 'Bolli', 1, NULL, NULL, 'Nombre expandido y normalizado')
    ON CONFLICT DO NOTHING;
INSERT INTO public.DIC_BIOZONA_NORMALIZADA (biozona_normalizada_id, nombre_normalizado, codigo_biozona, autor_biozona_normalizada, estado_revision_id, revisor_id, fecha_revision, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Morozovella velascoensis Zone', 'P5', 'Autor', 1, NULL, NULL, 'Formato estandarizado')
    ON CONFLICT DO NOTHING;

-- DIC_TAXON_NORMALIZADO
INSERT INTO public.DIC_TAXON_NORMALIZADO (taxon_normalizado_id, nombre_normalizado, autor_taxon_normalizado, estado_revision_id, revisor_id, fecha_revision, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (1, 'Globigerina ciperoensis', 'Bolli', 1, NULL, NULL, 'Nombre revisado y estandarizado desde inventario histórico')
    ON CONFLICT DO NOTHING;
INSERT INTO public.DIC_TAXON_NORMALIZADO (taxon_normalizado_id, nombre_normalizado, autor_taxon_normalizado, estado_revision_id, revisor_id, fecha_revision, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (2, 'Morozovella velascoensis', 'Cushman', 1, NULL, NULL, 'Corrección ortográfica aplicada')
    ON CONFLICT DO NOTHING;

-- CAT_METODO_ADQUISICION
INSERT INTO public.CAT_METODO_ADQUISICION (metodo_adquisicion_id, origen_muestra_id, codigo_metodo_adquisicion, nombre, tipo)
    OVERRIDING SYSTEM VALUE VALUES (1, 3, NULL, 'Draga', 'Lecho marino')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_METODO_ADQUISICION (metodo_adquisicion_id, origen_muestra_id, codigo_metodo_adquisicion, nombre, tipo)
    OVERRIDING SYSTEM VALUE VALUES (2, 3, NULL, 'Box core', 'Lecho marino')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_METODO_ADQUISICION (metodo_adquisicion_id, origen_muestra_id, codigo_metodo_adquisicion, nombre, tipo)
    OVERRIDING SYSTEM VALUE VALUES (3, 3, NULL, 'Gravity core', 'Lecho marino')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_METODO_ADQUISICION (metodo_adquisicion_id, origen_muestra_id, codigo_metodo_adquisicion, nombre, tipo)
    OVERRIDING SYSTEM VALUE VALUES (4, 3, NULL, 'Piston core', 'Lecho marino')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_METODO_ADQUISICION (metodo_adquisicion_id, origen_muestra_id, codigo_metodo_adquisicion, nombre, tipo)
    OVERRIDING SYSTEM VALUE VALUES (5, 3, NULL, 'Multicorer', 'Lecho marino')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_METODO_ADQUISICION (metodo_adquisicion_id, origen_muestra_id, codigo_metodo_adquisicion, nombre, tipo)
    OVERRIDING SYSTEM VALUE VALUES (6, 2, NULL, 'Perforación rotatoria', 'Subsuelo')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_METODO_ADQUISICION (metodo_adquisicion_id, origen_muestra_id, codigo_metodo_adquisicion, nombre, tipo)
    OVERRIDING SYSTEM VALUE VALUES (7, 2, NULL, 'Sidewall coring', 'Subsuelo')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_METODO_ADQUISICION (metodo_adquisicion_id, origen_muestra_id, codigo_metodo_adquisicion, nombre, tipo)
    OVERRIDING SYSTEM VALUE VALUES (8, 2, NULL, 'Conventional coring', 'Subsuelo')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_METODO_ADQUISICION (metodo_adquisicion_id, origen_muestra_id, codigo_metodo_adquisicion, nombre, tipo)
    OVERRIDING SYSTEM VALUE VALUES (9, 1, NULL, 'Toma manual con martillo', 'Superficie')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_METODO_ADQUISICION (metodo_adquisicion_id, origen_muestra_id, codigo_metodo_adquisicion, nombre, tipo)
    OVERRIDING SYSTEM VALUE VALUES (10, 1, NULL, 'Barreno manual (auger)', 'Superficie')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_METODO_ADQUISICION (metodo_adquisicion_id, origen_muestra_id, codigo_metodo_adquisicion, nombre, tipo)
    OVERRIDING SYSTEM VALUE VALUES (11, 1, NULL, 'Canal', 'Superficie')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_METODO_ADQUISICION (metodo_adquisicion_id, origen_muestra_id, codigo_metodo_adquisicion, nombre, tipo)
    OVERRIDING SYSTEM VALUE VALUES (12, 1, NULL, 'Trinchera', 'Superficie')
    ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_METODO_ADQUISICION (metodo_adquisicion_id, origen_muestra_id, codigo_metodo_adquisicion, nombre, tipo)
    OVERRIDING SYSTEM VALUE VALUES (13, 1, NULL, 'Núcleo somero manual', 'Superficie')
    ON CONFLICT DO NOTHING;

-- DIC_DESCRIPCION_LITO_REPORTADA
INSERT INTO public.DIC_DESCRIPCION_LITO_REPORTADA (descripcion_lito_reportada_id, descripcion_reportada, minerales, estado_catalogacion_id, catalogador_id, fecha_ingreso, revisor_id, fecha_revision, observaciones)
    OVERRIDING SYSTEM VALUE VALUES ('DLR-000001', 'Arenisca marrón con guijos verdes y abundantes moluscos', NULL, 1, NULL, NULL, NULL, NULL, 'Descripción tomada textualmente de la etiqueta original')
    ON CONFLICT DO NOTHING;

-- DOCUMENTO_ASOCIADO
INSERT INTO public.DOCUMENTO_ASOCIADO (documento_id, documento_familia_id, version_documento, titulo_documento, tipo_documento_asociado_id, fecha_documento, resumen, entidad_id, idioma_id, formato_documento_id, numero_paginas, documento_digitalizado, nombre_archivo, ruta_archivo, fecha_digitalizacion, estado_catalogacion_id, catalogador_id, fecha_ingreso, revisor_id, fecha_revision, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (1, 1, 1, 'Informe Bioestratigráfico Acae-12', 4, '1978-05-12', 'Primer informe del pozo', 3, 1, 3, 28, true, 'Acae12_1978.pdf', 'D:\GeoTrace\Docs\Acae12_1978.pdf', '2025-08-15', 2, NULL, NULL, NULL, NULL, 'Original digitalizado')
    ON CONFLICT DO NOTHING;
INSERT INTO public.DOCUMENTO_ASOCIADO (documento_id, documento_familia_id, version_documento, titulo_documento, tipo_documento_asociado_id, fecha_documento, resumen, entidad_id, idioma_id, formato_documento_id, numero_paginas, documento_digitalizado, nombre_archivo, ruta_archivo, fecha_digitalizacion, estado_catalogacion_id, catalogador_id, fecha_ingreso, revisor_id, fecha_revision, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (2, 1, 2, 'Informe Bioestratigráfico Acae-12', 4, '1983-11-20', 'Versión ampliada', 3, 1, 3, 35, false, 'Acae12_1983.pdf', 'D:\GeoTrace\Docs\Acae12_1983.pdf', '2025-08-15', 2, NULL, NULL, NULL, NULL, 'Incluye nuevas edades')
    ON CONFLICT DO NOTHING;

-- DOCUMENTO_SECCION
INSERT INTO public.DOCUMENTO_SECCION (documento_seccion_id, documento_id, pagina_inicial, pagina_final, titulo_seccion, catalogador_id, fecha_ingreso, estado_catalogacion_id, revisor_id, fecha_revision, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (1, 1, 12, 18, 'Bioestratigrafía Acae-12', NULL, NULL, NULL, NULL, NULL, 'Incluye especies marcadoras')
    ON CONFLICT DO NOTHING;
INSERT INTO public.DOCUMENTO_SECCION (documento_seccion_id, documento_id, pagina_inicial, pagina_final, titulo_seccion, catalogador_id, fecha_ingreso, estado_catalogacion_id, revisor_id, fecha_revision, observaciones)
    OVERRIDING SYSTEM VALUE VALUES (2, 1, 19, 24, 'Correlación regional', NULL, NULL, NULL, NULL, NULL, 'Incluye sección estratigráfica')
    ON CONFLICT DO NOTHING;

-- ============================================================
-- Tablas omitidas en la semilla (con motivo)
-- ============================================================
-- ANOTACION_PLACA: not in clean seed list
-- DIC_AUTOR: not in clean seed list
-- DIC_UNI_LITO_ACTUALIZADA: not in clean seed list
-- DIC_UNI_LITO_NORMALIZADA: not in clean seed list
-- DIC_UNI_LITO_REPORTADA: not in clean seed list
-- DISPOSICION_MATERIAL: not in clean seed list
-- ESTADO_CONSERVACION_INICIAL: not in clean seed list
-- LOCALIZACION_ESPACIAL: not in clean seed list
-- LOCALIZACION_GEOGRAFICA: not in clean seed list
-- LOCALIZACION_GEOREFERENCIAL: not in clean seed list
-- MARCADO_PLACA: not in clean seed list
-- MUESTRA: not in clean seed list
-- MUESTRA_LECHO_MARINO: not in clean seed list
-- MUESTRA_POZO_ESTRATIGRAFICO: not in clean seed list
-- MUESTRA_POZO_EXPLORATORIO: not in clean seed list
-- MUESTRA_SUBSUELO: not in clean seed list
-- MUESTRA_SUPERFICIE: not in clean seed list
-- NUCLEO: not in clean seed list
-- PLACA: not in clean seed list
-- PLACA_TIPO: not in clean seed list
-- POSICION_ESTRATIGRAFICA: not in clean seed list
-- POZO: not in clean seed list
-- POZO_ESTRATIGRAFICO: not in clean seed list
-- POZO_EXPLORATORIO: not in clean seed list
-- POZO_REPORTADO: not in clean seed list
-- REL_BIOZONA_NORM_ACT: not in clean seed list
-- REL_BIOZONA_REP_NORM: not in clean seed list
-- REL_DOCUMENTO_AUTOR: not in clean seed list
-- REL_DOCUMENTO_DOCUMENTO: not in clean seed list
-- REL_DOCUMENTO_MUESTRA: not in clean seed list
-- REL_DOCUMENTO_PLACA: not in clean seed list
-- REL_DOCUMENTO_POZO: not in clean seed list
-- REL_DOCUMENTO_PROYECTO: not in clean seed list
-- REL_DOCUMENTO_SECCION_ESTRATIGR: not in clean seed list
-- REL_EDAD_NORM_ACT: not in clean seed list
-- REL_EDAD_REP_NORM: not in clean seed list
-- REL_MUESTRA_BIOZONA_REPORTADA: not in clean seed list
-- REL_MUESTRA_DESCRIPCION_LITO: not in clean seed list
-- REL_MUESTRA_DESC_LITO_REP_NORM: not in clean seed list
-- REL_MUESTRA_EDAD_REPORTADA: not in clean seed list
-- REL_MUESTRA_ENTIDAD: not in clean seed list
-- REL_MUESTRA_FECHA_HISTORICA: not in clean seed list
-- REL_MUESTRA_PROYECTO: not in clean seed list
-- REL_MUESTRA_TAXON_REPORTADO: not in clean seed list
-- REL_MUESTRA_TRATAMIENTO: not in clean seed list
-- REL_MUESTRA_UNI_LITO_NORM_ACT: not in clean seed list
-- REL_MUESTRA_UNI_LITO_REPORTADA: not in clean seed list
-- REL_MUESTRA_UNI_LITO_REP_NORM: not in clean seed list
-- REL_PLACA_AUTOR: not in clean seed list
-- REL_PLACA_PLACA: not in clean seed list
-- REL_POZO_REPORTADO_POZO: not in clean seed list
-- REL_ROL_PERMISO: not in clean seed list
-- REL_TAXON_REP_NORM: not in clean seed list
-- SECCION_NUCLEO: not in clean seed list
-- UBICACION_FISICA: not in clean seed list

-- ============================================================
-- Hojas vacías (solo encabezado)
-- ============================================================
-- CAT_DEPARTAMENTO: sin filas de datos
-- CAT_MUNICIPIO: sin filas de datos
-- CAT_PAIS: sin filas de datos

COMMIT;
