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
        CHECK (estado_coleccion IN ('Activa', 'Cerrada', 'Inactiva'))
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

COMMIT;
