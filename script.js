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

/*
  Sugestões iniciais usadas pelos campos com datalist.
  O usuário continua livre para digitar algo novo, mas estes exemplos
  orientam a escrita e ajudam a evitar duplicidades no relatório.
*/
const sugestoesIniciais = {
  cidades: ["Telêmaco Borba", "Imbaú", "Tibagi", "Ortigueira", "Londrina", "Curitiba"],
  bairros: ["Centro", "Vila Verde", "Jardim Alegre", "Área Rural", "Distrito Industrial"],
  alimentos: ["Arroz", "Feijão", "Leite", "Banana", "Maçã", "Laranja", "Alface", "Tomate", "Batata", "Cenoura", "Pão francês", "Pão de forma", "Bolo simples", "Iogurte", "Queijo", "Frango", "Carne bovina", "Linguiça", "Marmita", "Sopa pronta", "Arroz com frango", "Macarrão", "Farinha de trigo", "Óleo de soja"],
  tiposPersonalizados: ["Feira livre", "Produtor rural", "Mercado local", "Associação", "Cozinha comunitária", "Banco de alimentos", "Escola", "Projeto social"]
};

/*
  Mapa didático de alimentos conhecidos.
  Ele não impede alimentos novos, mas ajuda a manter coerência quando o
  sistema reconhece um item comum. Ex.: Laranja deve entrar como Hortifruti.
*/
const alimentosConhecidosPorCategoria = {
  Hortifruti: ["Laranja", "Banana", "Maçã", "Alface", "Tomate", "Batata", "Cenoura", "Verduras", "Legumes"],
  Padaria: ["Pão", "Pão francês", "Pão de forma", "Bolo simples"],
  Laticínios: ["Leite", "Iogurte", "Queijo"],
  Carnes: ["Frango", "Carne bovina", "Linguiça"],
  "Refeições prontas": ["Marmita", "Sopa pronta", "Arroz com frango"],
  Mercearia: ["Arroz", "Feijão", "Macarrão", "Farinha de trigo", "Óleo de soja"]
};

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
const inputAlimento = document.querySelector("#alimento");
const seletorCategoria = document.querySelector("#categoria");
const listaDoacoes = document.querySelector("[data-lista-doacoes]");
const listaDoacoesPendentes = document.querySelector("[data-lista-doacoes-pendentes]");
const totalItens = document.querySelector("[data-total-itens]");
const totalPendentes = document.querySelector("[data-total-pendentes]");
const botaoProcessar = document.querySelector("[data-processar]");
const painelResultado = document.querySelector("[data-resultado]");
const historico = document.querySelector("[data-historico]");
const avisoDoador = document.querySelector("[data-aviso-doador]");
const avisoCategoria = document.querySelector("[data-aviso-categoria]");
const botaoDemo = document.querySelector("[data-demo-toggle]");

/* Elementos datalist usados para sugerir escrita padronizada sem bloquear novos valores. */
const datalists = {
  cidades: document.querySelector("#lista-cidades"),
  bairros: document.querySelector("#lista-bairros"),
  alimentos: document.querySelector("#lista-alimentos"),
  nomesDoadores: document.querySelector("#lista-nomes-doadores"),
  nomesDestinos: document.querySelector("#lista-nomes-destinos"),
  tiposPersonalizados: document.querySelector("#lista-tipos-personalizados")
};

/* Elementos do modal informativo aberto pelo botão "Saiba mais". */
const modalSaibaMais = document.querySelector("[data-modal-saiba-mais]");
const botoesAbrirModal = [...document.querySelectorAll("[data-abrir-modal]")];
const botaoFecharModal = document.querySelector("[data-fechar-modal]");
const barraProgressoModal = document.querySelector("[data-modal-progresso]");

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
const listaLocalidadesDetalhadas = document.querySelector("[data-localidades-detalhadas]");
const relatorioVazio = document.querySelector("[data-relatorio-vazio]");

/* Elementos do modal de filtro por prioridade, separado do "Saiba mais". */
const modalFiltro = document.querySelector("[data-modal-filtro]");
const botaoFecharModalFiltro = document.querySelector("[data-fechar-modal-filtro]");
const tituloFiltroPrioridade = document.querySelector("[data-titulo-filtro-prioridade]");
const contagemFiltroPrioridade = document.querySelector("[data-contagem-filtro-prioridade]");
const listaFiltroPrioridade = document.querySelector("[data-lista-filtro-prioridade]");

/* Elementos do carrossel que já existia na página inicial. */
const slides = [...document.querySelectorAll(".slide")];
const indicadoresCarrossel = [...document.querySelectorAll(".indicador")];
const botaoAnterior = document.querySelector(".controle-anterior");
const botaoProximo = document.querySelector(".controle-proximo");
const carrossel = document.querySelector(".carrossel");

let slideAtual = 0;
let intervaloCarrossel;
let demonstracaoAtiva = false;

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
function limparEspacosTexto(texto) {
  return String(texto || "").trim().replace(/\s+/g, " ");
}

