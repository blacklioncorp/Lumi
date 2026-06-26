'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Search,
  Lock,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  Loader2,
  Sparkles,
  CheckCircle2,
  Puzzle,
  Building2,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Users,
  GraduationCap
} from 'lucide-react';
import { toast } from 'sonner';

interface TenantWithStats {
  id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  plan: 'basic' | 'intermediate' | 'premium';
  active_modules: string[];
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  is_active: boolean;
  created_at: string;
  leads_count: number;
  students_count: number;
}

interface Stats {
  total_tenants: number;
  active_tenants: number;
  mrr: number;
  total_leads: number;
  total_students: number;
}

const moduleTiers = [
  { id: 'crm', name: 'CRM de Leads', desc: 'Captación e historial de prospectos', tier: 'basic' },
  { id: 'website', name: 'Landing Page', desc: 'Sitio web escolar público', tier: 'basic' },
  { id: 'whatsapp', name: 'WhatsApp API', desc: 'Alertas y notificaciones automatizadas', tier: 'basic' },
  { id: 'google_calendar', name: 'Google Calendar', desc: 'Agendamiento y sincronización de visitas', tier: 'basic' },
  { id: 'analytics', name: 'Dashboard Analytics', desc: 'Métricas básicas de rendimiento', tier: 'basic' },
  { id: 'social_media', name: 'Social Scheduler', desc: 'Publicación en FB, IG, TikTok', tier: 'intermediate' },
  { id: 'google_sso', name: 'Google SSO', desc: 'Inicio de sesión con cuentas Google', tier: 'intermediate' },
  { id: 'payments', name: 'Pagos en Línea', desc: 'Pasarelas Stripe y Mercado Pago', tier: 'premium' },
  { id: 'parent_portal', name: 'Portal de Padres', desc: 'Calificaciones, reportes y estados de cuenta', tier: 'premium' },
  { id: 'pwa', name: 'App Móvil PWA', desc: 'Acceso directo en dispositivos móviles', tier: 'premium' },
  { id: 'nfc_access', name: 'Control Acceso NFC', desc: 'Monitoreo de entradas y salidas de alumnos', tier: 'premium' },
  { id: 'safelunch', name: 'Cafetería SafeLunch', desc: 'Monedero digital de cafetería NFC', tier: 'premium' },
];

