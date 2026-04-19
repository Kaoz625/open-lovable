'use client';

import { useState, useEffect, useRef } from 'react';

export interface ElementProps {
  tag: string;
  classes: string;
  text: string;
  hint: string | null;
  styles: {
    fontSize: string;
    fontFamily: string;
    fontWeight: string;
    color: string;
    backgroundColor: string;
    textAlign: string;
    letterSpacing: string;
    lineHeight: string;
    borderRadius: string;
    maxWidth: string;
    minHeight: string;
    marginTop: string;
    marginRight: string;
    marginBottom: string;
    marginLeft: string;
    paddingTop: string;
    paddingRight: string;
    paddingBottom: string;
    paddingLeft: string;
  };
  specific?: {
    src?: string;
    alt?: string;
    href?: string;
    target?: string;
    text?: string;
    poster?: string;
    value?: string;
    placeholder?: string;
  };
}

interface Props {
  element: ElementProps;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  onApplyToCode: (prompt: string) => void;
  onClose: () => void;
}

function pxNum(v: string) { return parseInt(v, 10) || 0; }

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-700/60">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-200 transition-colors"
      >
        <span>{title}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>
          <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide block mb-1">{children}</span>;
}

function SpinnerInput({ label, value, unit = 'px', onChange }: {
  label: string; value: string; unit?: string; onChange: (v: string) => void;
}) {
  const num = pxNum(value);
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center bg-gray-700/70 border border-gray-600/50 rounded-md h-8 px-2 gap-1 focus-within:border-indigo-500/60 transition-colors">
        <input
          type="number"
          value={num}
          onChange={e => onChange(e.target.value + unit)}
          className="w-full bg-transparent text-xs text-white outline-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-gray-500 text-[10px] shrink-0">{unit}</span>
        <div className="flex flex-col shrink-0">
          <button onClick={() => onChange((num + 1) + unit)} className="text-gray-500 hover:text-white leading-none text-[9px] h-3.5 flex items-center">▲</button>
          <button onClick={() => onChange((num - 1) + unit)} className="text-gray-500 hover:text-white leading-none text-[9px] h-3.5 flex items-center">▼</button>
        </div>
      </div>
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2 bg-gray-700/70 border border-gray-600/50 rounded-md h-8 px-2 focus-within:border-indigo-500/60 transition-colors">
        <div className="relative shrink-0">
          <input
            type="color"
            value={value === 'transparent' ? '#ffffff' : (value?.startsWith('#') ? value : '#ffffff')}
            onChange={e => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div
            className="w-5 h-5 rounded border border-gray-600"
            style={{ background: value === 'transparent' ? 'repeating-conic-gradient(#666 0% 25%, #444 0% 50%) 0 0 / 8px 8px' : value }}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 bg-transparent text-xs text-white outline-none font-mono min-w-0"
        />
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder, fullWidth }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <Label>{label}</Label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-700/70 border border-gray-600/50 rounded-md h-8 px-2 text-xs text-white outline-none focus:border-indigo-500/60 transition-colors placeholder:text-gray-600"
      />
    </div>
  );
}

function SelectInput({ label, value, options, onChange, fullWidth }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void; fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <Label>{label}</Label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-gray-700/70 border border-gray-600/50 rounded-md h-8 px-2 text-xs text-white outline-none focus:border-indigo-500/60 transition-colors appearance-none cursor-pointer"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function BoxModel({
  topLabel, rightLabel, bottomLabel, leftLabel,
  topValue, rightValue, bottomValue, leftValue,
  onTopChange, onRightChange, onBottomChange, onLeftChange
}: {
  topLabel: string; rightLabel: string; bottomLabel: string; leftLabel: string;
  topValue: string; rightValue: string; bottomValue: string; leftValue: string;
  onTopChange: (v: string) => void; onRightChange: (v: string) => void;
  onBottomChange: (v: string) => void; onLeftChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <SpinnerInput label={topLabel} value={topValue} onChange={onTopChange} />
      <SpinnerInput label={rightLabel} value={rightValue} onChange={onRightChange} />
      <SpinnerInput label={bottomLabel} value={bottomValue} onChange={onBottomChange} />
      <SpinnerInput label={leftLabel} value={leftValue} onChange={onLeftChange} />
    </div>
  );
}

