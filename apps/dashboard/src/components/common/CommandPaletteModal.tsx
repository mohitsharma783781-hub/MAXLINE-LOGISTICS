import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Package,
  Building2,
  Receipt,
  Scale,
  PlusCircle,
  FileSpreadsheet,
  Calculator,
  Wallet,
  Smartphone,
  Bell,
  ArrowRight,
  Clock,
  Trash2,
  CornerDownLeft,
  ChevronUp,
  ChevronDown,
  Truck,
  MapPin,
  ExternalLink,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import {
  GlobalSearchEngineService,
  type SearchResultItem,
  type SearchResponse,
} from '../../services/globalSearchEngineService';

export interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  portalName?: string;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  portalName = 'Customer Portal',
}) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const role = portalName.toLowerCase().includes('admin') ? 'ADMIN' : 'CUSTOMER';
  const tenantId = 'tenant-demo-01';

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Recent Searches State
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    GlobalSearchEngineService.getRecentSearches()
  );

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Execute Search
  const searchResponse: SearchResponse = useMemo(() => {
    return GlobalSearchEngineService.search({
      query,
      role,
      tenantId,
    });
  }, [query, role, tenantId]);

  const resultsList = searchResponse.flatResults;

  // Auto-Sense Detection: AWB Query
  const isAwbQuery = useMemo(() => {
    const trimmed = query.trim();
    return (
      (trimmed.length >= 8 && /^\d+$/.test(trimmed)) ||
      /^(del|ekt|mov|sfx|blu|dtdc|exp|awb)/i.test(trimmed)
    );
  }, [query]);

  // Auto-Sense Detection: 6-Digit Indian Pincode
  const isPincodeQuery = useMemo(() => {
    return /^\d{6}$/.test(query.trim());
  }, [query]);

  // Handle Result Select & Navigation
  const handleSelectResult = (item: SearchResultItem) => {
    if (query.trim()) {
      GlobalSearchEngineService.addRecentSearch('current-user', query);
      setRecentSearches(GlobalSearchEngineService.getRecentSearches());
    }
    onClose();
    navigate(item.route);
  };

  const handleSelectRecentSearch = (qText: string) => {
    setQuery(qText);
  };

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    GlobalSearchEngineService.clearRecentSearches();
    setRecentSearches([]);
  };

  // Keyboard Shortcuts Handler (Arrow Up/Down, Enter, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (resultsList.length > 0 ? (prev + 1) % resultsList.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (resultsList.length > 0 ? (prev - 1 + resultsList.length) % resultsList.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (resultsList.length > 0 && resultsList[selectedIndex]) {
          handleSelectResult(resultsList[selectedIndex]);
        } else if (isAwbQuery) {
          onClose();
          navigate(`/app/tracking/${query.trim()}`);
        } else if (isPincodeQuery) {
          onClose();
          navigate('/app/rates');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, resultsList, selectedIndex, isAwbQuery, isPincodeQuery, query]);

  // Icon Helper Map
  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Package':
        return <Package size={16} style={{ color: '#2563eb' }} />;
      case 'Building2':
        return <Building2 size={16} style={{ color: '#2563eb' }} />;
      case 'Receipt':
        return <Receipt size={16} style={{ color: '#2563eb' }} />;
      case 'Scale':
        return <Scale size={16} style={{ color: '#2563eb' }} />;
      case 'PlusCircle':
        return <PlusCircle size={16} style={{ color: '#2563eb' }} />;
      case 'FileSpreadsheet':
        return <FileSpreadsheet size={16} style={{ color: '#2563eb' }} />;
      case 'Calculator':
        return <Calculator size={16} style={{ color: '#2563eb' }} />;
      case 'Wallet':
        return <Wallet size={16} style={{ color: '#2563eb' }} />;
      case 'Smartphone':
        return <Smartphone size={16} style={{ color: '#2563eb' }} />;
      case 'Bell':
        return <Bell size={16} style={{ color: '#2563eb' }} />;
      default:
        return <Search size={16} style={{ color: '#2563eb' }} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '60px',
        paddingLeft: '16px',
        paddingRight: '16px',
      }}
    >
      {/* Command Palette Card Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '680px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(148, 163, 184, 0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
        }}
      >
        {/* Logistics Flight-Control HUD Top Banner */}
        <div
          style={{
            backgroundColor: '#0f172a',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1e293b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              MAXLINE Flight-Control HUD
            </span>
            <span style={{ fontSize: '10px', color: '#64748b' }}>&bull; {portalName}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={12} color="#38bdf8" />
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>
              Live Carrier Network: <strong style={{ color: '#38bdf8' }}>Online</strong>
            </span>
          </div>
        </div>

        {/* Search Input Box */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #f1f5f9',
            gap: '12px',
            backgroundColor: '#ffffff',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb',
            }}
          >
            <Search size={18} />
          </div>

          <input
            ref={inputRef}
            type="text"
            placeholder={
              role === 'ADMIN'
                ? 'Type AWB, Pincode, Customer, Rate Card, or Page...'
                : 'Type AWB to track, 6-digit Pincode to check, or search anything...'
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              fontWeight: 500,
              color: '#0f172a',
              backgroundColor: 'transparent',
            }}
          />

          <kbd
            style={{
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '3px 7px',
              fontSize: '10px',
              fontWeight: 700,
            }}
          >
            ESC
          </kbd>

          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Results / Auto-Sense Container */}
        <div style={{ padding: '14px 18px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* AUTO-SENSE 1: AWB TELEMETRY LIVE CARD */}
          {isAwbQuery && (
            <div
              style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Truck size={16} color="#0284c7" />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Auto-Detected AWB Telemetry
                  </span>
                </div>
                <Badge variant="brand" style={{ fontSize: '10px' }}>Active Parcel Route</Badge>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>
                    AWB: {query.trim().toUpperCase()}
                  </strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Carrier: Delhivery Express Air &bull; Status: <strong style={{ color: '#0284c7' }}>IN_TRANSIT (Hub Scan)</strong>
                  </span>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    navigate(`/app/tracking/${query.trim()}`);
                  }}
                  style={{
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                  }}
                >
                  <span>Track Full Route</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* AUTO-SENSE 2: PINCODE LOGISTICS SERVICEABILITY CARD */}
          {isPincodeQuery && (
            <div
              style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} color="#16a34a" />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Pincode Logistics Serviceability
                  </span>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#16a34a', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '12px' }}>
                  100% Serviceable
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>
                    Pincode: {query.trim()} (Commercial Hub)
                  </strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Couriers: Delhivery, Ekart, Movin &bull; COD & Prepaid Active
                  </span>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    navigate('/app/rates');
                  }}
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
                  }}
                >
                  <span>Check Courier Rates</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* WHEN QUERY IS EMPTY: SHOW RECENT SEARCHES & QUICK ACTIONS */}
          {!query.trim() && (
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} /> Recent Searches
                    </span>
                    <button onClick={handleClearHistory} style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Trash2 size={12} /> Clear History
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {recentSearches.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectRecentSearch(item)}
                        style={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '5px 12px',
                          fontSize: '12px',
                          color: '#334155',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Search size={11} style={{ color: '#94a3b8' }} />
                        <span>{item}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Shortcuts */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', padding: '0 4px' }}>
                  Recommended Shortcuts
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {resultsList.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectResult(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                          borderLeft: isSelected ? '3px solid #2563eb' : '3px solid transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.1s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: isSelected ? '#dbeafe' : '#f1f5f9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {renderIcon(item.iconName)}
                          </div>
                          <div>
                            <strong style={{ fontSize: '13px', display: 'block', color: '#0f172a' }}>{item.title}</strong>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>{item.subtitle}</span>
                          </div>
                        </div>
                        <ArrowRight size={14} style={{ color: isSelected ? '#2563eb' : '#cbd5e1' }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* WHEN QUERY HAS TEXT: SHOW CATEGORIZED SEARCH RESULTS */}
          {query.trim() && (
            <>
              {resultsList.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {resultsList.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectResult(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                          borderLeft: isSelected ? '3px solid #2563eb' : '3px solid transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.1s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: isSelected ? '#dbeafe' : '#f8fafc',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {renderIcon(item.iconName)}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ fontSize: '13px', color: '#0f172a' }}>{item.title}</strong>
                              {item.score === 100 && (
                                <span style={{ fontSize: '9px', fontWeight: 700, color: '#2563eb', backgroundColor: '#dbeafe', padding: '1px 5px', borderRadius: '4px' }}>
                                  EXACT MATCH
                                </span>
                              )}
                              {item.statusLabel && (
                                <Badge variant={item.statusVariant || 'neutral'} style={{ fontSize: '10px' }}>
                                  {item.statusLabel}
                                </Badge>
                              )}
                            </div>
                            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.subtitle}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>
                            {item.categoryLabel}
                          </span>
                          <CornerDownLeft size={14} style={{ color: isSelected ? '#2563eb' : '#cbd5e1' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* EMPTY NO RESULTS STATE */
                <div style={{ textAlign: 'center', padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Search size={32} style={{ color: '#cbd5e1' }} />
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>No results found for "{query}"</strong>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                    Try searching by AWB number, 6-digit pincode, Order ID, or feature name.
                  </p>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button onClick={() => setQuery('Rate Calculator')} style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                      Try "Rate Calculator"
                    </button>
                    <button onClick={() => setQuery('110001')} style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                      Try Pincode "110001"
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div style={{ backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '10px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <kbd style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '1px 5px', borderRadius: '4px' }}><ChevronUp size={11} /><ChevronDown size={11} /></kbd> Navigate
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <kbd style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '1px 5px', borderRadius: '4px' }}><CornerDownLeft size={11} /></kbd> Select
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={12} color="#10b981" />
            <span>MAXLINE Intelligent Courier Telemetry</span>
          </div>
        </div>
      </div>
    </div>
  );
};
