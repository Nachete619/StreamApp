# Guía Rápida de Instalación

## Pasos Rápidos

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

Crea `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_key
LIVEPEER_API_KEY=tu_livepeer_key
NEXT_PUBLIC_LIVEPEER_API_KEY=tu_livepeer_key
```

### 3. Configurar Supabase

1. Ejecuta el SQL en `lib/supabase/schema.sql` en el SQL Editor de Supabase
2. Habilita Realtime en la tabla `messages`:
   - Ve a Database > Replication
   - Activa la replicación para la tabla `messages`

### 4. Ejecutar

```bash
npm run dev
```

## Configuración de Webhook de Livepeer

1. Ve a tu dashboard de Livepeer Studio
2. Configura webhook: `https://tu-dominio.com/api/livepeer/webhook`
3. Selecciona eventos: `stream.started`, `stream.ended`, `stream.idle`

## Listo! 🎉

Tu aplicación estará corriendo en `http://localhost:3000`
