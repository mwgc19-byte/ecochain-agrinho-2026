/* =========================================================
   ECOCHAIN - PLATAFORMA SIMULADA DE REDISTRIBUIÇÃO
   Todo o projeto funciona somente no navegador, com JavaScript puro.
   Os dados permanecem em memória durante a sessão atual.
========================================================= */

/* =========================================================
   1. ARRAYS PRINCIPAIS
   Cada array representa uma área da plataforma.
   Não existe banco de dados: novos registros ficam disponíveis
   enquanto a página permanecer aberta.
========================================================= */

/* Lista que armazena mercados, produtores e demais parceiros cadastrados. */
const doadores = [];

/* Lista que armazena ONGs, escolas e demais locais que recebem alimentos. */
const pontosDestino = [];

/* Lista que armazena todos os alimentos adicionados pelo usuário. */
const doacoes = [];

/* Guarda o identificador do parceiro escolhido para realizar novas doações. */
let idDoadorAtivo = null;

/* Contador simples usado para criar identificadores únicos durante a sessão. */
let proximoId = 1;

/* =========================================================
   2. REFERÊNCIAS DOS ELEMENTOS DO HTML
   Centralizar essas referências deixa as funções menores e mais claras.
========================================================= */
const abas = [...document.querySelectorAll("[data-aba]")];
const secoes = [...document.querySelectorAll("[data-secao]")];

const formularioDoador = document.querySelector("#form-doador");
const listaDoadores = document.querySelector("[data-lista-doadores]");
const totalDoadores = document.querySelector("[data-total-doadores]");
const seletorTipoDoador = document.querySelector("#tipo-doador");
const campoOutroTipoDoador = document.querySelector("[data-campo-outro-doador]");
const inputOutroTipoDoador = document.querySelector("#outro-tipo-doador");
const inputTelefoneDoador = document.querySelector("#telefone-doador");

const formularioDestino = document.querySelector("#form-destino");
const listaDestinos = document.querySelector("[data-lista-destinos]");
const totalDestinos = document.querySelector("[data-total-destinos]");
const seletorTipoDestino = document.querySelector("#tipo-destino");
const campoOutroTipoDestino = document.querySelector("[data-campo-outro-destino]");
const inputOutroTipoDestino = document.querySelector("#outro-tipo-destino");

const formularioDoacao = document.querySelector("#form-doacao");
const listaDoacoes = document.querySelector("[data-lista-doacoes]");
const totalItens = document.querySelector("[data-total-itens]");
const botaoProcessar = document.querySelector("[data-processar]");
const painelResultado = document.querySelector("[data-resultado]");
const historico = document.querySelector("[data-historico]");
const avisoDoador = document.querySelector("[data-aviso-doador]");

/* Elementos do modal informativo aberto pelo botão "Saiba mais". */
const modalSaibaMais = document.querySelector("[data-modal-saiba-mais]");
const botoesAbrirModal = [...document.querySelectorAll("[data-abrir-modal]")];
const botaoFecharModal = document.querySelector("[data-fechar-modal]");

/* Elementos do dashboard atualizados a partir dos arrays da sessão. */
const graficoPrioridades = document.querySelector("[data-grafico-prioridades]");
const legendaPrioridades = document.querySelector("[data-legenda-prioridades]");
const graficoCategorias = document.querySelector("[data-grafico-categorias]");
const graficoDoadores = document.querySelector("[data-grafico-doadores]");
const totalPrioridades = document.querySelector("[data-total-prioridades]");
const totalCidades = document.querySelector("[data-total-cidades]");
const totalBairros = document.querySelector("[data-total-bairros]");
const listaCidades = document.querySelector("[data-lista-cidades]");
const listaBairros = document.querySelector("[data-lista-bairros]");

/* Elementos do carrossel que já existia na página inicial. */
const slides = [...document.querySelectorAll(".slide")];
const indicadoresCarrossel = [...document.querySelectorAll(".indicador")];
const botaoAnterior = document.querySelector(".controle-anterior");
const botaoProximo = document.querySelector(".controle-proximo");
const carrossel = document.querySelector(".carrossel");

let slideAtual = 0;
let intervaloCarrossel;

/* =========================================================
   3. FUNÇÕES AUXILIARES
========================================================= */

/* Formata valores numéricos no padrão brasileiro. Ex.: 1280 -> 1.280. */
function formatarNumero(valor) {
  return Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

/* Formata uma data digitada no campo HTML. Ex.: 2026-06-01 -> 01/06/2026. */
function formatarData(dataISO) {
  if (!dataISO) return "";

  return new Date(`${dataISO}T00:00:00`).toLocaleDateString("pt-BR");
}

/*
  Mantém somente números e monta o padrão brasileiro solicitado:
  43999999999 -> (43) 9 9999-9999.
  A formatação acontece durante a digitação, sem aceitar letras ou símbolos.
*/
function formatarTelefone(valorDigitado) {
  const numeros = valorDigitado.replace(/\D/g, "").slice(0, 11);

  if (numeros.length <= 2) return numeros;
  if (numeros.length <= 3) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 3)} ${numeros.slice(3)}`;

  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 3)} ${numeros.slice(3, 7)}-${numeros.slice(7)}`;
}

/*
  Exibe a quantidade de dias com uma frase humana.
  Isso evita textos pouco naturais como "1 dia(s) restantes".
*/
function formatarPrazoVencimento(dias) {
  if (dias < 0) return "validade expirada";
  if (dias === 0) return "vence hoje";
  if (dias === 1) return "1 dia até o vencimento";
  return `${dias} dias até o vencimento`;
}

