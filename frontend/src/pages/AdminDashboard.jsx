import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Stack,
  Link
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const AdminDashboard = () => {
  const [campanhas, setCampanhas] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCampanha, setSelectedCampanha] = useState(null);
  
  const [diasSemana, setDiasSemana] = useState("[1, 2, 3, 4, 5]");
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('18:00');
  const [duracao, setDuracao] = useState('15');

  useEffect(() => {
    fetchCampanhas();
  }, []);

  const fetchCampanhas = async () => {
    try {
      const response = await api.get('campanhas/');
      setCampanhas(response.data);
    } catch (error) {
      console.error("Erro ao buscar campanhas", error);
    }
  };

  const handleOpenAprovacao = (campanha) => {
    setSelectedCampanha(campanha);
    setModalOpen(true);
  };

  const handleAprovar = async (e) => {
    e.preventDefault();
    try {
      await api.post('agendamentos/', {
        campanha: selectedCampanha.id,
        dias_semana: JSON.parse(diasSemana),
        horario_inicio: horaInicio,
        horario_fim: horaFim,
        duracao_segundos: parseInt(duracao),
      });

      await api.patch(`campanhas/${selectedCampanha.id}/`, {
        status: 'APROVADA'
      });

      setModalOpen(false);
      fetchCampanhas();
      alert('Campanha aprovada e agendada!');
    } catch (error) {
      console.error("Erro ao aprovar campanha", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APROVADA': return 'success';
      case 'EM_ANALISE': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <DashboardIcon fontSize="large" color="primary" />
        Gestão Central - HED
      </Typography>

      <TableContainer component={Paper} sx={{ mt: 4 }}>
        <Table>
          <TableHead sx={{ backgroundColor: 'var(--color-primary-dark)' }}>
            <TableRow>
              <TableCell sx={{ color: '#fff' }}>ID</TableCell>
              <TableCell sx={{ color: '#fff' }}>Campanha</TableCell>
              <TableCell sx={{ color: '#fff' }}>Status</TableCell>
              <TableCell sx={{ color: '#fff' }}>Mídia</TableCell>
              <TableCell sx={{ color: '#fff' }} align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {campanhas.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell>{c.id}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{c.nome}</TableCell>
                <TableCell>
                  <Chip 
                    label={c.status.replace('_', ' ')} 
                    color={getStatusColor(c.status)} 
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {c.midias && c.midias.length > 0 ? (
                    <Link href={c.midias[0].arquivo_url} target="_blank" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Link <OpenInNewIcon fontSize="inherit" />
                    </Link>
                  ) : 'Sem mídia'}
                </TableCell>
                <TableCell align="right">
                  {c.status === 'EM_ANALISE' && (
                    <Button 
                      variant="contained" 
                      color="primary" 
                      size="small"
                      onClick={() => handleOpenAprovacao(c)}
                      startIcon={<CheckCircleIcon />}
                    >
                      Aprovar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {campanhas.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">Nenhuma campanha encontrada.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Aprovar e Agendar</DialogTitle>
        <form onSubmit={handleAprovar}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Typography variant="subtitle2" color="primary">
                Campanha: {selectedCampanha?.nome}
              </Typography>
              
              <TextField
                label="Dias da Semana (JSON)"
                fullWidth
                value={diasSemana}
                onChange={(e) => setDiasSemana(e.target.value)}
                helperText="[0=Dom, 1=Seg...]"
              />

              <Stack direction="row" spacing={2}>
                <TextField
                  label="Início"
                  type="time"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                />
                <TextField
                  label="Fim"
                  type="time"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                />
              </Stack>

              <TextField
                label="Duração (Segundos)"
                type="number"
                fullWidth
                value={duracao}
                onChange={(e) => setDuracao(e.target.value)}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setModalOpen(false)} color="inherit">Cancelar</Button>
            <Button type="submit" variant="contained" color="success">Confirmar</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
