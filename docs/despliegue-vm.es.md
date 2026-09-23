# Despliegue local en una VM Ubuntu 24.04

Esta guía instala el frontend estático y el backend Node con PostgreSQL local,
Nginx y HTTPS. No usa Docker ni Supabase para el servidor local. Las
mutaciones legacy que todavía dependen de Supabase no se migran en este work
unit.

## Topología y límites de red

El servidor Node escucha únicamente en `127.0.0.1:3000` mediante
`SERVER_HOST=127.0.0.1`. Nginx es el único componente público y termina HTTPS;
reenviará `/auth/`, `/api/` y `/health` al backend. PostgreSQL debe escuchar
solo en loopback y no debe exponerse a la red salvo un requerimiento explícito,
documentado y revisado.

## Discos, usuario y checkout

Reserve un volumen para `/opt/geotrace` y otro para backups si la VM lo
permite. Mantenga al menos el espacio necesario para el checkout, la caché de
pnpm, logs y dumps de PostgreSQL; supervise el uso de disco antes de que llegue
al 80%.

```bash
sudo adduser --system --group --home /opt/geotrace geotrace
sudo install -d -o geotrace -g geotrace /opt/geotrace/releases /etc/geotrace
# Instale Node.js >= 20 y pnpm >= 9 desde una fuente aprobada por su organización.
# Despliegue una release en /opt/geotrace/releases/<version> y apunte:
sudo ln -sfn /opt/geotrace/releases/<version> /opt/geotrace/current
sudo chown -R geotrace:geotrace /opt/geotrace/releases/<version>
```

No haga escribible el checkout por Nginx. El unit file versionado está en
`deploy/systemd/geotrace.service` y usa `pnpm exec tsx server/index.ts`: este
repositorio no tiene un build Node separado. `tsx` queda instalado por pnpm
desde el lockfile, por lo que la instalación de producción debe conservar las
dependencias de desarrollo necesarias para ejecutar ese entrypoint.

## Dependencias, variables y PostgreSQL

```bash
cd /opt/geotrace/current
sudo -u geotrace pnpm install --frozen-lockfile
```

Cree `/etc/geotrace/geotrace.env` fuera del repositorio, con propietario root y
permisos `0600`. Debe contener valores reales para:

```text
DATABASE_URL=postgresql://<local-user>:<password>@127.0.0.1:5432/<database>
LDAP_URL=ldaps://<ad-host>:636
LDAP_BASE_DN=<base-dn>
LDAP_BIND_DN=<optional-service-account-dn>
LDAP_BIND_PASSWORD=<optional-secret>
SERVER_HOST=127.0.0.1
SERVER_PORT=3000
SESSION_COOKIE_SECURE=true
```

Puede crear el archivo de forma segura con:

```bash
sudo install -o root -g root -m 0600 /dev/null /etc/geotrace/geotrace.env
sudoedit /etc/geotrace/geotrace.env
```

Configure AD/LDAP con LDAPS o `LDAP_STARTTLS=true`; en producción el backend
rechaza LDAP plano. Use el filtro `LDAP_USER_SEARCH_FILTER` si el AD no usa los
atributos predeterminados. Mantenga `LDAP_BIND_DN` y
`LDAP_BIND_PASSWORD` como pareja. No ponga secretos en el frontend.

Inicialice el esquema oficial que corresponda a su release y después aplique
la migración de sesiones:

```bash
sudo -u geotrace env DATABASE_URL='postgresql://...' \
  pnpm run db:migrate:local-sessions
```

En operación normal `DATABASE_URL` se toma del EnvironmentFile del servicio;
el ejemplo anterior es deliberadamente un placeholder y no debe copiarse con
una contraseña real en el historial del shell.

## Frontend, systemd y Nginx HTTPS

Construya el frontend en la release y publique únicamente `dist/`:

```bash
cd /opt/geotrace/current
sudo -u geotrace pnpm run build:frontend
sudo install -d -o root -g www-data /var/www/geotrace
sudo rsync -a --delete dist/ /var/www/geotrace/
```

Copie `deploy/systemd/geotrace.service` a
`/etc/systemd/system/geotrace.service`, ajuste rutas si su layout difiere y
active el servicio:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now geotrace
sudo systemctl status geotrace
```

Copie `deploy/nginx/geotrace.conf.example` a `sites-available`, reemplace
`__HOSTNAME__`, `__CERTIFICATE_PATH__` y `__CERTIFICATE_KEY_PATH__` por valores
de su entorno (nunca por certificados versionados), y apunte `root` al
directorio publicado. Verifique y recargue:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

El `try_files ... /index.html` es obligatorio para rutas BrowserRouter. Los
headers incluidos son básicos y no modifican `Set-Cookie`; no agregue
`proxy_hide_header Set-Cookie` ni reescrituras de cookies.

## Firewall, verificaciones y logs

Permita solo SSH administrativo y HTTPS desde la red requerida; no abra 3000
ni 5432. Si se necesita HTTP público solo para redirigir a HTTPS, limítelo a
puerto 80. Ejecute los smoke checks desde la VM:

```bash
pnpm run smoke:local                 # backend loopback
curl -fsS https://__HOSTNAME__/health
curl -fsS https://__HOSTNAME__/ruta-browserrouter
sudo journalctl -u geotrace -n 100 --no-pager
sudo journalctl -u nginx -n 100 --no-pager
```

El health check valida disponibilidad del backend y su conexión de base de
datos. Configure rotación de `journald` y logs de Nginx; no registre passwords,
cookies ni `DATABASE_URL`.

## Backups y rollback

Programe `pg_dump` cifrado hacia el volumen de backups, pruebe restauraciones
periódicamente y conserve varias generaciones. Antes de cambiar una release,
guarde el commit/tag desplegado y el resultado de los smoke checks. Para
rollback, detenga el servicio, vuelva a apuntar `/opt/geotrace/current` a la
release anterior, restaure la base solo si la migración lo requiere y ejecute
`systemctl restart geotrace`; luego repita los health checks. Las migraciones
deben ser compatibles hacia atrás: `001_app_auth_sessions.sql` usa
`IF NOT EXISTS`, pero no revierta tablas sin un backup y una decisión explícita.
