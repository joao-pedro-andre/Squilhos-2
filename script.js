let vendas = JSON.parse(localStorage.getItem('vendas_sequilhos')) || [];
let insumos = JSON.parse(localStorage.getItem('insumos_sequilhos')) || [];
let encomendas = JSON.parse(localStorage.getItem('encomendas_sequilhos')) || [];

document.addEventListener('DOMContentLoaded', () => {
  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('data-venda').value = hoje;
  document.getElementById('data-insumo').value = hoje;
  document.getElementById('data-encomenda').value = hoje;
  document.getElementById('qtd-encomenda').addEventListener('input', atualizarPreviaEncomenda);
  document.getElementById('valor-encomenda').addEventListener('input', atualizarPreviaEncomenda);

  document.getElementById('qtd-venda').addEventListener('input', atualizarPreviaVenda);
  document.getElementById('valor-venda').addEventListener('input', atualizarPreviaVenda);

  atualizarPreviaVenda();
  atualizarPreviaEncomenda();
  document.getElementById('busca-encomenda').addEventListener('input', atualizarListaEncomendas);
  document.getElementById('filtro-encomenda').addEventListener('change', atualizarListaEncomendas);
  atualizarApp();
});

function openTab(evt, tabName) {
  const tabContents = document.getElementsByClassName('tab-content');
  for (let i = 0; i < tabContents.length; i++) tabContents[i].classList.remove('active');

  const tabBtns = document.getElementsByClassName('tab-btn');
  for (let i = 0; i < tabBtns.length; i++) tabBtns[i].classList.remove('active');

  document.getElementById(tabName).classList.add('active');
  evt.currentTarget.classList.add('active');
}

function parseNumeroPreciso(valor) {
  if (typeof valor === 'number') return valor;
  if (!valor) return 0;
  return parseFloat(valor.toString().replace(',', '.')) || 0;
}

function calcularTotalItem(venda) {
  // Novos registros usam o preço informado por porção de 250 g.
  // Registros antigos continuam usando o preço por kg já salvo.
  if (venda.precoPor250g !== undefined) {
    return Math.round((venda.qtd * 4 * venda.precoPor250g) * 100) / 100;
  }
  return Math.round((venda.qtd * venda.valorUnitario) * 100) / 100;
}

function atualizarPreviaVenda() {
  const peso = parseNumeroPreciso(document.getElementById('qtd-venda').value);
  const preco250g = parseNumeroPreciso(document.getElementById('valor-venda').value);
  const porcoes = peso > 0 ? peso * 4 : 0;
  const total = peso > 0 && preco250g > 0 ? peso * 4 * preco250g : 0;

  document.getElementById('porcoes-venda').textContent =
    porcoes.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  document.getElementById('total-previa-venda').textContent = formatarMoeda(total);
}

document.getElementById('form-venda').addEventListener('submit', (e) => {
  e.preventDefault();

  const pesoDigitado = parseNumeroPreciso(document.getElementById('qtd-venda').value);
  const preco250gDigitado = parseNumeroPreciso(document.getElementById('valor-venda').value);

  if (pesoDigitado <= 0 || preco250gDigitado <= 0) {
    alert('Por favor, insira valores válidos para o peso e para o preço por 250 g.');
    return;
  }

  const novaVenda = {
    id: Date.now(),
    data: document.getElementById('data-venda').value,
    descricao: document.getElementById('desc-venda').value.trim(),
    qtd: pesoDigitado,
    precoPor250g: preco250gDigitado
  };

  vendas.push(novaVenda);
  salvarDados();
  atualizarApp();

  document.getElementById('form-venda').reset();
  document.getElementById('data-venda').value = new Date().toISOString().split('T')[0];
  atualizarPreviaVenda();
});


