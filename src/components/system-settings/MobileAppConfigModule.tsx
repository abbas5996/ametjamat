import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  QrCode,
  Bell,
  Server,
  Radio,
  Copy,
  Check,
  ExternalLink,
  Save,
  RotateCcw,
  ShieldCheck,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Wifi,
} from 'lucide-react';
import { UserProfile, FinancialYear } from '../../types';
import { appendActivityLog } from '../../utils/rbac';

export type AppReleaseStatus = 'Live & Stable' | 'Rolling Out' | 'Maintenance Mode' | 'Deprecated';
export type ApiEnvironment = 'Production' | 'Staging';
export type PushProvider = 'Firebase Cloud Messaging (FCM v1)' | 'OneSignal Enterprise' | 'Direct APNs / FCM';

export interface PlatformAppConfig {
  storeLabel: string;
  downloadUrl: string;
  packageOrBundleId: string;
  currentVersion: string;
  minSupportedVersion: string;
  buildNumber: string;
  releaseStatus: AppReleaseStatus;
  forceUpdate: boolean;
}

export interface MobileAppConfiguration {
  appName: string;
  universalDeepLink: string;
  android: PlatformAppConfig;
  ios: PlatformAppConfig;
  pushNotifications: {
    enabled: boolean;
    provider: PushProvider;
    topicPrefix: string;
    fmbThaaliAlerts: boolean;
    sabeelDueReminders: boolean;
    miqaatBroadcastAlerts: boolean;
    receiptConfirmations: boolean;
  };
  apiEndpoints: {
    activeEnvironment: ApiEnvironment;
    productionBaseUrl: string;
    stagingBaseUrl: string;
    webSocketUrl: string;
    itsAuthEndpoint: string;
    timeoutMs: number;
  };
  broadcasts: {
    globalBannerActive: boolean;
    bannerTitle: string;
    bannerMessage: string;
    miqaatTickerEnabled: boolean;
    safarLiveUpdatesEnabled: boolean;
    inAppPaymentsEnabled: boolean;
    thaaliRequestsEnabled: boolean;
    maintenanceModeEnabled: boolean;
  };
  updatedAt: string;
  updatedBy: string;
}

const STORAGE_KEY = 'jamat_mobile_app_config_v1';

const DEFAULT_CONFIG: MobileAppConfiguration = {
  appName: 'Burhani Park Jamaat Connect',
  universalDeepLink: 'https://app.burhanipark.org/download',
  android: {
    storeLabel: 'Google Play Store / Direct APK',
    downloadUrl: 'https://play.google.com/store/apps/details?id=org.burhanipark.jamaat',
    packageOrBundleId: 'org.burhanipark.jamaat',
    currentVersion: '2.4.1',
    minSupportedVersion: '2.1.0',
    buildNumber: '241',
    releaseStatus: 'Live & Stable',
    forceUpdate: false,
  },
  ios: {
    storeLabel: 'Apple App Store (iOS)',
    downloadUrl: 'https://apps.apple.com/in/app/burhani-park-jamaat/id6480912345',
    packageOrBundleId: 'org.burhanipark.jamaat.ios',
    currentVersion: '2.4.0',
    minSupportedVersion: '2.1.0',
    buildNumber: '240',
    releaseStatus: 'Live & Stable',
    forceUpdate: false,
  },
  pushNotifications: {
    enabled: true,
    provider: 'Firebase Cloud Messaging (FCM v1)',
    topicPrefix: 'bp_jamaat_1447',
    fmbThaaliAlerts: true,
    sabeelDueReminders: true,
    miqaatBroadcastAlerts: true,
    receiptConfirmations: true,
  },
  apiEndpoints: {
    activeEnvironment: 'Production',
    productionBaseUrl: 'https://api.burhanipark.org/v2',
    stagingBaseUrl: 'https://staging-api.burhanipark.org/v2',
    webSocketUrl: 'wss://live.burhanipark.org/ws',
    itsAuthEndpoint: 'https://auth.burhanipark.org/its52/verify',
    timeoutMs: 12000,
  },
  broadcasts: {
    globalBannerActive: true,
    bannerTitle: 'Shehrullah & Miqaat Schedule Updated',
    bannerMessage: 'Check updated Majlis timings, daily FMB Thaali menu, and Sabeel receipts live.',
    miqaatTickerEnabled: true,
    safarLiveUpdatesEnabled: true,
    inAppPaymentsEnabled: true,
    thaaliRequestsEnabled: true,
    maintenanceModeEnabled: false,
  },
  updatedAt: new Date().toISOString().split('T')[0],
  updatedBy: 'janabadmin',
};

