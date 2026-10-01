import React, { useState } from 'react';
import { 
  Typography, Box, Paper, Button, Stepper, Step, StepLabel, 
  Select, MenuItem, FormControl, InputLabel, TextField, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip
} from '@mui/material';

const steps = ['Выбор пациента и процедуры', 'Назначение персонала', 'Расход материалов', 'Расчет и оплата'];

// Mock Data
const operations = [
  { id: 1, name: 'Артроскопия коленного сустава', price: 45000 },
  { id: 2, name: 'Инъекция PRP', price: 5000 },
];
const templateMaterials = [
  { id: 1, name: 'Титановый винт 5мм', qty: 2, unitCost: 1200 },
  { id: 2, name: 'Пробирка PRP', qty: 1, unitCost: 850 },
  { id: 4, name: 'Стерильный бинт', qty: 3, unitCost: 50 },
];

export default function CheckoutWizard() {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedOp, setSelectedOp] = useState('');
  const [actualMaterials, setActualMaterials] = useState(templateMaterials);

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleQtyChange = (id: number, newQty: number) => {
    setActualMaterials(actualMaterials.map(m => m.id === id ? { ...m, qty: newQty } : m));
  };

  const calculateTotalCost = () => {
    return actualMaterials.reduce((acc, curr) => acc + (curr.qty * curr.unitCost), 0);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Выберите пациента</InputLabel>
              <Select defaultValue={1} label="Выберите пациента">
                <MenuItem value={1}>Исторический Пациент (ID: 1)</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Выберите процедуру</InputLabel>
              <Select value={selectedOp} label="Выберите процедуру" onChange={(e) => setSelectedOp(e.target.value)}>
                {operations.map(op => (
                  <MenuItem key={op.id} value={op.id}>{op.name} (₽{op.price.toLocaleString()})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Лечащий врач</InputLabel>
              <Select defaultValue={1} label="Лечащий врач">
                <MenuItem value={1}>Доктор Иванов</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Ассистирующая медсестра</InputLabel>
              <Select defaultValue={2} label="Ассистирующая медсестра">
                <MenuItem value={2}>Медсестра Анна</MenuItem>
              </Select>
            </FormControl>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>Проверка расхода материалов</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Материал</TableCell>
                    <TableCell>Стоимость ед. (₽)</TableCell>
                    <TableCell>Ожидаемое кол-во</TableCell>
                    <TableCell>Фактический расход</TableCell>
                    <TableCell align="right">Общая стоимость (₽)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {actualMaterials.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.unitCost}</TableCell>
                      <TableCell>{row.qty} (По шаблону)</TableCell>
                      <TableCell>
                        <TextField 
                          type="number" size="small" value={row.qty} 
                          onChange={(e) => handleQtyChange(row.id, Number(e.target.value))}
                        />
                      </TableCell>
                      <TableCell align="right">{(row.qty * row.unitCost).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={4} align="right"><strong>Итоговая себестоимость материалов:</strong></TableCell>
                    <TableCell align="right"><strong>₽{calculateTotalCost().toLocaleString()}</strong></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );
      case 3:
        const op = operations.find(o => o.id === Number(selectedOp));
        const billed = op ? op.price : 0;
        const cost = calculateTotalCost();
        const profit = billed - cost;
        return (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>Итог транзакции</Typography>
            <Paper sx={{ p: 4, display: 'inline-block', textAlign: 'left', minWidth: 400 }}>
              <Typography variant="body1"><strong>Пациент:</strong> Исторический Пациент</Typography>
              <Typography variant="body1"><strong>Процедура:</strong> {op?.name}</Typography>
              <Typography variant="body1"><strong>Персонал:</strong> Доктор Иванов, Медсестра Анна</Typography>
              <hr />
              <Typography variant="h6" color="primary">Сумма к оплате: ₽{billed.toLocaleString()}</Typography>
              <Typography variant="h6" color="error">Себестоимость материалов: -₽{cost.toLocaleString()}</Typography>
              <hr />
              <Typography variant="h5" color="success.main">Чистая прибыль: ₽{profit.toLocaleString()}</Typography>
            </Paper>
          </Box>
        );
      default:
        return 'Неизвестный шаг';
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>Оформление визита пациента</Typography>
      <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
        {steps.map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>
      
      {activeStep === steps.length ? (
        <React.Fragment>
          <Typography sx={{ mt: 2, mb: 1 }}>Транзакция успешно записана в базу данных!</Typography>
          <Tooltip title="Сбросить и начать заново" arrow>
            <Button onClick={() => setActiveStep(0)} sx={{ cursor: 'pointer' }}>Начать новую транзакцию</Button>
          </Tooltip>
        </React.Fragment>
      ) : (
        <React.Fragment>
          {getStepContent(activeStep)}
          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
            <Tooltip title="Вернуться на предыдущий шаг" arrow>
              <Box>
                <Button color="inherit" disabled={activeStep === 0} onClick={handleBack} sx={{ mr: 1, cursor: 'pointer' }}>
                  Назад
                </Button>
              </Box>
            </Tooltip>
            <Box sx={{ flex: '1 1 auto' }} />
            <Tooltip title={activeStep === steps.length - 1 ? 'Подтвердить и сохранить данные' : 'Перейти к следующему шагу'} arrow>
              <Box>
                <Button onClick={handleNext} variant="contained" disabled={activeStep === 0 && !selectedOp} sx={{ cursor: 'pointer' }}>
                  {activeStep === steps.length - 1 ? 'Завершить транзакцию' : 'Далее'}
                </Button>
              </Box>
            </Tooltip>
          </Box>
        </React.Fragment>
      )}
    </Box>
  );
}
