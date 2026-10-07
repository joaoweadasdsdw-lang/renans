const KEY = "cem_dom_ungarelli_sistema_v1";

const state = JSON.parse(localStorage.getItem(KEY)) || {
  alunos: [],
  cardapios: {},
  presencas: {}
};

const $ = id => document.getElementById(id);
const dataInput = $("data");

function hoje() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0,10);
}

dataInput.value = hoje();

function salvar() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function chaveData() {
  return dataInput.value || hoje();
}

function carregarCardapio() {
  const c = state.cardapios[chaveData()] || {refeicao1:"", refeicao2:"", refeicao3:""};
  $("refeicao1").value = c.refeicao1;
  $("refeicao2").value = c.refeicao2;
  $("refeicao3").value = c.refeicao3;
}

function salvarCardapio() {
  state.cardapios[chaveData()] = {
    refeicao1: $("refeicao1").value.trim(),
    refeicao2: $("refeicao2").value.trim(),
    refeicao3: $("refeicao3").value.trim()
  };
  salvar();
  alert("Cardápio salvo para " + chaveData() + ".");
}

function presencaKey() {
  return `${chaveData()}_${$("refeicaoSelecionada").value}`;
}

function estaPresente(id) {
  return (state.presencas[presencaKey()] || []).includes(id);
}

function alternarPresenca(id, marcado) {
  const key = presencaKey();
  const lista = state.presencas[key] || [];
  state.presencas[key] = marcado
    ? [...new Set([...lista, id])]
    : lista.filter(x => x !== id);
  salvar();
  render();
}

function turmas() {
  return [...new Set(state.alunos.map(a => a.turma).filter(Boolean))].sort();
}

function atualizarFiltroTurma() {
  const atual = $("filtroTurma").value;
  $("filtroTurma").innerHTML = '<option value="">Todas as turmas</option>' +
    turmas().map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
  if (turmas().includes(atual)) $("filtroTurma").value = atual;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

function render() {
  atualizarFiltroTurma();
  const busca = $("busca").value.toLowerCase().trim();
  const turma = $("filtroTurma").value;
  const alunos = state.alunos.filter(a =>
    (!busca || a.nome.toLowerCase().includes(busca) || a.turma.toLowerCase().includes(busca)) &&
    (!turma || a.turma === turma)
  );

  $("totalAlunos").textContent = state.alunos.length;
  $("totalPresencas").textContent = (state.presencas[presencaKey()] || []).length;

  $("listaAlunos").innerHTML = alunos.map(a => {
    const checked = estaPresente(a.id) ? "checked" : "";
    return `<div class="student-row">
      <div class="student-name">${escapeHtml(a.nome)}</div>
      <div class="student-turma">${escapeHtml(a.turma)}</div>
      <div class="presence">
        <input type="checkbox" id="p-${a.id}" ${checked} data-id="${a.id}">
        <label for="p-${a.id}">Presente</label>
      </div>
    </div>`;
  }).join("");

  $("estadoVazio").style.display = alunos.length ? "none" : "block";

  document.querySelectorAll('.presence input').forEach(input => {
    input.addEventListener('change', e => alternarPresenca(e.target.dataset.id, e.target.checked));
  });

  $("count1").textContent = contar("refeicao1");
  $("count2").textContent = contar("refeicao2");
  $("count3").textContent = contar("refeicao3");
}

function contar(ref) {
  return (state.presencas[`${chaveData()}_${ref}`] || []).length;
}

function abrirModal() {
  $("modalAluno").classList.remove("hidden");
  $("nomeAluno").focus();
}
function fecharModal() {
  $("modalAluno").classList.add("hidden");
  $("formAluno").reset();
}

$("abrirCadastro").onclick = abrirModal;
$("fecharModal").onclick = fecharModal;
$("cancelarCadastro").onclick = fecharModal;

$("formAluno").addEventListener("submit", e => {
  e.preventDefault();
  const nome = $("nomeAluno").value.trim();
  const turma = $("turmaAluno").value.trim();
  if (!nome || !turma) return;

  state.alunos.push({id: crypto.randomUUID(), nome, turma});
  salvar();
  fecharModal();
  render();
});

$("salvarCardapio").onclick = salvarCardapio;
$("refeicaoSelecionada").onchange = render;
$("busca").oninput = render;
$("filtroTurma").onchange = render;
dataInput.onchange = () => {
  carregarCardapio();
  render();
};

$("exportarCSV").onclick = () => {
  const linhas = [["Data","Aluno","Turma","Café da manhã","Almoço","Lanche"]];
  state.alunos.forEach(a => {
    linhas.push([
      chaveData(), a.nome, a.turma,
      estaPresenteRef(a.id,"refeicao1") ? "Presente" : "Ausente",
      estaPresenteRef(a.id,"refeicao2") ? "Presente" : "Ausente",
      estaPresenteRef(a.id,"refeicao3") ? "Presente" : "Ausente"
    ]);
  });
  const csv = "\ufeff" + linhas.map(l => l.map(v => `"${String(v).replaceAll('"','""')}"`).join(";")).join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `presencas_${chaveData()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

function estaPresenteRef(id, ref) {
  return (state.presencas[`${chaveData()}_${ref}`] || []).includes(id);
}

carregarCardapio();
render();
