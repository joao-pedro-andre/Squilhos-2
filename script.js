// Recupera os dados salvos ou inicializa listas vazias
let vendas = JSON.parse(localStorage.getItem('vendas_sequilhos')) || [];
let insumos = JSON.parse(localStorage.getItem('insumos_sequilhos')) || [];

// Define a data de hoje como padrão nos campos de data
document.addEventListener('DOMContentLoaded', () => {
  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('data-venda').value = hoje;
  document.getElementById('data-insumo').value = hoje;
  
  atualizarApp();
});

// Troca de Abas
function openTab(evt, tabName) {
  const tabContents = document.getElementsByClassName('tab-content');
  for (let i = 0; i < tabContents.length; i++) {
    tabContents[i].classList.remove('active');
  }

  const tabBtns = document.getElementsByClassName('tab-btn');
  for (let i = 0; i < tabBtns.length; i++) {
    tabBtns[i].classList.remove('active');
  }

  document.getElementById(tabName).classList.add('active');
  evt.currentTarget.classList.add('active');
}

// Função para converter texto/número com vírgula ou ponto em número preciso
function parseNumeroPreciso(valor) {
  if (typeof valor === 'number') return valor;
  if (!valor) return 0;
  // Substitui vírgula por ponto se o utilizador digitar com vírgula no teclado do telemóvel
  const limpo = valor.toString().replace(',', '.');
  return parseFloat(limpo) || 0;
}

// Lançamento de Venda
document.getElementById('form-venda').addEventListener('submit', (e) => {
  e.preventDefault();

  const pesoDigitado = parseNumeroPreciso(document.getElementById('qtd-venda').value);
  const precoKgDigitado = parseNumeroPreciso(document.getElementById('valor-venda').value);

  if (pesoDigitado <= 0 || precoKgDigitado <= 0) {
    alert("Por favor, insira valores válidos para o peso e para o preço.");
    return;
  }

  const novaVenda = {
    id: Date.now(),
    data: document.getElementById('data-venda').value,
    descricao: document.getElementById('desc-venda').value,
    qtd: pesoDigitado,
    valorUnitario: precoKgDigitado
  };

  vendas.push(novaVenda);
  salvarDados();
  atualizarApp();

  document.getElementById('form-venda').reset();
  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('data-venda').value = hoje;
});

// Lançamento de Insumo
document.getElementById('form-insumo').addEventListener('submit', (e) => {
  e.preventDefault();

  const valorInsumoDigitado = parseNumeroPreciso(document.getElementById('valor-insumo').value);

  if (valorInsumoDigitado <= 0) {
    alert("Por favor, insira um valor válido para o insumo.");
    return;
  }

  const novoInsumo = {
    id: Date.now(),
    data: document.getElementById('data-insumo').value,
    descricao: document.getElementById('desc-insumo').value,
    valor: valorInsumoDigitado
  };

  insumos.push(novoInsumo);
  salvarDados();
  atualizarApp();

  document.getElementById('form-insumo').reset();
  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('data-insumo').value = hoje;
});

// Excluir Lançamentos
function removerVenda(id) {
  vendas = vendas.filter(v => v.id !== id);
  salvarDados();
  atualizarApp();
}

function removerInsumo(id) {
  insumos = insumos.filter(i => i.id !== id);
  salvarDados();
  atualizarApp();
}

// Salva no LocalStorage
function salvarDados() {
  localStorage.setItem('vendas_sequilhos', JSON.stringify(vendas));
  localStorage.setItem('insumos_sequilhos', JSON.stringify(insumos));
}

// Multiplicação financeira precisa para evitar erros de centavos
function calcularTotalItem(peso, precoKg) {
  return Math.round((peso * precoKg) * 100) / 100;
}

// Formata o peso para exibição (ex: 0.25 kg ou 1.5 kg)
function formatarPeso(peso) {
  return peso.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 3 }) + ' kg';
}

// Atualiza a Tela (Resumo e Tabelas)
function atualizarApp() {
  let totalVendas = 0;
  let totalInsumos = 0;

  // Atualizar Tabela de Vendas
  const tabelaVendas = document.getElementById('tabela-vendas');
  tabelaVendas.innerHTML = '';

  vendas.forEach(v => {
    const totalItem = calcularTotalItem(v.qtd, v.valorUnitario);
    totalVendas += totalItem;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatarData(v.data)}</td>
      <td>${v.descricao}</td>
      <td>${formatarPeso(v.qtd)}</td>
      <td>${formatarMoeda(v.valorUnitario)}/kg</td>
      <td>${formatarMoeda(totalItem)}</td>
      <td><button class="btn-delete" onclick="removerVenda(${v.id})">X</button></td>
    `;
    tabelaVendas.appendChild(row);
  });

  // Atualizar Tabela de Insumos
  const tabelaInsumos = document.getElementById('tabela-insumos');
  tabelaInsumos.innerHTML = '';

  insumos.forEach(i => {
    totalInsumos += i.valor;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatarData(i.data)}</td>
      <td>${i.descricao}</td>
      <td>${formatarMoeda(i.valor)}</td>
      <td><button class="btn-delete" onclick="removerInsumo(${i.id})">X</button></td>
    `;
    tabelaInsumos.appendChild(row);
  });

  // Atualizar Cards do Dashboard
  const lucroLiquido = Math.round((totalVendas - totalInsumos) * 100) / 100;

  document.getElementById('total-vendas').textContent = formatarMoeda(totalVendas);
  document.getElementById('total-despesas').textContent = formatarMoeda(totalInsumos);
  document.getElementById('lucro-liquido').textContent = formatarMoeda(lucroLiquido);
}

// Funções Auxiliares de Formatação
function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(dataISO) {
  if (!dataISO) return '';
  const partes = dataISO.split('-');
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}