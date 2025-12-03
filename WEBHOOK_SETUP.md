# Guía de Configuración del Webhook de Livepeer

## 📋 Configuración Paso a Paso

### 1. **Name (Nombre del Webhook)**
```
StreamApp Webhook
```
O cualquier nombre descriptivo como: `StreamApp VOD Handler`

### 2. **URL (URL del Webhook)** - ⚠️ MUY IMPORTANTE

La URL debe apuntar al endpoint de tu aplicación donde recibirás los webhooks.

#### 🔴 Para PRODUCCIÓN (cuando ya tengas tu app desplegada):

**Si usas Vercel:**
1. Despliega tu aplicación en Vercel
2. Obtén la URL de tu proyecto (ej: `https://streamapp-abc123.vercel.app`)
3. La URL del webhook será:
```
https://streamapp-abc123.vercel.app/api/livepeer/webhook
```

**Si usas otro hosting:**
```
https://tu-dominio.com/api/livepeer/webhook
```

#### 🟡 Para DESARROLLO LOCAL (pruebas):

Para probar en local, necesitas exponer tu servidor local a internet usando un túnel.

**Opción 1: ngrok (Más fácil y recomendado)**

**Instalación y configuración de ngrok:**

⚠️ **IMPORTANTE**: ngrok requiere una cuenta gratuita y un authtoken para funcionar.

**Paso 0: Crear cuenta y obtener authtoken (OBLIGATORIO)**

1. **Crea una cuenta gratuita en ngrok**:
   - Ve a https://dashboard.ngrok.com/signup
   - Regístrate con tu email (la cuenta es gratuita)
   - Verifica tu email

2. **Obtén tu authtoken**:
   - Después de registrarte, ve a https://dashboard.ngrok.com/get-started/your-authtoken
   - O ve a tu dashboard: https://dashboard.ngrok.com
   - Encuentra tu "Authtoken" (será una cadena larga como: `2abc123def456ghi789jkl012mno345pq_6rstuvw7xyz890ABCDEF1`)

3. **Configura el authtoken en tu terminal**:
   ```bash
   npx ngrok config add-authtoken TU_AUTHTOKEN_AQUI
   ```
   
   Ejemplo:
   ```bash
   npx ngrok config add-authtoken 2abc123def456ghi789jkl012mno345pq_6rstuvw7xyz890ABCDEF1
   ```

   ✅ Si ves "Authtoken saved to configuration file", ¡está configurado correctamente!

**Método A - Usando npm (recomendado):**
```bash
# Puedes usar ngrok directamente con npx (no requiere instalación)
# Solo necesitas configurar el authtoken una vez (ver Paso 0 arriba)
```

