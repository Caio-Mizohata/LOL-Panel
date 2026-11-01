# LOL-Panel

Painel de jogadores de League of Legends.
A página inicial mostra um carrossel com os jogadores configurados localmente,
seus níveis, classificações Solo/Duo e Flex, vitórias, derrotas e até três maiores
maestrias de campeões.

O projeto utiliza Angular 22.2, TypeScript 6, RxJS, Tailwind CSS 4 e componentes
Spartan UI. Os dados vêm da API da Riot Games e as imagens de campeões e perfis
vêm do Data Dragon. As consultas de invocadores, classificações e maestrias estão
configuradas para o servidor brasileiro (**BR1**).

## Projeto feito exclusivamente para uso pessoal e privado para uma comunidade específica.

Este projeto não tem fins lucrativos, não tem vinculo com a Riot Games ou qualquer outra empresa. Ele é apenas um painel para acompanhar o desempenho dos jogadores. Mas seu uso para fins de testes e desenvolvimento é permitido.

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

### 3. Configurar os jogadores

Crie o arquivo local a partir do exemplo:

```bash
cp src/app/pages/summoner/summoner.puuids.example.ts src/app/pages/summoner/summoner.puuids.local.ts
```

Essa cópia é necessária também antes de compilar ou executar os testes em uma
nova instalação, porque o arquivo é importado pelo código Angular.

Edite `src/app/pages/summoner/summoner.puuids.local.ts` e preencha o array:

```ts
export const PLAYER_PUUIDS: readonly string[] = [
  'PUUID_DO_PRIMEIRO_JOGADOR',
  'PUUID_DO_SEGUNDO_JOGADOR',
];
```

