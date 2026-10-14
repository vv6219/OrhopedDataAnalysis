import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  CircularProgress,
  Badge,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as CloneIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Save as SaveIcon,
  ArrowBack as BackIcon,
  Biotech as BiotechIcon,
  LocalHospital as HospitalIcon,
  Visibility as PreviewIcon,
  Healing as HealingIcon,
  Straighten as RomIcon,
  Psychology as BrainIcon,
  Article as ArticleIcon,
  MenuBook as ManualIcon,
  Layers as LayersIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DiagnosticMethodsCatalogManager from '../components/ortho/DiagnosticMethodsCatalogManager';
import OrthopedicTestsCatalogManager from '../components/ortho/OrthopedicTestsCatalogManager';

interface OrthoTestCatalogItem {
  code: string;
  name_ru: string;
  name_lat: string;
  joint_category: string;
  target_structure: string;
  methodology: string;
  positive_criteria: string;
  sensitivity_specificity?: string;
  icon_type?: string;
}

interface DiagnosticMethodCatalogItem {
  code: string;
  name: string;
  modality: string;
  target_joint: string;
  servdict_id?: number | null;
  clinical_indications?: string;
  protocol_phrase: string;
  priority_level: string;
  servdict_price?: number | null;
  servdict_name?: string | null;
}

interface TemplateTestItem {
  id?: number;
  test_code: string;
  expected_result: string;
  is_mandatory: number;
  sort_order: number;
  name_ru?: string;
  name_lat?: string;
  target_structure?: string;
  methodology?: string;
  positive_criteria?: string;
  sensitivity_specificity?: string;
}

interface TemplateDiagnosticItem {
  id?: number;
  diagnostic_code: string;
  urgency: string;
  default_side: string;
  is_primary: number;
  sort_order: number;
  name?: string;
  modality?: string;
  servdict_price?: number | null;
  protocol_phrase?: string;
}

interface PrescriptionItem {
  category: string;
  title: string;
  unit_price: number;
  quantity: number;
  service_id?: number;
}

export interface MasterCluster {
  id: string;
  code: string;
  name_ru: string;
  joint_affinity: string;
  badge_color: string;
  sort_order: number;
}

export const MASTER_CLUSTERS: MasterCluster[] = [
  { id: 'all', code: 'ALL', name_ru: 'Все кластеры (100)', joint_affinity: 'all', badge_color: '#0F3C64', sort_order: 0 },
  { id: 'cluster_knee', code: 'KNEE', name_ru: '1. Коленный сустав', joint_affinity: 'knee', badge_color: '#0284C7', sort_order: 10 },
  { id: 'cluster_shoulder', code: 'SHOULDER', name_ru: '2. Плечевой пояс', joint_affinity: 'shoulder', badge_color: '#9333EA', sort_order: 20 },
  { id: 'cluster_hip_pelvis', code: 'HIP_PELVIS', name_ru: '3. Таз и ТБС', joint_affinity: 'hip', badge_color: '#16A34A', sort_order: 30 },
  { id: 'cluster_foot_ankle', code: 'FOOT_ANKLE', name_ru: '4. Стопа и голеностоп', joint_affinity: 'ankle', badge_color: '#0D9488', sort_order: 40 },
  { id: 'cluster_elbow', code: 'ELBOW', name_ru: '5. Локтевой сустав', joint_affinity: 'elbow', badge_color: '#EA580C', sort_order: 50 },
  { id: 'cluster_wrist_hand', code: 'WRIST_HAND', name_ru: '6. Кисть и запястье', joint_affinity: 'wrist', badge_color: '#DB2777', sort_order: 60 },
  { id: 'cluster_spine', code: 'SPINE', name_ru: '7. Позвоночник и торакс', joint_affinity: 'spine', badge_color: '#475569', sort_order: 70 },
  { id: 'cluster_pediatric', code: 'PEDIATRIC', name_ru: '8. Детская ортопедия', joint_affinity: 'general', badge_color: '#D97706', sort_order: 80 },
  { id: 'cluster_systemic', code: 'SYSTEMIC', name_ru: '9. Системные синдромы', joint_affinity: 'general', badge_color: '#4F46E5', sort_order: 90 },
  { id: 'cluster_postop', code: 'POSTOP', name_ru: '10. Постоперационный контроль', joint_affinity: 'general', badge_color: '#059669', sort_order: 100 }
];

interface FullTemplate {
  id?: number;
  title: string;
  joint_name: string;
  default_mkb_code?: string;
  category?: string;
  cluster_id?: string;
  cluster_name?: string;
  stage_or_severity?: string;
  clinical_tags?: string | string[];
  default_side?: string;
  complaints_template?: string;
  anamnesis_template?: string;
  objective_template?: string;
  recommendations_template?: string;
  rom_norm_preset?: any;
  template_json?: any;
  tests: TemplateTestItem[];
  diagnostics: TemplateDiagnosticItem[];
  prescriptions?: PrescriptionItem[];
}

const JOINT_OPTIONS = [
  { key: 'all', label: 'Все суставы (7)', color: '#0F3C64' },
  { key: 'knee', label: 'Коленный', color: '#156C9C' },
  { key: 'elbow', label: 'Локтевой', color: '#E65100' },
  { key: 'shoulder', label: 'Плечевой', color: '#6A1B9A' },
  { key: 'hip', label: 'Тазобедренный', color: '#2E7D32' },
  { key: 'ankle', label: 'Стопа/Голеностоп', color: '#00838F' },
  { key: 'wrist', label: 'Кисть/Запястье', color: '#AD1457' },
  { key: 'spine', label: 'Позвоночник', color: '#455A64' },
];

