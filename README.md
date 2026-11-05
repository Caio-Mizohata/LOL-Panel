# LOL-Panel

Painel de estatísticas e acompanhamento de jogadores de League of Legends.
A aplicação permite buscar qualquer jogador pelo Riot ID (nome e tagline) em campos separados, exibindo um card resumido com nível, elos em Solo/Duo e Flex e maiores maestrias. A partir do card, é possível acessar uma página de perfil detalhada com histórico de partidas, métricas de desempenho e winrates por fila ranqueada.

O projeto utiliza Angular 22.2, TypeScript 6, RxJS, Tailwind CSS 4 e componentes
Spartan UI. Os dados vêm da API da Riot Games e as imagens de campeões e perfis
vêm do Data Dragon. As consultas de invocadores, classificações e maestrias estão
configuradas para o servidor brasileiro (**BR1**).

### Principais recursos

- **Busca por Riot ID:** Pesquisa direta por Nome e Tagline, sem necessidade de IDs internos.
- **Card Resumo:** Exibição do nível do invocador, emblemas oficiais das filas Solo/Duo e Flex, vitórias/derrotas e as 3 maiores maestrias com ícones de campeão.
- **Página de Perfil (`/profile/:id`):**
  - URLs amigáveis com slug de Riot ID (ex: `/profile/Faker-KR1`) e suporte retrocompatível para PUUID.
  - Alternância entre as filas **Solo/Duo** e **Flex** via abas.
  - Gráfico circular de winrate com taxa percentual, vitórias e derrotas.
  - Tabela dos Top 5 campeões mais jogados na fila selecionada com ícones Data Dragon, total de partidas e barra de progresso de winrate.
  - Distribuição percentual de partidas por rota/posição (Top, Jungle, Mid, Bot, Suporte).
  - Histórico das últimas partidas ranqueadas com status de vitória/derrota, ícone do campeão, KDA, duração e data.

## Projeto feito exclusivamente para uso pessoal e privado para uma comunidade específica.

Este projeto não tem fins lucrativos, não tem vinculo com a Riot Games ou qualquer outra empresa. Ele é apenas um painel para acompanhar o desempenho dos jogadores. Mas seu uso para fins de testes e desenvolvimento é permitido.

### ⚠️ Limitações e Isenção sobre a API da Riot Games

- **Inconsistências e atrasos nos dados:** As informações exibidas dependem diretamente dos serviços e da disponibilidade da API da Riot Games. Partidas recém-jogadas podem demorar alguns minutos para serem indexadas, e dados como elo, vitórias/derrotas ou maestrias podem apresentar divergências temporárias ou atraso de sincronização.
- **Limite de 10 partidas ranqueadas por consulta:** O limite de partidas ranqueadas consultadas é fixado em **10 partidas** para evitar exceder o limite de requisições da API. Portanto, as estatísticas de desempenho, campeões mais jogados e taxas de vitória exibidas no perfil refletem esse recorte recente, não abrangendo todo o histórico da temporada.
- **Limites de requisições (Rate Limits):** O uso com chave de desenvolvimento pessoal (*Development API Key*) possui limitações rígidas de taxa (20 req/1s e 100 req/2min) e expira a cada 24 horas. Exceder esses limites pode causar erros temporários de carregamento (`429 Too Many Requests`).


## Requisitos

