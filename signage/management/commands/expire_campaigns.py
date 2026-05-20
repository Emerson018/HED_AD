import datetime
from django.core.management.base import BaseCommand
from signage.models import Campanha

class Command(BaseCommand):
    help = "Busca campanhas cujo prazo contratual expirou (data_fim < hoje) e atualiza o status para EXPIRADA"

    def handle(self, *args, **options):
        today = datetime.date.today()
        # Campanhas aprovadas ou ativas que já venceram
        campanhas_vencidas = Campanha.objects.filter(
            data_fim__lt=today,
            status__in=['APROVADA', 'ATIVA']
        )
        
        count = campanhas_vencidas.count()
        
        if count > 0:
            for c in campanhas_vencidas:
                c.status = 'EXPIRADA'
                c.save(update_fields=['status'])
                
                # Criar AuditoriaLog
                from signage.models import AuditoriaLog
                AuditoriaLog.objects.create(
                    usuario=None,
                    usuario_str="Sistema (Automático)",
                    acao="CAMPANHA_EXPIRADA",
                    descricao=f"Campanha '{c.nome}' (ID: {c.id}) expirada automaticamente por atingir a data fim ({c.data_fim.strftime('%d/%m/%Y')})."
                )
            self.stdout.write(
                self.style.SUCCESS(f"Sucesso: {count} campanhas expiradas com êxito!")
            )
        else:
            self.stdout.write(
                self.style.SUCCESS("Nenhuma campanha vencida para expirar hoje.")
            )
