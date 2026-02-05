# Finance V1 — Livro-caixa (HTML + CSS + JS)

Um controle financeiro pessoal estilo “extrato”, com visual editorial (papel) e foco em clareza: receitas, despesas, saldo e histórico.


## Preview
![Preview do projeto](./assetspreview-1.png)


## Funcionalidades
- ✅ Adicionar receitas e despesas
- ✅ Categorias + data
- ✅ Totais automáticos (Receitas / Despesas / Saldo)
- ✅ Extrato com filtros (mês, tipo e categoria)
- ✅ Editar transações (modo edição no formulário)
- ✅ Remover transações
- ✅ Persistência com LocalStorage
- ✅ Backup: Exportar e Importar JSON

## Tecnologias
- HTML5
- CSS3
- JavaScript (Vanilla)
- LocalStorage (persistência no navegador)

## Como rodar
1. Baixe/clone o repositório
2. Abra o arquivo `index.html` no navegador

> Opcional: usar a extensão **Live Server** no VS Code para recarregar automaticamente.

## Como funciona o backup
- **Exportar** gera um arquivo `finance-v1-backup.json` com suas transações
- **Importar** permite:
- **Mesclar** com os dados atuais, ou
- **Substituir** tudo (zera e carrega do arquivo)

## Estrutura do projeto
finance-v1/
├─ index.html
├─ style.css
├─ script.js
└─ README.md


## Próximas melhorias (ideias)
- Gráficos por categoria e evolução mensal
- Importação com detecção de duplicados por conteúdo (além do ID)
- Edição inline direto na tabela
- Modo impressão (CSS print) para gerar PDF do mês

## Autor
Juan Ygor Delgado 