document.getElementById('form-encomenda').addEventListener('submit', (e) => {
  e.preventDefault();
  const qtd = parseNumeroPreciso(document.getElementById('qtd-encomenda').value);
  const preco = parseNumeroPreciso(document.getElementById('valor-encomenda').value);
  const cliente = document.getElementById('cliente-encomenda').value.trim();
  const produto = document.getElementById('produto-encomenda').value.trim();
  if (!cliente || !produto || qtd <= 0 || preco <= 0) {
    alert('Preencha o cliente, produto, quantidade e preço com valores válidos.');
    return;
  }
  encomendas.push({
    id: Date.now(),
    dataEntrega: document.getElementById('data-encomenda').value,
    cliente,
    produto,
    qtd,
    precoPor250g: preco,
    observacoes: document.getElementById('obs-encomenda').value.trim(),
    criadaEm: obterDataLocal(),
    status: 'pendente'
  });
  salvarDados();
  atualizarApp();
  document.getElementById('form-encomenda').reset();
  document.getElementById('data-encomenda').value = obterDataLocal();
  atualizarPreviaEncomenda();
});

function atualizarPreviaEncomenda() {
  const qtd = parseNumeroPreciso(document.getElementById('qtd-encomenda').value);
  const preco = parseNumeroPreciso(document.getElementById('valor-encomenda').value);
  document.getElementById('porcoes-encomenda').textContent =
    (qtd > 0 ? qtd * 4 : 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  document.getElementById('total-encomenda').textContent = formatarMoeda(qtd > 0 && preco > 0 ? qtd * 4 * preco : 0);
}

function concluirEncomenda(id) {
  const encomenda = encomendas.find(e => e.id === id);
  if (!encomenda || encomenda.status !== 'pendente') return;
  if (!confirm('Marcar esta encomenda como entregue? Ela será lançada nas vendas realizadas e entrará no faturamento.')) return;
  vendas.push({
    id: Date.now(),
    data: encomenda.dataEntrega || obterDataLocal(),
    descricao: encomenda.produto + ' — ' + encomenda.cliente,
    qtd: encomenda.qtd,
    precoPor250g: encomenda.precoPor250g
  });
  encomendas = encomendas.filter(e => e.id !== id);
  salvarDados();
  atualizarApp();
}

function removerEncomenda(id) {
  if (!confirm('Excluir esta encomenda?')) return;
  encomendas = encomendas.filter(e => e.id !== id);
  salvarDados();
  atualizarApp();
}

document.getElementById('form-insumo').addEventListener('submit', (e) => {
  e.preventDefault();

  const valorInsumoDigitado = parseNumeroPreciso(document.getElementById('valor-insumo').value);
  if (valorInsumoDigitado <= 0) {
    alert('Por favor, insira um valor válido para o insumo.');
    return;
  }

  const novoInsumo = {
    id: Date.now(),
    data: document.getElementById('data-insumo').value,
    descricao: document.getElementById('desc-insumo').value.trim(),
    valor: valorInsumoDigitado
  };

  insumos.push(novoInsumo);
  salvarDados();
  atualizarApp();

  document.getElementById('form-insumo').reset();
  document.getElementById('data-insumo').value = new Date().toISOString().split('T')[0];
});

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

function salvarDados() {
  localStorage.setItem('vendas_sequilhos', JSON.stringify(vendas));
  localStorage.setItem('insumos_sequilhos', JSON.stringify(insumos));
  localStorage.setItem('encomendas_sequilhos', JSON.stringify(encomendas));
}

function obterDataLocal() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function escaparHTML(valor) {
  return String(valor ?? '').replace(/[&<>\"']/g, caractere => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;'
  }[caractere]));
}

function formatarPeso(peso) {
  return peso.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 3 }) + ' kg';
}

function atualizarApp() {
  let totalVendas = 0;
  let totalInsumos = 0;

  const tabelaVendas = document.getElementById('tabela-vendas');
  tabelaVendas.innerHTML = '';

  vendas.forEach(v => {
    const totalItem = calcularTotalItem(v);
    const precoExibido250g = v.precoPor250g !== undefined
      ? v.precoPor250g
      : v.valorUnitario / 4;
    totalVendas += totalItem;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatarData(v.data)}</td>
      <td>${escaparHTML(v.descricao)}</td>
      <td>${formatarPeso(v.qtd)}</td>
      <td>${formatarMoeda(precoExibido250g)}</td>
      <td>${formatarMoeda(totalItem)}</td>
      <td><button class="btn-delete" onclick="removerVenda(${v.id})" aria-label="Remover venda">X</button></td>
    `;
    tabelaVendas.appendChild(row);
  });

  const tabelaInsumos = document.getElementById('tabela-insumos');
  tabelaInsumos.innerHTML = '';

  insumos.forEach(i => {
    totalInsumos += i.valor;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatarData(i.data)}</td>
      <td>${escaparHTML(i.descricao)}</td>
      <td>${formatarMoeda(i.valor)}</td>
      <td><button class="btn-delete" onclick="removerInsumo(${i.id})" aria-label="Remover insumo">X</button></td>
    `;
    tabelaInsumos.appendChild(row);
  });


  atualizarListaEncomendas();

  const lucroLiquido = Math.round((totalVendas - totalInsumos) * 100) / 100;
  document.getElementById('total-vendas').textContent = formatarMoeda(totalVendas);
  document.getElementById('total-despesas').textContent = formatarMoeda(totalInsumos);
  document.getElementById('lucro-liquido').textContent = formatarMoeda(lucroLiquido);
}

