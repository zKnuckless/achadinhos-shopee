import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  affiliateUrl: string;
  featured: boolean;
};

const STORAGE_KEY = "achadinhos-shopee-products-v1";
const starterProducts: Product[] = [
  { id: "achado-utensilios", name: "Kit Utensílios de Silicone para Cozinha com Cabos de Madeira", category: "Casa", price: 18.90, image: "/assets/products/utensilios-silicone.jpg", affiliateUrl: "https://s.shopee.com.br/W83R0fCuU", featured: true },
  { id: "achado-fone", name: "Fone de Ouvido Sem Fio Bluetooth com Cancelamento de Ruído", category: "Tecnologia", price: 42.89, image: "/assets/products/fone-bluetooth.jpg", affiliateUrl: "https://s.shopee.com.br/qktpjfvDZ", featured: true },
  { id: "achado-processador", name: "Mini Processador Triturador Sem Fio 250 ml", category: "Casa", price: 22.99, image: "/assets/products/mini-processador.jpg", affiliateUrl: "https://s.shopee.com.br/7KyNa4gbwr", featured: true },
  { id: "achado-powerbank", name: "Carregador Portátil Mini Power Bank 10.000 mAh com Cabos Tipo-C e Lightning", category: "Tecnologia", price: 31.99, image: "/assets/products/power-bank.jpg", affiliateUrl: "https://s.shopee.com.br/5LDJCR9U5j", featured: true },
  { id: "achado-potes", name: "Kit 5 Tigelas de Vidro com Tampas Herméticas", category: "Casa", price: 23.66, image: "/assets/products/potes-vidro.jpg", affiliateUrl: "https://s.shopee.com.br/6figmuuOA9", featured: true },
];
const categories = ["Todos", "Casa", "Tecnologia", "Beleza", "Moda", "Acessórios", "Outros"];
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const saved = JSON.parse(stored) as Product[];
        setProducts(saved.length ? saved : starterProducts);
      } else setProducts(starterProducts);
    } catch {
      setProducts(starterProducts);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }, [loaded, products]);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return products.filter((product) => {
      const matchesText = !term || product.name.toLocaleLowerCase("pt-BR").includes(term);
      const matchesCategory = category === "Todos" || product.category === category;
      return matchesText && matchesCategory;
    }).sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [products, search, category]);

  return (
    <main className="shop-site simple-storefront">
      <div className="ambient-art" aria-hidden="true">
        <span className="ambient-bag">⌑</span><span className="ambient-box">▧</span>
        <span className="ambient-cart">🛒</span><span className="ambient-coin">S</span>
        <span className="ambient-spark">✦</span><span className="ambient-ring" />
      </div>
      <section id="vitrine" className="catalog-section">
        <div className="section-heading">
          <div><p className="section-kicker">A seleção da vez</p><h2>Encontre seu próximo <em>achadinho.</em></h2></div>
          <span className="product-count">{products.length} {products.length === 1 ? "produto" : "produtos"}</span>
        </div>
        <div className="catalog-tools">
          <label className="search-box"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar um produto..." aria-label="Buscar produtos" /></label>
          <div className="category-list" aria-label="Categorias">
            {categories.map((item) => <button className={category === item ? "category-chip active" : "category-chip"} key={item} onClick={() => setCategory(item)} type="button">{item}</button>)}
          </div>
        </div>
        {filtered.length ? (
          <div className="product-grid">
            {filtered.map((product) => <article className="product-card" key={product.id}>
              <div className="product-image">{product.image ? <img src={product.image} alt={product.name} loading="lazy" /> : <div className="product-image-placeholder"><span>✳</span><small>ACHADINHO</small></div>}{product.featured && <span className="featured-tag">EM DESTAQUE</span>}</div>
              <div className="product-info"><span className="product-category">{product.category}</span><h3>{product.name}</h3><strong>{brl.format(product.price)}</strong><a className="buy-button" href={product.affiliateUrl} target="_blank" rel="noopener noreferrer">Comprar na Shopee <span>↗</span></a></div>
            </article>)}
          </div>
        ) : (
          <div className="empty-catalog"><div className="empty-symbol">✳</div><p className="empty-title">Sua próxima descoberta começa aqui.</p><p className="empty-copy">{products.length ? "Nenhum produto encontrado com essa busca. Tente outra palavra ou categoria." : "A vitrine está sendo preparada. Em breve, os primeiros achadinhos aparecem por aqui."}</p></div>
        )}
      </section>

      <section id="como-funciona" className="how-section simple-ending">
        <div className="how-intro"><p className="section-kicker">Simples assim</p><h2>Você descobre.<br /><em>A Shopee entrega.</em></h2><p>Uma vitrine independente para reunir produtos e facilitar sua busca. A compra acontece diretamente na plataforma da Shopee.</p></div>
      </section>

    </main>
  );
}
