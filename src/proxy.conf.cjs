const { resolve } = require('node:path');
const { config } = require('dotenv');
const { gunzipSync, inflateSync, brotliDecompressSync } = require('node:zlib');

// Proxy do servidor de desenvolvimento do Angular CLI: encaminha as chamadas
// /api/riot para a Riot e adiciona a chave de API no servidor, sem enviá-la ao navegador.
// Este arquivo não é incluído no bundle da aplicação nem configura o servidor de produção.

// Carrega o .env da raiz do projeto, independentemente do diretório de execução.
// A chave é lida ao iniciar o servidor; reinicie o ng serve após alterá-la.
config({ path: resolve(__dirname, '../.env'), quiet: true });
const apiKey = process.env.RIOT_API_KEY?.trim();

/**
 * Define as opções e os eventos compartilhados pelas rotas da Riot.
 * @param {string} target - Origem de destino, regional (Americas) ou de plataforma (BR1).
 * @param {(path: string) => string} rewrite - Converte o caminho local no endpoint da Riot,
 * incluindo o tratamento dos parâmetros de consulta aceitos pela rota.
 * @param {(body: object) => object} [toDto] - Seleciona os campos enviados ao navegador.
 * @returns {object} Configuração consumida pelo proxy do servidor de desenvolvimento.
 */
function riotProxy(target, rewrite, toDto) {
  return {
    target,
    changeOrigin: true,
    secure: true,
    proxyTimeout: 10000,
    rewrite,
    selfHandleResponse: Boolean(toDto),
    bypass(req, res) {
      // Encaminha somente GET com chave configurada. As demais chamadas recebem
      // uma resposta local: 405 para outros métodos ou 503 para ausência de chave.
      if (req.method === 'GET' && apiKey) return;
      res.writeHead(req.method !== 'GET' ? 405 : 503, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(
        JSON.stringify({
          message:
            req.method !== 'GET'
              ? 'Método não permitido.'
              : 'Configure RIOT_API_KEY no .env e reinicie o Angular.',
        }),
      );
      return req.url;
    },
    configure(proxy) {
      proxy.on('proxyReq', (proxyReq) => {
        // Define a autenticação na requisição de saída para a Riot.
        proxyReq.setHeader('X-Riot-Token', apiKey);
      });
      proxy.on('proxyRes', async (proxyRes, _req, res) => {
        // Impede que as respostas encaminhadas sejam armazenadas em cache HTTP.
        proxyRes.headers['cache-control'] = 'no-store';
        if (!toDto) return;

        // Erros da Riot mantêm o status, os cabeçalhos (como Retry-After) e o corpo.
        const status = proxyRes.statusCode ?? 502;
        if (status < 200 || status >= 300) {
          res.writeHead(status, proxyRes.headers);
          proxyRes.on('error', () => res.destroy());
          proxyRes.pipe(res);
          return;
        }

        try {
          const chunks = [];
          for await (const chunk of proxyRes) chunks.push(Buffer.from(chunk));
          let body = Buffer.concat(chunks);
          switch (proxyRes.headers['content-encoding']) {
            case 'gzip':
              body = gunzipSync(body);
              break;
            case 'deflate':
              body = inflateSync(body);
              break;
            case 'br':
              body = brotliDecompressSync(body);
              break;
          }

          const dto = toDto(JSON.parse(body.toString('utf8')));
          // O JSON mudou: não reutilize tamanho, compressão ou ETag da resposta original.
          res.writeHead(status, {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
          });
          res.end(JSON.stringify(dto));
        } catch {
          res.writeHead(502, {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
          });
          res.end(JSON.stringify({ message: 'Resposta inválida da API da Riot.' }));
        }
      });
    },
  };
}

// Os padrões delimitam os caminhos encaminhados; não há uma regra genérica para /api/riot.
// Cada rewrite abaixo decide se preserva, remove ou fixa os parâmetros de consulta.
module.exports = {
  // Histórico de partidas: usa Americas e preserva filtros e paginação da consulta.
  '^/api/riot/match/v5/matches/by-puuid/[^/?]+/ids(?:\\?.*)?$': riotProxy(
    'https://americas.api.riotgames.com',
    (path) => path.replace('/api/riot/match/v5/', '/lol/match/v5/'),
  ),
  // Classificações ranqueadas: usa BR1 e remove os parâmetros de consulta.
  '^/api/riot/league/entries/by-puuid/[^/?]+(?:\\?.*)?$': riotProxy(
    'https://br1.api.riotgames.com',
    (path) => path.split('?')[0].replace('/api/riot/league/', '/lol/league/v4/'),
  ),
  // Conta por Riot ID (nome e tag) ou PUUID: usa Americas, sem parâmetros de consulta.
  '^/api/riot/accounts/by-riot-id/[^/?]+/[^/?]+(?:\\?.*)?$': riotProxy(
    'https://americas.api.riotgames.com',
    (path) => path.split('?')[0].replace('/api/riot/accounts/', '/riot/account/v1/accounts/'),
  ),
  '^/api/riot/accounts/by-puuid/[^/?]+(?:\\?.*)?$': riotProxy(
    'https://americas.api.riotgames.com',
    (path) => path.split('?')[0].replace('/api/riot/accounts/', '/riot/account/v1/accounts/'),
  ),
  // Exemplo de DTO: apenas esta rota filtra os campos da resposta no servidor.
  // Usa BR1 e remove os parâmetros de consulta.
  '^/api/riot/summoners/by-puuid/[^/?]+(?:\\?.*)?$': riotProxy(
    'https://br1.api.riotgames.com',
    (path) => path.split('?')[0].replace('/api/riot/summoners/', '/lol/summoner/v4/summoners/'),
  ),
  // Maestrias: usa BR1 e substitui a consulta por count=3, limitando o resultado.
  '^/api/riot/champion-masteries/by-puuid/[^/?]+/top(?:\\?.*)?$': riotProxy(
    'https://br1.api.riotgames.com',
    (path) =>
      path
        .split('?')[0]
        .replace('/api/riot/champion-masteries/', '/lol/champion-mastery/v4/champion-masteries/') +
      '?count=3',
  ),
};
