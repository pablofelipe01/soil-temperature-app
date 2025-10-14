# Scripts útiles para desarrollo con Prisma

## Comandos principales

### Generar cliente Prisma
```bash
npx prisma generate
```

### Ver base de datos en Prisma Studio
```bash
npx prisma studio
```

### Verificar esquema sin hacer cambios
```bash
npx prisma validate
```

### Formatear schema.prisma
```bash
npx prisma format
```

### Sincronizar schema con base de datos existente
```bash
npx prisma db pull
```

### Hacer push de cambios al schema (desarrollo)
```bash
npx prisma db push
```

## Comandos de producción

### Reset completo de base de datos (¡CUIDADO!)
```bash
npx prisma migrate reset
```

### Deploy migrations
```bash
npx prisma migrate deploy
```

## Notas importantes

- `DATABASE_URL` usa connection pooling (puerto 6543)
- `DIRECT_URL` usa conexión directa (puerto 5432) 
- Siempre usar `npx prisma generate` después de cambios al schema
- El cliente está configurado como singleton en `lib/prisma.ts`