import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

const TermosDeUso = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
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
          Termos de Uso
        </Typography>

        <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
          Última atualização: 19 de Maio de 2026
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          <Box>
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 1.5 }}>
              1. Aceitação dos Termos
            </Typography>
            <Typography variant="body1" align="justify" sx={{ lineHeight: 1.7 }}>
              Ao acessar e utilizar a plataforma HED AD, você concorda em cumprir e estar vinculado a estes Termos de Uso. Este documento constitui um acordo legal entre você (seja como pessoa física ou em representação de uma pessoa jurídica) e a nossa plataforma. Se você não concorda com qualquer parte destes termos, você deve cessar imediatamente o uso de nossos serviços.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 1.5 }}>
              2. Regras de Conteúdo e Publicidade
            </Typography>
            <Typography variant="body1" align="justify" sx={{ lineHeight: 1.7 }}>
              Todo conteúdo de campanha, incluindo vídeos e imagens, enviado para exibição nas telas do Hospital Ernesto Dornelles deve obedecer aos padrões éticos e legais vigentes. É estritamente proibido o envio de mídias contendo material ofensivo, discriminatório, enganoso, ou que infrinja direitos autorais e propriedade intelectual de terceiros. Todas as campanhas enviadas passam por auditoria prévia e aprovação da administração do hospital antes de serem veiculadas na grade da TV.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 1.5 }}>
              3. Cobranças, Faturamento e Pagamentos
            </Typography>
            <Typography variant="body1" align="justify" sx={{ lineHeight: 1.7 }}>
              A contratação de pacotes de exibição de mídia está sujeita às tarifas comerciais acordadas previamente entre o parceiro e a área administrativa. Os pagamentos e faturamento serão processados de acordo com o plano comercial selecionado. O atraso no pagamento pode ensejar a suspensão temporária das exibições ativas do respectivo anunciante até a regularização do débito.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 1.5 }}>
              4. Limitação de Responsabilidade
            </Typography>
            <Typography variant="body1" align="justify" sx={{ lineHeight: 1.7 }}>
              Embora busquemos manter o sistema online e os equipamentos de exibição em perfeitas condições operacionais 24 horas por dia, a HED AD não se responsabiliza por interrupções temporárias de serviço causadas por falhas técnicas de rede local, manutenção preventiva ou fatores de força maior. Nesses cenários, os créditos de exibição afetados serão compensados proporcionalmente.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 1.5 }}>
              5. Modificações dos Termos
            </Typography>
            <Typography variant="body1" align="justify" sx={{ lineHeight: 1.7 }}>
              Reservamo-nos o direito de revisar estes termos a qualquer momento, visando adequações legais ou aperfeiçoamento de processos internos do SaaS. Quaisquer alterações significativas serão notificadas diretamente através do painel de controle do usuário. O uso continuado da plataforma após tais atualizações constituirá sua aceitação implícita dos novos termos.
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default TermosDeUso;