/* Remove espaços extras antes de comparar cidades, bairros e categorias. */
function normalizarTexto(texto) {
  return String(texto).trim().toLocaleLowerCase("pt-BR");
}

/* Impede que um texto digitado pelo usuário seja interpretado como HTML. */
function escaparHTML(texto) {
  const elementoTemporario = document.createElement("div");
  elementoTemporario.textContent = texto;
  return elementoTemporario.innerHTML;
}

/* Gera um novo identificador sem depender da velocidade do computador. */
function gerarId() {
  return proximoId++;
}

/* Localiza o parceiro que está marcado como doador ativo. */
function obterDoadorAtivo() {
  return doadores.find((doador) => doador.id === idDoadorAtivo) || null;
}

/* Retorna somente os alimentos que já passaram pelo algoritmo. */
function obterDoacoesProcessadas() {
  return doacoes.filter((doacao) => doacao.processada);
}

/*
  Une localidades cadastradas em doadores e pontos de destino.
  O Map preserva a primeira escrita exibida pelo usuário, enquanto a
  chave normalizada evita repetir "Centro" e "centro", por exemplo.
*/
function obterLocalidadesUnicas(campo) {
  const localidades = new Map();

  [...doadores, ...pontosDestino].forEach((registro) => {
    if (!registro[campo]) return;
    localidades.set(normalizarTexto(registro[campo]), registro[campo].trim());
  });

  return [...localidades.values()].sort((textoA, textoB) => textoA.localeCompare(textoB, "pt-BR"));
}

/* =========================================================
   4. SISTEMA DE ABAS
   Somente uma seção fica visível por vez. O rodapé permanece fora
   das seções e continua presente em todas as áreas da plataforma.
========================================================= */
function exibirAba(nomeDaAba) {
  secoes.forEach((secao) => {
    const secaoSelecionada = secao.dataset.secao === nomeDaAba;

    secao.classList.toggle("secao-aba-ativa", secaoSelecionada);
    secao.hidden = !secaoSelecionada;
  });

  abas.forEach((aba) => {
    const abaSelecionada = aba.dataset.aba === nomeDaAba;

    aba.classList.toggle("ativa", abaSelecionada);

    if (abaSelecionada) {
      aba.setAttribute("aria-current", "page");
    } else {
      aba.removeAttribute("aria-current");
    }
  });

  /* O carrossel roda somente quando a aba Início está aberta. */
  if (nomeDaAba === "inicio") {
    iniciarRotacaoCarrossel();
  } else {
    clearInterval(intervaloCarrossel);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* Eventos dos cinco botões do menu principal. */
abas.forEach((aba) => {
  aba.addEventListener("click", (evento) => {
    evento.preventDefault();
    exibirAba(aba.dataset.aba);
  });
});

/* Links equivalentes no rodapé também abrem a aba correspondente. */
document.querySelectorAll('a[href^="#"]:not([data-aba])').forEach((link) => {
  link.addEventListener("click", (evento) => {
    const nomeDaAba = link.getAttribute("href").replace("#", "");
    const abasDisponiveis = ["inicio", "doadores", "destinos", "doacao", "relatorio"];

    if (abasDisponiveis.includes(nomeDaAba)) {
      evento.preventDefault();
      exibirAba(nomeDaAba);
    }
  });
});

/* Atalho apresentado na aba Doação quando nenhum parceiro foi selecionado. */
document.querySelector("[data-ir-doadores]").addEventListener("click", () => exibirAba("doadores"));

/* =========================================================
   5. CARROSSEL DA ABA INÍCIO
   Preserva a funcionalidade original: rotação automática,
   setas, indicadores e pausa ao posicionar o mouse.
========================================================= */
function exibirSlide(indice) {
  slideAtual = (indice + slides.length) % slides.length;

  slides.forEach((slide, posicao) => {
    slide.classList.toggle("ativo", posicao === slideAtual);
  });

  indicadoresCarrossel.forEach((indicador, posicao) => {
    const indicadorAtivo = posicao === slideAtual;

    indicador.classList.toggle("ativo", indicadorAtivo);
    indicador.setAttribute("aria-current", indicadorAtivo ? "true" : "false");
  });
}

function iniciarRotacaoCarrossel() {
  clearInterval(intervaloCarrossel);
  intervaloCarrossel = setInterval(() => exibirSlide(slideAtual + 1), 5500);
}

botaoAnterior.addEventListener("click", () => {
  exibirSlide(slideAtual - 1);
  iniciarRotacaoCarrossel();
});

botaoProximo.addEventListener("click", () => {
  exibirSlide(slideAtual + 1);
  iniciarRotacaoCarrossel();
});

indicadoresCarrossel.forEach((indicador, indice) => {
  indicador.addEventListener("click", () => {
    exibirSlide(indice);
    iniciarRotacaoCarrossel();
  });
});

carrossel.addEventListener("mouseenter", () => clearInterval(intervaloCarrossel));
carrossel.addEventListener("mouseleave", iniciarRotacaoCarrossel);

/* =========================================================
   6. MODAL "SAIBA MAIS"
   O popup pode ser fechado pelo botão X, pelo fundo escuro
   ou pela tecla Esc. O atributo hidden evita que ele ocupe
   espaço quando não estiver em uso.
========================================================= */
function abrirModalSaibaMais() {
  modalSaibaMais.hidden = false;
  document.body.classList.add("modal-aberto");
  botaoFecharModal.focus();
}

function fecharModalSaibaMais() {
  modalSaibaMais.hidden = true;
  document.body.classList.remove("modal-aberto");
}

botoesAbrirModal.forEach((botao) => {
  botao.addEventListener("click", (evento) => {
    evento.preventDefault();
    abrirModalSaibaMais();
  });
});

botaoFecharModal.addEventListener("click", fecharModalSaibaMais);

modalSaibaMais.addEventListener("click", (evento) => {
  if (evento.target === modalSaibaMais) fecharModalSaibaMais();
});

document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape" && !modalSaibaMais.hidden) fecharModalSaibaMais();
});