- Node.js compatível com os pacotes Angular instalados: `^22.22.3`, `^24.15.0`
  ou `>=26.0.0`. Confira também a [tabela de compatibilidade do Angular](https://angular.dev/reference/versions).
- npm; o projeto declara `npm@11.11.0` em `package.json`.
- Uma conta Riot e uma chave de API válida, obtida no
  [Riot Developer Portal](https://developer.riotgames.com/docs/portal).
- Acesso à internet para instalar as dependências, consultar a API e carregar
  os recursos do Data Dragon.

Não é necessário instalar o Angular CLI globalmente: os scripts npm usam a
versão instalada no projeto.

Confira seu ambiente:

```bash
node --version
npm --version
```

## Instalação e configuração

Execute os comandos na raiz do repositório. Os exemplos com `cp` são para
macOS/Linux; no PowerShell, use `Copy-Item` no lugar de `cp`.

### 1. Instalar as dependências

Depois de clonar o repositório e entrar na pasta do projeto:

```bash
npm install
```

O comando utiliza as versões registradas em `package-lock.json`. Use
`npm install` quando estiver alterando dependências e precisar atualizar o lockfile.

### 2. Configurar a chave da Riot

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Preencha o `.env` com sua chave:

```dotenv
RIOT_API_KEY=SUA_CHAVE_DA_RIOT
```

O proxy carrega esse arquivo na raiz do projeto. A variável também pode ser
fornecida pelo ambiente do processo; o `dotenv` não sobrescreve uma variável
já definida. Reinicie `npm start` depois de alterar a chave.

A chave é usada pelo servidor de desenvolvimento no header `X-Riot-Token` das
requisições à Riot. Não a coloque em arquivos Angular, URLs ou arquivos públicos.
O `.env` está ignorado pelo Git; o `.env.example` contém apenas o nome da variável.

As chaves de desenvolvimento expiram. Consulte o portal para renovar a sua e
verificar o tipo de chave e os limites de uso aplicáveis.
[Referência sobre chaves da Riot](https://developer.riotgames.com/docs/portal#web-apis).

### 3. Buscar um jogador

Não é necessário configurar PUUIDs locais. Na tela inicial, informe o nome do
jogador e a tagline nos respectivos campos. A consulta à API só é iniciada ao
enviar a busca, evitando o carregamento automático de vários perfis.

## Executar e usar a aplicação

Depois de configurar a variável de ambiente:

```bash
npm start
```

Abra [http://localhost:4200/](http://localhost:4200/). Para usar outra porta:

```bash
npm start -- --port 4300
```

O servidor acompanha as alterações nos arquivos da aplicação. Para encerrá-lo,
pressione `Ctrl+C` no terminal.

Na página inicial:

1. Digite o nome do jogador e a tagline e selecione **Buscar perfil**.
2. O card do jogador encontrado aparece abaixo da barra de pesquisa com seu Riot ID, nível, elos ranqueados e maiores maestrias.
   Uma fila sem classificação aparece como “Sem classificação”; falhas ao buscar as classificações aparecem como “Indisponível”.
3. Selecione **Ver perfil** para navegar para a tela completa de estatísticas do jogador (`/profile/Nome-Tag`).
4. Na tela de perfil, alterne entre as abas **Solo/Duo** e **Flex** para conferir a taxa de vitória geral, os campeões mais utilizados, a preferência de rotas e o histórico das partidas recentes.

Se o catálogo do Data Dragon falhar, o perfil pode continuar disponível sem as
imagens dos campeões e do jogador. Falhas ao buscar a conta, o invocador ou as
maestrias impedem o carregamento completo daquele perfil.

## Como funciona o proxy

Durante `npm start`, o Angular CLI carrega `src/proxy.conf.cjs`, conforme
`angular.json`. Não é necessário iniciar uma API Node separada no desenvolvimento.

O frontend faz chamadas locais para `/api/riot`. O proxy aceita apenas `GET`
nas rotas configuradas, adiciona a chave no servidor e encaminha a requisição
para o destino correspondente:

| Caminho local                                       | Destino                    | Tratamento da consulta       |
| --------------------------------------------------- | -------------------------- | ---------------------------- |
| `/api/riot/accounts/by-riot-id/{nome}/{tag}`        | Account-V1, `americas`     | Remove parâmetros            |
| `/api/riot/accounts/by-puuid/{puuid}`               | Account-V1, `americas`     | Remove parâmetros            |
| `/api/riot/summoners/by-puuid/{puuid}`              | Summoner-V4, `br1`         | Remove parâmetros            |
| `/api/riot/league/entries/by-puuid/{puuid}`         | League-V4, `br1`           | Remove parâmetros            |
| `/api/riot/champion-masteries/by-puuid/{puuid}/top` | Champion-Mastery-V4, `br1` | Fixa `count=3`               |
| `/api/riot/match/v5/matches/by-puuid/{puuid}/ids`   | Match-V5, `americas`       | Preserva filtros e paginação |
| `/api/riot/match/v5/matches/{matchId}`              | Match-V5, `americas`       | Remove parâmetros            |

Não existe encaminhamento genérico para todos os caminhos `/api/riot`.
O timeout do proxy é de 10 segundos e as respostas encaminhadas recebem
`Cache-Control: no-store`.

A rota de invocador retorna somente `profileIconId`, `revisionDate` e
`summonerLevel`. Erros da Riot mantêm o status e os dados de erro. As demais
rotas não filtram os campos no servidor; a seleção feita no serviço Angular
não remove campos da resposta original na aba Network.

As imagens e o catálogo do Data Dragon são consultados diretamente pelo navegador,
sem a chave de API. Os emblemas ranqueados são arquivos locais em `public/ranks/`;
sua origem está documentada em [public/ranks/README.md](public/ranks/README.md).

## Comandos disponíveis

| Comando                     | Uso                                                                                     |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `npm start`                 | Inicia o servidor de desenvolvimento com proxy                                          |
| `npm run build`             | Gera o build de produção                                                                |
| `npm run watch`             | Recompila o build de desenvolvimento ao alterar arquivos; não inicia servidor nem proxy |
| `npm test`                  | Executa os testes Angular com Vitest                                                    |
| `npm test -- --watch=false` | Executa os testes Angular uma única vez                                                 |
| `npm run ng -- <comando>`   | Executa o Angular CLI local                                                             |

Para gerar um componente:

```bash
npm run ng -- generate component components/meu-componente
```

Os testes Angular utilizam mocks para as chamadas HTTP e não precisam de uma
chave Riot válida. Não há uma suíte de testes de ponta a ponta configurada.

O proxy do Angular CLI funciona em `ng serve`; ele não é incluído no build.
Publicar apenas os arquivos estáticos não fornece a API necessária aos cards.
O `.env` local também não é enviado automaticamente ao host de produção.
Para distribuição pública, consulte os requisitos de registro e de chave de
produção no [Riot Developer Portal](https://developer.riotgames.com/docs/portal).

## Solução de problemas

| Sintoma                                  | O que verificar                                                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Erro 401 ou 403                          | Confira a chave, sua validade e suas permissões no portal; atualize o `.env` e reinicie o servidor               |
| Erro 404                                 | Confira o nome, a tagline e se a conta consultada possui dados de LoL em BR1                                     |
| Erro 405                                 | As rotas do proxy aceitam somente `GET`                                                                          |
| Erro 429                                 | Aguarde o período indicado por `Retry-After`, quando presente, e evite recargas repetidas                        |
| Erro 503                                 | Confira se a chave está configurada e se a Riot está disponível; o proxy também retorna 503 quando falta a chave |
| Erro 502 na rota de invocador            | O proxy não conseguiu interpretar ou transformar a resposta recebida da Riot                                     |
| Erro de conexão ou timeout               | Confira a internet, o terminal do servidor e o acesso à Riot; o proxy aguarda até 10 segundos                    |
| Imagens ausentes                         | Confira as requisições ao Data Dragon na aba Network e a presença dos arquivos em `public/ranks/`                |
| Site publicado abre, mas os cards falham | Configure a API/proxy de produção; o build estático não substitui o proxy de desenvolvimento                     |

## Organização do código

| Caminho                           | Responsabilidade                                                   |
| --------------------------------- | ------------------------------------------------------------------ |
| `src/app/app.routes.ts`           | Rotas da aplicação (`/` e `/profile/:id`)                          |
| `src/app/pages/summoner/`         | Página inicial com busca de invocadores                            |
| `src/app/pages/summoner/cards/`   | Card resumido do jogador com elos, maestrias e link para perfil    |
| `src/app/pages/summoner/profile/` | Página detalhada do jogador (winrate, histórico, campeões e rotas) |
| `src/app/pages/main/`             | Navbar e rodapé                                                    |
| `src/app/services/riot.ts`        | Consultas HTTP e composição dos dados dos perfis e partidas        |
| `src/app/models/riot.models.ts`   | Tipos e interfaces dos dados da Riot e Data Dragon                 |
| `src/proxy.conf.cjs`              | Autenticação e encaminhamento reverso de API no desenvolvimento    |
| `libs/ui/`                        | Componentes locais Spartan UI (Badge, Card, Progress, Table, Tabs) |
| `public/ranks/`                   | Emblemas oficiais ranqueados                                       |
| `.env.example`                    | Modelo das variáveis de ambiente                                   |
| `angular.json`                    | Configurações de build, servidor e testes                          |
