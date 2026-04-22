import { spec, request } from 'pactum';

const BASE_URL = 'https://dummyjson.com';

// Simula um browser para evitar possíveis bloqueios
beforeAll(() => {
  request.setDefaultHeaders({
    'Content-Type': 'application/json',
  });
});

// ─────────────────────────────────────────
// GET /products
// ─────────────────────────────────────────
describe('GET /products', () => {
  it('deve retornar todos os produtos com status 200', async () => {
    await spec()
      .get(`${BASE_URL}/products`)
      .expectStatus(200)
      .expectJsonLike({
        products: [{ id: /\d+/, title: /.+/, price: /\d+/ }],
      });
  });

  it('deve retornar um array de produtos dentro de "products"', async () => {
    const res = await spec()
      .get(`${BASE_URL}/products`)
      .expectStatus(200)
      .returns('.');

    expect(Array.isArray(res.products)).toBe(true);
    expect(res.products.length).toBeGreaterThan(0);
  });

  it('deve retornar uma quantidade limitada de produtos usando o query param ?limit', async () => {
    const res = await spec()
      .get(`${BASE_URL}/products`)
      .withQueryParams('limit', 3)
      .expectStatus(200)
      .returns('.');

    expect(Array.isArray(res.products)).toBe(true);
    expect(res.products.length).toBe(3);
  });

  it('deve retornar os produtos ordenados em ordem decrescente', async () => {
    const res = await spec()
      .get(`${BASE_URL}/products`)
      .withQueryParams({ sortBy: 'id', order: 'desc' })
      .expectStatus(200)
      .returns('.');

    const ids = res.products.map((p: any) => p.id);
    expect(ids[0]).toBeGreaterThan(ids[ids.length - 1]);
  });
});

// ─────────────────────────────────────────
// GET /products/:id
// ─────────────────────────────────────────
describe('GET /products/:id', () => {
  it('deve retornar um único produto pelo ID', async () => {
    await spec()
      .get(`${BASE_URL}/products/1`)
      .expectStatus(200)
      .expectJsonLike({
        id: 1,
        title: /.+/,
        price: /\d+/,
        category: /.+/,
        description: /.+/,
      });
  });

  it('deve retornar o produto com todos os campos esperados', async () => {
    const res = await spec()
      .get(`${BASE_URL}/products/1`)
      .expectStatus(200)
      .returns('.');

    expect(res).toHaveProperty('id');
    expect(res).toHaveProperty('title');
    expect(res).toHaveProperty('price');
    expect(res).toHaveProperty('category');
    expect(res).toHaveProperty('description');
    expect(res).toHaveProperty('thumbnail');
    expect(res).toHaveProperty('rating');
  });
});

// ─────────────────────────────────────────
// GET /products/categories
// ─────────────────────────────────────────
describe('GET /products/categories', () => {
  it('deve retornar uma lista de categorias', async () => {
    const res = await spec()
      .get(`${BASE_URL}/products/categories`)
      .expectStatus(200)
      .returns('.');

    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────
// GET /products - Casos Negativos
// ─────────────────────────────────────────
describe('GET /products - Casos Negativos', () => {
  it('deve retornar 404 ao buscar um produto com ID inexistente', async () => {
    await spec()
      .get(`${BASE_URL}/products/99999`)
      .expectStatus(404);
  });

  it('deve retornar uma quantidade limitada de produtos usando ?limit=0', async () => {
    const res = await spec()
      .get(`${BASE_URL}/products`)
      .withQueryParams('limit', 0)
      .expectStatus(200)
      .returns('.');

    expect(Array.isArray(res.products)).toBe(true);
  });

  it('deve ignorar valor inválido no sort e retornar os produtos normalmente', async () => {
    const res = await spec()
      .get(`${BASE_URL}/products`)
      .withQueryParams({ sortBy: 'id', order: 'invalido' })
      .expectStatus(200)
      .returns('.');

    expect(Array.isArray(res.products)).toBe(true);
    expect(res.products.length).toBeGreaterThan(0);
  });

  it('deve retornar 404 ao buscar um produto com ID em formato de texto', async () => {
    await spec()
      .get(`${BASE_URL}/products/abc`)
      .expectStatus(404);
  });
});

// ─────────────────────────────────────────
// POST /products
// ─────────────────────────────────────────
describe('POST /products', () => {
  const novoProduto = {
    title: 'Produto de Teste',
    price: 29.99,
    description: 'Um produto criado para fins de teste',
    thumbnail: 'https://i.pravatar.cc/150',
    category: 'smartphones',
  };

  it('deve criar um novo produto e retornar status 200', async () => {
    await spec()
      .post(`${BASE_URL}/products`)
      .withJson(novoProduto)
      .expectStatus(200)
      .expectJsonLike({
        id: /\d+/,
      });
  });

  it('deve retornar o produto criado com um ID', async () => {
    const res = await spec()
      .post(`${BASE_URL}/products`)
      .withJson(novoProduto)
      .expectStatus(200)
      .returns('.');

    expect(res).toHaveProperty('id');
    expect(typeof res.id).toBe('number');
  });

  it('deve retornar os dados do produto enviado na resposta', async () => {
    await spec()
      .post(`${BASE_URL}/products`)
      .withJson(novoProduto)
      .expectStatus(200)
      .expectJsonLike({
        title: novoProduto.title,
        price: novoProduto.price,
        description: novoProduto.description,
        thumbnail: novoProduto.thumbnail,
        category: novoProduto.category,
      });
  });

  it('deve enviar o header Content-Type correto', async () => {
    await spec()
      .post(`${BASE_URL}/products`)
      .withHeaders('Content-Type', 'application/json')
      .withJson(novoProduto)
      .expectStatus(200);
  });
});

// ─────────────────────────────────────────
// POST /products - Casos Negativos
// ─────────────────────────────────────────
describe('POST /products - Casos Negativos', () => {
  it('deve retornar resposta ao enviar body vazio', async () => {
    const res = await spec()
      .post(`${BASE_URL}/products`)
      .withJson({})
      .expectStatus(200)
      .returns('.');

    // A FakeStoreAPI ainda retorna um ID mesmo com body vazio
    // Valida que o comportamento é conhecido e documentado
    expect(res).toHaveProperty('id');
  });

  it('deve retornar resposta ao enviar apenas campos obrigatórios faltando', async () => {
    const produtoIncompleto = {
      title: 'Produto sem preço',
      // price ausente intencionalmente
      category: 'electronics',
    };

    const res = await spec()
      .post(`${BASE_URL}/products`)
      .withJson(produtoIncompleto)
      .expectStatus(200)
      .returns('.');

    expect(res).toHaveProperty('id');
    expect(res.price).toBeUndefined();
  });

  it('deve retornar resposta ao enviar price como string ao invés de número', async () => {
    const produtoInvalido = {
      title: 'Produto com preço inválido',
      price: 'não-é-um-número',
      description: 'Teste de tipo inválido',
      image: 'https://i.pravatar.cc/150',
      category: 'electronics',
    };

    const res = await spec()
      .post(`${BASE_URL}/products`)
      .withJson(produtoInvalido)
      .expectStatus(200)
      .returns('.');

    // Documenta que a API não valida o tipo do price
    expect(res).toHaveProperty('id');
    expect(res.price).toBe('não-é-um-número');
  });

  it('deve retornar resposta ao enviar body como array ao invés de objeto', async () => {
    await spec()
      .post(`${BASE_URL}/products`)
      .withJson([{ title: 'Produto em array' }])
      .expectStatus(200);
  });
});