import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useCreateCard } from '@/hooks/useCards';
import { useCustomer } from '@/hooks/useCustomers';
import { getBankPartnershipsByAffiliate, resolveAffiliateId } from '@/services/affiliateBankApi';
import { approvedBanksCacheKey, cacheApprovedBanks, readCachedBanks } from '@/lib/bankCache';
import { CARD_PRODUCTS, DELIVERY_METHODS, ID_TYPES, store } from '@/stores/mockStore';
import { ArrowLeft, ArrowRight, CircleDollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ReviewStep from '@/pages/customers/create-customer-steps/ReviewStep';

const CARD_TYPES = [
  { value: 'VIRTUAL', label: 'Virtual' },
  { value: 'PHYSICAL', label: 'Physical' },
] as const;

const BANK_LOGO_COLORS = ['#B82926', '#DC6B23', '#0027B6', '#DC0017', '#5C1E5C', '#0E7A46', '#0D4B8E'] as const;

type CachedBank = {
  bankId: string;
  bankName: string;
  bankCode: string;
  status: string;
};

type TypeTileProps = {
  type: (typeof CARD_TYPES)[number]['value'];
  current: string | null;
  onSelect: (type: string) => void;
  name: string;
  meta: string;
  icon: ReactNode;
};

function TypeTile({ type, current, onSelect, name, meta, icon }: TypeTileProps) {
  const isSelected = current === type;
  return (
    <label className={isSelected ? 'type-tile is-selected' : 'type-tile'} onClick={() => onSelect(type)}>
      <input type="radio" name="cardType" value={type} checked={isSelected} readOnly />
      <div className="type-tile-icon">{icon}</div>
      <div className="type-tile-name">{name}</div>
      <div className="type-tile-meta">{meta}</div>
    </label>
  );
}

export default function IssueCardPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const routeState = (location.state as { customer?: any; returnTo?: string } | null) || null;
  const routeCustomer = routeState?.customer || null;
  const returnTo = routeState?.returnTo || `/customers/${customerId}`;
  const { customer: fetchedCustomer, isLoading: customerLoading } = useCustomer(customerId);
  const customer = routeCustomer || fetchedCustomer;
  const { createCard, isLoading } = useCreateCard();
  const [allBanks, setAllBanks] = useState<CachedBank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [banksError, setBanksError] = useState<string | null>(null);

  const [cardForm, setCardForm] = useState({
    bankId: '',
    productId: '',
    cardType: '',
    currency: 'NGN',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bankSearch, setBankSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showAllBanks, setShowAllBanks] = useState(!cardForm.bankId);
  const [showAllProducts, setShowAllProducts] = useState(!cardForm.productId);
  const [step, setStep] = useState<'selection' | 'review'>('selection');

  useEffect(() => {
    let mounted = true;

    const loadBanks = async () => {
      setBanksLoading(true);
      setBanksError(null);

      try {
        const affiliateId = resolveAffiliateId(user);
        const cacheKey = approvedBanksCacheKey(affiliateId);

        const cached = readCachedBanks(cacheKey);
        if (cached.length > 0) {
          if (mounted) setAllBanks(cached);
          return;
        }

        const response = await getBankPartnershipsByAffiliate(affiliateId);
        const normalized = cacheApprovedBanks(affiliateId, response.banks || []);
        if (mounted) setAllBanks(normalized);
      } catch (e) {
        if (mounted) {
          setAllBanks([]);
          setBanksError(e instanceof Error ? e.message : 'Failed to load banks');
        }
      } finally {
        if (mounted) setBanksLoading(false);
      }
    };

    void loadBanks();
    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    setErrors({});
  }, [cardForm.bankId, cardForm.productId, cardForm.cardType]);

  const availableBanks = useMemo(
    () => allBanks.filter((bank) => bank.status === 'ACTIVE'),
    [allBanks]
  );

  const filteredBanks = useMemo(() => {
    const query = bankSearch.trim().toLowerCase();
    if (!query) return availableBanks;
    return availableBanks.filter((bank) => {
      const name = bank.bankName.toLowerCase();
      const code = (bank.bankCode || '').toLowerCase();
      return name.includes(query) || code.includes(query);
    });
  }, [availableBanks, bankSearch]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return CARD_PRODUCTS;
    return CARD_PRODUCTS.filter((product) => {
      return product.name.toLowerCase().includes(query) || product.code.toLowerCase().includes(query);
    });
  }, [productSearch]);

  const selectedBank = availableBanks.find((bank) => bank.bankId === cardForm.bankId);
  const selectedProduct = CARD_PRODUCTS.find((p) => p.id === cardForm.productId);
  const cardValid = !!(cardForm.bankId && cardForm.productId && cardForm.cardType);

  const setCard = (key: keyof typeof cardForm, value: string) => {
    setCardForm((prev) => {
      if (key === 'bankId') return { bankId: value, productId: '', cardType: '', currency: 'NGN' };
      if (key === 'productId') return { ...prev, productId: value, cardType: '', currency: value.toLowerCase().includes('usd') ? 'USD' : 'NGN' };
      return { ...prev, [key]: value };
    });
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!cardForm.bankId) next.bankId = 'Select a bank';
    if (!cardForm.productId) next.productId = 'Select a product';
    if (!cardForm.cardType) next.cardType = 'Select a card type';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!customerId || !customer) return;
    if (!validate()) return;

    const product = CARD_PRODUCTS.find((p) => p.id === cardForm.productId);
    const bank = availableBanks.find((b) => b.bankId === cardForm.bankId);
    if (!product || !bank) {
      toast.error('Select a valid card product and issuing bank.');
      return;
    }

    try {
      const fallbackEmail = `${customer.firstName.toLowerCase()}.${customer.lastName.toLowerCase()}@no-email.local`;
      const email = customer.email?.trim() || fallbackEmail;
      const phone = customer.phone?.trim() || '';
      const idType = customer.idType || ID_TYPES[0]?.id || 'nin';
      const idNumber = customer.idNumber || customer.customerId;
      const deliveryMethod = cardForm.cardType === 'PHYSICAL' ? DELIVERY_METHODS[0]?.code : undefined;

      const card = await createCard({
        customerId: customer.customerId,
        bankId: bank.bankId,
        issuingBankName: bank.bankName,
        productId: product.id,
        productType: cardForm.cardType,
        productName: product.name,
        productCode: product.code,
        currency: cardForm.currency,
        embossName: customer.embossName || `${customer.firstName} ${customer.lastName}`.toUpperCase(),
        deliveryMethod,
        customerIdentity: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          dob: customer.dateOfBirth || new Date().toISOString(),
          phone,
          email,
        },
        customerKyc: {
          idType,
          idNumber,
          kycLevel: 'LEVEL_2',
        },
      });

      store.addCMSAction({
        entityType: 'CARD',
        entityId: card.id,
        payload: {
          crt_emboss_name: customer.embossName || `${customer.firstName} ${customer.lastName}`.toUpperCase(),
          crt_code_product: product.code,
          product_type: cardForm.cardType,
          enr_mail: email,
          mobile_num: phone,
          Type_Papier: idType,
          ID_Papier: idNumber,
        },
      });

      toast.success('Card issued successfully.');
      navigate(`/customers/${customerId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Card issuance failed');
    }
  };

  if (customerLoading && !routeCustomer) {
    return (
      <ProtectedRoute requiredStakeholderTypes={['AFFILIATE', 'SERVICE_PROVIDER']}>
        <AppLayout>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE', 'SERVICE_PROVIDER']}>
      <AppLayout>
        {step === 'review' ? (
          <ReviewStep
            fullName={customer?.fullName || `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim()}
            phone={customer?.phone || '-'}
            email={customer?.email || ''}
            state={customer?.address?.state || '-'}
            bvn={customer?.idNumber || '-'}
            customerId={customer?.customerRefId || customer?.customerId || customerId}
            bankName={selectedBank?.bankName || '-'}
            bankCode={selectedBank?.bankCode || '-'}
            productName={selectedProduct?.name || '-'}
            productCode={selectedProduct?.code || '-'}
            cardType={cardForm.cardType}
            currency={cardForm.currency}
            busy={isLoading}
            onBack={() => setStep('selection')}
            onEditCustomer={() => navigate(returnTo)}
            onEditCard={() => setStep('selection')}
            onIssue={handleSubmit}
          />
        ) : (
          <main className="scr-main">
            <div className="container">
            <header className="page-head">
              <div>
                <h1 className="page-title">Choose a card</h1>
                <p className="page-sub">Select bank, product, and card type for card issuance.</p>
              </div>
            </header>

            <section className="card card-pad-lg">
              <div className="form-section-head">
                <h2 className="form-section-title">Issuing bank</h2>
              </div>
              {!showAllBanks && selectedBank ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label className="option-card is-selected">
                    <input type="radio" name="bank" value={selectedBank.bankId} checked readOnly />
                    <span className="check" />
                    <div className="option-head">
                      <div className="option-logo" style={{ background: BANK_LOGO_COLORS[0], color: 'var(--cs-white)' }}>
                        {selectedBank.bankName.split(' ')[0].slice(0, 4).toUpperCase()}
                      </div>
                      <div>
                        <div className="option-name">{selectedBank.bankName}</div>
                        <div className="option-meta">CBN: {selectedBank.bankCode || '-'}</div>
                      </div>
                    </div>
                  </label>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAllBanks(true)}>
                    Change bank
                  </button>
                </div>
              ) : (
                <>
                  <div className="field" style={{ marginTop: 10, marginBottom: 10 }}>
                    <input
                      className="bch-input"
                      placeholder="Search bank name or code"
                      value={bankSearch}
                      onChange={(e) => setBankSearch(e.target.value)}
                    />
                  </div>
                  <div className="option-grid">
                    {banksLoading ? (
                      Array.from({ length: 4 }).map((_, idx) => <div key={idx} className="option-card" style={{ minHeight: 88, opacity: 0.5 }} />)
                    ) : (
                      filteredBanks.map((bank, idx) => {
                        const isSelected = cardForm.bankId === bank.bankId;
                        const logoColor = BANK_LOGO_COLORS[idx % BANK_LOGO_COLORS.length];
                        return (
                          <label
                            key={bank.bankId}
                            className={isSelected ? 'option-card is-selected' : 'option-card'}
                            onClick={() => {
                              setCard('bankId', bank.bankId);
                              setShowAllBanks(false);
                            }}
                          >
                            <input type="radio" name="bank" value={bank.bankId} checked={isSelected} readOnly />
                            <span className="check" />
                            <div className="option-head">
                              <div className="option-logo" style={{ background: logoColor, color: 'var(--cs-white)' }}>
                                {bank.bankName.split(' ')[0].slice(0, 4).toUpperCase()}
                              </div>
                              <div>
                                <div className="option-name">{bank.bankName}</div>
                                <div className="option-meta">CBN: {bank.bankCode || '-'}</div>
                              </div>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </>
              )}
              {errors.bankId && <p className="text-xs text-destructive" style={{ marginTop: 8 }}>{errors.bankId}</p>}
              {banksError && <p className="text-xs text-destructive" style={{ marginTop: 8 }}>{banksError}</p>}
            </section>

            {cardForm.bankId && (
              <section className="card card-pad-lg" style={{ marginTop: 18 }}>
                <div className="form-section-head">
                  <h2 className="form-section-title">Product</h2>
                  <span className="form-section-meta">Pick a product variant</span>
                </div>
                {!showAllProducts && selectedProduct ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label className="product-card is-selected">
                      <input type="radio" name="product" value={selectedProduct.id} checked readOnly />
                      <div className={`product-chip ${selectedProduct.code.toLowerCase().includes('usd') ? 'usd' : 'standard'}`}>
                        {selectedProduct.code.toUpperCase().includes('USD') ? 'USD' : 'NGN'}
                      </div>
                      <div className="product-info">
                        <div className="product-name">{selectedProduct.name}</div>
                        <div className="product-meta">Code: {selectedProduct.code}</div>
                        <div className="product-fee">Configured fee/profile applies</div>
                      </div>
                      <span className="check" />
                    </label>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAllProducts(true)}>
                      Change product
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input
                      className="bch-input"
                      placeholder="Search product name or code"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                    {filteredProducts.map((p) => {
                      const isSelected = cardForm.productId === p.id;
                      const style = p.code.toLowerCase().includes('usd')
                        ? 'usd'
                        : p.code.toLowerCase().includes('plat')
                          ? 'platinum'
                          : p.code.toLowerCase().includes('gold')
                            ? 'gold'
                            : 'standard';
                      return (
                        <label
                          key={p.id}
                          className={isSelected ? 'product-card is-selected' : 'product-card'}
                          onClick={() => {
                            setCard('productId', p.id);
                            setShowAllProducts(false);
                          }}
                        >
                          <input type="radio" name="product" value={p.id} checked={isSelected} readOnly />
                          <div className={`product-chip ${style}`}>{p.code.toUpperCase().includes('USD') ? 'USD' : 'NGN'}</div>
                          <div className="product-info">
                            <div className="product-name">{p.name}</div>
                            <div className="product-meta">Code: {p.code}</div>
                            <div className="product-fee">Configured fee/profile applies</div>
                          </div>
                          <span className="check" />
                        </label>
                      );
                    })}
                  </div>
                )}
                {errors.productId && <p className="text-xs text-destructive" style={{ marginTop: 8 }}>{errors.productId}</p>}
              </section>
            )}

            {cardForm.productId && selectedProduct && (
              <section className="card card-pad-lg" style={{ marginTop: 18 }}>
                <div className="form-section-head">
                  <h2 className="form-section-title">Card type</h2>
                  <span className="form-section-meta">Virtual issues immediately; physical goes to bureau</span>
                </div>
                <div className="type-toggle">
                  <TypeTile
                    type="VIRTUAL"
                    current={cardForm.cardType || null}
                    onSelect={(type) => setCard('cardType', type)}
                    name="Virtual"
                    meta="Issued immediately. PAN, expiry, and CVV return in API response."
                    icon={(
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                    )}
                  />
                  <TypeTile
                    type="PHYSICAL"
                    current={cardForm.cardType || null}
                    onSelect={(type) => setCard('cardType', type)}
                    name="Physical"
                    meta="Sent to personalization bureau and fulfilled after processing."
                    icon={(
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <line x1="6" y1="14" x2="10" y2="14" /><line x1="6" y1="17" x2="8" y2="17" />
                      </svg>
                    )}
                  />
                </div>
                <div style={{ marginTop: 18 }}>
                  <span className="currency-pill">
                    <CircleDollarSign />
                    Currency: <span className="strong">{selectedProduct.code.toUpperCase().includes('USD') ? 'USD' : cardForm.currency || 'NGN'}</span> · auto-derived from product
                  </span>
                </div>
                {errors.cardType && <p className="text-xs text-destructive" style={{ marginTop: 8 }}>{errors.cardType}</p>}
              </section>
            )}

            <div className="form-foot">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate(returnTo)}>
                <ArrowLeft /> Back
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (!validate()) return;
                  setStep('review');
                }}
                disabled={!cardValid || isLoading}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            </div>
          </main>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}
