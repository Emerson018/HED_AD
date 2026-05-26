# Guia de Hardening SSH para VPS Linux

## Quando usar
Aplique estas regras ao hospedar o Django em uma VPS Linux (DigitalOcean, AWS EC2, Hetzner, etc).

---

## 1. Desabilitar Login Root via SSH

```bash
sudo nano /etc/ssh/sshd_config
```

Altere:
```
PermitRootLogin no
```

---

## 2. Mudar Porta Padrão do SSH (22 → porta customizada)

```bash
# No sshd_config, altere:
Port 2222
```

> Escolha uma porta alta (ex: 2222, 2299, 4422). Isso reduz ataques automatizados.

---

## 3. Usar Apenas Chaves SSH (desabilitar login por senha)

```bash
# Gere uma chave Ed25519 no seu computador local:
ssh-keygen -t ed25519 -C "admin@hed-ad.com.br"

# Copie a chave pública para o servidor:
ssh-copy-id -p 2222 usuario@ip-do-servidor
```

No `sshd_config`:
```
PubkeyAuthentication yes
PasswordAuthentication no
ChallengeResponseAuthentication no
```

---

## 4. Instalar e Configurar Fail2Ban

```bash
sudo apt update && sudo apt install fail2ban -y

sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local
```

Configuração recomendada:
```ini
[sshd]
enabled = true
port = 2222
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
```

```bash
sudo systemctl enable fail2ban
sudo systemctl restart fail2ban
```

---

## 5. Firewall (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 2222/tcp    # SSH na porta customizada
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
```

---

## 6. Atualizações Automáticas de Segurança

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 7. Criar Usuário Dedicado (não usar root)

```bash
adduser deploy_hed
usermod -aG sudo deploy_hed
# Configure a chave SSH para este usuário
```

---

## Checklist Final

- [ ] Root login desabilitado
- [ ] Porta SSH alterada
- [ ] Apenas chaves SSH (sem senha)
- [ ] Fail2Ban instalado e ativo
- [ ] Firewall UFW configurado
- [ ] Atualizações automáticas ativas
- [ ] Usuário dedicado criado
