# CAPTCHA RP — Discord

Bot de verificação CAPTCHA para servidor RP, inspirado no fluxo:

1. Painel com **Iniciar verificação** e **Como funciona**.
2. Usuário clica em **Iniciar verificação**.
3. Bot gera um código aleatório.
4. O código aparece em uma imagem.
5. O bot mostra 5 opções em um menu.
6. Se a opção estiver correta, o bot adiciona o cargo de verificado.
7. O CAPTCHA expira em 1 minuto.

## 1. Requisitos

- Node.js 18 ou superior.
- Um bot criado no Discord Developer Portal.
- O bot precisa estar no seu servidor.
- Permissão do bot: **Gerenciar Cargos**.
- O cargo do bot deve ficar **acima** do cargo de verificado na hierarquia.

## 2. Instalação

```bash
npm install
```

Copie `.env.example` para `.env` e preencha:

```env
DISCORD_TOKEN=TOKEN_DO_BOT
CLIENT_ID=ID_DO_BOT
GUILD_ID=ID_DO_SERVIDOR
VERIFY_ROLE_ID=ID_DO_CARGO_VERIFICADO
CAPTCHA_CHANNEL_ID=ID_DO_CANAL
```

## 3. Iniciar

```bash
npm start
```

Depois, no canal escolhido:

```text
/setup-captcha
```

## 4. Como deixar parecido com seu print

Você pode trocar:
- nome e descrição do embed;
- emoji dos botões;
- cor principal;
- texto do rodapé;
- quantidade de opções;
- tempo de expiração;
- imagem/logo do servidor.

## 5. Permissões importantes

O bot precisa conseguir:
- Ver o canal;
- Enviar mensagens;
- Usar embeds;
- Anexar arquivos;
- Usar comandos;
- Gerenciar cargos.

E o cargo que será entregue precisa estar abaixo do maior cargo do bot.

## Observação

Este CAPTCHA é um sistema simples de seleção de código. Para um sistema mais resistente a automação, dá para adicionar limite de tentativas, cooldown, registro de IP não é recomendado em bot comum, logs de verificação, bloqueio temporário e outras camadas.


### Remover cargo após verificar

Defina `REMOVE_ROLE_ID` no `.env` com o ID do cargo que deve ser removido quando o usuário concluir o CAPTCHA.

Exemplo:
```env
REMOVE_ROLE_ID=1555270141200044154
```

O bot primeiro adiciona `VERIFY_ROLE_ID` e, em seguida, remove `REMOVE_ROLE_ID`. O cargo do bot precisa estar acima dos dois cargos na hierarquia do servidor.


### Banner personalizado
O painel de verificação usa `assets/banner.png`. Para trocar o visual, substitua esse arquivo mantendo o mesmo nome.
