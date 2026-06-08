import React, { useState, useRef, useEffect } from 'react';
import './MultiSelect.css';

const MultiSelect = ({ options, value, onChange, disabled, placeholder = '请选择' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = value
    ? value.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const selectedLabels = selected
    .map(code => options.find(o => o.code === code))
    .filter(Boolean);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = (code) => {
    const next = selected.includes(code)
      ? selected.filter(c => c !== code)
      : [...selected, code];
    onChange(next.join(','));
  };

  const remove = (code) => {
    onChange(selected.filter(c => c !== code).join(','));
  };

  return (
    <div className={`multiselect ${disabled ? 'disabled' : ''}`} ref={ref}>
      <div className="ms-trigger" onClick={() => !disabled && setOpen(!open)}>
        {selectedLabels.length === 0 ? (
          <span className="ms-placeholder">{placeholder}</span>
        ) : (
          <div className="ms-tags">
            {selectedLabels.map(o => (
              <span key={o.code} className="ms-tag">
                {o.name}
                <button type="button" className="ms-tag-remove"
                  onClick={e => { e.stopPropagation(); remove(o.code); }}
                  disabled={disabled}>×</button>
              </span>
            ))}
          </div>
        )}
        <span className={`ms-arrow ${open ? 'open' : ''}`}>▾</span>
      </div>
      {open && (
        <div className="ms-dropdown">
          {options.map(o => (
            <label key={o.code} className="ms-option">
              <input type="checkbox" checked={selected.includes(o.code)}
                onChange={() => toggle(o.code)} disabled={disabled} />
              <span>{o.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
