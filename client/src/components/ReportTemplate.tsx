import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

interface MaterialItem {
  id: number;
  material_name: string;
  unit_of_measure: string;
  quantity: number;
  current_unit_cost: number;
  operation_id: number;
  operation_name: string;
  operation_price: number;
}

interface ReportTemplateProps {
  operations: any[];
  materialsData: MaterialItem[];
  materialCostFactor: number;
}

export const ReportTemplate = React.forwardRef<HTMLDivElement, ReportTemplateProps>(
  ({ operations = [], materialsData = [], materialCostFactor = 1.15 }, ref) => {
    const safeMaterials = Array.isArray(materialsData) ? materialsData : [];
    const safeOperations = Array.isArray(operations) ? operations : [];
    const factor = typeof materialCostFactor === 'number' && !isNaN(materialCostFactor) ? materialCostFactor : 1.15;
    
    // Group materials by operation_id
    const grouped = safeMaterials.reduce((acc, curr) => {
      if (!curr) return acc;
      if (!acc[curr.operation_id]) acc[curr.operation_id] = [];
      acc[curr.operation_id].push(curr);
      return acc;
    }, {} as Record<number, MaterialItem[]>);

    let grandTotalMaterials = 0;
    let grandTotalOperations = 0;

    safeOperations.forEach(op => {
      grandTotalOperations += op.price || 0;
      const mats = grouped[op.id] || [];
      const opMatsTotal = mats.reduce((sum, m) => sum + ((m.quantity || 0) * (m.current_unit_cost || 0)), 0) * factor;
      grandTotalMaterials += opMatsTotal;
    });

    const grandTotal = grandTotalOperations + grandTotalMaterials;
    const now = new Date();

    return (
      <Box ref={ref} sx={{ p: 4, width: '100%', bgcolor: 'white', color: 'black' }}>
        {/* HEADER */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0F3C64', pb: 2.5, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img 
              src="/MainLogoTransparent.png" 
              alt="Центр Ортопедии и Травматологии" 
              style={{ width: 68, height: 68, objectFit: 'contain' }} 
            />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64', lineHeight: 1.2, letterSpacing: '-0.3px' }}>
                Центр Ортопедии и Травматологии
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#156C9C', lineHeight: 1.3 }}>
                Клиника доктора Добрушкина
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                г. Сочи
              </Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F3C64', textTransform: 'uppercase', fontSize: '1rem', letterSpacing: '0.5px' }}>
              Калькуляция стоимости
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Дата: {now.toLocaleDateString('ru-RU')} {now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>
        </Box>

        {/* BODY */}
        {operations.map(op => {
          const mats = grouped[op.id] || [];
          const rawTotal = mats.reduce((sum, m) => sum + (m.quantity * m.current_unit_cost), 0);
          const matsTotal = rawTotal * materialCostFactor;

          return (
            <Box key={op.id} sx={{ mb: 4, pageBreakInside: 'avoid' }}>
              <Typography variant="h6" sx={{ bgcolor: '#f0f4f8', p: 1, borderRadius: 1, fontWeight: 'bold' }}>
                Процедура: {op.name}
              </Typography>
              <Typography variant="body2" sx={{ ml: 1, mt: 1, mb: 1, fontWeight: 500 }}>
                Стоимость самой процедуры: {op.price ? op.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 0} ₽
              </Typography>
              
              <Typography variant="subtitle2" sx={{ ml: 1, mt: 2, mb: 1 }}>Материалы для процедуры:</Typography>
              {mats.length > 0 ? (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', mb: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#fafafa' }}>
                      <TableRow>
                        <TableCell><strong>Наименование</strong></TableCell>
                        <TableCell><strong>Ед. изм.</strong></TableCell>
                        <TableCell align="right"><strong>Кол-во</strong></TableCell>
                        <TableCell align="right"><strong>Цена за ед.</strong></TableCell>
                        <TableCell align="right"><strong>Сумма (без коэф.)</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mats.map(m => (
                        <TableRow key={m.id}>
                          <TableCell>{m.material_name}</TableCell>
                          <TableCell>{m.unit_of_measure}</TableCell>
                          <TableCell align="right">{m.quantity}</TableCell>
                          <TableCell align="right">{m.current_unit_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽</TableCell>
                          <TableCell align="right">{(m.quantity * m.current_unit_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4} align="right"><strong>Итого материалов:</strong></TableCell>
                        <TableCell align="right"><strong>{matsTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽</strong></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary', fontStyle: 'italic', mb: 2 }}>
                  Для данной процедуры не указаны расходные материалы.
                </Typography>
              )}
            </Box>
          );
        })}

        {/* UNIFIED FOOTER: TOTALS & SIGNATURES (Guaranteed to stay on the same page) */}
        <Box sx={{ borderTop: '2px solid #0F3C64', pt: 2, mt: 3, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Box sx={{ width: '400px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Сумма за процедуры:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{grandTotalOperations.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Сумма за материалы:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{grandTotalMaterials.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px solid #ccc' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F3C64' }}>ОБЩИЙ ИТОГ:</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F3C64' }}>
                  {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ mt: 2.5, pt: 1, display: 'flex', justifyContent: 'space-between' }}>
            <Box sx={{ width: '45%', borderTop: '1px solid black', pt: 0.5, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>Подпись врача</Typography>
            </Box>
            <Box sx={{ width: '45%', borderTop: '1px solid black', pt: 0.5, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>Подпись пациента (согласие со стоимостью)</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }
);