/*
  Cria uma chave de comparação para textos digitáveis.
  A chave ignora maiúsculas, minúsculas, acentos e espaços duplicados.
  Ex.: "Telêmaco Borba", "telemaco borba" e "TELEMACO   BORBA"
  passam a ser entendidos como o mesmo valor.
*/
function normalizarChaveTexto(texto) {
  return limparEspacosTexto(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

/*
  Mantém o nome da função já usada no projeto, mas melhora sua regra.
  Assim o algoritmo de proximidade e o painel de localidades também
  passam a comparar cidade/bairro sem diferenciar acentos.
*/
function normalizarTexto(texto) {
  return normalizarChaveTexto(texto);
}

/*
  Procura um alimento dentro do mapa de alimentos conhecidos.
  A comparação ignora acentos, maiúsculas/minúsculas e espaços extras.
*/
function obterCategoriaConhecida(alimentoDigitado) {
  const chaveAlimento = normalizarChaveTexto(alimentoDigitado);

  if (!chaveAlimento) return null;

  for (const [categoria, alimentos] of Object.entries(alimentosConhecidosPorCategoria)) {
    const alimentoEncontrado = alimentos.find((alimento) => normalizarChaveTexto(alimento) === chaveAlimento);

    if (alimentoEncontrado) {
      return { alimento: alimentoEncontrado, categoria };
    }
  }

  return null;
}

/* Mostra uma mensagem curta e discreta abaixo do campo de categoria. */
function exibirAvisoCategoria(mensagem) {
  if (!avisoCategoria) return;

  avisoCategoria.textContent = mensagem;
  avisoCategoria.hidden = false;
}

/* Remove o aviso quando não há correção ou orientação necessária. */
function ocultarAvisoCategoria() {
  if (!avisoCategoria) return;

  avisoCategoria.textContent = "";
  avisoCategoria.hidden = true;
}

/*
  Garante coerência entre alimento e categoria.
  Se o alimento for conhecido e a categoria estiver errada, o sistema
  corrige automaticamente e explica o motivo ao usuário.
*/
function validarCategoriaDaDoacao(alimento, categoriaEscolhida) {
  const alimentoConhecido = obterCategoriaConhecida(alimento);

  if (!alimentoConhecido) {
    ocultarAvisoCategoria();
    return categoriaEscolhida;
  }

  if (!categoriaEscolhida || categoriaEscolhida !== alimentoConhecido.categoria) {
    if (seletorCategoria) seletorCategoria.value = alimentoConhecido.categoria;
    exibirAvisoCategoria(`Categoria ajustada: o item ${alimentoConhecido.alimento} deve ser cadastrado como ${alimentoConhecido.categoria}.`);
    return alimentoConhecido.categoria;
  }

  ocultarAvisoCategoria();
  return categoriaEscolhida;
}

/*
  Unifica tipos equivalentes para não fragmentar relatório e gráfico.
  Mercado, Supermercado e Hipermercado passam a contar como "Mercado".
*/
function normalizarTipoDoador(tipo) {
  const tipoLimpo = limparEspacosTexto(tipo);
  const chaveTipo = normalizarChaveTexto(tipoLimpo);

  if (["mercado", "supermercado", "hipermercado"].includes(chaveTipo)) {
    return "Mercado";
  }

  return tipoLimpo;
}

/*
  Formata valores novos em estilo título para campos onde isso faz sentido.
  Palavras pequenas permanecem minúsculas no meio do texto para soar natural.
  Ex.: "jardim primavera" -> "Jardim Primavera".
*/
function formatarTextoTitulo(texto) {
  const palavrasMinusculas = ["da", "de", "do", "das", "dos", "e"];

  return limparEspacosTexto(texto)
    .toLocaleLowerCase("pt-BR")
    .split(" ")
    .map((palavra, indice) => {
      if (indice > 0 && palavrasMinusculas.includes(palavra)) return palavra;
      return palavra.charAt(0).toLocaleUpperCase("pt-BR") + palavra.slice(1);
    })
    .join(" ");
}

/*
  Busca se o valor digitado equivale a algo que já existe.
  Quando encontra, retorna a versão mais bonita já cadastrada ou sugerida.
*/
function encontrarValorEquivalente(valorDigitado, listaExistente) {
  const chaveDigitada = normalizarChaveTexto(valorDigitado);

  if (!chaveDigitada) return "";

  return listaExistente.find((valor) => normalizarChaveTexto(valor) === chaveDigitada) || "";
}

/*
  Ordenação usada apenas na renderização visual das listas.
  O array original permanece intacto, preservando a lógica do sistema.
*/
function ordenarMaisRecentesPrimeiro(itens) {
  return [...itens].sort((itemA, itemB) => itemB.id - itemA.id);
}

/*
  Padroniza campos de alto impacto: cidade, bairro, alimento e tipos "Outro".
  Primeiro tenta reaproveitar uma escrita conhecida; se for algo novo,
  salva em estilo título para manter relatórios e gráficos mais limpos.
*/
function padronizarValorDigitado(valorDigitado, listaExistente = []) {
  const valorLimpo = limparEspacosTexto(valorDigitado);
  const equivalente = encontrarValorEquivalente(valorLimpo, listaExistente);

  return equivalente || formatarTextoTitulo(valorLimpo);
}

/*
  Para nomes comerciais, a padronização é leve.
  Não substituímos automaticamente por outro nome parecido, pois
  "Mercado São José" e "Mercado São José Centro" podem ser lugares diferentes.
*/
function padronizarNomeComercial(valorDigitado) {
  return limparEspacosTexto(valorDigitado);
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
    const chave = normalizarTexto(registro[campo]);
    if (!localidades.has(chave)) localidades.set(chave, limparEspacosTexto(registro[campo]));
  });

  return [...localidades.values()].sort((textoA, textoB) => textoA.localeCompare(textoB, "pt-BR"));
}