/*
  O botão final do modal encerra a apresentação e leva o usuário
  diretamente para a aba onde a redistribuição é simulada.
*/
document.querySelector("[data-modal-ir-doacao]").addEventListener("click", () => {
  fecharModalSaibaMais();
  exibirAba("doacao");
});

/* =========================================================
   7. CADASTRO E SELEÇÃO DE DOADORES
   O doador ativo será associado automaticamente às novas doações.
========================================================= */
/*
  Mostra ou oculta o campo complementar quando a opção "Outro"
  for escolhida. O required também acompanha a visibilidade.
*/
function atualizarCampoOutroDoador() {
  const selecionouOutro = seletorTipoDoador.value === "Outro";

  campoOutroTipoDoador.hidden = !selecionouOutro;
  inputOutroTipoDoador.required = selecionouOutro;

  if (!selecionouOutro) inputOutroTipoDoador.value = "";
}

seletorTipoDoador.addEventListener("change", atualizarCampoOutroDoador);

/* Formata o telefone imediatamente e elimina caracteres não numéricos. */
inputTelefoneDoador.addEventListener("input", () => {
  inputTelefoneDoador.value = formatarTelefone(inputTelefoneDoador.value);
});

formularioDoador.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const dados = new FormData(formularioDoador);
  const tipoSelecionado = dados.get("tipoDoador");
  const novoDoador = {
    id: gerarId(),
    nome: dados.get("nomeDoador").trim(),
    tipo: tipoSelecionado === "Outro" ? dados.get("outroTipoDoador").trim() : tipoSelecionado,
    nomeResponsavel: dados.get("nomeResponsavel").trim(),
    sobrenomeResponsavel: dados.get("sobrenomeResponsavel").trim(),
    telefone: formatarTelefone(dados.get("telefoneDoador")),
    email: dados.get("emailDoador").trim(),
    cidade: dados.get("cidadeDoador").trim(),
    bairro: dados.get("bairroDoador").trim()
  };

  doadores.push(novoDoador);

  /* O primeiro parceiro cadastrado se torna ativo automaticamente. */
  if (!idDoadorAtivo) {
    idDoadorAtivo = novoDoador.id;
  }

  formularioDoador.reset();
  atualizarCampoOutroDoador();
  atualizarInterfaceCompleta();
});

function selecionarDoador(id) {
  idDoadorAtivo = id;
  atualizarInterfaceCompleta();
}

function removerDoador(id) {
  const indice = doadores.findIndex((doador) => doador.id === id);

  if (indice !== -1) {
    doadores.splice(indice, 1);
  }

  if (idDoadorAtivo === id) {
    idDoadorAtivo = doadores[0]?.id || null;
  }

  atualizarInterfaceCompleta();
}

function atualizarListaDoadores() {
  totalDoadores.textContent = doadores.length;

  if (doadores.length === 0) {
    listaDoadores.innerHTML = `
      <div class="estado-vazio">
        <h3>Nenhum doador cadastrado</h3>
        <p>Cadastre o primeiro parceiro para começar a registrar alimentos.</p>
      </div>
    `;
    return;
  }

  listaDoadores.innerHTML = doadores.map((doador) => {
    const ativo = doador.id === idDoadorAtivo;

    return `
      <article class="card-cadastro ${ativo ? "card-ativo" : ""}">
        <span class="selo-cadastro">${ativo ? "Doador ativo" : escaparHTML(doador.tipo)}</span>
        <h3>${escaparHTML(doador.nome)}</h3>
        <p>${escaparHTML(doador.tipo)} · ${escaparHTML(doador.cidade)} · ${escaparHTML(doador.bairro)}</p>
        <p>Responsável: ${escaparHTML(doador.nomeResponsavel)} ${escaparHTML(doador.sobrenomeResponsavel)}</p>
        <p>${escaparHTML(doador.telefone)} · ${escaparHTML(doador.email)}</p>
        <div class="acoes-cadastro">
          ${ativo ? "" : `<button class="botao-card" type="button" data-ativar-doador="${doador.id}">Usar nas doações</button>`}
          <button class="botao-card botao-excluir" type="button" data-remover-doador="${doador.id}">Excluir</button>
        </div>
      </article>
    `;
  }).join("");

  document.querySelectorAll("[data-ativar-doador]").forEach((botao) => {
    botao.addEventListener("click", () => selecionarDoador(Number(botao.dataset.ativarDoador)));
  });

  document.querySelectorAll("[data-remover-doador]").forEach((botao) => {
    botao.addEventListener("click", () => removerDoador(Number(botao.dataset.removerDoador)));
  });
}

