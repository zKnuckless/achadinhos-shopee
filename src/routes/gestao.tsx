import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { getAdminStatus, loginAdmin, logoutAdmin } from "../lib/admin-auth";

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

export const Route = createFileRoute("/gestao")({
  loader: () => getAdminStatus(),
  head: () => ({
    meta: [
      { title: "Acesso restrito — Achadinhos" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: AdminRoute,
});

function AdminRoute() {
  const status = Route.useLoaderData();

  return status.authenticated
    ? <AdminDashboard />
    : <AdminLogin configured={status.configured} />;
}

function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    try {
      const result = await loginAdmin({ data: { password } });
      if (result.ok) {
        setPassword("");
        await router.invalidate();
        return;
      }
      if (result.reason === "not-configured") {
        setMessage("O acesso ainda está bloqueado. Configure a variável ADMIN_PASSWORD na Vercel.");
      } else if (result.reason === "rate-limited") {
        setMessage("Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.");
      } else {
        setMessage("Senha incorreta. Confira e tente novamente.");
      }
    } catch {
      setMessage("Não foi possível validar o acesso. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin-auth-page">
      <div className="admin-auth-card">
        <a className="admin-back-link" href="/">← Voltar para a loja</a>
        <div className="admin-auth-mark">S</div>
        <p className="section-kicker">Área restrita</p>
        <h1>Gestão da vitrine</h1>
        <p className="admin-auth-copy">Esta área é exclusiva do responsável pela loja. Entre com sua senha de administrador.</p>
        {!configured ? (
          <div className="admin-setup-notice" role="status">
            <strong>Acesso bloqueado por segurança</strong>
            <span>Para ativar sua entrada, adicione a variável <code>ADMIN_PASSWORD</code> nas configurações do projeto na Vercel, marque o ambiente Production e faça um novo deploy.</span>
          </div>
        ) : (
          <form className="admin-login-form" onSubmit={submit}>
            <label htmlFor="admin-password">Senha de administrador</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite sua senha"
              minLength={12}
              maxLength={256}
              required
              autoFocus
            />
            {message && <p className="admin-login-error" role="alert">{message}</p>}
            <button className="primary-cta form-submit" type="submit" disabled={busy || password.length < 12}>
              {busy ? "Verificando..." : "Entrar na gestão"}
            </button>
          </form>
        )}
        <p className="admin-auth-footnote">Sessão privada com cookie seguro e expiração automática após 8 horas.</p>
      </div>
    </main>
  );
}

function AdminDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [productCategory, setProductCategory] = useState("Casa");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [featured, setFeatured] = useState(false);
  const [notice, setNotice] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const saved = JSON.parse(stored) as Product[];
        setProducts(saved.length ? saved : starterProducts);
      } else {
        setProducts(starterProducts);
      }
    } catch {
      setProducts(starterProducts);
      setNotice("Não foi possível carregar os produtos salvos neste navegador.");
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }, [loaded, products]);

  const resetForm = () => {
    setEditing(null);
    setName("");
    setProductCategory("Casa");
    setPrice("");
    setImage("");
    setAffiliateUrl("");
    setFeatured(false);
  };

  const saveProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedPrice = Number(price.replace(",", "."));
    if (!name.trim() || !affiliateUrl.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setNotice("Preencha nome, preço válido e link de afiliado.");
      return;
    }
    try {
      new URL(affiliateUrl);
    } catch {
      setNotice("O link de afiliado precisa ser uma URL válida.");
      return;
    }
    const product: Product = {
      id: editing ?? (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now())),
      name: name.trim(),
      category: productCategory,
      price: parsedPrice,
      image: image.trim(),
      affiliateUrl: affiliateUrl.trim(),
      featured,
    };
    setProducts((current) => editing
      ? current.map((item) => item.id === editing ? product : item)
      : [product, ...current]);
    setNotice(editing ? "Produto atualizado!" : "Produto cadastrado!");
    resetForm();
  };

  const startEdit = (product: Product) => {
    setEditing(product.id);
    setName(product.name);
    setProductCategory(product.category);
    setPrice(String(product.price).replace(".", ","));
    setImage(product.image);
    setAffiliateUrl(product.affiliateUrl);
    setFeatured(product.featured);
    setNotice("");
  };

  const signOut = async () => {
    setLoggingOut(true);
    try {
      await logoutAdmin();
      await router.invalidate();
    } finally {
      setLoggingOut(false);
    }
  };

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => Number(b.featured) - Number(a.featured)),
    [products],
  );

  return (
    <main className="admin-standalone">
      <div className="admin-standalone-top">
        <a className="admin-back-link" href="/">← Ver loja pública</a>
        <button className="admin-signout" onClick={signOut} type="button" disabled={loggingOut}>
          {loggingOut ? "Saindo..." : "Encerrar sessão"}
        </button>
      </div>
      <div className="admin-standalone-content">
        <section className="admin-panel admin-panel-standalone">
          <div className="admin-head">
            <div><p className="section-kicker">Área restrita</p><h1>Gerenciar vitrine</h1></div>
          </div>
          <p className="admin-note">Cadastre, edite ou remova produtos da vitrine neste navegador.</p>
          <form className="product-form" onSubmit={saveProduct}>
            <label>Nome do produto<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Organizador multiuso" required /></label>
            <div className="form-row">
              <label>Categoria<select value={productCategory} onChange={(event) => setProductCategory(event.target.value)}>{categories.filter((item) => item !== "Todos").map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Preço (R$)<input value={price} onChange={(event) => setPrice(event.target.value)} placeholder="49,90" inputMode="decimal" required /></label>
            </div>
            <label>Link da imagem <span className="optional">(opcional)</span><input value={image} onChange={(event) => setImage(event.target.value)} placeholder="https://..." /></label>
            <label>Link de afiliado Shopee<input value={affiliateUrl} onChange={(event) => setAffiliateUrl(event.target.value)} placeholder="https://..." type="url" required /></label>
            <label className="featured-check"><input checked={featured} onChange={(event) => setFeatured(event.target.checked)} type="checkbox" /> Destacar este produto na vitrine</label>
            {notice && <p className="form-notice" role="status">{notice}</p>}
            <div className="form-actions">
              <button className="primary-cta form-submit" type="submit">{editing ? "Salvar alterações" : "Adicionar produto"} <span>↗</span></button>
              {editing && <button className="cancel-edit" onClick={resetForm} type="button">Cancelar edição</button>}
            </div>
          </form>
          <div className="admin-products">
            <h2>Produtos cadastrados <span>{products.length}</span></h2>
            {sortedProducts.length ? sortedProducts.map((product) => (
              <div className="admin-product" key={product.id}>
                <div><b>{product.name}</b><small>{brl.format(product.price)} · {product.category}</small></div>
                <button onClick={() => startEdit(product)} type="button">Editar</button>
                <button className="delete-product" onClick={() => setProducts((current) => current.filter((item) => item.id !== product.id))} type="button">Excluir</button>
              </div>
            )) : <p className="admin-empty">Nenhum produto cadastrado ainda.</p>}
          </div>
          <p className="storage-warning">As alterações ficam salvas apenas neste navegador e dispositivo. Para atualizar a vitrine para todos os visitantes, será necessário conectar um banco de dados compartilhado.</p>
        </section>
      </div>
    </main>
  );
}