**Método B - Descargar e instalar manualmente:**
1. Ve a https://ngrok.com/download
2. Descarga ngrok para Windows
3. Extrae el archivo `ngrok.exe` 
4. Colócalo en una carpeta (ej: `C:\ngrok\`)
5. Configura el authtoken: `ngrok config add-authtoken TU_AUTHTOKEN`
6. Agrega esa carpeta a tu PATH de Windows (opcional, pero recomendado)

**Pasos detallados para obtener tu URL de ngrok:**

**Paso 1**: Asegúrate de que tu aplicación Next.js esté corriendo
```bash
# En tu terminal, ejecuta:
npm run dev
```
Deberías ver algo como:
```
✓ Ready in 2.3s
○ Local:        http://localhost:3000
```

**Paso 2**: Abre una NUEVA terminal (no cierres la anterior)
- Presiona `Windows + R`
- Escribe `cmd` o `powershell` y presiona Enter
- O abre una nueva terminal en tu editor de código

**Paso 3**: Navega a la carpeta de tu proyecto (si usaste método B)
```bash
cd D:\MisDocumentos\Descargas\StreamApp
```

**Paso 4**: Ejecuta ngrok
```bash
# Si usaste método A (npm):
npx ngrok http 3000

# O si usaste método B (instalación manual):
ngrok http 3000
```

**Paso 5**: Verás una pantalla como esta:
```
ngrok                                                          

Session Status                online
Account                       Tu Cuenta (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123-def456.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Paso 6**: Copia la URL HTTPS
- Busca la línea que dice `Forwarding`
- Copia la URL que aparece ANTES de la flecha `->`
- Ejemplo: `https://abc123-def456.ngrok-free.app`

**Paso 7**: Usa esta URL completa en Livepeer
```
https://abc123-def456.ngrok-free.app/api/livepeer/webhook
```

**⚠️ IMPORTANTE:**
- **NO cierres** la terminal donde corre ngrok, debe seguir abierta
- **NO cierres** la terminal donde corre `npm run dev`, debe seguir abierta
- Cada vez que cierres y vuelvas a abrir ngrok, la URL cambiará
- Si la URL cambia, tendrás que actualizarla en Livepeer

**Paso 8 (Opcional)**: Abre la interfaz web de ngrok
- Ve a `http://127.0.0.1:4040` en tu navegador
- Verás todas las peticiones que pasan por ngrok
- Útil para debuggear y ver si los webhooks están llegando

**Opción 2: localtunnel**
```bash
npx localtunnel --port 3000
```
Usa la URL que te proporciona + `/api/livepeer/webhook`

**Opción 3: Cloudflare Tunnel**
```bash
cloudflared tunnel --url http://localhost:3000
```

#### 📝 Resumen - Cómo obtener tu URL:

1. **Producción**: 
   - URL base de tu app desplegada + `/api/livepeer/webhook`
   - Ejemplo: `https://mi-app.vercel.app/api/livepeer/webhook`

2. **Desarrollo Local**:
   - URL del túnel (ngrok, etc.) + `/api/livepeer/webhook`
   - Ejemplo: `https://abc123.ngrok.io/api/livepeer/webhook`

**IMPORTANTE**: La URL debe ser HTTPS y accesible públicamente desde internet.

### 3. **Secret (Secreto del Webhook)** ⚠️ OPCIONAL PERO RECOMENDADO

Para mayor seguridad, genera un secreto aleatorio:

```bash
# Generar un secreto aleatorio (ejecuta en terminal)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

O usa cualquier string aleatorio seguro, por ejemplo:
```
streaMapp_webhook_secRet_2024_xyz123
```

**IMPORTANTE**: Si configuras un secret, también debes agregarlo a tu `.env.local`:
```env
LIVEPEER_WEBHOOK_SECRET=tu_secreto_aqui
```

### 4. **Event Types (Tipos de Eventos)**

Selecciona estos eventos (mínimo los 2 primeros):

#### ✅ `stream.started` (OBLIGATORIO)
- **Qué hace**: Se activa cuando un stream comienza a transmitir
- **Acción en nuestra app**: Actualiza el estado del stream a `is_live: true` en la base de datos
- **Cuándo se usa**: Para mostrar el indicador "EN VIVO" en la UI

#### ✅ `stream.idle` (OBLIGATORIO)
- **Qué hace**: Se activa cuando un stream está inactivo (sin datos o detenido)
- **Acción en nuestra app**: Actualiza el estado del stream a `is_live: false`
- **Cuándo se usa**: Para marcar el stream como offline cuando se detiene la transmisión

#### ✅ `recording.ready` (RECOMENDADO para VODs)
- **Qué hace**: Se activa cuando la grabación del stream está lista después de que termine
- **Acción en nuestra app**: **Guarda automáticamente el VOD** en la tabla `videos`
- **Cuándo se usa**: Para crear automáticamente videos grabados (VODs) después de terminar un stream
- **NOTA**: Este evento se usa en lugar de `stream.ended` que puede no estar disponible

#### ⚠️ Si no aparece `stream.ended`
Livepeer puede no tener disponible `stream.ended`. En ese caso:
- Usa `stream.idle` para detectar cuando el stream se detiene
- Usa `recording.ready` para guardar el VOD cuando esté disponible

### 📝 Resumen de Configuración

```
Name: StreamApp Webhook
URL: https://tu-dominio.com/api/livepeer/webhook
   (o https://tu-url-ngrok.ngrok.io/api/livepeer/webhook para desarrollo)
Secret: (opcional, pero recomendado)
Event Types:
  ✅ stream.started (OBLIGATORIO)
  ✅ stream.idle (OBLIGATORIO)
  ✅ recording.ready (RECOMENDADO para VODs automáticos)
```

**Mínimo necesario**: Selecciona al menos `stream.started` y `stream.idle`

## 🔒 Seguridad del Webhook

Si configuraste un secret, el código del webhook lo verificará automáticamente. El código actual tiene preparado el lugar para verificar la firma (línea 10 en `app/api/livepeer/webhook/route.ts`).

## 🧪 Probar el Webhook

### Opción 1: Probar con un stream real
1. Crea un stream desde el dashboard
2. Inicia la transmisión con OBS
3. Verifica en los logs que el webhook se recibe

### Opción 2: Probar con curl (para desarrollo)
```bash
curl -X POST http://localhost:3000/api/livepeer/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "stream.started",
    "stream": {
      "playbackId": "test-playback-id",
      "recording": false
    }
  }'
```

## ⚠️ Notas Importantes

1. **URL debe ser HTTPS** en producción (Livepeer lo requiere)
2. **El webhook debe responder rápido** (< 5 segundos)
3. **Para desarrollo local**, necesitas un túnel (ngrok, etc.)
4. **Los eventos se envían automáticamente** por Livepeer cuando ocurren

## 🐛 Troubleshooting

- **Error "authentication failed: Usage of ngrok requires a verified account and authtoken" (ERR_NGROK_4018)**:
  - **Causa**: ngrok requiere una cuenta y authtoken configurado
  - **Solución**: 
    1. Crea una cuenta gratuita en https://dashboard.ngrok.com/signup
    2. Obtén tu authtoken en https://dashboard.ngrok.com/get-started/your-authtoken
    3. Configúralo ejecutando: `npx ngrok config add-authtoken TU_AUTHTOKEN`
    4. Vuelve a intentar: `npx ngrok http 3000`
  - Ver más detalles en el "Paso 0" de la sección de ngrok arriba

- **No recibes webhooks**: 
  - Verifica que la URL sea accesible públicamente (prueba abriéndola en el navegador)
  - Para desarrollo local, asegúrate de que el túnel (ngrok) esté activo
  - Verifica que tu aplicación esté corriendo en el puerto correcto

- **Error 401/403**: Verifica el secret si lo configuraste

- **VODs no se crean**: 
  - Verifica que hayas seleccionado el evento `recording.ready`
  - Asegúrate de que `record: true` esté configurado al crear el stream (ya está en el código)
  - Verifica los logs de tu servidor para ver si el webhook está llegando

- **`stream.ended` no aparece**: 
  - No te preocupes, usa `stream.idle` para detectar cuando se detiene
  - Usa `recording.ready` para guardar el VOD cuando esté disponible

## 🔍 Cómo Verificar que el Webhook Funciona

1. **Desarrollo Local con ngrok**:
   ```bash
   # Terminal 1: Inicia tu app
   npm run dev
   
   # Terminal 2: Inicia ngrok
   ngrok http 3000
   
   # Copia la URL HTTPS que aparece (ej: https://abc123.ngrok.io)
   # Usa esa URL + /api/livepeer/webhook en Livepeer
   ```

2. **Ver logs en tiempo real**:
   - En desarrollo, verás los logs en la terminal donde corre `npm run dev`
   - Cada vez que Livepeer envíe un webhook, verás un log en la consola

3. **Probar manualmente** (opcional):
   ```bash
   curl -X POST http://localhost:3000/api/livepeer/webhook \
     -H "Content-Type: application/json" \
     -d '{"type":"stream.started","stream":{"playbackId":"test"}}'
   ```

## 📍 Cómo Obtener tu URL - Guía Detallada

### Opción A: Estás en DESARROLLO (pruebas locales)

**Paso 1**: Asegúrate de que tu app esté corriendo
```bash
npm run dev
# Debe estar corriendo en http://localhost:3000
```

**Paso 2**: Instala y configura ngrok
```bash
# Opción 1: Descargar desde https://ngrok.com/download
# Opción 2: Usar npm (si tienes Node.js)
npx ngrok http 3000
```

**Paso 3**: Copia la URL HTTPS que aparece
```
Forwarding    https://abc123-def456.ngrok.io -> http://localhost:3000
```
Copia esa URL: `https://abc123-def456.ngrok.io`

**Paso 4**: Usa esta URL completa en Livepeer:
```
https://abc123-def456.ngrok.io/api/livepeer/webhook
```

⚠️ **IMPORTANTE**: Cada vez que cierres y vuelvas a abrir ngrok, la URL cambiará. Tendrás que actualizarla en Livepeer.

### Opción B: Ya tienes tu app en PRODUCCIÓN

**Si usas Vercel:**
1. Ve a tu proyecto en https://vercel.com
2. Copia la URL de tu deployment (ej: `streamapp-xyz.vercel.app`)
3. Tu URL del webhook será:
```
https://streamapp-xyz.vercel.app/api/livepeer/webhook
```

**Si usas otro hosting:**
```
https://tu-dominio.com/api/livepeer/webhook
```

### 🔄 ¿Cuándo usar cada opción?

- **Desarrollo Local (ngrok)**: Solo para pruebas mientras desarrollas
- **Producción**: Para cuando ya hayas desplegado tu app y quieras que funcione permanentemente

## ✅ Checklist

- [ ] Decidido si usar desarrollo (ngrok) o producción
- [ ] URL obtenida y configurada en Livepeer
- [ ] Secret configurado (opcional pero recomendado)
- [ ] Eventos seleccionados: `stream.started`, `stream.idle`, `recording.ready`
- [ ] Secret agregado a `.env.local` si lo usaste
- [ ] Webhook creado y activo en Livepeer
- [ ] App corriendo (si es desarrollo local) o desplegada (si es producción)