/* Atualiza o aviso da aba Doação com o parceiro selecionado. */
function atualizarAvisoDoador() {
  const doadorAtivo = obterDoadorAtivo();

  if (!doadorAtivo) {
    avisoDoador.classList.add("aviso-pendente");
    avisoDoador.querySelector("strong").textContent = "Nenhum doador ativo selecionado";
    avisoDoador.querySelector("p").textContent = "Cadastre ou selecione um parceiro na aba Doadores antes de registrar alimentos.";
    return;
  }

  avisoDoador.classList.remove("aviso-pendente");
  avisoDoador.querySelector("strong").textContent = `Doador ativo: ${doadorAtivo.nome}`;
  avisoDoador.querySelector("p").textContent = `${doadorAtivo.tipo} · ${doadorAtivo.cidade} · ${doadorAtivo.bairro}. Este parceiro será associado automaticamente aos novos alimentos.`;
}

/* =========================================================
   8. CADASTRO DE PONTOS DE DESTINO
   Esses locais serão comparados com cada alimento durante
   o processamento da redistribuição.
========================================================= */
/* Repete a lógica do campo "Outro" para os pontos de destino. */
function atualizarCampoOutroDestino() {
  const selecionouOutro = seletorTipoDestino.value === "Outro";

  campoOutroTipoDestino.hidden = !selecionouOutro;
  inputOutroTipoDestino.required = selecionouOutro;

  if (!selecionouOutro) inputOutroTipoDestino.value = "";
}

seletorTipoDestino.addEventListener("change", atualizarCampoOutroDestino);

formularioDestino.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const dados = new FormData(formularioDestino);
  const tipoSelecionado = dados.get("tipoDestino");
  const novoDestino = {
    id: gerarId(),
    nome: dados.get("nomeDestino").trim(),
    tipo: tipoSelecionado === "Outro" ? dados.get("outroTipoDestino").trim() : tipoSelecionado,
    cidade: dados.get("cidadeDestino").trim(),
    bairro: dados.get("bairroDestino").trim(),
    pessoasAtendidas: Number(dados.get("pessoasDestino")),
    refeicoesPorDia: Number(dados.get("refeicoesDestino"))
  };

  pontosDestino.push(novoDestino);
  formularioDestino.reset();
  atualizarCampoOutroDestino();
  atualizarInterfaceCompleta();
});

function removerDestino(id) {
  const indice = pontosDestino.findIndex((destino) => destino.id === id);

  if (indice !== -1) {
    pontosDestino.splice(indice, 1);
  }

  atualizarInterfaceCompleta();
}

function atualizarListaDestinos() {
  totalDestinos.textContent = pontosDestino.length;

  if (pontosDestino.length === 0) {
    listaDestinos.innerHTML = `
      <div class="estado-vazio">
        <h3>Nenhum ponto de destino cadastrado</h3>
        <p>Cadastre locais de atendimento para tornar as sugestões mais inteligentes.</p>
      </div>
    `;
    return;
  }

  listaDestinos.innerHTML = pontosDestino.map((destino) => `
    <article class="card-cadastro">
      <span class="selo-cadastro">${escaparHTML(destino.tipo)}</span>
      <h3>${escaparHTML(destino.nome)}</h3>
      <p>${escaparHTML(destino.cidade)} · ${escaparHTML(destino.bairro)}</p>
      <p>${formatarNumero(destino.pessoasAtendidas)} pessoas atendidas · ${formatarNumero(destino.refeicoesPorDia)} refeições/dia</p>
      <div class="acoes-cadastro">
        <button class="botao-card botao-excluir" type="button" data-remover-destino="${destino.id}">Excluir</button>
      </div>
    </article>
  `).join("");

  document.querySelectorAll("[data-remover-destino]").forEach((botao) => {
    botao.addEventListener("click", () => removerDestino(Number(botao.dataset.removerDestino)));
  });
}

/* =========================================================
   9. CÁLCULO DOS DIAS ATÉ O VENCIMENTO
   A data digitada pelo usuário é comparada com a data atual.
   Resultado negativo significa que a validade já passou.
========================================================= */
function calcularDiasAteVencimento(dataVencimento) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const vencimento = new Date(`${dataVencimento}T00:00:00`);
  const diferencaEmMilissegundos = vencimento - hoje;
  const umDiaEmMilissegundos = 1000 * 60 * 60 * 24;

  return Math.ceil(diferencaEmMilissegundos / umDiaEmMilissegundos);
}

/* =========================================================
   10. REGRA DE PERECIBILIDADE
   Categorias mais sensíveis precisam ser redistribuídas mais rápido.
========================================================= */
function obterNivelPerecibilidade(categoria) {
  const altamentePereciveis = ["Carnes", "Laticínios", "Refeições prontas"];
  const pereciveis = ["Hortifruti", "Padaria"];

  if (altamentePereciveis.includes(categoria)) return "alta";
  if (pereciveis.includes(categoria)) return "media";
  return "baixa";
}

/* =========================================================
   11. ALGORITMO DE PRIORIDADE
   Considera dias restantes e nível de perecibilidade.
   Itens expirados recebem atenção especial e não são distribuídos.
========================================================= */
function calcularPrioridade(doacao) {
  const dias = doacao.diasRestantes;
  const perecibilidade = obterNivelPerecibilidade(doacao.categoria);

  if (dias < 0) {
    return {
      prioridade: "Atenção",
      classePrioridade: "prioridade-atencao",
      justificativa: "A validade está expirada. O item precisa passar por conferência e não pode ser destinado diretamente."
    };
  }

  if (dias <= 2 || (perecibilidade === "alta" && dias <= 4)) {
    return {
      prioridade: "Alta",
      classePrioridade: "prioridade-alta",
      justificativa: `Prioridade alta porque ${doacao.categoria.toLowerCase()} exige agilidade e ${formatarPrazoVencimento(dias)}.`
    };
  }

  if ((perecibilidade === "media" && dias <= 5) || (perecibilidade === "alta" && dias <= 6)) {
    return {
      prioridade: "Média",
      classePrioridade: "prioridade-media",
      justificativa: `Prioridade média porque o alimento ainda pode ser distribuído com planejamento, mas ${formatarPrazoVencimento(dias)}.`
    };
  }

  return {
    prioridade: "Baixa",
    classePrioridade: "prioridade-baixa",
    justificativa: `Prioridade baixa porque ${formatarPrazoVencimento(dias)} e a redistribuição pode seguir o fluxo regular.`
  };
}