/*
  Junta listas sem duplicar valores equivalentes.
  Isso alimenta os datalists com exemplos iniciais e registros reais,
  mantendo apenas uma opção visual para "Centro", "centro" e variações.
*/
function combinarSugestoes(...listas) {
  const sugestoes = new Map();

  listas.flat().forEach((valor) => {
    const valorLimpo = limparEspacosTexto(valor);
    const chave = normalizarChaveTexto(valorLimpo);

    if (chave && !sugestoes.has(chave)) {
      sugestoes.set(chave, valorLimpo);
    }
  });

  return [...sugestoes.values()].sort((textoA, textoB) => textoA.localeCompare(textoB, "pt-BR"));
}

/* Escreve as opções dentro de um datalist específico. */
function preencherDatalist(elemento, opcoes) {
  if (!elemento) return;

  elemento.innerHTML = opcoes
    .map((opcao) => `<option value="${escaparHTML(opcao)}"></option>`)
    .join("");
}

/*
  Atualiza todas as sugestões com base nos arrays atuais.
  A chamada acontece após cadastros e remoções para manter os campos
  sempre aprendendo com o que o usuário registrou na sessão.
*/
function atualizarDatalists() {
  const cidadesCadastradas = obterLocalidadesUnicas("cidade");
  const bairrosCadastrados = obterLocalidadesUnicas("bairro");
  const alimentosCadastrados = doacoes.map((doacao) => doacao.alimento);
  const nomesDoadores = doadores.map((doador) => doador.nome);
  const nomesDestinos = pontosDestino.map((destino) => destino.nome);
  const tiposPersonalizados = [
    ...doadores.map((doador) => doador.tipo),
    ...pontosDestino.map((destino) => destino.tipo)
  ];

  preencherDatalist(datalists.cidades, combinarSugestoes(sugestoesIniciais.cidades, cidadesCadastradas));
  preencherDatalist(datalists.bairros, combinarSugestoes(sugestoesIniciais.bairros, bairrosCadastrados));
  preencherDatalist(datalists.alimentos, combinarSugestoes(sugestoesIniciais.alimentos, alimentosCadastrados));
  preencherDatalist(datalists.nomesDoadores, combinarSugestoes(nomesDoadores));
  preencherDatalist(datalists.nomesDestinos, combinarSugestoes(nomesDestinos));
  preencherDatalist(datalists.tiposPersonalizados, combinarSugestoes(sugestoesIniciais.tiposPersonalizados, tiposPersonalizados));
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
  modalSaibaMais.querySelector(".modal-saiba-mais").scrollTop = 0;
  atualizarProgressoModal();
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
  if (evento.key === "Escape" && modalFiltro && !modalFiltro.hidden) fecharModalFiltroPrioridade();
});

/*
  Atualiza uma barra discreta no topo do modal.
  Ela ajuda o visitante a perceber que está percorrendo uma jornada
  de apresentação, sem criar uma navegação complexa.
*/
function atualizarProgressoModal() {
  const corpoModal = modalSaibaMais.querySelector(".modal-saiba-mais");
  const areaRolavel = corpoModal.scrollHeight - corpoModal.clientHeight;
  const progresso = areaRolavel > 0 ? corpoModal.scrollTop / areaRolavel * 100 : 0;

  barraProgressoModal.style.width = `${progresso}%`;
}

modalSaibaMais.querySelector(".modal-saiba-mais").addEventListener("scroll", atualizarProgressoModal);

/*
  Algumas versões do modal podem ter um CTA final para a aba Doação.
  A verificação condicional evita erro quando o fechamento é apenas
  institucional, como na versão atual da apresentação.
*/
const botaoModalIrDoacao = document.querySelector("[data-modal-ir-doacao]");