Substitua os valores ilustrativos por PUUIDs reais. Para obtê-los, consulte o
endpoint Account-V1 por Riot ID no portal da Riot, usando a região `americas`
e os campos `gameName` e `tagLine` separados. Use o campo `puuid` retornado.
[Documentação da Riot sobre Riot ID e PUUID](https://developer.riotgames.com/docs/lol#summoner-names-to-riot-ids).

O loop em `summoner.config.ts` remove espaços no início e no fim das entradas,
ignora valores vazios e elimina duplicatas, preservando a ordem da lista. Ele
não valida os identificadores junto à Riot; um valor incorreto pode resultar
em erro ao carregar o card.

O array pode ficar vazio; nesse caso, a página informa que nenhum perfil foi
configurado. Alterações no arquivo local são incorporadas pelo servidor de
desenvolvimento; um site publicado precisa de um novo build para atualizar a lista.

O arquivo local está ignorado pelo Git, mas seus valores são incluídos na
aplicação Angular e podem ser vistos no navegador. Essa separação evita
comitá-los, mas não os mantém secretos para quem acessa a aplicação.

## Executar e usar a aplicação

Depois de configurar os arquivos locais e resolver a importação ausente do DTO:

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

1. Os jogadores da lista local são carregados automaticamente, cada um com seu
   estado de carregamento ou mensagem de erro.
2. Use as setas, os indicadores abaixo dos cards ou a rolagem horizontal para
   navegar. Os indicadores representam as posições alcançáveis do carrossel e
   se ajustam à largura da tela.
3. Cada card exibe o Riot ID, o nível, as filas ranqueadas e as maiores maestrias.
   Uma fila sem classificação aparece como “Sem classificação”; falhas ao buscar
   as classificações aparecem como “Indisponível”.

Se o catálogo do Data Dragon falhar, o perfil pode continuar disponível sem as
imagens dos campeões e do jogador. Falhas ao buscar a conta, o invocador ou as
maestrias impedem o carregamento completo daquele perfil.

### Funcionalidades ainda não conectadas

- O link **Ver perfil** tem `href=""` e ainda não abre uma página de detalhes.
- O componente de busca existe, mas não está conectado à página inicial.
- A única rota configurada é `/`. Os componentes de perfil e estatísticas ainda
  possuem conteúdo inicial de desenvolvimento.
- O serviço possui um método para detalhes de partidas, mas a rota correspondente
  não está configurada no proxy. O histórico não é exibido no carrossel atual.

## Como funciona o proxy

Durante `npm start`, o Angular CLI carrega `src/proxy.conf.cjs`, conforme
`angular.json`. Não é necessário iniciar uma API Node separada no desenvolvimento.

O frontend faz chamadas locais para `/api/riot`. O proxy aceita apenas `GET`
nas rotas configuradas, adiciona a chave no servidor e encaminha a requisição
para o destino correspondente:

| Caminho local                                       | Destino                    | Tratamento da consulta        |
| --------------------------------------------------- | -------------------------- | ----------------------------- |
| `/api/riot/accounts/by-riot-id/{nome}/{tag}`        | Account-V1, `americas`     | Remove parâmetros             |
| `/api/riot/accounts/by-puuid/{puuid}`               | Account-V1, `americas`     | Remove parâmetros             |
| `/api/riot/summoners/by-puuid/{puuid}`              | Summoner-V4, `br1`         | Remove parâmetros; aplica DTO |
| `/api/riot/league/entries/by-puuid/{puuid}`         | League-V4, `br1`           | Remove parâmetros             |
| `/api/riot/champion-masteries/by-puuid/{puuid}/top` | Champion-Mastery-V4, `br1` | Fixa `count=3`                |
| `/api/riot/match/v5/matches/by-puuid/{puuid}/ids`   | Match-V5, `americas`       | Preserva filtros e paginação  |

Não existe encaminhamento genérico para todos os caminhos `/api/riot`.
O timeout do proxy é de 10 segundos e as respostas encaminhadas recebem
`Cache-Control: no-store`.

A configuração prevê um exemplo de DTO apenas na rota de invocador. Após
restaurar o módulo indicado no início deste documento, essa rota retorna somente
`profileIconId`, `revisionDate` e `summonerLevel`. Erros da Riot mantêm o status e
os dados de erro. As demais rotas não filtram os campos no servidor; a seleção
feita no serviço Angular não remove campos da resposta original na aba Network.

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
| `npm test -- --watch=false` | Executa os testes Angular uma única vez                                       
| `npm run ng -- <comando>`   | Executa o Angular CLI local                                                             |

Para gerar um componente:

```bash
npm run ng -- generate component components/meu-componente
```

Os testes Angular utilizam mocks para as chamadas HTTP e não precisam de uma
chave Riot válida. O arquivo local de PUUIDs precisa existir, mas pode conter
um array vazio. Não há uma suíte de testes de ponta a ponta configurada.



O proxy do Angular CLI funciona em `ng serve`; ele não é incluído no build.
Publicar apenas os arquivos estáticos não fornece a API necessária aos cards.
O `.env` local também não é enviado automaticamente ao host de produção.
Para distribuição pública, consulte os requisitos de registro e de chave de
produção no [Riot Developer Portal](https://developer.riotgames.com/docs/portal).

## Solução de problemas

| Sintoma                                               | O que verificar                                                                                                  |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Importação de `summoner.puuids.local` não encontrada  | Copie o arquivo de exemplo para o nome local antes de iniciar, testar ou compilar                                |
| “Nenhum perfil configurado”                           | Preencha `PLAYER_PUUIDS`; entradas vazias são descartadas                                                        |
| Erro 401 ou 403                                       | Confira a chave, sua validade e suas permissões no portal; atualize o `.env` e reinicie o servidor               |
| Erro 404                                              | Verifique o PUUID e se a conta consultada possui os dados de LoL esperados em BR1                                |
| Erro 405                                              | As rotas do proxy aceitam somente `GET`                                                                          |
| Erro 429                                              | Aguarde o período indicado por `Retry-After`, quando presente, e evite recargas repetidas                        |
| Erro 503                                              | Confira se a chave está configurada e se a Riot está disponível; o proxy também retorna 503 quando falta a chave |
| Erro 502 na rota de invocador                         | O proxy não conseguiu interpretar ou transformar a resposta recebida da Riot                                     |
| Erro de conexão ou timeout                            | Confira a internet, o terminal do servidor e o acesso à Riot; o proxy aguarda até 10 segundos                    |
| Imagens ausentes                                      | Confira as requisições ao Data Dragon na aba Network e a presença dos arquivos em `public/ranks/`                |
| Site publicado abre, mas os cards falham              | Configure a API/proxy de produção; o build estático não substitui o proxy de desenvolvimento                     |
                                                

## Organização do código

| Caminho                      | Responsabilidade                                       |
| ---------------------------- | ------------------------------------------------------ |
| `src/app/app.routes.ts`      | Rotas da aplicação                                     |
| `src/app/pages/summoner/`    | Carrossel, configuração da lista e cards               |
| `src/app/pages/main/`        | Navbar e rodapé                                        |
| `src/app/components/search/` | Componente de busca ainda não conectado à tela inicial |
| `src/app/services/riot.ts`   | Consultas HTTP e composição dos dados dos perfis       |
| `src/app/models/`            | Tipos dos dados utilizados pelo Angular                |
| `src/proxy.conf.cjs`         | Autenticação e encaminhamento no desenvolvimento       |
| `libs/ui/`                   | Componentes locais da interface Spartan                |
| `public/ranks/`              | Emblemas ranqueados                                    |
| `.env.example`               | Modelo das variáveis de ambiente                       |
| `angular.json`               | Configurações de build, servidor e testes              |
