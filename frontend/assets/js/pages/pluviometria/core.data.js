// assets/js/pages/pluviometria/core.data.js
(function () {
  "use strict";

  const Plv = (window.Plv = window.Plv || {});
  const data = (Plv.data = Plv.data || {});

  if (data.__initialized) return;
  data.__initialized = true;

  // ======== mock inicial (você troca por API depois) ========
  const PLUVIOS = [
    {
      id: "norte-a",
      nome: "Pluviômetro Norte A",
      sub: "Talhão 1 - Soja",
      pivos: ["Pivô Norte A", "Pivô Norte B"],
      lat: -16.7672,
      lng: -47.6134,
      status: "rain",
      statusLabel: "Chovendo agora",
      statusMeta: "há 45 min",
      mm: 12.5,
      intensidade: "Moderada",
      intensidadeMeta: "desde 07h",
      updated: "Atualizado há 32 min",
      tipo: "Báscula",
      alimentacao: "Solar",
      alimentacaoEstado: "OK",
      unidade: "mm",
      uso: { irrigacao: true, alertas: true, relatorios: true },
      model: "Davis",
      radioCentral: "0013A20041F0BC0C",
      radioControlador: "0013A200422E3C4B",
      radioGps: "0013A200422E7D7C",
      battery: 81,
      net: "4G",
      semComunicacao: false,
    },
    {
      id: "norte-b",
      nome: "Pluviômetro Norte B",
      sub: "Talhão 2 - Milho",
      pivos: ["Pivô Norte B"],
      lat: -16.7619,
      lng: -47.6029,
      status: "dry",
      statusLabel: "Tempo seco",
      statusMeta: "última chuva há 6h",
      mm: 8.2,
      intensidade: "Moderada",
      intensidadeMeta: "desde 07h",
      updated: "Atualizado há 42 min",
      tipo: "Digital",
      alimentacao: "Bateria",
      alimentacaoEstado: "OK",
      unidade: "mm/h",
      uso: { irrigacao: true, alertas: true, relatorios: true },
      model: "Davis",
      radioCentral: "0013A20041F0BC0C",
      radioControlador: "0013A200422E3C4B",
      radioGps: "0013A200422E7D7C",
      battery: 72,
      net: "RADIO",
      semComunicacao: false,
    },
    {
      id: "sul",
      nome: "Pluviômetro Sul",
      sub: "Talhão 3 - Algodão",
      pivos: ["Pivô Sul"],
      lat: -16.7744,
      lng: -47.6218,
      status: "none",
      statusLabel: "Sem chuva no momento",
      statusMeta: "última chuva há 6h",
      mm: 0.0,
      intensidade: "Sem chuva",
      intensidadeMeta: "desde 07h",
      updated: "Offline há 1 dia",
      tipo: "Estação compacta",
      alimentacao: "Bateria",
      alimentacaoEstado: "Aten\u00e7\u00e3o",
      unidade: "mm",
      uso: { irrigacao: false, alertas: true, relatorios: true },
      model: "Davis",
      radioCentral: "0013A20041F0BC0C",
      radioControlador: "0013A200422E3C4B",
      radioGps: "0013A200422E7D7C",
      battery: 12,
      net: "RADIO",
      semComunicacao: true,
    },
    {
      id: "leste",
      nome: "Pluviômetro Leste",
      sub: "Talhão 4 - Soja",
      pivos: ["Pivô Leste"],
      lat: -16.7698,
      lng: -47.5885,
      status: "none",
      statusLabel: "Sem chuva no momento",
      statusMeta: "última chuva há 6h",
      mm: 5.7,
      intensidade: "Moderada",
      intensidadeMeta: "desde 07h",
      updated: "Atualizado há 29 min",
      tipo: "Báscula",
      alimentacao: "Rede",
      alimentacaoEstado: "OK",
      unidade: "mm",
      uso: { irrigacao: true, alertas: true, relatorios: false },
      model: "Davis",
      radioCentral: "0013A20041F0BC0C",
      radioControlador: "0013A200422E3C4B",
      radioGps: "0013A200422E7D7C",
      battery: 64,
      net: "4G",
      semComunicacao: false,
    },
    {
      id: "oeste",
      nome: "Pluviômetro Oeste",
      sub: "Talhão 5 - Sorgo",
      pivos: ["Pivô Oeste"],
      lat: -16.7583,
      lng: -47.6305,
      status: "dry",
      statusLabel: "Tempo seco",
      statusMeta: "última chuva há 3h",
      mm: 3.4,
      intensidade: "Fraca",
      intensidadeMeta: "desde 08h",
      updated: "Atualizado há 18 min",
      tipo: "Báscula",
      alimentacao: "Solar",
      alimentacaoEstado: "OK",
      unidade: "mm",
      uso: { irrigacao: true, alertas: true, relatorios: true },
      model: "Davis",
      radioCentral: "0013A20041F0BC0C",
      radioControlador: "0013A200422E3C4B",
      radioGps: "0013A200422E7D7C",
      battery: 88,
      net: "4G",
      semComunicacao: false,
    },
  ];

  function slugify(text) {
    return String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  const PIVOS = Array.from(
    new Set(PLUVIOS.flatMap((p) => p.pivos || []))
  ).map((name) => ({ id: slugify(name), nome: name }));

  const PIVO_BY_NAME = new Map(PIVOS.map((p) => [p.nome, p.id]));
  PLUVIOS.forEach((p) => {
    if (!p.pivosAssoc) {
      p.pivosAssoc = (p.pivos || []).map((name) => PIVO_BY_NAME.get(name)).filter(Boolean);
    }
  });

  // Dados mock de manutenção (1 por pluviômetro)
  const PLUV_MAINTENANCE = {
    "norte-a": {
      status: "ok",
      daysRemaining: 10,
      lastDate: "08/01/2026",
      nextDate: "15/02/2026",
      progress: 72,
      confirmTitle: "Aguardando confirmação",
      confirmHint: "Pressione o botão físico no equipamento",
      frequency: "Mensal (30 dias)",
      responsible: "João Silva",
      reminderDays: 3,
      reminderEnabled: true,
      expected: "Programada",
      tagClass: "programada",
      description: "Limpeza do sensor e calibração realizada",
      meta: "1 sem. atrás",
      device_confirmed: false,
      requires_device_confirmation: true,
    },
    "norte-b": {
      status: "ok",
      daysRemaining: 6,
      lastDate: "15/01/2026",
      nextDate: "11/02/2026",
      progress: 64,
      confirmTitle: "Confirmado no dispositivo",
      confirmHint: "Última confirmação via painel",
      frequency: "Mensal (30 dias)",
      responsible: "Maria Santos",
      reminderDays: 3,
      reminderEnabled: true,
      expected: "Preventiva",
      tagClass: "preventiva",
      description: "Verificação de bateria e painel solar",
      meta: "1 sem. atrás",
      device_confirmed: true,
      requires_device_confirmation: true,
      completed_at: "2026-01-21T08:30:00Z",
    },
    "sul": {
      status: "late",
      daysRemaining: -3,
      lastDate: "25/12/2025",
      nextDate: "02/02/2026",
      progress: 100,
      confirmTitle: "Atrasada",
      confirmHint: "Substituição de bateria necessária",
      frequency: "Mensal (30 dias)",
      responsible: "Carlos Oliveira",
      reminderDays: 3,
      reminderEnabled: true,
      expected: "Corretiva",
      tagClass: "corretiva",
      description: "Substituição de bateria necessária",
      meta: "3 dias atrasado",
      device_confirmed: false,
      requires_device_confirmation: true,
    },
    "leste": {
      status: "ok",
      daysRemaining: 12,
      lastDate: "02/01/2026",
      nextDate: "17/02/2026",
      progress: 58,
      confirmTitle: "Aguardando confirmação",
      confirmHint: "Verifique limpeza do sensor",
      frequency: "Mensal (30 dias)",
      responsible: "João Silva",
      reminderDays: 3,
      reminderEnabled: false,
      expected: "Programada",
      tagClass: "programada",
      description: "Verifique limpeza do sensor",
      meta: "Agendada: 17/02/2026",
      device_confirmed: false,
      requires_device_confirmation: true,
    },
    "oeste": {
      status: "ok",
      daysRemaining: 0,
      lastDate: "06/01/2026",
      nextDate: "05/02/2026",
      progress: 100,
      confirmTitle: "Aguardando confirmação",
      confirmHint: "Pressione o botão físico no equipamento",
      frequency: "Mensal (30 dias)",
      responsible: "Mateus Freitas",
      reminderDays: 3,
      reminderEnabled: true,
      expected: "Programada",
      tagClass: "programada",
      description: "Manutenção programada para hoje",
      meta: "Agendada: 05/02/2026",
      device_confirmed: false,
      requires_device_confirmation: true,
    },
  };

  const MAINTENANCE_TYPES = [
    { id: "cleaning", label: "Limpeza do sensor de chuva" },
    { id: "preventive", label: "Inspe\u00e7\u00e3o preventiva" },
    { id: "electrical", label: "Verifica\u00e7\u00e3o el\u00e9trica" },
    { id: "mechanical", label: "Ajuste mec\u00e2nico" },
    { id: "replacement", label: "Troca de componente" },
    { id: "other", label: "Outro" },
  ];

  const MAINTENANCE_HISTORY = [
    {
      date: "08/01/2026",
      type: "Verifica\u00e7\u00e3o peri\u00f3dica",
      responsible: "Jo\u00e3o Silva",
      status: "ok",
      statusLabel: "Confirmado no dispositivo",
    },
    {
      date: "26/12/2025",
      type: "Troca de sensor",
      responsible: "Mateus Freitas",
      status: "warn",
      statusLabel: "Corretiva fora do ciclo",
    },
    {
      date: "14/11/2025",
      type: "Calibra\u00e7\u00e3o de leitura",
      responsible: "Andreia Lima",
      status: "ok",
      statusLabel: "Confirmado no dispositivo",
    },
  ];

  // Dados mock de sensores (1 por pluviômetro)
  const PLUV_SENSORS = {
    "norte-a": {
      model: "Davis",
      pulse: "0.254",
      thresholdMin: 1,
      thresholdMinMinutes: 15,
    },
    "norte-b": {
      model: "Davis",
      pulse: "0.254",
      thresholdMin: 1,
      thresholdMinMinutes: 10,
    },
    "sul": {
      model: "Davis",
      pulse: "0.200",
      thresholdMin: 0.8,
      thresholdMinMinutes: 20,
    },
    "leste": {
      model: "Davis",
      pulse: "0.254",
      thresholdMin: 1.2,
      thresholdMinMinutes: 15,
    },
    "oeste": {
      model: "Davis",
      pulse: "0.254",
      thresholdMin: 1,
      thresholdMinMinutes: 12,
    },
  };

  // Dados mock de redundância (1 por pluviômetro)
  const PLUV_REDUNDANCY = {
    "norte-a": { limit: 18, alertAuto: true },
    "norte-b": { limit: 22, alertAuto: true },
    "sul": { limit: 30, alertAuto: false },
    "leste": { limit: 15, alertAuto: true },
    "oeste": { limit: 20, alertAuto: true },
  };

  const MAINT_FREQUENCIES = [
    "Semanal (7 dias)",
    "Quinzenal (15 dias)",
    "Mensal (30 dias)",
    "Bimestral (60 dias)",
    "Trimestral (90 dias)",
    "Semestral (180 dias)",
    "Anual (365 dias)",
  ];
  const REMINDER_DAYS = [1, 2, 3, 5, 7];
  const MAINT_RESPONSIBLES = [
    "Jo\u00e3o Silva",
    "Mateus Freitas",
    "Andreia Lima",
    "Maria Santos",
    "Carlos Oliveira",
  ];
  const EDIT_TYPES = ["Báscula", "Digital", "Estação compacta"];
  const EDIT_POWER = ["Bateria", "Solar", "Rede"];
  const EDIT_UNITS = ["mm", "mm/h"];
  const EDIT_SELECTS = {
    type: { options: EDIT_TYPES, key: "tipo" },
    power: { options: EDIT_POWER, key: "alimentacao" },
    unit: { options: EDIT_UNITS, key: "unidade" },
  };

  data.PLUVIOS = PLUVIOS;
  data.PIVOS = PIVOS;
  data.PIVO_BY_NAME = PIVO_BY_NAME;
  data.PLUV_MAINTENANCE = PLUV_MAINTENANCE;
  data.MAINTENANCE_TYPES = MAINTENANCE_TYPES;
  data.MAINTENANCE_HISTORY = MAINTENANCE_HISTORY;
  data.PLUV_SENSORS = PLUV_SENSORS;
  data.PLUV_REDUNDANCY = PLUV_REDUNDANCY;
  data.MAINT_FREQUENCIES = MAINT_FREQUENCIES;
  data.REMINDER_DAYS = REMINDER_DAYS;
  data.MAINT_RESPONSIBLES = MAINT_RESPONSIBLES;
  data.EDIT_TYPES = EDIT_TYPES;
  data.EDIT_POWER = EDIT_POWER;
  data.EDIT_UNITS = EDIT_UNITS;
  data.EDIT_SELECTS = EDIT_SELECTS;

  if (window.IcFarmApplyGeo && window.IcFarmActive) {
    window.IcFarmApplyGeo(window.IcFarmActive);
  }
})();
