# StreamApp - Plataforma de Streaming en Vivo

Una plataforma de streaming en vivo inspirada en Kick.com, construida con Next.js 14, Supabase, Livepeer y HLS.js.

## 🚀 Características

- ✅ Transmisión en vivo con Livepeer
- ✅ Chat en tiempo real con Supabase Realtime
- ✅ Reproductor HLS.js para streams
- ✅ Dashboard del streamer
- ✅ VODs (Video On Demand) automáticos
- ✅ Perfiles de usuario
- ✅ UI moderna tipo Kick.com con paleta negra + acentos llamativos
- ✅ Autenticación con Supabase
- ✅ Exploración de streams y categorías

## 🛠️ Tecnologías

- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **Tailwind CSS**
- **Supabase** (Base de datos, Auth, Realtime, Storage)
- **Livepeer** (Streaming + VOD)
- **HLS.js** (Reproducción de streams)
- **Lucide React** (Iconos)

## 📋 Requisitos Previos

- Node.js 18+ y npm/yarn
- Cuenta de Supabase (gratuita)
- Cuenta de Livepeer (API key)

## 🔧 Instalación

### 1. Clonar e Instalar Dependencias

```bash
npm install
# o
yarn install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
LIVEPEER_API_KEY=tu_livepeer_api_key
NEXT_PUBLIC_LIVEPEER_API_KEY=tu_livepeer_api_key
```

### 3. Configurar Supabase

#### 3.1 Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Copia la URL y las keys a tu `.env.local`

#### 3.2 Ejecutar el Esquema SQL

1. Ve al SQL Editor en tu proyecto de Supabase
2. Copia y ejecuta el contenido de `lib/supabase/schema.sql`

Este script creará:
- Tabla `profiles`
- Tabla `streams`
- Tabla `messages` (chat)
- Tabla `videos` (VODs)
- Row Level Security policies
- Funciones y triggers necesarios

#### 3.3 Configurar Storage (Opcional)

Si quieres que los usuarios puedan subir avatares:

1. Ve a Storage en Supabase
2. Crea un bucket llamado `avatars`
3. Configura las políticas según tus necesidades

### 4. Configurar Livepeer

1. Ve a [livepeer.studio](https://livepeer.studio)
2. Crea una cuenta
3. Genera un API Key
4. Agrega la key a tu `.env.local`

### 5. Ejecutar el Proyecto

```bash
npm run dev
# o
yarn dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
├── app/
│   ├── api/
│   │   ├── livepeer/
│   │   │   ├── create-stream/route.ts
│   │   │   ├── get-stream/route.ts
│   │   │   └── webhook/route.ts
│   │   └── chat/
│   │       └── send/route.ts
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/page.tsx
│   ├── explore/page.tsx
│   ├── profile/[id]/page.tsx
│   ├── stream/[username]/page.tsx
│   ├── layout.tsx
│   ├── page.tsx (Home)
│   └── globals.css
├── components/
│   ├── CategorySidebar.tsx
│   ├── HLSPlayer.tsx
│   ├── LiveChat.tsx
│   ├── Navbar.tsx
│   ├── Providers.tsx
│   ├── StreamCard.tsx
│   └── HeroCarousel.tsx
├── lib/
│   ├── livepeer.ts
│   └── supabase/
│       ├── client.ts
│       ├── server.ts
│       ├── database.types.ts
│       └── schema.sql
└── README.md
```

## 🎯 Uso

### Para Streamers

1. **Crear Cuenta**: Regístrate en `/auth/register`
2. **Ir al Dashboard**: Ve a `/dashboard`
3. **Crear Stream**: Ingresa un título y haz clic en "Crear Stream"
4. **Configurar OBS**:
   - Instala [OBS Studio](https://obsproject.com/)
   - Configura:
     - Servidor: Usa el RTMP Ingest URL del dashboard
     - Stream Key: Usa la Stream Key del dashboard
5. **Iniciar Transmisión**: Haz clic en "Iniciar Transmisión" en OBS
6. **Compartir**: Comparte tu stream en `/stream/tu-username`

### Para Espectadores

1. **Explorar**: Ve a la home o a `/explore` para ver streams en vivo
2. **Ver Stream**: Haz clic en cualquier tarjeta de stream
3. **Chat**: Participa en el chat en tiempo real (requiere cuenta)

## 🔐 Autenticación

La autenticación está manejada completamente por Supabase. Los usuarios pueden:
- Registrarse con email y password
- Iniciar sesión
- Crear un perfil automáticamente al registrarse
- Personalizar username y avatar

## 📺 Streaming

### Creación de Streams

Los streams se crean a través de la API de Livepeer y se guardan en Supabase. Cada stream incluye:
- Título
- Stream Key (único)
- RTMP Ingest URL
- Playback ID (para reproducir)

### Webhooks

El endpoint `/api/livepeer/webhook` recibe notificaciones de Livepeer cuando:
- Un stream comienza
- Un stream termina
- Un stream está idle

Cuando un stream termina, automáticamente se guarda como VOD.

## 💬 Chat en Vivo

El chat utiliza Supabase Realtime para:
- Mensajes en tiempo real
- Actualizaciones instantáneas
- Historial de mensajes
- Autenticación de usuarios

Cada stream tiene su propio canal de chat.

## 🎨 Personalización

### Colores

Los colores se pueden personalizar en `tailwind.config.ts`:
- `accent`: Color principal (actualmente púrpura)
- `primary`: Color secundario (actualmente azul)
- `dark`: Escala de grises oscuros

### Estilos

Los estilos globales están en `app/globals.css`. Puedes modificar:
- Colores del tema
- Animaciones
- Componentes reutilizables (`.btn`, `.card`, etc.)

## 🚢 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Agrega las variables de entorno
3. Deploy automático

### Configurar Webhook de Livepeer

1. Ve a tu dashboard de Livepeer
2. Agrega un webhook: `https://tu-dominio.com/api/livepeer/webhook`
3. Selecciona los eventos que quieres recibir

## 📝 Notas Importantes

- **API Keys**: Nunca commitees tus `.env.local` al repositorio
- **Supabase Policies**: Asegúrate de que las políticas RLS estén configuradas correctamente
- **Livepeer**: El plan gratuito tiene límites, considera actualizar para producción
- **HLS.js**: Funciona en todos los navegadores modernos, Safari tiene soporte nativo

## 🐛 Troubleshooting

### El stream no se reproduce
- Verifica que el stream esté en vivo
- Asegúrate de que el playback_id sea correcto
- Revisa la consola del navegador para errores

### El chat no funciona
- Verifica que Supabase Realtime esté habilitado
- Revisa las políticas RLS en la tabla `messages`
- Asegúrate de estar autenticado

### Error al crear stream
- Verifica que la API key de Livepeer sea correcta
- Revisa que las variables de entorno estén configuradas
- Verifica los logs del servidor

## 📄 Licencia

Este proyecto está abierto para uso personal y educativo.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📧 Soporte

Si tienes problemas o preguntas, puedes:
- Abrir un issue en GitHub
- Revisar la documentación de las tecnologías usadas

---

Construido con ❤️ usando Next.js, Supabase y Livepeer
