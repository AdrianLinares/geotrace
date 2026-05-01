-- Script de diagnóstico para verificar configuración de usuarios y roles

-- 1. Ver todos los usuarios en la tabla persona
SELECT persona_id, nombre, email, rol, activo, created_at 
FROM persona 
ORDER BY created_at DESC;

-- 2. Buscar específicamente el usuario admin por email
SELECT persona_id, nombre, email, rol, activo, created_at 
FROM persona 
WHERE email = 'jlinares@sgc.gov.co';

-- 3. Contar usuarios por rol
SELECT rol, COUNT(*) as cantidad 
FROM persona 
GROUP BY rol 
ORDER BY rol;

-- 4. Ver si existen usuarios activos con rol admin
SELECT persona_id, nombre, email, rol, activo 
FROM persona 
WHERE rol = 'Administrador' AND activo = true;

-- 5. Si jlinares@sgc.gov.co existe, verificar su rol exacto y activo
-- (Reemplaza jlinares@sgc.gov.co si necesitas verificar otro email)
SELECT 
  persona_id, 
  nombre, 
  email, 
  rol as "rol_en_bd",
  LOWER(TRIM(rol)) as "rol_normalizado",
  activo,
  created_at
FROM persona 
WHERE LOWER(email) = 'jlinares@sgc.gov.co';

-- 6. Diagnosticar problemas de capitalización o espacios en roles
-- Muestra roles únicos y sus longitudes (para detectar espacios o caracteres raros)
SELECT DISTINCT 
  rol,
  LENGTH(rol) as longitud,
  LOWER(TRIM(rol)) as normalizado,
  (LOWER(TRIM(rol)) = 'administrador') as es_admin
FROM persona 
ORDER BY rol;

-- === ACCIONES CORRECTIVAS (si es necesario) ===

-- Si el usuario existe pero tiene rol incorrecto, actualizar:
-- UPDATE persona SET rol = 'Administrador' WHERE email = 'jlinares@sgc.gov.co';

-- Si el usuario existe pero está inactivo, activar:
-- UPDATE persona SET activo = true WHERE email = 'jlinares@sgc.gov.co';

-- Si el usuario NO existe en BD pero SÍ está en auth.users, necesitas crear su registro:
-- INSERT INTO persona (persona_id, nombre, email, rol, activo)
-- VALUES (gen_random_uuid(), 'Nombre del usuario', 'jlinares@sgc.gov.co', 'Administrador', true);
