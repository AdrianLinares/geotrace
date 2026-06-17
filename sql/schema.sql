-- Geotrace — Rediseño completo de la base de datos
-- Fase 1: Fundamentos (RBAC, catálogos base y control de versión del esquema)
-- Este archivo es destructivo: elimina las tablas heredadas antes de crear las nuevas.
-- Ejecutar en una transacción con privilegios suficientes para crear objetos en public y referenciar auth.users.

BEGIN;

-- ============================================================
-- Limpieza de tablas heredadas del esquema anterior
-- ============================================================
DROP TABLE IF EXISTS public.pozo_empresa CASCADE;
DROP TABLE IF EXISTS public.pozo CASCADE;
DROP TABLE IF EXISTS public.dic_contrato CASCADE;
DROP TABLE IF EXISTS public.dic_campo CASCADE;
DROP TABLE IF EXISTS public.dic_cuenca CASCADE;
DROP TABLE IF EXISTS public.auditoria_cambios CASCADE;
DROP TABLE IF EXISTS public.sinonimo_edad CASCADE;
DROP TABLE IF EXISTS public.dic_edad CASCADE;
DROP TABLE IF EXISTS public.sinonimo_biozona CASCADE;
DROP TABLE IF EXISTS public.dic_biozona CASCADE;
DROP TABLE IF EXISTS public.sinonimo_unidad_lito CASCADE;
DROP TABLE IF EXISTS public.dic_unidad_lito CASCADE;
DROP TABLE IF EXISTS public.fuente_dato CASCADE;
DROP TABLE IF EXISTS public.estado_conservacion CASCADE;
DROP TABLE IF EXISTS public.disposicion_material CASCADE;
DROP TABLE IF EXISTS public.microfauna CASCADE;
DROP TABLE IF EXISTS public.geologia CASCADE;
DROP TABLE IF EXISTS public.muestra_empresa CASCADE;
DROP TABLE IF EXISTS public.muestra CASCADE;
DROP TABLE IF EXISTS public.nota_manuscrita CASCADE;
DROP TABLE IF EXISTS public.marcado_placa CASCADE;
DROP TABLE IF EXISTS public.placa CASCADE;
DROP TABLE IF EXISTS public.ubicacion_fisica CASCADE;
DROP TABLE IF EXISTS public.mueble CASCADE;
DROP TABLE IF EXISTS public.empresa CASCADE;
DROP TABLE IF EXISTS public.persona CASCADE;
DROP TABLE IF EXISTS public.coleccion CASCADE;

-- ============================================================
-- Control de versión del esquema
-- ============================================================
DROP TABLE IF EXISTS public.schema_version CASCADE;

