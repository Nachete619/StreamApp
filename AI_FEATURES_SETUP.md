# Configuración de Funcionalidades de IA

Este documento explica cómo configurar las dos nuevas funcionalidades de IA en StreamApp:
1. Sistema de Moderación de Chat
2. Resumen Automático de Streams

## 📋 Requisitos Previos

Necesitas una API key de una de estas plataformas:
- **OpenAI** (recomendado): https://platform.openai.com/api-keys
- **Groq** (alternativa más rápida y económica): https://console.groq.com/keys

## 🔧 Configuración

### 1. Variables de Entorno

Añade una de estas variables a tu archivo `.env.local`:

**Opción A: OpenAI (recomendado)**
```env
OPENAI_API_KEY=sk-tu-api-key-aqui
```

**Opción B: Groq (alternativa)**
```env
GROQ_API_KEY=gsk_tu-api-key-aqui
```

**Nota:** El sistema detectará automáticamente cuál API key está disponible y la usará.

### 2. Actualizar Base de Datos

Ejecuta el siguiente SQL en el SQL Editor de Supabase:

```sql
-- Ver el archivo: lib/supabase/schema-updates.sql
```

O ejecuta directamente:

```sql
-- Añadir columna 'hidden' a messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_hidden ON public.messages(hidden);

-- Crear tabla stream_summaries
CREATE TABLE IF NOT EXISTS public.stream_summaries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  stream_id UUID REFERENCES public.streams(id) ON DELETE CASCADE NOT NULL,
  short_summary TEXT NOT NULL,
  long_summary TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.stream_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stream summaries are viewable by everyone"
  ON public.stream_summaries FOR SELECT
  USING (true);

CREATE POLICY "Users can create summaries for own streams"
  ON public.stream_summaries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.streams
      WHERE streams.id = stream_summaries.stream_id
      AND streams.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_stream_summaries_stream_id ON public.stream_summaries(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_summaries_created_at ON public.stream_summaries(created_at);
```

## 🟩 Sistema de Moderación de Chat

### ¿Cómo funciona?

1. Cuando un usuario envía un mensaje en el chat, se envía a `/api/moderate`
2. El endpoint usa IA para analizar el contenido del mensaje
3. Si el mensaje es inapropiado (insultos, odio, acoso, etc.), se guarda con `hidden = true`
4. Los mensajes ocultos no se muestran en el chat ni se emiten por Realtime

### Características

- ✅ Detección automática de contenido inapropiado
- ✅ Mensajes moderados se guardan pero no se muestran
- ✅ Notificación al usuario si su mensaje fue moderado
- ✅ Fallback seguro: si la moderación falla, el mensaje se permite (fail open)

### Tipos de contenido detectado

- Insultos o lenguaje ofensivo
- Odio o discriminación
- Acoso o bullying
- Contenido sexual explícito
- Amenazas o violencia
- Spam excesivo

## 🟦 Resumen Automático de Streams

### ¿Cómo funciona?

1. El streamer puede generar un resumen desde su dashboard
2. El sistema obtiene los últimos 200 mensajes del chat
3. Usa IA para generar dos resúmenes:
   - **Resumen corto**: Máximo 100 palabras
   - **Resumen extendido**: Máximo 300 palabras
4. Los resúmenes se guardan en la tabla `stream_summaries`

### Características

- ✅ Generación automática con un clic
- ✅ Dos niveles de resumen (corto y extendido)
- ✅ Basado en mensajes del chat y título del stream
- ✅ Historial de resúmenes guardados

### Uso

1. Ve a tu dashboard (`/dashboard`)
2. Desplázate hasta la sección "Resumen del Stream"
3. Haz clic en "Generar Resumen"
4. Espera unos segundos mientras se procesa
5. El resumen aparecerá automáticamente

## 🔍 Modelos de IA Utilizados

### OpenAI
- Moderación: `gpt-3.5-turbo`
- Resúmenes: `gpt-4-turbo-preview`

### Groq
- Moderación: `llama-3.1-8b-instant`
- Resúmenes: `llama-3.1-70b-versatile`

## 🛠️ Arquitectura

### Archivos Creados/Modificados

1. **`lib/ai/client.ts`**: Cliente de IA unificado (OpenAI/Groq)
2. **`app/api/moderate/route.ts`**: Endpoint de moderación
3. **`app/api/summary/route.ts`**: Endpoint de generación de resúmenes
4. **`components/LiveChat.tsx`**: Actualizado para usar moderación
5. **`app/dashboard/page.tsx`**: Añadida sección de resúmenes
6. **`lib/supabase/schema-updates.sql`**: Script SQL para actualizar BD

### Flujo de Moderación

```
Usuario envía mensaje
    ↓
POST /api/moderate
    ↓
IA analiza contenido
    ↓
¿Es apropiado?
    ├─ Sí → hidden = false → Se muestra en chat
    └─ No → hidden = true → Se oculta
```

### Flujo de Resumen

```
Usuario hace clic en "Generar Resumen"
    ↓
POST /api/summary
    ↓
Obtener últimos 200 mensajes
    ↓
IA genera resúmenes
    ↓
Guardar en stream_summaries
    ↓
Mostrar en dashboard
```

## ⚠️ Notas Importantes

1. **Costos de API**: Las llamadas a IA tienen costo. Considera:
   - Groq es más económico y rápido
   - OpenAI es más preciso pero más costoso
   - Implementa rate limiting en producción

2. **Fallback**: Si la moderación falla, el sistema permite el mensaje (fail open). Puedes cambiar esto a fail closed si prefieres.

3. **Performance**: 
   - La moderación añade ~1-2 segundos de latencia
   - Los resúmenes pueden tardar 5-10 segundos

4. **Privacidad**: Los mensajes se envían a servicios de IA externos. Asegúrate de cumplir con las políticas de privacidad.

## 🐛 Troubleshooting

### Error: "No AI API key found"
- Verifica que hayas añadido `OPENAI_API_KEY` o `GROQ_API_KEY` en `.env.local`
- Reinicia el servidor después de añadir la variable

### Los mensajes no se moderan
- Verifica los logs del servidor
- Asegúrate de que la API key sea válida
- Revisa que el endpoint `/api/moderate` esté funcionando

### Los resúmenes no se generan
- Verifica que haya mensajes en el stream
- Revisa los logs para errores de la API
- Asegúrate de tener suficientes créditos en tu cuenta de IA

### Error de permisos en Supabase
- Verifica que hayas ejecutado el SQL de actualización
- Revisa las políticas RLS en `stream_summaries`

## 📝 Próximas Mejoras

- [ ] Rate limiting para moderación
- [ ] Cache de resúmenes
- [ ] Opción de personalizar criterios de moderación
- [ ] Estadísticas de moderación
- [ ] Exportar resúmenes
