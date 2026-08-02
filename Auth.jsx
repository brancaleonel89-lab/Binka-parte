import { useState, useEffect } from "react";
import { Building2, AlertCircle, LogOut, Loader2 } from "lucide-react";

export function useAuth() {
  const [authState, setAuthState] = useState(null);
  useEffect(() => {
    window.supabaseClient.auth.getSession().then(({ data }) => {
      if (data.session) {
        const role = data.session.user.user_metadata?.role || "operario";
        setAuthState({ user: data.session.user, role });
      } else setAuthState(false);
    });
    const { data: { subscription } } = window.supabaseClient.auth.onAuthStateChange((_e, session) => {
      if (session) {
        const role = session.user.user_metadata?.role || "operario";
        setAuthState({ user: session.user, role });
      } else setAuthState(false);
    });
    return () => subscription.unsubscribe();
  }, []);
  return authState;
}

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
    if (error) setError("Email o contraseña incorrectos.");
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-8 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-cyan-400">
            <Building2 size={20} />
          </div>
          <div>
            <p className="font-extrabold text-blue-800 text-lg tracking-wide">BiNKA</p>
            <p className="text-xs text-slate-400">Parte Diario</p>
          </div>
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-6">Iniciar sesión</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-rose-600 text-sm flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
              <AlertCircle size={14} /> {error}
            </p>
          )}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" required
              className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
              className="w-full border border-slate-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2.5 rounded-md text-sm disabled:opacity-60">
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function SignOutButton({ email }) {
  return (
    <div className="px-5 py-4 border-t border-slate-800 space-y-2">
      <p className="text-[11px] text-slate-400 truncate">{email}</p>
      <button onClick={() => window.supabaseClient.auth.signOut()}
        className="flex items-center gap-2 text-xs text-slate-400 hover:text-rose-400 transition-colors">
        <LogOut size={14} /> Cerrar sesión
      </button>
    </div>
  );
}

export function AuthGate({ children }) {
  const authState = useAuth();
  if (authState === null) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-slate-400" />
    </div>
  );
  if (authState === false) return <Login />;
  const isAdmin = authState.role === "jefe";
  return children({ isAdmin, user: authState.user });
}