/* =========================================================
   12. ESCOLHA INTELIGENTE DO PONTO DE DESTINO
   Como os pontos não possuem mais uma necessidade principal,
   o sistema calcula uma pontuação explicável para cada opção:
   - proximidade simulada: mesmo bairro, mesma cidade ou outra cidade;
   - capacidade: pessoas atendidas e refeições médias por dia;
   - volume: entregas maiores favorecem estruturas mais preparadas;
   - perfil: bancos de alimentos ajudam em itens de validade longa;
   - prioridade: itens urgentes valorizam rapidez e proximidade.
========================================================= */
function calcularProximidade(doador, destino) {
  if (!doador) {
    return { pontos: 0, nivel: "não informada", texto: "a localização do doador não estava disponível para comparação" };
  }

  if (normalizarTexto(doador.bairro) === normalizarTexto(destino.bairro)) {
    return { pontos: 42, nivel: "mesmo bairro", texto: "está localizado no mesmo bairro da instituição doadora" };
  }

  if (normalizarTexto(doador.cidade) === normalizarTexto(destino.cidade)) {
    return { pontos: 22, nivel: "mesma cidade", texto: "está na mesma cidade, favorecendo uma entrega mais ágil" };
  }

  return { pontos: -10, nivel: "outra cidade", texto: "fica em outra cidade, mas compensa a distância com sua estrutura de atendimento" };
}

/* Retorna uma pontuação adicional conforme o perfil do ponto de destino. */
function calcularPontosPorTipo(destino, prioridade) {
  const estruturasDeTriagem = ["Banco de alimentos", "Associação", "Centro comunitário"];
  const estruturasDeConsumoRapido = ["ONG", "Cozinha comunitária", "Escola", "Projeto social"];

  if (prioridade === "Baixa" && estruturasDeTriagem.includes(destino.tipo)) return 28;
  if (prioridade === "Alta" && estruturasDeConsumoRapido.includes(destino.tipo)) return 16;
  if (prioridade === "Média" && estruturasDeConsumoRapido.includes(destino.tipo)) return 10;
  return 0;
}

/*
  Constrói uma justificativa diferente para cada cenário relevante.
  O objetivo não é variar palavras aleatoriamente, e sim destacar
  os fatores que efetivamente explicam a decisão tomada pelo sistema.
*/
function gerarJustificativaDestino(doacao, destino, analise) {
  const capacidade = `${formatarNumero(destino.pessoasAtendidas)} pessoas e ${formatarNumero(destino.refeicoesPorDia)} refeições médias por dia`;

  if (doacao.prioridade === "Baixa" && destino.tipo === "Banco de alimentos") {
    return `${destino.nome} foi priorizado porque o item possui validade mais longa e pode ser redistribuído estrategicamente para outras instituições da rede. A proximidade estimada indica que ${analise.proximidade.texto}.`;
  }

  if (doacao.quantidade >= 25) {
    return `Destino sugerido para ${destino.nome} devido ao volume disponível de ${formatarNumero(doacao.quantidade)} kg e à capacidade de atendimento da instituição, que alcança ${capacidade}. Além disso, ${analise.proximidade.texto}.`;
  }

  if (doacao.prioridade === "Alta") {
    return `Destino sugerido para ${destino.nome} porque o alimento possui validade próxima, ${analise.proximidade.texto} e o ponto possui capacidade para distribuir rapidamente os itens recebidos.`;
  }

  if (analise.proximidade.nivel === "mesmo bairro") {
    return `${destino.nome} foi sugerido por estar no mesmo bairro da instituição doadora. Essa proximidade reduz o tempo de deslocamento e favorece uma redistribuição organizada de ${formatarNumero(doacao.quantidade)} kg.`;
  }

  return `${destino.nome} foi selecionado após comparar distância estimada, perfil institucional e capacidade de atendimento. O ponto atende ${capacidade}, e ${analise.proximidade.texto}.`;
}