export function PropertiesPanel({ element, iframeRef, onApplyToCode, onClose }: Props) {
  const [styles, setStyles] = useState({ ...element.styles });
  const [specific, setSpecific] = useState({ ...element.specific });
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setStyles({ ...element.styles });
    setSpecific({ ...element.specific });
  }, [element]);

  function applyStyle(patch: Partial<typeof styles>) {
    const next = { ...styles, ...patch };
    setStyles(next);
    if (pendingRef.current) clearTimeout(pendingRef.current);
    pendingRef.current = setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage({
        type: 'inspector:apply-style',
        styles: {
          fontSize:        next.fontSize,
          fontFamily:      next.fontFamily,
          fontWeight:      next.fontWeight,
          color:           next.color,
          backgroundColor: next.backgroundColor === 'transparent' ? '' : next.backgroundColor,
          textAlign:       next.textAlign,
          letterSpacing:   next.letterSpacing,
          lineHeight:      next.lineHeight,
          borderRadius:    next.borderRadius,
          marginTop:       next.marginTop,
          marginRight:     next.marginRight,
          marginBottom:    next.marginBottom,
          marginLeft:      next.marginLeft,
          paddingTop:      next.paddingTop,
          paddingRight:    next.paddingRight,
          paddingBottom:   next.paddingBottom,
          paddingLeft:     next.paddingLeft,
        }
      }, '*');
    }, 80);
  }

  function applySrc(src: string) {
    setSpecific(prev => ({ ...prev, src }));
    iframeRef.current?.contentWindow?.postMessage({ type: 'inspector:apply-src', src }, '*');
  }

  function applyHref(href: string, target?: string) {
    setSpecific(prev => ({ ...prev, href, target: target ?? prev?.target ?? '_self' }));
    iframeRef.current?.contentWindow?.postMessage({ type: 'inspector:apply-href', href, target: target ?? specific?.target ?? '_self' }, '*');
  }

  function applyText(text: string) {
    setSpecific(prev => ({ ...prev, text }));
    iframeRef.current?.contentWindow?.postMessage({ type: 'inspector:apply-text', text }, '*');
  }

  function buildAIPrompt() {
    const label = element.hint ? `"${element.hint}"` : `<${element.tag}>`;
    const parts: string[] = [`Update the ${label} element:`];

    if (element.tag === 'img' && specific?.src !== element.specific?.src) {
      parts.push(`- Change image src to: ${specific?.src}`);
      if (specific?.alt !== element.specific?.alt) parts.push(`- Change alt text to: "${specific?.alt}"`);
    }
    if (element.tag === 'a') {
      if (specific?.href !== element.specific?.href) parts.push(`- Change link href to: ${specific?.href}`);
      if (specific?.target !== element.specific?.target) parts.push(`- Change link target to: ${specific?.target}`);
    }
    if (element.tag === 'video' && specific?.src !== element.specific?.src) {
      parts.push(`- Change video src to: ${specific?.src}`);
    }

    const styleChanges: string[] = [];
    const s = styles, o = element.styles;
    if (s.color !== o.color) styleChanges.push(`color: ${s.color}`);
    if (s.backgroundColor !== o.backgroundColor) styleChanges.push(`background-color: ${s.backgroundColor}`);
    if (s.fontSize !== o.fontSize) styleChanges.push(`font-size: ${s.fontSize}`);
    if (s.fontFamily !== o.fontFamily) styleChanges.push(`font-family: ${s.fontFamily}`);
    if (s.fontWeight !== o.fontWeight) styleChanges.push(`font-weight: ${s.fontWeight}`);
    if (s.textAlign !== o.textAlign) styleChanges.push(`text-align: ${s.textAlign}`);
    if (s.letterSpacing !== o.letterSpacing) styleChanges.push(`letter-spacing: ${s.letterSpacing}`);
    if (s.borderRadius !== o.borderRadius) styleChanges.push(`border-radius: ${s.borderRadius}`);
    if (s.marginTop !== o.marginTop || s.marginRight !== o.marginRight || s.marginBottom !== o.marginBottom || s.marginLeft !== o.marginLeft) {
      styleChanges.push(`margin: ${s.marginTop} ${s.marginRight} ${s.marginBottom} ${s.marginLeft}`);
    }
    if (s.paddingTop !== o.paddingTop || s.paddingRight !== o.paddingRight || s.paddingBottom !== o.paddingBottom || s.paddingLeft !== o.paddingLeft) {
      styleChanges.push(`padding: ${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`);
    }
    if (styleChanges.length > 0) parts.push('- Apply these styles: ' + styleChanges.join(', '));
    if (parts.length === 1) return `Edit the ${label} element: `;
    return parts.join('\n');
  }

  const tag = element.tag;
  const isImg = tag === 'img';
  const isLink = tag === 'a';
  const isVideo = tag === 'video' || tag === 'iframe';

  return (
    <div className="absolute top-0 right-0 w-72 h-full bg-[#1a1a1f] border-l border-gray-700/60 flex flex-col z-20 overflow-hidden text-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/60 flex-shrink-0 bg-[#1a1a1f]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
          <span className="text-xs font-semibold text-gray-200 truncate">
            {element.hint || `<${tag}>`}
          </span>
          <span className="text-[10px] text-gray-500 font-mono shrink-0">&lt;{tag}&gt;</span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors ml-2 shrink-0">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">

        {/* Element-specific: Image */}
        {isImg && (
          <Section title="Image">
            <TextInput label="Source URL" value={specific?.src || ''} onChange={applySrc} placeholder="https://..." fullWidth />
            <TextInput label="Alt text" value={specific?.alt || ''} onChange={v => setSpecific(p => ({ ...p, alt: v }))} fullWidth />
            {specific?.src && (
              <img src={specific.src} alt="preview" className="w-full h-24 object-cover rounded-md border border-gray-700 mt-1" onError={e => (e.currentTarget.style.display = 'none')} />
            )}
          </Section>
        )}

        {/* Element-specific: Link */}
        {isLink && (
          <Section title="Link">
            <TextInput label="URL" value={specific?.href || ''} onChange={v => applyHref(v, specific?.target)} placeholder="https://..." fullWidth />
            <Row>
              <SelectInput label="Target" value={specific?.target || '_self'} options={['_self', '_blank', '_parent', '_top']} onChange={v => applyHref(specific?.href || '', v)} />
              <TextInput label="Link text" value={specific?.text || ''} onChange={applyText} />
            </Row>
          </Section>
        )}

        {/* Element-specific: Video/Embed */}
        {isVideo && (
          <Section title={tag === 'video' ? 'Video' : 'Embed'}>
            <TextInput label="Source URL" value={specific?.src || ''} onChange={applySrc} placeholder="https://..." fullWidth />
            {tag === 'video' && (
              <TextInput label="Poster image" value={specific?.poster || ''} onChange={v => setSpecific(p => ({ ...p, poster: v }))} placeholder="https://..." fullWidth />
            )}
          </Section>
        )}

        {/* Typography */}
        <Section title="Typography">
          <SelectInput
            label="Font Family"
            value={styles.fontFamily}
            options={['Arial','Georgia','Helvetica','Inter','Lato','Montserrat','Open Sans','Oswald','Playfair Display','Roboto','system-ui','Times New Roman','Verdana']}
            onChange={v => applyStyle({ fontFamily: v })}
            fullWidth
          />
          <Row>
            <SpinnerInput label="Font Size" value={styles.fontSize} onChange={v => applyStyle({ fontSize: v })} />
            <SelectInput label="Weight" value={styles.fontWeight} options={['100','200','300','400','500','600','700','800','900','normal','bold']} onChange={v => applyStyle({ fontWeight: v })} />
          </Row>
          <Row>
            <SelectInput label="Align" value={styles.textAlign} options={['left','center','right','justify']} onChange={v => applyStyle({ textAlign: v })} />
            <TextInput label="Line Height" value={styles.lineHeight} onChange={v => applyStyle({ lineHeight: v })} />
          </Row>
          <TextInput label="Letter Spacing" value={styles.letterSpacing} onChange={v => applyStyle({ letterSpacing: v })} fullWidth />
        </Section>

        {/* Colors */}
        <Section title="Colors">
          <ColorInput label="Text Color" value={styles.color} onChange={v => applyStyle({ color: v })} />
          <ColorInput label="Background" value={styles.backgroundColor} onChange={v => applyStyle({ backgroundColor: v })} />
        </Section>

        {/* Size */}
        <Section title="Size" defaultOpen={false}>
          <Row>
            <TextInput label="Max Width" value={styles.maxWidth} onChange={v => applyStyle({ maxWidth: v })} placeholder="auto" />
            <TextInput label="Min Height" value={styles.minHeight} onChange={v => applyStyle({ minHeight: v })} placeholder="auto" />
          </Row>
          <TextInput label="Border Radius" value={styles.borderRadius} onChange={v => applyStyle({ borderRadius: v })} fullWidth />
        </Section>

        {/* Spacing */}
        <Section title="Margin" defaultOpen={false}>
          <BoxModel
            topLabel="Top" rightLabel="Right" bottomLabel="Bottom" leftLabel="Left"
            topValue={styles.marginTop} rightValue={styles.marginRight}
            bottomValue={styles.marginBottom} leftValue={styles.marginLeft}
            onTopChange={v => applyStyle({ marginTop: v })}
            onRightChange={v => applyStyle({ marginRight: v })}
            onBottomChange={v => applyStyle({ marginBottom: v })}
            onLeftChange={v => applyStyle({ marginLeft: v })}
          />
        </Section>

        <Section title="Padding" defaultOpen={false}>
          <BoxModel
            topLabel="Top" rightLabel="Right" bottomLabel="Bottom" leftLabel="Left"
            topValue={styles.paddingTop} rightValue={styles.paddingRight}
            bottomValue={styles.paddingBottom} leftValue={styles.paddingLeft}
            onTopChange={v => applyStyle({ paddingTop: v })}
            onRightChange={v => applyStyle({ paddingRight: v })}
            onBottomChange={v => applyStyle({ paddingBottom: v })}
            onLeftChange={v => applyStyle({ paddingLeft: v })}
          />
        </Section>
      </div>

      {/* Apply to Code — sticky footer */}
      <div className="flex-shrink-0 p-4 bg-[#1a1a1f] border-t border-gray-700/60">
        <button
          onClick={() => onApplyToCode(buildAIPrompt())}
          className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors"
        >
          Apply to Code
        </button>
        <p className="text-[10px] text-gray-600 text-center mt-1.5">Saves changes permanently via AI</p>
      </div>
    </div>
  );
}