export default function OrthoTemplatesManager() {
  const navigate = useNavigate();

  // Mode: Templates vs Diagnostic Methods Catalog vs Orthopedic Tests Catalog
  const [viewMode, setViewMode] = useState<'templates' | 'diagnostics' | 'tests'>('templates');

  // Master List State
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJointFilter, setSelectedJointFilter] = useState('all');
  const [selectedClusterFilter, setSelectedClusterFilter] = useState('all');
  const [groupByCluster, setGroupByCluster] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  // Detail Form State
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<FullTemplate | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });

  // Catalogs Cache
  const [testCatalog, setTestCatalog] = useState<OrthoTestCatalogItem[]>([]);
  const [diagCatalog, setDiagCatalog] = useState<DiagnosticMethodCatalogItem[]>([]);

  // Dialogs
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [diagModalOpen, setDiagModalOpen] = useState(false);
  const [methodInfoModal, setMethodInfoModal] = useState<OrthoTestCatalogItem | null>(null);

  // Load Catalogs on Mount
  useEffect(() => {
    fetchCatalogs();
    fetchTemplates();
  }, []);

  const fetchCatalogs = async () => {
    try {
      const [testsRes, diagsRes] = await Promise.all([
        fetch('/api/ortho/tests/catalog'),
        fetch('/api/ortho/diagnostics/catalog')
      ]);
      const testsData = await testsRes.json();
      const diagsData = await diagsRes.json();
      if (testsData.success) setTestCatalog(testsData.tests || []);
      if (diagsData.success) setDiagCatalog(diagsData.diagnostics || []);
    } catch (e) {
      console.error('Failed to load catalogs:', e);
    }
  };

  const fetchTemplates = async () => {
    setLoadingList(true);
    try {
      const res = await fetch('/api/ortho/templates/detailed');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates || []);
        if (data.templates && data.templates.length > 0 && !selectedTemplateId) {
          loadTemplateDetail(data.templates[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load templates:', e);
    } finally {
      setLoadingList(false);
    }
  };

  const loadTemplateDetail = async (id: number) => {
    setLoadingDetail(true);
    setSelectedTemplateId(id);
    setSaveStatus({ type: '', message: '' });
    try {
      const res = await fetch(`/api/ortho/templates/${id}/full`);
      const data = await res.json();
      if (data.success && data.template) {
        const t = data.template;
        let parsedJson: any = {};
        try {
          parsedJson = typeof t.template_json === 'string' ? JSON.parse(t.template_json) : t.template_json;
        } catch {
          parsedJson = {};
        }

        let parsedRom: any = {};
        try {
          parsedRom = typeof t.rom_norm_preset === 'string' ? JSON.parse(t.rom_norm_preset) : t.rom_norm_preset;
        } catch {
          parsedRom = parsedJson.rom || {};
        }

        setCurrentTemplate({
          id: t.id,
          title: t.title,
          joint_name: t.joint_name || 'knee',
          default_mkb_code: t.default_mkb_code || '',
          category: t.category || 'Дегенеративно-дистрофические заболевания',
          cluster_id: t.cluster_id || 'cluster_knee',
          cluster_name: t.cluster_name || '',
          stage_or_severity: t.stage_or_severity || '',
          clinical_tags: t.clinical_tags || '',
          default_side: t.default_side || 'right',
          complaints_template: t.complaints_template || parsedJson.complaints || '',
          anamnesis_template: t.anamnesis_template || parsedJson.anamnesis || '',
          objective_template: t.objective_template || parsedJson.objective || '',
          recommendations_template: t.recommendations_template || (parsedJson.recommendations || ''),
          rom_norm_preset: parsedRom,
          tests: t.tests || [],
          diagnostics: t.diagnostics || [],
          prescriptions: parsedJson.prescriptions || []
        });
      }
    } catch (e) {
      console.error('Failed to load template detail:', e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreateNew = () => {
    const targetClusterId = selectedClusterFilter !== 'all' ? selectedClusterFilter : 'cluster_knee';
    const foundCluster = MASTER_CLUSTERS.find(c => c.id === targetClusterId);

    const newTpl: FullTemplate = {
      title: 'Новый клинический шаблон',
      joint_name: selectedJointFilter !== 'all' ? selectedJointFilter : (foundCluster?.joint_affinity !== 'all' && foundCluster?.joint_affinity !== 'general' ? foundCluster.joint_affinity : 'knee'),
      default_mkb_code: 'M17.1',
      category: 'Дегенеративно-дистрофические заболевания',
      cluster_id: targetClusterId,
      cluster_name: foundCluster?.name_ru || '1. Коленный сустав',
      stage_or_severity: '',
      clinical_tags: '',
      default_side: 'right',
      complaints_template: '',
      anamnesis_template: '',
      objective_template: '',
      recommendations_template: '',
      rom_norm_preset: { flexion_active: 130, flexion_passive: 140, extension_deficit: 0 },
      tests: [],
      diagnostics: [],
      prescriptions: []
    };
    setSelectedTemplateId(null);
    setCurrentTemplate(newTpl);
    setActiveTab(0);
    setSaveStatus({ type: '', message: '' });
  };

  const handleSave = async () => {
    if (!currentTemplate) return;
    try {
      const payload = {
        title: currentTemplate.title,
        joint_name: currentTemplate.joint_name,
        default_mkb_code: currentTemplate.default_mkb_code,
        category: currentTemplate.category,
        cluster_id: currentTemplate.cluster_id,
        cluster_name: currentTemplate.cluster_name,
        stage_or_severity: currentTemplate.stage_or_severity,
        clinical_tags: currentTemplate.clinical_tags,
        default_side: currentTemplate.default_side,
        complaints_template: currentTemplate.complaints_template,
        anamnesis_template: currentTemplate.anamnesis_template,
        objective_template: currentTemplate.objective_template,
        rom_norm_preset: currentTemplate.rom_norm_preset,
        recommendations_template: currentTemplate.recommendations_template,
        template_json: {
          complaints: currentTemplate.complaints_template,
          anamnesis: currentTemplate.anamnesis_template,
          objective: currentTemplate.objective_template,
          rom: currentTemplate.rom_norm_preset,
          prescriptions: currentTemplate.prescriptions
        },
        tests: currentTemplate.tests,
        diagnostics: currentTemplate.diagnostics
      };

      let url = '/api/ortho/templates';
      let method = 'POST';

      if (currentTemplate.id) {
        url = `/api/ortho/templates/${currentTemplate.id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setSaveStatus({ type: 'success', message: 'Шаблон успешно сохранен в базе данных!' });
        await fetchTemplates();
        if (data.id) {
          loadTemplateDetail(data.id);
        }
      } else {
        setSaveStatus({ type: 'error', message: data.error || 'Ошибка при сохранении' });
      }
    } catch (e: any) {
      setSaveStatus({ type: 'error', message: e.message || 'Ошибка сети' });
    }
  };

  const handleClone = async () => {
    if (!currentTemplate?.id) return;
    try {
      const res = await fetch(`/api/ortho/templates/${currentTemplate.id}/clone`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSaveStatus({ type: 'success', message: 'Шаблон успешно дублирован!' });
        await fetchTemplates();
        if (data.id) {
          loadTemplateDetail(data.id);
        }
      }
    } catch (e: any) {
      setSaveStatus({ type: 'error', message: e.message || 'Ошибка при клонировании' });
    }
  };

  const handleDelete = async () => {
    if (!currentTemplate?.id) return;
    if (!window.confirm(`Вы уверены, что хотите переместить шаблон "${currentTemplate.title}" в архив?`)) return;

    try {
      const res = await fetch(`/api/ortho/templates/${currentTemplate.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSaveStatus({ type: 'success', message: 'Шаблон перемещен в архив' });
        await fetchTemplates();
      }
    } catch (e: any) {
      setSaveStatus({ type: 'error', message: e.message || 'Ошибка удаления' });
    }
  };

  // Tests handlers
  const handleAddTestToTemplate = (test: OrthoTestCatalogItem) => {
    if (!currentTemplate) return;
    if (currentTemplate.tests.some(t => t.test_code === test.code)) return;

    const newTest: TemplateTestItem = {
      test_code: test.code,
      expected_result: 'positive',
      is_mandatory: 1,
      sort_order: (currentTemplate.tests.length + 1) * 10,
      name_ru: test.name_ru,
      name_lat: test.name_lat,
      target_structure: test.target_structure,
      methodology: test.methodology,
      positive_criteria: test.positive_criteria,
      sensitivity_specificity: test.sensitivity_specificity
    };

    setCurrentTemplate({
      ...currentTemplate,
      tests: [...currentTemplate.tests, newTest]
    });
    setTestModalOpen(false);
  };

  const handleRemoveTest = (testCode: string) => {
    if (!currentTemplate) return;
    setCurrentTemplate({
      ...currentTemplate,
      tests: currentTemplate.tests.filter(t => t.test_code !== testCode)
    });
  };

  const handleUpdateTestExpected = (testCode: string, expected: string) => {
    if (!currentTemplate) return;
    setCurrentTemplate({
      ...currentTemplate,
      tests: currentTemplate.tests.map(t => t.test_code === testCode ? { ...t, expected_result: expected } : t)
    });
  };

  const handleToggleTestMandatory = (testCode: string) => {
    if (!currentTemplate) return;
    setCurrentTemplate({
      ...currentTemplate,
      tests: currentTemplate.tests.map(t => t.test_code === testCode ? { ...t, is_mandatory: t.is_mandatory ? 0 : 1 } : t)
    });
  };

  const handleSetAllTestsNormal = () => {
    if (!currentTemplate) return;
    setCurrentTemplate({
      ...currentTemplate,
      tests: currentTemplate.tests.map(t => ({ ...t, expected_result: 'negative' }))
    });
  };

  // Diagnostics handlers
  const handleAddDiagToTemplate = (diag: DiagnosticMethodCatalogItem) => {
    if (!currentTemplate) return;
    if (currentTemplate.diagnostics.some(d => d.diagnostic_code === diag.code)) return;

    const newDiag: TemplateDiagnosticItem = {
      diagnostic_code: diag.code,
      urgency: 'routine',
      default_side: currentTemplate.default_side || 'affected',
      is_primary: 1,
      sort_order: (currentTemplate.diagnostics.length + 1) * 10,
      name: diag.name,
      modality: diag.modality,
      servdict_price: diag.servdict_price,
      protocol_phrase: diag.protocol_phrase
    };

    setCurrentTemplate({
      ...currentTemplate,
      diagnostics: [...currentTemplate.diagnostics, newDiag]
    });
    setDiagModalOpen(false);
  };

  const handleRemoveDiag = (diagCode: string) => {
    if (!currentTemplate) return;
    setCurrentTemplate({
      ...currentTemplate,
      diagnostics: currentTemplate.diagnostics.filter(d => d.diagnostic_code !== diagCode)
    });
  };

  // Cluster counts map
  const clusterCounts = useMemo(() => {
    const counts: Record<string, number> = { all: templates.length };
    templates.forEach(t => {
      if (t.cluster_id) {
        counts[t.cluster_id] = (counts[t.cluster_id] || 0) + 1;
      }
    });
    return counts;
  }, [templates]);

  // Filtered Templates for Left Master Panel
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchCluster = selectedClusterFilter === 'all' || t.cluster_id === selectedClusterFilter;
      const matchJoint = selectedJointFilter === 'all' || t.joint_name === selectedJointFilter;
      const query = searchQuery.trim().toLowerCase();
      const matchSearch = !query ||
        (t.title && t.title.toLowerCase().includes(query)) ||
        (t.default_mkb_code && t.default_mkb_code.toLowerCase().includes(query)) ||
        (t.stage_or_severity && t.stage_or_severity.toLowerCase().includes(query)) ||
        (t.cluster_name && t.cluster_name.toLowerCase().includes(query));
      return matchCluster && matchJoint && matchSearch;
    });
  }, [templates, selectedClusterFilter, selectedJointFilter, searchQuery]);

  // Grouped templates for Cluster-Accordion view
  const groupedTemplates = useMemo(() => {
    if (!groupByCluster) return null;
    const groups: { cluster: MasterCluster; items: any[] }[] = [];
    MASTER_CLUSTERS.filter(c => c.id !== 'all').forEach(cluster => {
      const items = filteredTemplates.filter(t => t.cluster_id === cluster.id);
      if (items.length > 0) {
        groups.push({ cluster, items });
      }
    });
    const unclustered = filteredTemplates.filter(t => !t.cluster_id || !MASTER_CLUSTERS.some(c => c.id === t.cluster_id));
    if (unclustered.length > 0) {
      groups.push({
        cluster: { id: 'other', code: 'OTHER', name_ru: 'Прочие нозологии', joint_affinity: 'all', badge_color: '#64748B', sort_order: 999 },
        items: unclustered
      });
    }
    return groups;
  }, [filteredTemplates, groupByCluster]);

  return (
    <Box sx={{ p: 2 }}>
      {/* Top Banner Navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={() => navigate('/ortho-workstation')}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            В АРМ Врача
          </Button>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F3C64', display: 'flex', alignItems: 'center', gap: 1 }}>
              <BrainIcon color="primary" /> Справочник клинических шаблонов и протоколов 2.0
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Управление эталонными нозологиями, ортопедическими тестами и пресетами аппаратного обследования
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            size="small"
            onChange={(_, val) => val && setViewMode(val)}
            sx={{ bgcolor: '#F1F5F9', p: 0.3, borderRadius: 2 }}
          >
            <ToggleButton
              value="templates"
              sx={{
                fontWeight: 700,
                px: 2,
                py: 0.6,
                textTransform: 'none',
                fontSize: '0.82rem',
                border: 'none',
                borderRadius: '6px !important',
                '&.Mui-selected': { bgcolor: '#FFFFFF', color: '#0F3C64', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
              }}
            >
              <ArticleIcon sx={{ fontSize: 18, mr: 0.75 }} /> Шаблоны протоколов ({templates.length})
            </ToggleButton>
            <ToggleButton
              value="diagnostics"
              sx={{
                fontWeight: 700,
                px: 2,
                py: 0.6,
                textTransform: 'none',
                fontSize: '0.82rem',
                border: 'none',
                borderRadius: '6px !important',
                '&.Mui-selected': { bgcolor: '#FFFFFF', color: '#0284C7', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
              }}
            >
              <BiotechIcon sx={{ fontSize: 18, mr: 0.75 }} /> Методы диагностики ({diagCatalog.length})
            </ToggleButton>
            <ToggleButton
              value="tests"
              sx={{
                fontWeight: 700,
                px: 2,
                py: 0.6,
                textTransform: 'none',
                fontSize: '0.82rem',
                border: 'none',
                borderRadius: '6px !important',
                '&.Mui-selected': { bgcolor: '#FFFFFF', color: '#166534', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
              }}
            >
              <HealingIcon sx={{ fontSize: 18, mr: 0.75 }} /> Ортопедические тесты ({testCatalog.length})
            </ToggleButton>
          </ToggleButtonGroup>

          {viewMode === 'templates' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              onClick={handleCreateNew}
              sx={{ fontWeight: 600, textTransform: 'none', whiteSpace: 'nowrap' }}
            >
              Создать шаблон
            </Button>
          )}

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => { fetchCatalogs(); fetchTemplates(); }}
            sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
          >
            Обновить
          </Button>

          <Button
            variant="contained"
            startIcon={<ManualIcon />}
            onClick={() => navigate('/guide?section=section-ortho-templates')}
            sx={{
              bgcolor: '#0F3C64',
              '&:hover': { bgcolor: '#156C9C' },
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              whiteSpace: 'nowrap'
            }}
          >
            Инструкция к справочнику
          </Button>
        </Box>
      </Box>

      {viewMode === 'diagnostics' ? (
        <DiagnosticMethodsCatalogManager onCatalogChanged={() => { fetchCatalogs(); fetchTemplates(); }} />
      ) : viewMode === 'tests' ? (
        <OrthopedicTestsCatalogManager onCatalogChanged={() => { fetchCatalogs(); fetchTemplates(); }} />
      ) : (
        <>
          {/* Notifications */}
          {saveStatus.message && (
            <Alert
              severity={saveStatus.type as any}
              onClose={() => setSaveStatus({ type: '', message: '' })}
              sx={{ mb: 2 }}
            >
              {saveStatus.message}
            </Alert>
          )}

          {/* 10 Master Clusters Horizontal Carousel / Strip */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2,
              p: 1.25,
              bgcolor: '#FFFFFF',
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: '1px solid #E2E8F0',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              '&::-webkit-scrollbar': { height: 5 },
              '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: 3 }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, pl: 0.5, pr: 1, borderRight: '1px solid #E2E8F0', flexShrink: 0 }}>
              <LayersIcon sx={{ fontSize: 18, color: '#0F3C64' }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F3C64', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Кластеры:
              </Typography>
            </Box>

            {MASTER_CLUSTERS.map(c => {
              const isSelected = selectedClusterFilter === c.id;
              const count = clusterCounts[c.id] || 0;
              return (
                <Chip
                  key={c.id}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      {c.id !== 'all' && (
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: isSelected ? '#FFFFFF' : c.badge_color }} />
                      )}
                      <span>{c.name_ru}</span>
                      <span
                        style={{
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                          padding: '1px 6px',
                          borderRadius: 10,
                          fontSize: '0.7rem',
                          fontWeight: 800
                        }}
                      >
                        {count}
                      </span>
                    </Box>
                  }
                  clickable
                  size="small"
                  onClick={() => setSelectedClusterFilter(c.id)}
                  sx={{
                    fontWeight: isSelected ? 800 : 600,
                    fontSize: '0.76rem',
                    height: 30,
                    px: 0.5,
                    flexShrink: 0,
                    color: isSelected ? '#FFFFFF' : '#334155',
                    bgcolor: isSelected ? c.badge_color : '#F8FAFC',
                    border: `1px solid ${isSelected ? c.badge_color : '#E2E8F0'}`,
                    transition: 'all 0.15s',
                    '&:hover': {
                      bgcolor: isSelected ? c.badge_color : '#E2E8F0'
                    }
                  }}
                />
              );
            })}
          </Box>

          {/* Master-Detail Split Grid */}
          <Grid container spacing={2}>
            {/* LEFT MASTER PANEL: Templates Tree / List */}
            <Grid size={{ xs: 12, md: 4, lg: 3.5 }}>
              <Paper sx={{ p: 2, height: 'calc(100vh - 190px)', display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
                {/* Search Input */}
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Поиск по названию, МКБ, стадии..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                      endAdornment: searchQuery ? (
                        <IconButton size="small" onClick={() => setSearchQuery('')}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      ) : undefined
                    }
                  }}
                  sx={{ mb: 1.25 }}
                />

                {/* Joint Filter Badges */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.25 }}>
                  {JOINT_OPTIONS.map(j => (
                    <Chip
                      key={j.key}
                      label={j.label}
                      size="small"
                      clickable
                      color={selectedJointFilter === j.key ? 'primary' : 'default'}
                      variant={selectedJointFilter === j.key ? 'filled' : 'outlined'}
                      onClick={() => setSelectedJointFilter(j.key)}
                      sx={{ fontSize: '0.7rem', height: 22 }}
                    />
                  ))}
                </Box>

                {/* Header Controls: Count & Group toggle */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, pb: 0.75, borderBottom: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>
                    Найдено: <b>{filteredTemplates.length}</b> из {templates.length}
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={groupByCluster ? <ArticleIcon sx={{ fontSize: 14 }} /> : <LayersIcon sx={{ fontSize: 14 }} />}
                    onClick={() => setGroupByCluster(prev => !prev)}
                    sx={{ textTransform: 'none', fontSize: '0.72rem', py: 0, px: 0.75, fontWeight: 700 }}
                  >
                    {groupByCluster ? 'Списком' : 'По кластерам'}
                  </Button>
                </Box>

                {/* Templates List */}
                <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5 }}>
                  {loadingList ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress size={32} />
                    </Box>
                  ) : filteredTemplates.length === 0 ? (
                    <Box sx={{ textAlign: 'center', p: 3 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Шаблоны не найдены
                      </Typography>
                      {(selectedClusterFilter !== 'all' || selectedJointFilter !== 'all' || searchQuery) && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setSelectedClusterFilter('all');
                            setSelectedJointFilter('all');
                            setSearchQuery('');
                          }}
                          sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                        >
                          Сбросить фильтры
                        </Button>
                      )}
                    </Box>
                  ) : groupByCluster && groupedTemplates ? (
                    groupedTemplates.map(grp => (
                      <Box key={grp.cluster.id} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, px: 0.5 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: grp.cluster.badge_color }} />
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {grp.cluster.name_ru}
                          </Typography>
                          <Chip
                            label={grp.items.length}
                            size="small"
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, bgcolor: '#F1F5F9' }}
                          />
                        </Box>
                        {grp.items.map(t => {
                          const isSelected = selectedTemplateId === t.id;
                          const cluster = MASTER_CLUSTERS.find(c => c.id === t.cluster_id) || grp.cluster;
                          const clusterColor = cluster?.badge_color || '#94A3B8';
                          return (
                            <Card
                              key={t.id}
                              variant="outlined"
                              onClick={() => loadTemplateDetail(t.id)}
                              sx={{
                                mb: 1,
                                cursor: 'pointer',
                                borderRadius: 1.5,
                                borderColor: isSelected ? '#156C9C' : '#E2E8F0',
                                borderLeft: `4px solid ${clusterColor}`,
                                borderWidth: isSelected ? 2 : 1,
                                bgcolor: isSelected ? '#F0F7FF' : '#FFFFFF',
                                transition: 'all 0.15s ease-in-out',
                                '&:hover': {
                                  borderColor: '#156C9C',
                                  transform: 'translateY(-1px)',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                                }
                              }}
                            >
                              <CardContent sx={{ p: '10px !important' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Chip
                                      label={cluster?.code || 'CL'}
                                      size="small"
                                      sx={{
                                        bgcolor: clusterColor,
                                        color: '#fff',
                                        fontSize: '0.62rem',
                                        fontWeight: 800,
                                        height: 18,
                                        borderRadius: '4px'
                                      }}
                                    />
                                    <Chip
                                      label={t.default_mkb_code || 'Без МКБ'}
                                      size="small"
                                      sx={{
                                        fontWeight: 700,
                                        fontSize: '0.68rem',
                                        height: 18,
                                        bgcolor: isSelected ? '#156C9C' : '#F1F5F9',
                                        color: isSelected ? '#fff' : '#334155'
                                      }}
                                    />
                                  </Box>
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                    {t.joint_name}
                                  </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', mb: 0.5, lineHeight: 1.3 }}>
                                  {t.title}
                                </Typography>
                                {t.stage_or_severity && (
                                  <Typography variant="caption" sx={{ display: 'block', color: '#0284C7', fontWeight: 600, mb: 0.5, fontSize: '0.68rem' }}>
                                    {t.stage_or_severity}
                                  </Typography>
                                )}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                    <Chip
                                      label={`${t.tests_count || 0} тестов`}
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontSize: '0.62rem', height: 18, borderColor: '#CBD5E1' }}
                                    />
                                    <Chip
                                      label={`${t.diagnostics_count || 0} диагн.`}
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontSize: '0.62rem', height: 18, borderColor: '#CBD5E1' }}
                                    />
                                  </Box>
                                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#94A3B8' }}>
                                    #{t.id}
                                  </Typography>
                                </Box>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </Box>
                    ))
                  ) : (
                    filteredTemplates.map(t => {
                      const isSelected = selectedTemplateId === t.id;
                      const cluster = MASTER_CLUSTERS.find(c => c.id === t.cluster_id);
                      const clusterColor = cluster?.badge_color || '#94A3B8';
                      return (
                        <Card
                          key={t.id}
                          variant="outlined"
                          onClick={() => loadTemplateDetail(t.id)}
                          sx={{
                            mb: 1,
                            cursor: 'pointer',
                            borderRadius: 1.5,
                            borderColor: isSelected ? '#156C9C' : '#E2E8F0',
                            borderLeft: `4px solid ${clusterColor}`,
                            borderWidth: isSelected ? 2 : 1,
                            bgcolor: isSelected ? '#F0F7FF' : '#FFFFFF',
                            transition: 'all 0.15s ease-in-out',
                            '&:hover': {
                              borderColor: '#156C9C',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                            }
                          }}
                        >
                          <CardContent sx={{ p: '10px !important' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Chip
                                  label={cluster?.code || 'CL'}
                                  size="small"
                                  sx={{
                                    bgcolor: clusterColor,
                                    color: '#fff',
                                    fontSize: '0.62rem',
                                    fontWeight: 800,
                                    height: 18,
                                    borderRadius: '4px'
                                  }}
                                />
                                <Chip
                                  label={t.default_mkb_code || 'Без МКБ'}
                                  size="small"
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: '0.68rem',
                                    height: 18,
                                    bgcolor: isSelected ? '#156C9C' : '#F1F5F9',
                                    color: isSelected ? '#fff' : '#334155'
                                  }}
                                />
                              </Box>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                {t.joint_name}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', mb: 0.5, lineHeight: 1.3 }}>
                              {t.title}
                            </Typography>
                            {t.stage_or_severity && (
                              <Typography variant="caption" sx={{ display: 'block', color: '#0284C7', fontWeight: 600, mb: 0.5, fontSize: '0.68rem' }}>
                                {t.stage_or_severity}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <Chip
                                  label={`${t.tests_count || 0} тестов`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.62rem', height: 18, borderColor: '#CBD5E1' }}
                                />
                                <Chip
                                  label={`${t.diagnostics_count || 0} диагн.`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.62rem', height: 18, borderColor: '#CBD5E1' }}
                                />
                              </Box>
                              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#94A3B8' }}>
                                #{t.id}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </Box>
              </Paper>
            </Grid>

        {/* RIGHT DETAIL PANEL: Editor & Live Preview */}
        <Grid size={{ xs: 12, md: 8, lg: 8.5 }}>
          <Paper sx={{ p: 2.5, height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column', borderRadius: 2, overflowY: 'auto' }}>
            {loadingDetail ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : !currentTemplate ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="h6" color="text.secondary">
                  Выберите шаблон слева или нажмите «Создать шаблон»
                </Typography>
              </Box>
            ) : (
              <>
                {/* Header Action Bar */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, pb: 1.5, borderBottom: '1px solid #E2E8F0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                      {currentTemplate.id ? `Редактирование: ${currentTemplate.title}` : 'Новый клинический шаблон'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {currentTemplate.id && (
                      <>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<CloneIcon />}
                          onClick={handleClone}
                          sx={{ textTransform: 'none' }}
                        >
                          Клонировать
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={handleDelete}
                          sx={{ textTransform: 'none' }}
                        >
                          В архив
                        </Button>
                      </>
                    )}
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      sx={{ fontWeight: 700, textTransform: 'none', px: 2.5 }}
                    >
                      Сохранить шаблон
                    </Button>
                  </Box>
                </Box>

                {/* Primary Metadata Form */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Название клинического шаблона"
                      size="small"
                      fullWidth
                      required
                      value={currentTemplate.title}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, title: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Клинический кластер (1 из 10)</InputLabel>
                      <Select
                        label="Клинический кластер (1 из 10)"
                        value={currentTemplate.cluster_id || 'cluster_knee'}
                        onChange={(e) => {
                          const val = e.target.value;
                          const found = MASTER_CLUSTERS.find(c => c.id === val);
                          setCurrentTemplate({
                            ...currentTemplate,
                            cluster_id: val,
                            cluster_name: found ? found.name_ru : currentTemplate.cluster_name
                          });
                        }}
                      >
                        {MASTER_CLUSTERS.filter(c => c.id !== 'all').map(c => (
                          <MenuItem key={c.id} value={c.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.badge_color, flexShrink: 0 }} />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.name_ru}</Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', ml: 'auto' }}>[{c.code}]</Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Анатомический сустав</InputLabel>
                      <Select
                        label="Анатомический сустав"
                        value={currentTemplate.joint_name}
                        onChange={(e) => setCurrentTemplate({ ...currentTemplate, joint_name: e.target.value })}
                      >
                        <MenuItem value="knee">Коленный сустав (Knee)</MenuItem>
                        <MenuItem value="elbow">Локтевой сустав (Elbow)</MenuItem>
                        <MenuItem value="shoulder">Плечевой сустав (Shoulder)</MenuItem>
                        <MenuItem value="hip">Тазобедренный сустав (Hip)</MenuItem>
                        <MenuItem value="ankle">Стопа и голеностоп (Ankle/Foot)</MenuItem>
                        <MenuItem value="wrist">Лучезапястный и кисть (Wrist/Hand)</MenuItem>
                        <MenuItem value="spine">Позвоночник (Spine)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      label="Код МКБ-10"
                      size="small"
                      fullWidth
                      value={currentTemplate.default_mkb_code || ''}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, default_mkb_code: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Сторона по умолчанию</InputLabel>
                      <Select
                        label="Сторона по умолчанию"
                        value={currentTemplate.default_side || 'right'}
                        onChange={(e) => setCurrentTemplate({ ...currentTemplate, default_side: e.target.value })}
                      >
                        <MenuItem value="right">Правая (Right)</MenuItem>
                        <MenuItem value="left">Левая (Left)</MenuItem>
                        <MenuItem value="bilateral">Двусторонний процесс</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      label="Стадия / Степень / Фаза"
                      size="small"
                      fullWidth
                      placeholder="Напр. II стадия, подострое"
                      value={currentTemplate.stage_or_severity || ''}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, stage_or_severity: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 12 }}>
                    <TextField
                      label="Клиническая категория / Нозологическая группа"
                      size="small"
                      fullWidth
                      value={currentTemplate.category || ''}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, category: e.target.value })}
                    />
                  </Grid>
                </Grid>

                {/* Tabs Bar */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                    <Tab label="1. Жалобы и Объективно" icon={<HospitalIcon fontSize="small" />} iconPosition="start" />
                    <Tab label="2. Гониометрия ROM" icon={<RomIcon fontSize="small" />} iconPosition="start" />
                    <Tab
                      label={
                        <Badge badgeContent={currentTemplate.tests.length} color="primary" sx={{ pr: 1 }}>
                          3. Ортопедические тесты
                        </Badge>
                      }
                      icon={<HealingIcon fontSize="small" />}
                      iconPosition="start"
                    />
                    <Tab
                      label={
                        <Badge badgeContent={currentTemplate.diagnostics.length} color="secondary" sx={{ pr: 1 }}>
                          4. Диагностика
                        </Badge>
                      }
                      icon={<BiotechIcon fontSize="small" />}
                      iconPosition="start"
                    />
                    <Tab label="5. Назначения и Услуги" icon={<HospitalIcon fontSize="small" />} iconPosition="start" />
                    <Tab label="6. Предпросмотр протокола А4" icon={<PreviewIcon fontSize="small" />} iconPosition="start" />
                  </Tabs>
                </Box>

                {/* TAB 0: Complaints, Anamnesis & Objective */}
                {activeTab === 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Эталонные жалобы пациента"
                      multiline
                      rows={3}
                      fullWidth
                      value={currentTemplate.complaints_template || ''}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, complaints_template: e.target.value })}
                      placeholder="Боль по передней поверхности колена при нагрузке, спуске по лестнице..."
                    />
                    <TextField
                      label="Анамнез заболевания"
                      multiline
                      rows={2.5}
                      fullWidth
                      value={currentTemplate.anamnesis_template || ''}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, anamnesis_template: e.target.value })}
                      placeholder="Боли нарастали в течение 3 месяцев после физической нагрузки..."
                    />
                    <TextField
                      label="Объективный локальный статус"
                      multiline
                      rows={3}
                      fullWidth
                      value={currentTemplate.objective_template || ''}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, objective_template: e.target.value })}
                      placeholder="Умеренный отек, болезненность суставной щели..."
                    />
                    <TextField
                      label="Рекомендации и консервативное лечение"
                      multiline
                      rows={2.5}
                      fullWidth
                      value={currentTemplate.recommendations_template || ''}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, recommendations_template: e.target.value })}
                      placeholder="Ограничение ударных нагрузок, эластичное бинтование, гимнастика..."
                    />
                  </Box>
                )}

                {/* TAB 1: ROM Goniometry */}
                {activeTab === 1 && (
                  <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                      Целевые углы биомеханики сустава (Neutral-0 ROM) для шаблона:
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <TextField
                          label="Активное сгибание (°)"
                          type="number"
                          size="small"
                          fullWidth
                          value={currentTemplate.rom_norm_preset?.flexion_active ?? 130}
                          onChange={(e) => setCurrentTemplate({
                            ...currentTemplate,
                            rom_norm_preset: { ...currentTemplate.rom_norm_preset, flexion_active: Number(e.target.value) }
                          })}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <TextField
                          label="Пассивное сгибание (°)"
                          type="number"
                          size="small"
                          fullWidth
                          value={currentTemplate.rom_norm_preset?.flexion_passive ?? 140}
                          onChange={(e) => setCurrentTemplate({
                            ...currentTemplate,
                            rom_norm_preset: { ...currentTemplate.rom_norm_preset, flexion_passive: Number(e.target.value) }
                          })}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <TextField
                          label="Дефицит разгибания (°)"
                          type="number"
                          size="small"
                          fullWidth
                          value={currentTemplate.rom_norm_preset?.extension_deficit ?? 0}
                          onChange={(e) => setCurrentTemplate({
                            ...currentTemplate,
                            rom_norm_preset: { ...currentTemplate.rom_norm_preset, extension_deficit: Number(e.target.value) }
                          })}
                        />
                      </Grid>
                      {currentTemplate.joint_name === 'elbow' && (
                        <>
                          <Grid size={{ xs: 6, sm: 4 }}>
                            <TextField
                              label="Супинация (°)"
                              type="number"
                              size="small"
                              fullWidth
                              value={currentTemplate.rom_norm_preset?.rotation_ext ?? 85}
                              onChange={(e) => setCurrentTemplate({
                                ...currentTemplate,
                                rom_norm_preset: { ...currentTemplate.rom_norm_preset, rotation_ext: Number(e.target.value) }
                              })}
                            />
                          </Grid>
                          <Grid size={{ xs: 6, sm: 4 }}>
                            <TextField
                              label="Пронация (°)"
                              type="number"
                              size="small"
                              fullWidth
                              value={currentTemplate.rom_norm_preset?.rotation_int ?? 85}
                              onChange={(e) => setCurrentTemplate({
                                ...currentTemplate,
                                rom_norm_preset: { ...currentTemplate.rom_norm_preset, rotation_int: Number(e.target.value) }
                              })}
                            />
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </Box>
                )}

                {/* TAB 2: Orthopedic Tests */}
                {activeTab === 2 && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Специальные ортопедические тесты шаблона ({currentTemplate.tests.length})
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={handleSetAllTestsNormal}
                          sx={{ textTransform: 'none' }}
                        >
                          Все в норму (-)
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => setTestModalOpen(true)}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Добавить тест из каталога
                        </Button>
                      </Box>
                    </Box>

                    {currentTemplate.tests.length === 0 ? (
                      <Alert severity="info">В данном шаблоне нет привязанных ортопедических тестов. Нажмите «Добавить тест из каталога».</Alert>
                    ) : (
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700 }}>Тест / Проба</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Структура-мишень</TableCell>
                              <TableCell sx={{ fontWeight: 700, width: 170 }}>Ожидаемый результат</TableCell>
                              <TableCell sx={{ fontWeight: 700, width: 120 }}>Обязательный</TableCell>
                              <TableCell sx={{ fontWeight: 700, width: 70 }} align="center">Инфо</TableCell>
                              <TableCell sx={{ fontWeight: 700, width: 60 }} align="center">Удалить</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {currentTemplate.tests.map((t) => (
                              <TableRow key={t.test_code} hover>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    {t.name_ru || t.test_code}
                                  </Typography>
                                  {t.name_lat && (
                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                      {t.name_lat}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Typography variant="caption" sx={{ color: '#475569' }}>
                                    {t.target_structure || 'Суставная структура'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    size="small"
                                    value={t.expected_result}
                                    onChange={(e) => handleUpdateTestExpected(t.test_code, e.target.value)}
                                    sx={{
                                      fontSize: '0.8rem',
                                      fontWeight: 700,
                                      color: t.expected_result === 'positive' || t.expected_result.includes('positive') ? '#D32F2F' : '#2E7D32'
                                    }}
                                  >
                                    <MenuItem value="positive">Положительный (+)</MenuItem>
                                    <MenuItem value="negative">Отрицательный (-)</MenuItem>
                                    <MenuItem value="positive_medial">Положительный медиально (+)</MenuItem>
                                    <MenuItem value="positive_lateral">Положительный латерально (+)</MenuItem>
                                    <MenuItem value="not_tested">Не исследовался</MenuItem>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        size="small"
                                        checked={Boolean(t.is_mandatory)}
                                        onChange={() => handleToggleTestMandatory(t.test_code)}
                                      />
                                    }
                                    label={<Typography variant="caption">{t.is_mandatory ? 'Критичен' : 'Факульт.'}</Typography>}
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <IconButton
                                    size="small"
                                    color="info"
                                    onClick={() => {
                                      const catalogItem = testCatalog.find(tc => tc.code === t.test_code);
                                      if (catalogItem) setMethodInfoModal(catalogItem);
                                    }}
                                  >
                                    <InfoIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                                <TableCell align="center">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRemoveTest(t.test_code)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                )}

                {/* TAB 3: Diagnostics Presets */}
                {activeTab === 3 && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Рекомендованный план обследования ({currentTemplate.diagnostics.length})
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => setDiagModalOpen(true)}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Добавить метод обследования
                      </Button>
                    </Box>

                    {currentTemplate.diagnostics.length === 0 ? (
                      <Alert severity="info">В данном шаблоне не назначены методы обследования. Нажмите «Добавить метод обследования».</Alert>
                    ) : (
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700 }}>Метод обследования</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Модальность</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Связанная услуга клиники</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Срочность</TableCell>
                              <TableCell sx={{ fontWeight: 700, width: 60 }} align="center">Удалить</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {currentTemplate.diagnostics.map((d) => (
                              <TableRow key={d.diagnostic_code} hover>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    {d.name || d.diagnostic_code}
                                  </Typography>
                                  {d.protocol_phrase && (
                                    <Typography variant="caption" color="text.secondary">
                                      «{d.protocol_phrase}»
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={d.modality?.toUpperCase() || 'ДИАГН'}
                                    size="small"
                                    sx={{ fontWeight: 700, fontSize: '0.68rem', height: 20 }}
                                  />
                                </TableCell>
                                <TableCell>
                                  {d.servdict_price ? (
                                    <Chip
                                      label={`${d.servdict_price.toLocaleString('ru-RU')} ₽ (в кассу)`}
                                      size="small"
                                      color="success"
                                      variant="outlined"
                                      sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                                    />
                                  ) : (
                                    <Typography variant="caption" color="text.secondary">
                                      Внешнее направление
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={d.urgency === 'cito' ? 'CITO (Экстренно)' : 'Планово'}
                                    size="small"
                                    color={d.urgency === 'cito' ? 'error' : 'default'}
                                    sx={{ fontSize: '0.7rem' }}
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRemoveDiag(d.diagnostic_code)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                )}

                {/* TAB 4: Prescriptions & Services */}
                {activeTab === 4 && (
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                      Назначенные манипуляции, физиотерапия и ортопедические изделия
                    </Typography>
                    {(!currentTemplate.prescriptions || currentTemplate.prescriptions.length === 0) ? (
                      <Alert severity="info">Нет предустановленных назначений лечения.</Alert>
                    ) : (
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700 }}>Категория</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Наименование услуги / назначения</TableCell>
                              <TableCell sx={{ fontWeight: 700 }} align="right">Стоимость</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {currentTemplate.prescriptions.map((p, idx) => (
                              <TableRow key={idx}>
                                <TableCell>
                                  <Chip
                                    label={p.category === 'manipulation' ? 'Манипуляция' : p.category === 'physio' ? 'Физиотерапия' : 'Ортопедия'}
                                    size="small"
                                    color={p.category === 'manipulation' ? 'primary' : p.category === 'physio' ? 'secondary' : 'default'}
                                    sx={{ fontSize: '0.7rem' }}
                                  />
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>{p.title}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, color: '#0F3C64' }}>
                                  {p.unit_price ? `${p.unit_price.toLocaleString('ru-RU')} ₽` : 'Бесплатно'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                )}

                {/* TAB 5: Live Protocol Preview */}
                {activeTab === 5 && (
                  <Paper sx={{ p: 3, border: '1px solid #CBD5E1', bgcolor: '#FFF', fontFamily: 'serif' }}>
                    <Box sx={{ textAlign: 'center', pb: 2, mb: 2, borderBottom: '2px solid #0F3C64' }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                        ЦЕНТР ОРТОПЕДИИ И МЕДИЦИНСКОЙ РЕАБИЛИТАЦИИ
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        ПРОТОКОЛ ПЕРВИЧНОГО ПРИЕМА ВРАЧА ТРАВМАТОЛОГА-ОРТОПЕДА
                      </Typography>
                    </Box>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Диагноз (МКБ-10):</strong> [{currentTemplate.default_mkb_code}] {currentTemplate.title} ({currentTemplate.default_side === 'right' ? 'справа' : currentTemplate.default_side === 'left' ? 'слева' : 'двусторонний'})
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Жалобы:</strong> {currentTemplate.complaints_template || 'Не указаны'}
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Анамнез заболевания:</strong> {currentTemplate.anamnesis_template || 'Не указан'}
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Объективный статус:</strong> {currentTemplate.objective_template || 'Без особенностей'}
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Гониометрия (ROM):</strong> Сгибание активное: {currentTemplate.rom_norm_preset?.flexion_active || 130}°, пассивное: {currentTemplate.rom_norm_preset?.flexion_passive || 140}°, дефицит разгибания: {currentTemplate.rom_norm_preset?.extension_deficit || 0}°.
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Специальные ортопедические тесты:</strong>
                    </Typography>
                    <Box component="ul" sx={{ pl: 3, my: 0.5 }}>
                      {currentTemplate.tests.map(t => (
                        <li key={t.test_code}>
                          <Typography variant="body2">
                            {t.name_ru || t.test_code}: <strong>{t.expected_result === 'positive' ? 'ПОЛОЖИТЕЛЬНЫЙ (+)' : t.expected_result === 'negative' ? 'ОТРИЦАТЕЛЬНЫЙ (-)' : t.expected_result}</strong>
                          </Typography>
                        </li>
                      ))}
                    </Box>

                    <Typography variant="body2" sx={{ mt: 1.5, mb: 0.5 }}>
                      <strong>План обследования:</strong>
                    </Typography>
                    <Box component="ul" sx={{ pl: 3, my: 0.5 }}>
                      {currentTemplate.diagnostics.map(d => (
                        <li key={d.diagnostic_code}>
                          <Typography variant="body2">
                            {d.protocol_phrase || d.name}
                          </Typography>
                        </li>
                      ))}
                    </Box>

                    <Typography variant="body2" sx={{ mt: 1.5, mb: 0.5 }}>
                      <strong>Назначения и лечение:</strong> {currentTemplate.recommendations_template}
                    </Typography>
                  </Paper>
                )}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
        </>
      )}

      {/* MODAL: Select Orthopedic Test from Catalog */}
      <Dialog
        open={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64' }}>
          Добавить ортопедический тест из клинического каталога
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Отображаются валидированные тесты для анатомической зоны: <strong>{currentTemplate?.joint_name?.toUpperCase()}</strong>
            </Typography>
          </Box>
          <Grid container spacing={1.5}>
            {testCatalog
              .filter(tc => !currentTemplate?.tests.some(t => t.test_code === tc.code))
              .map(tc => {
                const isMatchingJoint = tc.joint_category === currentTemplate?.joint_name;
                return (
                  <Grid size={{ xs: 12, sm: 6 }} key={tc.code}>
                    <Card
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderColor: isMatchingJoint ? '#0284C7' : '#E2E8F0',
                        bgcolor: isMatchingJoint ? '#F0F9FF' : '#FFF'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {tc.name_ru}
                        </Typography>
                        <Chip
                          label={tc.sensitivity_specificity || tc.joint_category}
                          size="small"
                          sx={{ fontSize: '0.65rem', height: 18 }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ fontStyle: 'italic', display: 'block', mb: 0.5, color: 'text.secondary' }}>
                        {tc.name_lat}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#334155' }}>
                        {tc.target_structure}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setMethodInfoModal(tc)}
                          sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                        >
                          Методика (i)
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleAddTestToTemplate(tc)}
                          sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          Добавить в шаблон
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestModalOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL: Select Diagnostic Method from Catalog */}
      <Dialog
        open={diagModalOpen}
        onClose={() => setDiagModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64' }}>
          Добавить метод инструментальной и функциональной диагностики
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={1.5}>
            {diagCatalog
              .filter(dc => !currentTemplate?.diagnostics.some(d => d.diagnostic_code === dc.code))
              .map(dc => {
                const isMatchingJoint = dc.target_joint === currentTemplate?.joint_name || dc.target_joint === 'general';
                return (
                  <Grid size={{ xs: 12, sm: 6 }} key={dc.code}>
                    <Card
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderColor: isMatchingJoint ? '#0D9488' : '#E2E8F0',
                        bgcolor: isMatchingJoint ? '#F0FDFA' : '#FFF'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {dc.name}
                        </Typography>
                        <Chip
                          label={dc.modality?.toUpperCase()}
                          size="small"
                          sx={{ fontSize: '0.65rem', height: 18 }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#334155' }}>
                        {dc.protocol_phrase}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {dc.servdict_price ? (
                          <Chip
                            label={`${dc.servdict_price.toLocaleString('ru-RU')} ₽`}
                            size="small"
                            color="success"
                            sx={{ fontWeight: 700 }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">Внешнее направление</Typography>
                        )}
                        <Button
                          size="small"
                          variant="contained"
                          color="secondary"
                          onClick={() => handleAddDiagToTemplate(dc)}
                          sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          Назначить в шаблон
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiagModalOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL: Test Methodology Info (i) */}
      <Dialog
        open={Boolean(methodInfoModal)}
        onClose={() => setMethodInfoModal(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F3C64', pb: 1 }}>
          {methodInfoModal?.name_ru}
          <Typography variant="subtitle2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
            {methodInfoModal?.name_lat}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                Анатомическая структура-мишень:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                {methodInfoModal?.target_structure}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                Пошаговая методика проведения:
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.5, color: '#1E293B' }}>
                {methodInfoModal?.methodology}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                Критерии положительной реакции теста:
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.5, color: '#B91C1C', fontWeight: 600 }}>
                {methodInfoModal?.positive_criteria}
              </Typography>
            </Box>

            {methodInfoModal?.sensitivity_specificity && (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                  Доказательные показатели точности:
                </Typography>
                <Chip
                  label={methodInfoModal.sensitivity_specificity}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ mt: 0.5, fontWeight: 700 }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMethodInfoModal(null)} variant="contained">
            Понятно
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