export default function SuperadminDashboardClient({
  initialTenants,
  initialStats,
}: {
  initialTenants: TenantWithStats[];
  initialStats: Stats;
}) {
  const [tenants, setTenants] = useState<TenantWithStats[]>(initialTenants);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [search, setSearch] = useState('');

  // Dialog state
  const [isNewSchoolOpen, setIsNewSchoolOpen] = useState(false);
  const [isModulesOpen, setIsModulesOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithStats | null>(null);

  // New School Wizard Form states
  const [step, setStep] = useState(1);
  const [schoolName, setSchoolName] = useState('');
  const [schoolSlug, setSchoolSlug] = useState('');
  const [pricingPlan, setPricingPlan] = useState<'basic' | 'intermediate' | 'premium'>('basic');
  const [primaryColor, setPrimaryColor] = useState('#1E40AF');
  const [secondaryColor, setSecondaryColor] = useState('#F59E0B');
  const [customDomain, setCustomDomain] = useState('');

  // Step 2 Form states
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminPhone, setAdminPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{
    landing: string;
    dashboard: string;
    email: string;
    password: string;
  } | null>(null);

  // Modules Dialog management states
  const [localModules, setLocalModules] = useState<string[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);

  // Copy helper state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Generate dynamic slug based on name
  const generateSlug = (name: string) => {
    const slugified = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/\s+/g, '-') // spaces to dashes
      .replace(/[^a-z0-9-]/g, '') // remove specials
      .replace(/-+/g, '-'); // trim consecutive dashes
    setSchoolSlug(slugified);
  };

  const handleSchoolNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setSchoolName(name);
    generateSlug(name);
  };

  // Generate dynamic temporal password
  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAdminPassword(pass);
  };

  // Open New School modal
  const openNewSchoolWizard = () => {
    setStep(1);
    setSchoolName('');
    setSchoolSlug('');
    setPricingPlan('basic');
    setPrimaryColor('#1E40AF');
    setSecondaryColor('#F59E0B');
    setCustomDomain('');
    setAdminName('');
    setAdminEmail('');
    setAdminPhone('');
    setSuccessData(null);
    generatePassword();
    setIsNewSchoolOpen(true);
  };

  // Stepper submit triggers POST
  const handleSubmitNewSchool = async () => {
    if (!schoolName || !schoolSlug || !adminName || !adminEmail || !adminPassword) {
      toast.error('Por favor, completa todos los campos obligatorios.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/superadmin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant: {
            name: schoolName,
            slug: schoolSlug,
            plan: pricingPlan,
            primary_color: primaryColor,
            secondary_color: secondaryColor,
            custom_domain: customDomain || null,
          },
          admin: {
            full_name: adminName,
            email: adminEmail,
            password: adminPassword,
            phone: adminPhone || null,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear el colegio');
      }

      setSuccessData({
        landing: result.urls.landing,
        dashboard: result.urls.dashboard,
        email: adminEmail,
        password: adminPassword,
      });

      toast.success('¡Colegio y administrador creados con éxito!');
      // Reload tenants & stats
      fetchTenantsAndStats();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'No se pudo crear el colegio.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch updated records
  const fetchTenantsAndStats = async () => {
    try {
      const tenantsRes = await fetch('/api/superadmin/tenants');
      const statsRes = await fetch('/api/superadmin/stats');
      
      if (tenantsRes.ok) {
        const tData = await tenantsRes.json();
        setTenants(tData.tenants);
      }
      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData);
      }
    } catch (err) {
      console.error('Error reloading lists:', err);
    }
  };

  // Modules Dialog controls
  const openModulesManager = (tenant: TenantWithStats) => {
    setSelectedTenant(tenant);
    setLocalModules(tenant.active_modules || []);
    setIsModulesOpen(true);
  };

  const handleModuleToggle = (moduleId: string) => {
    setLocalModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleSaveModules = async () => {
    if (!selectedTenant) return;
    setModulesLoading(true);

    try {
      const response = await fetch(`/api/superadmin/tenants/${selectedTenant.id}/modules`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active_modules: localModules }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar módulos');
      }

      toast.success('Módulos actualizados exitosamente.');
      setIsModulesOpen(false);
      fetchTenantsAndStats();
    } catch (err) {
      console.error(err);
      toast.error('No se pudo guardar la configuración de módulos.');
    } finally {
      setModulesLoading(false);
    }
  };

  // Check module tier locking rules
  const isModuleLocked = (moduleTier: string) => {
    if (!selectedTenant) return true;
    const plan = selectedTenant.plan;
    if (moduleTier === 'premium' && plan !== 'premium') return true;
    if (moduleTier === 'intermediate' && plan === 'basic') return true;
    return false;
  };

  // Copy Clipboard Helper
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Client search filter
  const filteredTenants = useMemo(() => {
    return tenants.filter(
      (t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.slug.toLowerCase().includes(search.toLowerCase()) ||
        (t.custom_domain && t.custom_domain.toLowerCase().includes(search.toLowerCase()))
    );
  }, [tenants, search]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome & Stats Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Resumen de la Red Lumis</h2>
          <p className="text-sm text-slate-500 mt-1">Métricas de facturación, prospectos e inscripciones globales.</p>
        </div>
        <Button 
          onClick={openNewSchoolWizard}
          className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm flex items-center gap-2"
        >
          <Building2 className="h-4.5 w-4.5" />
          <span>Nuevo Colegio</span>
        </Button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
        {/* Total Tenants */}
        <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Colegios Activos</span>
            <Building2 className="h-5 w-5" />
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl.5 font-extrabold text-slate-900">{stats.active_tenants}</span>
              <span className="text-xs text-slate-400 font-medium">de {stats.total_tenants}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">✓ Instancias de colegio en vivo</p>
          </div>
        </div>

        {/* Estimated MRR */}
        <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">MRR Estimado</span>
            <DollarSign className="h-5 w-5" />
          </div>
          <div className="mt-4">
            <span className="text-2xl.5 font-extrabold text-slate-900">
              ${stats.mrr.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-slate-500 font-bold ml-1">MXN</span>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Suma por planes de cobro
            </p>
          </div>
        </div>

        {/* Total Leads Network */}
        <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Prospectos Red</span>
            <Users className="h-5 w-5" />
          </div>
          <div className="mt-4">
            <span className="text-2xl.5 font-extrabold text-slate-900">{stats.total_leads}</span>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Registros captados en landing pages</p>
          </div>
        </div>

        {/* Total Students Network */}
        <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Alumnos Activos</span>
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="mt-4">
            <span className="text-2xl.5 font-extrabold text-slate-900">{stats.total_students}</span>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Matrícula escolar con NFC activo</p>
          </div>
        </div>
      </div>

      {/* Schools Section Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Header Filter */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">Red de Colegios Inscritos</h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <Input
              placeholder="Buscar colegio, slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9.5 rounded-xl border-slate-200 bg-slate-50/30"
            />
          </div>
        </div>

        {/* Table Grid */}
        {filteredTenants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 font-semibold text-slate-500">
                  <th className="p-4 pl-6">Colegio</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Módulos Activos</th>
                  <th className="p-4 text-center">Leads</th>
                  <th className="p-4 text-right pr-6">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredTenants.map((t) => {
                  const initials = t.name.substring(0, 2).toUpperCase();
                  
                  // Plan Badges styling
                  let planColor = 'bg-slate-50 text-slate-600 border-slate-200';
                  if (t.plan === 'intermediate') planColor = 'bg-blue-50 text-blue-700 border-blue-200';
                  if (t.plan === 'premium') planColor = 'bg-purple-50 text-purple-700 border-purple-200';

                  // Module Chips details
                  const maxVisible = 3;
                  const modules = t.active_modules || [];
                  const visibleModules = modules.slice(0, maxVisible);
                  const moreCount = modules.length - maxVisible;

                  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lumi-delta-sooty.vercel.app';
                  const landingUrl = t.custom_domain 
                    ? `https://${t.custom_domain}` 
                    : `${appUrl}/${t.slug}`;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                      {/* Logo & Slug */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-xs shrink-0"
                            style={{ backgroundColor: t.primary_color || '#1E40AF' }}
                          >
                            {initials}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-slate-900 truncate">{t.name}</span>
                            <span className="text-xs text-slate-400 truncate">/{t.slug}</span>
                          </div>
                        </div>
                      </td>

                      {/* Pricing Tier */}
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold border capitalize ${planColor}`}>
                          {t.plan}
                        </span>
                      </td>

                      {/* Status Dot */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${t.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className="text-xs font-semibold text-slate-700">
                            {t.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </td>

                      {/* Active modules preview */}
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 items-center">
                          {visibleModules.map((mod) => (
                            <span key={mod} className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md capitalize">
                              {mod.replace('_', ' ')}
                            </span>
                          ))}
                          {moreCount > 0 && (
                            <span className="text-[10px] font-bold text-slate-400 px-1">
                              +{moreCount}
                            </span>
                          )}
                          {modules.length === 0 && (
                            <span className="text-xs text-slate-400 italic">Ninguno</span>
                          )}
                        </div>
                      </td>

                      {/* Leads Count */}
                      <td className="p-4 text-center font-semibold text-slate-800">
                        {t.leads_count}
                      </td>

                      {/* Row Actions */}
                      <td className="p-4 text-right pr-6 space-x-1.5 shrink-0">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => openModulesManager(t)}
                          className="rounded-lg h-7.5 px-2.5 flex items-center gap-1"
                        >
                          <Puzzle className="h-3.5 w-3.5" />
                          <span>Módulos</span>
                        </Button>
                        <a
                          href={landingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 h-7.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium px-2.5 rounded-lg text-xs transition-colors shadow-2xs"
                        >
                          <span>Visitar</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center">
            <p className="text-slate-500 font-medium">No se encontraron colegios registrados o que coincidan con la búsqueda.</p>
          </div>
        )}
      </div>

      {/* MODAL: NUEVO COLEGIO WIZARD (2 pasos + Exito) */}
      <Dialog
        open={isNewSchoolOpen}
        onOpenChange={(open) => {
          if (!open && !loading) setIsNewSchoolOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              <span>Registrar Nuevo Colegio</span>
            </DialogTitle>
            <DialogDescription>
              Aprovisionamiento automático de colegios y cuentas administrativas.
            </DialogDescription>
          </DialogHeader>

          {/* Success screen within Dialog */}
          {successData ? (
            <div className="space-y-6 py-6 text-center animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                <CheckCircle2 className="h-10 w-10 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">¡Colegio creado exitosamente!</h3>
                <p className="text-sm text-slate-500 mt-1">La instancia del colegio y el acceso del director se han provisionado.</p>
              </div>

              {/* Copy Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-sm mt-4">
                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl relative">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Sitio Público (Landing)</span>
                  <span className="font-semibold text-slate-800 break-all block mt-1">{successData.landing}</span>
                  <button
                    onClick={() => copyToClipboard(successData.landing, 'landing')}
                    className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {copiedField === 'landing' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl relative">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Panel Administrativo</span>
                  <span className="font-semibold text-slate-800 break-all block mt-1">{successData.dashboard}</span>
                  <button
                    onClick={() => copyToClipboard(successData.dashboard, 'dashboard')}
                    className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {copiedField === 'dashboard' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl relative">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Email Director</span>
                  <span className="font-semibold text-slate-800 break-all block mt-1">{successData.email}</span>
                  <button
                    onClick={() => copyToClipboard(successData.email, 'email')}
                    className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {copiedField === 'email' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl relative">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Contraseña Temporal</span>
                  <span className="font-mono font-semibold text-slate-800 block mt-1">{successData.password}</span>
                  <button
                    onClick={() => copyToClipboard(successData.password, 'password')}
                    className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {copiedField === 'password' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 justify-center mt-6">
                <a
                  href={successData.landing}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 flex items-center gap-1.5 shadow-sm"
                >
                  <span>Ver landing</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
                <DialogClose render={<Button variant="outline" onClick={() => setIsNewSchoolOpen(false)} />}>
                  Cerrar
                </DialogClose>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-2">
              {/* Stepper indicators */}
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
                <span className={`px-2 py-1 rounded-md ${step === 1 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                  1. Configuración de Colegio
                </span>
                <ArrowRight className="h-3 w-3" />
                <span className={`px-2 py-1 rounded-md ${step === 2 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                  2. Administrador Principal
                </span>
              </div>

              {step === 1 ? (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Step 1 Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="schoolName" className="font-semibold text-slate-700">Nombre del Colegio *</Label>
                      <Input
                        id="schoolName"
                        value={schoolName}
                        onChange={handleSchoolNameChange}
                        placeholder="Colegio Quetzal de México"
                        className="mt-1 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="schoolSlug" className="font-semibold text-slate-700">Slug (ID URL) *</Label>
                      <Input
                        id="schoolSlug"
                        value={schoolSlug}
                        onChange={(e) => setSchoolSlug(e.target.value)}
                        placeholder="colegio-quetzal"
                        className="mt-1 rounded-xl"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Preview: <strong className="text-slate-600">{(process.env.NEXT_PUBLIC_APP_URL || 'https://lumi-delta-sooty.vercel.app').replace(/^https?:\/\//i, '')}/{schoolSlug || 'slug'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Plan Cards */}
                  <div>
                    <Label className="font-semibold text-slate-700 block mb-2">Selecciona un Plan de Facturación *</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Basic */}
                      <div
                        onClick={() => setPricingPlan('basic')}
                        className={`border rounded-xl p-4 cursor-pointer transition-all ${
                          pricingPlan === 'basic'
                            ? 'border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-600 shadow-2xs'
                            : 'border-slate-200 bg-card hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm text-slate-900">Basic</span>
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">$800/m</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">CRM leads, landing page, alertas de WhatsApp, calendario tours y analytics.</p>
                      </div>

                      {/* Intermediate */}
                      <div
                        onClick={() => setPricingPlan('intermediate')}
                        className={`border rounded-xl p-4 cursor-pointer transition-all ${
                          pricingPlan === 'intermediate'
                            ? 'border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-600 shadow-2xs'
                            : 'border-slate-200 bg-card hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm text-slate-900">Intermediate</span>
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">$2,500/m</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">Básicos + scheduler de redes sociales y autenticación corporativa Google SSO.</p>
                      </div>

                      {/* Premium */}
                      <div
                        onClick={() => setPricingPlan('premium')}
                        className={`border rounded-xl p-4 cursor-pointer transition-all ${
                          pricingPlan === 'premium'
                            ? 'border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-600 shadow-2xs'
                            : 'border-slate-200 bg-card hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm text-slate-900">Premium</span>
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">$6,000/m</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">Intermedio + pagos en línea, portal de padres, PWA móvil, control NFC y SafeLunch.</p>
                      </div>
                    </div>
                  </div>

                  {/* Colors Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-semibold text-slate-700">Color Primario de Marca</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-10 h-10 p-0.5 rounded-lg border border-slate-200 shrink-0 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="rounded-xl font-mono text-sm uppercase"
                        />
                        <div className="w-8 h-8 rounded-lg shrink-0 border border-slate-200 shadow-2xs" style={{ backgroundColor: primaryColor }} />
                      </div>
                    </div>
                    <div>
                      <Label className="font-semibold text-slate-700">Color Secundario de Marca</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="color"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="w-10 h-10 p-0.5 rounded-lg border border-slate-200 shrink-0 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="rounded-xl font-mono text-sm uppercase"
                        />
                        <div className="w-8 h-8 rounded-lg shrink-0 border border-slate-200 shadow-2xs" style={{ backgroundColor: secondaryColor }} />
                      </div>
                    </div>
                  </div>

                  {/* Custom Domain (Optional) */}
                  <div>
                    <Label htmlFor="customDomain" className="font-semibold text-slate-700">Dominio Personalizado (Opcional)</Label>
                    <Input
                      id="customDomain"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder="colegioquetzal.edu.mx"
                      className="mt-1 rounded-xl"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      * El colegio debe configurar sus registros DNS apuntando a la infraestructura de Vercel.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Step 2 Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="adminName" className="font-semibold text-slate-700">Nombre Completo del Director *</Label>
                      <Input
                        id="adminName"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="Lic. Roberto Juárez"
                        className="mt-1 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="adminPhone" className="font-semibold text-slate-700">Teléfono Móvil (Opcional)</Label>
                      <Input
                        id="adminPhone"
                        value={adminPhone}
                        onChange={(e) => setAdminPhone(e.target.value)}
                        placeholder="5512345678"
                        className="mt-1 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="adminEmail" className="font-semibold text-slate-700">Email Institucional del Director *</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="director@colegio.edu.mx"
                        className="mt-1 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="adminPassword" className="font-semibold text-slate-700">Contraseña Temporal *</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="relative flex-1">
                          <Input
                            id="adminPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            className="rounded-xl pr-9.5 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generatePassword}
                          className="rounded-xl px-3 border-slate-200"
                          title="Regenerar contraseña"
                        >
                          <RefreshCw className="h-4 w-4 text-slate-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="border-t border-slate-100 pt-4 mt-6">
                {step === 1 ? (
                  <div className="flex justify-end gap-2 w-full">
                    <DialogClose render={<Button variant="outline" onClick={() => setIsNewSchoolOpen(false)} />}>
                      Cancelar
                    </DialogClose>
                    <Button
                      type="button"
                      disabled={!schoolName || !schoolSlug}
                      onClick={() => setStep(2)}
                      className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium flex items-center gap-1"
                    >
                      <span>Siguiente</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-between w-full">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="rounded-xl border-slate-200 flex items-center gap-1"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Atrás</span>
                    </Button>
                    <div className="flex gap-2">
                      <DialogClose render={<Button variant="outline" onClick={() => setIsNewSchoolOpen(false)} />}>
                        Cancelar
                      </DialogClose>
                      <Button
                        type="button"
                        disabled={loading || !adminName || !adminEmail || !adminPassword}
                        onClick={handleSubmitNewSchool}
                        className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5 shadow-sm"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Creando colegio...</span>
                          </>
                        ) : (
                          <span>Crear colegio</span>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: GESTIÓN DE MÓDULOS */}
      <Dialog
        open={isModulesOpen}
        onOpenChange={(open) => {
          if (!open && !modulesLoading) setIsModulesOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Puzzle className="h-5 w-5 text-indigo-500" />
              <span>Gestión de Módulos</span>
            </DialogTitle>
            <DialogDescription>
              Habilita o deshabilita módulos funcionales en el colegio.
            </DialogDescription>
          </DialogHeader>

          {selectedTenant && (
            <div className="space-y-6 py-2">
              {/* College and Plan Info header */}
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">{selectedTenant.name}</h4>
                  <p className="text-xs text-slate-500">Plan de Cobro: <span className="uppercase font-bold text-indigo-600">{selectedTenant.plan}</span></p>
                </div>
                {selectedTenant.plan !== 'premium' && (
                  <Badge variant="secondary" className="px-2 py-1 text-[10px] font-bold text-slate-600">
                    Cambiar plan requiere actualización
                  </Badge>
                )}
              </div>

              {/* Modules Grouped Categories */}
              <div className="space-y-5">
                {/* Basic Group */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Módulos Plan Basic</span>
                    <span className="text-[10px] font-semibold text-slate-400">Todos disponibles</span>
                  </div>
                  <div className="space-y-3">
                    {moduleTiers.filter(m => m.tier === 'basic').map((mod) => (
                      <div key={mod.id} className="flex items-center justify-between py-1 border-b border-slate-50">
                        <div>
                          <Label htmlFor={`mod-${mod.id}`} className="font-bold text-slate-800 cursor-pointer block">{mod.name}</Label>
                          <span className="text-xs text-slate-400 block mt-0.5 leading-tight">{mod.desc}</span>
                        </div>
                        <Switch
                          id={`mod-${mod.id}`}
                          checked={localModules.includes(mod.id)}
                          onCheckedChange={() => handleModuleToggle(mod.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Intermediate Group */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Módulos Plan Intermediate</span>
                    {selectedTenant.plan === 'basic' && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">Bloqueados</span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {moduleTiers.filter(m => m.tier === 'intermediate').map((mod) => {
                      const locked = isModuleLocked(mod.tier);
                      return (
                        <div key={mod.id} className="flex items-center justify-between py-1 border-b border-slate-50">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Label htmlFor={`mod-${mod.id}`} className={`font-bold ${locked ? 'text-slate-400' : 'text-slate-800 cursor-pointer'}`}>{mod.name}</Label>
                              {locked && <span title="Requiere plan Intermediate"><Lock className="h-3 w-3 text-slate-400" /></span>}
                            </div>
                            <span className="text-xs text-slate-400 block mt-0.5 leading-tight">{mod.desc}</span>
                          </div>
                          <Switch
                            id={`mod-${mod.id}`}
                            checked={localModules.includes(mod.id)}
                            onCheckedChange={() => handleModuleToggle(mod.id)}
                            disabled={locked}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Premium Group */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Módulos Plan Premium</span>
                    {selectedTenant.plan !== 'premium' && (
                      <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">Bloqueados</span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {moduleTiers.filter(m => m.tier === 'premium').map((mod) => {
                      const locked = isModuleLocked(mod.tier);
                      return (
                        <div key={mod.id} className="flex items-center justify-between py-1 border-b border-slate-50">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Label htmlFor={`mod-${mod.id}`} className={`font-bold ${locked ? 'text-slate-400' : 'text-slate-800 cursor-pointer'}`}>{mod.name}</Label>
                              {locked && <span title="Requiere plan Premium"><Lock className="h-3 w-3 text-slate-400" /></span>}
                            </div>
                            <span className="text-xs text-slate-400 block mt-0.5 leading-tight">{mod.desc}</span>
                          </div>
                          <Switch
                            id={`mod-${mod.id}`}
                            checked={localModules.includes(mod.id)}
                            onCheckedChange={() => handleModuleToggle(mod.id)}
                            disabled={locked}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-slate-100 pt-4 mt-6">
            <DialogClose render={<Button variant="outline" disabled={modulesLoading} onClick={() => setIsModulesOpen(false)} />}>
              Cancelar
            </DialogClose>
            <Button
              onClick={handleSaveModules}
              disabled={modulesLoading}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium flex items-center gap-1.5"
            >
              {modulesLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
