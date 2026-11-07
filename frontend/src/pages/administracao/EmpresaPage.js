import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { buildAdministracaoMock } from '../../mocks/administracaoMock';
import Icon from '../../components/Icons/Icons';
import styles from '../../styles/bsTheme.module.css';

const ENDPOINT = '/company';

const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const fmtCnpj = (v) =>
  String(v)
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');

const fmtCep = (v) =>
  String(v)
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, '$1-$2');

const EMPTY_FORM = {
  tradeName: '',
  legalName: '',
  cnpj: '',
  email: '',
  phone: '',
  zipCode: '',
  street: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  state: '',
  openingHours: '',
  logoUrl: '',
};

function formFromCompany(c) {
  return {
    tradeName: c?.tradeName ?? '',
    legalName: c?.legalName ?? '',
    cnpj: fmtCnpj(c?.cnpj ?? ''),
    email: c?.email ?? '',
    phone: c?.phone ?? '',
    zipCode: fmtCep(c?.zipCode ?? ''),
    street: c?.street ?? '',
    number: c?.number ?? '',
    complement: c?.complement ?? '',
    district: c?.district ?? '',
    city: c?.city ?? '',
    state: c?.state ?? '',
    openingHours: c?.openingHours ?? '',
    logoUrl: c?.logoUrl ?? '',
  };
}

