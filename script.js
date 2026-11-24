let vendas = JSON.parse(localStorage.getItem('vendas_sequilhos')) || [];
let insumos = JSON.parse(localStorage.getItem('insumos_sequilhos')) || [];
let estoque = JSON.parse(localStorage.getItem('estoque_sequilhos')) || [];

document.addEventListener('DOMContentLoaded', () => {
  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('data-venda').value = hoje;
  document.getElementById('data-insumo').value = hoje;

  document.getElementById('qtd-venda').addEventListener('input', atualizarPreviaVenda);
  document.getElementById('valor-venda').addEventListener('input', atualizarPreviaVenda);

  atualizarPreviaVenda();
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

  const descricao = document.getElementById('desc-venda').value.trim();
  const produtoEstoque = estoque.find(item => item.produto.toLocaleLowerCase('pt-BR') === descricao.toLocaleLowerCase('pt-BR'));
  let pacotesBaixados = 0;
  if (produtoEstoque) {
    const pacotesExatos = pesoDigitado * 4;
    if (Math.abs(pacotesExatos - Math.round(pacotesExatos)) > 0.000001) {
      alert('Para descontar do estoque, a venda precisa ser em múltiplos de 250 g (0,250 kg).');
      return;
    }
    pacotesBaixados = Math.round(pacotesExatos);
    if (produtoEstoque.pacotes < pacotesBaixados) {
      alert('Estoque insuficiente para esse produto. Disponível: ' + produtoEstoque.pacotes + ' pacotinho(s).');
      return;
    }
    produtoEstoque.pacotes -= pacotesBaixados;
  }

  const novaVenda = {
    id: Date.now(),
    data: document.getElementById('data-venda').value,
    descricao,
    qtd: pesoDigitado,
    precoPor250g: preco250gDigitado,
    estoqueId: produtoEstoque ? produtoEstoque.id : null,
    pacotesBaixados
  };

  vendas.push(novaVenda);
  salvarDados();
  atualizarApp();

  document.getElementById('form-venda').reset();
  document.getElementById('data-venda').value = new Date().toISOString().split('T')[0];
  atualizarPreviaVenda();
});


document.getElementById('form-estoque').addEventListener('submit', (e) => {
  e.preventDefault();
  const produto = document.getElementById('produto-estoque').value.trim();
  const quantidade = Number.parseInt(document.getElementById('qtd-estoque').value, 10);
  if (!produto || !Number.isInteger(quantidade) || quantidade <= 0) {
    alert('Informe um produto e uma quantidade válida de pacotinhos.');
    return;
  }
  const existente = estoque.find(item => item.produto.toLocaleLowerCase('pt-BR') === produto.toLocaleLowerCase('pt-BR'));
  if (existente) {
    existente.pacotes += quantidade;
  } else {
    estoque.push({ id: Date.now(), produto, pacotes: quantidade });
  }
  salvarDados();
  atualizarApp();
  document.getElementById('form-estoque').reset();
});

function alterarEstoque(id, variacao) {
  const item = estoque.find(p => p.id === id);
  if (!item) return;
  if (item.pacotes + variacao < 0) {
    alert('O estoque não pode ficar negativo.');
    return;
  }
  item.pacotes += variacao;
  salvarDados();
  atualizarApp();
}

function removerProdutoEstoque(id) {
  const item = estoque.find(p => p.id === id);
  if (!item || !confirm('Remover ' + item.produto + ' do estoque?')) return;
  estoque = estoque.filter(p => p.id !== id);
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
  const venda = vendas.find(v => v.id === id);
  if (venda && venda.estoqueId && venda.pacotesBaixados) {
    const item = estoque.find(p => p.id === venda.estoqueId);
    if (item) item.pacotes += venda.pacotesBaixados;
  }
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
  localStorage.setItem('estoque_sequilhos', JSON.stringify(estoque));
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


  atualizarListaEstoque();

  const lucroLiquido = Math.round((totalVendas - totalInsumos) * 100) / 100;
  document.getElementById('total-vendas').textContent = formatarMoeda(totalVendas);
  document.getElementById('total-despesas').textContent = formatarMoeda(totalInsumos);
  document.getElementById('lucro-liquido').textContent = formatarMoeda(lucroLiquido);
}

function atualizarListaEstoque() {
  const tabela = document.getElementById('tabela-estoque');
  if (!tabela) return;
  const totalPacotes = estoque.reduce((soma, item) => soma + item.pacotes, 0);
  const pesoTotal = totalPacotes * 0.25;
  document.getElementById('resumo-estoque').textContent =
    totalPacotes + ' pacotinho(s) disponíveis · ' + formatarPeso(pesoTotal) + ' no total';
  tabela.innerHTML = '';
  estoque.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escaparHTML(item.produto)}</td>
      <td>${item.pacotes}</td>
      <td>${formatarPeso(item.pacotes * 0.25)}</td>
      <td class="stock-actions">
        <button class="btn-stock" onclick="alterarEstoque(${Number(item.id)}, 1)" aria-label="Adicionar um pacotinho">+1</button>
        <button class="btn-stock" onclick="alterarEstoque(${Number(item.id)}, -1)" aria-label="Retirar um pacotinho">−1</button>
        <button class="btn-delete" onclick="removerProdutoEstoque(${Number(item.id)})" aria-label="Remover produto">X</button>
      </td>`;
    tabela.appendChild(row);
  });
  if (!estoque.length) {
    tabela.innerHTML = '<tr><td colspan="4" class="empty-state">Nenhum produto cadastrado no estoque.</td></tr>';
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
