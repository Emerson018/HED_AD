import os
import django
from datetime import date, timedelta

# Configuração do ambiente Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hed_project.settings')
django.setup()

from signage.models import Usuario, Parceiro, Campanha, Midia

def populate():
    print("Iniciando população de dados...")

    # 1. Criar Usuários e Perfis de Parceiros
    parceiros_data = [
        {'username': 'farmacia_pague_menos', 'empresa': 'Pague Menos S.A.', 'cnpj': '12.345.678/0001-01'},
        {'username': 'unimed_porto_alegre', 'empresa': 'Unimed Porto Alegre', 'cnpj': '98.765.432/0001-99'},
    ]

    for data in parceiros_data:
        user, created = Usuario.objects.get_or_create(
            username=data['username'],
            defaults={'tipo_usuario': 'PARCEIRO', 'first_name': data['empresa']}
        )
        if created:
            user.set_password('senha123')
            user.save()
            print(f"Usuário {data['username']} criado.")
        
        parceiro, created = Parceiro.objects.get_or_create(
            usuario=user,
            defaults={'nome_empresa': data['empresa'], 'cnpj': data['cnpj'], 'telefone': '(51) 99999-0000'}
        )
        if created:
            print(f"Perfil de parceiro {data['empresa']} criado.")

        # 2. Criar Campanhas para cada parceiro
        hoje = date.today()
        fim = hoje + timedelta(days=30)

        campanha, created = Campanha.objects.get_or_create(
            parceiro=parceiro,
            nome=f"Campanha Institucional - {data['empresa']}",
            defaults={'status': 'EM_ANALISE', 'data_inicio': hoje, 'data_fim': fim}
        )
        
        if created:
            print(f"Campanha para {data['empresa']} criada.")
            # 3. Criar Mídia fictícia (URL de exemplo)
            Midia.objects.create(
                campanha=campanha,
                tipo='VIDEO',
                arquivo_url='https://www.w3schools.com/html/mov_bbb.mp4' # Vídeo de teste público
            )

    print("\nDados populados com sucesso!")
    print("Usuários criados (senha: senha123):")
    for p in parceiros_data:
        print(f"- {p['username']}")

if __name__ == '__main__':
    populate()
