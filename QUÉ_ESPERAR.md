# ¿Qué Debería Pasar Después de Completar Todo?

## ✅ Checklist de Configuración Completa

Asegúrate de haber completado estos pasos antes de continuar:

### 1. Instalación Base
- [ ] `npm install` ejecutado sin errores
- [ ] Archivo `.env.local` creado con todas las variables necesarias
- [ ] La aplicación puede iniciarse con `npm run dev`

### 2. Supabase
- [ ] Proyecto creado en Supabase
- [ ] SQL ejecutado (`lib/supabase/schema.sql`) en el SQL Editor
- [ ] Realtime habilitado para la tabla `messages` (Database > Replication)
- [ ] Variables de entorno configuradas en `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### 3. Livepeer
- [ ] Cuenta creada en Livepeer Studio
- [ ] API Key obtenida
- [ ] Variables configuradas en `.env.local`:
  - `LIVEPEER_API_KEY`
  - `NEXT_PUBLIC_LIVEPEER_API_KEY`

### 4. Webhook de Livepeer
- [ ] ngrok configurado con authtoken
- [ ] App corriendo en `npm run dev` (puerto 3000)
- [ ] ngrok corriendo en otra terminal: `npx ngrok http 3000`
- [ ] Webhook creado en Livepeer con:
  - URL: `https://tu-url-ngrok.ngrok.io/api/livepeer/webhook`
  - Eventos: `stream.started`, `stream.idle`, `recording.ready`

## 🎯 Qué Debería Pasar Ahora

### 1. Iniciar la Aplicación

**Terminal 1 - Aplicación Next.js:**
```bash
npm run dev
```

**Deberías ver:**
```
✓ Ready in 2.3s
○ Local:        http://localhost:3000
○ Network:      http://192.168.x.x:3000
```

**Terminal 2 - ngrok (solo si vas a probar webhooks):**
```bash
npx ngrok http 3000
```

**Deberías ver:**
```
Forwarding    https://abc123-def456.ngrok-free.app -> http://localhost:3000
```

### 2. Acceder a la Aplicación

Abre tu navegador en: **http://localhost:3000**

**Lo que deberías ver:**
- ✅ La página de inicio (Home) cargando
- ✅ Navbar en la parte superior
- ✅ Botones de "Iniciar Sesión" y "Registrarse" si no estás logueado
- ✅ No deberías ver errores en la consola del navegador

### 3. Crear una Cuenta

1. Haz clic en **"Registrarse"**
2. Completa el formulario:
   - Nombre de usuario (ej: `miusuario`)
   - Email (ej: `tu@email.com`)
   - Contraseña (mínimo 6 caracteres)
3. Haz clic en **"Crear Cuenta"**

**Lo que debería pasar:**
- ✅ Te redirige automáticamente al dashboard (`/dashboard`)
- ✅ Ves el mensaje de éxito "¡Cuenta creada exitosamente!"
- ✅ En Supabase, deberías ver:
  - Un nuevo usuario en Authentication > Users
  - Un nuevo perfil en la tabla `profiles`

### 4. Crear tu Primer Stream

En el dashboard (`/dashboard`):

1. Llena el campo **"Título del Stream"** (ej: "Mi primer stream")
2. Haz clic en **"Crear Stream"**

**Lo que debería pasar:**
- ✅ Botón muestra "Creando..." mientras procesa
- ✅ Aparece mensaje de éxito: "Stream creado exitosamente"
- ✅ Ves una nueva sección mostrando:
  - **Stream Key**: Una cadena larga de texto
  - **RTMP Ingest URL**: Una URL tipo `rtmp://...`
  - Botones para copiar cada uno
- ✅ En Livepeer Studio, deberías ver el nuevo stream creado

### 5. Probar el Webhook (Opcional)

Si tienes ngrok corriendo y el webhook configurado:

1. Inicia una transmisión con OBS (o tu software de streaming)
2. Usa el Stream Key y RTMP URL del dashboard
3. Haz clic en "Iniciar Transmisión" en OBS

