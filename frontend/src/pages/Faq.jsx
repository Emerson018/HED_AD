import React from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const Faq = () => {
  const navigate = useNavigate();
  const faqData = [
    {
      question: 'Quais formatos de vídeo e imagem são aceitos?',
      answer: 'Para vídeos, o formato padrão aceito é MP4, codificado em H.264, com resolução ideal de 1920x1080 (Full HD, proporção 16:9). Para imagens fixas (banners), aceitamos formatos PNG ou JPEG de alta qualidade na mesma proporção.'
    },
    {
      question: 'Como funciona o processo de aprovação da campanha?',
      answer: 'Após criar a campanha e enviar o arquivo de mídia no painel do parceiro, a campanha entra em status "Pendente" (Em Análise). A equipe de marketing e administração do Hospital Ernesto Dornelles avalia o conteúdo para garantir conformidade técnica e ética. A resposta e consequente aprovação ocorrem normalmente em até 24 horas úteis.'
    },
    {
      question: 'Posso alterar a data de início/fim de uma campanha já ativa?',
      answer: 'Para campanhas que já foram aprovadas e estão ativas ou agendadas, a alteração de datas fica bloqueada no painel do parceiro por motivos de planejamento e reserva de cota. Se você precisar adiar ou estender, entre em contato diretamente com a nossa equipe administrativa para que façamos o ajuste manual.'
    },
    {
      question: 'O que significa exibir nos turnos "Integral" ou turnos individuais?',
      answer: 'O carrossel de anúncios é organizado por faixas horárias diárias. Você pode selecionar turnos específicos para veicular seu anúncio onde seu público-alvo é mais engajado (ex: Manhã, Tarde, Noite, Madrugada) ou selecionar a opção "Integral" para veicular continuamente em todos os horários de funcionamento do player físico.'
    },
    {
      question: 'Como faço para pausar temporariamente minha veiculação?',
      answer: 'Os clientes podem solicitar a pausa diretamente pelo painel principal, clicando no respectivo controle da campanha. O status mudará para "Pausado" e a exibição será interrompida temporariamente nas telas até que você decida reativá-la.'
    }
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate(-1)} color="primary">
          <ArrowBackIcon />
        </IconButton>
      </Box>
      <Paper 
        elevation={2} 
        sx={{ 
          p: { xs: 3, md: 5 }, 
          borderRadius: 3,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold', 
            color: 'primary.main',
            mb: 4,
            borderBottom: '2px solid #d3d3d3',
            pb: 2
          }}
        >
          Perguntas Frequentes (FAQ)
        </Typography>

        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          Tire suas dúvidas rápidas sobre o funcionamento da veiculação de anúncios na nossa rede de sinalização digital.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {faqData.map((item, index) => (
            <Accordion 
              key={index} 
              sx={{ 
                boxShadow: 'none', 
                border: '1px solid', 
                borderColor: '#d3d3d3', 
                borderRadius: '8px !important',
                '&::before': { display: 'none' },
                '&:hover': {
                  borderColor: 'primary.main'
                }
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}
                sx={{ 
                  bgcolor: 'action.hover',
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                  '& .MuiTypography-root': {
                    color: 'primary.main',
                    fontWeight: 600
                  }
                }}
              >
                <Typography>{item.question}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 3, bgcolor: 'background.paper', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                <Typography sx={{ lineHeight: 1.6, color: 'text.secondary' }}>
                  {item.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Paper>
    </Container>
  );
};

export default Faq;
