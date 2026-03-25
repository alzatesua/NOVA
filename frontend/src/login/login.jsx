import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Package, BarChart3, ShoppingCart, FileText, TrendingUp, Zap, Shield, Users } from 'lucide-react';
const API_URL = import.meta.env.VITE_API_URL;

function Login() {
  const [correoUsuario, setCorreoUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsLoaded(true);
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const hostname = window.location.hostname;
    const subdominio = hostname.split('.')[0];

    try {
      const response = await fetch(`${API_URL}/validar/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          usuario: correoUsuario,
          password: password,
          subdominio
        })
      });

      const data = await response.json();

      if (response.ok) {
        const bodegasIds = data.bodegas ? data.bodegas.map(b => b.id) : [];

        localStorage.setItem("accessToken", data.access);
        localStorage.setItem("auth_access_token", data.access);
        localStorage.setItem("token_usuario", data.token_usuario);
        localStorage.setItem("refresh_token", data.refresh);
        localStorage.setItem("auth_refresh_token", data.refresh);
        localStorage.setItem("usuario", data.usuario);
        localStorage.setItem("auth_usuario", data.usuario);
        localStorage.setItem("rol", data.rol);
        localStorage.setItem("slug", data.tienda_slug);
        localStorage.setItem("tienda", data.tienda);
        localStorage.setItem("nombre_sucursal", data.nombre_sucursal);
        localStorage.setItem("id_sucursal", data.id_sucursal_default);
        localStorage.setItem("bodegas_seleccionadas", JSON.stringify(bodegasIds));

        window.location.href = "/dashboard";
      } else {
        toast.error(data.error || "Credenciales inválidas.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "dark",
        });
        setLoading(false);
      }
    } catch (err) {
      toast.error("Error al conectar con el servidor.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google/`;
  };

  const handleAppleLogin = () => {
    window.location.href = `${API_URL}/auth/apple/`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">

      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          transform: `perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-200px)`,
          animation: 'grid-move 20s linear infinite'
        }}></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-blue-500/20"
            style={{
              width: Math.random() * 10 + 5 + 'px',
              height: Math.random() * 10 + 5 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
              animationDelay: Math.random() * 5 + 's',
            }}
          />
        ))}
      </div>

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-orb1"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-orb2"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-3xl animate-orb3"></div>
      </div>

      {/* Main content wrapper */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-8 items-center">

        {/* Left side - Illustration and info */}
        <div className={`hidden lg:block transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>

          {/* 3D Illustration */}
          <div className="relative mb-8" style={{
            transform: `perspective(1000px) rotateY(${mousePosition.x * 0.5}deg) rotateX(${-mousePosition.y * 0.5}deg)`,
            transition: 'transform 0.1s ease-out'
          }}>
            {/* Main card stack */}
            <div className="relative w-full h-[400px]">

              {/* Card 1 - Inventory */}
              <div className="absolute left-0 top-0 w-64 h-40 bg-gradient-to-br from-blue-600/30 to-blue-800/30 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-5 transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 animate-float1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Package className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-300">Inventario</p>
                    <p className="text-lg font-bold text-white">1,284</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[40, 65, 45, 80, 55, 70, 60].map((h, i) => (
                    <div key={i} className="flex-1 bg-blue-500/40 rounded-t" style={{ height: h + '%' }}></div>
                  ))}
                </div>
              </div>

              {/* Card 2 - Sales */}
              <div className="absolute right-0 top-16 w-64 h-40 bg-gradient-to-br from-emerald-600/30 to-emerald-800/30 backdrop-blur-xl rounded-2xl border border-emerald-500/30 p-5 transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 animate-float2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-300">Ventas Hoy</p>
                    <p className="text-lg font-bold text-white">$12,450</p>
                  </div>
                </div>
                <svg className="w-full h-12" viewBox="0 0 100 40">
                  <path d="M0,35 Q10,30 20,32 T40,25 T60,28 T80,15 T100,20" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400" />
                  <path d="M0,35 Q10,30 20,32 T40,25 T60,28 T80,15 T100,20 V40 H0 Z" fill="currentColor" className="text-emerald-500/20" />
                </svg>
              </div>

              {/* Card 3 - Invoices */}
              <div className="absolute left-20 bottom-0 w-64 h-40 bg-gradient-to-br from-purple-600/30 to-purple-800/30 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-5 transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 animate-float3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <FileText className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-purple-300">Facturas</p>
                    <p className="text-lg font-bold text-white">48 Pendientes</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-purple-500/30 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-400 rounded-full animate-progress"></div>
                  </div>
                  <p className="text-xs text-purple-300">Procesando...</p>
                </div>
              </div>

              {/* Floating icons */}
              <div className="absolute top-8 right-32 animate-bounce-slow">
                <ShoppingCart className="w-8 h-8 text-cyan-400 opacity-60" />
              </div>
              <div className="absolute bottom-20 left-48 animate-bounce-slow" style={{ animationDelay: '1s' }}>
                <BarChart3 className="w-8 h-8 text-blue-400 opacity-60" />
              </div>
              <div className="absolute top-32 left-8 animate-bounce-slow" style={{ animationDelay: '2s' }}>
                <Zap className="w-8 h-8 text-yellow-400 opacity-60" />
              </div>
            </div>
          </div>

          {/* Features list */}
          <div className="space-y-4">
            <div className="flex items-start gap-4 group">
              <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Seguridad Empresarial</h3>
                <p className="text-slate-400 text-sm">Protección de datos con encriptación de extremo a extremo y copias de seguridad automáticas.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                <Zap className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Ultrarrápido</h3>
                <p className="text-slate-400 text-sm">Optimizado para velocidad. Carga instantánea y sincronización en tiempo real.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Multiusuario</h3>
                <p className="text-slate-400 text-sm">Gestiona equipos con roles y permisos personalizables para cada colaborador.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className={`flex justify-center transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
          <div className="w-full max-w-md">

            {/* Logo and Brand */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500 rounded-2xl blur-xl animate-glow"></div>
                  <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl border border-slate-700/50">
                    <svg className="w-14 h-14 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
              <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent mb-3 animate-gradient">
                Nova
              </h1>
              <p className="text-slate-400 text-sm max-w-xs mx-auto">
                Tu sistema integral de inventario, facturación electrónica y e-commerce
              </p>
            </div>

            {/* Login Card */}
            <div className="bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-slate-800/50 shadow-2xl p-8 relative overflow-hidden group">
              {/* Animated border gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative z-10">
                <h2 className="text-2xl font-semibold text-white mb-6 text-center">
                  Inicia sesión
                </h2>

                <form onSubmit={handleLogin} className="space-y-5">

                  {/* Email Input */}
                  <div className="space-y-2">
                    <label className="block text-slate-300 text-sm font-medium" htmlFor="correoUsuario">
                      Correo electrónico o usuario
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                      </div>
                      <input
                        id="correoUsuario"
                        type="text"
                        placeholder="ejemplo@correo.com"
                        value={correoUsuario}
                        onChange={(e) => setCorreoUsuario(e.target.value)}
                        required
                        disabled={loading}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label className="block text-slate-300 text-sm font-medium" htmlFor="password">
                      Contraseña
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Tu contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="w-full pl-12 pr-12 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Forgot Password Link */}
                  <div className="text-right">
                    <a
                      href="/recuperar"
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200 inline-flex items-center gap-1 group"
                    >
                      ¿Olvidaste tu contraseña?
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-200" />
                    </a>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group/btn ${
                      loading
                        ? 'bg-slate-700 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 hover:from-blue-500 hover:via-cyan-500 hover:to-purple-500 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
                    }`}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Iniciando sesión...
                        </>
                      ) : (
                        <>
                          Iniciar sesión
                          <ArrowRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform duration-200" />
                        </>
                      )}
                    </span>
                    {!loading && (
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-blue-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-slate-900/60 text-slate-500 backdrop-blur-xl">o continúa con</span>
                  </div>
                </div>

                {/* Social Login Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl text-white transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="font-medium">Google</span>
                  </button>

                  <button
                    onClick={handleAppleLogin}
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl text-white transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    <span className="font-medium">Apple</span>
                  </button>
                </div>

                {/* Register Link */}
                <div className="mt-6 text-center text-sm text-slate-400">
                  ¿No tienes cuenta?{' '}
                  <a href="https://dagi.co/registro/tienda" className="text-blue-400 hover:text-blue-300 transition-colors duration-200 font-medium">
                    Crea una aquí
                  </a>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-xs text-slate-500 space-y-2">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <a href="#" className="hover:text-slate-400 transition-colors duration-200">Política de Privacidad</a>
                <span className="text-slate-700">•</span>
                <a href="#" className="hover:text-slate-400 transition-colors duration-200">Términos de Uso</a>
                <span className="text-slate-700">•</span>
                <a href="#" className="hover:text-slate-400 transition-colors duration-200">Soporte</a>
              </div>
              <p>© 2026 Nova. Todos los derechos reservados.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes grid-move {
          0% { background-position: 0 0; }
          100% { background-position: 50px 50px; }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.2;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-10px) translateX(-10px);
            opacity: 0.3;
          }
          75% {
            transform: translateY(-30px) translateX(5px);
            opacity: 0.5;
          }
        }

        @keyframes float1 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes float2 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }

        @keyframes float3 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes orb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        @keyframes orb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-30px, 30px) scale(0.9); }
          66% { transform: translate(20px, -20px) scale(1.1); }
        }

        @keyframes orb3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
          50% { transform: translate(-50%, -50%) scale(1.2) rotate(180deg); }
        }

        @keyframes progress {
          0% { width: 0%; }
          100% { width: 75%; }
        }

        .animate-float1 { animation: float1 4s ease-in-out infinite; }
        .animate-float2 { animation: float2 5s ease-in-out infinite 0.5s; }
        .animate-float3 { animation: float3 4.5s ease-in-out infinite 1s; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
        .animate-glow { animation: glow 3s ease-in-out infinite; }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 5s ease infinite;
        }
        .animate-orb1 { animation: orb1 15s ease-in-out infinite; }
        .animate-orb2 { animation: orb2 18s ease-in-out infinite; }
        .animate-orb3 { animation: orb3 20s linear infinite; }
        .animate-progress { animation: progress 2s ease-out forwards; }
      `}</style>
    </div>
  );
}

export default Login;
