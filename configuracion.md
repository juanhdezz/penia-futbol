# Configuración de Mi Peña Futbolera con Supabase

Este documento proporciona instrucciones detalladas para configurar la aplicación "Mi Peña Futbolera" con Supabase como backend.

## Requisitos previos

- Node.js 18.x o superior
- npm o yarn
- Cuenta en Supabase (https://supabase.com)

## 1. Configuración de Supabase

### 1.1 Crear un nuevo proyecto en Supabase

1. Inicia sesión en tu cuenta de Supabase
2. Crea un nuevo proyecto desde el dashboard
3. Elige un nombre para tu proyecto (por ejemplo, "mi-pena-futbolera")
4. Establece una contraseña segura para la base de datos
5. Selecciona la región más cercana a tus usuarios
6. Haz clic en "Crear nuevo proyecto"

### 1.2 Configurar la base de datos

Una vez creado el proyecto, debes crear las tablas necesarias para la aplicación. Puedes hacerlo desde la interfaz de Supabase o ejecutando los siguientes scripts SQL en el Editor SQL de Supabase:

\`\`\`sql
-- Tabla de usuarios (se conecta con auth.users)
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  imagen TEXT,
  posicion TEXT,
  habilidad INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de partidos
CREATE TABLE partidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha DATE NOT NULL,
  hora TEXT NOT NULL,
  campo TEXT NOT NULL,
  resultado_equipo_a INTEGER,
  resultado_equipo_b INTEGER,
  estado TEXT NOT NULL DEFAULT 'Pendiente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de equipos
CREATE TABLE equipos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partido_id UUID REFERENCES partidos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de relación jugadores-equipos
CREATE TABLE jugadores_equipos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipo_id UUID REFERENCES equipos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de estadísticas de jugadores
CREATE TABLE estadisticas_jugadores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  partido_id UUID REFERENCES partidos(id) ON DELETE CASCADE,
  equipo_id UUID REFERENCES equipos(id) ON DELETE CASCADE,
  goles INTEGER DEFAULT 0,
  asistencias INTEGER DEFAULT 0,
  tarjetas_amarillas INTEGER DEFAULT 0,
  tarjetas_rojas INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de multas
CREATE TABLE multas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  motivo TEXT NOT NULL,
  monto NUMERIC(10, 2) NOT NULL,
  fecha DATE NOT NULL,
  pagado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

### 1.3 Configurar políticas de seguridad (RLS)

Para proteger tus datos, configura las políticas de Row Level Security (RLS) en Supabase:

1. Ve a la sección "Authentication" > "Policies" en el dashboard de Supabase
2. Activa RLS para todas las tablas
3. Crea políticas para cada tabla según tus necesidades de seguridad

Ejemplo de políticas básicas:

\`\`\`sql
-- Política para usuarios (solo pueden ver y editar su propio perfil)
CREATE POLICY "Usuarios pueden ver todos los perfiles" 
ON usuarios FOR SELECT 
USING (true);

CREATE POLICY "Usuarios solo pueden actualizar su propio perfil" 
ON usuarios FOR UPDATE 
USING (auth.uid() = id);

-- Política para partidos (todos pueden ver, solo administradores pueden editar)
CREATE POLICY "Todos pueden ver partidos" 
ON partidos FOR SELECT 
USING (true);

-- Añade políticas similares para las demás tablas
\`\`\`

## 2. Configuración del proyecto Next.js

### 2.1 Clonar el repositorio

\`\`\`bash
git clone <url-del-repositorio>
cd mi-pena-futbolera
\`\`\`

### 2.2 Instalar dependencias

\`\`\`bash
npm install
# o
yarn
\`\`\`

### 2.3 Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-publica
\`\`\`

Puedes encontrar estos valores en la sección "Settings" > "API" de tu proyecto en Supabase.

## 3. Ejecutar la aplicación

\`\`\`bash
npm run dev
# o
yarn dev
\`\`\`

La aplicación estará disponible en `http://localhost:3000`.

## 4. Despliegue en producción

### 4.1 Despliegue en Vercel

1. Crea una cuenta en Vercel si aún no tienes una
2. Importa tu repositorio de GitHub/GitLab/Bitbucket
3. Configura las variables de entorno (las mismas que en `.env.local`)
4. Haz clic en "Deploy"

### 4.2 Despliegue en otros proveedores

Para desplegar en otros proveedores, sigue sus instrucciones específicas para aplicaciones Next.js y asegúrate de configurar las variables de entorno correctamente.

## 5. Administración y mantenimiento

### 5.1 Gestión de usuarios

- Los usuarios se registran a través de la aplicación
- Puedes gestionar usuarios desde el panel de Supabase en "Authentication" > "Users"

### 5.2 Respaldo de datos

Configura respaldos regulares de tu base de datos desde el panel de Supabase en "Database" > "Backups".

### 5.3 Monitoreo

Utiliza las herramientas de monitoreo de Supabase para supervisar el rendimiento y el uso de tu aplicación.

## 6. Solución de problemas comunes

### 6.1 Problemas de autenticación

Si los usuarios tienen problemas para iniciar sesión:
- Verifica que las variables de entorno estén configuradas correctamente
- Comprueba los registros de autenticación en Supabase
- Asegúrate de que las políticas RLS no sean demasiado restrictivas

### 6.2 Problemas de rendimiento

Si la aplicación es lenta:
- Optimiza tus consultas SQL
- Considera añadir índices a las columnas frecuentemente consultadas
- Utiliza la caché del lado del cliente para datos que no cambian con frecuencia

## 7. Recursos adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de la API de Supabase para JavaScript](https://supabase.com/docs/reference/javascript/introduction)
