# Configuración de Supabase Storage para Imágenes

Este documento explica cómo configurar Supabase Storage para permitir la subida de imágenes de avatar y banner.

## 📋 Pasos de Configuración

### 1. Crear Buckets en Supabase

Ve a tu proyecto de Supabase → Storage → Create a new bucket

#### Bucket: `avatars`
- **Name**: `avatars`
- **Public bucket**: ✅ Sí (marcar como público)
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/jpeg, image/jpg, image/png, image/webp, image/gif`

#### Bucket: `covers`
- **Name**: `covers`
- **Public bucket**: ✅ Sí (marcar como público)
- **File size limit**: 10 MB
- **Allowed MIME types**: `image/jpeg, image/jpg, image/png, image/webp`

### 2. Configurar Políticas RLS (Row Level Security)

Para cada bucket, ve a **Policies** y crea las siguientes políticas:

#### Para `avatars`:

**Policy 1: Allow authenticated users to upload**
```sql
CREATE POLICY "Users can upload own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Policy 2: Allow public read**
```sql
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

**Policy 3: Allow users to update own avatars**
```sql
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Policy 4: Allow users to delete own avatars**
```sql
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Para `covers`:

**Policy 1: Allow authenticated users to upload**
```sql
CREATE POLICY "Users can upload own covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Policy 2: Allow public read**
```sql
CREATE POLICY "Public can view covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'covers');
```

**Policy 3: Allow users to update own covers**
```sql
CREATE POLICY "Users can update own covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Policy 4: Allow users to delete own covers**
```sql
CREATE POLICY "Users can delete own covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 3. Verificar Variables de Entorno

Asegúrate de tener estas variables en tu `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

## ✅ Verificación

Para verificar que todo funciona:

1. Ve a tu perfil
2. Haz clic en "Editar Perfil"
3. Intenta subir un avatar usando el botón junto al avatar
4. Intenta subir un banner usando el botón en el banner
5. Verifica que las imágenes se muestren correctamente

## 🐛 Solución de Problemas

### Error: "Bucket not found"
- Verifica que los buckets `avatars` y `covers` estén creados
- Verifica que los nombres sean exactamente `avatars` y `covers`

### Error: "Access denied"
- Verifica que las políticas RLS estén configuradas correctamente
- Verifica que el bucket esté marcado como público
- Verifica que `SUPABASE_SERVICE_ROLE_KEY` esté configurado

### Error: "File too large"
- Verifica los límites de tamaño en los buckets
- Avatar: máximo 5MB
- Cover: máximo 10MB

### Las imágenes no se muestran
- Verifica que los buckets estén marcados como públicos
- Verifica que las políticas de SELECT estén configuradas
- Revisa la consola del navegador para errores CORS

## 📝 Notas

- Las imágenes se almacenan en rutas como: `avatars/{user_id}/{timestamp}.{ext}`
- Las imágenes antiguas no se eliminan automáticamente (puedes implementar limpieza si es necesario)
- Los buckets públicos permiten acceso directo a las URLs sin autenticación




