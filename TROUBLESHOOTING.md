# Solución de Problemas Comunes

Errores y soluciones habituales para nuevos desarrolladores.

1. "Supabase environment variables are not set"
    - Causa: `.env` no se configuró o Vite no carga variables.
    - Solución: copiar `.env.example` → `.env` y reiniciar el servidor (`npm run dev`).

2. Magic link no llega / rate limit
    - Causa: Supabase limita envíos por seguridad.
    - Solución: esperar 15 minutos o usar otro email de prueba; revisar logs en Supabase Auth.

3. Error 429 o límites al solicitar OTP
    - Causa: demasiado tráfico de envío de correos.
    - Solución: revisar código en `src/pages/Login.tsx` que aplica cooldown; aumentar cooldown temporalmente.

4. Problemas de CORS o endpoints no responden
    - Causa: URL de Supabase incorrecta o proyecto equivocado.
    - Solución: verificar `VITE_SUPABASE_URL` y que la tabla/rol exista en la base de datos.

5. Rutas que redirigen inesperadamente
    - Causa: Guards de roles (`roleGuards.tsx`) devuelven `Navigate` si rol no coincide.
    - Solución: revisar `useAppStore().user` y la propiedad `rol` devuelta por `AuthProvider`.

6. ¿Cómo depurar queries?
    - Habilita logs en supabase client (temporal) o revisa la consola del navegador.
