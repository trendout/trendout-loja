# Trendout Loja (frontoffice)

Projeto novo e separado do backoffice, mas ligado ao **mesmo Supabase**.

## Arrancar

```bash
cp .env.example .env.local
# edita .env.local com a MESMA URL e anon key do Supabase que usas no backoffice
npm install
npm run dev
```

Abre `http://localhost:5173` — deves ver a página de coleção "T-shirts técnicas" com os
produtos dessa categoria e os filtros de marca, tamanho, cor e preço.

## O que já está feito

- `src/pages/CollectionPage.jsx` — página de coleção com filtros (marca, tamanho/capacidade,
  cor, preço) e ordenação. Recebe `categoryName` como prop; troca a categoria no `App.jsx`
  para testares com outras (ex: "Leggings", "Garrafas & Acessórios").
- `src/hooks/useCollectionProducts.js` — vai buscar produtos ativos dessa categoria ao Supabase.
- `src/components/ProductCard.jsx` — cartão de produto na grelha.

## Próximos passos

1. Homepage
2. Router real (react-router-dom já está instalado) para navegar entre categorias/produtos
3. Página de produto individual
4. Carrinho + Checkout