function sugerirDestino(doacao) {
  if (doacao.prioridade === "Atenção") {
    return {
      destino: "Conferência obrigatória",
      destinoId: null,
      destinoPadrao: true,
      motivoDestino: "Item marcado para conferência obrigatória devido à validade expirada. Não é recomendada a redistribuição direta para consumo."
    };
  }

  if (pontosDestino.length === 0) {
    const destinosPadrao = {
      Alta: "Destino padrão: famílias e ONGs",
      Média: "Destino padrão: escola ou cozinha comunitária",
      Baixa: "Destino padrão: banco de alimentos"
    };

    return {
      destino: destinosPadrao[doacao.prioridade],
      destinoId: null,
      destinoPadrao: true,
      motivoDestino: "Nenhum ponto de destino foi cadastrado. Foi usada uma orientação padrão para a simulação."
    };
  }

  const doador = doadores.find((item) => item.id === doacao.doadorId);
  const maiorCapacidade = Math.max(...pontosDestino.map((destino) => destino.refeicoesPorDia * 2 + destino.pessoasAtendidas), 1);

  /*
    A ordem dos pesos acompanha a explicação apresentada na banca:
    validade e perecibilidade definem a prioridade anteriormente;
    nesta etapa, proximidade pesa mais, seguida de capacidade,
    quantidade disponível e tipo da instituição.
  */
  const analises = pontosDestino.map((destino) => {
    const proximidade = calcularProximidade(doador, destino);
    const capacidadeBruta = destino.refeicoesPorDia * 2 + destino.pessoasAtendidas;
    const pontosCapacidade = capacidadeBruta / maiorCapacidade * 30;
    const pontosQuantidade = doacao.quantidade >= 25 ? pontosCapacidade * .55 : 0;
    const pontosTipo = calcularPontosPorTipo(destino, doacao.prioridade);
    const pontosUrgencia = doacao.prioridade === "Alta" && proximidade.nivel !== "outra cidade" ? 18 : 0;

    return {
      destino,
      proximidade,
      pontuacao: proximidade.pontos + pontosCapacidade + pontosQuantidade + pontosTipo + pontosUrgencia
    };
  });

  analises.sort((analiseA, analiseB) => analiseB.pontuacao - analiseA.pontuacao);

  const melhorAnalise = analises[0];
  const destinoEscolhido = melhorAnalise.destino;

  return {
    destino: destinoEscolhido.nome,
    destinoId: destinoEscolhido.id,
    destinoPadrao: false,
    motivoDestino: gerarJustificativaDestino(doacao, destinoEscolhido, melhorAnalise)
  };
}

/* =========================================================
   13. CADASTRO DE ALIMENTOS
   O doador não é digitado manualmente: vem do parceiro ativo.
========================================================= */
formularioDoacao.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const doadorAtivo = obterDoadorAtivo();

  if (!doadorAtivo) {
    exibirAba("doadores");
    return;
  }

  const dados = new FormData(formularioDoacao);
  const dataVencimento = dados.get("validade");

  doacoes.push({
    id: gerarId(),
    alimento: dados.get("alimento").trim(),
    categoria: dados.get("categoria"),
    quantidade: Number(dados.get("quantidade")),
    dataVencimento,
    diasRestantes: calcularDiasAteVencimento(dataVencimento),
    doadorId: doadorAtivo.id,
    doadorNome: doadorAtivo.nome,
    processada: false,
    prioridade: "",
    classePrioridade: "",
    justificativa: "",
    destino: "",
    destinoId: null,
    destinoPadrao: false,
    motivoDestino: ""
  });

  formularioDoacao.reset();
  atualizarInterfaceCompleta();
});

function removerDoacao(id) {
  const indice = doacoes.findIndex((doacao) => doacao.id === id);

  if (indice !== -1) {
    doacoes.splice(indice, 1);
  }

  atualizarInterfaceCompleta();
}

/* =========================================================
   14. PROCESSAMENTO DA REDISTRIBUIÇÃO
   Percorre todos os alimentos e aplica prioridade e destino.
========================================================= */
botaoProcessar.addEventListener("click", () => {
  doacoes.forEach((doacao) => {
    const prioridade = calcularPrioridade(doacao);

    doacao.processada = true;
    doacao.prioridade = prioridade.prioridade;
    doacao.classePrioridade = prioridade.classePrioridade;
    doacao.justificativa = prioridade.justificativa;

    const sugestao = sugerirDestino(doacao);

    doacao.destino = sugestao.destino;
    doacao.destinoId = sugestao.destinoId;
    doacao.destinoPadrao = sugestao.destinoPadrao;
    doacao.motivoDestino = sugestao.motivoDestino;
  });

  atualizarInterfaceCompleta();
});

/* =========================================================
   15. LISTA VISUAL DE DOAÇÕES
   Exibe validade, dias calculados, prioridade, justificativa e destino.
========================================================= */
function atualizarListaDoacoes() {
  totalItens.textContent = doacoes.length;
  botaoProcessar.disabled = doacoes.length === 0;

  if (doacoes.length === 0) {
    listaDoacoes.innerHTML = `
      <div class="estado-vazio">
        <h3>Nenhuma doação adicionada</h3>
        <p>Use o formulário acima para começar a montar a redistribuição.</p>
      </div>
    `;
    return;
  }

  listaDoacoes.innerHTML = doacoes.map((doacao) => {
    const prioridade = doacao.processada
      ? `<span class="selo-prioridade ${doacao.classePrioridade}">${doacao.prioridade}</span>`
      : `<span class="selo-prioridade">Aguardando processamento</span>`;

    const destino = doacao.processada ? escaparHTML(doacao.destino) : "Será definido automaticamente";
    const avisoDestino = doacao.destinoPadrao && doacao.processada
      ? `<span class="aviso-destino-padrao">Sugestão padrão</span>`
      : "";

    return `
      <article class="item-doacao">
        <div>
          <h3>${escaparHTML(doacao.alimento)}</h3>
          <p>${escaparHTML(doacao.categoria)}</p>
        </div>
        <div>
          <strong>${formatarNumero(doacao.quantidade)} kg</strong>
          <span>${escaparHTML(doacao.doadorNome)}</span>
        </div>
        <div>
          <strong>${formatarData(doacao.dataVencimento)}</strong>
          <span>${formatarPrazoVencimento(doacao.diasRestantes)}</span>
        </div>
        <div>
          ${prioridade}
        </div>
        <div class="item-doacao-destino">
          <strong>${destino}</strong>
          ${avisoDestino}
          ${doacao.processada ? `<p class="item-doacao-justificativa">${escaparHTML(doacao.justificativa)} ${escaparHTML(doacao.motivoDestino)}</p>` : ""}
        </div>
        <button class="botao-remover" type="button" data-remover-doacao="${doacao.id}" aria-label="Remover ${escaparHTML(doacao.alimento)}">&times;</button>
      </article>
    `;
  }).join("");

  document.querySelectorAll("[data-remover-doacao]").forEach((botao) => {
    botao.addEventListener("click", () => removerDoacao(Number(botao.dataset.removerDoacao)));
  });
}