**Lo que debería pasar:**
- ✅ En la terminal donde corre `npm run dev`, verás logs cuando lleguen webhooks
- ✅ El estado del stream debería cambiar a "EN VIVO"
- ✅ En ngrok (http://127.0.0.1:4040), verás las peticiones del webhook
- ✅ En la página Home, tu stream debería aparecer como "EN VIVO"

### 6. Ver tu Stream

1. Ve a la página Home (`/`)
2. Haz clic en tu stream (debería aparecer en la lista)

**Lo que deberías ver:**
- ✅ Reproductor de video cargando (o mensaje "Offline" si no está transmitiendo)
- ✅ Chat en vivo en el sidebar derecho
- ✅ Información del streamer

## 🐛 Problemas Comunes y Soluciones

### La aplicación no inicia
- **Error de puerto ocupado**: Cambia el puerto o cierra otros procesos
- **Error de variables de entorno**: Verifica que `.env.local` esté correcto
- **Error de dependencias**: Ejecuta `npm install` de nuevo

### No puedo registrarme
- Verifica que Supabase esté configurado correctamente
- Revisa la consola del navegador para errores
- Verifica que el SQL del schema se haya ejecutado

### No puedo crear stream
- Verifica que la API key de Livepeer sea correcta
- Revisa la consola del navegador y la terminal del servidor
- Verifica que estés logueado

### El webhook no funciona
- Verifica que ngrok esté corriendo
- Verifica que la URL del webhook sea correcta en Livepeer
- Revisa los logs en la terminal donde corre `npm run dev`
- Revisa la interfaz de ngrok: http://127.0.0.1:4040

### No veo mi stream en la Home
- Verifica que el stream esté marcado como `is_live: true` en Supabase
- Revisa que la consulta a la base de datos esté funcionando
- Prueba refrescar la página

## 📊 Verificar que Todo Funciona

### 1. Base de Datos (Supabase)
- Ve a tu proyecto en Supabase
- Verifica las tablas:
  - `profiles` - Debería tener tu perfil
  - `streams` - Debería tener tus streams
  - `messages` - Vacía hasta que uses el chat
  - `videos` - Vacía hasta que termines un stream con grabación

### 2. Livepeer
- Ve a https://livepeer.studio/dashboard
- Verifica que tus streams aparezcan ahí
- Verifica que el webhook esté configurado y activo

### 3. Logs de la Aplicación
- En la terminal donde corre `npm run dev`, deberías ver:
  - Logs de compilación
  - Logs de errores (si hay alguno)
  - Logs cuando lleguen webhooks

### 4. Consola del Navegador
- Abre las herramientas de desarrollador (F12)
- Ve a la pestaña "Console"
- No deberías ver errores en rojo (algunos warnings amarillos pueden ser normales)

## 🎉 Todo Funciona Correctamente Si...

✅ Puedes iniciar sesión/registrarte
✅ Puedes crear streams desde el dashboard
✅ Puedes ver tus streams en la página Home
✅ Los webhooks llegan cuando transmites (si los configuraste)
✅ El chat funciona (aunque no haya mensajes aún)
✅ No hay errores críticos en la consola

## 🚀 Próximos Pasos

Una vez que todo funcione:

1. **Probar transmisión completa**:
   - Crea un stream
   - Transmite con OBS
   - Verifica que aparezca como "EN VIVO"
   - Detén la transmisión
   - Verifica que se guarde como VOD (si configuraste grabación)

2. **Personalizar la UI**:
   - Modifica colores en `tailwind.config.ts`
   - Ajusta estilos en `app/globals.css`
   - Personaliza componentes según tus necesidades

3. **Desplegar a Producción**:
   - Conecta tu repositorio a Vercel
   - Configura las variables de entorno en Vercel
   - Actualiza el webhook en Livepeer con la URL de producción
   - ¡Listo para producción!

## 💡 Tips

- **Mantén ngrok corriendo** solo cuando estés probando webhooks
- **Revisa los logs** regularmente para detectar problemas temprano
- **Prueba con streams cortos** primero antes de transmisiones largas
- **Guarda tus Stream Keys** de forma segura, las necesitarás para transmitir

---

¡Si todo lo anterior funciona, tu aplicación está lista! 🎉
