import type { OrthoProtocolData } from '../components/reports/OrthoProtocolPrintTemplate';

export interface IntegrityItem {
  id: string;
  partition: number;
  title: string;
  message: string;
  isCritical: boolean;
  actionText: string;
}

export interface ProtocolIntegrityReport {
  score: number; // 0 to 100
  status: 'valid' | 'warning' | 'critical';
  criticalErrors: IntegrityItem[];
  warnings: IntegrityItem[];
  passedChecks: { id: string; title: string; partition: number }[];
  summaryMessage: string;
}

/**
 * Calculates live clinical protocol integrity and completeness
 * Identifies missing legal requirements (critical) and clinical/EBM gaps (warnings)
 */
export function evaluateProtocolIntegrity(data: OrthoProtocolData): ProtocolIntegrityReport {
  const criticalErrors: IntegrityItem[] = [];
  const warnings: IntegrityItem[] = [];
  const passedChecks: { id: string; title: string; partition: number }[] = [];

  // --- 0. Patient Identity Check (Partition 0 / General) ---
  const hasPatient = Boolean(data.patient?.id && data.patient.fullName && data.patient.fullName !== 'Пациент не выбран');
  if (!hasPatient) {
    criticalErrors.push({
      id: 'crit_patient',
      partition: 1,
      title: 'Пациент не выбран',
      message: 'Для оформления протокола и ЭЦП необходимо выбрать пациента из очереди или картотеки',
      isCritical: true,
      actionText: 'Выбрать пациента'
    });
  } else {
    passedChecks.push({ id: 'pass_patient', title: `Пациент: ${data.patient.fullName}`, partition: 1 });
  }

  // --- 1. Complaints & Pain Assessment (Partition 1) ---
  const hasComplaints = Boolean(data.complaints && data.complaints.trim().length > 3);
  if (!hasComplaints) {
    criticalErrors.push({
      id: 'crit_complaints',
      partition: 1,
      title: 'Отсутствуют жалобы',
      message: 'Субъективные жалобы пациента при обращении не зафиксированы',
      isCritical: true,
      actionText: 'Заполнить жалобы'
    });
  } else {
    passedChecks.push({ id: 'pass_complaints', title: 'Жалобы пациента зафиксированы', partition: 1 });
  }

  const vas = Number(data.vasScore ?? 0);
  const hasAnalgesia = Boolean(
    (data.prescriptions && data.prescriptions.length > 0) ||
    (data.performedManipulations && data.performedManipulations.trim().length > 0)
  );
  if (vas >= 6 && !hasAnalgesia) {
    warnings.push({
      id: 'warn_vas_pain',
      partition: 1,
      title: `Острый болевой синдром (ВАШ ${vas}/10)`,
      message: `Зафиксирован выраженный болевой синдром (ВАШ ${vas}/10), но не назначена анальгетическая терапия, блокада или иммобилизация`,
      isCritical: false,
      actionText: 'Назначить терапию'
    });
  } else if (vas > 0) {
    passedChecks.push({ id: 'pass_vas', title: `Шкала боли ВАШ: ${vas}/10`, partition: 1 });
  }

  // --- 1.2 Anamnesis & Somatic Status (Partition 1) ---
  const hasAnamnesis = Boolean(data.anamnesis && data.anamnesis.trim().length > 3);
  if (!hasAnamnesis) {
    warnings.push({
      id: 'warn_anamnesis',
      partition: 1,
      title: 'Анамнез заболевания (morbi)',
      message: 'Не указана длительность заболевания, факт травмы или динамика процесса',
      isCritical: false,
      actionText: 'Внести анамнез'
    });
  } else {
    passedChecks.push({ id: 'pass_anamnesis', title: 'Анамнез заболевания внесен', partition: 1 });
  }

  const hasObjective = Boolean(data.objectiveStatus && data.objectiveStatus.trim().length > 3);
  if (!hasObjective) {
    warnings.push({
      id: 'warn_objective',
      partition: 1,
      title: 'Соматический статус (Status Praesens)',
      message: 'Не заполнен соматический статус (телосложение, кожные покровы, периферические отеки)',
      isCritical: false,
      actionText: 'Внести статус'
    });
  } else {
    passedChecks.push({ id: 'pass_objective', title: 'Соматический статус описан', partition: 1 });
  }

  // --- 2. Orthopedic Status & Localis (Partition 2) ---
  const hasJoint = Boolean(data.jointExams && data.jointExams.length > 0);
  if (!hasJoint) {
    warnings.push({
      id: 'warn_joint',
      partition: 2,
      title: 'Суставной статус не выбран',
      message: 'На анатомической карте (2D Гомункулус) не выбран целевой сустав',
      isCritical: false,
      actionText: 'Выбрать сустав'
    });
  } else {
    passedChecks.push({ id: 'pass_joint', title: `Локальный статус: ${data.jointExams?.length} сустав(а)`, partition: 2 });
  }

  // --- 3. SFTR Neutral-0 ROM (Partition 3) ---
  const hasRom = Boolean(data.jointExams && data.jointExams.some(j => j.rom && (j.rom.flexion_active || j.rom.flexion_passive)));
  if (!hasRom) {
    warnings.push({
      id: 'warn_rom',
      partition: 3,
      title: 'Углы амплитуды (ROM)',
      message: 'Не зафиксированы измерения гониометрии по системе Neutral-0 (SFTR)',
      isCritical: false,
      actionText: 'Заполнить ROM'
    });
  } else {
    passedChecks.push({ id: 'pass_rom', title: 'Амплитуда движений SFTR измерена', partition: 3 });
  }

  const hasContracture = Boolean(data.jointExams && data.jointExams.some(j => (j.rom?.extension_deficit || 0) > 5));
  const hasLfkPrescription = Boolean(data.prescriptions && data.prescriptions.some(p => p.category === 'lfk' || p.category === 'ЛФК'));
  if (hasContracture && !hasLfkPrescription) {
    warnings.push({
      id: 'warn_contracture_lfk',
      partition: 3,
      title: 'Контрактура без ЛФК',
      message: 'Выявлен дефицит разгибания сустава (>5°), но мобилизационный комплекс ЛФК не включен в план',
      isCritical: false,
      actionText: 'Включить ЛФК'
    });
  }

  // --- 4. Validated Orthopedic Tests (Partition 4) ---
  const hasTests = Boolean(data.jointExams && data.jointExams.some(j => j.tests && Object.keys(j.tests).length > 0));
  if (!hasTests) {
    warnings.push({
      id: 'warn_tests',
      partition: 4,
      title: 'Валидированные тесты EBM',
      message: 'Не выполнены специфические ортопедические тесты (менисковые, связочные, импинджмент)',
      isCritical: false,
      actionText: 'Провести тесты'
    });
  } else {
    const testCount = data.jointExams?.reduce((sum, j) => sum + Object.keys(j.tests || {}).length, 0) || 0;
    passedChecks.push({ id: 'pass_tests', title: `Ортопедические тесты: ${testCount} проверено`, partition: 4 });
  }

  // --- 5. Diagnostics & Lab (Partition 5) ---
  const hasDiagnostics = Boolean(
    (data.specialStudies && data.specialStudies.trim().length > 3) ||
    (data.diagnosticsData && data.diagnosticsData.trim().length > 3) ||
    (data.prescriptions && data.prescriptions.some(p => p.category === 'diagnostics' || p.category === 'диагностика'))
  );
  if (!hasDiagnostics && vas >= 4) {
    warnings.push({
      id: 'warn_diag_missing',
      partition: 5,
      title: 'Инструментальное обследование',
      message: 'При суставном болевом синдроме не назначены и не внесены контрольные снимки (Рентген / МРТ / УЗИ)',
      isCritical: false,
      actionText: 'Назначить диагностику'
    });
  } else if (hasDiagnostics) {
    passedChecks.push({ id: 'pass_diag', title: 'Инструментальная диагностика сопоставлена', partition: 5 });
  }

  // --- 6. Clinical Diagnosis & ICD-10 (Partition 6) ---
  const hasDiagText = Boolean(data.clinicalDiagnosis && data.clinicalDiagnosis.trim().length > 3);
  const hasIcdCode = Boolean(data.icdCode && data.icdCode.trim().length > 1);

  if (!hasDiagText && !hasIcdCode) {
    criticalErrors.push({
      id: 'crit_diagnosis',
      partition: 6,
      title: 'Отсутствует клинический диагноз',
      message: 'Не сформулирован клинический диагноз и не выбран код заболевания по МКБ-10',
      isCritical: true,
      actionText: 'Указать диагноз'
    });
  } else if (!hasIcdCode && hasDiagText) {
    warnings.push({
      id: 'warn_mkb_code',
      partition: 6,
      title: 'Код по МКБ-10',
      message: 'Текст диагноза введен, но не привязан шифр МКБ-10 (требуется для реестра и страховых)',
      isCritical: false,
      actionText: 'Выбрать МКБ-10'
    });
  } else {
    passedChecks.push({ id: 'pass_diagnosis', title: `Диагноз [${data.icdCode || 'Клин.'}] зафиксирован`, partition: 6 });
  }

  // --- 9. Orthotics & Weight Bearing Mode (Partition 9) ---
  const hasOrthoticsPrescription = Boolean(
    (data.prescriptions && data.prescriptions.some(p => p.category === 'orthotics' || p.category === 'ортопедия')) ||
    (data.orthoticsPrescriptions && data.orthoticsPrescriptions.length > 0)
  );
  // If weight bearing is non-FWB (NWB, TTWB, PWB), orthotic or crutches must be prescribed
  const isOffloading = Boolean(
    data.orthoticsPrescriptions?.some(o => o.deviceType?.includes('NWB') || o.deviceType?.includes('TTWB') || o.deviceType?.includes('PWB'))
  );
  if (isOffloading && !hasOrthoticsPrescription) {
    warnings.push({
      id: 'warn_offloading_brace',
      partition: 9,
      title: 'Разгрузка без ортеза',
      message: 'Задан строгий режим разгрузки сустава, но не выписан шарнирный брейс или трость/костыли',
      isCritical: false,
      actionText: 'Выписать ортез'
    });
  } else if (hasOrthoticsPrescription) {
    passedChecks.push({ id: 'pass_ortho', title: 'Ортезирование и разгрузка назначены', partition: 9 });
  }

  // --- 10. Rehabilitation & Recommendations (Partition 10) ---
  const hasRecommendations = Boolean(data.recommendations && data.recommendations.trim().length > 3);
  if (!hasRecommendations) {
    criticalErrors.push({
      id: 'crit_recommendations',
      partition: 10,
      title: 'Рекомендации пациенту',
      message: 'Раздел клинических рекомендаций, медикаментозного лечения и двигательного режима не заполнен',
      isCritical: true,
      actionText: 'Внести рекомендации'
    });
  } else {
    passedChecks.push({ id: 'pass_recs', title: 'Рекомендации и двигательный режим заполнены', partition: 10 });
  }

  if (!hasLfkPrescription) {
    warnings.push({
      id: 'warn_lfk_phases',
      partition: 10,
      title: 'Комплекс ЛФК не включен',
      message: 'Не включен ни один поэтапный курс кинезиотерапии (Фазы I–III) для восстановления функции сустава',
      isCritical: false,
      actionText: 'Включить Фазу I/II'
    });
  } else {
    passedChecks.push({ id: 'pass_lfk', title: 'Курс ЛФК включен отдельной строкой', partition: 10 });
  }

  // --- Score Computation ---
  // 100 max points, critical error deducts 25, warning deducts 8
  const rawScore = 100 - (criticalErrors.length * 25) - (warnings.length * 8);
  const score = Math.max(0, Math.min(100, rawScore));

  let status: 'valid' | 'warning' | 'critical' = 'valid';
  let summaryMessage = 'Протокол готов к подписанию ЭЦП и выгрузке в МИС (100%)';

  if (criticalErrors.length > 0) {
    status = 'critical';
    summaryMessage = `Критично: обнаружено ${criticalErrors.length} обязательных незаполненных полей`;
  } else if (warnings.length > 0) {
    status = 'warning';
    summaryMessage = `Готовность ${score}%: рекомендуется устранить ${warnings.length} клинических замечаний`;
  }

  return {
    score,
    status,
    criticalErrors,
    warnings,
    passedChecks,
    summaryMessage
  };
}
