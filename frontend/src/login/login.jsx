import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Mail, Lock, Eye, EyeOff, Package, BarChart3, ShoppingCart, FileText, TrendingUp, Zap, Shield, Users } from 'lucide-react';
const API_URL = import.meta.env.VITE_API_URL;

function Login() {
  const [correoUsuario, setCorreoUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/validar/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          usuario: correoUsuario,
          password: password
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-orb1"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-orb2"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-3xl animate-orb3"></div>
      </div>

      {/* Animated sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[5%] left-[8%] w-1 h-1 bg-blue-400 rounded-full animate-sparkle1"></div>
        <div className="absolute top-[12%] left-[22%] w-1 h-1 bg-cyan-400 rounded-full animate-sparkle2"></div>
        <div className="absolute top-[8%] right-[15%] w-1 h-1 bg-purple-400 rounded-full animate-sparkle3"></div>
        <div className="absolute top-[18%] right-[8%] w-1 h-1 bg-blue-300 rounded-full animate-sparkle4"></div>
        <div className="absolute top-[25%] left-[5%] w-1 h-1 bg-cyan-300 rounded-full animate-sparkle5"></div>
        <div className="absolute top-[22%] right-[25%] w-1 h-1 bg-purple-300 rounded-full animate-sparkle6"></div>
        <div className="absolute top-[35%] left-[12%] w-1 h-1 bg-blue-400 rounded-full animate-sparkle7"></div>
        <div className="absolute top-[38%] right-[18%] w-1 h-1 bg-cyan-400 rounded-full animate-sparkle8"></div>
        <div className="absolute top-[45%] left-[7%] w-1 h-1 bg-purple-400 rounded-full animate-sparkle1"></div>
        <div className="absolute top-[48%] right-[12%] w-1 h-1 bg-blue-300 rounded-full animate-sparkle2"></div>
        <div className="absolute top-[55%] left-[20%] w-1 h-1 bg-cyan-300 rounded-full animate-sparkle3"></div>
        <div className="absolute top-[58%] right-[6%] w-1 h-1 bg-purple-300 rounded-full animate-sparkle4"></div>
        <div className="absolute top-[65%] left-[10%] w-1 h-1 bg-blue-400 rounded-full animate-sparkle5"></div>
        <div className="absolute top-[68%] right-[22%] w-1 h-1 bg-cyan-400 rounded-full animate-sparkle6"></div>
        <div className="absolute top-[75%] left-[15%] w-1 h-1 bg-purple-400 rounded-full animate-sparkle7"></div>
        <div className="absolute top-[78%] right-[10%] w-1 h-1 bg-blue-300 rounded-full animate-sparkle8"></div>
        <div className="absolute top-[85%] left-[8%] w-1 h-1 bg-cyan-300 rounded-full animate-sparkle1"></div>
        <div className="absolute top-[88%] right-[18%] w-1 h-1 bg-purple-300 rounded-full animate-sparkle2"></div>
        <div className="absolute top-[95%] left-[12%] w-1 h-1 bg-blue-400 rounded-full animate-sparkle3"></div>
        <div className="absolute top-[15%] left-[35%] w-2 h-2 bg-blue-500 rounded-full animate-sparkle9"></div>
        <div className="absolute top-[28%] right-[35%] w-2 h-2 bg-cyan-500 rounded-full animate-sparkle10"></div>
        <div className="absolute top-[42%] left-[40%] w-2 h-2 bg-purple-500 rounded-full animate-sparkle11"></div>
        <div className="absolute top-[62%] right-[38%] w-2 h-2 bg-blue-400 rounded-full animate-sparkle12"></div>
        <div className="absolute top-[72%] left-[45%] w-2 h-2 bg-cyan-400 rounded-full animate-sparkle13"></div>
        <div className="absolute top-[82%] right-[42%] w-2 h-2 bg-purple-400 rounded-full animate-sparkle14"></div>
        <div className="absolute top-[10%] left-[60%] w-3 h-3 bg-blue-500 rounded-full animate-sparkle15"></div>
        <div className="absolute top-[30%] right-[55%] w-3 h-3 bg-cyan-500 rounded-full animate-sparkle16"></div>
        <div className="absolute top-[50%] left-[55%] w-3 h-3 bg-purple-500 rounded-full animate-sparkle17"></div>
        <div className="absolute top-[70%] right-[60%] w-3 h-3 bg-blue-400 rounded-full animate-sparkle18"></div>
        <div className="absolute top-[90%] left-[58%] w-3 h-3 bg-cyan-400 rounded-full animate-sparkle19"></div>
        <div className="absolute top-[5%] left-[80%] w-1.5 h-1.5 bg-purple-300 rounded-full animate-sparkle20"></div>
        <div className="absolute top-[20%] left-[75%] w-1.5 h-1.5 bg-blue-300 rounded-full animate-sparkle21"></div>
        <div className="absolute top-[40%] right-[70%] w-1.5 h-1.5 bg-cyan-300 rounded-full animate-sparkle22"></div>
        <div className="absolute top-[60%] left-[72%] w-1.5 h-1.5 bg-purple-400 rounded-full animate-sparkle23"></div>
        <div className="absolute top-[80%] right-[75%] w-1.5 h-1.5 bg-blue-400 rounded-full animate-sparkle24"></div>
        <div className="absolute top-[33%] left-[48%] w-2 h-2 bg-cyan-500 rounded-full animate-sparkle25"></div>
        <div className="absolute top-[52%] right-[48%] w-2 h-2 bg-purple-500 rounded-full animate-sparkle26"></div>
        <div className="absolute top-[67%] left-[52%] w-2 h-2 bg-blue-500 rounded-full animate-sparkle27"></div>
      </div>

      {/* Floating glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-[20%] w-32 h-32 bg-blue-500/5 rounded-full blur-2xl animate-float1"></div>
        <div className="absolute top-[60%] right-[15%] w-40 h-40 bg-purple-500/5 rounded-full blur-2xl animate-float2"></div>
        <div className="absolute bottom-[20%] left-[30%] w-36 h-36 bg-cyan-500/5 rounded-full blur-2xl animate-float3"></div>
        <div className="absolute top-[35%] right-[30%] w-28 h-28 bg-blue-500/4 rounded-full blur-2xl animate-float4"></div>
        <div className="absolute bottom-[45%] left-[15%] w-32 h-32 bg-purple-500/4 rounded-full blur-2xl animate-float5"></div>
        <div className="absolute top-[70%] left-[65%] w-36 h-36 bg-cyan-500/4 rounded-full blur-2xl animate-float6"></div>
        <div className="absolute top-[25%] left-[75%] w-30 h-30 bg-blue-500/3 rounded-full blur-2xl animate-float7"></div>
        <div className="absolute bottom-[35%] right-[65%] w-34 h-34 bg-purple-500/3 rounded-full blur-2xl animate-float8"></div>
      </div>

      {/* Main content wrapper */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[1.3fr_1fr] gap-8 items-center">

        {/* Left side - Illustration and info */}
        <div className={`hidden lg:block transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>

          {/* Cards — sin efecto 3D */}
          <div className="relative mb-8 w-full flex justify-center">

            <div className="relative max-w-lg w-full mx-auto" style={{ minHeight: '420px' }}>

              {/* Card Inventario - Top Left */}
              <div className="absolute top-0 left-0 w-[52%] bg-gradient-to-br from-blue-600/30 to-blue-800/30 backdrop-blur-xl rounded-xl border-2 border-blue-500/50 p-5 hover:scale-105 transition-all duration-300 shadow-xl shadow-blue-500/40 animate-card-float" style={{ minHeight: '160px' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-blue-500/20 rounded-md shrink-0">
                        <Package className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[11px] text-blue-300 leading-none">Inventario</p>
                        <p className="text-base font-bold text-white leading-tight">1,284</p>
                      </div>
                    </div>
                    <div className="w-7 h-7 bg-blue-500/30 rounded-md flex items-center justify-center border border-blue-400/40 shrink-0 animate-pulse">
                      <ShoppingCart className="w-3.5 h-3.5 text-blue-300" />
                    </div>
                  </div>
                  <div className="flex gap-0.5 items-end h-7">
                    {[40, 65, 45, 80, 55, 70, 60].map((h, i) => (
                      <div key={i} className="flex-1 bg-blue-500/40 rounded-t" style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
                </div>

              {/* Card Ventas - Top Right */}
              <div className="absolute top-16 right-0 w-[52%] bg-gradient-to-br from-emerald-600/30 to-emerald-800/30 backdrop-blur-xl rounded-xl border-2 border-emerald-500/50 p-5 hover:scale-105 transition-all duration-300 shadow-xl shadow-emerald-500/40 animate-card-float-delay" style={{ minHeight: '160px' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-500/20 rounded-md shrink-0">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-[11px] text-emerald-300 leading-none">Ventas</p>
                        <p className="text-base font-bold text-white leading-tight">$12,450</p>
                      </div>
                    </div>
                    <div className="w-7 h-7 bg-emerald-500/30 rounded-md flex items-center justify-center border border-emerald-400/40 shrink-0 animate-pulse">
                      <BarChart3 className="w-3.5 h-3.5 text-emerald-300" />
                    </div>
                  </div>
                  <svg className="w-full h-7" viewBox="0 0 100 40">
                    <path d="M0,35 Q10,30 20,32 T40,25 T60,28 T80,15 T100,20" fill="none" stroke="#6ee7b7" strokeWidth="2" />
                    <path d="M0,35 Q10,30 20,32 T40,25 T60,28 T80,15 T100,20 V40 H0 Z" fill="rgba(16,185,129,0.15)" />
                  </svg>
                </div>

              {/* Card Facturas - Bottom Right */}
              <div className="absolute bottom-0 right-4 w-[55%] bg-gradient-to-br from-purple-600/30 to-purple-800/30 backdrop-blur-xl rounded-xl border-2 border-purple-500/50 p-5 hover:scale-[1.02] transition-all duration-300 shadow-xl shadow-purple-500/40 animate-card-float-delay-2" style={{ minHeight: '160px' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-purple-500/20 rounded-md shrink-0">
                      <FileText className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-[11px] text-purple-300 leading-none">Facturas</p>
                      <p className="text-base font-bold text-white leading-tight">48 Pendientes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-auto mr-2">
                    <div className="text-center">
                      <p className="text-base font-bold text-white">124</p>
                      <p className="text-[11px] text-slate-500">Emitidas</p>
                    </div>
                    <div className="w-px h-6 bg-slate-700"></div>
                    <div className="text-center">
                      <p className="text-base font-bold text-white">48</p>
                      <p className="text-[11px] text-slate-500">Pendientes</p>
                    </div>
                  </div>
                  <div className="w-7 h-7 bg-purple-500/30 rounded-md flex items-center justify-center border border-purple-400/40 shrink-0 animate-pulse">
                    <Zap className="w-3.5 h-3.5 text-purple-300" />
                  </div>
                </div>
                <div className="h-2 bg-purple-500/20 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-purple-300 rounded-full animate-progress" style={{ width: '75%' }}></div>
                </div>
                <p className="text-[11px] text-purple-300">Procesando... 75%</p>
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
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200"
                    >
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group/btn ${
                      loading
                        ? 'bg-slate-700 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 hover:from-blue-500 hover:via-cyan-500 hover:to-purple-500 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
                    }`}
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Iniciando sesión...
                        </>
                      ) : (
                        'Iniciar sesión'
                      )}
                    </span>
                    {!loading && (
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-blue-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                    )}
                  </button>
                </form>
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
        @keyframes sparkle1 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1) translate(10px, -10px); }
        }
        @keyframes sparkle2 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1) translate(-15px, 5px); }
        }
        @keyframes sparkle3 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1) translate(8px, 12px); }
        }
        @keyframes sparkle4 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1) translate(-12px, -8px); }
        }
        @keyframes sparkle5 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1) translate(15px, 10px); }
        }
        @keyframes sparkle6 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1) translate(-10px, -15px); }
        }
        @keyframes sparkle7 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1) translate(5px, 8px); }
        }
        @keyframes sparkle8 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1) translate(-8px, -5px); }
        }
        @keyframes sparkle9 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.2) translate(12px, -8px); }
        }
        @keyframes sparkle10 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.2) translate(-10px, 10px); }
        }
        @keyframes sparkle11 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.2) translate(8px, -12px); }
        }
        @keyframes sparkle12 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.2) translate(-12px, 8px); }
        }
        @keyframes sparkle13 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.2) translate(10px, 12px); }
        }
        @keyframes sparkle14 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.2) translate(-8px, -10px); }
        }
        @keyframes sparkle15 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.5) translate(15px, -15px); }
        }
        @keyframes sparkle16 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.5) translate(-18px, 12px); }
        }
        @keyframes sparkle17 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.5) translate(12px, 18px); }
        }
        @keyframes sparkle18 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.5) translate(-15px, -12px); }
        }
        @keyframes sparkle19 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.5) translate(18px, 15px); }
        }
        @keyframes sparkle20 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.1) translate(-8px, 8px); }
        }
        @keyframes sparkle21 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.1) translate(10px, -6px); }
        }
        @keyframes sparkle22 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.1) translate(-7px, 10px); }
        }
        @keyframes sparkle23 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.1) translate(9px, -9px); }
        }
        @keyframes sparkle24 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.1) translate(-11px, 7px); }
        }
        @keyframes sparkle25 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.3) translate(6px, -8px); }
        }
        @keyframes sparkle26 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.3) translate(-7px, 9px); }
        }
        @keyframes sparkle27 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.3) translate(8px, -7px); }
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          50% { transform: translate(30px, -40px) scale(1.2); opacity: 0.6; }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          50% { transform: translate(-40px, 30px) scale(1.3); opacity: 0.6; }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          50% { transform: translate(20px, 40px) scale(1.1); opacity: 0.6; }
        }
        @keyframes float4 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.25; }
          50% { transform: translate(-25px, -35px) scale(1.15); opacity: 0.5; }
        }
        @keyframes float5 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.25; }
          50% { transform: translate(30px, 25px) scale(1.1); opacity: 0.55; }
        }
        @keyframes float6 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.25; }
          50% { transform: translate(-20px, 30px) scale(1.2); opacity: 0.5; }
        }
        @keyframes float7 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
          50% { transform: translate(25px, -25px) scale(1.15); opacity: 0.45; }
        }
        @keyframes float8 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
          50% { transform: translate(-30px, -20px) scale(1.1); opacity: 0.5; }
        }
        @keyframes card-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes card-float-delay {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes card-float-delay-2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }

        .animate-glow { animation: glow 3s ease-in-out infinite; }
        .animate-gradient { background-size: 200% 200%; animation: gradient 5s ease infinite; }
        .animate-orb1 { animation: orb1 15s ease-in-out infinite; }
        .animate-orb2 { animation: orb2 18s ease-in-out infinite; }
        .animate-orb3 { animation: orb3 20s linear infinite; }
        .animate-progress { animation: progress 2s ease-out forwards; }
        .animate-sparkle1 { animation: sparkle1 3s ease-in-out infinite; }
        .animate-sparkle2 { animation: sparkle2 4s ease-in-out infinite 0.5s; }
        .animate-sparkle3 { animation: sparkle3 3.5s ease-in-out infinite 1s; }
        .animate-sparkle4 { animation: sparkle4 4.5s ease-in-out infinite 1.5s; }
        .animate-sparkle5 { animation: sparkle5 3.2s ease-in-out infinite 2s; }
        .animate-sparkle6 { animation: sparkle6 3.8s ease-in-out infinite 0.8s; }
        .animate-sparkle7 { animation: sparkle7 4.2s ease-in-out infinite 1.2s; }
        .animate-sparkle8 { animation: sparkle8 3.6s ease-in-out infinite 1.8s; }
        .animate-sparkle9 { animation: sparkle9 2.8s ease-in-out infinite 0.3s; }
        .animate-sparkle10 { animation: sparkle10 3.1s ease-in-out infinite 0.7s; }
        .animate-sparkle11 { animation: sparkle11 2.9s ease-in-out infinite 1.1s; }
        .animate-sparkle12 { animation: sparkle12 3.3s ease-in-out infinite 0.4s; }
        .animate-sparkle13 { animation: sparkle13 2.7s ease-in-out infinite 1.5s; }
        .animate-sparkle14 { animation: sparkle14 3.0s ease-in-out infinite 0.9s; }
        .animate-sparkle15 { animation: sparkle15 3.5s ease-in-out infinite 0.2s; }
        .animate-sparkle16 { animation: sparkle16 3.2s ease-in-out infinite 1.3s; }
        .animate-sparkle17 { animation: sparkle17 3.7s ease-in-out infinite 0.6s; }
        .animate-sparkle18 { animation: sparkle18 3.4s ease-in-out infinite 1.0s; }
        .animate-sparkle19 { animation: sparkle19 3.6s ease-in-out infinite 1.4s; }
        .animate-sparkle20 { animation: sparkle20 2.5s ease-in-out infinite 0.5s; }
        .animate-sparkle21 { animation: sparkle21 2.6s ease-in-out infinite 1.1s; }
        .animate-sparkle22 { animation: sparkle22 2.4s ease-in-out infinite 0.8s; }
        .animate-sparkle23 { animation: sparkle23 2.7s ease-in-out infinite 1.2s; }
        .animate-sparkle24 { animation: sparkle24 2.5s ease-in-out infinite 0.4s; }
        .animate-sparkle25 { animation: sparkle25 3.0s ease-in-out infinite 0.9s; }
        .animate-sparkle26 { animation: sparkle26 2.8s ease-in-out infinite 1.3s; }
        .animate-sparkle27 { animation: sparkle27 3.1s ease-in-out infinite 0.7s; }
        .animate-float1 { animation: float1 8s ease-in-out infinite; }
        .animate-float2 { animation: float2 10s ease-in-out infinite; }
        .animate-float3 { animation: float3 9s ease-in-out infinite; }
        .animate-float4 { animation: float4 11s ease-in-out infinite; }
        .animate-float5 { animation: float5 9.5s ease-in-out infinite; }
        .animate-float6 { animation: float6 10.5s ease-in-out infinite; }
        .animate-float7 { animation: float7 8.5s ease-in-out infinite; }
        .animate-float8 { animation: float8 11.5s ease-in-out infinite; }
        .animate-card-float { animation: card-float 4s ease-in-out infinite; }
        .animate-card-float-delay { animation: card-float-delay 4.5s ease-in-out infinite 0.5s; }
        .animate-card-float-delay-2 { animation: card-float-delay-2 5s ease-in-out infinite 1s; }
      `}</style>
    </div>
  );
}

export default Login;