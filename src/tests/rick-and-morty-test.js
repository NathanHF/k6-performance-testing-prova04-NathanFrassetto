
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/latest/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export const getCharacterDuration = new Trend('get_character', true);
export const RateContentOK = new Rate('content_OK');

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.25'],
    http_req_duration: ['p(90)<6800'],
    content_OK: ['rate>0.75']
  },

  stages: [
    { duration: '5s', target: 1 },
    { duration: '5s', target: 2 },
    { duration: '10s', target: 3 },
    { duration: '5s', target: 2 },
    { duration: '5s', target: 0 }
  ]
};

export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, {
      indent: ' ',
      enableColors: true
    })
  };
}

let erroRegistrado = false;

export default function () {
  const baseUrl = 'https://rickandmortyapi.com/api';

  const params = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const OK = 200;

  const res = http.get(`${baseUrl}/character/1`, params);

  if (res.status !== OK && !erroRegistrado) {
    console.error(
      `ERRO HTTP ${res.status} - ${res.body.substring(0, 150)}`
    );

    erroRegistrado = true;
  }

  getCharacterDuration.add(res.timings.duration);

  const personagemEncontrado =
    res.status === OK && res.json('name') === 'Rick Sanchez';

  RateContentOK.add(personagemEncontrado);

  check(res, {
    'GET Character - Status 200': (r) => r.status === OK,

    'GET Character - Rick Sanchez encontrado': () =>
      personagemEncontrado
  });

  sleep(2);
}