/* =========================================================
   16. RESULTADO DA ABA DOAÇÃO
   Resume as quatro situações possíveis após o processamento.
========================================================= */
function atualizarResultado() {
  const processadas = obterDoacoesProcessadas();

  if (processadas.length === 0) {
    painelResultado.innerHTML = "<p>Cadastre os alimentos e processe a redistribuição para visualizar o resumo.</p>";
    return;
  }

  const contar = (prioridade) => processadas.filter((doacao) => doacao.prioridade === prioridade).length;

  painelResultado.innerHTML = `
    <div class="resultado-grade">
      <article class="resultado-card"><strong>${contar("Alta")}</strong><span>Prioridade alta</span></article>
      <article class="resultado-card"><strong>${contar("Média")}</strong><span>Prioridade média</span></article>
      <article class="resultado-card"><strong>${contar("Baixa")}</strong><span>Prioridade baixa</span></article>
      <article class="resultado-card"><strong>${contar("Atenção")}</strong><span>Itens em atenção</span></article>
    </div>
  `;
}

/* =========================================================
   17. INDICADORES DA HOME E DO RELATÓRIO
   Os números são calculados com os arrays da sessão atual.
========================================================= */
function calcularIndicadoresAtuais() {
  const processadas = obterDoacoesProcessadas();
  const distribuidas = processadas.filter((doacao) => doacao.prioridade !== "Atenção");
  const itensAtencao = processadas.filter((doacao) => doacao.prioridade === "Atenção");

  /*
    Pessoas alcançadas representa a capacidade total da rede cadastrada.
    Cada ponto aparece uma única vez no array, por isso não há duplicação
    quando o mesmo local recebe várias sugestões de redistribuição.
    Não existe estimativa por kg doado.
  */
  const pessoasAlcancadas = pontosDestino.reduce((total, destino) => total + destino.pessoasAtendidas, 0);
  const cidadesCadastradas = obterLocalidadesUnicas("cidade");
  const bairrosCadastrados = obterLocalidadesUnicas("bairro");

  return {
    alimentosSalvos: distribuidas.reduce((total, doacao) => total + doacao.quantidade, 0),
    pessoasAlcancadas,
    doadoresCadastrados: doadores.length,
    pontosDestino: pontosDestino.length,
    doacoesProcessadas: processadas.length,
    itensAtencao: itensAtencao.length,
    cidadesCadastradas: cidadesCadastradas.length,
    bairrosCadastrados: bairrosCadastrados.length,
    ultimaAtualizacao: "agora"
  };
}

function atualizarIndicadores() {
  const indicadores = calcularIndicadoresAtuais();

  document.querySelectorAll("[data-metrica]").forEach((elemento) => {
    const nome = elemento.dataset.metrica;
    if (nome in indicadores) elemento.textContent = typeof indicadores[nome] === "number" ? formatarNumero(indicadores[nome]) : indicadores[nome];
  });

  document.querySelectorAll("[data-relatorio]").forEach((elemento) => {
    const nome = elemento.dataset.relatorio;
    if (nome in indicadores) elemento.textContent = formatarNumero(indicadores[nome]);
  });
}

/* =========================================================
   18. GRÁFICOS DO DASHBOARD
   Os gráficos usam somente HTML, CSS e JavaScript:
   - a rosca recebe um conic-gradient calculado;
   - as barras recebem largura ou altura proporcional ao maior valor;
   - o painel de localidades usa cidades e bairros sem repetição.
========================================================= */

/* Conta quantas ocorrências existem para cada valor de uma propriedade. */
function contarPorPropriedade(lista, propriedade) {
  return lista.reduce((contagem, item) => {
    const chave = item[propriedade] || "Não informado";
    contagem[chave] = (contagem[chave] || 0) + 1;
    return contagem;
  }, {});
}

/* Atualiza a rosca e a legenda das quatro prioridades possíveis. */
function atualizarGraficoPrioridades() {
  const processadas = obterDoacoesProcessadas();
  const prioridades = [
    { nome: "Alta", cor: "#d75442" },
    { nome: "Média", cor: "#e5b53e" },
    { nome: "Baixa", cor: "#70ad45" },
    { nome: "Atenção", cor: "#9f3f35" }
  ];
  const total = processadas.length;
  let inicio = 0;

  const fatias = prioridades.map((item) => {
    const quantidade = processadas.filter((doacao) => doacao.prioridade === item.nome).length;
    const tamanho = total ? quantidade / total * 100 : 0;
    const fatia = `${item.cor} ${inicio}% ${inicio + tamanho}%`;

    inicio += tamanho;
    return { ...item, quantidade, fatia };
  });

  graficoPrioridades.style.background = total
    ? `conic-gradient(${fatias.map((item) => item.fatia).join(", ")})`
    : "conic-gradient(#e3ece0 0 100%)";

  totalPrioridades.textContent = total;
  legendaPrioridades.innerHTML = fatias.map((item) => `
    <div>
      <i style="--cor-legenda: ${item.cor}"></i>
      <span>${item.nome}</span>
      <strong>${item.quantidade}</strong>
    </div>
  `).join("");
}