export default function EmpresaPage() {
  const [company, setCompany] = useState(undefined);
  const [notFound, setNotFound] = useState(false);
  const [mocked, setMocked] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    try {
      const c = await api.get(ENDPOINT);
      setCompany(c);
      setForm(formFromCompany(c));
      setNotFound(false);
      setMocked(false);
    } catch (err) {
      if (err?.status === 404) {
        setCompany(null);
        setForm(EMPTY_FORM);
        setNotFound(true);
        setMocked(false);
      } else {
        const c = buildAdministracaoMock().company;
        setCompany(c);
        setForm(formFromCompany(c));
        setNotFound(false);
        setMocked(true);
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function update(field, value) {
    setSuccess(false);
    setForm((f) => ({ ...f, [field]: value }));
  }

  const cnpjDigits = form.cnpj.replace(/\D/g, '');
  const formValid = useMemo(() => {
    if (form.tradeName.trim() === '') return false;
    if (form.cnpj !== '' && cnpjDigits.length !== 14) return false;
    if (form.zipCode !== '' && !/^\d{5}-?\d{3}$/.test(form.zipCode)) return false;
    if (form.email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return false;
    return true;
  }, [form, cnpjDigits]);

  async function submit(e) {
    e.preventDefault();
    if (!formValid) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    const payload = {
      tradeName: form.tradeName.trim(),
      legalName: form.legalName.trim() || null,
      cnpj: cnpjDigits || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      zipCode: form.zipCode || null,
      street: form.street.trim() || null,
      number: form.number.trim() || null,
      complement: form.complement.trim() || null,
      district: form.district.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim().toUpperCase() || null,
      openingHours: form.openingHours.trim() || null,
      logoUrl: form.logoUrl.trim() || null,
    };
    try {
      const saved = await api.put(ENDPOINT, payload);
      setCompany(saved);
      setForm(formFromCompany(saved));
      setNotFound(false);
      setSuccess(true);
    } catch (err) {
      if (mocked) {
        const saved = {
          id: company?.id ?? 1,
          ...payload,
          cnpj: payload.cnpj,
          createdAt: company?.createdAt ?? new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setCompany(saved);
        setForm(formFromCompany(saved));
        setNotFound(false);
        setSuccess(true);
      } else {
        setError(err?.message ?? 'Erro ao salvar dados da empresa.');
      }
    } finally {
      setSaving(false);
    }
  }

  if (company === undefined) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-secondary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.bs}>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div>
          <h1 className="h4 mb-1 fw-semibold">Empresa</h1>
          <p className="mb-0 text-muted small">Dados cadastrais da empresa</p>
        </div>
        <button
          type="submit"
          form="company-form"
          className="btn btn-primary"
          disabled={saving || !formValid}
        >
          <Icon name="check" size={16} className="me-1" />
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {mocked && (
        <div className="alert alert-warning py-2 small" role="alert">
          API indisponível — exibindo dados de exemplo. As alterações são apenas locais.
        </div>
      )}
      {notFound && (
        <div className="alert alert-info py-2 small" role="alert">
          Dados da empresa ainda não cadastrados — preencha e salve para registrar.
        </div>
      )}
      {success && (
        <div className="alert alert-success py-2 small" role="alert">
          Dados da empresa salvos com sucesso.
        </div>
      )}
      {error && (
        <div className="alert alert-danger py-2 small" role="alert">{error}</div>
      )}

      <form id="company-form" onSubmit={submit}>
        <div className="card mb-3">
          <div className="card-header fw-semibold small text-uppercase text-muted">
            Identificação
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="co-trade" className="form-label">Nome fantasia *</label>
                <input
                  id="co-trade"
                  type="text"
                  className="form-control"
                  maxLength="255"
                  value={form.tradeName}
                  onChange={(e) => update('tradeName', e.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="co-legal" className="form-label">Razão social</label>
                <input
                  id="co-legal"
                  type="text"
                  className="form-control"
                  maxLength="255"
                  value={form.legalName}
                  onChange={(e) => update('legalName', e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="co-cnpj" className="form-label">CNPJ</label>
                <input
                  id="co-cnpj"
                  type="text"
                  inputMode="numeric"
                  className="form-control"
                  placeholder="00.000.000/0000-00"
                  value={form.cnpj}
                  onChange={(e) => update('cnpj', fmtCnpj(e.target.value))}
                />
                {form.cnpj !== '' && cnpjDigits.length !== 14 && (
                  <div className="form-text text-danger">CNPJ deve conter 14 dígitos.</div>
                )}
              </div>
              <div className="col-md-4">
                <label htmlFor="co-email" className="form-label">E-mail</label>
                <input
                  id="co-email"
                  type="email"
                  className="form-control"
                  maxLength="255"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="co-phone" className="form-label">Telefone</label>
                <input
                  id="co-phone"
                  type="text"
                  className="form-control"
                  maxLength="30"
                  placeholder="(00) 00000-0000"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-header fw-semibold small text-uppercase text-muted">
            Endereço
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-2">
                <label htmlFor="co-zip" className="form-label">CEP</label>
                <input
                  id="co-zip"
                  type="text"
                  inputMode="numeric"
                  className="form-control"
                  placeholder="00000-000"
                  value={form.zipCode}
                  onChange={(e) => update('zipCode', fmtCep(e.target.value))}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="co-street" className="form-label">Logradouro</label>
                <input
                  id="co-street"
                  type="text"
                  className="form-control"
                  maxLength="255"
                  value={form.street}
                  onChange={(e) => update('street', e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label htmlFor="co-number" className="form-label">Número</label>
                <input
                  id="co-number"
                  type="text"
                  className="form-control"
                  maxLength="20"
                  value={form.number}
                  onChange={(e) => update('number', e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label htmlFor="co-complement" className="form-label">Complemento</label>
                <input
                  id="co-complement"
                  type="text"
                  className="form-control"
                  maxLength="60"
                  value={form.complement}
                  onChange={(e) => update('complement', e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="co-district" className="form-label">Bairro</label>
                <input
                  id="co-district"
                  type="text"
                  className="form-control"
                  maxLength="120"
                  value={form.district}
                  onChange={(e) => update('district', e.target.value)}
                />
              </div>
              <div className="col-md-5">
                <label htmlFor="co-city" className="form-label">Cidade</label>
                <input
                  id="co-city"
                  type="text"
                  className="form-control"
                  maxLength="120"
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="co-state" className="form-label">UF</label>
                <input
                  id="co-state"
                  type="text"
                  className="form-control"
                  maxLength="2"
                  placeholder="SP"
                  value={form.state}
                  onChange={(e) => update('state', e.target.value.toUpperCase())}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-header fw-semibold small text-uppercase text-muted">
            Funcionamento
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-8">
                <label htmlFor="co-hours" className="form-label">Horário de funcionamento</label>
                <input
                  id="co-hours"
                  type="text"
                  className="form-control"
                  maxLength="255"
                  placeholder="Ex.: Seg a Sáb — 6h às 20h"
                  value={form.openingHours}
                  onChange={(e) => update('openingHours', e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="co-logo" className="form-label">URL do logo</label>
                <input
                  id="co-logo"
                  type="url"
                  className="form-control"
                  maxLength="500"
                  placeholder="https://..."
                  value={form.logoUrl}
                  onChange={(e) => update('logoUrl', e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="card-footer d-flex align-items-center justify-content-between flex-wrap gap-2">
            <span className="text-muted small">
              {company?.updatedAt
                ? `Última atualização em ${dateTimeFmt.format(new Date(company.updatedAt))}`
                : 'Cadastro ainda não salvo'}
            </span>
            <button type="submit" className="btn btn-primary" disabled={saving || !formValid}>
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