CREATE TABLE public.schema_version (
    version    integer PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.schema_version IS 'Registra la versión aplicada del esquema y su fecha de aplicación.';

-- ============================================================
-- PERSONA: usuarios del sistema vinculados a Supabase Auth
-- ============================================================
DROP TABLE IF EXISTS public.PERSONA CASCADE;

CREATE TABLE public.PERSONA (
    persona_id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    auth_user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    codigo_persona    varchar(255) NOT NULL,
    nombre            varchar(255) NOT NULL,
    apellidos         varchar(255) NOT NULL,
    correo            varchar(255) NOT NULL,
    activo            boolean NOT NULL DEFAULT true,
    observaciones     text,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uq_persona_codigo_persona UNIQUE (codigo_persona),
    CONSTRAINT uq_persona_correo UNIQUE (correo),
    CONSTRAINT uq_persona_auth_user_id UNIQUE (auth_user_id)
);

COMMENT ON TABLE public.PERSONA IS 'Personas que interactúan con el catálogo; cada fila puede vincularse a un usuario de Supabase Auth.';
COMMENT ON COLUMN public.PERSONA.auth_user_id IS 'Referencia opcional a auth.users; habilita la resolución de roles vía auth.uid().';

CREATE INDEX idx_persona_auth_user_id ON public.PERSONA(auth_user_id);
CREATE INDEX idx_persona_correo ON public.PERSONA(correo);
CREATE INDEX idx_persona_codigo_persona ON public.PERSONA(codigo_persona);

-- ============================================================
-- CAT_ROL: roles jerárquicos del sistema
-- ============================================================
DROP TABLE IF EXISTS public.CAT_ROL CASCADE;

CREATE TABLE public.CAT_ROL (
    rol_id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre                varchar(255) NOT NULL,
    funcion               varchar(255),
    nivel_responsabilidad varchar(255),
    actividades           text,
    jerarquia             integer NOT NULL,

    CONSTRAINT uq_cat_rol_nombre UNIQUE (nombre),
    CONSTRAINT uq_cat_rol_jerarquia UNIQUE (jerarquia)
);

COMMENT ON TABLE public.CAT_ROL IS 'Catálogo de roles: Catalogador, Revisor, Curador y Administrador.';

-- ============================================================
-- REL_PERSONA_ROL: asignación muchos-a-muchas de roles a personas
-- ============================================================
DROP TABLE IF EXISTS public.REL_PERSONA_ROL CASCADE;

CREATE TABLE public.REL_PERSONA_ROL (
    rel_persona_rol_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    persona_id         bigint NOT NULL,
    codigo_persona     varchar(255),
    rol_id             bigint NOT NULL,
    fecha_inicio       timestamptz NOT NULL DEFAULT now(),
    fecha_fin          timestamptz,
    activo             boolean NOT NULL DEFAULT true,
    observaciones      text,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT fk_rel_persona_rol_persona
        FOREIGN KEY (persona_id) REFERENCES public.PERSONA(persona_id) ON DELETE CASCADE,
    CONSTRAINT fk_rel_persona_rol_rol
        FOREIGN KEY (rol_id) REFERENCES public.CAT_ROL(rol_id) ON DELETE CASCADE,
    CONSTRAINT chk_rel_persona_rol_fechas
        CHECK (fecha_fin IS NULL OR fecha_fin > fecha_inicio)
);

COMMENT ON TABLE public.REL_PERSONA_ROL IS 'Vínculo temporal entre personas y roles; permite múltiples roles por persona.';

CREATE INDEX idx_rel_persona_rol_persona_id ON public.REL_PERSONA_ROL(persona_id);
CREATE INDEX idx_rel_persona_rol_rol_id ON public.REL_PERSONA_ROL(rol_id);

-- ============================================================
-- CAT_PERMISO: permisos individuales del sistema
-- ============================================================
DROP TABLE IF EXISTS public.CAT_PERMISO CASCADE;

CREATE TABLE public.CAT_PERMISO (
    permiso_id       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre           varchar(255) NOT NULL,
    descripcion      text,
    modulo           varchar(255) NOT NULL,
    nivel_criticidad text,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uq_cat_permiso_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_PERMISO IS 'Catálogo de permisos agrupados por módulo; se relacionan con roles vía REL_ROL_PERMISO.';

-- ============================================================
-- REL_ROL_PERMISO: asignación de permisos a roles
-- ============================================================
DROP TABLE IF EXISTS public.REL_ROL_PERMISO CASCADE;

CREATE TABLE public.REL_ROL_PERMISO (
    rel_rol_permiso_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    rol_id             bigint NOT NULL,
    permiso_id         bigint NOT NULL,
    activo             boolean NOT NULL DEFAULT true,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT fk_rel_rol_permiso_rol
        FOREIGN KEY (rol_id) REFERENCES public.CAT_ROL(rol_id) ON DELETE CASCADE,
    CONSTRAINT fk_rel_rol_permiso_permiso
        FOREIGN KEY (permiso_id) REFERENCES public.CAT_PERMISO(permiso_id) ON DELETE CASCADE,
    CONSTRAINT uq_rel_rol_permiso_rol_permiso UNIQUE (rol_id, permiso_id)
);

COMMENT ON TABLE public.REL_ROL_PERMISO IS 'Matriz de permisos efectivos por rol.';

CREATE INDEX idx_rel_rol_permiso_rol_id ON public.REL_ROL_PERMISO(rol_id);
CREATE INDEX idx_rel_rol_permiso_permiso_id ON public.REL_ROL_PERMISO(permiso_id);

-- ============================================================
-- CAT_COLECCION: colecciones científicas
-- ============================================================
DROP TABLE IF EXISTS public.CAT_COLECCION CASCADE;

CREATE TABLE public.CAT_COLECCION (
    coleccion_id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_coleccion    varchar(255) NOT NULL,
    nombre_coleccion    varchar(255) NOT NULL,
    institucion         varchar(255),
    responsable_coleccion varchar(255),
    descripcion         text,
    estado_coleccion    varchar(255) NOT NULL DEFAULT 'Activa',
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uq_cat_coleccion_codigo UNIQUE (codigo_coleccion),
    CONSTRAINT uq_cat_coleccion_nombre UNIQUE (nombre_coleccion),
    CONSTRAINT chk_cat_coleccion_estado
        CHECK (estado_coleccion IN ('Activa', 'Cerrada'))
);

COMMENT ON TABLE public.CAT_COLECCION IS 'Colecciones disponibles para catalogación.';

CREATE INDEX idx_cat_coleccion_estado ON public.CAT_COLECCION(estado_coleccion);

-- ============================================================
-- CAT_ESTADO_CATALOGACION: estados del flujo de catalogación
-- ============================================================
DROP TABLE IF EXISTS public.CAT_ESTADO_CATALOGACION CASCADE;

CREATE TABLE public.CAT_ESTADO_CATALOGACION (
    estado_catalogacion_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    estado                 varchar(255) NOT NULL,
    significado            varchar(255) NOT NULL,
    quien                  varchar(255),
    created_at             timestamptz NOT NULL DEFAULT now(),
    updated_at             timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uq_cat_estado_catalogacion_estado UNIQUE (estado)
);

COMMENT ON TABLE public.CAT_ESTADO_CATALOGACION IS 'Catálogo de estados del ciclo de catalogación.';

-- ============================================================
-- CAT_ESTADO_REVISION: estados del flujo de revisión
-- ============================================================
DROP TABLE IF EXISTS public.CAT_ESTADO_REVISION CASCADE;

CREATE TABLE public.CAT_ESTADO_REVISION (
    estado_revision_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre             varchar(255) NOT NULL,
    significado        varchar(255) NOT NULL,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uq_cat_estado_revision_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_ESTADO_REVISION IS 'Catálogo de estados del ciclo de revisión.';

-- ============================================================
-- Datos de referencia (seed)
-- ============================================================

-- Roles
INSERT INTO public.CAT_ROL (rol_id, nombre, funcion, nivel_responsabilidad, actividades, jerarquia)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Catalogador', 'Ingresa y actualiza registros científicos', 'Básico', 'Crear y editar placas, muestras, pozos propios', 1),
    (2, 'Revisor', 'Revisa y valida registros científicos', 'Intermedio', 'Actualizar estados de revisión y campos de revisión', 2),
    (3, 'Curador', 'Gestiona catálogos y vocabularios controlados', 'Avanzado', 'Administrar catálogos, diccionarios y nomenclatura', 3),
    (4, 'Administrador', 'Gestión de usuarios, roles y configuración', 'Total', 'Administrar personas, roles, permisos y datos sensibles', 4)
ON CONFLICT (nombre) DO NOTHING;

-- Estados de catalogación
INSERT INTO public.CAT_ESTADO_CATALOGACION (estado_catalogacion_id, estado, significado, quien)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 'En proceso', 'Registro en captura inicial', 'Catalogador'),
    (2, 'Incompleto', 'Faltan datos obligatorios por completar', 'Catalogador'),
    (3, 'En revisión', 'Registro enviado a revisión', 'Catalogador / Revisor'),
    (4, 'Validado', 'Registro revisado y aceptado', 'Revisor'),
    (5, 'Cerrado', 'Registro finalizado sin modificaciones pendientes', 'Revisor / Curador')
ON CONFLICT (estado) DO NOTHING;

-- Estados de revisión
INSERT INTO public.CAT_ESTADO_REVISION (nombre, significado)
VALUES
    ('Pendiente', 'Aún no se inicia la revisión'),
    ('En revisión', 'Revisión en curso'),
    ('Aprobado', 'Revisión aprobada'),
    ('Rechazado', 'Revisión rechazada; requiere correcciones')
ON CONFLICT (nombre) DO NOTHING;

-- Versión aplicada del esquema
INSERT INTO public.schema_version (version, applied_at)
VALUES (1, now())
ON CONFLICT (version) DO UPDATE SET applied_at = EXCLUDED.applied_at;

-- ============================================================
-- Fase 1 (continuación): catálogos de autoría y helper de triggers
-- ============================================================

-- ============================================================
-- set_updated_at(): función de trigger para actualizar updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.set_updated_at() IS 'Trigger genérico que actualiza la columna updated_at con la fecha/hora actual.';

-- ============================================================
-- CAT_TIPO_AUTOR
-- ============================================================
DROP TABLE IF EXISTS public.CAT_TIPO_AUTOR CASCADE;

CREATE TABLE public.CAT_TIPO_AUTOR (
    tipo_autor_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    descripcion text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_tipo_autor PRIMARY KEY (tipo_autor_id),
    CONSTRAINT uq_cat_tipo_autor_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_TIPO_AUTOR IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_tipo_autor_tipo_autor_id ON public.CAT_TIPO_AUTOR(tipo_autor_id);

-- ============================================================
-- CAT_ROL_AUTOR
-- ============================================================
DROP TABLE IF EXISTS public.CAT_ROL_AUTOR CASCADE;

CREATE TABLE public.CAT_ROL_AUTOR (
    rol_autor_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    codigo_rol_autor varchar(255),
    nombre varchar(255),
    descripcion text,
    activo boolean,
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_rol_autor PRIMARY KEY (rol_autor_id),
    CONSTRAINT uq_cat_rol_autor_codigo_rol_autor UNIQUE (codigo_rol_autor)
);

COMMENT ON TABLE public.CAT_ROL_AUTOR IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_rol_autor_rol_autor_id ON public.CAT_ROL_AUTOR(rol_autor_id);

-- ============================================================
-- CAT_ESPECIALIDAD
-- ============================================================
DROP TABLE IF EXISTS public.CAT_ESPECIALIDAD CASCADE;

CREATE TABLE public.CAT_ESPECIALIDAD (
    especialidad_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre_especialidad varchar(100),
    descripcion text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_especialidad PRIMARY KEY (especialidad_id),
    CONSTRAINT uq_cat_especialidad_nombre_especialidad UNIQUE (nombre_especialidad)
);

COMMENT ON TABLE public.CAT_ESPECIALIDAD IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_especialidad_especialidad_id ON public.CAT_ESPECIALIDAD(especialidad_id);

-- ============================================================
-- CAT_ENTIDAD
-- ============================================================
DROP TABLE IF EXISTS public.CAT_ENTIDAD CASCADE;

CREATE TABLE public.CAT_ENTIDAD (
    entidad_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    codigo_entidad varchar(255),
    nombre_entidad varchar(255),
    tipo_entidad varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_entidad PRIMARY KEY (entidad_id),
    CONSTRAINT uq_cat_entidad_codigo_entidad UNIQUE (codigo_entidad)
);

COMMENT ON TABLE public.CAT_ENTIDAD IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_entidad_entidad_id ON public.CAT_ENTIDAD(entidad_id);

-- ============================================================
-- DIC_AUTOR
-- ============================================================
DROP TABLE IF EXISTS public.DIC_AUTOR CASCADE;

CREATE TABLE public.DIC_AUTOR (
    autor_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    codigo_autor varchar(255),
    nombre_autor varchar(255),
    tipo_autor_id bigint,
    entidad_id bigint,
    especialidad_id bigint,
    observaciones text,
    CONSTRAINT pk_dic_autor PRIMARY KEY (autor_id),
    CONSTRAINT fk_dic_autor_tipo_autor_id FOREIGN KEY (tipo_autor_id) REFERENCES public.CAT_TIPO_AUTOR(tipo_autor_id) ON DELETE SET NULL,
    CONSTRAINT fk_dic_autor_entidad_id FOREIGN KEY (entidad_id) REFERENCES public.CAT_ENTIDAD(entidad_id) ON DELETE SET NULL,
    CONSTRAINT fk_dic_autor_especialidad_id FOREIGN KEY (especialidad_id) REFERENCES public.CAT_ESPECIALIDAD(especialidad_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.DIC_AUTOR IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_dic_autor_tipo_autor_id ON public.DIC_AUTOR(tipo_autor_id);
CREATE INDEX idx_dic_autor_entidad_id ON public.DIC_AUTOR(entidad_id);
CREATE INDEX idx_dic_autor_especialidad_id ON public.DIC_AUTOR(especialidad_id);

-- ============================================================
-- CAT_MATERIAL_MUEBLE
-- ============================================================
DROP TABLE IF EXISTS public.CAT_MATERIAL_MUEBLE CASCADE;

CREATE TABLE public.CAT_MATERIAL_MUEBLE (
    material_mueble_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    descripcion text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_material_mueble PRIMARY KEY (material_mueble_id),
    CONSTRAINT uq_cat_material_mueble_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_MATERIAL_MUEBLE IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_material_mueble_material_mueble_id ON public.CAT_MATERIAL_MUEBLE(material_mueble_id);

-- ============================================================
-- CAT_COLOR_MUEBLE
-- ============================================================
DROP TABLE IF EXISTS public.CAT_COLOR_MUEBLE CASCADE;

CREATE TABLE public.CAT_COLOR_MUEBLE (
    color_mueble_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_color_mueble PRIMARY KEY (color_mueble_id),
    CONSTRAINT uq_cat_color_mueble_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_COLOR_MUEBLE IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_color_mueble_color_mueble_id ON public.CAT_COLOR_MUEBLE(color_mueble_id);

-- ============================================================
-- CAT_SECCION
-- ============================================================
DROP TABLE IF EXISTS public.CAT_SECCION CASCADE;

CREATE TABLE public.CAT_SECCION (
    seccion_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    codigo_seccion varchar(255),
    nombre varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_seccion PRIMARY KEY (seccion_id),
    CONSTRAINT uq_cat_seccion_codigo_seccion UNIQUE (codigo_seccion)
);

COMMENT ON TABLE public.CAT_SECCION IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_seccion_seccion_id ON public.CAT_SECCION(seccion_id);

-- ============================================================
-- CAT_ZONA
-- ============================================================
DROP TABLE IF EXISTS public.CAT_ZONA CASCADE;

CREATE TABLE public.CAT_ZONA (
    zona_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    codigo_zona varchar(255),
    nombre varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_zona PRIMARY KEY (zona_id),
    CONSTRAINT uq_cat_zona_codigo_zona UNIQUE (codigo_zona)
);

COMMENT ON TABLE public.CAT_ZONA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_zona_zona_id ON public.CAT_ZONA(zona_id);

-- ============================================================
-- CAT_MATERIAL_BANDEJA
-- ============================================================
DROP TABLE IF EXISTS public.CAT_MATERIAL_BANDEJA CASCADE;

CREATE TABLE public.CAT_MATERIAL_BANDEJA (
    material_bandeja_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    codigo_material_bandeja varchar(255),
    nombre varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_material_bandeja PRIMARY KEY (material_bandeja_id),
    CONSTRAINT uq_cat_material_bandeja_codigo_material_bandeja UNIQUE (codigo_material_bandeja)
);

COMMENT ON TABLE public.CAT_MATERIAL_BANDEJA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_material_bandeja_material_bandeja_id ON public.CAT_MATERIAL_BANDEJA(material_bandeja_id);

-- ============================================================
-- CAT_COLUMNA_BANDEJA
-- ============================================================
DROP TABLE IF EXISTS public.CAT_COLUMNA_BANDEJA CASCADE;

CREATE TABLE public.CAT_COLUMNA_BANDEJA (
    columna_bandeja_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    codigo_columna varchar(255),
    nombre varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_columna_bandeja PRIMARY KEY (columna_bandeja_id),
    CONSTRAINT uq_cat_columna_bandeja_codigo_columna UNIQUE (codigo_columna)
);

COMMENT ON TABLE public.CAT_COLUMNA_BANDEJA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_columna_bandeja_columna_bandeja_id ON public.CAT_COLUMNA_BANDEJA(columna_bandeja_id);

-- ============================================================
-- CAT_CODIGO_CAVIDAD
-- ============================================================
DROP TABLE IF EXISTS public.CAT_CODIGO_CAVIDAD CASCADE;

CREATE TABLE public.CAT_CODIGO_CAVIDAD (
    codigo_cavidad_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    codigo_cavidad varchar(255),
    tipo_cavidad varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_codigo_cavidad PRIMARY KEY (codigo_cavidad_id),
    CONSTRAINT uq_cat_codigo_cavidad_codigo_cavidad UNIQUE (codigo_cavidad)
);

COMMENT ON TABLE public.CAT_CODIGO_CAVIDAD IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_codigo_cavidad_codigo_cavidad_id ON public.CAT_CODIGO_CAVIDAD(codigo_cavidad_id);

-- ============================================================
-- CAT_MUEBLE
-- ============================================================
DROP TABLE IF EXISTS public.CAT_MUEBLE CASCADE;

CREATE TABLE public.CAT_MUEBLE (
    mueble_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    codigo_mueble varchar(255),
    material_mueble_id bigint,
    color_mueble_id bigint,
    tiene_secciones varchar(255),
    tiene_zonas varchar(255),
    capacidad_bandejas integer,
    capacidad_posiciones integer,
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_mueble PRIMARY KEY (mueble_id),
    CONSTRAINT fk_cat_mueble_material_mueble_id FOREIGN KEY (material_mueble_id) REFERENCES public.CAT_MATERIAL_MUEBLE(material_mueble_id) ON DELETE SET NULL,
    CONSTRAINT fk_cat_mueble_color_mueble_id FOREIGN KEY (color_mueble_id) REFERENCES public.CAT_COLOR_MUEBLE(color_mueble_id) ON DELETE SET NULL,
    CONSTRAINT uq_cat_mueble_codigo_mueble UNIQUE (codigo_mueble),
    CONSTRAINT chk_cat_mueble_capacidad_bandejas CHECK (capacidad_bandejas >= 0),
    CONSTRAINT chk_cat_mueble_capacidad_posiciones CHECK (capacidad_posiciones >= 0)
);

COMMENT ON TABLE public.CAT_MUEBLE IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_mueble_material_mueble_id ON public.CAT_MUEBLE(material_mueble_id);
CREATE INDEX idx_cat_mueble_color_mueble_id ON public.CAT_MUEBLE(color_mueble_id);
CREATE INDEX idx_cat_mueble_mueble_id ON public.CAT_MUEBLE(mueble_id);

-- ============================================================
-- CAT_CUENCA
-- ============================================================
DROP TABLE IF EXISTS public.CAT_CUENCA CASCADE;

CREATE TABLE public.CAT_CUENCA (
    cuenca_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre_cuenca varchar(255),
    cuenca_abrev varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_cuenca PRIMARY KEY (cuenca_id),
    CONSTRAINT uq_cat_cuenca_nombre_cuenca UNIQUE (nombre_cuenca)
);

COMMENT ON TABLE public.CAT_CUENCA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_cuenca_cuenca_id ON public.CAT_CUENCA(cuenca_id);

-- ============================================================
-- CAT_UNIDAD_MEDIDA
-- ============================================================
DROP TABLE IF EXISTS public.CAT_UNIDAD_MEDIDA CASCADE;

CREATE TABLE public.CAT_UNIDAD_MEDIDA (
    unidad_medida_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    unidad varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_unidad_medida PRIMARY KEY (unidad_medida_id)
);

COMMENT ON TABLE public.CAT_UNIDAD_MEDIDA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_unidad_medida_unidad_medida_id ON public.CAT_UNIDAD_MEDIDA(unidad_medida_id);

-- ============================================================
-- CAT_TIPO_MUESTRA_SUBSUELO
-- ============================================================
DROP TABLE IF EXISTS public.CAT_TIPO_MUESTRA_SUBSUELO CASCADE;

CREATE TABLE public.CAT_TIPO_MUESTRA_SUBSUELO (
    tipo_muestra_subsuelo_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_tipo_muestra_subsuelo PRIMARY KEY (tipo_muestra_subsuelo_id),
    CONSTRAINT uq_cat_tipo_muestra_subsuelo_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_TIPO_MUESTRA_SUBSUELO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_tipo_muestra_subsuelo_tipo_muestra_subsuelo_id ON public.CAT_TIPO_MUESTRA_SUBSUELO(tipo_muestra_subsuelo_id);

-- ============================================================
-- CAT_TIPO_INTERVALO_MUESTRA
-- ============================================================
DROP TABLE IF EXISTS public.CAT_TIPO_INTERVALO_MUESTRA CASCADE;

CREATE TABLE public.CAT_TIPO_INTERVALO_MUESTRA (
    tipo_intervalo_muestra_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    tipo varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_tipo_intervalo_muestra PRIMARY KEY (tipo_intervalo_muestra_id)
);

COMMENT ON TABLE public.CAT_TIPO_INTERVALO_MUESTRA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_tipo_intervalo_muestra_tipo_intervalo_muestra_id ON public.CAT_TIPO_INTERVALO_MUESTRA(tipo_intervalo_muestra_id);

-- ============================================================
-- CAT_ORIGEN_MUESTRA
-- ============================================================
DROP TABLE IF EXISTS public.CAT_ORIGEN_MUESTRA CASCADE;

CREATE TABLE public.CAT_ORIGEN_MUESTRA (
    origen_muestra_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    significado varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_origen_muestra PRIMARY KEY (origen_muestra_id),
    CONSTRAINT uq_cat_origen_muestra_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_ORIGEN_MUESTRA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_origen_muestra_origen_muestra_id ON public.CAT_ORIGEN_MUESTRA(origen_muestra_id);

-- ============================================================
-- CAT_METODO_ADQUISICION
-- ============================================================
DROP TABLE IF EXISTS public.CAT_METODO_ADQUISICION CASCADE;

CREATE TABLE public.CAT_METODO_ADQUISICION (
    metodo_adquisicion_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    origen_muestra_id bigint,
    codigo_metodo_adquisicion varchar(255),
    nombre varchar(255),
    tipo varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_metodo_adquisicion PRIMARY KEY (metodo_adquisicion_id),
    CONSTRAINT fk_cat_metodo_adquisicion_origen_muestra_id FOREIGN KEY (origen_muestra_id) REFERENCES public.CAT_ORIGEN_MUESTRA(origen_muestra_id) ON DELETE SET NULL,
    CONSTRAINT uq_cat_metodo_adquisicion_codigo_metodo_adquisicion UNIQUE (codigo_metodo_adquisicion)
);

COMMENT ON TABLE public.CAT_METODO_ADQUISICION IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_metodo_adquisicion_origen_muestra_id ON public.CAT_METODO_ADQUISICION(origen_muestra_id);
CREATE INDEX idx_cat_metodo_adquisicion_metodo_adquisicion_id ON public.CAT_METODO_ADQUISICION(metodo_adquisicion_id);

-- ============================================================
-- CAT_COLECTOR
-- ============================================================
DROP TABLE IF EXISTS public.CAT_COLECTOR CASCADE;

CREATE TABLE public.CAT_COLECTOR (
    colector_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    iniciales varchar(255),
    nombre varchar(255),
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_colector PRIMARY KEY (colector_id),
    CONSTRAINT uq_cat_colector_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_COLECTOR IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_colector_colector_id ON public.CAT_COLECTOR(colector_id);

-- ============================================================
-- CAT_PROYECTO
-- ============================================================
DROP TABLE IF EXISTS public.CAT_PROYECTO CASCADE;

CREATE TABLE public.CAT_PROYECTO (
    proyecto_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    entidad_id bigint,
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_proyecto PRIMARY KEY (proyecto_id),
    CONSTRAINT fk_cat_proyecto_entidad_id FOREIGN KEY (entidad_id) REFERENCES public.CAT_ENTIDAD(entidad_id) ON DELETE SET NULL,
    CONSTRAINT uq_cat_proyecto_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_PROYECTO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_proyecto_entidad_id ON public.CAT_PROYECTO(entidad_id);
CREATE INDEX idx_cat_proyecto_proyecto_id ON public.CAT_PROYECTO(proyecto_id);

-- ============================================================
-- CAT_TRATAMIENTO_MUESTRA
-- ============================================================
DROP TABLE IF EXISTS public.CAT_TRATAMIENTO_MUESTRA CASCADE;

CREATE TABLE public.CAT_TRATAMIENTO_MUESTRA (
    tratamiento_muestra_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    descripcion text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_tratamiento_muestra PRIMARY KEY (tratamiento_muestra_id),
    CONSTRAINT uq_cat_tratamiento_muestra_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_TRATAMIENTO_MUESTRA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_tratamiento_muestra_tratamiento_muestra_id ON public.CAT_TRATAMIENTO_MUESTRA(tratamiento_muestra_id);

-- ============================================================
-- CAT_TIPO_FECHA_HISTORICA
-- ============================================================
DROP TABLE IF EXISTS public.CAT_TIPO_FECHA_HISTORICA CASCADE;

CREATE TABLE public.CAT_TIPO_FECHA_HISTORICA (
    tipo_fecha_historica_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    descripcion text,
    activo boolean,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_tipo_fecha_historica PRIMARY KEY (tipo_fecha_historica_id),
    CONSTRAINT uq_cat_tipo_fecha_historica_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_TIPO_FECHA_HISTORICA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_tipo_fecha_historica_tipo_fecha_historica_id ON public.CAT_TIPO_FECHA_HISTORICA(tipo_fecha_historica_id);

-- ============================================================
-- CAT_FECHA_HISTORICA
-- ============================================================
DROP TABLE IF EXISTS public.CAT_FECHA_HISTORICA CASCADE;

CREATE TABLE public.CAT_FECHA_HISTORICA (
    fecha_historica_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    fecha_texto_original varchar(255),
    fecha_interpretada timestamptz,
    tipo_fecha_historica_id bigint,
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_fecha_historica PRIMARY KEY (fecha_historica_id),
    CONSTRAINT fk_cat_fecha_historica_tipo_fecha_historica_id FOREIGN KEY (tipo_fecha_historica_id) REFERENCES public.CAT_TIPO_FECHA_HISTORICA(tipo_fecha_historica_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.CAT_FECHA_HISTORICA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_fecha_historica_tipo_fecha_historica_id ON public.CAT_FECHA_HISTORICA(tipo_fecha_historica_id);
CREATE INDEX idx_cat_fecha_historica_fecha_historica_id ON public.CAT_FECHA_HISTORICA(fecha_historica_id);

-- ============================================================
-- CAT_DISENO_PLACA
-- ============================================================
DROP TABLE IF EXISTS public.CAT_DISENO_PLACA CASCADE;

CREATE TABLE public.CAT_DISENO_PLACA (
    diseno_placa_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_diseno_placa PRIMARY KEY (diseno_placa_id),
    CONSTRAINT uq_cat_diseno_placa_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_DISENO_PLACA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_diseno_placa_diseno_placa_id ON public.CAT_DISENO_PLACA(diseno_placa_id);

-- ============================================================
-- CAT_CLASE_PLACA
-- ============================================================
DROP TABLE IF EXISTS public.CAT_CLASE_PLACA CASCADE;

CREATE TABLE public.CAT_CLASE_PLACA (
    clase_placa_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    codigo_clase varchar(255),
    nombre varchar(255),
    definicion varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_clase_placa PRIMARY KEY (clase_placa_id),
    CONSTRAINT uq_cat_clase_placa_codigo_clase UNIQUE (codigo_clase)
);

COMMENT ON TABLE public.CAT_CLASE_PLACA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_clase_placa_clase_placa_id ON public.CAT_CLASE_PLACA(clase_placa_id);

-- ============================================================
-- CAT_ETAPA_USO_PLACA
-- ============================================================
DROP TABLE IF EXISTS public.CAT_ETAPA_USO_PLACA CASCADE;

CREATE TABLE public.CAT_ETAPA_USO_PLACA (
    etapa_uso_placa_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    codigo_etapa_uso_placa varchar(255),
    nombre varchar(255),
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_etapa_uso_placa PRIMARY KEY (etapa_uso_placa_id),
    CONSTRAINT uq_cat_etapa_uso_placa_codigo_etapa_uso_placa UNIQUE (codigo_etapa_uso_placa)
);

COMMENT ON TABLE public.CAT_ETAPA_USO_PLACA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_etapa_uso_placa_etapa_uso_placa_id ON public.CAT_ETAPA_USO_PLACA(etapa_uso_placa_id);

-- ============================================================
-- CAT_CONFIGURACION_CAVIDADES
-- ============================================================
DROP TABLE IF EXISTS public.CAT_CONFIGURACION_CAVIDADES CASCADE;

CREATE TABLE public.CAT_CONFIGURACION_CAVIDADES (
    configuracion_cavidades_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    diseno_placa_id bigint,
    total_cavidades bigint,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_configuracion_cavidades PRIMARY KEY (configuracion_cavidades_id),
    CONSTRAINT fk_cat_configuracion_cavidades_diseno_placa_id FOREIGN KEY (diseno_placa_id) REFERENCES public.CAT_DISENO_PLACA(diseno_placa_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.CAT_CONFIGURACION_CAVIDADES IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_configuracion_cavidades_diseno_placa_id ON public.CAT_CONFIGURACION_CAVIDADES(diseno_placa_id);
CREATE INDEX idx_cat_configuracion_cavidades_configuracion_cavidades_id ON public.CAT_CONFIGURACION_CAVIDADES(configuracion_cavidades_id);

-- ============================================================
-- CAT_MATERIAL_PLACA
-- ============================================================
DROP TABLE IF EXISTS public.CAT_MATERIAL_PLACA CASCADE;

CREATE TABLE public.CAT_MATERIAL_PLACA (
    material_placa_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_material_placa PRIMARY KEY (material_placa_id),
    CONSTRAINT uq_cat_material_placa_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_MATERIAL_PLACA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_material_placa_material_placa_id ON public.CAT_MATERIAL_PLACA(material_placa_id);

-- ============================================================
-- CAT_COLOR_PLACA
-- ============================================================
DROP TABLE IF EXISTS public.CAT_COLOR_PLACA CASCADE;

CREATE TABLE public.CAT_COLOR_PLACA (
    color_placa_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_color_placa PRIMARY KEY (color_placa_id),
    CONSTRAINT uq_cat_color_placa_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_COLOR_PLACA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_color_placa_color_placa_id ON public.CAT_COLOR_PLACA(color_placa_id);

-- ============================================================
-- CAT_CONFIGURACION_REJILLA
-- ============================================================
DROP TABLE IF EXISTS public.CAT_CONFIGURACION_REJILLA CASCADE;

CREATE TABLE public.CAT_CONFIGURACION_REJILLA (
    configuracion_rejilla_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    numero_subdivisiones bigint,
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_configuracion_rejilla PRIMARY KEY (configuracion_rejilla_id),
    CONSTRAINT uq_cat_configuracion_rejilla_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_CONFIGURACION_REJILLA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_configuracion_rejilla_configuracion_rejilla_id ON public.CAT_CONFIGURACION_REJILLA(configuracion_rejilla_id);

-- ============================================================
-- CAT_TIPO_PROTECCION
-- ============================================================
DROP TABLE IF EXISTS public.CAT_TIPO_PROTECCION CASCADE;

CREATE TABLE public.CAT_TIPO_PROTECCION (
    tipo_proteccion_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_tipo_proteccion PRIMARY KEY (tipo_proteccion_id),
    CONSTRAINT uq_cat_tipo_proteccion_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_TIPO_PROTECCION IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_tipo_proteccion_tipo_proteccion_id ON public.CAT_TIPO_PROTECCION(tipo_proteccion_id);

-- ============================================================
-- CAT_SISTEMA_ENSAMBLE
-- ============================================================
DROP TABLE IF EXISTS public.CAT_SISTEMA_ENSAMBLE CASCADE;

CREATE TABLE public.CAT_SISTEMA_ENSAMBLE (
    sistema_ensamble_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_sistema_ensamble PRIMARY KEY (sistema_ensamble_id),
    CONSTRAINT uq_cat_sistema_ensamble_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_SISTEMA_ENSAMBLE IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_sistema_ensamble_sistema_ensamble_id ON public.CAT_SISTEMA_ENSAMBLE(sistema_ensamble_id);

-- ============================================================
-- CAT_CLASE_P_TIPO
-- ============================================================
DROP TABLE IF EXISTS public.CAT_CLASE_P_TIPO CASCADE;

CREATE TABLE public.CAT_CLASE_P_TIPO (
    clase_ptipo_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    descripcion text,
    activo boolean,
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_clase_p_tipo PRIMARY KEY (clase_ptipo_id),
    CONSTRAINT uq_cat_clase_p_tipo_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_CLASE_P_TIPO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_clase_p_tipo_clase_ptipo_id ON public.CAT_CLASE_P_TIPO(clase_ptipo_id);

-- ============================================================
-- CAT_POSICION_ANOTACION
-- ============================================================
DROP TABLE IF EXISTS public.CAT_POSICION_ANOTACION CASCADE;

CREATE TABLE public.CAT_POSICION_ANOTACION (
    posicion_anotacion_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_posicion_anotacion PRIMARY KEY (posicion_anotacion_id),
    CONSTRAINT uq_cat_posicion_anotacion_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_POSICION_ANOTACION IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_posicion_anotacion_posicion_anotacion_id ON public.CAT_POSICION_ANOTACION(posicion_anotacion_id);

-- ============================================================
-- CAT_TIPO_RELACION_PLACA
-- ============================================================
DROP TABLE IF EXISTS public.CAT_TIPO_RELACION_PLACA CASCADE;

CREATE TABLE public.CAT_TIPO_RELACION_PLACA (
    tipo_relacion_placa_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    descripcion text,
    activo boolean,
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_tipo_relacion_placa PRIMARY KEY (tipo_relacion_placa_id),
    CONSTRAINT uq_cat_tipo_relacion_placa_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_TIPO_RELACION_PLACA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_tipo_relacion_placa_tipo_relacion_placa_id ON public.CAT_TIPO_RELACION_PLACA(tipo_relacion_placa_id);

-- ============================================================
-- CAT_ESTADO_MATERIAL
-- ============================================================
DROP TABLE IF EXISTS public.CAT_ESTADO_MATERIAL CASCADE;

CREATE TABLE public.CAT_ESTADO_MATERIAL (
    estado_material_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    estado_material varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_estado_material PRIMARY KEY (estado_material_id)
);

COMMENT ON TABLE public.CAT_ESTADO_MATERIAL IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_estado_material_estado_material_id ON public.CAT_ESTADO_MATERIAL(estado_material_id);

-- ============================================================
-- CAT_RECOBRO_CUALITATIVO
-- ============================================================
DROP TABLE IF EXISTS public.CAT_RECOBRO_CUALITATIVO CASCADE;

CREATE TABLE public.CAT_RECOBRO_CUALITATIVO (
    recobro_cualitativo_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    recobro_cualitativo varchar(255),
    orden_visual bigint,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_recobro_cualitativo PRIMARY KEY (recobro_cualitativo_id)
);

COMMENT ON TABLE public.CAT_RECOBRO_CUALITATIVO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_recobro_cualitativo_recobro_cualitativo_id ON public.CAT_RECOBRO_CUALITATIVO(recobro_cualitativo_id);

-- ============================================================
-- CAT_VIDRIO_ESTADO
-- ============================================================
DROP TABLE IF EXISTS public.CAT_VIDRIO_ESTADO CASCADE;

CREATE TABLE public.CAT_VIDRIO_ESTADO (
    vidrio_estado_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    vidrio_estado varchar(255),
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_vidrio_estado PRIMARY KEY (vidrio_estado_id)
);

COMMENT ON TABLE public.CAT_VIDRIO_ESTADO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_vidrio_estado_vidrio_estado_id ON public.CAT_VIDRIO_ESTADO(vidrio_estado_id);

-- ============================================================
-- CAT_ACETATO_ESTADO
-- ============================================================
DROP TABLE IF EXISTS public.CAT_ACETATO_ESTADO CASCADE;

CREATE TABLE public.CAT_ACETATO_ESTADO (
    acetato_estado_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    acetato_estado varchar(255),
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_acetato_estado PRIMARY KEY (acetato_estado_id)
);

COMMENT ON TABLE public.CAT_ACETATO_ESTADO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_acetato_estado_acetato_estado_id ON public.CAT_ACETATO_ESTADO(acetato_estado_id);

-- ============================================================
-- CAT_MARCO_PLACA_ESTADO
-- ============================================================
DROP TABLE IF EXISTS public.CAT_MARCO_PLACA_ESTADO CASCADE;

CREATE TABLE public.CAT_MARCO_PLACA_ESTADO (
    marco_placa_estado_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    marco_placa_estado varchar(255),
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_marco_placa_estado PRIMARY KEY (marco_placa_estado_id)
);

COMMENT ON TABLE public.CAT_MARCO_PLACA_ESTADO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_marco_placa_estado_marco_placa_estado_id ON public.CAT_MARCO_PLACA_ESTADO(marco_placa_estado_id);

-- ============================================================
-- CAT_PRIORIDAD_INTERVENCION
-- ============================================================
DROP TABLE IF EXISTS public.CAT_PRIORIDAD_INTERVENCION CASCADE;

CREATE TABLE public.CAT_PRIORIDAD_INTERVENCION (
    prioridad_intervencion_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_prioridad_intervencion PRIMARY KEY (prioridad_intervencion_id),
    CONSTRAINT uq_cat_prioridad_intervencion_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_PRIORIDAD_INTERVENCION IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_prioridad_intervencion_prioridad_intervencion_id ON public.CAT_PRIORIDAD_INTERVENCION(prioridad_intervencion_id);

-- ============================================================
-- PLACA
-- ============================================================
DROP TABLE IF EXISTS public.PLACA CASCADE;

CREATE TABLE public.PLACA (
    placa_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    ubicacion_id bigint,
    coleccion_id bigint,
    codigo_placa varchar(255),
    clase_placa_id bigint,
    etapa_uso_placa_id bigint,
    diseno_placa_id bigint,
    configuracion_cavidades_id bigint,
    material_placa_id bigint,
    color_placa_id bigint,
    configuracion_rejilla_id bigint,
    tipo_proteccion_id bigint,
    sistema_ensamble_id bigint,
    catalogador_id bigint,
    fecha_ingreso timestamptz,
    estado_catalogacion_id bigint,
    revisor_id bigint,
    fecha_revision timestamptz,
    CONSTRAINT pk_placa PRIMARY KEY (placa_id),
    CONSTRAINT fk_placa_coleccion_id FOREIGN KEY (coleccion_id) REFERENCES public.CAT_COLECCION(coleccion_id) ON DELETE SET NULL,
    CONSTRAINT fk_placa_clase_placa_id FOREIGN KEY (clase_placa_id) REFERENCES public.CAT_CLASE_PLACA(clase_placa_id) ON DELETE SET NULL,
    CONSTRAINT fk_placa_etapa_uso_placa_id FOREIGN KEY (etapa_uso_placa_id) REFERENCES public.CAT_ETAPA_USO_PLACA(etapa_uso_placa_id) ON DELETE SET NULL,
    CONSTRAINT fk_placa_diseno_placa_id FOREIGN KEY (diseno_placa_id) REFERENCES public.CAT_DISENO_PLACA(diseno_placa_id) ON DELETE SET NULL,
    CONSTRAINT fk_placa_configuracion_cavidades_id FOREIGN KEY (configuracion_cavidades_id) REFERENCES public.CAT_CONFIGURACION_CAVIDADES(configuracion_cavidades_id) ON DELETE SET NULL,
    CONSTRAINT fk_placa_material_placa_id FOREIGN KEY (material_placa_id) REFERENCES public.CAT_MATERIAL_PLACA(material_placa_id) ON DELETE SET NULL,
    CONSTRAINT fk_placa_color_placa_id FOREIGN KEY (color_placa_id) REFERENCES public.CAT_COLOR_PLACA(color_placa_id) ON DELETE SET NULL,
    CONSTRAINT fk_placa_configuracion_rejilla_id FOREIGN KEY (configuracion_rejilla_id) REFERENCES public.CAT_CONFIGURACION_REJILLA(configuracion_rejilla_id) ON DELETE SET NULL,
    CONSTRAINT fk_placa_tipo_proteccion_id FOREIGN KEY (tipo_proteccion_id) REFERENCES public.CAT_TIPO_PROTECCION(tipo_proteccion_id) ON DELETE SET NULL,
    CONSTRAINT fk_placa_sistema_ensamble_id FOREIGN KEY (sistema_ensamble_id) REFERENCES public.CAT_SISTEMA_ENSAMBLE(sistema_ensamble_id) ON DELETE SET NULL,
    CONSTRAINT fk_placa_catalogador_id FOREIGN KEY (catalogador_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT fk_placa_estado_catalogacion_id FOREIGN KEY (estado_catalogacion_id) REFERENCES public.CAT_ESTADO_CATALOGACION(estado_catalogacion_id) ON DELETE SET NULL,
    CONSTRAINT fk_placa_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.PLACA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_placa_clase_placa_id ON public.PLACA(clase_placa_id);
CREATE INDEX idx_placa_etapa_uso_placa_id ON public.PLACA(etapa_uso_placa_id);
CREATE INDEX idx_placa_diseno_placa_id ON public.PLACA(diseno_placa_id);
CREATE INDEX idx_placa_configuracion_cavidades_id ON public.PLACA(configuracion_cavidades_id);
CREATE INDEX idx_placa_material_placa_id ON public.PLACA(material_placa_id);
CREATE INDEX idx_placa_color_placa_id ON public.PLACA(color_placa_id);
CREATE INDEX idx_placa_configuracion_rejilla_id ON public.PLACA(configuracion_rejilla_id);
CREATE INDEX idx_placa_tipo_proteccion_id ON public.PLACA(tipo_proteccion_id);
CREATE INDEX idx_placa_sistema_ensamble_id ON public.PLACA(sistema_ensamble_id);
CREATE INDEX idx_placa_catalogador_id ON public.PLACA(catalogador_id);
CREATE INDEX idx_placa_estado_catalogacion_id ON public.PLACA(estado_catalogacion_id);
CREATE INDEX idx_placa_revisor_id ON public.PLACA(revisor_id);
CREATE INDEX idx_placa_codigo_placa ON public.PLACA(codigo_placa);
CREATE INDEX idx_placa_ubicacion_id ON public.PLACA(ubicacion_id);
CREATE INDEX idx_placa_coleccion_id ON public.PLACA(coleccion_id);

-- ============================================================
-- MARCADO_PLACA
-- ============================================================
DROP TABLE IF EXISTS public.MARCADO_PLACA CASCADE;

CREATE TABLE public.MARCADO_PLACA (
    marcado_placa_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    placa_id bigint,
    tinta_negra boolean,
    tinta_azul boolean,
    tinta_roja boolean,
    tinta_verde boolean,
    lapiz boolean,
    impresion_negro boolean,
    impresion_azul boolean,
    etiqueta_adherida boolean,
    observaciones text,
    catalogador_id bigint,
    fecha_ingreso timestamptz,
    revisor_id bigint,
    fecha_revision timestamptz,
    estado_catalogacion_id bigint,
    CONSTRAINT pk_marcado_placa PRIMARY KEY (marcado_placa_id),
    CONSTRAINT fk_marcado_placa_placa_id FOREIGN KEY (placa_id) REFERENCES public.PLACA(placa_id) ON DELETE CASCADE,
    CONSTRAINT fk_marcado_placa_catalogador_id FOREIGN KEY (catalogador_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT fk_marcado_placa_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT fk_marcado_placa_estado_catalogacion_id FOREIGN KEY (estado_catalogacion_id) REFERENCES public.CAT_ESTADO_CATALOGACION(estado_catalogacion_id) ON DELETE SET NULL,
    CONSTRAINT uq_marcado_placa_placa_id UNIQUE (placa_id)
);

COMMENT ON TABLE public.MARCADO_PLACA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_marcado_placa_placa_id ON public.MARCADO_PLACA(placa_id);
CREATE INDEX idx_marcado_placa_catalogador_id ON public.MARCADO_PLACA(catalogador_id);
CREATE INDEX idx_marcado_placa_revisor_id ON public.MARCADO_PLACA(revisor_id);
CREATE INDEX idx_marcado_placa_estado_catalogacion_id ON public.MARCADO_PLACA(estado_catalogacion_id);

-- ============================================================
-- ANOTACION_PLACA
-- ============================================================
DROP TABLE IF EXISTS public.ANOTACION_PLACA CASCADE;

CREATE TABLE public.ANOTACION_PLACA (
    anotacion_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    placa_id bigint,
    posicion_anotacion_id bigint,
    codigo_posicion varchar(255),
    texto_anotacion varchar(255),
    estado_catalogacion_id bigint,
    revisor_id bigint,
    fecha_revision timestamptz,
    catalogador_id bigint,
    fecha_ingreso timestamptz,
    CONSTRAINT pk_anotacion_placa PRIMARY KEY (anotacion_id),
    CONSTRAINT fk_anotacion_placa_placa_id FOREIGN KEY (placa_id) REFERENCES public.PLACA(placa_id) ON DELETE SET NULL,
    CONSTRAINT fk_anotacion_placa_posicion_anotacion_id FOREIGN KEY (posicion_anotacion_id) REFERENCES public.CAT_POSICION_ANOTACION(posicion_anotacion_id) ON DELETE SET NULL,
    CONSTRAINT fk_anotacion_placa_estado_catalogacion_id FOREIGN KEY (estado_catalogacion_id) REFERENCES public.CAT_ESTADO_CATALOGACION(estado_catalogacion_id) ON DELETE SET NULL,
    CONSTRAINT fk_anotacion_placa_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT fk_anotacion_placa_catalogador_id FOREIGN KEY (catalogador_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.ANOTACION_PLACA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_anotacion_placa_placa_id ON public.ANOTACION_PLACA(placa_id);
CREATE INDEX idx_anotacion_placa_posicion_anotacion_id ON public.ANOTACION_PLACA(posicion_anotacion_id);
CREATE INDEX idx_anotacion_placa_estado_catalogacion_id ON public.ANOTACION_PLACA(estado_catalogacion_id);
CREATE INDEX idx_anotacion_placa_revisor_id ON public.ANOTACION_PLACA(revisor_id);
CREATE INDEX idx_anotacion_placa_catalogador_id ON public.ANOTACION_PLACA(catalogador_id);

-- ============================================================
-- ESTADO_CONSERVACION_INICIAL
-- ============================================================
DROP TABLE IF EXISTS public.ESTADO_CONSERVACION_INICIAL CASCADE;

CREATE TABLE public.ESTADO_CONSERVACION_INICIAL (
    estado_conservacion_inicial_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    placa_id bigint,
    vidrio_estado varchar(255),
    acetato_estado varchar(255),
    marco_placa_estado varchar(255),
    presencia_hongos boolean,
    crecimiento_cristales boolean,
    oxidacion boolean,
    material_fuera_cavidad boolean,
    riesgo_contaminacion boolean,
    observaciones text,
    prioridad_intervencion_id bigint,
    estado_catalogacion_id bigint,
    revisor_id bigint,
    fecha_revision timestamptz,
    catalogador_id bigint,
    fecha_ingreso timestamptz,
    CONSTRAINT pk_estado_conservacion_inicial PRIMARY KEY (estado_conservacion_inicial_id),
    CONSTRAINT fk_estado_conservacion_inicial_placa_id FOREIGN KEY (placa_id) REFERENCES public.PLACA(placa_id) ON DELETE SET NULL,
    CONSTRAINT fk_estado_conservacion_inicial_prioridad_intervencion_id FOREIGN KEY (prioridad_intervencion_id) REFERENCES public.CAT_PRIORIDAD_INTERVENCION(prioridad_intervencion_id) ON DELETE SET NULL,
    CONSTRAINT fk_estado_conservacion_inicial_estado_catalogacion_id FOREIGN KEY (estado_catalogacion_id) REFERENCES public.CAT_ESTADO_CATALOGACION(estado_catalogacion_id) ON DELETE SET NULL,
    CONSTRAINT fk_estado_conservacion_inicial_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT fk_estado_conservacion_inicial_catalogador_id FOREIGN KEY (catalogador_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.ESTADO_CONSERVACION_INICIAL IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_estado_conservacion_inicial_placa_id ON public.ESTADO_CONSERVACION_INICIAL(placa_id);
CREATE INDEX idx_estado_conservacion_inicial_prioridad_intervencion_id ON public.ESTADO_CONSERVACION_INICIAL(prioridad_intervencion_id);
CREATE INDEX idx_estado_conservacion_inicial_estado_catalogacion_id ON public.ESTADO_CONSERVACION_INICIAL(estado_catalogacion_id);
CREATE INDEX idx_estado_conservacion_inicial_revisor_id ON public.ESTADO_CONSERVACION_INICIAL(revisor_id);
CREATE INDEX idx_estado_conservacion_inicial_catalogador_id ON public.ESTADO_CONSERVACION_INICIAL(catalogador_id);

-- ============================================================
-- REL_PLACA_PLACA
-- ============================================================
DROP TABLE IF EXISTS public.REL_PLACA_PLACA CASCADE;

CREATE TABLE public.REL_PLACA_PLACA (
    rel_placa_placa_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    placa_origen_id bigint,
    placa_destino_id bigint,
    tipo_relacion_placa_id bigint,
    observaciones text,
    CONSTRAINT pk_rel_placa_placa PRIMARY KEY (rel_placa_placa_id),
    CONSTRAINT fk_rel_placa_placa_placa_origen_id FOREIGN KEY (placa_origen_id) REFERENCES public.PLACA(placa_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_placa_placa_placa_destino_id FOREIGN KEY (placa_destino_id) REFERENCES public.PLACA(placa_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_placa_placa_tipo_relacion_placa_id FOREIGN KEY (tipo_relacion_placa_id) REFERENCES public.CAT_TIPO_RELACION_PLACA(tipo_relacion_placa_id) ON DELETE SET NULL,
    CONSTRAINT chk_rel_placa_placa_no_self CHECK (placa_origen_id <> placa_destino_id)
);

COMMENT ON TABLE public.REL_PLACA_PLACA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_rel_placa_placa_placa_origen_id ON public.REL_PLACA_PLACA(placa_origen_id);
CREATE INDEX idx_rel_placa_placa_placa_destino_id ON public.REL_PLACA_PLACA(placa_destino_id);
CREATE INDEX idx_rel_placa_placa_tipo_relacion_placa_id ON public.REL_PLACA_PLACA(tipo_relacion_placa_id);

-- ============================================================
-- REL_PLACA_AUTOR
-- ============================================================
DROP TABLE IF EXISTS public.REL_PLACA_AUTOR CASCADE;

CREATE TABLE public.REL_PLACA_AUTOR (
    rel_placa_autor_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    placa_id bigint,
    autor_id bigint,
    rol_autor_id bigint,
    observaciones text,
    CONSTRAINT pk_rel_placa_autor PRIMARY KEY (rel_placa_autor_id),
    CONSTRAINT fk_rel_placa_autor_placa_id FOREIGN KEY (placa_id) REFERENCES public.PLACA(placa_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_placa_autor_autor_id FOREIGN KEY (autor_id) REFERENCES public.DIC_AUTOR(autor_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_placa_autor_rol_autor_id FOREIGN KEY (rol_autor_id) REFERENCES public.CAT_ROL_AUTOR(rol_autor_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.REL_PLACA_AUTOR IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_rel_placa_autor_placa_id ON public.REL_PLACA_AUTOR(placa_id);
CREATE INDEX idx_rel_placa_autor_autor_id ON public.REL_PLACA_AUTOR(autor_id);
CREATE INDEX idx_rel_placa_autor_rol_autor_id ON public.REL_PLACA_AUTOR(rol_autor_id);

-- ============================================================
-- PLACA_TIPO
-- ============================================================
DROP TABLE IF EXISTS public.PLACA_TIPO CASCADE;

CREATE TABLE public.PLACA_TIPO (
    placa_tipo_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    placa_id bigint,
    clase_ptipo_id bigint,
    observaciones text,
    CONSTRAINT pk_placa_tipo PRIMARY KEY (placa_tipo_id),
    CONSTRAINT fk_placa_tipo_placa_id FOREIGN KEY (placa_id) REFERENCES public.PLACA(placa_id) ON DELETE SET NULL,
    CONSTRAINT fk_placa_tipo_clase_ptipo_id FOREIGN KEY (clase_ptipo_id) REFERENCES public.CAT_CLASE_P_TIPO(clase_ptipo_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.PLACA_TIPO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_placa_tipo_placa_id ON public.PLACA_TIPO(placa_id);
CREATE INDEX idx_placa_tipo_clase_ptipo_id ON public.PLACA_TIPO(clase_ptipo_id);

-- ============================================================
-- UBICACION_FISICA
-- ============================================================
DROP TABLE IF EXISTS public.UBICACION_FISICA CASCADE;

CREATE TABLE public.UBICACION_FISICA (
    ubicacion_fisica_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    codigo_ubicacion varchar(255),
    placa_id bigint,
    mueble_id bigint,
    seccion_id bigint,
    zona_id bigint,
    numero_bandeja varchar(255),
    material_bandeja_id bigint,
    columna_bandeja_id bigint,
    posicion_placa varchar(255),
    catalogador_id bigint,
    fecha_ingreso timestamptz,
    estado_catalogacion_id bigint,
    revisor_id bigint,
    fecha_revision timestamptz,
    observaciones text,
    CONSTRAINT pk_ubicacion_fisica PRIMARY KEY (ubicacion_fisica_id),
    CONSTRAINT fk_ubicacion_fisica_placa_id FOREIGN KEY (placa_id) REFERENCES public.PLACA(placa_id) ON DELETE SET NULL,
    CONSTRAINT fk_ubicacion_fisica_mueble_id FOREIGN KEY (mueble_id) REFERENCES public.CAT_MUEBLE(mueble_id) ON DELETE SET NULL,
    CONSTRAINT fk_ubicacion_fisica_seccion_id FOREIGN KEY (seccion_id) REFERENCES public.CAT_SECCION(seccion_id) ON DELETE SET NULL,
    CONSTRAINT fk_ubicacion_fisica_zona_id FOREIGN KEY (zona_id) REFERENCES public.CAT_ZONA(zona_id) ON DELETE SET NULL,
    CONSTRAINT fk_ubicacion_fisica_material_bandeja_id FOREIGN KEY (material_bandeja_id) REFERENCES public.CAT_MATERIAL_BANDEJA(material_bandeja_id) ON DELETE SET NULL,
    CONSTRAINT fk_ubicacion_fisica_columna_bandeja_id FOREIGN KEY (columna_bandeja_id) REFERENCES public.CAT_COLUMNA_BANDEJA(columna_bandeja_id) ON DELETE SET NULL,
    CONSTRAINT fk_ubicacion_fisica_catalogador_id FOREIGN KEY (catalogador_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT fk_ubicacion_fisica_estado_catalogacion_id FOREIGN KEY (estado_catalogacion_id) REFERENCES public.CAT_ESTADO_CATALOGACION(estado_catalogacion_id) ON DELETE SET NULL,
    CONSTRAINT fk_ubicacion_fisica_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT uq_ubicacion_fisica_ubicacion UNIQUE (mueble_id, seccion_id, zona_id, numero_bandeja, columna_bandeja_id, posicion_placa)
);

COMMENT ON TABLE public.UBICACION_FISICA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_ubicacion_fisica_placa_id ON public.UBICACION_FISICA(placa_id);
CREATE INDEX idx_ubicacion_fisica_mueble_id ON public.UBICACION_FISICA(mueble_id);
CREATE INDEX idx_ubicacion_fisica_seccion_id ON public.UBICACION_FISICA(seccion_id);
CREATE INDEX idx_ubicacion_fisica_zona_id ON public.UBICACION_FISICA(zona_id);
CREATE INDEX idx_ubicacion_fisica_material_bandeja_id ON public.UBICACION_FISICA(material_bandeja_id);
CREATE INDEX idx_ubicacion_fisica_columna_bandeja_id ON public.UBICACION_FISICA(columna_bandeja_id);
CREATE INDEX idx_ubicacion_fisica_catalogador_id ON public.UBICACION_FISICA(catalogador_id);
CREATE INDEX idx_ubicacion_fisica_estado_catalogacion_id ON public.UBICACION_FISICA(estado_catalogacion_id);
CREATE INDEX idx_ubicacion_fisica_revisor_id ON public.UBICACION_FISICA(revisor_id);

-- ============================================================
-- POZO
-- ============================================================
DROP TABLE IF EXISTS public.POZO CASCADE;

CREATE TABLE public.POZO (
    pozo_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    codigo_pozo varchar(255),
    nombre_pozo varchar(255),
    cuenca_id bigint,
    localizacion_geografica_id bigint,
    localizacion_espacial_id bigint,
    estado_revision_id bigint,
    revisor_id bigint,
    fecha_revision timestamptz,
    observaciones text,
    CONSTRAINT pk_pozo PRIMARY KEY (pozo_id),
    CONSTRAINT fk_pozo_cuenca_id FOREIGN KEY (cuenca_id) REFERENCES public.CAT_CUENCA(cuenca_id) ON DELETE SET NULL,
    CONSTRAINT fk_pozo_estado_revision_id FOREIGN KEY (estado_revision_id) REFERENCES public.CAT_ESTADO_REVISION(estado_revision_id) ON DELETE SET NULL,
    CONSTRAINT fk_pozo_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.POZO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_pozo_cuenca_id ON public.POZO(cuenca_id);
CREATE INDEX idx_pozo_estado_revision_id ON public.POZO(estado_revision_id);
CREATE INDEX idx_pozo_revisor_id ON public.POZO(revisor_id);
CREATE INDEX idx_pozo_codigo_pozo ON public.POZO(codigo_pozo);

-- ============================================================
-- POZO_REPORTADO
-- ============================================================
DROP TABLE IF EXISTS public.POZO_REPORTADO CASCADE;

CREATE TABLE public.POZO_REPORTADO (
    pozo_reportado_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre_reportado varchar(255),
    estado_revision_id bigint,
    catalogador_id bigint,
    fecha_ingreso timestamptz,
    revisor_id bigint,
    fecha_revision timestamptz,
    estado_catalogacion_id bigint,
    observaciones text,
    CONSTRAINT pk_pozo_reportado PRIMARY KEY (pozo_reportado_id),
    CONSTRAINT fk_pozo_reportado_estado_revision_id FOREIGN KEY (estado_revision_id) REFERENCES public.CAT_ESTADO_REVISION(estado_revision_id) ON DELETE SET NULL,
    CONSTRAINT fk_pozo_reportado_catalogador_id FOREIGN KEY (catalogador_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT fk_pozo_reportado_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT fk_pozo_reportado_estado_catalogacion_id FOREIGN KEY (estado_catalogacion_id) REFERENCES public.CAT_ESTADO_CATALOGACION(estado_catalogacion_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.POZO_REPORTADO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_pozo_reportado_estado_revision_id ON public.POZO_REPORTADO(estado_revision_id);
CREATE INDEX idx_pozo_reportado_catalogador_id ON public.POZO_REPORTADO(catalogador_id);
CREATE INDEX idx_pozo_reportado_revisor_id ON public.POZO_REPORTADO(revisor_id);
CREATE INDEX idx_pozo_reportado_estado_catalogacion_id ON public.POZO_REPORTADO(estado_catalogacion_id);

-- ============================================================
-- REL_POZO_REPORTADO_POZO
-- ============================================================
DROP TABLE IF EXISTS public.REL_POZO_REPORTADO_POZO CASCADE;

CREATE TABLE public.REL_POZO_REPORTADO_POZO (
    rel_pozo_reportado_pozo_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    pozo_reportado_id bigint,
    pozo_id bigint,
    observaciones text,
    CONSTRAINT pk_rel_pozo_reportado_pozo PRIMARY KEY (rel_pozo_reportado_pozo_id),
    CONSTRAINT fk_rel_pozo_reportado_pozo_pozo_reportado_id FOREIGN KEY (pozo_reportado_id) REFERENCES public.POZO_REPORTADO(pozo_reportado_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_pozo_reportado_pozo_pozo_id FOREIGN KEY (pozo_id) REFERENCES public.POZO(pozo_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.REL_POZO_REPORTADO_POZO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_rel_pozo_reportado_pozo_pozo_reportado_id ON public.REL_POZO_REPORTADO_POZO(pozo_reportado_id);
CREATE INDEX idx_rel_pozo_reportado_pozo_pozo_id ON public.REL_POZO_REPORTADO_POZO(pozo_id);

-- ============================================================
-- POZO_EXPLORATORIO
-- ============================================================
DROP TABLE IF EXISTS public.POZO_EXPLORATORIO CASCADE;

CREATE TABLE public.POZO_EXPLORATORIO (
    pozo_exploratorio_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    pozo_id bigint,
    operador varchar(255),
    estado_pozo varchar(255),
    ano_perforacion varchar(255),
    profundidad_total varchar(255),
    CONSTRAINT pk_pozo_exploratorio PRIMARY KEY (pozo_exploratorio_id),
    CONSTRAINT fk_pozo_exploratorio_pozo_id FOREIGN KEY (pozo_id) REFERENCES public.POZO(pozo_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.POZO_EXPLORATORIO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_pozo_exploratorio_pozo_id ON public.POZO_EXPLORATORIO(pozo_id);

-- ============================================================
-- POZO_ESTRATIGRAFICO
-- ============================================================
DROP TABLE IF EXISTS public.POZO_ESTRATIGRAFICO CASCADE;

CREATE TABLE public.POZO_ESTRATIGRAFICO (
    pozo_estratigrafico_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    pozo_id bigint,
    proyecto_estratigrafico varchar(255),
    institucion varchar(255),
    ano_perforacion varchar(255),
    CONSTRAINT pk_pozo_estratigrafico PRIMARY KEY (pozo_estratigrafico_id),
    CONSTRAINT fk_pozo_estratigrafico_pozo_id FOREIGN KEY (pozo_id) REFERENCES public.POZO(pozo_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.POZO_ESTRATIGRAFICO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_pozo_estratigrafico_pozo_id ON public.POZO_ESTRATIGRAFICO(pozo_id);

-- ============================================================
-- MUESTRA
-- ============================================================
DROP TABLE IF EXISTS public.MUESTRA CASCADE;

CREATE TABLE public.MUESTRA (
    muestra_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre_muestra_original varchar(255),
    codigo_muestra_sistema varchar(255),
    origen_muestra_id bigint,
    metodo_adquisicion_id bigint,
    catalogador_id bigint,
    fecha_ingreso timestamptz,
    revisor_id bigint,
    fecha_revision timestamptz,
    estado_catalogacion_id bigint,
    observaciones text,
    CONSTRAINT pk_muestra PRIMARY KEY (muestra_id),
    CONSTRAINT fk_muestra_origen_muestra_id FOREIGN KEY (origen_muestra_id) REFERENCES public.CAT_ORIGEN_MUESTRA(origen_muestra_id) ON DELETE SET NULL,
    CONSTRAINT fk_muestra_metodo_adquisicion_id FOREIGN KEY (metodo_adquisicion_id) REFERENCES public.CAT_METODO_ADQUISICION(metodo_adquisicion_id) ON DELETE SET NULL,
    CONSTRAINT fk_muestra_catalogador_id FOREIGN KEY (catalogador_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT fk_muestra_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT fk_muestra_estado_catalogacion_id FOREIGN KEY (estado_catalogacion_id) REFERENCES public.CAT_ESTADO_CATALOGACION(estado_catalogacion_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.MUESTRA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_muestra_origen_muestra_id ON public.MUESTRA(origen_muestra_id);
CREATE INDEX idx_muestra_metodo_adquisicion_id ON public.MUESTRA(metodo_adquisicion_id);
CREATE INDEX idx_muestra_catalogador_id ON public.MUESTRA(catalogador_id);
CREATE INDEX idx_muestra_revisor_id ON public.MUESTRA(revisor_id);
CREATE INDEX idx_muestra_estado_catalogacion_id ON public.MUESTRA(estado_catalogacion_id);
CREATE INDEX idx_muestra_codigo_muestra_sistema ON public.MUESTRA(codigo_muestra_sistema);

-- ============================================================
-- MUESTRA_SUPERFICIE
-- ============================================================
DROP TABLE IF EXISTS public.MUESTRA_SUPERFICIE CASCADE;

CREATE TABLE public.MUESTRA_SUPERFICIE (
    muestra_superficie_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    muestra_id bigint,
    ano_muestreo bigint,
    codigo_original_muestra varchar(255),
    colector_id bigint,
    consecutivo_campo varchar(255),
    profundidad_muestreo bigint,
    unidad_medida_id bigint,
    igm varchar(255),
    numero_preparacion_lab varchar(255),
    observaciones text,
    plancha_topografica_id bigint,
    localizacion_georeferencial_id bigint,
    seccion_estratigrafica_id bigint,
    posicion_estratigrafica_id bigint,
    localizacion_geografica_id bigint,
    localizacion_espacial_id bigint,
    CONSTRAINT pk_muestra_superficie PRIMARY KEY (muestra_superficie_id),
    CONSTRAINT fk_muestra_superficie_muestra_id FOREIGN KEY (muestra_id) REFERENCES public.MUESTRA(muestra_id) ON DELETE SET NULL,
    CONSTRAINT fk_muestra_superficie_colector_id FOREIGN KEY (colector_id) REFERENCES public.CAT_COLECTOR(colector_id) ON DELETE SET NULL,
    CONSTRAINT fk_muestra_superficie_unidad_medida_id FOREIGN KEY (unidad_medida_id) REFERENCES public.CAT_UNIDAD_MEDIDA(unidad_medida_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.MUESTRA_SUPERFICIE IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_muestra_superficie_muestra_id ON public.MUESTRA_SUPERFICIE(muestra_id);
CREATE INDEX idx_muestra_superficie_colector_id ON public.MUESTRA_SUPERFICIE(colector_id);
CREATE INDEX idx_muestra_superficie_unidad_medida_id ON public.MUESTRA_SUPERFICIE(unidad_medida_id);

-- ============================================================
-- MUESTRA_LECHO_MARINO
-- ============================================================
DROP TABLE IF EXISTS public.MUESTRA_LECHO_MARINO CASCADE;

CREATE TABLE public.MUESTRA_LECHO_MARINO (
    muestra_lecho_marino_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    muestra_id bigint,
    crucero varchar(255),
    estacion varchar(255),
    profundidad_agua bigint,
    unidad_medida_id bigint,
    localizacion_geografica_id bigint,
    localizacion_espacial_id bigint,
    CONSTRAINT pk_muestra_lecho_marino PRIMARY KEY (muestra_lecho_marino_id),
    CONSTRAINT fk_muestra_lecho_marino_muestra_id FOREIGN KEY (muestra_id) REFERENCES public.MUESTRA(muestra_id) ON DELETE SET NULL,
    CONSTRAINT fk_muestra_lecho_marino_unidad_medida_id FOREIGN KEY (unidad_medida_id) REFERENCES public.CAT_UNIDAD_MEDIDA(unidad_medida_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.MUESTRA_LECHO_MARINO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_muestra_lecho_marino_muestra_id ON public.MUESTRA_LECHO_MARINO(muestra_id);
CREATE INDEX idx_muestra_lecho_marino_unidad_medida_id ON public.MUESTRA_LECHO_MARINO(unidad_medida_id);

-- ============================================================
-- MUESTRA_SUBSUELO
-- ============================================================
DROP TABLE IF EXISTS public.MUESTRA_SUBSUELO CASCADE;

CREATE TABLE public.MUESTRA_SUBSUELO (
    muestra_subsuelo_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    muestra_id bigint,
    tipo_muestra_subsuelo_id bigint,
    pozo_id bigint,
    tipo_intervalo_muestra_id bigint,
    profundidad_tope bigint,
    profundidad_base bigint,
    unidad_medida_id bigint,
    intervalo_nucleo bigint,
    CONSTRAINT pk_muestra_subsuelo PRIMARY KEY (muestra_subsuelo_id),
    CONSTRAINT fk_muestra_subsuelo_muestra_id FOREIGN KEY (muestra_id) REFERENCES public.MUESTRA(muestra_id) ON DELETE SET NULL,
    CONSTRAINT fk_muestra_subsuelo_tipo_muestra_subsuelo_id FOREIGN KEY (tipo_muestra_subsuelo_id) REFERENCES public.CAT_TIPO_MUESTRA_SUBSUELO(tipo_muestra_subsuelo_id) ON DELETE SET NULL,
    CONSTRAINT fk_muestra_subsuelo_pozo_id FOREIGN KEY (pozo_id) REFERENCES public.POZO(pozo_id) ON DELETE SET NULL,
    CONSTRAINT fk_muestra_subsuelo_tipo_intervalo_muestra_id FOREIGN KEY (tipo_intervalo_muestra_id) REFERENCES public.CAT_TIPO_INTERVALO_MUESTRA(tipo_intervalo_muestra_id) ON DELETE SET NULL,
    CONSTRAINT fk_muestra_subsuelo_unidad_medida_id FOREIGN KEY (unidad_medida_id) REFERENCES public.CAT_UNIDAD_MEDIDA(unidad_medida_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.MUESTRA_SUBSUELO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_muestra_subsuelo_muestra_id ON public.MUESTRA_SUBSUELO(muestra_id);
CREATE INDEX idx_muestra_subsuelo_tipo_muestra_subsuelo_id ON public.MUESTRA_SUBSUELO(tipo_muestra_subsuelo_id);
CREATE INDEX idx_muestra_subsuelo_pozo_id ON public.MUESTRA_SUBSUELO(pozo_id);
CREATE INDEX idx_muestra_subsuelo_tipo_intervalo_muestra_id ON public.MUESTRA_SUBSUELO(tipo_intervalo_muestra_id);
CREATE INDEX idx_muestra_subsuelo_unidad_medida_id ON public.MUESTRA_SUBSUELO(unidad_medida_id);

-- ============================================================
-- NUCLEO
-- ============================================================
DROP TABLE IF EXISTS public.NUCLEO CASCADE;

CREATE TABLE public.NUCLEO (
    nucleo_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    muestra_subsuelo_id bigint,
    nucleo_reportado boolean,
    numero_nucleo bigint,
    profundidad_tope bigint,
    profundidad_base bigint,
    unidad_medida_id bigint,
    observaciones text,
    CONSTRAINT pk_nucleo PRIMARY KEY (nucleo_id),
    CONSTRAINT fk_nucleo_muestra_subsuelo_id FOREIGN KEY (muestra_subsuelo_id) REFERENCES public.MUESTRA_SUBSUELO(muestra_subsuelo_id) ON DELETE SET NULL,
    CONSTRAINT fk_nucleo_unidad_medida_id FOREIGN KEY (unidad_medida_id) REFERENCES public.CAT_UNIDAD_MEDIDA(unidad_medida_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.NUCLEO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_nucleo_muestra_subsuelo_id ON public.NUCLEO(muestra_subsuelo_id);
CREATE INDEX idx_nucleo_unidad_medida_id ON public.NUCLEO(unidad_medida_id);

-- ============================================================
-- SECCION_NUCLEO
-- ============================================================
DROP TABLE IF EXISTS public.SECCION_NUCLEO CASCADE;

CREATE TABLE public.SECCION_NUCLEO (
    seccion_nucleo_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nucleo_id bigint,
    numero_seccion bigint,
    intervalo_tope bigint,
    intervalo_base bigint,
    unidad_medida_id bigint,
    observaciones text,
    CONSTRAINT pk_seccion_nucleo PRIMARY KEY (seccion_nucleo_id),
    CONSTRAINT fk_seccion_nucleo_nucleo_id FOREIGN KEY (nucleo_id) REFERENCES public.NUCLEO(nucleo_id) ON DELETE SET NULL,
    CONSTRAINT fk_seccion_nucleo_unidad_medida_id FOREIGN KEY (unidad_medida_id) REFERENCES public.CAT_UNIDAD_MEDIDA(unidad_medida_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.SECCION_NUCLEO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_seccion_nucleo_nucleo_id ON public.SECCION_NUCLEO(nucleo_id);
CREATE INDEX idx_seccion_nucleo_unidad_medida_id ON public.SECCION_NUCLEO(unidad_medida_id);

-- ============================================================
-- DISPOSICION_MATERIAL
-- ============================================================
DROP TABLE IF EXISTS public.DISPOSICION_MATERIAL CASCADE;

CREATE TABLE public.DISPOSICION_MATERIAL (
    disposicion_material_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    placa_id bigint,
    muestra_id bigint,
    codigo_cavidad_id bigint,
    numero_cavidad varchar(255),
    tiene_material boolean,
    estado_material_id bigint,
    recobro_cualitativo_id bigint,
    estado_catalogacion_id bigint,
    revisor_id bigint,
    fecha_revision timestamptz,
    catalogador_id bigint,
    fecha_ingreso timestamptz,
    observaciones text,
    CONSTRAINT pk_disposicion_material PRIMARY KEY (disposicion_material_id),
    CONSTRAINT fk_disposicion_material_placa_id FOREIGN KEY (placa_id) REFERENCES public.PLACA(placa_id) ON DELETE SET NULL,
    CONSTRAINT fk_disposicion_material_muestra_id FOREIGN KEY (muestra_id) REFERENCES public.MUESTRA(muestra_id) ON DELETE SET NULL,
    CONSTRAINT fk_disposicion_material_codigo_cavidad_id FOREIGN KEY (codigo_cavidad_id) REFERENCES public.CAT_CODIGO_CAVIDAD(codigo_cavidad_id) ON DELETE SET NULL,
    CONSTRAINT fk_disposicion_material_estado_material_id FOREIGN KEY (estado_material_id) REFERENCES public.CAT_ESTADO_MATERIAL(estado_material_id) ON DELETE SET NULL,
    CONSTRAINT fk_disposicion_material_recobro_cualitativo_id FOREIGN KEY (recobro_cualitativo_id) REFERENCES public.CAT_RECOBRO_CUALITATIVO(recobro_cualitativo_id) ON DELETE SET NULL,
    CONSTRAINT fk_disposicion_material_estado_catalogacion_id FOREIGN KEY (estado_catalogacion_id) REFERENCES public.CAT_ESTADO_CATALOGACION(estado_catalogacion_id) ON DELETE SET NULL,
    CONSTRAINT fk_disposicion_material_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT fk_disposicion_material_catalogador_id FOREIGN KEY (catalogador_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.DISPOSICION_MATERIAL IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_disposicion_material_placa_id ON public.DISPOSICION_MATERIAL(placa_id);
CREATE INDEX idx_disposicion_material_muestra_id ON public.DISPOSICION_MATERIAL(muestra_id);
CREATE INDEX idx_disposicion_material_codigo_cavidad_id ON public.DISPOSICION_MATERIAL(codigo_cavidad_id);
CREATE INDEX idx_disposicion_material_estado_material_id ON public.DISPOSICION_MATERIAL(estado_material_id);
CREATE INDEX idx_disposicion_material_recobro_cualitativo_id ON public.DISPOSICION_MATERIAL(recobro_cualitativo_id);
CREATE INDEX idx_disposicion_material_estado_catalogacion_id ON public.DISPOSICION_MATERIAL(estado_catalogacion_id);
CREATE INDEX idx_disposicion_material_revisor_id ON public.DISPOSICION_MATERIAL(revisor_id);
CREATE INDEX idx_disposicion_material_catalogador_id ON public.DISPOSICION_MATERIAL(catalogador_id);

-- ============================================================
-- REL_MUESTRA_TRATAMIENTO
-- ============================================================
DROP TABLE IF EXISTS public.REL_MUESTRA_TRATAMIENTO CASCADE;

CREATE TABLE public.REL_MUESTRA_TRATAMIENTO (
    rel_muestra_tratamiento_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    muestra_id bigint,
    tratamiento_muestra_id bigint,
    observaciones text,
    CONSTRAINT pk_rel_muestra_tratamiento PRIMARY KEY (rel_muestra_tratamiento_id),
    CONSTRAINT fk_rel_muestra_tratamiento_muestra_id FOREIGN KEY (muestra_id) REFERENCES public.MUESTRA(muestra_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_muestra_tratamiento_tratamiento_muestra_id FOREIGN KEY (tratamiento_muestra_id) REFERENCES public.CAT_TRATAMIENTO_MUESTRA(tratamiento_muestra_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.REL_MUESTRA_TRATAMIENTO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_rel_muestra_tratamiento_muestra_id ON public.REL_MUESTRA_TRATAMIENTO(muestra_id);
CREATE INDEX idx_rel_muestra_tratamiento_tratamiento_muestra_id ON public.REL_MUESTRA_TRATAMIENTO(tratamiento_muestra_id);

-- ============================================================
-- REL_MUESTRA_PROYECTO
-- ============================================================
DROP TABLE IF EXISTS public.REL_MUESTRA_PROYECTO CASCADE;

CREATE TABLE public.REL_MUESTRA_PROYECTO (
    rel_muestra_proyecto_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    muestra_id bigint,
    proyecto_id bigint,
    CONSTRAINT pk_rel_muestra_proyecto PRIMARY KEY (rel_muestra_proyecto_id),
    CONSTRAINT fk_rel_muestra_proyecto_muestra_id FOREIGN KEY (muestra_id) REFERENCES public.MUESTRA(muestra_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_muestra_proyecto_proyecto_id FOREIGN KEY (proyecto_id) REFERENCES public.CAT_PROYECTO(proyecto_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.REL_MUESTRA_PROYECTO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_rel_muestra_proyecto_muestra_id ON public.REL_MUESTRA_PROYECTO(muestra_id);
CREATE INDEX idx_rel_muestra_proyecto_proyecto_id ON public.REL_MUESTRA_PROYECTO(proyecto_id);

-- ============================================================
-- REL_MUESTRA_ENTIDAD
-- ============================================================
DROP TABLE IF EXISTS public.REL_MUESTRA_ENTIDAD CASCADE;

CREATE TABLE public.REL_MUESTRA_ENTIDAD (
    rel_muestra_entidad_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    muestra_id bigint,
    entidad_id bigint,
    CONSTRAINT pk_rel_muestra_entidad PRIMARY KEY (rel_muestra_entidad_id),
    CONSTRAINT fk_rel_muestra_entidad_muestra_id FOREIGN KEY (muestra_id) REFERENCES public.MUESTRA(muestra_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_muestra_entidad_entidad_id FOREIGN KEY (entidad_id) REFERENCES public.CAT_ENTIDAD(entidad_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.REL_MUESTRA_ENTIDAD IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_rel_muestra_entidad_muestra_id ON public.REL_MUESTRA_ENTIDAD(muestra_id);
CREATE INDEX idx_rel_muestra_entidad_entidad_id ON public.REL_MUESTRA_ENTIDAD(entidad_id);

-- ============================================================
-- REL_MUESTRA_FECHA_HISTORICA
-- ============================================================
DROP TABLE IF EXISTS public.REL_MUESTRA_FECHA_HISTORICA CASCADE;

CREATE TABLE public.REL_MUESTRA_FECHA_HISTORICA (
    rel_muestra_fecha_historica_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    muestra_id bigint,
    fecha_historica_id bigint,
    observaciones text,
    CONSTRAINT pk_rel_muestra_fecha_historica PRIMARY KEY (rel_muestra_fecha_historica_id),
    CONSTRAINT fk_rel_muestra_fecha_historica_muestra_id FOREIGN KEY (muestra_id) REFERENCES public.MUESTRA(muestra_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_muestra_fecha_historica_fecha_historica_id FOREIGN KEY (fecha_historica_id) REFERENCES public.CAT_FECHA_HISTORICA(fecha_historica_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.REL_MUESTRA_FECHA_HISTORICA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_rel_muestra_fecha_historica_muestra_id ON public.REL_MUESTRA_FECHA_HISTORICA(muestra_id);
CREATE INDEX idx_rel_muestra_fecha_historica_fecha_historica_id ON public.REL_MUESTRA_FECHA_HISTORICA(fecha_historica_id);

-- ============================================================
-- Fase 3: taxonomy
-- ============================================================

-- ============================================================
-- CAT_TIPO_DUDA
-- ============================================================
DROP TABLE IF EXISTS public.CAT_TIPO_DUDA CASCADE;

CREATE TABLE public.CAT_TIPO_DUDA (
    tipo_duda_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    descripcion text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_tipo_duda PRIMARY KEY (tipo_duda_id),
    CONSTRAINT uq_cat_tipo_duda_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_TIPO_DUDA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_tipo_duda_tipo_duda_id ON public.CAT_TIPO_DUDA(tipo_duda_id);

-- Seed CAT_TIPO_DUDA
INSERT INTO public.CAT_TIPO_DUDA (nombre) VALUES ('Nombre ilegible') ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DUDA (nombre) VALUES ('Parcialmente ilegible') ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DUDA (nombre) VALUES ('Código ilegible') ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DUDA (nombre) VALUES ('Abreviatura ambigua') ON CONFLICT DO NOTHING;

-- ============================================================
-- DIC_TAXON_REPORTADO
-- ============================================================
DROP TABLE IF EXISTS public.DIC_TAXON_REPORTADO CASCADE;

CREATE TABLE public.DIC_TAXON_REPORTADO (
    taxon_reportado_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre_reportado varchar(255),
    autor_taxon_reportado varchar(255),
    estado_revision_id bigint,
    catalogador_id bigint,
    fecha_ingreso timestamptz,
    revisor_id bigint,
    fecha_revision timestamptz,
    observaciones text,
    CONSTRAINT pk_dic_taxon_reportado PRIMARY KEY (taxon_reportado_id),
    CONSTRAINT fk_dic_taxon_reportado_estado_revision_id FOREIGN KEY (estado_revision_id) REFERENCES public.CAT_ESTADO_REVISION(estado_revision_id) ON DELETE SET NULL,
    CONSTRAINT fk_dic_taxon_reportado_catalogador_id FOREIGN KEY (catalogador_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT fk_dic_taxon_reportado_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.DIC_TAXON_REPORTADO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_dic_taxon_reportado_taxon_reportado_id ON public.DIC_TAXON_REPORTADO(taxon_reportado_id);
CREATE INDEX idx_dic_taxon_reportado_estado_revision_id ON public.DIC_TAXON_REPORTADO(estado_revision_id);
CREATE INDEX idx_dic_taxon_reportado_catalogador_id ON public.DIC_TAXON_REPORTADO(catalogador_id);
CREATE INDEX idx_dic_taxon_reportado_revisor_id ON public.DIC_TAXON_REPORTADO(revisor_id);

-- ============================================================
-- DIC_TAXON_NORMALIZADO
-- ============================================================
DROP TABLE IF EXISTS public.DIC_TAXON_NORMALIZADO CASCADE;

CREATE TABLE public.DIC_TAXON_NORMALIZADO (
    taxon_normalizado_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre_normalizado varchar(255),
    autor_taxon_normalizado varchar(255),
    estado_revision_id bigint,
    revisor_id bigint,
    fecha_revision timestamptz,
    observaciones text,
    CONSTRAINT pk_dic_taxon_normalizado PRIMARY KEY (taxon_normalizado_id),
    CONSTRAINT fk_dic_taxon_normalizado_estado_revision_id FOREIGN KEY (estado_revision_id) REFERENCES public.CAT_ESTADO_REVISION(estado_revision_id) ON DELETE SET NULL,
    CONSTRAINT fk_dic_taxon_normalizado_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.DIC_TAXON_NORMALIZADO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_dic_taxon_normalizado_taxon_normalizado_id ON public.DIC_TAXON_NORMALIZADO(taxon_normalizado_id);
CREATE INDEX idx_dic_taxon_normalizado_estado_revision_id ON public.DIC_TAXON_NORMALIZADO(estado_revision_id);
CREATE INDEX idx_dic_taxon_normalizado_revisor_id ON public.DIC_TAXON_NORMALIZADO(revisor_id);

-- ============================================================
-- DIC_TAXON_ACTUALIZADO
-- ============================================================
DROP TABLE IF EXISTS public.DIC_TAXON_ACTUALIZADO CASCADE;

CREATE TABLE public.DIC_TAXON_ACTUALIZADO (
    taxon_actualizado_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre_actualizado varchar(255),
    autor_taxon_actualizado varchar(255),
    fuente_actualizacion varchar(255),
    fecha_actualizacion timestamptz,
    revisor_id bigint,
    fecha_revision timestamptz,
    estado_revision_id bigint,
    observaciones text,
    CONSTRAINT pk_dic_taxon_actualizado PRIMARY KEY (taxon_actualizado_id),
    CONSTRAINT fk_dic_taxon_actualizado_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT fk_dic_taxon_actualizado_estado_revision_id FOREIGN KEY (estado_revision_id) REFERENCES public.CAT_ESTADO_REVISION(estado_revision_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.DIC_TAXON_ACTUALIZADO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_dic_taxon_actualizado_taxon_actualizado_id ON public.DIC_TAXON_ACTUALIZADO(taxon_actualizado_id);
CREATE INDEX idx_dic_taxon_actualizado_revisor_id ON public.DIC_TAXON_ACTUALIZADO(revisor_id);
CREATE INDEX idx_dic_taxon_actualizado_estado_revision_id ON public.DIC_TAXON_ACTUALIZADO(estado_revision_id);

-- ============================================================
-- REL_TAXON_REP_NORM
-- ============================================================
DROP TABLE IF EXISTS public.REL_TAXON_REP_NORM CASCADE;

CREATE TABLE public.REL_TAXON_REP_NORM (
    rel_taxon_rep_norm_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    taxon_reportado_id bigint,
    taxon_normalizado_id bigint,
    observaciones text,
    CONSTRAINT pk_rel_taxon_rep_norm PRIMARY KEY (rel_taxon_rep_norm_id),
    CONSTRAINT fk_rel_taxon_rep_norm_taxon_reportado_id FOREIGN KEY (taxon_reportado_id) REFERENCES public.DIC_TAXON_REPORTADO(taxon_reportado_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_taxon_rep_norm_taxon_normalizado_id FOREIGN KEY (taxon_normalizado_id) REFERENCES public.DIC_TAXON_NORMALIZADO(taxon_normalizado_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.REL_TAXON_REP_NORM IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_rel_taxon_rep_norm_rel_taxon_rep_norm_id ON public.REL_TAXON_REP_NORM(rel_taxon_rep_norm_id);
CREATE INDEX idx_rel_taxon_rep_norm_taxon_reportado_id ON public.REL_TAXON_REP_NORM(taxon_reportado_id);
CREATE INDEX idx_rel_taxon_rep_norm_taxon_normalizado_id ON public.REL_TAXON_REP_NORM(taxon_normalizado_id);

-- ============================================================
-- REL_TAXON_NORM_ACT
-- ============================================================
DROP TABLE IF EXISTS public.REL_TAXON_NORM_ACT CASCADE;

CREATE TABLE public.REL_TAXON_NORM_ACT (
    rel_taxon_norm_act_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    taxon_normalizado_id bigint,
    taxon_actualizado_id bigint,
    observaciones text,
    CONSTRAINT pk_rel_taxon_norm_act PRIMARY KEY (rel_taxon_norm_act_id),
    CONSTRAINT fk_rel_taxon_norm_act_taxon_normalizado_id FOREIGN KEY (taxon_normalizado_id) REFERENCES public.DIC_TAXON_NORMALIZADO(taxon_normalizado_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_taxon_norm_act_taxon_actualizado_id FOREIGN KEY (taxon_actualizado_id) REFERENCES public.DIC_TAXON_ACTUALIZADO(taxon_actualizado_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.REL_TAXON_NORM_ACT IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_rel_taxon_norm_act_rel_taxon_norm_act_id ON public.REL_TAXON_NORM_ACT(rel_taxon_norm_act_id);
CREATE INDEX idx_rel_taxon_norm_act_taxon_normalizado_id ON public.REL_TAXON_NORM_ACT(taxon_normalizado_id);
CREATE INDEX idx_rel_taxon_norm_act_taxon_actualizado_id ON public.REL_TAXON_NORM_ACT(taxon_actualizado_id);

-- ============================================================
-- REL_MUESTRA_TAXON_REPORTADO
-- ============================================================
DROP TABLE IF EXISTS public.REL_MUESTRA_TAXON_REPORTADO CASCADE;

CREATE TABLE public.REL_MUESTRA_TAXON_REPORTADO (
    rel_muestra_taxon_reportado_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    muestra_id bigint,
    taxon_reportado_id bigint,
    orden_registro bigint,
    tipo_duda_id bigint,
    comentario_catalogador text,
    CONSTRAINT pk_rel_muestra_taxon_reportado PRIMARY KEY (rel_muestra_taxon_reportado_id),
    CONSTRAINT fk_rel_muestra_taxon_reportado_muestra_id FOREIGN KEY (muestra_id) REFERENCES public.MUESTRA(muestra_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_muestra_taxon_reportado_taxon_reportado_id FOREIGN KEY (taxon_reportado_id) REFERENCES public.DIC_TAXON_REPORTADO(taxon_reportado_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_muestra_taxon_reportado_tipo_duda_id FOREIGN KEY (tipo_duda_id) REFERENCES public.CAT_TIPO_DUDA(tipo_duda_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.REL_MUESTRA_TAXON_REPORTADO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_rel_muestra_taxon_reportado_rel_muestra_taxon_reportado_id ON public.REL_MUESTRA_TAXON_REPORTADO(rel_muestra_taxon_reportado_id);
CREATE INDEX idx_rel_muestra_taxon_reportado_muestra_id ON public.REL_MUESTRA_TAXON_REPORTADO(muestra_id);
CREATE INDEX idx_rel_muestra_taxon_reportado_taxon_reportado_id ON public.REL_MUESTRA_TAXON_REPORTADO(taxon_reportado_id);
CREATE INDEX idx_rel_muestra_taxon_reportado_tipo_duda_id ON public.REL_MUESTRA_TAXON_REPORTADO(tipo_duda_id);

-- ============================================================
-- Fase 3: biozones
-- ============================================================

-- ============================================================
-- DIC_BIOZONA_REPORTADA
-- ============================================================
DROP TABLE IF EXISTS public.DIC_BIOZONA_REPORTADA CASCADE;

CREATE TABLE public.DIC_BIOZONA_REPORTADA (
    biozona_reportada_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre_reportado varchar(255),
    autor_biozona_reportada varchar(255),
    codigo_biozona varchar(255),
    estado_revision_id bigint,
    catalogador_id bigint,
    fecha_ingreso timestamptz,
    revisor_id bigint,
    fecha_revision timestamptz,
    observaciones text,
    CONSTRAINT pk_dic_biozona_reportada PRIMARY KEY (biozona_reportada_id),
    CONSTRAINT fk_dic_biozona_reportada_estado_revision_id FOREIGN KEY (estado_revision_id) REFERENCES public.CAT_ESTADO_REVISION(estado_revision_id) ON DELETE SET NULL,
    CONSTRAINT fk_dic_biozona_reportada_catalogador_id FOREIGN KEY (catalogador_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT fk_dic_biozona_reportada_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.DIC_BIOZONA_REPORTADA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_dic_biozona_reportada_biozona_reportada_id ON public.DIC_BIOZONA_REPORTADA(biozona_reportada_id);
CREATE INDEX idx_dic_biozona_reportada_estado_revision_id ON public.DIC_BIOZONA_REPORTADA(estado_revision_id);
CREATE INDEX idx_dic_biozona_reportada_catalogador_id ON public.DIC_BIOZONA_REPORTADA(catalogador_id);
CREATE INDEX idx_dic_biozona_reportada_revisor_id ON public.DIC_BIOZONA_REPORTADA(revisor_id);

-- ============================================================
-- DIC_BIOZONA_NORMALIZADA
-- ============================================================
DROP TABLE IF EXISTS public.DIC_BIOZONA_NORMALIZADA CASCADE;

CREATE TABLE public.DIC_BIOZONA_NORMALIZADA (
    biozona_normalizada_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre_normalizado varchar(255),
    codigo_biozona varchar(255),
    autor_biozona_normalizada varchar(255),
    estado_revision_id bigint,
    revisor_id bigint,
    fecha_revision timestamptz,
    observaciones text,
    CONSTRAINT pk_dic_biozona_normalizada PRIMARY KEY (biozona_normalizada_id),
    CONSTRAINT fk_dic_biozona_normalizada_estado_revision_id FOREIGN KEY (estado_revision_id) REFERENCES public.CAT_ESTADO_REVISION(estado_revision_id) ON DELETE SET NULL,
    CONSTRAINT fk_dic_biozona_normalizada_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.DIC_BIOZONA_NORMALIZADA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_dic_biozona_normalizada_biozona_normalizada_id ON public.DIC_BIOZONA_NORMALIZADA(biozona_normalizada_id);
CREATE INDEX idx_dic_biozona_normalizada_estado_revision_id ON public.DIC_BIOZONA_NORMALIZADA(estado_revision_id);
CREATE INDEX idx_dic_biozona_normalizada_revisor_id ON public.DIC_BIOZONA_NORMALIZADA(revisor_id);

-- ============================================================
-- DIC_BIOZONA_ACTUALIZADA
-- ============================================================
DROP TABLE IF EXISTS public.DIC_BIOZONA_ACTUALIZADA CASCADE;

CREATE TABLE public.DIC_BIOZONA_ACTUALIZADA (
    biozona_actualizada_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre_actualizado varchar(255),
    codigo_biozona_actual varchar(255),
    fuente_actualizacion varchar(255),
    fecha_actualizacion timestamptz,
    revisor_id bigint,
    fecha_revision timestamptz,
    estado_revision_id bigint,
    observaciones text,
    CONSTRAINT pk_dic_biozona_actualizada PRIMARY KEY (biozona_actualizada_id),
    CONSTRAINT fk_dic_biozona_actualizada_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT fk_dic_biozona_actualizada_estado_revision_id FOREIGN KEY (estado_revision_id) REFERENCES public.CAT_ESTADO_REVISION(estado_revision_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.DIC_BIOZONA_ACTUALIZADA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_dic_biozona_actualizada_biozona_actualizada_id ON public.DIC_BIOZONA_ACTUALIZADA(biozona_actualizada_id);
CREATE INDEX idx_dic_biozona_actualizada_revisor_id ON public.DIC_BIOZONA_ACTUALIZADA(revisor_id);
CREATE INDEX idx_dic_biozona_actualizada_estado_revision_id ON public.DIC_BIOZONA_ACTUALIZADA(estado_revision_id);

-- ============================================================
-- REL_BIOZONA_REP_NORM
-- ============================================================
DROP TABLE IF EXISTS public.REL_BIOZONA_REP_NORM CASCADE;

CREATE TABLE public.REL_BIOZONA_REP_NORM (
    rel_biozona_rep_norm_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    biozona_reportada_id bigint,
    biozona_normalizada_id bigint,
    observaciones text,
    CONSTRAINT pk_rel_biozona_rep_norm PRIMARY KEY (rel_biozona_rep_norm_id),
    CONSTRAINT fk_rel_biozona_rep_norm_biozona_reportada_id FOREIGN KEY (biozona_reportada_id) REFERENCES public.DIC_BIOZONA_REPORTADA(biozona_reportada_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_biozona_rep_norm_biozona_normalizada_id FOREIGN KEY (biozona_normalizada_id) REFERENCES public.DIC_BIOZONA_NORMALIZADA(biozona_normalizada_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.REL_BIOZONA_REP_NORM IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_rel_biozona_rep_norm_rel_biozona_rep_norm_id ON public.REL_BIOZONA_REP_NORM(rel_biozona_rep_norm_id);
CREATE INDEX idx_rel_biozona_rep_norm_biozona_reportada_id ON public.REL_BIOZONA_REP_NORM(biozona_reportada_id);
CREATE INDEX idx_rel_biozona_rep_norm_biozona_normalizada_id ON public.REL_BIOZONA_REP_NORM(biozona_normalizada_id);

-- ============================================================
-- REL_BIOZONA_NORM_ACT
-- ============================================================
DROP TABLE IF EXISTS public.REL_BIOZONA_NORM_ACT CASCADE;

CREATE TABLE public.REL_BIOZONA_NORM_ACT (
    rel_biozona_norm_act_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    biozona_normalizada_id bigint,
    biozona_actualizada_id bigint,
    fuente_cambio varchar(255),
    CONSTRAINT pk_rel_biozona_norm_act PRIMARY KEY (rel_biozona_norm_act_id),
    CONSTRAINT fk_rel_biozona_norm_act_biozona_normalizada_id FOREIGN KEY (biozona_normalizada_id) REFERENCES public.DIC_BIOZONA_NORMALIZADA(biozona_normalizada_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_biozona_norm_act_biozona_actualizada_id FOREIGN KEY (biozona_actualizada_id) REFERENCES public.DIC_BIOZONA_ACTUALIZADA(biozona_actualizada_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.REL_BIOZONA_NORM_ACT IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_rel_biozona_norm_act_rel_biozona_norm_act_id ON public.REL_BIOZONA_NORM_ACT(rel_biozona_norm_act_id);
CREATE INDEX idx_rel_biozona_norm_act_biozona_normalizada_id ON public.REL_BIOZONA_NORM_ACT(biozona_normalizada_id);
CREATE INDEX idx_rel_biozona_norm_act_biozona_actualizada_id ON public.REL_BIOZONA_NORM_ACT(biozona_actualizada_id);

-- ============================================================
-- REL_MUESTRA_BIOZONA_REPORTADA
-- ============================================================
DROP TABLE IF EXISTS public.REL_MUESTRA_BIOZONA_REPORTADA CASCADE;

CREATE TABLE public.REL_MUESTRA_BIOZONA_REPORTADA (
    rel_muestra_biozona_reportada_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    muestra_id bigint,
    biozona_reportada_id bigint,
    orden_registro bigint,
    tipo_duda_id bigint,
    comentario_catalogador text,
    CONSTRAINT pk_rel_muestra_biozona_reportada PRIMARY KEY (rel_muestra_biozona_reportada_id),
    CONSTRAINT fk_rel_muestra_biozona_reportada_muestra_id FOREIGN KEY (muestra_id) REFERENCES public.MUESTRA(muestra_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_muestra_biozona_reportada_biozona_reportada_id FOREIGN KEY (biozona_reportada_id) REFERENCES public.DIC_BIOZONA_REPORTADA(biozona_reportada_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_muestra_biozona_reportada_tipo_duda_id FOREIGN KEY (tipo_duda_id) REFERENCES public.CAT_TIPO_DUDA(tipo_duda_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.REL_MUESTRA_BIOZONA_REPORTADA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_rel_muestra_biozona_reportada_rel_muestra_biozona_reportada_id ON public.REL_MUESTRA_BIOZONA_REPORTADA(rel_muestra_biozona_reportada_id);
CREATE INDEX idx_rel_muestra_biozona_reportada_muestra_id ON public.REL_MUESTRA_BIOZONA_REPORTADA(muestra_id);
CREATE INDEX idx_rel_muestra_biozona_reportada_biozona_reportada_id ON public.REL_MUESTRA_BIOZONA_REPORTADA(biozona_reportada_id);
CREATE INDEX idx_rel_muestra_biozona_reportada_tipo_duda_id ON public.REL_MUESTRA_BIOZONA_REPORTADA(tipo_duda_id);

-- ============================================================
-- Fase 3: chrono
-- ============================================================

-- ============================================================
-- DIC_RANGO_CRONO
-- ============================================================
DROP TABLE IF EXISTS public.DIC_RANGO_CRONO CASCADE;

CREATE TABLE public.DIC_RANGO_CRONO (
    rango_cronoestratigrafico_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    observaciones text,
    parent_id bigint,
    CONSTRAINT pk_dic_rango_crono PRIMARY KEY (rango_cronoestratigrafico_id),
    CONSTRAINT fk_dic_rango_crono_parent_id FOREIGN KEY (parent_id) REFERENCES public.DIC_RANGO_CRONO(rango_cronoestratigrafico_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.DIC_RANGO_CRONO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_dic_rango_crono_rango_cronoestratigrafico_id ON public.DIC_RANGO_CRONO(rango_cronoestratigrafico_id);
CREATE INDEX idx_dic_rango_crono_parent_id ON public.DIC_RANGO_CRONO(parent_id);

-- ============================================================
-- CAT_TIPO_REF_ESTRATIGRAFICA
-- ============================================================
DROP TABLE IF EXISTS public.CAT_TIPO_REF_ESTRATIGRAFICA CASCADE;

CREATE TABLE public.CAT_TIPO_REF_ESTRATIGRAFICA (
    tipo_ref_estratigrafica_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    descripcion text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_tipo_ref_estratigrafica PRIMARY KEY (tipo_ref_estratigrafica_id),
    CONSTRAINT uq_cat_tipo_ref_estratigrafica_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_TIPO_REF_ESTRATIGRAFICA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_tipo_ref_estratigrafica_tipo_ref_estratigrafica_id ON public.CAT_TIPO_REF_ESTRATIGRAFICA(tipo_ref_estratigrafica_id);

-- Seed CAT_TIPO_REF_ESTRATIGRAFICA
INSERT INTO public.CAT_TIPO_REF_ESTRATIGRAFICA (nombre) VALUES ('Sobre la base') ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_REF_ESTRATIGRAFICA (nombre) VALUES ('Bajo el techo') ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_REF_ESTRATIGRAFICA (nombre) VALUES ('En el núcleo') ON CONFLICT DO NOTHING;

-- ============================================================
-- DIC_EDAD_REPORTADA
-- ============================================================
DROP TABLE IF EXISTS public.DIC_EDAD_REPORTADA CASCADE;

CREATE TABLE public.DIC_EDAD_REPORTADA (
    edad_reportada_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre_reportado varchar(255),
    estado_revision_id bigint,
    catalogador_id bigint,
    fecha_ingreso timestamptz,
    revisor_id bigint,
    fecha_revision timestamptz,
    observaciones text,
    CONSTRAINT pk_dic_edad_reportada PRIMARY KEY (edad_reportada_id),
    CONSTRAINT fk_dic_edad_reportada_estado_revision_id FOREIGN KEY (estado_revision_id) REFERENCES public.CAT_ESTADO_REVISION(estado_revision_id) ON DELETE SET NULL,
    CONSTRAINT fk_dic_edad_reportada_catalogador_id FOREIGN KEY (catalogador_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT fk_dic_edad_reportada_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.DIC_EDAD_REPORTADA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_dic_edad_reportada_edad_reportada_id ON public.DIC_EDAD_REPORTADA(edad_reportada_id);
CREATE INDEX idx_dic_edad_reportada_estado_revision_id ON public.DIC_EDAD_REPORTADA(estado_revision_id);
CREATE INDEX idx_dic_edad_reportada_catalogador_id ON public.DIC_EDAD_REPORTADA(catalogador_id);
CREATE INDEX idx_dic_edad_reportada_revisor_id ON public.DIC_EDAD_REPORTADA(revisor_id);

-- ============================================================
-- DIC_EDAD_NORMALIZADA
-- ============================================================
DROP TABLE IF EXISTS public.DIC_EDAD_NORMALIZADA CASCADE;

CREATE TABLE public.DIC_EDAD_NORMALIZADA (
    edad_normalizada_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre_normalizado varchar(255),
    rango_cronoestratigrafico_id bigint,
    estado_revision_id bigint,
    revisor_id bigint,
    fecha_revision timestamptz,
    observaciones text,
    CONSTRAINT pk_dic_edad_normalizada PRIMARY KEY (edad_normalizada_id),
    CONSTRAINT fk_dic_edad_normalizada_rango_cronoestratigrafico_id FOREIGN KEY (rango_cronoestratigrafico_id) REFERENCES public.DIC_RANGO_CRONO(rango_cronoestratigrafico_id) ON DELETE SET NULL,
    CONSTRAINT fk_dic_edad_normalizada_estado_revision_id FOREIGN KEY (estado_revision_id) REFERENCES public.CAT_ESTADO_REVISION(estado_revision_id) ON DELETE SET NULL,
    CONSTRAINT fk_dic_edad_normalizada_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.DIC_EDAD_NORMALIZADA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_dic_edad_normalizada_edad_normalizada_id ON public.DIC_EDAD_NORMALIZADA(edad_normalizada_id);
CREATE INDEX idx_dic_edad_normalizada_rango_cronoestratigrafico_id ON public.DIC_EDAD_NORMALIZADA(rango_cronoestratigrafico_id);
CREATE INDEX idx_dic_edad_normalizada_estado_revision_id ON public.DIC_EDAD_NORMALIZADA(estado_revision_id);
CREATE INDEX idx_dic_edad_normalizada_revisor_id ON public.DIC_EDAD_NORMALIZADA(revisor_id);

-- ============================================================
-- DIC_EDAD_ACTUALIZADA
-- ============================================================
DROP TABLE IF EXISTS public.DIC_EDAD_ACTUALIZADA CASCADE;

CREATE TABLE public.DIC_EDAD_ACTUALIZADA (
    edad_actualizada_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre_actualizado varchar(255),
    escala_tiempo varchar(255),
    fuente_actualizacion varchar(255),
    revisor_id bigint,
    fecha_revision timestamptz,
    estado_revision_id bigint,
    observaciones text,
    CONSTRAINT pk_dic_edad_actualizada PRIMARY KEY (edad_actualizada_id),
    CONSTRAINT fk_dic_edad_actualizada_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT fk_dic_edad_actualizada_estado_revision_id FOREIGN KEY (estado_revision_id) REFERENCES public.CAT_ESTADO_REVISION(estado_revision_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.DIC_EDAD_ACTUALIZADA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_dic_edad_actualizada_edad_actualizada_id ON public.DIC_EDAD_ACTUALIZADA(edad_actualizada_id);
CREATE INDEX idx_dic_edad_actualizada_revisor_id ON public.DIC_EDAD_ACTUALIZADA(revisor_id);
CREATE INDEX idx_dic_edad_actualizada_estado_revision_id ON public.DIC_EDAD_ACTUALIZADA(estado_revision_id);

-- ============================================================
-- REL_EDAD_REP_NORM
-- ============================================================
DROP TABLE IF EXISTS public.REL_EDAD_REP_NORM CASCADE;

CREATE TABLE public.REL_EDAD_REP_NORM (
    rel_edad_rep_norm_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    edad_reportada_id bigint,
    edad_normalizada_id bigint,
    observaciones text,
    CONSTRAINT pk_rel_edad_rep_norm PRIMARY KEY (rel_edad_rep_norm_id),
    CONSTRAINT fk_rel_edad_rep_norm_edad_reportada_id FOREIGN KEY (edad_reportada_id) REFERENCES public.DIC_EDAD_REPORTADA(edad_reportada_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_edad_rep_norm_edad_normalizada_id FOREIGN KEY (edad_normalizada_id) REFERENCES public.DIC_EDAD_NORMALIZADA(edad_normalizada_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.REL_EDAD_REP_NORM IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_rel_edad_rep_norm_rel_edad_rep_norm_id ON public.REL_EDAD_REP_NORM(rel_edad_rep_norm_id);
CREATE INDEX idx_rel_edad_rep_norm_edad_reportada_id ON public.REL_EDAD_REP_NORM(edad_reportada_id);
CREATE INDEX idx_rel_edad_rep_norm_edad_normalizada_id ON public.REL_EDAD_REP_NORM(edad_normalizada_id);

-- ============================================================
-- REL_EDAD_NORM_ACT
-- ============================================================
DROP TABLE IF EXISTS public.REL_EDAD_NORM_ACT CASCADE;

CREATE TABLE public.REL_EDAD_NORM_ACT (
    rel_edad_norm_act_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    edad_normalizada_id bigint,
    edad_actualizada_id bigint,
    fuente_cambio varchar(255),
    CONSTRAINT pk_rel_edad_norm_act PRIMARY KEY (rel_edad_norm_act_id),
    CONSTRAINT fk_rel_edad_norm_act_edad_normalizada_id FOREIGN KEY (edad_normalizada_id) REFERENCES public.DIC_EDAD_NORMALIZADA(edad_normalizada_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_edad_norm_act_edad_actualizada_id FOREIGN KEY (edad_actualizada_id) REFERENCES public.DIC_EDAD_ACTUALIZADA(edad_actualizada_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.REL_EDAD_NORM_ACT IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_rel_edad_norm_act_rel_edad_norm_act_id ON public.REL_EDAD_NORM_ACT(rel_edad_norm_act_id);
CREATE INDEX idx_rel_edad_norm_act_edad_normalizada_id ON public.REL_EDAD_NORM_ACT(edad_normalizada_id);
CREATE INDEX idx_rel_edad_norm_act_edad_actualizada_id ON public.REL_EDAD_NORM_ACT(edad_actualizada_id);

-- ============================================================
-- REL_MUESTRA_EDAD_REPORTADA
-- ============================================================
DROP TABLE IF EXISTS public.REL_MUESTRA_EDAD_REPORTADA CASCADE;

CREATE TABLE public.REL_MUESTRA_EDAD_REPORTADA (
    rel_muestra_edad_reportada_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    muestra_id bigint,
    edad_reportada_id bigint,
    orden_registro bigint,
    tipo_duda_id bigint,
    comentario_catalogador text,
    CONSTRAINT pk_rel_muestra_edad_reportada PRIMARY KEY (rel_muestra_edad_reportada_id),
    CONSTRAINT fk_rel_muestra_edad_reportada_muestra_id FOREIGN KEY (muestra_id) REFERENCES public.MUESTRA(muestra_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_muestra_edad_reportada_edad_reportada_id FOREIGN KEY (edad_reportada_id) REFERENCES public.DIC_EDAD_REPORTADA(edad_reportada_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_muestra_edad_reportada_tipo_duda_id FOREIGN KEY (tipo_duda_id) REFERENCES public.CAT_TIPO_DUDA(tipo_duda_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.REL_MUESTRA_EDAD_REPORTADA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_rel_muestra_edad_reportada_rel_muestra_edad_reportada_id ON public.REL_MUESTRA_EDAD_REPORTADA(rel_muestra_edad_reportada_id);
CREATE INDEX idx_rel_muestra_edad_reportada_muestra_id ON public.REL_MUESTRA_EDAD_REPORTADA(muestra_id);
CREATE INDEX idx_rel_muestra_edad_reportada_edad_reportada_id ON public.REL_MUESTRA_EDAD_REPORTADA(edad_reportada_id);
CREATE INDEX idx_rel_muestra_edad_reportada_tipo_duda_id ON public.REL_MUESTRA_EDAD_REPORTADA(tipo_duda_id);

-- ============================================================
-- Fase 3: references
-- ============================================================

-- ============================================================
-- CAT_TIPO_DOCUMENTO
-- ============================================================
DROP TABLE IF EXISTS public.CAT_TIPO_DOCUMENTO CASCADE;

CREATE TABLE public.CAT_TIPO_DOCUMENTO (
    tipo_documento_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_tipo_documento PRIMARY KEY (tipo_documento_id),
    CONSTRAINT uq_cat_tipo_documento_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_TIPO_DOCUMENTO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_tipo_documento_tipo_documento_id ON public.CAT_TIPO_DOCUMENTO(tipo_documento_id);

-- Seed CAT_TIPO_DOCUMENTO
INSERT INTO public.CAT_TIPO_DOCUMENTO (nombre) VALUES ('Artículo') ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DOCUMENTO (nombre) VALUES ('Libro') ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DOCUMENTO (nombre) VALUES ('Tesis') ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_DOCUMENTO (nombre) VALUES ('Informe') ON CONFLICT DO NOTHING;

-- ============================================================
-- CAT_TIPO_REFERENCIA
-- ============================================================
DROP TABLE IF EXISTS public.CAT_TIPO_REFERENCIA CASCADE;

CREATE TABLE public.CAT_TIPO_REFERENCIA (
    tipo_referencia_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    descripcion text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_tipo_referencia PRIMARY KEY (tipo_referencia_id),
    CONSTRAINT uq_cat_tipo_referencia_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_TIPO_REFERENCIA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_tipo_referencia_tipo_referencia_id ON public.CAT_TIPO_REFERENCIA(tipo_referencia_id);

-- Seed CAT_TIPO_REFERENCIA
INSERT INTO public.CAT_TIPO_REFERENCIA (nombre) VALUES ('Cita') ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_TIPO_REFERENCIA (nombre) VALUES ('Referencia') ON CONFLICT DO NOTHING;

-- ============================================================
-- CAT_REFERENCIA_BIBLIOGRAFICA
-- ============================================================
DROP TABLE IF EXISTS public.CAT_REFERENCIA_BIBLIOGRAFICA CASCADE;

CREATE TABLE public.CAT_REFERENCIA_BIBLIOGRAFICA (
    referencia_bibliografica_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    cita_corta varchar(255),
    autores varchar(255),
    ano bigint,
    titulo varchar(255),
    fuente varchar(255),
    doi_url varchar(255),
    tipo_documento_id bigint,
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_referencia_bibliografica PRIMARY KEY (referencia_bibliografica_id),
    CONSTRAINT fk_cat_referencia_bibliografica_tipo_documento_id FOREIGN KEY (tipo_documento_id) REFERENCES public.CAT_TIPO_DOCUMENTO(tipo_documento_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.CAT_REFERENCIA_BIBLIOGRAFICA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_referencia_bibliografica_referencia_bibliografica_id ON public.CAT_REFERENCIA_BIBLIOGRAFICA(referencia_bibliografica_id);
CREATE INDEX idx_cat_referencia_bibliografica_tipo_documento_id ON public.CAT_REFERENCIA_BIBLIOGRAFICA(tipo_documento_id);

-- ============================================================
-- REL_MUESTRA_REFERENCIA_BIBLIOGRAFICA
-- ============================================================
DROP TABLE IF EXISTS public.REL_MUESTRA_REFERENCIA_BIBLIOGRAFICA CASCADE;

CREATE TABLE public.REL_MUESTRA_REFERENCIA_BIBLIOGRAFICA (
    rel_muestra_referencia_bibliografica_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    muestra_id bigint,
    referencia_bibliografica_id bigint,
    tipo_referencia_id bigint,
    observaciones text,
    CONSTRAINT pk_rel_muestra_referencia_bibliografica PRIMARY KEY (rel_muestra_referencia_bibliografica_id),
    CONSTRAINT fk_rel_muestra_referencia_bibliografica_muestra_id FOREIGN KEY (muestra_id) REFERENCES public.MUESTRA(muestra_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_muestra_referencia_bibliografica_referencia_bibliografica_id FOREIGN KEY (referencia_bibliografica_id) REFERENCES public.CAT_REFERENCIA_BIBLIOGRAFICA(referencia_bibliografica_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_muestra_referencia_bibliografica_tipo_referencia_id FOREIGN KEY (tipo_referencia_id) REFERENCES public.CAT_TIPO_REFERENCIA(tipo_referencia_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.REL_MUESTRA_REFERENCIA_BIBLIOGRAFICA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_rel_muestra_referencia_bibliografica_rel_muestra_referencia_bibliografica_id ON public.REL_MUESTRA_REFERENCIA_BIBLIOGRAFICA(rel_muestra_referencia_bibliografica_id);
CREATE INDEX idx_rel_muestra_referencia_bibliografica_muestra_id ON public.REL_MUESTRA_REFERENCIA_BIBLIOGRAFICA(muestra_id);
CREATE INDEX idx_rel_muestra_referencia_bibliografica_referencia_bibliografica_id ON public.REL_MUESTRA_REFERENCIA_BIBLIOGRAFICA(referencia_bibliografica_id);
CREATE INDEX idx_rel_muestra_referencia_bibliografica_tipo_referencia_id ON public.REL_MUESTRA_REFERENCIA_BIBLIOGRAFICA(tipo_referencia_id);

-- ============================================================
-- REL_PLACA_REFERENCIA_BIBLIOGRAFICA
-- ============================================================
DROP TABLE IF EXISTS public.REL_PLACA_REFERENCIA_BIBLIOGRAFICA CASCADE;

CREATE TABLE public.REL_PLACA_REFERENCIA_BIBLIOGRAFICA (
    rel_placa_referencia_bibliografica_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    placa_id bigint,
    referencia_bibliografica_id bigint,
    tipo_referencia_id bigint,
    observaciones text,
    CONSTRAINT pk_rel_placa_referencia_bibliografica PRIMARY KEY (rel_placa_referencia_bibliografica_id),
    CONSTRAINT fk_rel_placa_referencia_bibliografica_placa_id FOREIGN KEY (placa_id) REFERENCES public.PLACA(placa_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_placa_referencia_bibliografica_referencia_bibliografica_id FOREIGN KEY (referencia_bibliografica_id) REFERENCES public.CAT_REFERENCIA_BIBLIOGRAFICA(referencia_bibliografica_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_placa_referencia_bibliografica_tipo_referencia_id FOREIGN KEY (tipo_referencia_id) REFERENCES public.CAT_TIPO_REFERENCIA(tipo_referencia_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.REL_PLACA_REFERENCIA_BIBLIOGRAFICA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_rel_placa_referencia_bibliografica_rel_placa_referencia_bibliografica_id ON public.REL_PLACA_REFERENCIA_BIBLIOGRAFICA(rel_placa_referencia_bibliografica_id);
CREATE INDEX idx_rel_placa_referencia_bibliografica_placa_id ON public.REL_PLACA_REFERENCIA_BIBLIOGRAFICA(placa_id);
CREATE INDEX idx_rel_placa_referencia_bibliografica_referencia_bibliografica_id ON public.REL_PLACA_REFERENCIA_BIBLIOGRAFICA(referencia_bibliografica_id);
CREATE INDEX idx_rel_placa_referencia_bibliografica_tipo_referencia_id ON public.REL_PLACA_REFERENCIA_BIBLIOGRAFICA(tipo_referencia_id);

-- ============================================================
-- Fase 3: litho
-- ============================================================

-- ============================================================
-- CAT_RANGO_LITO
-- ============================================================
DROP TABLE IF EXISTS public.CAT_RANGO_LITO CASCADE;

CREATE TABLE public.CAT_RANGO_LITO (
    rango_lito_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_rango_lito PRIMARY KEY (rango_lito_id),
    CONSTRAINT uq_cat_rango_lito_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_RANGO_LITO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_rango_lito_rango_lito_id ON public.CAT_RANGO_LITO(rango_lito_id);

-- ============================================================
-- CAT_ESTADO_NOMENCLATURA
-- ============================================================
DROP TABLE IF EXISTS public.CAT_ESTADO_NOMENCLATURA CASCADE;

CREATE TABLE public.CAT_ESTADO_NOMENCLATURA (
    estado_nomenclatura_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    estado_nomenclatura varchar(255),
    significado text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_estado_nomenclatura PRIMARY KEY (estado_nomenclatura_id)
);

COMMENT ON TABLE public.CAT_ESTADO_NOMENCLATURA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_cat_estado_nomenclatura_estado_nomenclatura_id ON public.CAT_ESTADO_NOMENCLATURA(estado_nomenclatura_id);

-- Seed CAT_ESTADO_NOMENCLATURA
INSERT INTO public.CAT_ESTADO_NOMENCLATURA (estado_nomenclatura, significado) VALUES ('Vigente', 'Nombre vigente y aceptado') ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ESTADO_NOMENCLATURA (estado_nomenclatura, significado) VALUES ('En desuso', 'Nombre que ya no se utiliza') ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ESTADO_NOMENCLATURA (estado_nomenclatura, significado) VALUES ('Sinónimo', 'Nombre sinónimo de otro válido') ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ESTADO_NOMENCLATURA (estado_nomenclatura, significado) VALUES ('Propuesto', 'Nombre propuesto pero no formalizado') ON CONFLICT DO NOTHING;
INSERT INTO public.CAT_ESTADO_NOMENCLATURA (estado_nomenclatura, significado) VALUES ('Revisado', 'Nombre revisado por especialista') ON CONFLICT DO NOTHING;

-- ============================================================
-- DIC_UNI_LITO_REPORTADA
-- ============================================================
DROP TABLE IF EXISTS public.DIC_UNI_LITO_REPORTADA CASCADE;

CREATE TABLE public.DIC_UNI_LITO_REPORTADA (
    uni_lito_reportada_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    codigo_uni_lito_reportada varchar(255),
    nombre_reportado varchar(255),
    catalogador_id bigint,
    fecha_ingreso timestamptz,
    revisor_id bigint,
    fecha_revision timestamptz,
    estado_revision_id bigint,
    observaciones text,
    CONSTRAINT pk_dic_uni_lito_reportada PRIMARY KEY (uni_lito_reportada_id),
    CONSTRAINT fk_dic_uni_lito_reportada_catalogador_id FOREIGN KEY (catalogador_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT fk_dic_uni_lito_reportada_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT fk_dic_uni_lito_reportada_estado_revision_id FOREIGN KEY (estado_revision_id) REFERENCES public.CAT_ESTADO_REVISION(estado_revision_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.DIC_UNI_LITO_REPORTADA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_dic_uni_lito_reportada_uni_lito_reportada_id ON public.DIC_UNI_LITO_REPORTADA(uni_lito_reportada_id);
CREATE INDEX idx_dic_uni_lito_reportada_catalogador_id ON public.DIC_UNI_LITO_REPORTADA(catalogador_id);
CREATE INDEX idx_dic_uni_lito_reportada_revisor_id ON public.DIC_UNI_LITO_REPORTADA(revisor_id);
CREATE INDEX idx_dic_uni_lito_reportada_estado_revision_id ON public.DIC_UNI_LITO_REPORTADA(estado_revision_id);

-- ============================================================
-- DIC_UNI_LITO_NORMALIZADA
-- ============================================================
DROP TABLE IF EXISTS public.DIC_UNI_LITO_NORMALIZADA CASCADE;

CREATE TABLE public.DIC_UNI_LITO_NORMALIZADA (
    uni_lito_normalizada_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    cod_uni_lito_normalizada varchar(255),
    nombre_normalizado varchar(255),
    rango_lito_id bigint,
    referencia_bibliografica_id bigint,
    observaciones text,
    revisor_id bigint,
    estado_revision_id bigint,
    fecha_revision timestamptz,
    CONSTRAINT pk_dic_uni_lito_normalizada PRIMARY KEY (uni_lito_normalizada_id),
    CONSTRAINT fk_dic_uni_lito_normalizada_rango_lito_id FOREIGN KEY (rango_lito_id) REFERENCES public.CAT_RANGO_LITO(rango_lito_id) ON DELETE SET NULL,
    CONSTRAINT fk_dic_uni_lito_normalizada_referencia_bibliografica_id FOREIGN KEY (referencia_bibliografica_id) REFERENCES public.CAT_REFERENCIA_BIBLIOGRAFICA(referencia_bibliografica_id) ON DELETE SET NULL,
    CONSTRAINT fk_dic_uni_lito_normalizada_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT fk_dic_uni_lito_normalizada_estado_revision_id FOREIGN KEY (estado_revision_id) REFERENCES public.CAT_ESTADO_REVISION(estado_revision_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.DIC_UNI_LITO_NORMALIZADA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_dic_uni_lito_normalizada_uni_lito_normalizada_id ON public.DIC_UNI_LITO_NORMALIZADA(uni_lito_normalizada_id);
CREATE INDEX idx_dic_uni_lito_normalizada_rango_lito_id ON public.DIC_UNI_LITO_NORMALIZADA(rango_lito_id);
CREATE INDEX idx_dic_uni_lito_normalizada_referencia_bibliografica_id ON public.DIC_UNI_LITO_NORMALIZADA(referencia_bibliografica_id);
CREATE INDEX idx_dic_uni_lito_normalizada_revisor_id ON public.DIC_UNI_LITO_NORMALIZADA(revisor_id);
CREATE INDEX idx_dic_uni_lito_normalizada_estado_revision_id ON public.DIC_UNI_LITO_NORMALIZADA(estado_revision_id);

-- ============================================================
-- DIC_UNI_LITO_ACTUALIZADA
-- ============================================================
DROP TABLE IF EXISTS public.DIC_UNI_LITO_ACTUALIZADA CASCADE;

CREATE TABLE public.DIC_UNI_LITO_ACTUALIZADA (
    uni_lito_actualizada_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    cod_uni_lito_actualizada varchar(255),
    nombre_oficial varchar(255),
    rango_lito_id bigint,
    estado_nomenclatura_id bigint,
    revisor_id bigint,
    fecha_revision timestamptz,
    estado_revision_id bigint,
    observaciones text,
    CONSTRAINT pk_dic_uni_lito_actualizada PRIMARY KEY (uni_lito_actualizada_id),
    CONSTRAINT fk_dic_uni_lito_actualizada_rango_lito_id FOREIGN KEY (rango_lito_id) REFERENCES public.CAT_RANGO_LITO(rango_lito_id) ON DELETE SET NULL,
    CONSTRAINT fk_dic_uni_lito_actualizada_estado_nomenclatura_id FOREIGN KEY (estado_nomenclatura_id) REFERENCES public.CAT_ESTADO_NOMENCLATURA(estado_nomenclatura_id) ON DELETE SET NULL,
    CONSTRAINT fk_dic_uni_lito_actualizada_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT fk_dic_uni_lito_actualizada_estado_revision_id FOREIGN KEY (estado_revision_id) REFERENCES public.CAT_ESTADO_REVISION(estado_revision_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.DIC_UNI_LITO_ACTUALIZADA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_dic_uni_lito_actualizada_uni_lito_actualizada_id ON public.DIC_UNI_LITO_ACTUALIZADA(uni_lito_actualizada_id);
CREATE INDEX idx_dic_uni_lito_actualizada_rango_lito_id ON public.DIC_UNI_LITO_ACTUALIZADA(rango_lito_id);
CREATE INDEX idx_dic_uni_lito_actualizada_estado_nomenclatura_id ON public.DIC_UNI_LITO_ACTUALIZADA(estado_nomenclatura_id);
CREATE INDEX idx_dic_uni_lito_actualizada_revisor_id ON public.DIC_UNI_LITO_ACTUALIZADA(revisor_id);
CREATE INDEX idx_dic_uni_lito_actualizada_estado_revision_id ON public.DIC_UNI_LITO_ACTUALIZADA(estado_revision_id);

-- ============================================================
-- DIC_DESCRIPCION_LITO_REPORTADA
-- ============================================================
DROP TABLE IF EXISTS public.DIC_DESCRIPCION_LITO_REPORTADA CASCADE;

CREATE TABLE public.DIC_DESCRIPCION_LITO_REPORTADA (
    descripcion_lito_reportada_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    descripcion_reportada text,
    minerales varchar(255),
    estado_catalogacion_id bigint,
    catalogador_id bigint,
    fecha_ingreso timestamptz,
    revisor_id bigint,
    fecha_revision timestamptz,
    observaciones text,
    CONSTRAINT pk_dic_descripcion_lito_reportada PRIMARY KEY (descripcion_lito_reportada_id),
    CONSTRAINT fk_dic_descripcion_lito_reportada_estado_catalogacion_id FOREIGN KEY (estado_catalogacion_id) REFERENCES public.CAT_ESTADO_CATALOGACION(estado_catalogacion_id) ON DELETE SET NULL,
    CONSTRAINT fk_dic_descripcion_lito_reportada_catalogador_id FOREIGN KEY (catalogador_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT fk_dic_descripcion_lito_reportada_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.DIC_DESCRIPCION_LITO_REPORTADA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_dic_descripcion_lito_reportada_descripcion_lito_reportada_id ON public.DIC_DESCRIPCION_LITO_REPORTADA(descripcion_lito_reportada_id);
CREATE INDEX idx_dic_descripcion_lito_reportada_estado_catalogacion_id ON public.DIC_DESCRIPCION_LITO_REPORTADA(estado_catalogacion_id);
CREATE INDEX idx_dic_descripcion_lito_reportada_catalogador_id ON public.DIC_DESCRIPCION_LITO_REPORTADA(catalogador_id);
CREATE INDEX idx_dic_descripcion_lito_reportada_revisor_id ON public.DIC_DESCRIPCION_LITO_REPORTADA(revisor_id);

-- ============================================================
-- DIC_DESCRIPCION_LITO_NORM
-- ============================================================
DROP TABLE IF EXISTS public.DIC_DESCRIPCION_LITO_NORM CASCADE;

CREATE TABLE public.DIC_DESCRIPCION_LITO_NORM (
    descripcion_lito_normalizada_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    litologia_principal varchar(255),
    modificador varchar(255),
    revisor_id bigint,
    fecha_revision timestamptz,
    observaciones text,
    CONSTRAINT pk_dic_descripcion_lito_norm PRIMARY KEY (descripcion_lito_normalizada_id),
    CONSTRAINT fk_dic_descripcion_lito_norm_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.DIC_DESCRIPCION_LITO_NORM IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_dic_descripcion_lito_norm_descripcion_lito_normalizada_id ON public.DIC_DESCRIPCION_LITO_NORM(descripcion_lito_normalizada_id);
CREATE INDEX idx_dic_descripcion_lito_norm_revisor_id ON public.DIC_DESCRIPCION_LITO_NORM(revisor_id);

-- ============================================================
-- REL_MUESTRA_DESCRIPCION_LITO
-- ============================================================
DROP TABLE IF EXISTS public.REL_MUESTRA_DESCRIPCION_LITO CASCADE;

CREATE TABLE public.REL_MUESTRA_DESCRIPCION_LITO (
    rel_muestra_descripcion_lito_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    muestra_id bigint,
    descripcion_lito_reportada_id bigint,
    orden_registro bigint,
    tipo_duda_id bigint,
    comentario_catalogador text,
    CONSTRAINT pk_rel_muestra_descripcion_lito PRIMARY KEY (rel_muestra_descripcion_lito_id),
    CONSTRAINT fk_rel_muestra_descripcion_lito_muestra_id FOREIGN KEY (muestra_id) REFERENCES public.MUESTRA(muestra_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_muestra_descripcion_lito_descripcion_lito_reportada_id FOREIGN KEY (descripcion_lito_reportada_id) REFERENCES public.DIC_DESCRIPCION_LITO_REPORTADA(descripcion_lito_reportada_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_muestra_descripcion_lito_tipo_duda_id FOREIGN KEY (tipo_duda_id) REFERENCES public.CAT_TIPO_DUDA(tipo_duda_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.REL_MUESTRA_DESCRIPCION_LITO IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_rel_muestra_descripcion_lito_rel_muestra_descripcion_lito_id ON public.REL_MUESTRA_DESCRIPCION_LITO(rel_muestra_descripcion_lito_id);
CREATE INDEX idx_rel_muestra_descripcion_lito_muestra_id ON public.REL_MUESTRA_DESCRIPCION_LITO(muestra_id);
CREATE INDEX idx_rel_muestra_descripcion_lito_descripcion_lito_reportada_id ON public.REL_MUESTRA_DESCRIPCION_LITO(descripcion_lito_reportada_id);
CREATE INDEX idx_rel_muestra_descripcion_lito_tipo_duda_id ON public.REL_MUESTRA_DESCRIPCION_LITO(tipo_duda_id);

-- ============================================================
-- REL_MUESTRA_DESC_LITO_REP_NORM
-- ============================================================
DROP TABLE IF EXISTS public.REL_MUESTRA_DESC_LITO_REP_NORM CASCADE;

CREATE TABLE public.REL_MUESTRA_DESC_LITO_REP_NORM (
    rel_descripcion_lito_rep_norm_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    descripcion_lito_reportada_id bigint,
    descripcion_lito_normalizada_id bigint,
    observaciones text,
    CONSTRAINT pk_rel_muestra_desc_lito_rep_norm PRIMARY KEY (rel_descripcion_lito_rep_norm_id),
    CONSTRAINT fk_rel_muestra_desc_lito_rep_norm_descripcion_lito_reportada_id FOREIGN KEY (descripcion_lito_reportada_id) REFERENCES public.DIC_DESCRIPCION_LITO_REPORTADA(descripcion_lito_reportada_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_muestra_desc_lito_rep_norm_descripcion_lito_normalizada_id FOREIGN KEY (descripcion_lito_normalizada_id) REFERENCES public.DIC_DESCRIPCION_LITO_NORM(descripcion_lito_normalizada_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.REL_MUESTRA_DESC_LITO_REP_NORM IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_rel_muestra_desc_lito_rep_norm_rel_descripcion_lito_rep_norm_id ON public.REL_MUESTRA_DESC_LITO_REP_NORM(rel_descripcion_lito_rep_norm_id);
CREATE INDEX idx_rel_muestra_desc_lito_rep_norm_descripcion_lito_reportada_id ON public.REL_MUESTRA_DESC_LITO_REP_NORM(descripcion_lito_reportada_id);
CREATE INDEX idx_rel_muestra_desc_lito_rep_norm_descripcion_lito_normalizada_id ON public.REL_MUESTRA_DESC_LITO_REP_NORM(descripcion_lito_normalizada_id);

-- ============================================================
-- REL_MUESTRA_UNI_LITO_REPORTADA
-- ============================================================
DROP TABLE IF EXISTS public.REL_MUESTRA_UNI_LITO_REPORTADA CASCADE;

CREATE TABLE public.REL_MUESTRA_UNI_LITO_REPORTADA (
    rel_muestra_uni_lito_reportada_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    muestra_id bigint,
    uni_lito_reportada_id bigint,
    tipo_duda_id bigint,
    comentario_catalogador text,
    CONSTRAINT pk_rel_muestra_uni_lito_reportada PRIMARY KEY (rel_muestra_uni_lito_reportada_id),
    CONSTRAINT fk_rel_muestra_uni_lito_reportada_muestra_id FOREIGN KEY (muestra_id) REFERENCES public.MUESTRA(muestra_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_muestra_uni_lito_reportada_uni_lito_reportada_id FOREIGN KEY (uni_lito_reportada_id) REFERENCES public.DIC_UNI_LITO_REPORTADA(uni_lito_reportada_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_muestra_uni_lito_reportada_tipo_duda_id FOREIGN KEY (tipo_duda_id) REFERENCES public.CAT_TIPO_DUDA(tipo_duda_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.REL_MUESTRA_UNI_LITO_REPORTADA IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_rel_muestra_uni_lito_reportada_rel_muestra_uni_lito_reportada_id ON public.REL_MUESTRA_UNI_LITO_REPORTADA(rel_muestra_uni_lito_reportada_id);
CREATE INDEX idx_rel_muestra_uni_lito_reportada_muestra_id ON public.REL_MUESTRA_UNI_LITO_REPORTADA(muestra_id);
CREATE INDEX idx_rel_muestra_uni_lito_reportada_uni_lito_reportada_id ON public.REL_MUESTRA_UNI_LITO_REPORTADA(uni_lito_reportada_id);
CREATE INDEX idx_rel_muestra_uni_lito_reportada_tipo_duda_id ON public.REL_MUESTRA_UNI_LITO_REPORTADA(tipo_duda_id);

-- ============================================================
-- REL_MUESTRA_UNI_LITO_REP_NORM
-- ============================================================
DROP TABLE IF EXISTS public.REL_MUESTRA_UNI_LITO_REP_NORM CASCADE;

CREATE TABLE public.REL_MUESTRA_UNI_LITO_REP_NORM (
    rel_uni_lito_rep_norm_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    uni_lito_reportada_id bigint,
    uni_lito_normalizada_id bigint,
    observaciones text,
    CONSTRAINT pk_rel_muestra_uni_lito_rep_norm PRIMARY KEY (rel_uni_lito_rep_norm_id),
    CONSTRAINT fk_rel_muestra_uni_lito_rep_norm_uni_lito_reportada_id FOREIGN KEY (uni_lito_reportada_id) REFERENCES public.DIC_UNI_LITO_REPORTADA(uni_lito_reportada_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_muestra_uni_lito_rep_norm_uni_lito_normalizada_id FOREIGN KEY (uni_lito_normalizada_id) REFERENCES public.DIC_UNI_LITO_NORMALIZADA(uni_lito_normalizada_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.REL_MUESTRA_UNI_LITO_REP_NORM IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_rel_muestra_uni_lito_rep_norm_rel_uni_lito_rep_norm_id ON public.REL_MUESTRA_UNI_LITO_REP_NORM(rel_uni_lito_rep_norm_id);
CREATE INDEX idx_rel_muestra_uni_lito_rep_norm_uni_lito_reportada_id ON public.REL_MUESTRA_UNI_LITO_REP_NORM(uni_lito_reportada_id);
CREATE INDEX idx_rel_muestra_uni_lito_rep_norm_uni_lito_normalizada_id ON public.REL_MUESTRA_UNI_LITO_REP_NORM(uni_lito_normalizada_id);

-- ============================================================
-- REL_MUESTRA_UNI_LITO_NORM_ACT
-- ============================================================
DROP TABLE IF EXISTS public.REL_MUESTRA_UNI_LITO_NORM_ACT CASCADE;

CREATE TABLE public.REL_MUESTRA_UNI_LITO_NORM_ACT (
    rel_uni_lito_norm_act_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    uni_lito_normalizada_id bigint,
    uni_lito_actualizada_id bigint,
    observaciones text,
    CONSTRAINT pk_rel_muestra_uni_lito_norm_act PRIMARY KEY (rel_uni_lito_norm_act_id),
    CONSTRAINT fk_rel_muestra_uni_lito_norm_act_uni_lito_normalizada_id FOREIGN KEY (uni_lito_normalizada_id) REFERENCES public.DIC_UNI_LITO_NORMALIZADA(uni_lito_normalizada_id) ON DELETE SET NULL,
    CONSTRAINT fk_rel_muestra_uni_lito_norm_act_uni_lito_actualizada_id FOREIGN KEY (uni_lito_actualizada_id) REFERENCES public.DIC_UNI_LITO_ACTUALIZADA(uni_lito_actualizada_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.REL_MUESTRA_UNI_LITO_NORM_ACT IS 'Tabla generada desde el inventario de campos.';

CREATE INDEX idx_rel_muestra_uni_lito_norm_act_rel_uni_lito_norm_act_id ON public.REL_MUESTRA_UNI_LITO_NORM_ACT(rel_uni_lito_norm_act_id);
CREATE INDEX idx_rel_muestra_uni_lito_norm_act_uni_lito_normalizada_id ON public.REL_MUESTRA_UNI_LITO_NORM_ACT(uni_lito_normalizada_id);
CREATE INDEX idx_rel_muestra_uni_lito_norm_act_uni_lito_actualizada_id ON public.REL_MUESTRA_UNI_LITO_NORM_ACT(uni_lito_actualizada_id);

-- ============================================================
-- Fase 4: Documents + Relations + Localization
-- ============================================================

-- ============================================================
-- CAT_IDIOMA
-- ============================================================
DROP TABLE IF EXISTS public.CAT_IDIOMA CASCADE;

CREATE TABLE public.CAT_IDIOMA (
    idioma_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    codigo_iso varchar(10),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_idioma PRIMARY KEY (idioma_id),
    CONSTRAINT uq_cat_idioma_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_IDIOMA IS 'Catálogo de idiomas para documentos asociados.';

CREATE INDEX idx_cat_idioma_idioma_id ON public.CAT_IDIOMA(idioma_id);

INSERT INTO public.CAT_IDIOMA (nombre, codigo_iso) VALUES
    ('Español', 'es'),
    ('Inglés', 'en'),
    ('Francés', 'fr')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- CAT_FORMATO_DOCUMENTO
-- ============================================================
DROP TABLE IF EXISTS public.CAT_FORMATO_DOCUMENTO CASCADE;

CREATE TABLE public.CAT_FORMATO_DOCUMENTO (
    formato_documento_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    descripcion text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_formato_documento PRIMARY KEY (formato_documento_id),
    CONSTRAINT uq_cat_formato_documento_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_FORMATO_DOCUMENTO IS 'Formato físico o digital de un documento asociado.';

CREATE INDEX idx_cat_formato_documento_formato_documento_id ON public.CAT_FORMATO_DOCUMENTO(formato_documento_id);

INSERT INTO public.CAT_FORMATO_DOCUMENTO (nombre) VALUES
    ('Original'),
    ('Fotocopia'),
    ('PDF'),
    ('Manuscrito'),
    ('Escaneado')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- CAT_TIPO_DOCUMENTO_ASOCIADO
-- ============================================================
DROP TABLE IF EXISTS public.CAT_TIPO_DOCUMENTO_ASOCIADO CASCADE;

CREATE TABLE public.CAT_TIPO_DOCUMENTO_ASOCIADO (
    tipo_documento_asociado_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    codigo_documento varchar(255),
    nombre varchar(255),
    descripcion text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_tipo_documento_asociado PRIMARY KEY (tipo_documento_asociado_id),
    CONSTRAINT uq_cat_tipo_documento_asociado_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_TIPO_DOCUMENTO_ASOCIADO IS 'Tipos de documentos vinculados a registros científicos.';

CREATE INDEX idx_cat_tipo_documento_asociado_tipo_documento_asociado_id ON public.CAT_TIPO_DOCUMENTO_ASOCIADO(tipo_documento_asociado_id);

INSERT INTO public.CAT_TIPO_DOCUMENTO_ASOCIADO (codigo_documento, nombre) VALUES
    ('CARTA_DIST', 'Carta distribución'),
    ('RES_ESTRAT', 'Resumen estratigráfico'),
    ('INF_BIOEST', 'Informe bioestratigráfico'),
    ('FOTOGRAFIA', 'Fotografía'),
    ('NOTA_CAMPO', 'Nota de campo'),
    ('MAPA_GEO', 'Mapa geológico')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- CAT_DOCUMENTO_FAMILIA
-- ============================================================
DROP TABLE IF EXISTS public.CAT_DOCUMENTO_FAMILIA CASCADE;

CREATE TABLE public.CAT_DOCUMENTO_FAMILIA (
    documento_familia_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    titulo_base varchar(255),
    tipo_documento_asociado_id bigint,
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_documento_familia PRIMARY KEY (documento_familia_id),
    CONSTRAINT fk_cat_documento_familia_tipo_documento_asociado_id FOREIGN KEY (tipo_documento_asociado_id) REFERENCES public.CAT_TIPO_DOCUMENTO_ASOCIADO(tipo_documento_asociado_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.CAT_DOCUMENTO_FAMILIA IS 'Agrupación lógica de documentos por título base y tipo.';

CREATE INDEX idx_cat_documento_familia_documento_familia_id ON public.CAT_DOCUMENTO_FAMILIA(documento_familia_id);
CREATE INDEX idx_cat_documento_familia_tipo_documento_asociado_id ON public.CAT_DOCUMENTO_FAMILIA(tipo_documento_asociado_id);

-- ============================================================
-- CAT_TIPO_RELACION_DOCUMENTO
-- ============================================================
DROP TABLE IF EXISTS public.CAT_TIPO_RELACION_DOCUMENTO CASCADE;

CREATE TABLE public.CAT_TIPO_RELACION_DOCUMENTO (
    tipo_relacion_documento_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    descripcion text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_tipo_relacion_documento PRIMARY KEY (tipo_relacion_documento_id),
    CONSTRAINT uq_cat_tipo_relacion_documento_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_TIPO_RELACION_DOCUMENTO IS 'Tipos de relación entre documentos (jerárquica, derivativa, etc.).';

CREATE INDEX idx_cat_tipo_relacion_documento_tipo_relacion_documento_id ON public.CAT_TIPO_RELACION_DOCUMENTO(tipo_relacion_documento_id);

INSERT INTO public.CAT_TIPO_RELACION_DOCUMENTO (nombre, descripcion) VALUES
    ('Anexo de', 'Documento que se anexa a otro'),
    ('Versión de', 'Versión alternativa del mismo documento'),
    ('Digitalización de', 'Versión digital de un documento físico'),
    ('Derivado de', 'Documento derivado de otro')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- DOCUMENTO_ASOCIADO
-- ============================================================
DROP TABLE IF EXISTS public.DOCUMENTO_ASOCIADO CASCADE;

CREATE TABLE public.DOCUMENTO_ASOCIADO (
    documento_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    documento_familia_id bigint,
    version_documento varchar(255),
    titulo_documento varchar(255),
    tipo_documento_asociado_id bigint,
    fecha_documento timestamptz,
    resumen text,
    entidad_id bigint,
    idioma_id bigint,
    formato_documento_id bigint,
    numero_paginas bigint,
    documento_digitalizado boolean,
    nombre_archivo varchar(255),
    ruta_archivo varchar(255),
    fecha_digitalizacion timestamptz,
    estado_catalogacion_id bigint,
    catalogador_id bigint,
    fecha_ingreso timestamptz,
    revisor_id bigint,
    fecha_revision timestamptz,
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_documento_asociado PRIMARY KEY (documento_id),
    CONSTRAINT fk_documento_asociado_documento_familia_id FOREIGN KEY (documento_familia_id) REFERENCES public.CAT_DOCUMENTO_FAMILIA(documento_familia_id) ON DELETE SET NULL,
    CONSTRAINT fk_documento_asociado_tipo_documento_asociado_id FOREIGN KEY (tipo_documento_asociado_id) REFERENCES public.CAT_TIPO_DOCUMENTO_ASOCIADO(tipo_documento_asociado_id) ON DELETE SET NULL,
    CONSTRAINT fk_documento_asociado_entidad_id FOREIGN KEY (entidad_id) REFERENCES public.CAT_ENTIDAD(entidad_id) ON DELETE SET NULL,
    CONSTRAINT fk_documento_asociado_idioma_id FOREIGN KEY (idioma_id) REFERENCES public.CAT_IDIOMA(idioma_id) ON DELETE SET NULL,
    CONSTRAINT fk_documento_asociado_formato_documento_id FOREIGN KEY (formato_documento_id) REFERENCES public.CAT_FORMATO_DOCUMENTO(formato_documento_id) ON DELETE SET NULL,
    CONSTRAINT fk_documento_asociado_estado_catalogacion_id FOREIGN KEY (estado_catalogacion_id) REFERENCES public.CAT_ESTADO_CATALOGACION(estado_catalogacion_id) ON DELETE SET NULL,
    CONSTRAINT fk_documento_asociado_catalogador_id FOREIGN KEY (catalogador_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT fk_documento_asociado_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.DOCUMENTO_ASOCIADO IS 'Documentos vinculados a placas, muestras, pozos y secciones estratigráficas.';

CREATE INDEX idx_documento_asociado_documento_id ON public.DOCUMENTO_ASOCIADO(documento_id);
CREATE INDEX idx_documento_asociado_documento_familia_id ON public.DOCUMENTO_ASOCIADO(documento_familia_id);
CREATE INDEX idx_documento_asociado_tipo_documento_asociado_id ON public.DOCUMENTO_ASOCIADO(tipo_documento_asociado_id);
CREATE INDEX idx_documento_asociado_entidad_id ON public.DOCUMENTO_ASOCIADO(entidad_id);
CREATE INDEX idx_documento_asociado_idioma_id ON public.DOCUMENTO_ASOCIADO(idioma_id);
CREATE INDEX idx_documento_asociado_formato_documento_id ON public.DOCUMENTO_ASOCIADO(formato_documento_id);
CREATE INDEX idx_documento_asociado_estado_catalogacion_id ON public.DOCUMENTO_ASOCIADO(estado_catalogacion_id);
CREATE INDEX idx_documento_asociado_catalogador_id ON public.DOCUMENTO_ASOCIADO(catalogador_id);
CREATE INDEX idx_documento_asociado_revisor_id ON public.DOCUMENTO_ASOCIADO(revisor_id);

-- ============================================================
-- DOCUMENTO_SECCION
-- ============================================================
DROP TABLE IF EXISTS public.DOCUMENTO_SECCION CASCADE;

CREATE TABLE public.DOCUMENTO_SECCION (
    documento_seccion_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    documento_id bigint,
    pagina_inicial varchar(255),
    pagina_final varchar(255),
    titulo_seccion varchar(255),
    catalogador_id bigint,
    fecha_ingreso timestamptz,
    estado_catalogacion_id bigint,
    revisor_id bigint,
    fecha_revision timestamptz,
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_documento_seccion PRIMARY KEY (documento_seccion_id),
    CONSTRAINT fk_documento_seccion_documento_id FOREIGN KEY (documento_id) REFERENCES public.DOCUMENTO_ASOCIADO(documento_id) ON DELETE CASCADE,
    CONSTRAINT fk_documento_seccion_catalogador_id FOREIGN KEY (catalogador_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT fk_documento_seccion_estado_catalogacion_id FOREIGN KEY (estado_catalogacion_id) REFERENCES public.CAT_ESTADO_CATALOGACION(estado_catalogacion_id) ON DELETE SET NULL,
    CONSTRAINT fk_documento_seccion_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.DOCUMENTO_SECCION IS 'Secciones internas de un documento asociado (artículos, capítulos, etc.).';

CREATE INDEX idx_documento_seccion_documento_seccion_id ON public.DOCUMENTO_SECCION(documento_seccion_id);
CREATE INDEX idx_documento_seccion_documento_id ON public.DOCUMENTO_SECCION(documento_id);
CREATE INDEX idx_documento_seccion_catalogador_id ON public.DOCUMENTO_SECCION(catalogador_id);
CREATE INDEX idx_documento_seccion_estado_catalogacion_id ON public.DOCUMENTO_SECCION(estado_catalogacion_id);
CREATE INDEX idx_documento_seccion_revisor_id ON public.DOCUMENTO_SECCION(revisor_id);

-- ============================================================
-- REL_DOCUMENTO_DOCUMENTO
-- ============================================================
DROP TABLE IF EXISTS public.REL_DOCUMENTO_DOCUMENTO CASCADE;

CREATE TABLE public.REL_DOCUMENTO_DOCUMENTO (
    rel_documento_documento_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    documento_padre_id bigint,
    documento_hijo_id bigint,
    tipo_relacion_documento_id bigint,
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_rel_documento_documento PRIMARY KEY (rel_documento_documento_id),
    CONSTRAINT fk_rel_documento_documento_documento_padre_id FOREIGN KEY (documento_padre_id) REFERENCES public.DOCUMENTO_ASOCIADO(documento_id) ON DELETE CASCADE,
    CONSTRAINT fk_rel_documento_documento_documento_hijo_id FOREIGN KEY (documento_hijo_id) REFERENCES public.DOCUMENTO_ASOCIADO(documento_id) ON DELETE CASCADE,
    CONSTRAINT fk_rel_documento_documento_tipo_relacion_documento_id FOREIGN KEY (tipo_relacion_documento_id) REFERENCES public.CAT_TIPO_RELACION_DOCUMENTO(tipo_relacion_documento_id) ON DELETE SET NULL,
    CONSTRAINT chk_rel_documento_documento_no_self CHECK (documento_padre_id <> documento_hijo_id)
);

COMMENT ON TABLE public.REL_DOCUMENTO_DOCUMENTO IS 'Relaciones jerárquicas o derivativas entre documentos asociados.';

CREATE INDEX idx_rel_documento_documento_rel_documento_documento_id ON public.REL_DOCUMENTO_DOCUMENTO(rel_documento_documento_id);
CREATE INDEX idx_rel_documento_documento_documento_padre_id ON public.REL_DOCUMENTO_DOCUMENTO(documento_padre_id);
CREATE INDEX idx_rel_documento_documento_documento_hijo_id ON public.REL_DOCUMENTO_DOCUMENTO(documento_hijo_id);
CREATE INDEX idx_rel_documento_documento_tipo_relacion_documento_id ON public.REL_DOCUMENTO_DOCUMENTO(tipo_relacion_documento_id);

-- ============================================================
-- REL_DOCUMENTO_MUESTRA
-- ============================================================
DROP TABLE IF EXISTS public.REL_DOCUMENTO_MUESTRA CASCADE;

CREATE TABLE public.REL_DOCUMENTO_MUESTRA (
    rel_documento_muestra_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    documento_id bigint,
    muestra_id bigint,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_rel_documento_muestra PRIMARY KEY (rel_documento_muestra_id),
    CONSTRAINT fk_rel_documento_muestra_documento_id FOREIGN KEY (documento_id) REFERENCES public.DOCUMENTO_ASOCIADO(documento_id) ON DELETE CASCADE,
    CONSTRAINT fk_rel_documento_muestra_muestra_id FOREIGN KEY (muestra_id) REFERENCES public.MUESTRA(muestra_id) ON DELETE CASCADE
);

COMMENT ON TABLE public.REL_DOCUMENTO_MUESTRA IS 'Vínculo entre documentos y muestras.';

CREATE INDEX idx_rel_documento_muestra_rel_documento_muestra_id ON public.REL_DOCUMENTO_MUESTRA(rel_documento_muestra_id);
CREATE INDEX idx_rel_documento_muestra_documento_id ON public.REL_DOCUMENTO_MUESTRA(documento_id);
CREATE INDEX idx_rel_documento_muestra_muestra_id ON public.REL_DOCUMENTO_MUESTRA(muestra_id);

-- ============================================================
-- REL_DOCUMENTO_PLACA
-- ============================================================
DROP TABLE IF EXISTS public.REL_DOCUMENTO_PLACA CASCADE;

CREATE TABLE public.REL_DOCUMENTO_PLACA (
    rel_documento_placa_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    documento_id bigint,
    placa_id bigint,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_rel_documento_placa PRIMARY KEY (rel_documento_placa_id),
    CONSTRAINT fk_rel_documento_placa_documento_id FOREIGN KEY (documento_id) REFERENCES public.DOCUMENTO_ASOCIADO(documento_id) ON DELETE CASCADE,
    CONSTRAINT fk_rel_documento_placa_placa_id FOREIGN KEY (placa_id) REFERENCES public.PLACA(placa_id) ON DELETE CASCADE
);

COMMENT ON TABLE public.REL_DOCUMENTO_PLACA IS 'Vínculo entre documentos y placas.';

CREATE INDEX idx_rel_documento_placa_rel_documento_placa_id ON public.REL_DOCUMENTO_PLACA(rel_documento_placa_id);
CREATE INDEX idx_rel_documento_placa_documento_id ON public.REL_DOCUMENTO_PLACA(documento_id);
CREATE INDEX idx_rel_documento_placa_placa_id ON public.REL_DOCUMENTO_PLACA(placa_id);

-- ============================================================
-- REL_DOCUMENTO_POZO
-- ============================================================
DROP TABLE IF EXISTS public.REL_DOCUMENTO_POZO CASCADE;

CREATE TABLE public.REL_DOCUMENTO_POZO (
    rel_documento_pozo_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    documento_id bigint,
    pozo_id bigint,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_rel_documento_pozo PRIMARY KEY (rel_documento_pozo_id),
    CONSTRAINT fk_rel_documento_pozo_documento_id FOREIGN KEY (documento_id) REFERENCES public.DOCUMENTO_ASOCIADO(documento_id) ON DELETE CASCADE,
    CONSTRAINT fk_rel_documento_pozo_pozo_id FOREIGN KEY (pozo_id) REFERENCES public.POZO(pozo_id) ON DELETE CASCADE
);

COMMENT ON TABLE public.REL_DOCUMENTO_POZO IS 'Vínculo entre documentos y pozos.';

CREATE INDEX idx_rel_documento_pozo_rel_documento_pozo_id ON public.REL_DOCUMENTO_POZO(rel_documento_pozo_id);
CREATE INDEX idx_rel_documento_pozo_documento_id ON public.REL_DOCUMENTO_POZO(documento_id);
CREATE INDEX idx_rel_documento_pozo_pozo_id ON public.REL_DOCUMENTO_POZO(pozo_id);

-- ============================================================
-- REL_DOCUMENTO_PROYECTO
-- ============================================================
DROP TABLE IF EXISTS public.REL_DOCUMENTO_PROYECTO CASCADE;

CREATE TABLE public.REL_DOCUMENTO_PROYECTO (
    rel_documento_proyecto_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    documento_id bigint,
    proyecto_id bigint,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_rel_documento_proyecto PRIMARY KEY (rel_documento_proyecto_id),
    CONSTRAINT fk_rel_documento_proyecto_documento_id FOREIGN KEY (documento_id) REFERENCES public.DOCUMENTO_ASOCIADO(documento_id) ON DELETE CASCADE,
    CONSTRAINT fk_rel_documento_proyecto_proyecto_id FOREIGN KEY (proyecto_id) REFERENCES public.CAT_PROYECTO(proyecto_id) ON DELETE CASCADE
);

COMMENT ON TABLE public.REL_DOCUMENTO_PROYECTO IS 'Vínculo entre documentos y proyectos.';

CREATE INDEX idx_rel_documento_proyecto_rel_documento_proyecto_id ON public.REL_DOCUMENTO_PROYECTO(rel_documento_proyecto_id);
CREATE INDEX idx_rel_documento_proyecto_documento_id ON public.REL_DOCUMENTO_PROYECTO(documento_id);
CREATE INDEX idx_rel_documento_proyecto_proyecto_id ON public.REL_DOCUMENTO_PROYECTO(proyecto_id);

-- ============================================================
-- Fase 4 (continuación): Localization + Spatial + Stratigraphic
-- ============================================================

-- ============================================================
-- CAT_PAIS
-- ============================================================
DROP TABLE IF EXISTS public.CAT_PAIS CASCADE;

CREATE TABLE public.CAT_PAIS (
    pais_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre_pais varchar(255),
    codigo_iso varchar(10),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_pais PRIMARY KEY (pais_id),
    CONSTRAINT uq_cat_pais_nombre_pais UNIQUE (nombre_pais)
);

COMMENT ON TABLE public.CAT_PAIS IS 'Catálogo de países para localización geográfica.';

CREATE INDEX idx_cat_pais_pais_id ON public.CAT_PAIS(pais_id);

INSERT INTO public.CAT_PAIS (nombre_pais, codigo_iso) VALUES ('Colombia', 'CO') ON CONFLICT (nombre_pais) DO NOTHING;

-- ============================================================
-- CAT_DEPARTAMENTO
-- ============================================================
DROP TABLE IF EXISTS public.CAT_DEPARTAMENTO CASCADE;

CREATE TABLE public.CAT_DEPARTAMENTO (
    departamento_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    pais_id bigint,
    nombre_departamento varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_departamento PRIMARY KEY (departamento_id),
    CONSTRAINT fk_cat_departamento_pais_id FOREIGN KEY (pais_id) REFERENCES public.CAT_PAIS(pais_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.CAT_DEPARTAMENTO IS 'División administrativa primaria (departamento/estado/provincia).';

CREATE INDEX idx_cat_departamento_departamento_id ON public.CAT_DEPARTAMENTO(departamento_id);
CREATE INDEX idx_cat_departamento_pais_id ON public.CAT_DEPARTAMENTO(pais_id);

-- ============================================================
-- CAT_MUNICIPIO
-- ============================================================
DROP TABLE IF EXISTS public.CAT_MUNICIPIO CASCADE;

CREATE TABLE public.CAT_MUNICIPIO (
    municipio_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    departamento_id bigint,
    nombre_municipio varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_municipio PRIMARY KEY (municipio_id),
    CONSTRAINT fk_cat_municipio_departamento_id FOREIGN KEY (departamento_id) REFERENCES public.CAT_DEPARTAMENTO(departamento_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.CAT_MUNICIPIO IS 'División administrativa secundaria (municipio/ciudad).';

CREATE INDEX idx_cat_municipio_municipio_id ON public.CAT_MUNICIPIO(municipio_id);
CREATE INDEX idx_cat_municipio_departamento_id ON public.CAT_MUNICIPIO(departamento_id);

-- ============================================================
-- CAT_VIA_NORM
-- ============================================================
DROP TABLE IF EXISTS public.CAT_VIA_NORM CASCADE;

CREATE TABLE public.CAT_VIA_NORM (
    via_norm_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre_normalizado varchar(255),
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_via_norm PRIMARY KEY (via_norm_id)
);

COMMENT ON TABLE public.CAT_VIA_NORM IS 'Nombres normalizados de vías para localización geográfica.';

CREATE INDEX idx_cat_via_norm_via_norm_id ON public.CAT_VIA_NORM(via_norm_id);

-- ============================================================
-- CAT_ACCIDENTE_GEOGRAFICO_NORM
-- ============================================================
DROP TABLE IF EXISTS public.CAT_ACCIDENTE_GEOGRAFICO_NORM CASCADE;

CREATE TABLE public.CAT_ACCIDENTE_GEOGRAFICO_NORM (
    accidente_geografico_norm_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    tipo varchar(255),
    nombre_normalizado varchar(255),
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_accidente_geografico_norm PRIMARY KEY (accidente_geografico_norm_id)
);

COMMENT ON TABLE public.CAT_ACCIDENTE_GEOGRAFICO_NORM IS 'Nombres normalizados de accidentes geográficos (quebradas, ríos, cerros, etc.).';

CREATE INDEX idx_cat_accidente_geografico_norm_accidente_geografico_norm_id ON public.CAT_ACCIDENTE_GEOGRAFICO_NORM(accidente_geografico_norm_id);

-- ============================================================
-- CAT_NIVEL_DETALLE_LOCALIDAD
-- ============================================================
DROP TABLE IF EXISTS public.CAT_NIVEL_DETALLE_LOCALIDAD CASCADE;

CREATE TABLE public.CAT_NIVEL_DETALLE_LOCALIDAD (
    nivel_detalle_localidad_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    orden bigint,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_nivel_detalle_localidad PRIMARY KEY (nivel_detalle_localidad_id),
    CONSTRAINT uq_cat_nivel_detalle_localidad_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_NIVEL_DETALLE_LOCALIDAD IS 'Nivel de granularidad de una descripción de localidad.';

CREATE INDEX idx_cat_nivel_detalle_localidad_nivel_detalle_localidad_id ON public.CAT_NIVEL_DETALLE_LOCALIDAD(nivel_detalle_localidad_id);

INSERT INTO public.CAT_NIVEL_DETALLE_LOCALIDAD (nombre, orden) VALUES
    ('País', 1),
    ('Departamento', 2),
    ('Municipio', 3),
    ('Corregimiento', 4),
    ('Localidad', 5)
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- LOCALIZACION_GEOGRAFICA
-- ============================================================
DROP TABLE IF EXISTS public.LOCALIZACION_GEOGRAFICA CASCADE;

CREATE TABLE public.LOCALIZACION_GEOGRAFICA (
    localizacion_geografica_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    pais_id bigint,
    departamento_id bigint,
    municipio_id bigint,
    cuenca_id bigint,
    via_reportada varchar(255),
    via_norm_id bigint,
    accidente_geografico_reportado varchar(255),
    accidente_geografico_norm_id bigint,
    km_referencia bigint,
    descripcion_localidad text,
    nivel_detalle_localidad_id bigint,
    anotacion_id bigint,
    estado_catalogacion_id bigint,
    catalogador_id bigint,
    fecha_ingreso timestamptz,
    revisor_id bigint,
    fecha_revision timestamptz,
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_localizacion_geografica PRIMARY KEY (localizacion_geografica_id),
    CONSTRAINT fk_localizacion_geografica_pais_id FOREIGN KEY (pais_id) REFERENCES public.CAT_PAIS(pais_id) ON DELETE SET NULL,
    CONSTRAINT fk_localizacion_geografica_departamento_id FOREIGN KEY (departamento_id) REFERENCES public.CAT_DEPARTAMENTO(departamento_id) ON DELETE SET NULL,
    CONSTRAINT fk_localizacion_geografica_municipio_id FOREIGN KEY (municipio_id) REFERENCES public.CAT_MUNICIPIO(municipio_id) ON DELETE SET NULL,
    CONSTRAINT fk_localizacion_geografica_cuenca_id FOREIGN KEY (cuenca_id) REFERENCES public.CAT_CUENCA(cuenca_id) ON DELETE SET NULL,
    CONSTRAINT fk_localizacion_geografica_via_norm_id FOREIGN KEY (via_norm_id) REFERENCES public.CAT_VIA_NORM(via_norm_id) ON DELETE SET NULL,
    CONSTRAINT fk_localizacion_geografica_accidente_geografico_norm_id FOREIGN KEY (accidente_geografico_norm_id) REFERENCES public.CAT_ACCIDENTE_GEOGRAFICO_NORM(accidente_geografico_norm_id) ON DELETE SET NULL,
    CONSTRAINT fk_localizacion_geografica_nivel_detalle_localidad_id FOREIGN KEY (nivel_detalle_localidad_id) REFERENCES public.CAT_NIVEL_DETALLE_LOCALIDAD(nivel_detalle_localidad_id) ON DELETE SET NULL,
    CONSTRAINT fk_localizacion_geografica_anotacion_id FOREIGN KEY (anotacion_id) REFERENCES public.ANOTACION_PLACA(anotacion_id) ON DELETE SET NULL,
    CONSTRAINT fk_localizacion_geografica_estado_catalogacion_id FOREIGN KEY (estado_catalogacion_id) REFERENCES public.CAT_ESTADO_CATALOGACION(estado_catalogacion_id) ON DELETE SET NULL,
    CONSTRAINT fk_localizacion_geografica_catalogador_id FOREIGN KEY (catalogador_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT fk_localizacion_geografica_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.LOCALIZACION_GEOGRAFICA IS 'Localización administrativa y textual de una muestra, pozo o sección.';

CREATE INDEX idx_localizacion_geografica_localizacion_geografica_id ON public.LOCALIZACION_GEOGRAFICA(localizacion_geografica_id);
CREATE INDEX idx_localizacion_geografica_pais_id ON public.LOCALIZACION_GEOGRAFICA(pais_id);
CREATE INDEX idx_localizacion_geografica_departamento_id ON public.LOCALIZACION_GEOGRAFICA(departamento_id);
CREATE INDEX idx_localizacion_geografica_municipio_id ON public.LOCALIZACION_GEOGRAFICA(municipio_id);
CREATE INDEX idx_localizacion_geografica_cuenca_id ON public.LOCALIZACION_GEOGRAFICA(cuenca_id);
CREATE INDEX idx_localizacion_geografica_via_norm_id ON public.LOCALIZACION_GEOGRAFICA(via_norm_id);
CREATE INDEX idx_localizacion_geografica_accidente_geografico_norm_id ON public.LOCALIZACION_GEOGRAFICA(accidente_geografico_norm_id);
CREATE INDEX idx_localizacion_geografica_nivel_detalle_localidad_id ON public.LOCALIZACION_GEOGRAFICA(nivel_detalle_localidad_id);
CREATE INDEX idx_localizacion_geografica_anotacion_id ON public.LOCALIZACION_GEOGRAFICA(anotacion_id);
CREATE INDEX idx_localizacion_geografica_estado_catalogacion_id ON public.LOCALIZACION_GEOGRAFICA(estado_catalogacion_id);
CREATE INDEX idx_localizacion_geografica_catalogador_id ON public.LOCALIZACION_GEOGRAFICA(catalogador_id);
CREATE INDEX idx_localizacion_geografica_revisor_id ON public.LOCALIZACION_GEOGRAFICA(revisor_id);

-- ============================================================
-- CAT_SISTEMA_COORD
-- ============================================================
DROP TABLE IF EXISTS public.CAT_SISTEMA_COORD CASCADE;

CREATE TABLE public.CAT_SISTEMA_COORD (
    sistema_coord_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    tipo varchar(255),
    tipo_coordenada varchar(255),
    epsg integer,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_sistema_coord PRIMARY KEY (sistema_coord_id),
    CONSTRAINT uq_cat_sistema_coord_nombre_tipo_coordenada UNIQUE (nombre, tipo_coordenada)
);

COMMENT ON TABLE public.CAT_SISTEMA_COORD IS 'Sistemas de coordenadas geoespaciales con código EPSG.';

CREATE INDEX idx_cat_sistema_coord_sistema_coord_id ON public.CAT_SISTEMA_COORD(sistema_coord_id);

INSERT INTO public.CAT_SISTEMA_COORD (nombre, tipo, tipo_coordenada, epsg) VALUES
    ('WGS84', 'Geodésico', 'Lat/Long', 4326),
    ('MAGNA-SIRGAS', 'Geodésico', 'Lat/Long', 4686),
    ('MAGNA-SIRGAS', 'Proyectado', 'Este/Norte', 3116),
    ('Bogotá', 'Proyectado', 'Este/Norte', 21897)
ON CONFLICT (nombre, tipo_coordenada) DO NOTHING;

-- ============================================================
-- CAT_METODO_ESPACIAL
-- ============================================================
DROP TABLE IF EXISTS public.CAT_METODO_ESPACIAL CASCADE;

CREATE TABLE public.CAT_METODO_ESPACIAL (
    metodo_espacial_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre_metodo_espacial varchar(255),
    descripcion text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_metodo_espacial PRIMARY KEY (metodo_espacial_id),
    CONSTRAINT uq_cat_metodo_espacial_nombre_metodo_espacial UNIQUE (nombre_metodo_espacial)
);

COMMENT ON TABLE public.CAT_METODO_ESPACIAL IS 'Método utilizado para obtener o transformar coordenadas.';

CREATE INDEX idx_cat_metodo_espacial_metodo_espacial_id ON public.CAT_METODO_ESPACIAL(metodo_espacial_id);

INSERT INTO public.CAT_METODO_ESPACIAL (nombre_metodo_espacial, descripcion) VALUES
    ('GPS', 'Coordenadas obtenidas con receptor GPS'),
    ('Conversión datum', 'Conversión entre sistemas de coordenadas'),
    ('Georreferenciación mapa', 'Coordenadas estimadas desde mapa'),
    ('Estimación', 'Coordenadas aproximadas sin fuente precisa')
ON CONFLICT (nombre_metodo_espacial) DO NOTHING;

-- ============================================================
-- CAT_FUENTE_ESPACIAL
-- ============================================================
DROP TABLE IF EXISTS public.CAT_FUENTE_ESPACIAL CASCADE;

CREATE TABLE public.CAT_FUENTE_ESPACIAL (
    fuente_espacial_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    descripcion text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_fuente_espacial PRIMARY KEY (fuente_espacial_id),
    CONSTRAINT uq_cat_fuente_espacial_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_FUENTE_ESPACIAL IS 'Fuente de donde provienen las coordenadas espaciales.';

CREATE INDEX idx_cat_fuente_espacial_fuente_espacial_id ON public.CAT_FUENTE_ESPACIAL(fuente_espacial_id);

INSERT INTO public.CAT_FUENTE_ESPACIAL (nombre, descripcion) VALUES
    ('Anotación placa', 'Coordenadas anotadas en la placa o muestra'),
    ('Informe técnico', 'Coordenadas reportadas en informe técnico'),
    ('Publicación', 'Coordenadas obtenidas de publicación científica'),
    ('Base de datos', 'Coordenadas tomadas de otra base de datos')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- CAT_PRECISION_ESPACIAL
-- ============================================================
DROP TABLE IF EXISTS public.CAT_PRECISION_ESPACIAL CASCADE;

CREATE TABLE public.CAT_PRECISION_ESPACIAL (
    precision_espacial_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre_precision_espacial varchar(255),
    interpretacion_aproximada varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_precision_espacial PRIMARY KEY (precision_espacial_id),
    CONSTRAINT uq_cat_precision_espacial_nombre_precision_espacial UNIQUE (nombre_precision_espacial)
);

COMMENT ON TABLE public.CAT_PRECISION_ESPACIAL IS 'Nivel de precisión asociado a una localización espacial.';

CREATE INDEX idx_cat_precision_espacial_precision_espacial_id ON public.CAT_PRECISION_ESPACIAL(precision_espacial_id);

INSERT INTO public.CAT_PRECISION_ESPACIAL (nombre_precision_espacial, interpretacion_aproximada) VALUES
    ('Exacta', '< 5 m'),
    ('Alta', '5 - 25 m'),
    ('Media', '25 - 100 m'),
    ('Baja', '> 100 m')
ON CONFLICT (nombre_precision_espacial) DO NOTHING;

-- ============================================================
-- CAT_PLANCHA_TOPOGRAFICA
-- ============================================================
DROP TABLE IF EXISTS public.CAT_PLANCHA_TOPOGRAFICA CASCADE;

CREATE TABLE public.CAT_PLANCHA_TOPOGRAFICA (
    plancha_topografica_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    codigo_plancha varchar(255),
    nombre varchar(255),
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_plancha_topografica PRIMARY KEY (plancha_topografica_id),
    CONSTRAINT uq_cat_plancha_topografica_codigo_plancha UNIQUE (codigo_plancha)
);

COMMENT ON TABLE public.CAT_PLANCHA_TOPOGRAFICA IS 'Catálogo de planchas cartográficas topográficas.';

CREATE INDEX idx_cat_plancha_topografica_plancha_topografica_id ON public.CAT_PLANCHA_TOPOGRAFICA(plancha_topografica_id);

-- ============================================================
-- CAT_POLIGONAL
-- ============================================================
DROP TABLE IF EXISTS public.CAT_POLIGONAL CASCADE;

CREATE TABLE public.CAT_POLIGONAL (
    poligonal_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    descripcion text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_poligonal PRIMARY KEY (poligonal_id),
    CONSTRAINT uq_cat_poligonal_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_POLIGONAL IS 'Catálogo de poligonales o líneas de referencia geográfica.';

CREATE INDEX idx_cat_poligonal_poligonal_id ON public.CAT_POLIGONAL(poligonal_id);

-- ============================================================
-- LOCALIZACION_ESPACIAL
-- ============================================================
DROP TABLE IF EXISTS public.LOCALIZACION_ESPACIAL CASCADE;

CREATE TABLE public.LOCALIZACION_ESPACIAL (
    localizacion_espacial_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    localizacion_geografica_id bigint,
    sistema_coord_id bigint,
    latitud_original_texto varchar(255),
    longitud_original_texto varchar(255),
    latitud_decimal varchar(255),
    longitud_decimal varchar(255),
    norte varchar(255),
    este varchar(255),
    metodo_espacial_id bigint,
    fuente_espacial_id bigint,
    precision_espacial_id bigint,
    es_principal boolean,
    es_original boolean,
    es_verificada boolean,
    precision_m bigint,
    estado_catalogacion_id bigint,
    catalogador_id bigint,
    fecha_ingreso timestamptz,
    revisor_id bigint,
    fecha_revision timestamptz,
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_localizacion_espacial PRIMARY KEY (localizacion_espacial_id),
    CONSTRAINT fk_localizacion_espacial_localizacion_geografica_id FOREIGN KEY (localizacion_geografica_id) REFERENCES public.LOCALIZACION_GEOGRAFICA(localizacion_geografica_id) ON DELETE SET NULL,
    CONSTRAINT fk_localizacion_espacial_sistema_coord_id FOREIGN KEY (sistema_coord_id) REFERENCES public.CAT_SISTEMA_COORD(sistema_coord_id) ON DELETE SET NULL,
    CONSTRAINT fk_localizacion_espacial_metodo_espacial_id FOREIGN KEY (metodo_espacial_id) REFERENCES public.CAT_METODO_ESPACIAL(metodo_espacial_id) ON DELETE SET NULL,
    CONSTRAINT fk_localizacion_espacial_fuente_espacial_id FOREIGN KEY (fuente_espacial_id) REFERENCES public.CAT_FUENTE_ESPACIAL(fuente_espacial_id) ON DELETE SET NULL,
    CONSTRAINT fk_localizacion_espacial_precision_espacial_id FOREIGN KEY (precision_espacial_id) REFERENCES public.CAT_PRECISION_ESPACIAL(precision_espacial_id) ON DELETE SET NULL,
    CONSTRAINT fk_localizacion_espacial_estado_catalogacion_id FOREIGN KEY (estado_catalogacion_id) REFERENCES public.CAT_ESTADO_CATALOGACION(estado_catalogacion_id) ON DELETE SET NULL,
    CONSTRAINT fk_localizacion_espacial_catalogador_id FOREIGN KEY (catalogador_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL,
    CONSTRAINT fk_localizacion_espacial_revisor_id FOREIGN KEY (revisor_id) REFERENCES public.PERSONA(persona_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.LOCALIZACION_ESPACIAL IS 'Coordenadas geoespaciales de una localización geográfica.';

CREATE INDEX idx_localizacion_espacial_localizacion_espacial_id ON public.LOCALIZACION_ESPACIAL(localizacion_espacial_id);
CREATE INDEX idx_localizacion_espacial_localizacion_geografica_id ON public.LOCALIZACION_ESPACIAL(localizacion_geografica_id);
CREATE INDEX idx_localizacion_espacial_sistema_coord_id ON public.LOCALIZACION_ESPACIAL(sistema_coord_id);
CREATE INDEX idx_localizacion_espacial_metodo_espacial_id ON public.LOCALIZACION_ESPACIAL(metodo_espacial_id);
CREATE INDEX idx_localizacion_espacial_fuente_espacial_id ON public.LOCALIZACION_ESPACIAL(fuente_espacial_id);
CREATE INDEX idx_localizacion_espacial_precision_espacial_id ON public.LOCALIZACION_ESPACIAL(precision_espacial_id);
CREATE INDEX idx_localizacion_espacial_estado_catalogacion_id ON public.LOCALIZACION_ESPACIAL(estado_catalogacion_id);
CREATE INDEX idx_localizacion_espacial_catalogador_id ON public.LOCALIZACION_ESPACIAL(catalogador_id);
CREATE INDEX idx_localizacion_espacial_revisor_id ON public.LOCALIZACION_ESPACIAL(revisor_id);

-- ============================================================
-- LOCALIZACION_GEOREFERENCIAL
-- ============================================================
DROP TABLE IF EXISTS public.LOCALIZACION_GEOREFERENCIAL CASCADE;

CREATE TABLE public.LOCALIZACION_GEOREFERENCIAL (
    localizacion_georeferencial_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    poligonal_id bigint,
    punto_referencia varchar(255),
    distancia bigint,
    unidad_medida_id bigint,
    direccion varchar(255),
    azimut bigint,
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_localizacion_georeferencial PRIMARY KEY (localizacion_georeferencial_id),
    CONSTRAINT fk_localizacion_georeferencial_poligonal_id FOREIGN KEY (poligonal_id) REFERENCES public.CAT_POLIGONAL(poligonal_id) ON DELETE SET NULL,
    CONSTRAINT fk_localizacion_georeferencial_unidad_medida_id FOREIGN KEY (unidad_medida_id) REFERENCES public.CAT_UNIDAD_MEDIDA(unidad_medida_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.LOCALIZACION_GEOREFERENCIAL IS 'Localización relativa respecto a una poligonal o punto de referencia.';

CREATE INDEX idx_localizacion_georeferencial_localizacion_georeferencial_id ON public.LOCALIZACION_GEOREFERENCIAL(localizacion_georeferencial_id);
CREATE INDEX idx_localizacion_georeferencial_poligonal_id ON public.LOCALIZACION_GEOREFERENCIAL(poligonal_id);
CREATE INDEX idx_localizacion_georeferencial_unidad_medida_id ON public.LOCALIZACION_GEOREFERENCIAL(unidad_medida_id);

-- ============================================================
-- CAT_TIPO_PUNTO_MUESTREO
-- ============================================================
DROP TABLE IF EXISTS public.CAT_TIPO_PUNTO_MUESTREO CASCADE;

CREATE TABLE public.CAT_TIPO_PUNTO_MUESTREO (
    tipo_punto_muestreo_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    descripcion text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_cat_tipo_punto_muestreo PRIMARY KEY (tipo_punto_muestreo_id),
    CONSTRAINT uq_cat_tipo_punto_muestreo_nombre UNIQUE (nombre)
);

COMMENT ON TABLE public.CAT_TIPO_PUNTO_MUESTREO IS 'Tipos de punto o lugar donde se tomó una muestra superficial.';

CREATE INDEX idx_cat_tipo_punto_muestreo_tipo_punto_muestreo_id ON public.CAT_TIPO_PUNTO_MUESTREO(tipo_punto_muestreo_id);

INSERT INTO public.CAT_TIPO_PUNTO_MUESTREO (nombre, descripcion) VALUES
    ('Afloramiento', 'Muestra tomada en afloramiento rocoso natural'),
    ('Pozo somero', 'Muestra proveniente de pozo somero'),
    ('Cantera', 'Muestra tomada en cantera o explotación'),
    ('Quebrada', 'Muestra recolectada en cauce de quebrada'),
    ('Carretera', 'Muestra tomada en corte de carretera')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- SECCION_ESTRATIGRAFICA
-- ============================================================
DROP TABLE IF EXISTS public.SECCION_ESTRATIGRAFICA CASCADE;

CREATE TABLE public.SECCION_ESTRATIGRAFICA (
    seccion_estratigrafica_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre varchar(255),
    localizacion_geografica_id bigint,
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_seccion_estratigrafica PRIMARY KEY (seccion_estratigrafica_id),
    CONSTRAINT fk_seccion_estratigrafica_localizacion_geografica_id FOREIGN KEY (localizacion_geografica_id) REFERENCES public.LOCALIZACION_GEOGRAFICA(localizacion_geografica_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.SECCION_ESTRATIGRAFICA IS 'Sección estratigráfica descrita en campo o laboratorio.';

CREATE INDEX idx_seccion_estratigrafica_seccion_estratigrafica_id ON public.SECCION_ESTRATIGRAFICA(seccion_estratigrafica_id);
CREATE INDEX idx_seccion_estratigrafica_localizacion_geografica_id ON public.SECCION_ESTRATIGRAFICA(localizacion_geografica_id);

-- ============================================================
-- REL_DOCUMENTO_SECCION_ESTRATIGR
-- ============================================================
DROP TABLE IF EXISTS public.REL_DOCUMENTO_SECCION_ESTRATIGR CASCADE;

CREATE TABLE public.REL_DOCUMENTO_SECCION_ESTRATIGR (
    rel_documento_seccion_estratigrafica_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    documento_id bigint,
    seccion_estratigrafica_id bigint,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_rel_documento_seccion_estratigr PRIMARY KEY (rel_documento_seccion_estratigrafica_id),
    CONSTRAINT fk_rel_documento_seccion_estratigr_documento_id FOREIGN KEY (documento_id) REFERENCES public.DOCUMENTO_ASOCIADO(documento_id) ON DELETE CASCADE,
    CONSTRAINT fk_rel_documento_seccion_estratigr_seccion_estratigrafica_id FOREIGN KEY (seccion_estratigrafica_id) REFERENCES public.SECCION_ESTRATIGRAFICA(seccion_estratigrafica_id) ON DELETE CASCADE
);

COMMENT ON TABLE public.REL_DOCUMENTO_SECCION_ESTRATIGR IS 'Vínculo entre documentos y secciones estratigráficas.';

CREATE INDEX idx_rel_documento_seccion_estratigr_rel_documento_seccion_estratigrafica_id ON public.REL_DOCUMENTO_SECCION_ESTRATIGR(rel_documento_seccion_estratigrafica_id);
CREATE INDEX idx_rel_documento_seccion_estratigr_documento_id ON public.REL_DOCUMENTO_SECCION_ESTRATIGR(documento_id);
CREATE INDEX idx_rel_documento_seccion_estratigr_seccion_estratigrafica_id ON public.REL_DOCUMENTO_SECCION_ESTRATIGR(seccion_estratigrafica_id);

-- ============================================================
-- POSICION_ESTRATIGRAFICA
-- ============================================================
DROP TABLE IF EXISTS public.POSICION_ESTRATIGRAFICA CASCADE;

CREATE TABLE public.POSICION_ESTRATIGRAFICA (
    posicion_estratigrafica_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    texto_original varchar(255),
    valor bigint,
    unidad_medida_id bigint,
    tipo_referencia_estratigrafica_id bigint,
    observaciones text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_posicion_estratigrafica PRIMARY KEY (posicion_estratigrafica_id),
    CONSTRAINT fk_posicion_estratigrafica_unidad_medida_id FOREIGN KEY (unidad_medida_id) REFERENCES public.CAT_UNIDAD_MEDIDA(unidad_medida_id) ON DELETE SET NULL,
    CONSTRAINT fk_posicion_estratigrafica_tipo_referencia_estratigrafica_id FOREIGN KEY (tipo_referencia_estratigrafica_id) REFERENCES public.CAT_TIPO_REF_ESTRATIGRAFICA(tipo_ref_estratigrafica_id) ON DELETE SET NULL
);

COMMENT ON TABLE public.POSICION_ESTRATIGRAFICA IS 'Posición de una muestra dentro de una sección estratigráfica.';

CREATE INDEX idx_posicion_estratigrafica_posicion_estratigrafica_id ON public.POSICION_ESTRATIGRAFICA(posicion_estratigrafica_id);
CREATE INDEX idx_posicion_estratigrafica_unidad_medida_id ON public.POSICION_ESTRATIGRAFICA(unidad_medida_id);
CREATE INDEX idx_posicion_estratigrafica_tipo_referencia_estratigrafica_id ON public.POSICION_ESTRATIGRAFICA(tipo_referencia_estratigrafica_id);

-- ============================================================
-- Retroactivas: FK de tablas de la Fase 2 hacia tablas de la Fase 4
-- ============================================================
ALTER TABLE public.MUESTRA_SUPERFICIE
    ADD CONSTRAINT fk_muestra_superficie_localizacion_georeferencial_id
        FOREIGN KEY (localizacion_georeferencial_id) REFERENCES public.LOCALIZACION_GEOREFERENCIAL(localizacion_georeferencial_id) ON DELETE SET NULL;

ALTER TABLE public.MUESTRA_SUPERFICIE
    ADD CONSTRAINT fk_muestra_superficie_localizacion_geografica_id
        FOREIGN KEY (localizacion_geografica_id) REFERENCES public.LOCALIZACION_GEOGRAFICA(localizacion_geografica_id) ON DELETE SET NULL;

ALTER TABLE public.MUESTRA_SUPERFICIE
    ADD CONSTRAINT fk_muestra_superficie_localizacion_espacial_id
        FOREIGN KEY (localizacion_espacial_id) REFERENCES public.LOCALIZACION_ESPACIAL(localizacion_espacial_id) ON DELETE SET NULL;

ALTER TABLE public.MUESTRA_SUPERFICIE
    ADD CONSTRAINT fk_muestra_superficie_seccion_estratigrafica_id
        FOREIGN KEY (seccion_estratigrafica_id) REFERENCES public.SECCION_ESTRATIGRAFICA(seccion_estratigrafica_id) ON DELETE SET NULL;

ALTER TABLE public.MUESTRA_SUPERFICIE
    ADD CONSTRAINT fk_muestra_superficie_posicion_estratigrafica_id
        FOREIGN KEY (posicion_estratigrafica_id) REFERENCES public.POSICION_ESTRATIGRAFICA(posicion_estratigrafica_id) ON DELETE SET NULL;

ALTER TABLE public.MUESTRA_SUPERFICIE
    ADD CONSTRAINT fk_muestra_superficie_plancha_topografica_id
        FOREIGN KEY (plancha_topografica_id) REFERENCES public.CAT_PLANCHA_TOPOGRAFICA(plancha_topografica_id) ON DELETE SET NULL;

ALTER TABLE public.MUESTRA_LECHO_MARINO
    ADD CONSTRAINT fk_muestra_lecho_marino_localizacion_geografica_id
        FOREIGN KEY (localizacion_geografica_id) REFERENCES public.LOCALIZACION_GEOGRAFICA(localizacion_geografica_id) ON DELETE SET NULL;

ALTER TABLE public.MUESTRA_LECHO_MARINO
    ADD CONSTRAINT fk_muestra_lecho_marino_localizacion_espacial_id
        FOREIGN KEY (localizacion_espacial_id) REFERENCES public.LOCALIZACION_ESPACIAL(localizacion_espacial_id) ON DELETE SET NULL;

ALTER TABLE public.POZO
    ADD CONSTRAINT fk_pozo_localizacion_geografica_id
        FOREIGN KEY (localizacion_geografica_id) REFERENCES public.LOCALIZACION_GEOGRAFICA(localizacion_geografica_id) ON DELETE SET NULL;

ALTER TABLE public.POZO
    ADD CONSTRAINT fk_pozo_localizacion_espacial_id
        FOREIGN KEY (localizacion_espacial_id) REFERENCES public.LOCALIZACION_ESPACIAL(localizacion_espacial_id) ON DELETE SET NULL;

-- ============================================================
-- Actualización de versión del esquema
-- ============================================================
INSERT INTO public.schema_version (version, applied_at)
VALUES (5, now())
ON CONFLICT (version) DO UPDATE SET applied_at = EXCLUDED.applied_at;


COMMIT;
