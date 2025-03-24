# Druli Leasing

Plataforma para el arrendamiento de equipos médicos y dentales en México. Empodera a profesionales de la salud con acceso a equipamiento de alta gama a través de planes flexibles y personalizados.

## Fase 1: Landing Page + Autenticación

Esta fase incluye:
- Landing page comercial atractiva y moderna
- Simulador interactivo de arrendamiento
- Sistema completo de autenticación (registro/login)

## Stack Tecnológico

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Autenticación y Base de Datos)
- **Dependencias clave**: react-hook-form, zod, @supabase/ssr, lucide-react

## Características Principales

### Landing Page
- Diseño moderno y limpio con paleta de colores corporativos
- Navegación intuitiva con versión móvil completamente responsiva
- Secciones de presentación: Hero, Beneficios, Simulador, Categorías, Testimonios, Proceso y CTA
- Animaciones y transiciones sutiles para mejorar la experiencia de usuario

### Simulador de Arrendamiento
- Calculadora interactiva para estimar pagos mensuales
- Selección de tipo de equipo, monto y plazo
- Cálculos en tiempo real con tasas y condiciones realistas

### Sistema de Autenticación
- Registro de usuarios con validación
- Inicio de sesión seguro
- Restablecimiento de contraseña
- Verificación de correo electrónico
- Protección de rutas mediante middleware

## Estructura del Proyecto

```
/app                       # Rutas y páginas con App Router
  /page.tsx                # Landing page principal
  /(auth)                  # Grupo de rutas de autenticación
    /login/page.tsx        # Página de login
    /register/page.tsx     # Página de registro
    /verify/page.tsx       # Página de verificación
    /reset-password/page.tsx # Restablecimiento de contraseña
  /dashboard/page.tsx      # Dashboard del usuario
  /api/auth/signout/route.ts # API para cerrar sesión
/components
  /ui                      # Componentes shadcn/ui
  /landing                 # Componentes de la landing
    /hero.tsx
    /simulator.tsx
    /benefits.tsx
    /equipment-categories.tsx
    /testimonials.tsx
    /process.tsx
    /cta-section.tsx
  /auth                    # Componentes de autenticación
    /login-form.tsx
    /register-form.tsx
    /password-reset-form.tsx
    /verify-email.tsx
  /shared                  # Componentes compartidos
    /header.tsx
    /footer.tsx
/lib
  /supabase.ts             # Cliente de Supabase
/middleware.ts             # Middleware para protección de rutas
```

## Configuración e Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/tuusuario/druli.git
   cd druli
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. **Ejecutar en modo desarrollo**:
   ```bash
   npm run dev
   ```

## Próximos Pasos (Fase 2)

- Dashboard completo para usuarios
- Panel de administración
- Gestión de solicitudes de arrendamiento
- Integraciones de pago
- Catálogo de equipos más detallado

## Licencia

Este proyecto está bajo licencia privada y es propiedad de Druli.