function atualizarListaEncomendas() {
  const tabela = document.getElementById('tabela-encomendas');
  if (!tabela) return;
  const hoje = obterDataLocal();
  const limite = new Date();
  limite.setDate(limite.getDate() + 7);
  const dataLimite = `${limite.getFullYear()}-${String(limite.getMonth()+1).padStart(2,'0')}-${String(limite.getDate()).padStart(2,'0')}`;
  const pendentes = encomendas.filter(e => e.status === 'pendente');
  const atrasadas = pendentes.filter(e => e.dataEntrega && e.dataEntrega < hoje);
  const proximas = pendentes.filter(e => e.dataEntrega >= hoje && e.dataEntrega <= dataLimite);
  const valorPendente = pendentes.reduce((soma, e) => soma + calcularTotalItem(e), 0);
  document.getElementById('resumo-encomendas').innerHTML =
    `<strong>${pendentes.length}</strong> pedido(s) pendente(s) · <strong>${formatarMoeda(valorPendente)}</strong> em vendas previstas
    <span class="order-alerts">${atrasadas.length ? `<strong class="overdue-text">${atrasadas.length} atrasada(s)</strong>` : '<strong class="ok-text">Nenhuma atrasada</strong>'}
    · ${proximas.length} para os próximos 7 dias</span>`;

  const filtro = document.getElementById('filtro-encomenda').value;
  const busca = document.getElementById('busca-encomenda').value.trim().toLocaleLowerCase('pt-BR');
  const lista = pendentes.filter(e => {
    const data = e.dataEntrega || '';
    const correspondeBusca = `${e.cliente || ''} ${e.produto || ''}`.toLocaleLowerCase('pt-BR').includes(busca);
    const correspondeFiltro = filtro === 'todas'
      || (filtro === 'atrasadas' && data && data < hoje)
      || (filtro === 'hoje' && data === hoje)
      || (filtro === 'proximas' && data >= hoje && data <= dataLimite);
    return correspondeBusca && correspondeFiltro;
  }).sort((a,b) => (a.dataEntrega || '').localeCompare(b.dataEntrega || ''));

  tabela.innerHTML = '';
  lista.forEach(e => {
    const atrasada = e.dataEntrega && e.dataEntrega < hoje;
    const dataLabel = formatarData(e.dataEntrega) + (atrasada ? ' · ATRASADA' : (e.dataEntrega === hoje ? ' · HOJE' : ''));
    const row = document.createElement('tr');
    row.className = atrasada ? 'order-overdue' : '';
    row.innerHTML = `
      <td>${escaparHTML(dataLabel)}</td>
      <td>${escaparHTML(e.cliente)}</td>
      <td>${escaparHTML(e.produto)}</td>
      <td>${formatarPeso(e.qtd)}</td>
      <td>${formatarMoeda(calcularTotalItem(e))}</td>
      <td>${escaparHTML(e.observacoes || '—')}</td>
      <td class="order-actions">
        <button class="btn-complete" onclick="concluirEncomenda(${Number(e.id)})">Entregue</button>
        <button class="btn-delete" onclick="removerEncomenda(${Number(e.id)})" aria-label="Excluir encomenda">X</button>
      </td>`;
    tabela.appendChild(row);
  });
  if (!lista.length) {
    tabela.innerHTML = '<tr><td colspan="7" class="empty-state">Nenhuma encomenda encontrada neste filtro.</td></tr>';
  }
}

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(dataISO) {
  if (!dataISO) return '';
  const partes = dataISO.split('-');
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}