if (botaoModalIrDoacao) {
  botaoModalIrDoacao.addEventListener("click", () => {
    fecharModalSaibaMais();
    exibirAba("doacao");
  });
}

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
  const cidadesConhecidas = combinarSugestoes(sugestoesIniciais.cidades, obterLocalidadesUnicas("cidade"));
  const bairrosConhecidos = combinarSugestoes(sugestoesIniciais.bairros, obterLocalidadesUnicas("bairro"));
  const tiposConhecidos = combinarSugestoes(
    sugestoesIniciais.tiposPersonalizados,
    doadores.map((doador) => doador.tipo),
    pontosDestino.map((destino) => destino.tipo)
  );
  const novoDoador = {
    id: gerarId(),
    nome: padronizarNomeComercial(dados.get("nomeDoador")),
    tipo: normalizarTipoDoador(tipoSelecionado === "Outro" ? padronizarValorDigitado(dados.get("outroTipoDoador"), tiposConhecidos) : tipoSelecionado),
    nomeResponsavel: dados.get("nomeResponsavel").trim(),
    sobrenomeResponsavel: dados.get("sobrenomeResponsavel").trim(),
    telefone: formatarTelefone(dados.get("telefoneDoador")),
    email: dados.get("emailDoador").trim(),
    cidade: padronizarValorDigitado(dados.get("cidadeDoador"), cidadesConhecidas),
    bairro: padronizarValorDigitado(dados.get("bairroDoador"), bairrosConhecidos)
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

  listaDoadores.innerHTML = ordenarMaisRecentesPrimeiro(doadores).map((doador) => {
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
  const cidadesConhecidas = combinarSugestoes(sugestoesIniciais.cidades, obterLocalidadesUnicas("cidade"));
  const bairrosConhecidos = combinarSugestoes(sugestoesIniciais.bairros, obterLocalidadesUnicas("bairro"));
  const tiposConhecidos = combinarSugestoes(
    sugestoesIniciais.tiposPersonalizados,
    doadores.map((doador) => doador.tipo),
    pontosDestino.map((destino) => destino.tipo)
  );
  const novoDestino = {
    id: gerarId(),
    nome: padronizarNomeComercial(dados.get("nomeDestino")),
    tipo: tipoSelecionado === "Outro" ? padronizarValorDigitado(dados.get("outroTipoDestino"), tiposConhecidos) : tipoSelecionado,
    cidade: padronizarValorDigitado(dados.get("cidadeDestino"), cidadesConhecidas),
    bairro: padronizarValorDigitado(dados.get("bairroDestino"), bairrosConhecidos),
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

  listaDestinos.innerHTML = ordenarMaisRecentesPrimeiro(pontosDestino).map((destino) => `
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
/* Ao digitar alimento ou trocar categoria, a plataforma tenta corrigir
   inconsistências conhecidas sem bloquear alimentos novos. */
if (inputAlimento && seletorCategoria) {
  inputAlimento.addEventListener("input", () => {
    validarCategoriaDaDoacao(inputAlimento.value, seletorCategoria.value);
  });

  seletorCategoria.addEventListener("change", () => {
    validarCategoriaDaDoacao(inputAlimento.value, seletorCategoria.value);
  });
}

formularioDoacao.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const doadorAtivo = obterDoadorAtivo();

  if (!doadorAtivo) {
    exibirAba("doadores");
    return;
  }

  const dados = new FormData(formularioDoacao);
  const dataVencimento = dados.get("validade");
  const alimentosConhecidos = combinarSugestoes(sugestoesIniciais.alimentos, doacoes.map((doacao) => doacao.alimento));
  const alimentoPadronizado = padronizarValorDigitado(dados.get("alimento"), alimentosConhecidos);
  const categoriaValidada = validarCategoriaDaDoacao(alimentoPadronizado, dados.get("categoria"));

  doacoes.push({
    id: gerarId(),
    alimento: alimentoPadronizado,
    categoria: categoriaValidada,
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
  ocultarAvisoCategoria();
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
function processarRedistribuicao() {
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
}

botaoProcessar.addEventListener("click", processarRedistribuicao);

/* =========================================================
   15. DEMONSTRAÇÃO PELO SÍMBOLO DA MARCA
   O controle fica no símbolo corrente + folha.
   Como não há banco de dados, limpar a demonstração zera
   somente os arrays em memória da sessão atual.
========================================================= */
function obterDataDemo(diasAteVencimento) {
  const data = new Date();
  data.setDate(data.getDate() + diasAteVencimento);
  return data.toISOString().slice(0, 10);
}

function atualizarEstadoVisualDemonstracao() {
  if (!botaoDemo) return;

  botaoDemo.classList.toggle("demo-ativa", demonstracaoAtiva);
  botaoDemo.classList.toggle("demo-inativa", !demonstracaoAtiva);

  const textoAcao = demonstracaoAtiva ? "Limpar demonstração" : "Ativar demonstração";
  botaoDemo.setAttribute("aria-label", textoAcao);
  botaoDemo.setAttribute("title", textoAcao);
}

function animarSimboloDemonstracao() {
  if (!botaoDemo) return;

  botaoDemo.classList.remove("demo-pulso");
  void botaoDemo.offsetWidth;
  botaoDemo.classList.add("demo-pulso");
}

function limparDadosDemonstracao() {
  doadores.splice(0, doadores.length);
  pontosDestino.splice(0, pontosDestino.length);
  doacoes.splice(0, doacoes.length);

  idDoadorAtivo = null;
  proximoId = 1;
  demonstracaoAtiva = false;

  formularioDoador.reset();
  formularioDestino.reset();
  formularioDoacao.reset();
  atualizarCampoOutroDoador();
  atualizarCampoOutroDestino();
  atualizarEstadoVisualDemonstracao();
  atualizarInterfaceCompleta();
  animarSimboloDemonstracao();
}

function carregarDadosDemonstracao() {
  limparDadosDemonstracao();

  /*
    Base territorial da demonstração.
    As cidades e bairros se repetem para o algoritmo conseguir simular
    proximidade: mesmo bairro, mesma cidade ou cidade diferente.
  */
  const cidadesDemo = ["Telêmaco Borba", "Imbaú", "Tibagi", "Ortigueira", "Londrina", "Curitiba"];
  const bairrosDemo = ["Centro", "Área Rural", "Vila Verde", "Jardim Alegre", "Distrito Industrial"];
  const tiposDoadoresDemo = ["Mercado", "Supermercado", "Padaria", "Restaurante", "Produtor rural", "Feirante", "Escola", "Igreja", "Empresa", "Cooperativa"];
  const nomesDoadoresDemo = [
    "Mercado Boa Safra",
    "Padaria Pão da Vila",
    "Feira Verde",
    "Sítio Esperança",
    "Restaurante Sabor Caseiro",
    "Cooperativa Campo Vivo",
    "Supermercado Nova Colheita",
    "Produtor Vale Verde",
    "Escola Raízes do Campo",
    "Igreja São Francisco",
    "Empresa Alimento Certo",
    "Mercado Sol da Manhã",
    "Padaria Trigo Bom",
    "Feira da Comunidade",
    "Sítio Bela Terra",
    "Restaurante Tempero da Casa",
    "Cooperativa Rota Rural",
    "Supermercado União",
    "Produtor Água Clara",
    "Igreja Mãos Unidas",
    "Empresa Mesa Cheia",
    "Mercado Caminho Verde",
    "Padaria Forno Amigo",
    "Feira Campo Aberto"
  ];
  const responsaveisDemo = [
    ["Ana", "Souza"], ["Carlos", "Lima"], ["Marina", "Oliveira"], ["João", "Ferreira"],
    ["Paula", "Mendes"], ["Rafael", "Almeida"], ["Bianca", "Ribeiro"], ["Sérgio", "Costa"],
    ["Luana", "Martins"], ["Mateus", "Rocha"], ["Helena", "Barbosa"], ["Diego", "Pereira"],
    ["Renata", "Gomes"], ["Bruno", "Azevedo"], ["Camila", "Nunes"], ["Eduardo", "Cardoso"],
    ["Isabela", "Teixeira"], ["André", "Moura"], ["Patrícia", "Campos"], ["Felipe", "Dias"],
    ["Clara", "Moreira"], ["Vitor", "Freitas"], ["Juliana", "Santos"], ["Marcelo", "Vieira"]
  ];

  /*
    Cadastro automático de 24 doadores: quatro instituições por cidade.
    O primeiro parceiro vira doador ativo para a aba Doação já funcionar.
  */
  const doadoresDemoCriados = nomesDoadoresDemo.map((nome, indice) => {
    const cidade = cidadesDemo[Math.floor(indice / 4)];
    const bairro = bairrosDemo[indice % bairrosDemo.length];
    const [nomeResponsavel, sobrenomeResponsavel] = responsaveisDemo[indice];
    const doador = {
      id: gerarId(),
      nome,
      tipo: normalizarTipoDoador(tiposDoadoresDemo[indice % tiposDoadoresDemo.length]),
      nomeResponsavel,
      sobrenomeResponsavel,
      telefone: formatarTelefone(`43${9}${String(88000000 + indice * 137).slice(0, 8)}`),
      email: `${normalizarChaveTexto(nome).replace(/\s+/g, ".")}@demo.ecochain`,
      cidade,
      bairro
    };

    doadores.push(doador);
    return doador;
  });

  idDoadorAtivo = doadoresDemoCriados[0].id;

  /*
    Pontos de destino usados pelo algoritmo.
    Há dois ou três por cidade, com capacidades diferentes para o painel
    conseguir demonstrar escolhas por proximidade e estrutura.
  */
  const pontosDestinoDemo = [
    ["Escola Municipal Rio Verde", "Escola", "Telêmaco Borba", "Centro", 320, 410],
    ["Igreja São José", "Igreja", "Telêmaco Borba", "Vila Verde", 140, 95],
    ["Banco de Alimentos Campos Gerais", "Banco de alimentos", "Telêmaco Borba", "Distrito Industrial", 520, 260],
    ["Cozinha Comunitária Esperança", "Cozinha comunitária", "Imbaú", "Centro", 180, 240],
    ["Associação Mãos do Campo", "Associação", "Imbaú", "Área Rural", 115, 85],
    ["Projeto Social Ponte Verde", "Projeto social", "Tibagi", "Jardim Alegre", 210, 190],
    ["Comunidade Rural São Bento", "Comunidade rural", "Tibagi", "Área Rural", 96, 70],
    ["Escola Municipal Água Clara", "Escola", "Tibagi", "Centro", 280, 330],
    ["Banco de Alimentos Caminho Verde", "Banco de alimentos", "Ortigueira", "Distrito Industrial", 430, 210],
    ["Igreja Mãos Unidas", "Igreja", "Ortigueira", "Vila Verde", 160, 120],
    ["Cozinha Comunitária Novo Amanhã", "Cozinha comunitária", "Londrina", "Centro", 360, 520],
    ["Associação Vila Viva", "Associação", "Londrina", "Jardim Alegre", 240, 180],
    ["Escola Popular Jardim Norte", "Escola", "Londrina", "Vila Verde", 410, 460],
    ["Projeto Social Mesa Aberta", "Projeto social", "Curitiba", "Centro", 390, 480],
    ["Banco de Alimentos Capital", "Banco de alimentos", "Curitiba", "Distrito Industrial", 680, 360]
  ];

  pontosDestinoDemo.forEach(([nome, tipo, cidade, bairro, pessoasAtendidas, refeicoesPorDia]) => {
    pontosDestino.push({
      id: gerarId(),
      nome,
      tipo,
      cidade,
      bairro,
      pessoasAtendidas,
      refeicoesPorDia
    });
  });

  /*
    Lista com 54 doações simuladas.
    As datas são relativas ao dia atual para a apresentação nunca ficar
    desatualizada: existem itens expirados, vencendo hoje e com prazos longos.
  */
  const alimentosDemo = [
    ["Laranja", "Hortifruti"], ["Banana", "Hortifruti"], ["Maçã", "Hortifruti"],
    ["Alface", "Hortifruti"], ["Tomate", "Hortifruti"], ["Batata", "Hortifruti"],
    ["Cenoura", "Hortifruti"], ["Pão francês", "Padaria"], ["Pão de forma", "Padaria"],
    ["Bolo simples", "Padaria"], ["Leite", "Laticínios"], ["Iogurte", "Laticínios"],
    ["Queijo", "Laticínios"], ["Frango", "Carnes"], ["Carne bovina", "Carnes"],
    ["Linguiça", "Carnes"], ["Marmita", "Refeições prontas"], ["Sopa pronta", "Refeições prontas"],
    ["Arroz com frango", "Refeições prontas"], ["Arroz", "Mercearia"], ["Feijão", "Mercearia"],
    ["Macarrão", "Mercearia"], ["Farinha de trigo", "Mercearia"], ["Óleo de soja", "Mercearia"]
  ];
  const prazosDemo = [-3, -1, 0, 1, 2, 3, 5, 7, 10, 15, 30, 1, 4, 6, 2, 0, 12, 5];
  const quantidadesDemo = [4, 6, 8, 12, 18, 24, 32, 45, 60, 75, 5, 14, 22, 36, 58, 7, 16, 28];
  const doacoesDemo = Array.from({ length: 54 }, (_, indice) => {
    const [alimento, categoria] = alimentosDemo[indice % alimentosDemo.length];
    const doador = doadoresDemoCriados[indice % doadoresDemoCriados.length];

    return {
      alimento,
      categoria,
      quantidade: quantidadesDemo[(indice + Math.floor(indice / 6)) % quantidadesDemo.length],
      dias: prazosDemo[(indice + Math.floor(indice / 9)) % prazosDemo.length],
      doadorId: doador.id,
      doadorNome: doador.nome
    };
  });

  doacoesDemo.forEach((item) => {
    const dataVencimento = obterDataDemo(item.dias);

    doacoes.push({
      id: gerarId(),
      alimento: item.alimento,
      categoria: item.categoria,
      quantidade: item.quantidade,
      dataVencimento,
      diasRestantes: calcularDiasAteVencimento(dataVencimento),
      doadorId: item.doadorId,
      doadorNome: item.doadorNome,
      processada: false,
      prioridade: "",
      classePrioridade: "",
      justificativa: "",
      destino: "",
      destinoId: null,
      destinoPadrao: false,
      motivoDestino: ""
    });
  });

  demonstracaoAtiva = true;
  atualizarEstadoVisualDemonstracao();
  processarRedistribuicao();
  animarSimboloDemonstracao();
}

function alternarDemonstracao() {
  if (demonstracaoAtiva) {
    limparDadosDemonstracao();
    return;
  }

  carregarDadosDemonstracao();
}

if (botaoDemo) {
  botaoDemo.addEventListener("click", alternarDemonstracao);
}

/* =========================================================
   15. LISTA VISUAL DE DOAÇÕES
   Exibe validade, dias calculados, prioridade, justificativa e destino.
========================================================= */
/* Monta um card de doação reutilizado nas listas de pendentes e cadastradas. */
function montarCardDoacao(doacao, opcoes = {}) {
  const prioridade = doacao.processada
    ? `<span class="selo-prioridade ${doacao.classePrioridade}">${doacao.prioridade}</span>`
    : `<span class="selo-prioridade">Aguardando processamento</span>`;

  const destino = doacao.processada ? escaparHTML(doacao.destino) : "Será definido automaticamente";
  const avisoDestino = doacao.destinoPadrao && doacao.processada
    ? `<span class="aviso-destino-padrao">Sugestão padrão</span>`
    : "";
  const classeCompacta = opcoes.compacto ? "item-doacao-pendente" : "";

  return `
    <article class="item-doacao ${classeCompacta}">
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
}

function atualizarListaDoacoes() {
  const doacoesOrdenadas = ordenarMaisRecentesPrimeiro(doacoes);
  const pendentesOrdenadas = ordenarMaisRecentesPrimeiro(doacoes.filter((doacao) => !doacao.processada));

  totalItens.textContent = doacoes.length;
  totalPendentes.textContent = pendentesOrdenadas.length;
  botaoProcessar.disabled = pendentesOrdenadas.length === 0;

  if (pendentesOrdenadas.length === 0) {
    listaDoacoesPendentes.innerHTML = `
      <div class="estado-vazio">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20V10M18 20V4M6 20v-6M3 20h18" /></svg>
        <h3>Nenhuma doação pendente</h3>
        <p>Cadastre um alimento para liberar o processamento, ou acompanhe os itens já processados abaixo.</p>
      </div>
    `;
  } else {
    listaDoacoesPendentes.innerHTML = pendentesOrdenadas.map((doacao) => montarCardDoacao(doacao, { compacto: true })).join("");
  }

  if (doacoes.length === 0) {
    listaDoacoes.innerHTML = `
      <div class="estado-vazio">
        <h3>Nenhuma doação adicionada</h3>
        <p>Use o formulário acima para começar a montar a redistribuição.</p>
      </div>
    `;
    return;
  }

  listaDoacoes.innerHTML = doacoesOrdenadas.map((doacao) => montarCardDoacao(doacao)).join("");

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
  const cards = [
    { prioridade: "Atenção", titulo: "Atenção", subtitulo: "Conferência obrigatória", quantidade: contar("Atenção") },
    { prioridade: "Alta", titulo: "Prioridade Alta", subtitulo: "Redistribuição urgente", quantidade: contar("Alta") },
    { prioridade: "Média", titulo: "Prioridade Média", subtitulo: "Planejamento rápido", quantidade: contar("Média") },
    { prioridade: "Baixa", titulo: "Prioridade Baixa", subtitulo: "Fluxo regular", quantidade: contar("Baixa") }
  ];

  painelResultado.innerHTML = `
    <div class="resultado-grade">
      ${cards.map((card) => `
        <button class="resultado-card resultado-card-filtro" type="button" data-filtro-prioridade="${card.prioridade}" aria-label="Abrir filtro de ${card.titulo}">
          <strong>${card.quantidade}</strong>
          <span>${card.titulo}</span>
          <small>${card.subtitulo}</small>
        </button>
      `).join("")}
    </div>
  `;

  document.querySelectorAll("[data-filtro-prioridade]").forEach((botao) => {
    botao.addEventListener("click", () => abrirModalFiltroPrioridade(botao.dataset.filtroPrioridade));
  });
}

/* =========================================================
   17. MODAL DE FILTRO POR PRIORIDADE
   Mostra detalhes das doações processadas sem permitir edição.
========================================================= */
function obterDestinoPorId(idDestino) {
  return pontosDestino.find((destino) => destino.id === idDestino) || null;
}

function obterResumoLocalidadeDoador(doacao) {
  const doador = doadores.find((item) => item.id === doacao.doadorId);

  if (!doador) return "Localidade do doador não informada";
  return `${doador.cidade} · ${doador.bairro}`;
}

function montarItemFiltroPrioridade(doacao) {
  const destino = obterDestinoPorId(doacao.destinoId);
  const localDestino = destino ? `${destino.cidade} · ${destino.bairro}` : "Localidade de destino não informada";
  const observacao = doacao.prioridade === "Atenção"
    ? "Item exige conferência obrigatória e não deve ser destinado diretamente para consumo."
    : doacao.motivoDestino;

  return `
    <article class="item-filtro-prioridade">
      <div class="item-filtro-topo">
        <div>
          <strong>${escaparHTML(doacao.alimento)}</strong>
          <span>${escaparHTML(doacao.categoria)} · ${formatarNumero(doacao.quantidade)} kg</span>
        </div>
        <span class="selo-prioridade ${doacao.classePrioridade}">${doacao.prioridade}</span>
      </div>
      <dl>
        <div><dt>Validade</dt><dd>${formatarData(doacao.dataVencimento)} · ${formatarPrazoVencimento(doacao.diasRestantes)}</dd></div>
        <div><dt>Doador</dt><dd>${escaparHTML(doacao.doadorNome)} · ${escaparHTML(obterResumoLocalidadeDoador(doacao))}</dd></div>
        <div><dt>Destino</dt><dd>${escaparHTML(doacao.destino || "Destino ainda não definido")} · ${escaparHTML(localDestino)}</dd></div>
        <div><dt>Observação</dt><dd>${escaparHTML(observacao)}</dd></div>
      </dl>
    </article>
  `;
}

function abrirModalFiltroPrioridade(prioridade) {
  if (!modalFiltro) return;

  const itens = ordenarMaisRecentesPrimeiro(obterDoacoesProcessadas().filter((doacao) => doacao.prioridade === prioridade));
  const titulos = {
    Atenção: "Atenção / Conferência obrigatória",
    Alta: "Doações de prioridade alta",
    Média: "Doações de prioridade média",
    Baixa: "Doações de prioridade baixa"
  };

  tituloFiltroPrioridade.textContent = titulos[prioridade] || "Doações filtradas";
  contagemFiltroPrioridade.textContent = `${itens.length} ${itens.length === 1 ? "item encontrado" : "itens encontrados"}`;

  listaFiltroPrioridade.innerHTML = itens.length
    ? itens.map(montarItemFiltroPrioridade).join("")
    : `
      <div class="estado-vazio">
        <h3>Nenhuma doação encontrada para este filtro.</h3>
        <p>Processe a redistribuição ou escolha outra prioridade.</p>
      </div>
    `;

  modalFiltro.hidden = false;
  botaoFecharModalFiltro.focus();
}

function fecharModalFiltroPrioridade() {
  if (!modalFiltro) return;
  modalFiltro.hidden = true;
}

if (botaoFecharModalFiltro) {
  botaoFecharModalFiltro.addEventListener("click", fecharModalFiltroPrioridade);
}

if (modalFiltro) {
  modalFiltro.addEventListener("click", (evento) => {
    if (evento.target === modalFiltro) fecharModalFiltroPrioridade();
  });
}

/* =========================================================
   18. INDICADORES DA HOME E DO RELATÓRIO
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
   - as prioridades usam barras horizontais calculadas em porcentagem;
   - as barras recebem largura ou altura proporcional ao maior valor;
   - o painel de localidades usa cidades e bairros sem repetição.
========================================================= */

/* Conta quantas ocorrências existem para cada valor de uma propriedade. */
function contarPorPropriedade(lista, propriedade) {
  return lista.reduce((contagem, item) => {
    const valor = item[propriedade] || "Não informado";
    const chave = propriedade === "tipo" ? normalizarTipoDoador(valor) : valor;
    contagem[chave] = (contagem[chave] || 0) + 1;
    return contagem;
  }, {});
}

/* Atualiza a visualização de prioridades em barras horizontais legíveis. */
function atualizarGraficoPrioridades() {
  const processadas = obterDoacoesProcessadas();
  const prioridades = [
    { nome: "Atenção", cor: "#9f3f35", texto: "Conferência" },
    { nome: "Alta", cor: "#d75442", texto: "Urgente" },
    { nome: "Média", cor: "#e5b53e", texto: "Planejada" },
    { nome: "Baixa", cor: "#70ad45", texto: "Regular" }
  ];
  const total = processadas.length;

  const linhas = prioridades.map((item) => {
    const quantidade = processadas.filter((doacao) => doacao.prioridade === item.nome).length;
    const porcentagem = total ? Math.round(quantidade / total * 100) : 0;

    return { ...item, quantidade, porcentagem };
  });

  totalPrioridades.textContent = total;
  graficoPrioridades.classList.toggle("prioridades-resumo-vazio", total === 0);
  legendaPrioridades.innerHTML = linhas.map((item) => `
    <article class="prioridade-barra-item" style="--cor-prioridade: ${item.cor}; --largura-prioridade: ${Math.max(4, item.porcentagem)}%">
      <div>
        <span>${item.nome}</span>
        <small>${item.texto}</small>
        <strong>${item.quantidade} item${item.quantidade === 1 ? "" : "s"} · ${item.porcentagem}%</strong>
      </div>
      <i><b></b></i>
    </article>
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

  atualizarLocalidadesDetalhadas();
}

/* Monta a leitura detalhada de cidades, bairros e parceiros da rede. */
function atualizarLocalidadesDetalhadas() {
  if (!listaLocalidadesDetalhadas) return;

  const mapaCidades = new Map();
  const registrarParceiro = (registro, papel) => {
    const cidade = registro.cidade || "Cidade não informada";
    const bairro = registro.bairro || "Bairro não informado";
    const chaveCidade = normalizarChaveTexto(cidade);

    if (!mapaCidades.has(chaveCidade)) {
      mapaCidades.set(chaveCidade, {
        cidade,
        doadores: 0,
        destinos: 0,
        bairros: new Map(),
        parceiros: []
      });
    }

    const grupoCidade = mapaCidades.get(chaveCidade);
    const chaveBairro = normalizarChaveTexto(bairro);

    if (!grupoCidade.bairros.has(chaveBairro)) {
      grupoCidade.bairros.set(chaveBairro, { bairro, doadores: 0, destinos: 0 });
    }

    const grupoBairro = grupoCidade.bairros.get(chaveBairro);

    if (papel === "Doador") {
      grupoCidade.doadores++;
      grupoBairro.doadores++;
    } else {
      grupoCidade.destinos++;
      grupoBairro.destinos++;
    }

    grupoCidade.parceiros.push({
      nome: registro.nome,
      tipo: registro.tipo,
      papel,
      bairro
    });
  };

  doadores.forEach((doador) => registrarParceiro(doador, "Doador"));
  pontosDestino.forEach((destino) => registrarParceiro(destino, "Destino"));

  const cidadesDetalhadas = [...mapaCidades.values()].sort((cidadeA, cidadeB) => cidadeA.cidade.localeCompare(cidadeB.cidade, "pt-BR"));

  if (cidadesDetalhadas.length === 0) {
    listaLocalidadesDetalhadas.innerHTML = `
      <div class="estado-vazio">
        <h3>Nenhuma localidade detalhada</h3>
        <p>Cadastre doadores e pontos de destino para visualizar cidades, bairros e parceiros.</p>
      </div>
    `;
    return;
  }

  listaLocalidadesDetalhadas.innerHTML = cidadesDetalhadas.map((cidade) => {
    const bairrosCidade = [...cidade.bairros.values()].sort((bairroA, bairroB) => bairroA.bairro.localeCompare(bairroB.bairro, "pt-BR"));
    const parceirosCidade = cidade.parceiros.sort((parceiroA, parceiroB) => parceiroA.nome.localeCompare(parceiroB.nome, "pt-BR"));

    return `
      <article class="localidade-card">
        <header>
          <div>
            <span>Cidade</span>
            <h3>${escaparHTML(cidade.cidade)}</h3>
          </div>
          <p>${cidade.doadores} doador${cidade.doadores === 1 ? "" : "es"} · ${cidade.destinos} destino${cidade.destinos === 1 ? "" : "s"}</p>
        </header>
        <div class="localidade-bairros">
          ${bairrosCidade.map((bairro) => `
            <span>${escaparHTML(bairro.bairro)}: ${bairro.doadores} doador${bairro.doadores === 1 ? "" : "es"}, ${bairro.destinos} destino${bairro.destinos === 1 ? "" : "s"}</span>
          `).join("")}
        </div>
        <div class="localidade-parceiros">
          ${parceirosCidade.map((parceiro) => `
            <p><strong>${escaparHTML(parceiro.nome)}</strong> — ${escaparHTML(parceiro.papel)} / ${escaparHTML(parceiro.tipo)} — ${escaparHTML(parceiro.bairro)}</p>
          `).join("")}
        </div>
      </article>
    `;
  }).join("");
}

/* Sincroniza todos os elementos visuais do dashboard em uma única chamada. */
function atualizarDashboard() {
  if (relatorioVazio) {
    relatorioVazio.hidden = obterDoacoesProcessadas().length > 0;
  }

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
  const processadas = ordenarMaisRecentesPrimeiro(obterDoacoesProcessadas());

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
  atualizarDatalists();
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

atualizarEstadoVisualDemonstracao();
atualizarInterfaceCompleta();

if (abasDisponiveis.includes(abaInicial)) {
  exibirAba(abaInicial);
} else {
  iniciarRotacaoCarrossel();
}
