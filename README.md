# 💰 FinanzasApp

**Gestor de finanzas personales multiplataforma con sincronización en tiempo real**

---

## 📱 Descripción

**FinanzasApp** es una aplicación móvil multiplataforma (iOS y Android) que te permite gestionar tus finanzas personales de manera simple y eficiente. Registra tus ingresos y gastos, visualiza tu balance en tiempo real y mantén tus datos sincronizados en todos tus dispositivos.

---

## ✨ Características

### 🔐 Autenticación Segura
- Registro e inicio de sesión con email/contraseña
- Confirmación por email
- Persistencia de sesión
- Protección de datos con Row Level Security (RLS)

### 💸 Gestión de Transacciones
- Añadir ingresos y gastos
- Balance total calculado automáticamente
- Eliminar transacciones
- Historial ordenado por fecha

### ⚡ Sincronización en Tiempo Real
- Datos sincronizados instantáneamente
- Funciona en múltiples dispositivos simultáneamente
- Almacenamiento en la nube con PostgreSQL

### 🎨 Interfaz Moderna
- Modo oscuro por defecto
- Visualización clara de ingresos vs gastos
- UX intuitiva y responsiva
- Indicadores de carga y estados

---

## 🚀 Instalación

### Prerrequisitos

- Node.js v18 o superior
- npm o yarn
- Expo Go en tu dispositivo móvil
- Cuenta en Supabase (gratis)

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/finanzas-app.git
cd finanzas-app
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

### Paso 3: Configurar Supabase

#### 3.1 Crear Proyecto en Supabase

1. Ve a https://supabase.com y crea un proyecto
2. Espera 2 minutos mientras se inicializa
3. Ve a Settings → API y copia:
   - Project URL
   - anon public key

#### 3.2 Crear Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

#### 3.3 Configurar Base de Datos

En Supabase, ve a SQL Editor y ejecuta:

```sql
-- Crear tabla de transacciones
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Crear índices
CREATE INDEX transactions_user_id_idx ON transactions(user_id);
CREATE INDEX transactions_date_idx ON transactions(date DESC);

-- Activar Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
```

### Paso 4: Actualizar Configuración

Edita `lib/supabase.js` y actualiza:

```javascript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
```

### Paso 5: Ejecutar la App

```bash
npx expo start
```

Escanea el QR con:
- **iPhone:** App nativa de Cámara
- **Android:** App Expo Go

---

## 📖 Uso

### Registro de Usuario

1. Abre la app
2. Click en "¿No tienes cuenta? Regístrate"
3. Ingresa email y contraseña (mínimo 6 caracteres)
4. Verifica tu email
5. Inicia sesión

### Añadir Transacción

1. Selecciona tipo: Gasto o Ingreso
2. Escribe la descripción (ej: "Supermercado")
3. Ingresa el monto
4. Click en Guardar

### Ver Balance

El balance se calcula automáticamente:

```
Balance = Total Ingresos - Total Gastos
```

---

## 🛠️ Tecnologías

### Frontend
- React Native
- Expo
- React

### Backend
- Supabase (Backend-as-a-Service)
- PostgreSQL (Base de datos)
- PostgREST (API REST automática)
- Realtime (WebSockets)

### Dependencias Principales

```json
{
  "@supabase/supabase-js": "^2.45.0",
  "@react-native-async-storage/async-storage": "1.23.1",
  "react-native-url-polyfill": "^2.0.0",
  "@expo/vector-icons": "^14.0.0"
}
```

---

## 📂 Estructura del Proyecto

```
finanzas-app/
├── app/
│   ├── (tabs)/
│   │   └── index.js          # Pantalla principal con auth y finanzas
│   └── _layout.js            # Layout raíz
├── lib/
│   └── supabase.js           # Configuración de Supabase
├── .env                      # Variables de entorno (NO subir a Git)
├── .env.example              # Ejemplo de variables de entorno
├── .gitignore                # Archivos ignorados por Git
├── app.json                  # Configuración de Expo
├── package.json              # Dependencias del proyecto
└── README.md                 # Este archivo
```

---

## 🔒 Seguridad

### Row Level Security (RLS)

La app implementa RLS en Supabase para garantizar que:

- Cada usuario solo puede ver sus propias transacciones
- No se puede acceder a datos de otros usuarios
- Las políticas se aplican a nivel de base de datos

### Variables de Entorno

Las credenciales sensibles se almacenan en `.env` y NO se suben a Git.

Archivo `.gitignore`:

```
node_modules/
.expo/
.env
.env.local
dist/
```

---

## 🚀 Deployment

### Opción 1: Build con EAS (Recomendado)

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Configurar
eas build:configure

# Build para Android (APK de prueba)
eas build --platform android --profile preview

# Build de producción
eas build --platform all --profile production
```

### Opción 2: Expo Go (Solo demos)

```bash
npx expo publish
```

---

## 📊 Scripts Disponibles

```bash
# Iniciar servidor de desarrollo
npm start

# Iniciar en Android
npm run android

# Iniciar en iOS
npm run ios

# Iniciar en web
npm run web

# Limpiar caché
npx expo start --clear
```

---

## 🐛 Troubleshooting

### Error: "Module not found"

```bash
rm -rf node_modules
npm install
```

### Error: "Port already in use"

```bash
npx expo start --clear
```

### Error: "violates row-level security policy"

Verifica que:
1. RLS esté configurado correctamente
2. Las políticas estén activas
3. El user_id se esté enviando en los inserts

### Error de conexión a Supabase

Verifica que:
1. Las credenciales en `.env` sean correctas
2. El proyecto de Supabase esté activo
3. Tengas conexión a internet

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Roadmap

### Próximas Funcionalidades

- [ ] Categorías de gastos
- [ ] Gráficos y reportes mensuales
- [ ] Exportar a PDF/CSV
- [ ] Notificaciones push
- [ ] Presupuestos mensuales
- [ ] Login con Google/Apple
- [ ] Modo offline con sincronización
- [ ] Widget para home screen
- [ ] Soporte multi-moneda
- [ ] Recordatorios de pagos

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

## 👤 Autor

**Tu Nombre**

- GitHub: [@tu-usuario](https://github.com/tu-usuario)
- Email: tu-email@example.com

---

## 🙏 Agradecimientos

- [Expo](https://expo.dev/) - Plataforma de desarrollo
- [Supabase](https://supabase.com/) - Backend as a Service
- [React Native](https://reactnative.dev/) - Framework móvil
- Comunidad de desarrolladores

---

## 📞 Soporte

Si tienes preguntas o encuentras algún bug:

- Abre un [Issue](https://github.com/tu-usuario/finanzas-app/issues)
- Contáctame por email: tu-email@example.com

---

<div align="center">

**Hecho con ❤️ y ☕**

⭐ Si te gusta el proyecto, dale una estrella en GitHub ⭐

</div>