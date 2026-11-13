import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Smartphone,
  KeyRound,
  ShieldCheck,
  Bell,
  Plus,
  Search,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Copy,
  Check,
  Edit3,
  Trash2,
  Send,
  FileText,
  X,
  CheckCircle2,
} from 'lucide-react';
import { FinancialYear, UserProfile } from '../../types';
import {
  getNotificationGatewayConfig,
  saveNotificationGatewayConfig,
} from '../../utils/part4Management';
import { appendActivityLog } from '../../utils/rbac';

export type SmsProviderType =
  | 'MSG91 Enterprise'
  | 'Textlocal India'
  | 'Kaleyra DLT'
  | 'Twilio Programmable SMS';

export type SmsRouteType = 'Transactional (DLT)' | 'Service Implicit' | 'Promotional';

export type SmsTemplateCategory =
  | 'FMB Reminders'
  | 'Sabeel Dues'
  | 'Receipts'
  | 'Event Notifications';

export interface SmsMessagingGatewaySettings {
  smsProvider: SmsProviderType;
  smsApiKey: string;
  smsSenderId: string;
  dltEntityId: string;
  smsRoute: SmsRouteType;
  enableSmsGateway: boolean;
  unicodeSupport: boolean;
  enableWhatsAppWati: boolean;
  whatsappGatewayUrl: string;
  whatsappApiKey: string;
  whatsappBusinessNumber: string;
  whatsappWebhookUrl: string;
  preferWhatsAppOverSms: boolean;
  attachPdfReceiptsOnWhatsApp: boolean;
  syncDeliveryWebhooks: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface SmsAlertTemplate {
  id: string;
  name: string;
  category: SmsTemplateCategory;
  dltTemplateId: string;
  senderId: string;
  triggerEvent: string;
  content: string;
  isActive: boolean;
  sendViaWhatsAppAlso: boolean;
  updatedAt: string;
}

const GATEWAY_STORAGE_KEY = 'jamat_sms_messaging_settings_v1';
const TEMPLATES_STORAGE_KEY = 'jamat_sms_dlt_templates_v1';

const TEMPLATE_CATEGORIES: SmsTemplateCategory[] = [
  'FMB Reminders',
  'Sabeel Dues',
  'Receipts',
  'Event Notifications',
];

const PLACEHOLDER_VARS = ['[Name]', '[ITS]', '[SabeelNo]', '[Amount]', '[ReceiptNo]', '[Date]', '[EventName]'];

const createInitialGatewaySettings = (): SmsMessagingGatewaySettings => {
  const base = getNotificationGatewayConfig();
  return {
    smsProvider: 'MSG91 Enterprise',
    smsApiKey: base.smsApiKey || 'sms_live_key_992014',
    smsSenderId: base.smsSenderId || 'JAMATB',
    dltEntityId: '1101592830000048219',
    smsRoute: 'Transactional (DLT)',
    enableSmsGateway: base.enableSmsNotifications,
    unicodeSupport: true,
    enableWhatsAppWati: base.enableWhatsAppNotifications,
    whatsappGatewayUrl: base.whatsappGatewayUrl || 'https://api.wati.io/v1/burhanipark',
    whatsappApiKey: base.whatsappApiKey || 'wati_live_sec_5253_burhanipark_token',
    whatsappBusinessNumber: '+91 98200 52530',
    whatsappWebhookUrl: 'https://erp.burhanipark.org/api/webhooks/wati-dlr',
    preferWhatsAppOverSms: true,
    attachPdfReceiptsOnWhatsApp: true,
    syncDeliveryWebhooks: true,
    updatedAt: new Date().toISOString().split('T')[0],
    updatedBy: 'janabadmin',
  };
};

const INITIAL_SMS_TEMPLATES: SmsAlertTemplate[] = [
  {
    id: 'sms-tpl-1',
    name: 'FMB Takhmeen Installment Reminder',
    category: 'FMB Reminders',
    dltTemplateId: '1107169841200051294',
    senderId: 'JAMATB',
    triggerEvent: 'Monthly FMB Due Cycle',
    content:
      'Afzal us Salam [Name] (ITS [ITS]), kindly remit your pending FMB Hub balance of Rs [Amount] by [Date] at Jamaat Office or Online. - Anjuman e Mufaddal',
    isActive: true,
    sendViaWhatsAppAlso: true,
    updatedAt: '2026-10-15',
  },
  {
    id: 'sms-tpl-2',
    name: 'Daily Thaali Dispatch & Pause Alert',
    category: 'FMB Reminders',
    dltTemplateId: '1107169841200051301',
    senderId: 'JAMATB',
    triggerEvent: 'Daily Kitchen Dispatch (10:30 AM)',
    content:
      'Baad Afzal us Salam [Name], today FMB Thaali has been dispatched for Sabeel [SabeelNo] on [Date]. Request pause 24h prior via Jamaat App.',
    isActive: true,
    sendViaWhatsAppAlso: true,
    updatedAt: '2026-10-18',
  },
  {
    id: 'sms-tpl-3',
    name: 'Sabeel ul Barkaat Due Reminder',
    category: 'Sabeel Dues',
    dltTemplateId: '1107169841200062108',
    senderId: 'JAMATB',
    triggerEvent: 'Quarterly Sabeel Arrears Check',
    content:
      'Afzal us Salam [Name], Sabeel #[SabeelNo] has an outstanding balance of Rs [Amount] for 1447-1448H. Please settle before [Date]. - Burhani Park Jamaat',
    isActive: true,
    sendViaWhatsAppAlso: true,
    updatedAt: '2026-10-20',
  },
  {
    id: 'sms-tpl-4',
    name: 'Official Trust Receipt Confirmation',
    category: 'Receipts',
    dltTemplateId: '1107169841200074520',
    senderId: 'JAMATB',
    triggerEvent: 'On Receipt Generation (POS)',
    content:
      'Shukran [Name] (ITS [ITS]). Received Rs [Amount] vide Receipt #[ReceiptNo] dated [Date]. Dawoodi Bohra Jamaat Trust, Burhani Park Vatwa.',
    isActive: true,
    sendViaWhatsAppAlso: true,
    updatedAt: '2026-10-25',
  },
  {
    id: 'sms-tpl-5',
    name: 'Miqaat & Majlis Invitation Notice',
    category: 'Event Notifications',
    dltTemplateId: '1107169841200088912',
    senderId: 'JAMATB',
    triggerEvent: 'Miqaat Calendar Broadcast',
    content:
      'Afzal us Salam [Name], Mumineen are invited for [EventName] on [Date] at Al-Masjid al-Burhani, Burhani Park. Niyaz Jaman will follow.',
    isActive: true,
    sendViaWhatsAppAlso: true,
    updatedAt: '2026-11-01',
  },
];

function loadGatewaySettings(): SmsMessagingGatewaySettings {
  try {
    const raw = localStorage.getItem(GATEWAY_STORAGE_KEY);
    if (!raw) {
      const initial = createInitialGatewaySettings();
      localStorage.setItem(GATEWAY_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as SmsMessagingGatewaySettings;
  } catch {
    return createInitialGatewaySettings();
  }
}

function loadTemplates(): SmsAlertTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(INITIAL_SMS_TEMPLATES));
      return INITIAL_SMS_TEMPLATES;
    }
    return JSON.parse(raw) as SmsAlertTemplate[];
  } catch {
    return INITIAL_SMS_TEMPLATES;
  }
}

