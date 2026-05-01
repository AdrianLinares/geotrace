# Catálogo de Placas (SGC)

Proyecto para catalogación y gestión de placas micropaleontológicas del Servicio Geológico Colombiano (SGC).

Estructura inicial y schema SQL incluidos en /sql/schema.sql

Instrucciones rápidas:

- Copiar .env.example a .env y rellenar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
- Instalar dependencias: npm install
- Levantar entorno de desarrollo: npm run dev
- Aplicar schema a Supabase: psql < sql/schema.sql (o usar la interfaz SQL de Supabase)
