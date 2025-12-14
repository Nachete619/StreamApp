# Sistema de Gamificación - Guía de Instalación

Este documento explica cómo configurar el sistema de gamificación (XP, insignias y emojis especiales) en StreamApp.

## 📋 Características Implementadas

### Sistema de XP
- **Ver streams**: 10 XP por stream (una vez por stream)
- **Chatear**: 5 XP por mensaje enviado
- **Donar**: 50 XP por donación (pendiente de implementar endpoint)
- **Hacer clips**: 25 XP por clip creado (pendiente de implementar endpoint)

### Sistema de Niveles
- Fórmula: `level = floor(sqrt(xp / 100)) + 1`
- Sistema progresivo que requiere más XP para cada nivel

### Insignias (Badges)
- Se desbloquean automáticamente al alcanzar ciertos logros
- Tipos de requisitos:
  - Por nivel alcanzado
  - Por XP total acumulado
  - Por cantidad de acciones realizadas

### Emojis Especiales
- Se desbloquean según el nivel del usuario
- Disponibles en el chat para usuarios que los han desbloqueado

## 🚀 Instalación

### 1. Ejecutar Migraciones SQL

Ejecuta las siguientes migraciones en tu base de datos Supabase (en orden):

```sql
-- 1. Agregar sistema de gamificación
-- Ejecuta: lib/supabase/migrations/add_gamification.sql

-- 2. Actualizar trigger de creación de perfil
-- Ejecuta: lib/supabase/migrations/update_profile_trigger.sql
```

### 2. Actualizar Perfiles Existentes

Si ya tienes usuarios en tu base de datos, ejecuta esto para inicializar sus XP y niveles:

```sql
UPDATE public.profiles 
SET total_xp = 0, level = 1 
WHERE total_xp IS NULL OR level IS NULL;
```

### 3. Verificar Variables de Entorno

Asegúrate de tener configurado `SUPABASE_SERVICE_ROLE_KEY` en tu `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

Este key es necesario para que las APIs puedan actualizar XP y otorgar insignias.

## 📁 Archivos Creados

### Base de Datos
- `lib/supabase/migrations/add_gamification.sql` - Esquema completo del sistema
- `lib/supabase/migrations/update_profile_trigger.sql` - Actualización del trigger

### Utilidades
- `lib/gamification.ts` - Funciones de cálculo de XP y niveles

### APIs
- `app/api/gamification/add-xp/route.ts` - Agregar XP por acciones
- `app/api/gamification/get-user-stats/route.ts` - Obtener estadísticas del usuario
- `app/api/gamification/check-badges/route.ts` - Verificar y otorgar insignias

### Componentes
- `components/XPDisplay.tsx` - Muestra XP, nivel y progreso
- `components/BadgeDisplay.tsx` - Muestra insignias del usuario
- `components/SpecialEmojiPicker.tsx` - Selector de emojis especiales
- `components/StreamViewTracker.tsx` - Rastrea visualizaciones de streams

### Modificaciones
- `components/LiveChat.tsx` - Agregado XP al chatear y selector de emojis
- `app/stream/[username]/page.tsx` - Agregado XP al ver streams
- `app/profile/[id]/page.tsx` - Muestra XP e insignias en perfil
- `app/dashboard/page.tsx` - Muestra XP e insignias en dashboard

## 🎮 Cómo Funciona

### Agregar XP

El sistema agrega XP automáticamente cuando:

1. **Ver un stream**: Después de 30 segundos viendo un stream en vivo
2. **Enviar un mensaje**: Inmediatamente después de enviar un mensaje aprobado

### Desbloquear Insignias

Las insignias se verifican automáticamente cuando:
- El usuario sube de nivel
- Se puede llamar manualmente a `/api/gamification/check-badges`

### Emojis Especiales

Los emojis se desbloquean automáticamente según el nivel del usuario. Aparecen en el selector de emojis del chat.

## 🔧 Personalización

### Cambiar Recompensas de XP

Edita `lib/gamification.ts`:

```typescript
export const XP_REWARDS = {
  WATCH: 10,      // Cambia estos valores
  CHAT: 5,
  DONATE: 50,
  CLIP: 25,
} as const
```

### Agregar Nuevas Insignias

Ejecuta SQL en Supabase:

```sql
INSERT INTO public.badges (name, description, icon, requirement_type, requirement_value)
VALUES ('Nueva Insignia', 'Descripción', '🎯', 'level', 15);
```

### Agregar Nuevos Emojis

```sql
INSERT INTO public.special_emojis (emoji, name, description, unlock_level)
VALUES ('🎮', 'Gamepad', 'Emoji de gamepad', 12);
```

## 📝 Pendiente de Implementar

1. **Sistema de Donaciones**: Endpoint para procesar donaciones y otorgar XP
2. **Sistema de Clips**: Endpoint para crear clips y otorgar XP
3. **Notificaciones de Insignias**: Mostrar notificación cuando se desbloquea una insignia
4. **Historial de XP**: Página para ver historial detallado de ganancias de XP

## 🐛 Solución de Problemas

### XP no se está agregando

1. Verifica que `SUPABASE_SERVICE_ROLE_KEY` esté configurado
2. Revisa la consola del navegador para errores
3. Verifica que las migraciones SQL se hayan ejecutado correctamente

### Insignias no se desbloquean

1. Llama manualmente a `/api/gamification/check-badges` después de ganar XP
2. Verifica que los requisitos de las insignias sean correctos
3. Revisa que el usuario tenga el nivel/XP necesario

### Emojis no aparecen

1. Verifica que el usuario tenga el nivel necesario
2. Revisa que los emojis estén insertados en la base de datos
3. Verifica que el componente `SpecialEmojiPicker` esté recibiendo el nivel correcto

## ✅ Verificación

Para verificar que todo funciona:

1. Crea un nuevo usuario o usa uno existente
2. Ve un stream en vivo por más de 30 segundos
3. Envía un mensaje en el chat
4. Verifica que el XP aumente en el dashboard o perfil
5. Sube de nivel y verifica que se desbloqueen insignias y emojis