interface SwitchRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  tone?: 'amber' | 'emerald';
}

const SwitchRow: React.FC<SwitchRowProps> = ({
  label,
  description,
  checked,
  onChange,
  tone = 'amber',
}) => (
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
        checked ? (tone === 'emerald' ? 'bg-emerald-600' : 'bg-amber-500') : 'bg-slate-300'
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

interface SmsMessagingSettingsModuleProps {
  currentUser: UserProfile;
  financialYear: FinancialYear;
  showToast: (msg: string) => void;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const SmsMessagingSettingsModule: React.FC<SmsMessagingSettingsModuleProps> = ({
  currentUser,
  financialYear,
  showToast,
  canAdd = true,
  canEdit = true,
  canDelete = true,
}) => {
  const [gateway, setGateway] = useState<SmsMessagingGatewaySettings>(loadGatewaySettings);
  const [templates, setTemplates] = useState<SmsAlertTemplate[]>(loadTemplates);

  // Secret visibility & clipboard feedback
  const [showSmsKey, setShowSmsKey] = useState(false);
  const [showWatiKey, setShowWatiKey] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [testMobile, setTestMobile] = useState('+91 9820044556');

  // Template Filters
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | SmsTemplateCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Template Modal (Add / Edit) & Preview Modal
  const [showTplModal, setShowTplModal] = useState(false);
  const [editingTpl, setEditingTpl] = useState<SmsAlertTemplate | null>(null);
  const [previewTpl, setPreviewTpl] = useState<SmsAlertTemplate | null>(null);

  const [tplForm, setTplForm] = useState({
    name: '',
    category: 'FMB Reminders' as SmsTemplateCategory,
    dltTemplateId: '',
    senderId: gateway.smsSenderId,
    triggerEvent: '',
    content: '',
    isActive: true,
    sendViaWhatsAppAlso: true,
  });

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return templates.filter((t) => {
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.dltTemplateId.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q) ||
        t.triggerEvent.toLowerCase().includes(q)
      );
    });
  }, [templates, categoryFilter, searchQuery]);

  const handleCopy = (id: string, value: string, label: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedId(id);
    showToast(`${label} copied.`);
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1600);
  };

  const handleSaveGateway = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      showToast('Edit permission required to update SMS & Messaging settings.');
      return;
    }

    const updated: SmsMessagingGatewaySettings = {
      ...gateway,
      smsSenderId: gateway.smsSenderId.trim().toUpperCase(),
      updatedAt: new Date().toISOString().split('T')[0],
      updatedBy: currentUser.username,
    };
    setGateway(updated);
    localStorage.setItem(GATEWAY_STORAGE_KEY, JSON.stringify(updated));

    // Keep global NotificationGatewayConfig synchronized
    const base = getNotificationGatewayConfig();
    saveNotificationGatewayConfig({
      ...base,
      smsSenderId: updated.smsSenderId,
      smsApiKey: updated.smsApiKey,
      enableSmsNotifications: updated.enableSmsGateway,
      whatsappGatewayUrl: updated.whatsappGatewayUrl,
      whatsappApiKey: updated.whatsappApiKey,
      enableWhatsAppNotifications: updated.enableWhatsAppWati,
    });

    appendActivityLog(
      currentUser.username,
      'System Settings',
      'SMS & Messaging Service Settings',
      'EDIT',
      `Saved ${updated.smsProvider} DLT (Sender ${updated.smsSenderId}) & WATI gateway settings.`
    );
    showToast('SMS DLT & WhatsApp WATI gateway settings saved.');
  };

  const handleResetGateway = () => {
    const initial = createInitialGatewaySettings();
    setGateway(initial);
    localStorage.setItem(GATEWAY_STORAGE_KEY, JSON.stringify(initial));
    showToast('Gateway settings restored to defaults.');
  };

  const openAddTemplate = () => {
    setEditingTpl(null);
    setTplForm({
      name: '',
      category: 'FMB Reminders',
      dltTemplateId: '',
      senderId: gateway.smsSenderId,
      triggerEvent: '',
      content: '',
      isActive: true,
      sendViaWhatsAppAlso: true,
    });
    setShowTplModal(true);
  };

  const openEditTemplate = (tpl: SmsAlertTemplate) => {
    setEditingTpl(tpl);
    setTplForm({
      name: tpl.name,
      category: tpl.category,
      dltTemplateId: tpl.dltTemplateId,
      senderId: tpl.senderId,
      triggerEvent: tpl.triggerEvent,
      content: tpl.content,
      isActive: tpl.isActive,
      sendViaWhatsAppAlso: tpl.sendViaWhatsAppAlso,
    });
    setShowTplModal(true);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplForm.name.trim() || !tplForm.dltTemplateId.trim() || !tplForm.content.trim()) {
      showToast('Template Name, DLT Template ID, and Message Content are required.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const next = editingTpl
      ? templates.map((t) =>
          t.id === editingTpl.id
            ? {
                ...t,
                ...tplForm,
                name: tplForm.name.trim(),
                dltTemplateId: tplForm.dltTemplateId.trim(),
                senderId: tplForm.senderId.trim().toUpperCase() || gateway.smsSenderId,
                triggerEvent: tplForm.triggerEvent.trim() || 'Automated Alert',
                updatedAt: today,
              }
            : t
        )
      : [
          {
            id: `sms-tpl-${Date.now()}`,
            name: tplForm.name.trim(),
            category: tplForm.category,
            dltTemplateId: tplForm.dltTemplateId.trim(),
            senderId: tplForm.senderId.trim().toUpperCase() || gateway.smsSenderId,
            triggerEvent: tplForm.triggerEvent.trim() || 'Automated Alert',
            content: tplForm.content.trim(),
            isActive: tplForm.isActive,
            sendViaWhatsAppAlso: tplForm.sendViaWhatsAppAlso,
            updatedAt: today,
          },
          ...templates,
        ];

    setTemplates(next);
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(next));
    appendActivityLog(
      currentUser.username,
      'System Settings',
      'SMS & Messaging Service Settings',
      editingTpl ? 'EDIT' : 'ADD',
      `${editingTpl ? 'Updated' : 'Created'} DLT SMS template "${tplForm.name}" (${tplForm.dltTemplateId})`
    );
    showToast(editingTpl ? 'SMS template updated.' : 'SMS template added.');
    setShowTplModal(false);
  };

  const handleToggleTemplateFlag = (
    id: string,
    field: 'isActive' | 'sendViaWhatsAppAlso'
  ) => {
    const next = templates.map((t) =>
      t.id === id ? { ...t, [field]: !t[field] } : t
    );
    setTemplates(next);
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(next));
    showToast('Template delivery setting updated.');
  };

  const handleDeleteTemplate = (tpl: SmsAlertTemplate) => {
    if (!canDelete) return;
    if (!window.confirm(`Delete SMS template "${tpl.name}"?`)) return;
    const next = templates.filter((t) => t.id !== tpl.id);
    setTemplates(next);
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(next));
    showToast(`Deleted template "${tpl.name}".`);
  };

  const renderSampleMessage = (content: string) =>
    content
      .replace(/\[Name\]/g, 'Mulla Shabbir Bhai Fakhri')
      .replace(/\[ITS\]/g, '30489122')
      .replace(/\[SabeelNo\]/g, 'SB-042')
      .replace(/\[Amount\]/g, '15,000')
      .replace(/\[ReceiptNo\]/g, 'TS-2026-101')
      .replace(/\[Date\]/g, '11 Nov 2026')
      .replace(/\[EventName\]/g, 'Ashara Mubaraka Majlis');

  const activeTemplatesCount = templates.filter((t) => t.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-lg border border-amber-400/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-2 bg-amber-400/15 rounded-xl text-amber-300 border border-amber-400/30">
                <MessageSquare className="w-5 h-5" />
              </span>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                DLT &amp; WATI Messaging Gateway
              </span>
              <span className="text-xs font-mono text-slate-300">Hijri {financialYear}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-2">
              SMS &amp; Messaging Service Settings
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Configure TRAI DLT SMS provider credentials, Sender IDs, WhatsApp WATI integration toggles, and automated alert templates for FMB, Sabeel, receipts, and Miqaat events.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 bg-white/10 border border-white/10 rounded-xl p-3 text-center shrink-0">
            <div>
              <p className="text-[10px] uppercase font-bold text-amber-200">SMS Gateway</p>
              <p className="text-xs font-black text-white mt-0.5">
                {gateway.enableSmsGateway ? 'Enabled' : 'Paused'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-300">WATI API</p>
              <p className="text-xs font-black text-emerald-300 mt-0.5">
                {gateway.enableWhatsAppWati ? 'Connected' : 'Off'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-blue-200">DLT Templates</p>
              <p className="text-xs font-black text-white font-mono mt-0.5">
                {activeTemplatesCount}/{templates.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* GATEWAY CONFIGURATION CARDS */}
      <form onSubmit={handleSaveGateway} className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card 1: SMS Provider & DLT Registration */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
                  <Smartphone className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">SMS Provider &amp; DLT Configuration</h3>
                  <p className="text-[11px] text-slate-500">
                    Transactional SMS API credentials, Sender ID &amp; Principal Entity ID
                  </p>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  gateway.enableSmsGateway
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {gateway.enableSmsGateway ? 'Active' : 'Disabled'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">SMS Provider</label>
                <select
                  value={gateway.smsProvider}
                  onChange={(e) =>
                    setGateway({ ...gateway, smsProvider: e.target.value as SmsProviderType })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
                >
                  <option value="MSG91 Enterprise">MSG91 Enterprise</option>
                  <option value="Textlocal India">Textlocal India</option>
                  <option value="Kaleyra DLT">Kaleyra DLT</option>
                  <option value="Twilio Programmable SMS">Twilio Programmable SMS</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">SMS Route</label>
                <select
                  value={gateway.smsRoute}
                  onChange={(e) =>
                    setGateway({ ...gateway, smsRoute: e.target.value as SmsRouteType })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
                >
                  <option value="Transactional (DLT)">Transactional (DLT)</option>
                  <option value="Service Implicit">Service Implicit</option>
                  <option value="Promotional">Promotional</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Approved DLT Sender ID (6 chars) *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={gateway.smsSenderId}
                  onChange={(e) =>
                    setGateway({ ...gateway, smsSenderId: e.target.value.toUpperCase() })
                  }
                  placeholder="JAMATB"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-black uppercase text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  DLT Principal Entity ID (PE ID) *
                </label>
                <input
                  type="text"
                  required
                  value={gateway.dltEntityId}
                  onChange={(e) => setGateway({ ...gateway, dltEntityId: e.target.value })}
                  placeholder="1101592830000048219"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-900"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-bold text-slate-700 mb-1">SMS Gateway API Key *</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showSmsKey ? 'text' : 'password'}
                    required
                    value={gateway.smsApiKey}
                    onChange={(e) => setGateway({ ...gateway, smsApiKey: e.target.value })}
                    className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmsKey((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    aria-label="Toggle SMS API Key visibility"
                  >
                    {showSmsKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('smsKey', gateway.smsApiKey, 'SMS API Key')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === 'smsKey' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              <SwitchRow
                label="Enable Automated SMS Gateway"
                description="Allow ERP modules to send transactional DLT SMS alerts"
                checked={gateway.enableSmsGateway}
                tone="emerald"
                onChange={(val) => setGateway({ ...gateway, enableSmsGateway: val })}
              />
              <SwitchRow
                label="Unicode Support (Arabic / Gujarati Script)"
                description="Enable UTF-16 encoding for Lisan ud Dawat / Arabic greetings"
                checked={gateway.unicodeSupport}
                onChange={(val) => setGateway({ ...gateway, unicodeSupport: val })}
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
              <input
                type="text"
                value={testMobile}
                onChange={(e) => setTestMobile(e.target.value)}
                placeholder="+91 98200..."
                className="flex-1 min-w-[160px] px-3 py-2 border border-slate-200 rounded-xl font-mono"
              />
              <button
                type="button"
                onClick={() =>
                  showToast(`Test DLT SMS queued to ${testMobile} via Sender ID ${gateway.smsSenderId}.`)
                }
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Test SMS</span>
              </button>
            </div>
          </div>

          {/* Card 2: WhatsApp / WATI Integration */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">WhatsApp / WATI Integration</h3>
                  <p className="text-[11px] text-slate-500">
                    Official WhatsApp Business API tokens, routing &amp; PDF receipt attachment
                  </p>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  gateway.enableWhatsAppWati
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {gateway.enableWhatsAppWati ? 'Connected' : 'Paused'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  WATI API Endpoint URL *
                </label>
                <input
                  type="url"
                  required
                  value={gateway.whatsappGatewayUrl}
                  onChange={(e) => setGateway({ ...gateway, whatsappGatewayUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  WATI Bearer Token / API Key *
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showWatiKey ? 'text' : 'password'}
                      required
                      value={gateway.whatsappApiKey}
                      onChange={(e) => setGateway({ ...gateway, whatsappApiKey: e.target.value })}
                      className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-xl font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowWatiKey((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      aria-label="Toggle WATI API Key visibility"
                    >
                      {showWatiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('watiKey', gateway.whatsappApiKey, 'WATI Bearer Token')}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === 'watiKey' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    WhatsApp Business Number
                  </label>
                  <input
                    type="text"
                    value={gateway.whatsappBusinessNumber}
                    onChange={(e) =>
                      setGateway({ ...gateway, whatsappBusinessNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Webhook DLR Callback</label>
                  <input
                    type="url"
                    value={gateway.whatsappWebhookUrl}
                    onChange={(e) => setGateway({ ...gateway, whatsappWebhookUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <SwitchRow
                label="Enable WhatsApp / WATI Integration"
                description="Dispatch official templates & receipts via WATI API"
                checked={gateway.enableWhatsAppWati}
                tone="emerald"
                onChange={(val) => setGateway({ ...gateway, enableWhatsAppWati: val })}
              />
              <SwitchRow
                label="Prefer WhatsApp Before SMS Fallback"
                description="Send via WATI first; fall back to DLT SMS if undelivered"
                checked={gateway.preferWhatsAppOverSms}
                onChange={(val) => setGateway({ ...gateway, preferWhatsAppOverSms: val })}
              />
              <SwitchRow
                label="Auto-Attach Official Trust PDF Receipt"
                description="Include Dawoodi Bohra Jamaat Trust receipt link on payment alerts"
                checked={gateway.attachPdfReceiptsOnWhatsApp}
                onChange={(val) => setGateway({ ...gateway, attachPdfReceiptsOnWhatsApp: val })}
              />
              <SwitchRow
                label="Sync Delivery & Read-Receipt Webhooks"
                description="Log WATI delivery status updates into Central Activity Logs"
                checked={gateway.syncDeliveryWebhooks}
                onChange={(val) => setGateway({ ...gateway, syncDeliveryWebhooks: val })}
              />
            </div>
          </div>
        </div>

        {/* Gateway Save Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 px-5 py-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-500 inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Last updated {gateway.updatedAt} by <strong>@{gateway.updatedBy}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetGateway}
              className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Gateway Configuration</span>
            </button>
          </div>
        </div>
      </form>

      {/* SMS TEMPLATE MANAGER FOR AUTOMATED ALERTS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              <span>SMS Template Manager (Automated Alerts &amp; DLT IDs)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Manage DLT-registered message templates for FMB reminders, Sabeel dues, receipts, and event notifications.
            </p>
          </div>
          {canAdd && (
            <button
              type="button"
              onClick={openAddTemplate}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 font-black text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add DLT Template</span>
            </button>
          )}
        </div>

        {/* Category Filter Tabs + Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['ALL', ...TEMPLATE_CATEGORIES] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  categoryFilter === cat
                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat === 'ALL' ? `All (${templates.length})` : cat}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search template name or DLT ID..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {/* Template Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((tpl) => {
            const segments = Math.max(1, Math.ceil(tpl.content.length / 160));
            return (
              <div
                key={tpl.id}
                className={`rounded-2xl border p-4 space-y-3 text-xs transition-all ${
                  tpl.isActive
                    ? 'bg-slate-50/70 border-slate-200'
                    : 'bg-slate-100/60 border-slate-200 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-200">
                        {tpl.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-900">
                        DLT: {tpl.dltTemplateId}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900">{tpl.name}</h4>
                    <p className="text-[11px] text-slate-500">
                      Trigger: <strong>{tpl.triggerEvent}</strong> • Sender:{' '}
                      <span className="font-mono font-bold">{tpl.senderId}</span>
                    </p>
                  </div>

                  {/* Active Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={tpl.isActive}
                    onClick={() => handleToggleTemplateFlag(tpl.id, 'isActive')}
                    title={tpl.isActive ? 'Disable Template' : 'Enable Template'}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      tpl.isActive ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
                        tpl.isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3 font-sans text-slate-700 leading-relaxed">
                  {tpl.content}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-slate-500">
                      {tpl.content.length} chars ({segments} SMS seg)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleTemplateFlag(tpl.id, 'sendViaWhatsAppAlso')}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer border ${
                        tpl.sendViaWhatsAppAlso
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {tpl.sendViaWhatsAppAlso ? 'WATI Mirror: ON' : 'WATI Mirror: OFF'}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewTpl(tpl)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Preview</span>
                    </button>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => openEditTemplate(tpl)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg cursor-pointer"
                        title="Delete Template"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredTemplates.length === 0 && (
            <div className="md:col-span-2 py-10 text-center text-xs text-slate-400">
              No SMS templates match the selected category or search query.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add / Edit DLT SMS Template */}
      {showTplModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">
                {editingTpl ? 'Edit DLT SMS Template' : 'Register New DLT SMS Template'}
              </h3>
              <button
                type="button"
                onClick={() => setShowTplModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Template Name *</label>
                  <input
                    type="text"
                    required
                    value={tplForm.name}
                    onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })}
                    placeholder="e.g. Sabeel Due Alert"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alert Category *</label>
                  <select
                    value={tplForm.category}
                    onChange={(e) =>
                      setTplForm({ ...tplForm, category: e.target.value as SmsTemplateCategory })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
                  >
                    {TEMPLATE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    DLT Template Registration ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={tplForm.dltTemplateId}
                    onChange={(e) => setTplForm({ ...tplForm, dltTemplateId: e.target.value })}
                    placeholder="11071698412000..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sender ID</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={tplForm.senderId}
                    onChange={(e) =>
                      setTplForm({ ...tplForm, senderId: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Automated Trigger Event</label>
                <input
                  type="text"
                  value={tplForm.triggerEvent}
                  onChange={(e) => setTplForm({ ...tplForm, triggerEvent: e.target.value })}
                  placeholder="e.g. On Sabeel Receipt Issued"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <label className="font-bold text-slate-700">Message Content *</label>
                  <span className="text-[10px] font-mono text-slate-500">
                    {tplForm.content.length} chars
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={tplForm.content}
                  onChange={(e) => setTplForm({ ...tplForm, content: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {PLACEHOLDER_VARS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() =>
                        setTplForm((p) => ({
                          ...p,
                          content: p.content ? `${p.content} ${v}` : v,
                        }))
                      }
                      className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-mono text-[10px] font-bold cursor-pointer"
                    >
                      +{v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="inline-flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tplForm.isActive}
                    onChange={(e) => setTplForm({ ...tplForm, isActive: e.target.checked })}
                  />
                  <span>Template Active</span>
                </label>
                <label className="inline-flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tplForm.sendViaWhatsAppAlso}
                    onChange={(e) =>
                      setTplForm({ ...tplForm, sendViaWhatsAppAlso: e.target.checked })
                    }
                  />
                  <span>Mirror via WATI</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTplModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl font-black inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingTpl ? 'Update Template' : 'Save DLT Template'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Live Sample SMS Preview */}
      {previewTpl && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">{previewTpl.name}</h3>
                <p className="text-[11px] font-mono text-slate-500">
                  DLT #{previewTpl.dltTemplateId} • Sender {previewTpl.senderId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTpl(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-[10px] font-mono text-amber-300">
                <span>SMS FROM: {previewTpl.senderId}</span>
                <span>{previewTpl.category}</span>
              </div>
              <p className="leading-relaxed text-slate-100">
                {renderSampleMessage(previewTpl.content)}
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewTpl(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