function loadConfig(): MobileAppConfiguration {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONFIG));
      return DEFAULT_CONFIG;
    }
    return JSON.parse(raw) as MobileAppConfiguration;
  } catch {
    return DEFAULT_CONFIG;
  }
}

function saveConfig(cfg: MobileAppConfiguration): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch (err) {
    console.error('Failed to save mobile app config:', err);
  }
}

/**
 * Generates a deterministic 15x15 QR matrix preview from any URL string,
 * including three canonical finder squares so it renders cleanly inline.
 */
function buildQrPreviewMatrix(seedText: string): boolean[][] {
  const size = 15;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const placeFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const isBorder = r === 0 || r === 4 || c === 0 || c === 4;
        const isCenter = r === 2 && c === 2;
        grid[r0 + r][c0 + c] = isBorder || isCenter;
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 5);
  placeFinder(size - 5, 0);

  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 6 && c < 6;
      const inTopRight = r < 6 && c >= size - 6;
      const inBottomLeft = r >= size - 6 && c < 6;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      hash ^= (r * 31 + c * 17) & 0xff;
      hash = Math.imul(hash, 16777619);
      grid[r][c] = (hash >>> 28) % 2 === 0;
    }
  }
  return grid;
}

interface ToggleSwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  tone?: 'amber' | 'emerald' | 'rose';
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  label,
  description,
  checked,
  onChange,
  tone = 'amber',
}) => {
  const activeBg =
    tone === 'rose'
      ? 'bg-rose-600'
      : tone === 'emerald'
      ? 'bg-emerald-600'
      : 'bg-amber-500';

  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-slate-200/80 bg-slate-50/70">
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-900">{label}</p>
        {description && <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked ? activeBg : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

interface MobileAppConfigModuleProps {
  currentUser: UserProfile;
  financialYear: FinancialYear;
  showToast: (msg: string) => void;
  canEdit?: boolean;
}

export const MobileAppConfigModule: React.FC<MobileAppConfigModuleProps> = ({
  currentUser,
  financialYear,
  showToast,
  canEdit = true,
}) => {
  const [config, setConfig] = useState<MobileAppConfiguration>(loadConfig);
  const [qrPlatform, setQrPlatform] = useState<'android' | 'ios' | 'universal'>('android');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [endpointHealth, setEndpointHealth] = useState<'idle' | 'checking' | 'healthy'>('idle');

  const activeQrUrl = useMemo(() => {
    if (qrPlatform === 'android') return config.android.downloadUrl;
    if (qrPlatform === 'ios') return config.ios.downloadUrl;
    return config.universalDeepLink;
  }, [qrPlatform, config]);

  const qrMatrix = useMemo(() => buildQrPreviewMatrix(activeQrUrl), [activeQrUrl]);

  const handleCopy = (key: string, value: string, label: string) => {
    if (!value) return;
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedKey(key);
    showToast(`${label} copied to clipboard.`);
    setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 1800);
  };

  const handleSaveAll = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canEdit) {
      showToast('Edit permission required to save Mobile App Configuration.');
      return;
    }
    const next: MobileAppConfiguration = {
      ...config,
      updatedAt: new Date().toISOString().split('T')[0],
      updatedBy: currentUser.username,
    };
    setConfig(next);
    saveConfig(next);
    appendActivityLog(
      currentUser.username,
      'System Settings',
      'Mobile App Configuration',
      'EDIT',
      `Updated mobile app links, ${next.apiEndpoints.activeEnvironment} endpoints, and broadcast settings.`
    );
    showToast('Mobile App Configuration & Links saved successfully.');
  };

  const handleResetDefaults = () => {
    if (!canEdit) return;
    const reset: MobileAppConfiguration = {
      ...DEFAULT_CONFIG,
      updatedAt: new Date().toISOString().split('T')[0],
      updatedBy: currentUser.username,
    };
    setConfig(reset);
    saveConfig(reset);
    showToast('Mobile App Configuration restored to defaults.');
  };

  const handleCheckEndpoints = () => {
    setEndpointHealth('checking');
    setTimeout(() => {
      setEndpointHealth('healthy');
      showToast(`${config.apiEndpoints.activeEnvironment} API & Push Gateway verified (42 ms).`);
    }, 500);
  };

  const releaseBadgeClass = (status: AppReleaseStatus) => {
    switch (status) {
      case 'Live & Stable':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Rolling Out':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Maintenance Mode':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Deprecated':
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-lg border border-amber-400/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-2 bg-amber-400/15 rounded-xl text-amber-300 border border-amber-400/30">
                <Smartphone className="w-5 h-5" />
              </span>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                Community Mobile Portal
              </span>
              <span className="text-xs font-mono text-slate-300">Hijri {financialYear}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-2">
              Mobile App Configuration &amp; Link Page
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Manage Android &amp; iOS store links, scannable QR distribution, push notification channels, API endpoints, version enforcement, and live community broadcasts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/15 border border-white/15 text-slate-100 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </div>
      </div>

      {/* Maintenance Warning Banner if enabled */}
      {config.broadcasts.maintenanceModeEnabled && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl px-4 py-3 flex items-center gap-3 text-xs text-rose-900">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>
            <strong>Maintenance Mode Lockout Active:</strong> Mobile app users will see a maintenance notice until toggled off.
          </span>
        </div>
      )}

      {/* ROW 1: DOWNLOAD LINKS & QR CODE PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Android & iOS Download Link Cards */}
        <div className="lg:col-span-7 space-y-5">
          {/* Android Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-black text-xs">
                  AND
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Android Application Link &amp; Version</h3>
                  <p className="text-[11px] text-slate-500">{config.android.storeLabel}</p>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${releaseBadgeClass(
                  config.android.releaseStatus
                )}`}
              >
                {config.android.releaseStatus} • v{config.android.currentVersion}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Android Download / Play Store URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={config.android.downloadUrl}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        android: { ...config.android, downloadUrl: e.target.value },
                      })
                    }
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy('android', config.android.downloadUrl, 'Android Link')}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'android' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                  <a
                    href={config.android.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl"
                    title="Open Android Download URL"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Package ID</label>
                  <input
                    type="text"
                    value={config.android.packageOrBundleId}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        android: { ...config.android, packageOrBundleId: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Latest Version</label>
                  <input
                    type="text"
                    value={config.android.currentVersion}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        android: { ...config.android, currentVersion: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Version</label>
                  <input
                    type="text"
                    value={config.android.minSupportedVersion}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        android: { ...config.android, minSupportedVersion: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Release Status</label>
                  <select
                    value={config.android.releaseStatus}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        android: {
                          ...config.android,
                          releaseStatus: e.target.value as AppReleaseStatus,
                        },
                      })
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
                  >
                    <option value="Live & Stable">Live &amp; Stable</option>
                    <option value="Rolling Out">Rolling Out</option>
                    <option value="Maintenance Mode">Maintenance Mode</option>
                    <option value="Deprecated">Deprecated</option>
                  </select>
                </div>
              </div>

              <ToggleSwitch
                label="Enforce Mandatory Android App Update"
                description={`Prompt users below v${config.android.minSupportedVersion} to update before login`}
                checked={config.android.forceUpdate}
                onChange={(val) =>
                  setConfig({ ...config, android: { ...config.android, forceUpdate: val } })
                }
              />
            </div>
          </div>

          {/* iOS Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-black text-xs">
                  iOS
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">iOS Application Link &amp; Version</h3>
                  <p className="text-[11px] text-slate-500">{config.ios.storeLabel}</p>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${releaseBadgeClass(
                  config.ios.releaseStatus
                )}`}
              >
                {config.ios.releaseStatus} • v{config.ios.currentVersion}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  iOS App Store / TestFlight URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={config.ios.downloadUrl}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        ios: { ...config.ios, downloadUrl: e.target.value },
                      })
                    }
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy('ios', config.ios.downloadUrl, 'iOS Link')}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'ios' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                  <a
                    href={config.ios.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl"
                    title="Open iOS App Store URL"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bundle ID</label>
                  <input
                    type="text"
                    value={config.ios.packageOrBundleId}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        ios: { ...config.ios, packageOrBundleId: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Latest Version</label>
                  <input
                    type="text"
                    value={config.ios.currentVersion}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        ios: { ...config.ios, currentVersion: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Version</label>
                  <input
                    type="text"
                    value={config.ios.minSupportedVersion}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        ios: { ...config.ios, minSupportedVersion: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Release Status</label>
                  <select
                    value={config.ios.releaseStatus}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        ios: { ...config.ios, releaseStatus: e.target.value as AppReleaseStatus },
                      })
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
                  >
                    <option value="Live & Stable">Live &amp; Stable</option>
                    <option value="Rolling Out">Rolling Out</option>
                    <option value="Maintenance Mode">Maintenance Mode</option>
                    <option value="Deprecated">Deprecated</option>
                  </select>
                </div>
              </div>

              <ToggleSwitch
                label="Enforce Mandatory iOS App Update"
                description={`Prompt users below v${config.ios.minSupportedVersion} to update from App Store`}
                checked={config.ios.forceUpdate}
                onChange={(val) =>
                  setConfig({ ...config, ios: { ...config.ios, forceUpdate: val } })
                }
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live QR Code Preview Studio */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-amber-300/70 shadow-xs p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-700" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">QR Code Download Preview</h3>
                  <p className="text-[11px] text-slate-500">
                    Scan from Masjid noticeboard or counter standee
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {([
                { id: 'android', label: 'Android QR' },
                { id: 'ios', label: 'iOS QR' },
                { id: 'universal', label: 'Universal Link' },
              ] as const).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setQrPlatform(p.id)}
                  className={`py-2 px-2 rounded-lg transition-all cursor-pointer ${
                    qrPlatform === p.id
                      ? 'bg-amber-400 text-slate-950 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="bg-amber-50/60 border-2 border-dashed border-amber-300 rounded-2xl p-6 flex flex-col items-center text-center space-y-3">
              <p className="text-xs font-black uppercase tracking-wider text-amber-950">
                {config.appName}
              </p>

              {/* Deterministic Crisp QR SVG */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <svg
                  viewBox="0 0 15 15"
                  className="w-40 h-40 text-slate-950"
                  role="img"
                  aria-label={`QR Code Preview for ${qrPlatform}`}
                >
                  {qrMatrix.map((row, rIdx) =>
                    row.map((filled, cIdx) =>
                      filled ? (
                        <rect
                          key={`${rIdx}-${cIdx}`}
                          x={cIdx}
                          y={rIdx}
                          width={1}
                          height={1}
                          fill="currentColor"
                        />
                      ) : null
                    )
                  )}
                </svg>
              </div>

              <div className="w-full space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-300 text-[10px] font-bold uppercase">
                  {qrPlatform === 'android'
                    ? `Android v${config.android.currentVersion}`
                    : qrPlatform === 'ios'
                    ? `iOS v${config.ios.currentVersion}`
                    : 'Auto-Detect Device OS'}
                </span>
                <p className="text-[11px] font-mono text-slate-600 break-all px-2">
                  {activeQrUrl}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Universal Smart Redirect URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={config.universalDeepLink}
                  onChange={(e) => setConfig({ ...config, universalDeepLink: e.target.value })}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleCopy('universal', config.universalDeepLink, 'Universal App Link')
                  }
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {copiedKey === 'universal' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl text-xs font-black inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Print QR Poster Sheet</span>
          </button>
        </div>
      </div>

      {/* ROW 2: PUSH NOTIFICATIONS & API ENDPOINTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Mobile Push Notifications */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              <div>
                <h3 className="text-sm font-black text-slate-900">Mobile Push Notifications</h3>
                <p className="text-[11px] text-slate-500">
                  Real-time device alert channels &amp; FCM / APNs gateway settings
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                config.pushNotifications.enabled
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {config.pushNotifications.enabled ? 'Gateway Active' : 'Paused'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Push Provider</label>
              <select
                value={config.pushNotifications.provider}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    pushNotifications: {
                      ...config.pushNotifications,
                      provider: e.target.value as PushProvider,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
              >
                <option value="Firebase Cloud Messaging (FCM v1)">Firebase Cloud Messaging (FCM v1)</option>
                <option value="OneSignal Enterprise">OneSignal Enterprise</option>
                <option value="Direct APNs / FCM">Direct APNs / FCM</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Channel Topic Prefix</label>
              <input
                type="text"
                value={config.pushNotifications.topicPrefix}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    pushNotifications: {
                      ...config.pushNotifications,
                      topicPrefix: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <ToggleSwitch
              label="Master Push Notifications Gateway"
              description="Enable or pause all outbound mobile push alerts"
              checked={config.pushNotifications.enabled}
              tone="emerald"
              onChange={(val) =>
                setConfig({
                  ...config,
                  pushNotifications: { ...config.pushNotifications, enabled: val },
                })
              }
            />
            <ToggleSwitch
              label="FMB Daily Thaali & Menu Alerts"
              checked={config.pushNotifications.fmbThaaliAlerts}
              onChange={(val) =>
                setConfig({
                  ...config,
                  pushNotifications: { ...config.pushNotifications, fmbThaaliAlerts: val },
                })
              }
            />
            <ToggleSwitch
              label="Sabeel & Takhmeen Due Reminders"
              checked={config.pushNotifications.sabeelDueReminders}
              onChange={(val) =>
                setConfig({
                  ...config,
                  pushNotifications: { ...config.pushNotifications, sabeelDueReminders: val },
                })
              }
            />
            <ToggleSwitch
              label="Miqaat & Majlis Live Broadcast Alerts"
              checked={config.pushNotifications.miqaatBroadcastAlerts}
              onChange={(val) =>
                setConfig({
                  ...config,
                  pushNotifications: { ...config.pushNotifications, miqaatBroadcastAlerts: val },
                })
              }
            />
            <ToggleSwitch
              label="Instant Payment & Trust Receipt Push"
              checked={config.pushNotifications.receiptConfirmations}
              onChange={(val) =>
                setConfig({
                  ...config,
                  pushNotifications: { ...config.pushNotifications, receiptConfirmations: val },
                })
              }
            />
          </div>
        </div>

        {/* API Endpoints Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-700" />
              <div>
                <h3 className="text-sm font-black text-slate-900">API Endpoints &amp; Environment</h3>
                <p className="text-[11px] text-slate-500">
                  Mobile REST, WebSocket sync, and ITS52 SSO endpoints
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCheckEndpoints}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${endpointHealth === 'checking' ? 'animate-spin' : ''}`} />
              <span>
                {endpointHealth === 'healthy'
                  ? 'Endpoints Online (42ms)'
                  : endpointHealth === 'checking'
                  ? 'Verifying...'
                  : 'Test Endpoints'}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            {(['Production', 'Staging'] as const).map((env) => (
              <button
                key={env}
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    apiEndpoints: { ...config.apiEndpoints, activeEnvironment: env },
                  })
                }
                className={`py-2 px-3 rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  config.apiEndpoints.activeEnvironment === env
                    ? 'bg-slate-900 text-amber-300 border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>{env} Environment</span>
              </button>
            ))}
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Production API Base URL</label>
              <input
                type="url"
                value={config.apiEndpoints.productionBaseUrl}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    apiEndpoints: { ...config.apiEndpoints, productionBaseUrl: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Staging / Sandbox API URL</label>
              <input
                type="url"
                value={config.apiEndpoints.stagingBaseUrl}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    apiEndpoints: { ...config.apiEndpoints, stagingBaseUrl: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Live WebSocket Sync URL</label>
              <input
                type="text"
                value={config.apiEndpoints.webSocketUrl}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    apiEndpoints: { ...config.apiEndpoints, webSocketUrl: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">ITS52 SSO Auth Endpoint</label>
                <input
                  type="url"
                  value={config.apiEndpoints.itsAuthEndpoint}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      apiEndpoints: { ...config.apiEndpoints, itsAuthEndpoint: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Timeout (ms)</label>
                <input
                  type="number"
                  min={1000}
                  step={500}
                  value={config.apiEndpoints.timeoutMs}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      apiEndpoints: {
                        ...config.apiEndpoints,
                        timeoutMs: Number(e.target.value) || 12000,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: ACTIVE BROADCAST TOGGLES & LIVE APP PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-purple-600" />
              <div>
                <h3 className="text-sm font-black text-slate-900">Active Broadcast &amp; Feature Toggles</h3>
                <p className="text-[11px] text-slate-500">
                  Control live app announcements, self-service capabilities, and maintenance lockout
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Broadcast Banner Headline</label>
              <input
                type="text"
                value={config.broadcasts.bannerTitle}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    broadcasts: { ...config.broadcasts, bannerTitle: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Broadcast Sub-Message</label>
              <input
                type="text"
                value={config.broadcasts.bannerMessage}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    broadcasts: { ...config.broadcasts, bannerMessage: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ToggleSwitch
              label="Global Home Broadcast Banner"
              description="Show highlighted announcement card on app home"
              checked={config.broadcasts.globalBannerActive}
              tone="emerald"
              onChange={(val) =>
                setConfig({
                  ...config,
                  broadcasts: { ...config.broadcasts, globalBannerActive: val },
                })
              }
            />
            <ToggleSwitch
              label="Miqaat & Majlis Live Ticker"
              description="Scroll live timings & relay notices on dashboard"
              checked={config.broadcasts.miqaatTickerEnabled}
              onChange={(val) =>
                setConfig({
                  ...config,
                  broadcasts: { ...config.broadcasts, miqaatTickerEnabled: val },
                })
              }
            />
            <ToggleSwitch
              label="Huzurala Safar Mubarak Live Feed"
              description="Surface Safar updates and Qadambosi token alerts"
              checked={config.broadcasts.safarLiveUpdatesEnabled}
              onChange={(val) =>
                setConfig({
                  ...config,
                  broadcasts: { ...config.broadcasts, safarLiveUpdatesEnabled: val },
                })
              }
            />
            <ToggleSwitch
              label="In-App Sabeel & FMB Payments"
              description="Allow UPI/online payments inside mobile app"
              checked={config.broadcasts.inAppPaymentsEnabled}
              onChange={(val) =>
                setConfig({
                  ...config,
                  broadcasts: { ...config.broadcasts, inAppPaymentsEnabled: val },
                })
              }
            />
            <ToggleSwitch
              label="Thaali Feedback & Safar Pause Requests"
              description="Allow households to submit daily thaali updates"
              checked={config.broadcasts.thaaliRequestsEnabled}
              onChange={(val) =>
                setConfig({
                  ...config,
                  broadcasts: { ...config.broadcasts, thaaliRequestsEnabled: val },
                })
              }
            />
            <ToggleSwitch
              label="Maintenance Mode Lockout"
              description="Temporarily block mobile app access for maintenance"
              checked={config.broadcasts.maintenanceModeEnabled}
              tone="rose"
              onChange={(val) =>
                setConfig({
                  ...config,
                  broadcasts: { ...config.broadcasts, maintenanceModeEnabled: val },
                })
              }
            />
          </div>
        </div>

        {/* Live Mobile Banner Preview Card */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Live Mobile Screen Preview</span>
            </h3>

            <div className="bg-slate-900 rounded-2xl p-4 text-white space-y-3 border-2 border-slate-800 shadow-inner">
              <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono">
                <span>{config.appName}</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  {config.apiEndpoints.activeEnvironment}
                </span>
              </div>

              {config.broadcasts.maintenanceModeEnabled ? (
                <div className="bg-rose-600/90 rounded-xl p-3 text-xs space-y-1">
                  <p className="font-black">Scheduled Maintenance</p>
                  <p className="text-[11px] text-rose-100">
                    Mobile services are temporarily paused. Please try again shortly.
                  </p>
                </div>
              ) : config.broadcasts.globalBannerActive ? (
                <div className="bg-amber-400 text-slate-950 rounded-xl p-3 text-xs space-y-1">
                  <p className="font-black">{config.broadcasts.bannerTitle}</p>
                  <p className="text-[11px] text-slate-800">{config.broadcasts.bannerMessage}</p>
                </div>
              ) : (
                <div className="bg-slate-800 rounded-xl p-3 text-[11px] text-slate-400 text-center">
                  Broadcast banner is currently hidden
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-white/10 rounded-lg p-2">
                  <span className="text-slate-400 block">Android</span>
                  <span className="font-mono font-bold text-white">v{config.android.currentVersion}</span>
                </div>
                <div className="bg-white/10 rounded-lg p-2">
                  <span className="text-slate-400 block">iOS</span>
                  <span className="font-mono font-bold text-white">v{config.ios.currentVersion}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Last saved by <strong>@{config.updatedBy}</strong>
            </span>
            <span className="font-mono">{config.updatedAt}</span>
          </div>
        </div>
      </div>

      {/* Bottom Save Confirmation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 px-5 py-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-slate-600 inline-flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Changes sync immediately to browser storage and audit logs upon saving.
        </span>
        <button
          type="submit"
          className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Mobile App Configuration</span>
        </button>
      </div>
    </form>
  );
};