/* Monta as barras verticais de categorias a partir das doações processadas. */
function atualizarGraficoCategorias() {
  const contagem = contarPorPropriedade(obterDoacoesProcessadas(), "categoria");
  const entradas = Object.entries(contagem).sort((itemA, itemB) => itemB[1] - itemA[1]);
  const maiorValor = Math.max(...entradas.map(([, valor]) => valor), 1);

  if (entradas.length === 0) {
    graficoCategorias.innerHTML = '<p class="grafico-vazio">Processe doações para visualizar as categorias.</p>';
    return;
  }

  graficoCategorias.innerHTML = entradas.map(([categoria, quantidade]) => `
    <div class="barra-vertical-item">
      <strong>${quantidade}</strong>
      <div><span style="height: ${Math.max(18, quantidade / maiorValor * 100)}%"></span></div>
      <small>${escaparHTML(categoria)}</small>
    </div>
  `).join("");
}

/* Monta barras horizontais para mostrar quais parceiros formam a rede. */
function atualizarGraficoTiposDoadores() {
  const contagem = contarPorPropriedade(doadores, "tipo");
  const entradas = Object.entries(contagem).sort((itemA, itemB) => itemB[1] - itemA[1]);
  const maiorValor = Math.max(...entradas.map(([, valor]) => valor), 1);

  if (entradas.length === 0) {
    graficoDoadores.innerHTML = '<p class="grafico-vazio">Cadastre doadores para visualizar os tipos de parceiros.</p>';
    return;
  }

  graficoDoadores.innerHTML = entradas.map(([tipo, quantidade]) => `
    <div class="barra-horizontal-item">
      <div><span>${escaparHTML(tipo)}</span><strong>${quantidade}</strong></div>
      <i><b style="width: ${quantidade / maiorValor * 100}%"></b></i>
    </div>
  `).join("");
}

/* Atualiza o mini painel que apresenta a abrangência territorial da rede. */
function atualizarPainelLocalidades() {
  const cidades = obterLocalidadesUnicas("cidade");
  const bairros = obterLocalidadesUnicas("bairro");

  totalCidades.textContent = cidades.length;
  totalBairros.textContent = bairros.length;
  listaCidades.textContent = cidades.length ? cidades.join(", ") : "Nenhuma cidade cadastrada.";
  listaBairros.textContent = bairros.length ? bairros.join(", ") : "Nenhum bairro ou vila cadastrado.";
}

/* Sincroniza todos os elementos visuais do dashboard em uma única chamada. */
function atualizarDashboard() {
  atualizarGraficoPrioridades();
  atualizarGraficoCategorias();
  atualizarGraficoTiposDoadores();
  atualizarPainelLocalidades();
}

/* =========================================================
   19. HISTÓRICO DO RELATÓRIO
   Inclui inclusive itens expirados, pois eles precisam permanecer
   registrados para conferência e transparência.
========================================================= */
function atualizarHistorico() {
  const processadas = obterDoacoesProcessadas();

  if (processadas.length === 0) {
    historico.innerHTML = `
      <tr class="linha-vazia">
        <td colspan="6">Nenhuma redistribuição foi processada até o momento.</td>
      </tr>
    `;
    return;
  }

  historico.innerHTML = processadas.map((doacao) => `
    <tr>
      <td>
        <div class="historico-alimento">
          <span class="historico-icone">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 13c1-7 6-9 14-9-1 8-5 13-12 13" /><path d="M5 20c2-6 6-9 11-12" /></svg>
          </span>
          <div><strong>${escaparHTML(doacao.alimento)}</strong><small>${escaparHTML(doacao.categoria)}</small></div>
        </div>
      </td>
      <td>${escaparHTML(doacao.doadorNome)}</td>
      <td><strong>${formatarNumero(doacao.quantidade)} kg</strong></td>
      <td>${formatarData(doacao.dataVencimento)}</td>
      <td>
        <span class="selo-prioridade ${doacao.classePrioridade}">${doacao.prioridade}</span>
        <small class="historico-prazo">${formatarPrazoVencimento(doacao.diasRestantes)}</small>
      </td>
      <td>
        <div class="historico-destino">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-5.1 7-12a7 7 0 1 0-14 0c0 6.9 7 12 7 12Z" /><circle cx="12" cy="9" r="2.3" /></svg>
          <strong>${escaparHTML(doacao.destino)}</strong>
        </div>
      </td>
    </tr>
  `).join("");
}

/* =========================================================
   20. ATUALIZAÇÃO CENTRAL DA INTERFACE
   Uma única função sincroniza listas, cards e relatório.
========================================================= */
function atualizarInterfaceCompleta() {
  atualizarListaDoadores();
  atualizarListaDestinos();
  atualizarAvisoDoador();
  atualizarListaDoacoes();
  atualizarResultado();
  atualizarIndicadores();
  atualizarDashboard();
  atualizarHistorico();
}

/* =========================================================
   21. INICIALIZAÇÃO
========================================================= */
document.querySelector("[data-ano-atual]").textContent = new Date().getFullYear();

const abaInicial = window.location.hash.replace("#", "");
const abasDisponiveis = ["inicio", "doadores", "destinos", "doacao", "relatorio"];

atualizarInterfaceCompleta();

if (abasDisponiveis.includes(abaInicial)) {
  exibirAba(abaInicial);
} else {
  iniciarRotacaoCarrossel();
}
